from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
import json
from food.models import *  # Adjust import as needed
from django.db.models import Q
import logging
from channels.db import *
from food.serializers import *
import redis

logger = logging.getLogger(__name__)

# Registry of live connected livreurs via WebSocket
ACTIVE_CONNECTED_LIVREURS = set()

def is_livreur_online(livreur_id):
    return livreur_id in ACTIVE_CONNECTED_LIVREURS

def get_online_livreur_ids():
    return set(ACTIVE_CONNECTED_LIVREURS)

class CommandeConsumer(AsyncWebsocketConsumer):
    @database_sync_to_async
    def get_partner(self, user_id):
        return Partenneur.objects.filter(user_id=user_id).first()
    
    @database_sync_to_async
    def get_magasin(self, partener_id):
        perteneur = Partenneur.objects.filter(id=partener_id).first()
        if not perteneur:
            return None
        magasin, _ = Magasin.objects.get_or_create(
            owner=perteneur,
            defaults={
                "name": perteneur.nom_de_magasin or perteneur.user.username,
                "address": perteneur.adresse or "Adresse non spécifiée",
                "wilaya": getattr(perteneur.user, "wilaya_code", "") or "",
            }
        )
        if hasattr(magasin, 'owner') and magasin.owner and hasattr(magasin.owner, 'type_compte') and magasin.owner.type_compte:
            if magasin.owner.type_compte.name == "starshop":
                magasin.EtatOuverture = True
                magasin.save()
        return magasin
    @database_sync_to_async
    def get_magasin_by_id(self, id):
        if not id:
            return None
        try:
            magasin: Magasin = Magasin.objects.get(id=id)
            if hasattr(magasin, 'owner') and magasin.owner and hasattr(magasin.owner, 'type_compte') and magasin.owner.type_compte:
                if magasin.owner.type_compte.name == "magasin":
                    magasin.EtatOuverture = False
                    magasin.save()
            return magasin
        except Magasin.DoesNotExist:
            logger.warning(f"Magasin with id {id} does not exist.")
            return None
        except Exception as e:
            logger.error(f"Error in get_magasin_by_id: {e}")
            return None

    @database_sync_to_async
    def get_magasin_by_id2(self, id):
        if not id:
            return None
        try:
            return Magasin.objects.get(id=id)
        except Magasin.DoesNotExist:
            logger.warning(f"Magasin with id {id} does not exist.")
            return None
        except Exception as e:
            logger.error(f"Error in get_magasin_by_id2: {e}")
            return None

    @database_sync_to_async
    def get_code_wilaya(self, id):
        if not id:
            return None
        try:
            magasin = Magasin.objects.select_related("owner").get(id=id)
            return magasin.owner.user.wilaya_code
        except Exception as e:
            logger.warning(f"Error in get_code_wilaya for id {id}: {e}")
            return None

    async def connect(self):
        self.room_group_name = None  # Initialize to avoid AttributeError
        self.magasin_id = None

        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            logger.error("CommandeConsumer: Unauthenticated user connection attempt.")
            await self.close(code=4001)
            return

        self.user_id = user.id

        try:
            owner = await self.get_partner(self.user_id)
            if not owner:
                logger.error(f"CommandeConsumer: Partenneur with user_id {self.user_id} does not exist.")
                await self.close(code=403)
                return
        except Exception as e:
            logger.error(f"CommandeConsumer: Error getting partner for user_id {self.user_id}: {e}")
            await self.close(code=403)
            return

        try:
            magasin = await self.get_magasin(owner.id)
            if not magasin:
                logger.error(f"CommandeConsumer: Magasin for partner_id {owner.id} (user_id {self.user_id}) does not exist.")
                await self.close(code=403)
                return

            self.magasin_id = magasin.id
            self.room_group_name = f'commande_updates_{self.magasin_id}'
        except Exception as e:
            logger.error(f"CommandeConsumer: Error getting magasin for partner_id {owner.id}: {e}")
            await self.close(code=403)
            return

        # Join the group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Fetch and send all existing commandes for the magasin
        all_commandes = await self.get_all_commandes_by_magasin(self.magasin_id)
        await self.send(text_data=json.dumps({
            'message': all_commandes
        }))

    async def disconnect(self, close_code):
        try:
            if getattr(self, 'magasin_id', None):
                await self.get_magasin_by_id(self.magasin_id)
            if getattr(self, 'room_group_name', None):
                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )
            print(f"deconnecter ")
        except Exception as e:
            logger.error(f"Error during disconnect: {e}")

    async def receive(self, text_data):
        """
        Handle incoming WebSocket messages from the client.
        """
        try:
            data = json.loads(text_data)
            action = data.get('type')

            if action == 'assigne':
                # Assign a livreur to a commande
                livreur_id = data.get('livreur_id')
                commande_id = data.get('commande_id')
                
                



                if not livreur_id or not commande_id:
                    await self.send_error('Both livreur_id and commande_id are required.')
                    return

                result = await self.assign_livreur_to_commande(commande_id, livreur_id)
                if result:
                    await self.send_success(f'Commande {commande_id} assigned to Livreur {livreur_id}.')
                    

                else:
                    await self.send_error(f'Failed to assign Commande {commande_id} to Livreur {livreur_id}.')
            
            elif action == 'broadcast':
                # Broadcast a commande to livreurs in a wilaya
                # wilaya = data.get('wilaya')
                self.magasin= await self.get_magasin_by_id2(self.magasin_id)
                wilaya= await self.get_code_wilaya(self.magasin_id)
                
                
                commande_id = data.get('commande_id')
                trip_time=data.get("trip_time",None)
                distance=data.get("distance",None)

                if not wilaya or not commande_id:
                    await self.send_error('Wilaya and commande_id are required.')
                    return

                await self.broadcast_to_livreurs(wilaya, commande_id)
                await self.send_success(f'Commande {commande_id} broadcasted to all livreurs in {wilaya}.')

            else:
                await self.send_error('Unknown action type.')

        except json.JSONDecodeError:
            await self.send_error('Invalid JSON format.')
    
    @sync_to_async
    def get_livreur_ids(self, wilaya):
        if not wilaya:
            return list(Livreur.objects.values_list('id', flat=True))
        try:
            s_wilaya = str(wilaya).strip()
            if s_wilaya.isdigit():
                return list(Livreur.objects.filter(partenneur__user__wilaya_code=int(s_wilaya)).values_list('id', flat=True))
            else:
                clean_name = s_wilaya.replace("wilaya de", "").replace("Wilaya de", "").replace("wilaya", "").replace("Wilaya", "").strip()
                return list(Livreur.objects.filter(
                    Q(wilaya__icontains=clean_name) | Q(partenneur__user__wilaya__icontains=clean_name)
                ).values_list('id', flat=True))
        except Exception:
            return list(Livreur.objects.values_list('id', flat=True))
   
    
    @database_sync_to_async
    def get_commande(self, commande_id):
        return   Commande.objects.get(id=commande_id)
    @database_sync_to_async
    def update_commande_status(self,commande_id):
    # Retrieve and update in the same sync function
     commande = Commande.objects.get(id=commande_id)
     commande.status = "search"
     commande.save()
     return commande
    @sync_to_async
    def get_magasin_lat(self,commande_id):
        commande = Commande.objects.select_related('magasin__owner').get(id=commande_id)
        return str(commande.magasin.owner.latitude)
    @sync_to_async
    def get_magasin_lan(self,commande_id):
        commande = Commande.objects.select_related('magasin__owner').get(id=commande_id)
        return str(commande.magasin.owner.longitude)

    
   


    
   
    


# This method will be triggered to broadcast the message to the appropriate room groups
    async def broadcast_to_livreurs(self, wilaya, commande_id):
    # Fetch the list of livreur IDs asynchronously
     livreur_ids =  await self.get_livreur_ids(wilaya)
     
     
     logger.info(f"Broadcasting to livreurs in wilaya {wilaya}: {livreur_ids}")
     try :


      commande = await self.update_commande_status(commande_id)
      print(f"Commande {commande.id} updated. New status: {commande.status}")
      
      
      
      
      
      
      


     except Exception as e :    
        logger.warning(f"Error while broadcasting commande {commande_id} to livreurs in wilaya {wilaya}: {e}")
        return

     if not livreur_ids:
        logger.warning(f"No livreurs found in wilaya {wilaya} for commande {commande_id}.")
        return  # Exit early if no livreurs are found

    
     for livreur_id in livreur_ids:
        room_group_name = f'livreur_commande_updates_{livreur_id}'  #Define the group name
        message = {
            'commande_id': commande_id,
            'action': 'new_commande',
            'wilaya': wilaya,
            'client': str(commande.client.username),
             'total_price': str(commande.total_price),
             "items": str(commande.itemss),
             "distance":str(commande.distance),
             "trip_time":str(commande.trip_time),
             "logo_magasin": str(commande.magasin.image) if (commande.magasin and commande.magasin.image) else "",
             "logo_client": str(commande.client.image_url) if (commande.client and commande.client.image_url) else "",
             "rating": str(commande.magasin.rating) if (commande.magasin and commande.magasin.rating) else "5.0",
             "magasin_name": str(commande.magasin.name) if (commande.magasin and commande.magasin.name) else "Restaurant",
             "client_localtion": str(commande.client.localtion_name) if (commande.client and commande.client.localtion_name) else "",
             "client_phone": "",  # Masqué par défaut
             "magasin_adresse": str(commande.magasin.address) if (commande.magasin and commande.magasin.address) else "",
             "client_lat":str(commande.client.latitude),
             "client_lon":str(commande.client.longitude),
             "magasin_lat":await self.get_magasin_lat(commande_id),
            "magasin_lon":await self.get_magasin_lan(commande_id)
        }

        # Ensure that the message is being sent to the correct room group
        
        
        # Send the message to the group asynchronously
        await self.channel_layer.group_send(
            room_group_name,
            {
                'type': 'livreur_notification',
                'message': message
            }
        )
    async def send_commande_update(self, event):
        """
        Send an update about a commande to the WebSocket client.
        """
        message = event['message']
        await self.send(text_data=json.dumps({'message': message}))

    @sync_to_async
    def get_all_commandes_by_magasin(self, magasin_id):
        try:
            
            commandes = Commande.objects.filter(magasin_id=magasin_id, status="pending").values(
                'id', 'client__username', 'magasin__name', 'total_price', 'status', 'created_at'
            ).order_by('-id')
            for commande in commandes:
                commande['created_at'] = str(commande['created_at'])
            for commande in commandes:
                commande['total_price'] = str(commande['total_price'])
            return list(commandes)
        except Exception as e:
            logger.error(f"Error fetching commandes for magasin {magasin_id}: {e}")
            return []

    @sync_to_async
    def assign_livreur_to_commande(self,commande_id, livreur_id):
        """
        Assign a livreur to a commande in the database.
        """
        try:
            commande = Commande.objects.get(id=commande_id)
            livreur = Livreur.objects.get(id=livreur_id)
            commande.livreur = livreur
            
           
            
            commande.status = 'confirmed'
            commande.save()
            return {
                'id': commande.id,
                'client__username': commande.client.username,
                'magasin__name': commande.magasin.name,
                'total_price': str(commande.total_price),
            }
        except (Commande.DoesNotExist, Livreur.DoesNotExist) as e:
            logger.error(f"Error assigning livreur {livreur_id} to commande {commande_id}: {e}")
            return None

    @sync_to_async
    def get_livreurs_by_wilaya(self, wilaya):
        """
        Fetch the livreurs from the database filtered by wilaya.
        This runs in a synchronous context to avoid the SynchronousOnlyOperation error.
        """
        try:
            livreurs = Livreur.objects.filter(wilaya=wilaya)
            return livreurs
        except Exception as e:
            logger.error(f"Error fetching livreurs by wilaya {wilaya}: {e}")
            return []

    async def send_error(self, error_message):
        await self.send(text_data=json.dumps({'error': error_message}))

    async def send_success(self, success_message):
        await self.send(text_data=json.dumps({'success': success_message}))

class LivreurConsumer(AsyncWebsocketConsumer):
    @sync_to_async
    def get_partenneur(self, user_id):
        return Partenneur.objects.get(user_id=user_id)

    @sync_to_async
    def get_livreur(self, partenneur_id):
        return Livreur.objects.get(partenneur_id=partenneur_id)
    @sync_to_async
    def get_magasin(self, magasin_id):
        return Magasin.objects.select_related("owner").prefetch_related("cataloguqe").get(id=magasin_id)
    @sync_to_async
    def get_commande(self, commande_id):
        return Commande.objects.select_related("livreur","magasin","client").get(id=commande_id)
    @sync_to_async
    def get_magasin(self, magasin_id):
        return Magasin.objects.select_related("owner").prefetch_related("cataloguqe").get(id=magasin_id)
    @sync_to_async
    def get_commande(self, commande_id):
        return Commande.objects.select_related("livreur","magasin","client").get(id=commande_id)
    @database_sync_to_async
    def get_commande_live(self, livreur_id):
        try:
            commande = (
                Commande.objects.filter(
                    livreur__id=livreur_id,
                    status__in=['confirmed', 'ready', 'in_progress']
                )
                .select_related('livreur', 'magasin', 'client')
                .values(
                    'id',
                    'client__username',
                    'magasin__name',
                    'total_price',
                    'status',
                    'distance',
                    'trip_time',
                    'magasin__image',
                    'client__image_url',
                    'magasin__rating',
                    'magasin__address',
                    'client__localtion_name',
                    'client__phone_number_1',
                    'client__latitude',
                    'client__longitude',
                    'magasin__owner__latitude',
                    'magasin__owner__longitude',
                    'itemss',
                    'delivery_price',
                    'created_at',
                )
                .order_by('-id')
                .first()
            )
            if not commande:
                return None

            for key in [
                'total_price', 'distance', 'trip_time', 'client__latitude', 'client__longitude',
                'magasin__owner__latitude', 'magasin__owner__longitude', 'magasin__rating', 'delivery_price'
            ]:
                if key in commande and commande[key] is not None:
                    commande[key] = str(commande[key])
            if 'created_at' in commande and commande['created_at'] is not None:
                commande['created_at'] = commande['created_at'].isoformat()
            # Masquer le numéro de téléphone du client jusqu'à validation explicite
            commande['client__phone_number_1'] = ""
            return commande
        except Exception as e:
            logger.error(f"Error fetching live commande for livreur {livreur_id}: {e}")
            return None

    @database_sync_to_async
    def get_commande_assigned(self, livreur_id):
        try:
            commandes = list(
                Commande.objects.filter(
                    Q(livreur__id=livreur_id) | Q(livreur__isnull=True, status="search"),
                    status__in=["pending", "search", "confirmed", "ready", "in_progress"]
                )
                .select_related('livreur', 'magasin', 'client')
                .values(
                    'id',
                    'client__username',
                    'magasin__name',
                    'total_price',
                    'status',
                    'distance',
                    'trip_time',
                    'magasin__image',
                    'client__image_url',
                    'magasin__rating',
                    'magasin__address',
                    'client__localtion_name',
                    'client__phone_number_1',
                    'client__latitude',
                    'client__longitude',
                    'magasin__owner__latitude',
                    'magasin__owner__longitude',
                    'itemss',
                    'delivery_price',
                    'created_at',
                    'specific',
                )
                .order_by('-id')
            )
            
            # Convert Decimal fields to string for JSON serialization
            for commande in commandes:
                # Si commande colis ou express, extraire les vraies coordonnées et adresses
                if commande.get('specific'):
                    try:
                        spec = json.loads(commande['specific']) if isinstance(commande['specific'], str) else commande['specific']
                        if spec:
                            p_lat = spec.get('point_depart_lat') or spec.get('pickup_lat')
                            p_lng = spec.get('point_depart_lng') or spec.get('pickup_lng')
                            if p_lat and p_lng:
                                commande['magasin__owner__latitude'] = str(p_lat)
                                commande['magasin__owner__longitude'] = str(p_lng)
                            d_lat = spec.get('point_livraison_lat') or spec.get('destination_lat')
                            d_lng = spec.get('point_livraison_lng') or spec.get('destination_lng')
                            if d_lat and d_lng:
                                commande['client__latitude'] = str(d_lat)
                                commande['client__longitude'] = str(d_lng)
                            if spec.get('adresse_depart'):
                                commande['magasin__address'] = str(spec.get('adresse_depart'))
                            if spec.get('adresse_livraison'):
                                commande['client__localtion_name'] = str(spec.get('adresse_livraison'))
                            elif spec.get('point_livraison'):
                                commande['client__localtion_name'] = str(spec.get('point_livraison'))
                            if spec.get('nom_produit'):
                                commande['magasin__name'] = f"📦 Colis: {spec.get('nom_produit')}"
                                commande['itemss'] = str(spec.get('nom_produit'))
                    except Exception:
                        pass

                for key in [
                    'total_price', 'distance', 'trip_time', 'client__latitude', 'client__longitude',
                    'magasin__owner__latitude', 'magasin__owner__longitude', 'magasin__rating', 'delivery_price'
                ]:
                    if key in commande and commande[key] is not None:
                        commande[key] = str(commande[key])
                if 'created_at' in commande and commande['created_at'] is not None:
                    commande['created_at'] = commande['created_at'].isoformat()
                commande['is_asigned'] = (commande['status'] != "search")
                # Masquer le numéro de téléphone du client jusqu'à validation explicite
                commande['client__phone_number_1'] = ""
            return commandes
        except Exception as e:
            logger.error(f"Error fetching assigned/diffused commandes for livreur {livreur_id}: {e}")
            return []

    @sync_to_async
    def set_livreur_online(self, livreur_id, is_online):
        try:
            Livreur.objects.filter(id=livreur_id).update(is_available=is_online)
        except Exception as e:
            logger.error(f"Error updating livreur {livreur_id} availability: {e}")

    async def connect(self):
        self.room_group_name = None  
        try:
            self.user_id = self.scope["user"].id
            self.partenneur = await self.get_partenneur(self.user_id)
            self.livreur_id = await self.get_livreur(self.partenneur.id)
            
            self.room_group_name = f'livreur_commande_updates_{self.livreur_id.id}'
            self.livreur_group_name = f'livreur_{self.livreur_id.id}'

            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.channel_layer.group_add(
                self.livreur_group_name,
                self.channel_name
            )
           
            await self.accept()

            # Mark livreur as online and broadcast to confirmation dashboard
            ACTIVE_CONNECTED_LIVREURS.add(self.livreur_id.id)
            await self.set_livreur_online(self.livreur_id.id, True)
            try:
                user = self.scope.get("user")
                await self.channel_layer.group_send(
                    "confirmation_commandes_all",
                    {
                        "type": "send_livreur_status_update",
                        "livreur_id": self.livreur_id.id,
                        "is_available": True,
                        "username": user.username if user else "",
                        "first_name": user.first_name if user else "",
                        "last_name": user.last_name if user else "",
                        "phone": user.phone_number_1 if user else "",
                    }
                )
            except Exception as bcast_err:
                logger.warning(f"Error broadcasting livreur online status: {bcast_err}")
                 
            active_live = await self.get_commande_live(self.livreur_id.pk)
            commandes = await self.get_commande_assigned(self.livreur_id.pk)
            
            from django.utils import timezone
            payload = {
                'type': 'commandes_list',
                'commandes': commandes or [],
                'server_time': timezone.now().isoformat(),
            }
            if active_live:
                payload['commande_live'] = active_live

            await self.send(text_data=json.dumps(payload))

        except Exception as e:
            logger.error(f"Error during connect: {e}")
            await self.close()

    async def disconnect(self, close_code):
        try:
            if hasattr(self, 'livreur_id') and self.livreur_id:
                # Mark livreur as offline and broadcast
                ACTIVE_CONNECTED_LIVREURS.discard(self.livreur_id.id)
                await self.set_livreur_online(self.livreur_id.id, False)
                try:
                    await self.channel_layer.group_send(
                        "confirmation_commandes_all",
                        {
                            "type": "send_livreur_status_update",
                            "livreur_id": self.livreur_id.id,
                            "is_available": False,
                        }
                    )
                except Exception as bcast_err:
                    logger.warning(f"Error broadcasting livreur offline status: {bcast_err}")

            if hasattr(self, 'livreur_group_name') and self.livreur_group_name:
                await self.channel_layer.group_discard(
                    self.livreur_group_name,
                    self.channel_name
                )
            if self.room_group_name:
                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )
        except Exception as e:
            logger.error(f"Error during disconnect: {e}")

    async def livreur_message(self, event):
        message = event.get('message', {})
        await self.send(text_data=json.dumps(message))

    async def livreur_notification(self, event):
        message = event.get('message', {})
        await self.send(text_data=json.dumps({
            'type': 'livreur_notification',
            'message': message,
        }))

    async def livreur_notification_commande_remove(self, event):
        message = event.get('message', {})
        commande_id = event.get('commande_id') or (message.get('commande_id') if isinstance(message, dict) else '')
        await self.send(text_data=json.dumps({
            'type': 'commande_remove',
            'commande_id': str(commande_id) if commande_id else '',
            'message': message,
        }))

    @sync_to_async
    def update_livreur_location(self, livreur_id, lat, lon):
        try:
            liv = Livreur.objects.select_related('partenneur__user').get(id=livreur_id)
            if liv.partenneur:
                liv.partenneur.latitude = lat
                liv.partenneur.longitude = lon
                liv.partenneur.save(update_fields=['latitude', 'longitude'])
                if liv.partenneur.user:
                    liv.partenneur.user.latitude = lat
                    liv.partenneur.user.longitude = lon
                    liv.partenneur.user.save(update_fields=['latitude', 'longitude'])
        except Exception as e:
            logger.error(f"Error updating livreur {livreur_id} location: {e}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('action')
            commande_id = data.get('commande_id')
            
            livreur_id = self.livreur_id.pk

            if action == 'update_location' or ('latitude' in data and 'longitude' in data and action != 'accept'):
                lat = data.get('latitude')
                lon = data.get('longitude')
                battery = data.get('battery') if data.get('battery') is not None else data.get('battery_level')
                if lat is not None and lon is not None:
                    await self.update_livreur_location(livreur_id, lat, lon)
                    try:
                        user = self.scope.get("user")
                        payload = {
                            "type": "send_livreur_status_update",
                            "livreur_id": livreur_id,
                            "is_available": True,
                            "latitude": str(lat),
                            "longitude": str(lon),
                            "username": user.username if user else "",
                            "first_name": user.first_name if user else "",
                            "last_name": user.last_name if user else "",
                            "phone": user.phone_number_1 if user else "",
                        }
                        if battery is not None:
                            payload["battery"] = battery
                            payload["battery_level"] = battery
                        await self.channel_layer.group_send(
                            "confirmation_commandes_all",
                            payload
                        )
                    except Exception as bcast_err:
                        logger.warning(f"Error broadcasting livreur location/battery: {bcast_err}")

            elif action == 'accept' and commande_id and livreur_id:
                print(f"livreur id is: {livreur_id}")
                result = await self.accept_commande(commande_id, livreur_id)
                if result:
                    await self.send_success(f'Commande {commande_id} accepted.')
                    await self.notify_order_accepted(commande_id, livreur_id)
                else:
                    await self.send(text_data=json.dumps({
                        'error': f'Failed to accept Commande {commande_id}. Cette commande a déjà été acceptée par un autre livreur.',
                        'type': 'commande_remove',
                        'action': 'commande_remove',
                        'commande_id': str(commande_id),
                        'message': {
                            'action': 'commande_remove',
                            'commande_id': str(commande_id),
                        }
                    }))

            elif action == 'decline' and commande_id:
                result = await self.decline_commande(commande_id)
                if result:
                    await self.send_success(f'Commande {commande_id} declined.')
                    try:
                        serialized = await self.get_serialized_commande_for_confirmation(commande_id)
                        if serialized:
                            await self.channel_layer.group_send(
                                "confirmation_commandes_all",
                                {
                                    'type': 'send_commande_update',
                                    'commande': serialized
                                }
                            )
                    except Exception as notify_err:
                        logger.warning(f"Error broadcasting decline status update: {notify_err}")
                else:
                    await self.send_error(f'Failed to decline Commande {commande_id}.')
            elif action == 'livre' and commande_id:
                result = await self.livre_commande(commande_id)
                if result:
                    await self.send_success(f'Commande {commande_id} livred.')
                    try:
                        serialized = await self.get_serialized_commande_for_confirmation(commande_id)
                        if serialized:
                            await self.channel_layer.group_send(
                                "confirmation_commandes_all",
                                {
                                    'type': 'send_commande_update',
                                    'commande': serialized
                                }
                            )
                        commande = await self.get_commande(commande_id)
                        if commande and commande.client:
                            await self.channel_layer.group_send(
                                f'client_commande_updates_{commande.client.id}',
                                {
                                    'type': 'send_commande_update',
                                    'commande': {
                                        'id': commande.id,
                                        'status': 'delivered',
                                        'total_price': str(commande.total_price),
                                    }
                                }
                            )
                    except Exception as notify_err:
                        logger.warning(f"Error broadcasting delivered status update: {notify_err}")
                else:
                    await self.send_error(f'Failed to deliver Commande {commande_id}.')
            elif (action in ['livreur_pret_commande', 'in_progress'] or data.get('type') == 'livreur_pret_commande') and commande_id:
                result = await self.inprogress_commande(commande_id)
                if result:
                    await self.send_success(f'Commande {commande_id} statut: in_progress (livreur_pret_commande).')
                    try:
                        serialized = await self.get_serialized_commande_for_confirmation(commande_id)
                        if serialized:
                            await self.channel_layer.group_send(
                                "confirmation_commandes_all",
                                {
                                    'type': 'send_commande_update',
                                    'commande': serialized
                                }
                            )
                        commande = await self.get_commande(commande_id)
                        if commande and commande.client:
                            await self.channel_layer.group_send(
                                f'client_commande_updates_{commande.client.id}',
                                {
                                    'type': 'send_commande_update',
                                    'commande': {
                                        'id': commande.id,
                                        'status': 'in_progress',
                                        'total_price': str(commande.total_price),
                                    }
                                }
                            )
                    except Exception as notify_err:
                        logger.warning(f"Error broadcasting status update: {notify_err}")
                else:
                    await self.send_error(f'Failed to update Commande {commande_id}.')
            elif action == "scanner" and commande_id:
                commande = await self.get_commande(commande_id)
                magasin = await self.get_magasin(commande.magasin.pk)
                if magasin:
                    result = await self.inprogress_commande(commande_id)
                    if result:
                        await self.send_success(f'commande {commande_id} pret par livreur')
                else:
                    await self.send_error("code bar inavlide ")



            elif data.get('type') == 'livreur_notification':  # Handle livreur_notification type
                await self.handle_livreur_notification(data)
            elif data.get('type') == 'livreur_notification_commande_remove': 
                await self.handle_livreur_notification_remove_commande(data)

            else:
                await self.send_error('Invalid action or missing commande_id or livreur_id.')

        except json.JSONDecodeError:
            logger.error("Invalid JSON format received from client.")
            await self.send_error('Invalid JSON format.')

        except Exception as e:
            logger.error(f"Error in receive: {e}")
            await self.send_error('An unexpected error occurred.')

    async def handle_livreur_notification(self, data):
        # Logic to handle the 'livreur_notification' message type
        notification_message = data.get('message', 'No message provided')
        await self.send(text_data=json.dumps({
            'type': 'livreur_notification',
            'message': notification_message,
        }))

    async def handle_livreur_notification_remove_commande(self, data):
        # Logic to handle the 'livreur_notification_commande_remove' message type
        notification_message = data.get('message', 'No message provided')
        commande_id = data.get('commande_id') or (notification_message.get('commande_id') if isinstance(notification_message, dict) else None)
        await self.send(text_data=json.dumps({
            'type': 'commande_remove',
            'commande_id': str(commande_id) if commande_id else '',
            'message': notification_message,
        }))

    @sync_to_async
    def get_serialized_commande_for_confirmation(self, commande_id):
        try:
            cmd = Commande.objects.select_related(
                "client", "magasin", "magasin__owner__user", "livreur__partenneur__user", "emp_val"
            ).prefetch_related("articles_commandes").get(id=commande_id)
            return CommandeCnetreAppelSerializer(cmd).data
        except Exception as e:
            logger.error(f"Error serializing commande {commande_id}: {e}")
            return None

    @sync_to_async
    def get_other_livreur_ids(self, current_livreur_id):
        try:
            return list(Livreur.objects.exclude(id=current_livreur_id).values_list('id', flat=True))
        except Exception:
            return []

    async def notify_order_accepted(self, commande_id, accepted_livreur_id):
        try:
            # 1. Diffuser la suppression immédiate de la commande à tous les autres livreurs
            other_ids = await self.get_other_livreur_ids(accepted_livreur_id)
            for other_id in other_ids:
                for grp in [f'livreur_commande_updates_{other_id}', f'livreur_{other_id}']:
                    try:
                        await self.channel_layer.group_send(
                            grp,
                            {
                                'type': 'livreur_notification_commande_remove',
                                'commande_id': str(commande_id),
                                'message': {
                                    'action': 'commande_remove',
                                    'commande_id': str(commande_id)
                                }
                            }
                        )
                    except Exception:
                        pass

            # 2. Mettre à jour le tableau de bord de confirmation en temps réel
            serialized = await self.get_serialized_commande_for_confirmation(commande_id)
            if serialized:
                await self.channel_layer.group_send(
                    "confirmation_commandes_all",
                    {
                        'type': 'send_commande_update',
                        'commande': serialized
                    }
                )
        except Exception as e:
            logger.warning(f"Error in notify_order_accepted: {e}")

    @sync_to_async
    def accept_commande(self, commande_id, livreur_id):
        try:
            commande = Commande.objects.get(id=commande_id)
            # Vérifier si la commande est déjà assignée/acceptée par un autre livreur
            if commande.livreur and commande.livreur.id != int(livreur_id):
                logger.warning(f"Commande {commande_id} déjà acceptée par le livreur {commande.livreur.id}.")
                return False

            livreur = Livreur.objects.get(id=livreur_id)
            commande.status = 'confirmed'
            commande.confirmation = True
            commande.livreur = livreur
            commande.save()
            return True
        except Commande.DoesNotExist:
            logger.error(f"Commande {commande_id} does not exist.")
            return False
        except Livreur.DoesNotExist:
            logger.error(f"Livreur {livreur_id} does not exist.")
            return False
    @sync_to_async
    def livre_commande(self, commande_id):
        try:
            commande = Commande.objects.get(id=commande_id)
            commande.status = 'delivered'
            commande.save()
            return True
        except Commande.DoesNotExist:
            logger.error(f"Commande {commande_id} does not exist.")
            return False
    @sync_to_async
    def inprogress_commande(self, commande_id):
        try:
            commande = Commande.objects.get(id=commande_id)
            commande.status = 'in_progress'
            commande.scaned =True
            commande.save()
            return True
        except Commande.DoesNotExist:
            logger.error(f"Commande {commande_id} does not exist.")
            return False
    
    @sync_to_async
    def decline_commande(self, commande_id):
        try:
            commande = Commande.objects.get(id=commande_id)
            commande.status = 'annule_par_livreur'

            commande.save()
            return True
        except Commande.DoesNotExist:
            logger.error(f"Commande {commande_id} does not exist.")
            return False

    async def send_error(self, error_message):
        await self.send(text_data=json.dumps({'error': error_message}))

    async def send_success(self, success_message):
        await self.send(text_data=json.dumps({'success': success_message}))

    @sync_to_async
    def get_commandes_for_livreur(self, livreur_id):
        try:
            commandes = Commande.objects.filter(livreur_id=livreur_id).values(
                'id', 'client__username', 'magasin__name', 'total_price', 'status'
            )
            for commande in commandes:
                commande['total_price'] = str(commande['total_price'])
            return list(commandes)
        except Exception as e:
            logger.error(f"Error fetching commandes for livreur {livreur_id}: {e}")
            return []
    async def livreur_notification(self, event):
        """
        Handle 'livreur_notification' messages sent to this consumer.
        """
        message = event.get('message', 'No message provided')
        await self.send(text_data=json.dumps({'message': message}))
    async def livreur_notification_commande_remove(self, event):
     """
     Remove accepted commande from all livreurs' UIs.
     """
     await self.send(text_data=json.dumps({
        "type": "commande_remove",
        "commande_id": event["commande_id"]
    }))



class LivreurStatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        #self.wilaya = self.scope['url_route']['kwargs']['wilaya']
        self.wilaya = self.scope["user"].wilaya
        self.group_name = f'livreurs_online_{self.wilaya}'

        # Add the WebSocket to the group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

        # Fetch and send the initial list of available livreurs
        livreurs = await sync_to_async(self.get_livreurs)()
        await self.send(text_data=json.dumps({
            'type': 'initial_data',
            'livreurs': livreurs,
        }))

    async def disconnect(self, close_code):
        # Remove WebSocket from the group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def livreur_status_update(self, event):
        """
        Handle updates broadcasted to the group.
        If a Livreur becomes unavailable, notify the frontend to remove them.
        """
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'message': event['message'],
        }))

    def get_livreurs(self):
        """
        Fetch all available livreurs for the given wilaya.
        This function runs in a synchronous context.
        """
        return list(Livreur.objects.filter(wilaya=self.wilaya, is_available=True).values('id', 'is_available'))
    async def livreur_notification(self, event):
        """
        Handle messages of type 'livreur_notification' and send them to the WebSocket client.
        """
        message = event['message']
        await self.send(text_data=json.dumps({
            'notification': message
        }))
class ClientCommandeConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.client_id = self.user.id
        self.room_group_name = f'client_commande_updates_{self.client_id}'

        # Join the room group specific to the client
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        # if you wanna see historique of commande of the client 
        # Send initial commandes to the client
        # commandes = await self.get_commandes_for_client(self.client_id)
        # await self.send(text_data=json.dumps({
        #     'type': 'commandes_list',
        #     'commandes': commandes
        # }))

    async def disconnect(self, close_code):
        # Leave the group on disconnect
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    # async def receive(self, text_data):
    #     data = json.loads(text_data)
    #     action = data.get('action')
    #     if action == 'cree_commande':
    #         # Create a new commande
    #         await self.create_commande(data)

    async def send_commande_update(self, event):
        """
        Send a commande status update to the WebSocket client.
        """
        commande = event['commande']
        await self.send(text_data=json.dumps({
            'type': 'commande_status_update',
            'commande': commande
        }))

    async def send_user_notification(self, event):
        message = event.get('message', '')
        title = event.get('title', '')
        full_message = f"{title}: {message}" if title and not message.startswith(title) else message
        notif_id = event.get('notification_id', 1)
        date_str = event.get('date', "")

        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': {
                'id': notif_id,
                'message': full_message,
                'date': date_str,
            },
            'title': title,
            'message': full_message
        }))

    @sync_to_async
    def get_commandes_for_client(self, client_id):
        """
        Fetch commandes from the database for the specified client.
        """
        try:
            commandes = Commande.objects.filter(client_id=client_id).values(
                'id', 'status', 'total_price'
            )
            for commande in commandes:
                commande['total_price'] = str(commande['total_price'])  # Convert Decimal to string
            return list(commandes)
        except Exception as e:
            return []




#websocket les magasin ouverte par default 

# class MagasinOuverteConsumer(AsyncWebsocketConsumer):
#     @database_sync_to_async
#     def get_ouvert_magasins(self, wilaya):
#         magasins= Magasin.objects.filter(wilaya=wilaya, EtatOuverture=True).select_related("owner").prefetch_related("cataloguqe")
#         serializer = MagasinSerializer(magasins, many=True)
#         return serializer.data
    
#     async def connect(self):
#         await self.accept()
#         self.user = self.scope['user']
#         self.wilaya = self.user.wilaya
#         self.group_name = f'magasin_ouverte_{self.wilaya}'
        
#         await self.channel_layer.group_add(
#             self.group_name,
#             self.channel_name
#         )

#         # Initial data
#         await self.send_initial_data()

    # @database_sync_to_async
    # def check_state_changes(self):
    #     """Check for state changes using FieldTracker"""
    #     magasins = self.get_ouvert_magasins(self.wilaya)
    #     return [
    #         (magasin.id, magasin.tracker_etat_ouvrage.has_changed('EtatOuverture'))
    #         for magasin in magasins
    #     ]

    # async def send_initial_data(self):
    #     magasins = await self.get_ouvert_magasins(self.wilaya)
        
        
    #     await self.send(text_data=json.dumps({
    #         'type': 'initial_state',
    #         'magasins': magasins,
            
    #     }))

    # async def magasin_update(self, event):
    #     """Handle group notifications"""
    #     await self.send(text_data=json.dumps(event['data']))

# class PertnnneurConnetCentreAppel(AsyncWebsocketConsumer):
#     @sync_to_async
#     def get_all_partenneurs_with_connection_status(self):
#         all_partenneurs = Partenneur.objects.filter(user__is_active=True).values('id', 'user__id', 'user__username',"user__phone_number_1"
#         ,"user__email","type_compte__name")

#         # Get set of connected user IDs from Redis
#         connected_user_ids = set(map(int, redis_client.smembers('connected_users')))

#         # Add 'connected' flag to each partenneur
#         result = []
#         for p in all_partenneurs:
#             result.append({
#                 'id': p['id'],
#                 'user_id': p['user__id'],
#                 'username': p['user__username'],
#                 'connected': p['user__id'] in connected_user_ids
#             })

#         return result

        
#     async def connect(self):
#         self.user = self.scope["user"]
#         self.room_group_name = 'centre_appel_room'

#         if self.user.is_authenticated:
#             redis_client.sadd('connected_users', self.user.id)

#         await self.channel_layer.group_add(
#             self.room_group_name,
#             self.channel_name
#         )
#         await self.accept()

#         # Send initial data with connection status
#         all_users_with_status = await self.get_all_partenneurs_with_connection_status()

#         await self.send(text_data=json.dumps({
#             'type': 'init_connected_users',
#             'users': all_users_with_status
#         }))

        

#     async def disconnect(self, close_code):
#         await self.channel_layer.group_discard(
#             self.room_group_name,
#             self.channel_name
#         )

#     async def livreur_connected(self, event):
#         await self.send(text_data=json.dumps({
#         'type': 'livreur_connected_notification',
#         'livreur_id': event['livreur_id'],
#         'livreur_username': event['livreur_username'],
#         "connected":event["connected"]
#     }))


class ConfirmationCommandeConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for Confirmation dashboard.
    Receives real-time notifications when a new commande is placed or updated.
    Supports filtering by wilaya.
    """
    async def connect(self):
        self.user = self.scope.get("user")
        
        # Parse query params (e.g. ?wilaya=Alger or ?wilaya=16)
        query_string = self.scope.get("query_string", b"").decode("utf-8")
        query_params = dict(qc.split("=") for qc in query_string.split("&") if "=" in qc)
        self.wilaya = query_params.get("wilaya", "").strip()

        # Join global confirmation group
        self.main_group = "confirmation_commandes_all"
        await self.channel_layer.group_add(
            self.main_group,
            self.channel_name
        )
        await self.channel_layer.group_add(
            "confirmation_commandes",
            self.channel_name
        )
        if self.wilaya:
            clean = self.wilaya.replace(' ', '_').lower()
            await self.channel_layer.group_add(
                f"confirmation_commandes_{clean}",
                self.channel_name
            )

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'main_group'):
            await self.channel_layer.group_discard(
                self.main_group,
                self.channel_name
            )
        await self.channel_layer.group_discard(
            "confirmation_commandes",
            self.channel_name
        )
        if hasattr(self, 'wilaya') and self.wilaya:
            clean = self.wilaya.replace(' ', '_').lower()
            await self.channel_layer.group_discard(
                f"confirmation_commandes_{clean}",
                self.channel_name
            )

    async def new_commande_notification(self, event):
        await self.send_new_commande(event)

    async def send_new_commande(self, event):
        """
        Send newly arrived commande to confirmation dashboard in real time
        """
        await self.send(text_data=json.dumps({
            'type': 'new_commande',
            'commande': event['commande']
        }))

    async def send_commande_update(self, event):
        """
        Send updated commande status or driver assignment to confirmation dashboard
        """
        await self.send(text_data=json.dumps({
            'type': 'commande_update',
            'commande': event['commande']
        }))

    async def send_client_phone_request(self, event):
        """
        Broadcast client phone request from driver to confirmation dashboard in real time
        """
        await self.send(text_data=json.dumps({
            'type': 'client_phone_request',
            'request_data': event.get('request_data', {})
        }))

    async def send_livreur_status_update(self, event):
        """
        Send real-time driver online/offline status to confirmation dashboard
        """
        payload = {
            'type': 'livreur_status',
            'livreur_id': event['livreur_id'],
            'is_available': event['is_available'],
            'latitude': event.get('latitude', ''),
            'longitude': event.get('longitude', ''),
            'username': event.get('username', ''),
            'first_name': event.get('first_name', ''),
            'last_name': event.get('last_name', ''),
            'phone': event.get('phone', ''),
        }
        if 'battery' in event and event['battery'] is not None:
            payload['battery'] = event['battery']
            payload['battery_level'] = event['battery']
        await self.send(text_data=json.dumps(payload))



