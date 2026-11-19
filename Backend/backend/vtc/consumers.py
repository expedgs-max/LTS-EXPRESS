from channels.generic.websocket import AsyncWebsocketConsumer
from employer.models import CustomUser, Partenneur, Coursa
from asgiref.sync import sync_to_async
import json
from decimal import Decimal
from django.utils.timezone import now
from decimal import Decimal, InvalidOperation
from channels.db import database_sync_to_async
from employer.serializer import *
from vtc.serializer import RideTrackingSerializer
from django.utils import timezone
from django.db.models import F, FloatField, ExpressionWrapper
from django.db.models.functions import Sqrt, Power
from math import radians, sin, cos, sqrt, atan2

def safe_decimal(value, max_digits=9, decimal_places=6):
    try:
        if value is None or value == '':
            return None  # or return Decimal('0.0') if you prefer a default value

        decimal_value = Decimal(value)
        decimal_value = decimal_value.quantize(
            Decimal('1').scaleb(-decimal_places)
        )
        return decimal_value
    except (InvalidOperation, TypeError) as e:
        return None  # or raise ValueError("Invalid decimal value")
class ClientConsumer(AsyncWebsocketConsumer):
    
    
    @sync_to_async
    def get_coursa_for_annule(self, cousa_id):
        try:
            if cousa_id and int(cousa_id) > 0:
                coursa = Coursa.objects.filter(id=int(cousa_id)).first()
                if coursa:
                    coursa.etat = "annulee"
                    coursa.save()
                    return coursa
            # Fallback to client's latest non-cancelled coursa
            coursa = Coursa.objects.filter(client_id=self.client_id).exclude(etat__in=['annulee', 'terminee']).last()
            if coursa:
                coursa.etat = "annulee"
                coursa.save()
                return coursa
            return None
        except Exception as e:
            print(f"Error in get_coursa_for_annule: {e}")
            return None 
    async def connect(self):
        #self.user_request=self.scope['user']
        self.wilaya = self.scope["user"].wilaya_code
        self.client_id = self.scope['user'].id

        
        self.group_name = f"client_{self.client_id}"

        # Add the client to a unique group based on client ID
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Prompt client for ride information
        await self.send(text_data=json.dumps({
            'type': 'location_prompt',
            'message': 'Please enter your aller (departure) and arriver (arrival) locations.'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
    async def get_client_info(self) :
        return await CustomUser.objects.get(id=self.client_id)

    async def receive(self, text_data):
        data = json.loads(text_data)

        if data['type'] == 'ride_request':
            ride_request_data = data['ride_data']
            type=data['type']
            km=data.get("km")
            prix=data.get("prix")
            type_veh=data["type_vihucule"]
            seats=data.get("seats")
            whom_the_trip_for=data.get("whom_the_trip_for")
            duration=data.get("duration")
            depart = ride_request_data.get('depart', {})
            arrive = ride_request_data.get('arrive', {})
            location_data = {
            'depart': {
                'region': depart.get('region', ''),
                'location': depart.get('location', '')
            },
            'arrive': {
                'region': arrive.get('region', ''),
                'location': arrive.get('location', '')
            }
        }
            
            

            # Check if both pickup_location and dropoff_location are provided
            if ('pickup_location_lat' in ride_request_data and 
                'pickup_location_long' in ride_request_data and 
                "dropoff_location_lat" in ride_request_data and 
                "dropoff_location_long" in ride_request_data):
                corsa = await self.create_coursa_client(
                    self.client_id,
                    ride_data=ride_request_data,
                    duration=duration,
                    km=km,
                    prix=prix,
                    seats=seats,
                    type_coursa=type_veh,
                    wilaya=self.scope["user"].wilaya,
                )
                if corsa:
                    # Notify the client that the ride (cousra) has been created
                    await self.send(text_data=json.dumps({
                        'type': 'ride_created',
                        'coursa_id': corsa.id,
                        'client_id': self.client_id,
                        'message': 'Your ride request has been created and is being processed!'
                    }))
                # Broadcast the request to all partners in the same wilaya
                client = await sync_to_async(CustomUser.objects.get)(id=self.client_id)
                await self.channel_layer.group_send(
                    f"wilaya_{self.wilaya}_{type_veh}",  # Send to all partners in the same wilaya
                    {
                        'type': 'new_ride_request',
                        'ride_data': {
                            **ride_request_data,
                            **location_data
                        },
                        'client_id': client.pk,
                        'coursa_id': corsa.id,  # Make sure this is included
                        'duration': duration,
                        'seats': seats,
                        'whom_the_trip_for': whom_the_trip_for,
                        'rating': client.rating,
                        'image_url': client.image_url.url if client.image_url else None,
                        'client_nom': client.first_name,
                        'client_last_name': client.last_name,
                        'client_num': client.phone_number_1,
                        'message': 'A new ride request is available!',
                        'km': km,
                        'prix': prix,
                    }
                )
                

            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Both pickup_location and dropoff_location are required.'
                }))


        if data['type'] == 'cancel_request_ready_accepte':
                
                coursa_id = data['coursa_id']
                await sync_to_async(Coursa.objects.filter(id=coursa_id, client_id=self.client_id).update)(etat="annulee")
                
                await self.send(text_data=json.dumps({
                    'type': 'cancel_request_success',
                    'coursa_id': coursa_id,
                    'client_id':self.client_id
                }))
        if data['type'] == 'cancell_request':
        
         data = json.loads(text_data)
         type_veh = data.get("type_vehicule")
         coursa_id=data.get("coursa_id")
         coursa= await self.get_coursa_for_annule(cousa_id=coursa_id)
         if coursa :
         
         
            await self.channel_layer.group_send(
                f"wilaya_{self.wilaya}_{type_veh}",
                {
                    'type': 'cancell_request',  # This triggers PartnerConsumer's cancell_request method
                    'client_id': self.client_id,
                    'message': 'Ride canceled by client!'
                }
            )
         else :
             print ("coursa not found")
             

            



    # Handle the 'ride_accepted' message sent by the partner
    async def ride_accepted(self, event):
     ride_data = event['ride_data']
     message = event['message']
     coursa_id = event['coursa_id']
     info_partner = event['choffeur_data']
    

        # Send the ride acceptance message to the client
     await self.send(text_data=json.dumps({
            'type': 'ride_accepted',
            'ride_data': ride_data,
            'message': message,
            'coursa_id': coursa_id,
           'choffeur_data': {
                'choffeur_user_id': info_partner['choffeur_user_id'],
                'choffeur_nom': info_partner['choffeur_nom'],
                'choffeur_prenom': info_partner['choffeur_prenom'],
                'choffeur_number': info_partner['choffeur_number'],
                'choffeur_image': info_partner['choffeur_image'],
                'choffeur_type_vehicule': info_partner['choffeur_type_vehicule'],
                'choffeur_long': str(info_partner['choffeur_long']),
                'choffeur_lat': str(info_partner['choffeur_lat']),
                'choffeur_rating': str(info_partner['choffeur_rating']),
                'choffeur_car_marque': info_partner['choffeur_car_marque'],
                'choffeur_car_model': info_partner['choffeur_car_model'],
                'choffeur_car_matricule': str(info_partner['choffeur_car_matricule']),
        }
        }))
    @sync_to_async
    def create_coursa_client (self,client_id, ride_data,duration,km,prix,seats,type_coursa,wilaya):
        """Create a new Coursa instance when the client requests a ride."""
        try:
            client = CustomUser.objects.get(id=client_id)
            coursa = Coursa.objects.create(
                client=client,
                partener=None,
                km=float(km),
                type_coursa=type_coursa,
                
               
                sets=int(seats),
                
                depart_region=ride_data['depart']['region'],
                depart_location=ride_data['depart']['location'],
                arrive_region=ride_data['arrive']['region'],
                arrive_location=ride_data['arrive']['location'],
                latitude_depart = safe_decimal(ride_data.get("pickup_location_lat")),
                longitude_depart = safe_decimal(ride_data.get("pickup_location_long")),
                latitude_arrive = safe_decimal(ride_data.get("dropoff_location_lat")),
                longitude_arrive = safe_decimal(ride_data.get("dropoff_location_long")),
                duration=duration,
                prix=prix,
                etat='en_attente',
                wilaya=wilaya,
            )
            return coursa
        except CustomUser.DoesNotExist or Partenneur.DoesNotExist:
            return None
        except Exception as e:
            print(f"Error creating Coursa: {e}")
            return None

    # Handle the 'ride_rejected' message sent by the partner
    async def ride_rejected(self, event):
        message = event['message']

        # Send the ride rejection message to the client
        await self.send(text_data=json.dumps({
            'type': 'ride_rejected',
            'message': message
        }))
    async def ride_complete(self, event):
        await self.send(text_data=json.dumps({
            'type': 'ride_complete',
            'message': event['message'],
            'coursa_id': event['coursa_id'],
            'ride_data': event['ride_data']
        }))
    async def ride_created (self,event):
        await self.send(text_data=json.dumps({
            'type': 'ride_created',
            'coursa_id': event['coursa_id'],
            'client_id': self.client_id,
            'message': event['message']
        }))


class PartnerConsumer(AsyncWebsocketConsumer):
    active_ride_requests = {}
    @sync_to_async
    def get_coursa_partner(self,coursa_id,partener_id):
        coursa :Coursa=Coursa.objects.get(id=coursa_id)
        partner =Partenneur.objects.get(id=partener_id)
        coursa.etat="en_cours"
        coursa.partener=partner
        coursa.save ()
        return coursa
        
    @sync_to_async
    def get_partner(self, client_id):
        return Partenneur.objects.select_related('vihucule').get(user__id=client_id)
    
    @sync_to_async
    def get_partner_info(self, partner_id):
        try:

            partner = Partenneur.objects.select_related('user').get(id=partner_id)
            return {
                "id": partner.user.id,
                'first_name': partner.user.first_name,
                'last_name': partner.user.last_name,
                'phone_number': partner.user.phone_number_1,
                'image_url': partner.user.image_url.url if partner.user.image_url else None, 
                'type_vehicule': partner.vihucule.type_vehicule,
                'type_compte': partner.type_compte.name,
                'long': str(partner.longitude),
                'lat': str(partner.latitude),
                'rating': str(partner.user.rating),
                'car_marque': partner.vihucule.marque,
                'car_model': partner.vihucule.modele,
                'car_matricule':str(partner.vihucule.matricule)
            }
        except Partenneur.DoesNotExist:
            return None
    async def get_all_coursa_with_locations(self, client_id):
        """
        Returns all Coursa for this partner, including:
        - Coursa's latitude_depart and longitude_depart
        - Partner's latitude and longitude
        Only returns coursas within a 15km radius using the Haversine formula.
        """
        partener :Partenneur
        # Get the partner instance (await the async method)
        partener = await self.get_partner(client_id)

        def to_float(val):
            if isinstance(val, str):
                val = val.replace(',', '.')
            return float(val)

        partner_lat = to_float(partener.latitude)
        partner_lon = to_float(partener.longitude)
        
        print (f"partener lan et long : {partner_lat }+ {partner_lon}")
        def haversine(lat1, lon1, lat2, lon2):
            R = 6371.0  # Earth radius in kilometers
            dlat = radians(lat2 - lat1)
            dlon = radians(lon2 - lon1)
            a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
            c = 2 * atan2(sqrt(a), sqrt(1 - a))
            return R * c

        # Fetch all coursas with status 'en_attent'
        coursas = await sync_to_async(lambda: list(
            Coursa.objects.filter(etat="en_attente",type_coursa=partener.vihucule.type_vehicule).select_related('client', 'partener')
        ))()
        print (f"coursa is {coursas}")

        # Filter coursas within 15km using the Haversine formula
        filtered_coursas = []
        for coursa in coursas:
            try:
                lat = to_float(coursa.latitude_depart)
                lon = to_float(coursa.longitude_depart)
                distance = haversine(partner_lat, partner_lon, lat, lon)
                print (f"distance : {distance}")
                if distance <= 6:
                    filtered_coursas.append(coursa)
            except Exception:
                continue
        print (f"filtered _coursa {filtered_coursas}")
        return filtered_coursas
    @sync_to_async
    def connectttes (self,id):
        p :Partenneur =Partenneur.objects.get(id=id)
        p.is_available=True
        p.save()
        return p
        
    async def connect(self):
        self.wilaya = self.scope['user'].wilaya_code
        self.client_id = self.scope['user'].id

        try:
           
            par:Partenneur = await self.get_partner(self.client_id)
            
        except Partenneur.DoesNotExist:
            print("Error: Partner does not exist")
            await self.close()
            return

        self.partner_id = par.pk
        await self.connectttes(self.partner_id)
        self.room_group_name = f"partner_{self.partner_id}"

        # Access related fields
        self.vehicle_type = par.vihucule.type_vehicule

        # Add to WebSocket groups
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.channel_layer.group_add(f"wilaya_{self.wilaya}_{self.vehicle_type}", self.channel_name)

        # Accept the WebSocket connection
        await self.accept()

        # Fetch all coursa with locations for this partner
        coursas = await self.get_all_coursa_with_locations(self.client_id)
        # Serialize coursas for sending (example: only ids and locations)
        from typing import List
        coursa : Coursa 
        coursa_list = [
            {
            'coursa_id': coursa.id,
            "client_id":coursa.client.id ,
            "client_nom":coursa.client.first_name if coursa.client.first_name else "first_name" ,
            "client_last_name": coursa.client.last_name if coursa.client.last_name else "last_name",
            "rating":coursa.client.rating if coursa.client.last_name else "1",
            'client_image': coursa.client.image_url.url if coursa.client.image_url else None ,
            'ride_data': {
                'pickup_location_lat': str(coursa.latitude_depart),
                'pickup_location_long': str(coursa.longitude_depart),
                'dropoff_location_lat': str(coursa.latitude_arrive),
                'dropoff_location_long': str(coursa.longitude_arrive),
                'depart': {
                'region': coursa.depart_region,
                'location': coursa.depart_location,
                },
                'arrive': {
                'region': coursa.arrive_region,
                'location': coursa.arrive_location,
                },
            },
            
            'etat': coursa.etat,
            'km': float(coursa.km) if coursa.km is not None else None,
            'prix': int(coursa.prix) if coursa.prix is not None else None,
            'duration': float(coursa.duration) if coursa.duration is not None else None,
            'seats': coursa.seats if hasattr(coursa, 'seats') else 1,
            'whom_the_trip_for': coursa.whom_the_trip_for if hasattr(coursa, 'whom_the_trip_for') else "me",
            }
            for coursa in coursas
        ]
        
        await self.send(text_data=json.dumps({
            'type': 'init_coursas',
            'coursas': coursa_list
        }))
    @sync_to_async 
    def disocnnnect_partnneur (self,partenneur_id):
        partenneur =Partenneur.objects.get(id=partenneur_id)
        partenneur.is_available =False
        partenneur.save()
        return partenneur

    async def disconnect(self, close_code):
        # Leave the WebSocket room when the partner disconnects
        
        await self.disocnnnect_partnneur(self.partner_id)
       
        
        
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.channel_layer.group_discard(f"wilaya_{self.wilaya}_{self.vehicle_type}", self.channel_name)
    active_ride_requests = {}
    
    async def receive(self, text_data):
        data = json.loads(text_data)

        if data['type'] == 'ride_request':
            # Handle ride request from client
            ride_request_data = data['ride_data']
            client_id = data('client_id')
            self.km=data.get("km")
            self.prix=data.get("prix")
            if client_id not in self.active_ride_requests:
                self.active_ride_requests[client_id] = ride_request_data
            
            
            # Client ID from the received message

            # Send the ride request to the specific partner's WebSocket
            await self.channel_layer.group_send(
                self.room_group_name,  # Send only to this partner's group
                {
                    'type': 'new_ride_request',
                    'ride_data': ride_request_data,
                    'client_id': client_id,
                    'km':self.km,
                    "prix":self.prix,
                    "client":{
                    "client_nom":client_id.nom,
                    "client_prenom":client_id.prenom,
                    "client_number":client_id.phone_number_1,
                    "client_rating":client_id.rating,
                    "client_url":client_id.image_url.url if client_id.image_url else None,

                    },
                    
                    
                    
                    'message': 'A new ride request is available!',
                    
                   
                }
            )

        elif data['type'] == 'accept_ride':
            # Handle the ride acceptance and create Coursa in the database
            ride_data = data['ride_data']
            client_id = data['client_id']
            coursa_id=data["coursa_id"]
            print (f"coursa id : {coursa_id}")
            self.km=data.get("km")
            self.prix=data.get("prix")
            self.duration=data.get("duration")
            partner_id = self.partner_id  # Partner ID from URL parameters
            print (f"partner id : {partner_id}")
            print (f"client id : {client_id}")
            print (f"cousra id : {coursa_id}")
            # Create a new Coursa instance when the partner accepts the ride
            
            if client_id in self.active_ride_requests:
                del self.active_ride_requests[client_id]
            
            
            info = await self.get_partner_info(partner_id)
            if info:
                print(f"par is ::::: {info}")
            
             
            coursa = await self.get_coursa_partner(coursa_id,self.partner_id)

            # Notify the client that the ride has been accepted
            
            await self.channel_layer.group_send(
                f'client_{client_id}',  # Send the ride accepted message to the specific client
                {
                    'type': 'ride_accepted',  # Type of message
                    'ride_data': ride_data,  # Send ride data
                    'message': f'Your ride has been accepted by partner {partner_id}!',
                    'coursa_id': coursa.id,
                    'choffeur_data':{
                    "choffeur_user_id": info["id"],
                    'choffeur_nom': info['first_name'],
                    'choffeur_prenom': info['last_name'],
                    'choffeur_number': info['phone_number'],
                    'choffeur_image': info['image_url'],
                    'choffeur_type_vehicule': info['type_vehicule'],
                    'choffeur_long': info['long'],
                    'choffeur_lat': info['lat'],
                    'choffeur_rating': info['rating'],
                    'choffeur_car_marque': info['car_marque'],
                    'choffeur_car_model': info['car_model'],
                    'choffeur_car_matricule': info['car_matricule'],
                    

                    }
                }
            )
            if coursa :
                if coursa:
                # Notify ALL PARTNERS in the same wilaya/vehicle group
                 await self.channel_layer.group_send(
                    f"wilaya_{self.wilaya}_{self.vehicle_type}",
                    {
                        'type': 'ride_accepted_notification',
                        'client_id': client_id,
                        'message': 'Ride already accepted by another partner!'
                    }
                )

        elif data['type'] == 'reject_ride':
            # If the partner rejects the ride, notify the client
            client_id = data['client_id']
            coursa_id = data['coursa_id']
            print (f"coursa id : {coursa_id}")
            
            if client_id in self.active_ride_requests:
                del self.active_ride_requests[client_id]
            print (f"test test i am here ")
            coursa= await self.get_coursa_reject(coursa_id)
            
            await self.channel_layer.group_send(
                f'client_{client_id}',  
                {
                    'type': 'ride_rejected',
                    'message': 'The ride has been rejected by the partner.'
                }
            )
        elif data["type"]=="ride_complete" :
            data = json.loads(text_data)
            client_id=data.get("client_id")
            coursa_id=data.get("coursa_id")
            if not client_id:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": "client_id is required."
                }))
                return

            coursa = await self.get_coursa(coursa_id)
            
            if not coursa:
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": "No active ride found for this client."
                }))
                return
            
            if client_id in self.active_ride_requests:
                del self.active_ride_requests[client_id]

            await self.channel_layer.group_send(
                f'client_{client_id}',
                {
                    'type': 'ride_complete',
                    'message': 'The ride is completed',
                    'coursa_id': coursa.id,
                    'ride_data': {
                        'depart': coursa.depart_location,
                        'arrive': coursa.arrive_location,
                        'prix': str(coursa.prix)
                    }
                }
            )

    

    @sync_to_async
    def get_coursa(self, coursa_id):
        try:
            coursa= Coursa.objects.get(id=coursa_id)
            coursa.etat="terminee"
            coursa.save()
            return coursa
        except Coursa.DoesNotExist:
            return None
    @sync_to_async
    def get_coursa_reject(self,coursa_id):
        try:
            print (f'iam here in fuction : get coursa_reject ')
            coursa : Coursa
            coursa= Coursa.objects.get(id=coursa_id)
               
            
            coursa.etat="annulee"
            
            coursa.save()
            return coursa
        except Coursa.DoesNotExist:
            return None
    async def ride_accepted_notification(self, event):
        """Handle ride acceptance notifications from other partners"""
        client_id = event['client_id']
        
        # Remove from active requests if present
        if client_id in self.active_ride_requests:
            del self.active_ride_requests[client_id]
        
        # Notify this partner's frontend
        await self.send(text_data=json.dumps({
            'type': 'ride_already_accepted',
            'client_id': client_id,
            'message': event['message']
        }))
    
    @sync_to_async
    def create_coursa(self, client_id, partner_id, ride_data,duration):
        """Create a new Coursa instance when the partner accepts the ride."""
        try:
            client = CustomUser.objects.get(id=client_id)
            print(f" id of partner {partner_id}")
        
            partner = Partenneur.objects.get(id=partner_id)
            
            


            coursa = Coursa.objects.create(
                client=client,
                partener=partner,
                km=float(self.km),
                
                depart_region=ride_data['depart']['region'],
                depart_location=ride_data['depart']['location'],
                arrive_region=ride_data['arrive']['region'],
                arrive_location=ride_data['arrive']['location'],
                latitude_depart = safe_decimal(ride_data.get("pickup_location_lat")),
                longitude_depart = safe_decimal(ride_data.get("pickup_location_long")),
                latitude_arrive = safe_decimal(ride_data.get("dropoff_location_lat")),
                longitude_arrive = safe_decimal(ride_data.get("dropoff_location_long")),
                duration=duration,

                
                
 # Convert to Decimal  # Corrected field name
                
                

                prix=self.prix,
                
                etat='en_cours',
                tax_tawsile=ride_data.get('tax_tawsile', 0),
                wilaya=client.wilaya,

                
            )
            

            return coursa
        except CustomUser.DoesNotExist or Partenneur.DoesNotExist:
            return None

    async def new_ride_request(self, event):
        """Handle new ride request sent to the partner."""
        ride_data = event['ride_data']
        formatted_data = {
        'depart': {
            'region': ride_data['depart']['region'],
            'location': ride_data['depart']['location']
        },
        'arrive': {
            'region': ride_data['arrive']['region'],
            'location': ride_data['arrive']['location']
        }
    }
        message = event['message']
        client_nom = event.get('client_nom', '')
        client_last_name = event.get('client_last_name', '')
        client_number = event.get('client_num', '')
        client_id=event.get("client_id","")
        km = event.get("km", "")
        prix = event.get("prix", "")
        seats = event.get("seats", "")
        duration = event.get("duration", "")
        depart = event.get('depart', 'Unknown departure')
        arrive = event.get('arrive', 'Unknown arrival')
        whom_the_trip_for = event.get("whom_the_trip_for", "")
        client_rating = event.get('rating', "") 
        client_url=event.get('image_url',"")
        coursa_id=event.get("coursa_id")
        
        
       

        # Send the new ride request to the partner WebSocket
        await self.send(text_data=json.dumps({
            'type': 'ride_request',
            'ride_data': {
            **ride_data,
            **formatted_data
        },
            'message': message,
            "client_id":client_id,
            "coursa_id":coursa_id,
            
            "km":km,
            "prix":prix,
            "seats":seats,
            "duration":duration,
            "rating":client_rating,
            
            "whom_the_trip_for":whom_the_trip_for,
           
            'client_nom': client_nom,
            'client_last_name': client_last_name,
            'client_number': client_number,
            "client_image":client_url,

           
        }))


    async def cancell_request(self, event):
     
     print("[Partner] Received cancellation for client:", event['client_id'])
     await self.send(text_data=json.dumps({
        'type': 'cancell_request',
        'client_id': event['client_id'],
        'message': event['message']
    })) 



    
  
#______________________________partener connect ______________________________________________
class ConnectPartener(AsyncWebsocketConsumer):
    """
    WebSocket consumer for partner connections.
    """

    async def connect(self):
        # Determine the user's wilaya
        self.wilaya = self.scope["user"].wilaya_code
        self.group_name = f"partener_{self.wilaya}"

        # Join the WebSocket group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Fetch initial data asynchronously
        partners = await self.get_partners(self.wilaya)
        await self.send(text_data=json.dumps({'partners': partners}))

    async def disconnect(self, close_code):
        # Leave the WebSocket group
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        # Handle incoming messages (if needed)
        pass

    async def send_partner_data(self, event):
        """
        Send updated data to the WebSocket client.
        """
        partners = event['partners']
        await self.send(text_data=json.dumps({'partners': partners}))

    @sync_to_async
    def get_partners(self, wilaya):
        """
        Fetch available partners for a specific wilaya.
        """
        partners = list(
            Partenneur.objects.filter(
                user__wilaya_code=self.wilaya, is_available=True, type_compte__name__in=["chauffeur", "choffeur", "vtc"], user__role="partener",
            ).values(
                'id',
                "user__id",
                'latitude',
                'longitude',
                'user__wilaya',
                'type_compte__name',
                'type_partener__name',
                "vihucule__type_vehicule",
                'is_available',
                "user__image_url",
            )
        )

        # Serialize Decimal fields to strings
        for partner in partners:
            partner['latitude'] = str(partner['latitude'])
            partner['longitude'] = str(partner['longitude'])
        return partners
#web socket for tracking etat change for coursa x 


class RideTrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.ride_id = self.scope['url_route']['kwargs']['ride_id']
        self.group_name = f'ride_{self.ride_id}'
        
        if await self.ride_exists():
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()
            await self.send_current_state()
        else:
            await self.close(code=4001)

    
    async def ride_exists(self):
        return await Coursa.objects.filter(id=self.ride_id).exists()

    
    async def get_ride_data(self):
        ride = await Coursa.objects.select_related('partener').get(id=self.ride_id)
        return {
            'id': ride.id,
            'etat': ride.etat,
            'partner_location': {
                'lat': str(ride.partener.latitude),
                'lng': str(ride.partener.longitude)
            }
        }

    async def send_current_state(self):
        data = await self.get_ride_data()
        await self.send(text_data=json.dumps(data))

    async def force_refresh(self, event):
        await self.send_current_state()




class NotificationChiffeurConsumer(AsyncWebsocketConsumer):
    @database_sync_to_async
    def get_partener(self, user_id):
        try:
            return Partenneur.objects.select_related("user", "type_partener", "type_compte", "vihucule").get(user__id=user_id)
        except Partenneur.DoesNotExist:
            return None

    @database_sync_to_async
    def get_notifications(self, user_id):
        try:
            return list(Notication_choffeur.objects.filter(
                partenneur__user__id=user_id, read=False
            ).select_related("partenneur__user").order_by('-date_creation'))
        except Exception:
            return []

    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=403)
            return

        self.user_id = user.id
        self.group_name = f'user_notifications_{self.user_id}'
        self.chauffeur_group = f'notification_chauffeur_{self.user_id}'
        self.client_group = f'client_{self.user_id}'

        # Add to all relevant notification groups
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.channel_layer.group_add(self.chauffeur_group, self.channel_name)
        await self.channel_layer.group_add(self.client_group, self.channel_name)

        await self.accept()
        await self.send_initial_notifications()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        if hasattr(self, 'chauffeur_group'):
            await self.channel_layer.group_discard(self.chauffeur_group, self.channel_name)
        if hasattr(self, 'client_group'):
            await self.channel_layer.group_discard(self.client_group, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data)
            action = data.get('action')

            if action == 'mark_as_read':
                notification_ids = data.get('notification_ids', [])
                if not isinstance(notification_ids, list):
                    await self.send(text_data=json.dumps({'error': 'Invalid notification_ids format'}))
                    return
                try:
                    notification_ids = [int(nid) for nid in notification_ids]
                except (ValueError, TypeError):
                    await self.send(text_data=json.dumps({'error': 'Invalid notification ID format'}))
                    return

                await self.mark_notifications_read(notification_ids)
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'notifications_marked_read',
                        'notification_ids': notification_ids
                    }
                )
                await self.send(text_data=json.dumps({
                    'type': 'acknowledge',
                    'status': 'success',
                    'message': 'Notifications marked as read',
                    'notification_ids': notification_ids
                }))
            else:
                await self.send(text_data=json.dumps({'error': 'Unknown action'}))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'error': 'Invalid JSON'}))

    async def send_user_notification(self, event):
        message = event.get('message', '')
        title = event.get('title', '')
        full_message = f"{title}: {message}" if title and not message.startswith(title) else message
        notif_id = event.get('notification_id') or int(timezone.now().timestamp() * 1000) % 2147483647
        date_str = event.get('date', timezone.now().isoformat())

        # Payload formatted for Flutter ServerNotificationModel and fallback
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': {
                'id': notif_id,
                'message': full_message,
                'date': date_str,
            },
            'id': notif_id,
            'title': title,
            'message': full_message,
            'date': date_str
        }))

    async def send_custom_notification(self, event):
        await self.send_user_notification(event)

    async def send_notification_7days(self, event):
        await self.send_user_notification(event)

    async def test(self, event):
        await self.send_user_notification(event)

    async def send_initial_notifications(self):
        notifications = await self.get_notifications(self.user_id)
        serialized_noti = [
            {
                'id': notification.id,
                'message': notification.message,
                'date': notification.date_creation.isoformat() if notification.date_creation else timezone.now().isoformat()
            }
            for notification in notifications
        ]
        await self.send(text_data=json.dumps({
            'type': 'notifications_list',
            'notifications': serialized_noti
        }))

    @database_sync_to_async
    def mark_notifications_read(self, notification_ids):
        try:
            Notication_choffeur.objects.filter(
                id__in=notification_ids,
                partenneur__user__id=self.user_id
            ).update(read=True)
        except Exception:
            pass

    async def notifications_marked_read(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notifications_marked_read',
            'notification_ids': event.get('notification_ids', [])
        })) 
    
    

        

