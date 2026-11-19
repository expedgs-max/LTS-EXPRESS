from decimal import Decimal
from django.db.models.signals import *
from django.dispatch import receiver
from .models import *
import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
logger = logging.getLogger(__name__)
application_fee_percent = Decimal('0.12')  # 12%
from django.utils import timezone 
from datetime import *
from django.db import transaction
from django.db.models import Avg
from .serializers import *

@receiver(post_save, sender=Commande)
def update_payment_for_livreur(sender, instance, created, **kwargs):
    """
    Signal to update or create payment records for the livreur when a Commande is delivered.
    """
    if instance.livreur and instance.status == 'delivered':
        try:
            # Ensure delivery price is valid
            delivery_fee = Decimal(instance.delivery_price)

            if delivery_fee <= 0:
                logger.warning(f"Invalid delivery fee for Commande #{instance.id}: {delivery_fee}")
                return

            # Calculate fees
            application_fee = delivery_fee * application_fee_percent
            reverse_payment = delivery_fee - application_fee

            # Update or create the payment record for the livreur
            payment, created = Payment_de_livreur.objects.get_or_create(livreur=instance.livreur)
            payment.total_fees += reverse_payment
            payment.application_fee += application_fee
            payment.save()

            # Update the articles' `paye_par_livreur` status
            instance.articles_commandes.update(paye_par_livreur=True)

            logger.info(f"Payment updated for Livreur {instance.livreur} on Commande #{instance.id}")

        except Exception as e:
            logger.error(f"Failed to update payment for Livreur {instance.livreur} on Commande #{instance.id}: {e}")

@receiver(post_save, sender=Commande)
def reset_payment_attributes_when_paid(sender, instance, **kwargs):
    """
    Signal to reset application_fee and another attribute to 0 when paye_par_livreur is True.
    """
    if instance.paye_par_livreur:
        try:
            payment = Payment_de_livreur.objects.get(livreur=instance.livreur)
            payment.application_fee = Decimal('0.0')
            payment.total_fees = Decimal('0.0')  # Adjust other attribute as needed
            payment.save()

            logger.info(f"Payment attributes reset for Livreur {instance.livreur} on Commande #{instance.id}")

        except Payment_de_livreur.DoesNotExist:
            logger.warning(f"Payment record does not exist for Livreur {instance.livreur} on Commande #{instance.id}")

        except Exception as e:
            logger.error(f"Failed to reset payment attributes for Livreur {instance.livreur} on Commande #{instance.id}: {e}")
@receiver(pre_save, sender=Commande)
def track_previous_valide_payment(sender, instance, **kwargs):
    if not instance._state.adding and instance.id:
        previous = sender.objects.get(id=instance.id)
        instance._previous_valide_payment = previous.valide_payment

# Signal to create a PaymentEmplois record when a Commande is validated
application_fee_percent = Decimal('0.12')  # 12%
emplois_service_fee_percent = Decimal('0.2')  # 20%

@receiver(post_save, sender=Commande)
def create_payment_for_emplois(sender, instance, created, **kwargs):
    if not created and instance.valide_payment and not getattr(instance, '_previous_valide_payment', False):
        try:
            if instance.emp_val:
                emplois = instance.emp_val
                logger.info(f"Creating payment for Emplois #{emplois.id} associated with Commande #{instance.id}")

                total_paid = Decimal(instance.delivery_price)
                
                # Calculate the application fee paid by the livreur (12% of the delivery price)
                application_fee = total_paid * application_fee_percent

                # Calculate the service fee for emplois (20% of the application fee)
                service_fee = application_fee * emplois_service_fee_percent

                # Create or update PaymentEmplois record
                payment_record, created = PaymentEmplois.objects.get_or_create(emplois=emplois)
                payment_record.total_paid = total_paid
                payment_record.service_fee = service_fee
                payment_record.save()

                logger.info(f"Payment record created/updated for Emplois #{emplois.id} related to Commande #{instance.id}")
            else:
                logger.warning(f"Commande #{instance.id} has no associated Emplois for payment")
        except Exception as e:
            logger.error(f"Failed to create payment record for Emplois related to Commande #{instance.id}: {e}")

@receiver(post_save, sender=Commande)
def send_commande_update(sender, instance: Commande, created, **kwargs):
    """
    Sends a real-time update to the WebSocket group of the respective magasin
    and to the confirmation dashboard group after a new commande is created or updated.
    """
    channel_layer = get_channel_layer()
    if created:
        total = float(instance.total_price) if instance.total_price else 0
        if total == 0:
            commande_articles = CommandeArticle.objects.filter(commande__id=instance.id)
            for article in commande_articles:
                total += float(article.subtotal)

        # Construct message for magasin
        message = {
            'id': instance.id,
            'client__username': instance.client.username,
            'magasin__name': instance.magasin.name if instance.magasin else 'N/A',
            'total_price': total,
            'status': instance.status,
            'magasin_id': instance.magasin.id if instance.magasin else None,
            'created_at': str(instance.created_at),
        }

        if instance.magasin:
            group_name = f"commande_updates_{instance.magasin.id}"
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'send_commande_update',
                    'message': message
                }
            )

    # Real-time Broadcast to Confirmation Dashboard
    try:
        serialized_cmd = CommandeCnetreAppelSerializer(instance).data
        event_type = 'send_new_commande' if created else 'send_commande_update'

        # Broadcast to confirmation all group
        async_to_sync(channel_layer.group_send)(
            "confirmation_commandes_all",
            {
                'type': event_type,
                'commande': serialized_cmd
            }
        )
    except Exception as e:
        logger.error(f"Error broadcasting commande to confirmation WebSocket: {e}")
# receiver(post_save, sender=Commande)
# def send_commande_update(sender, instance, created, **kwargs):
#     if created or instance.livreur :  # Trigger only if it's created, livreur is assigned, or status changes
#         channel_layer = get_channel_layer()

#         # Debugging line
#         print(f"New Commande Created: {instance.id}, Livreur ID: {instance.livreur.id}")

#         message = {
#             'id': instance.id,
#             'client': instance.client.username,
#             'magasin': instance.magasin.name,
#             'total_price': str(instance.total_price),
#             'status': instance.get_status_display(),
#             'livreur_id': instance.livreur.id,
           

#         }
        

#         group_name = f"livreur_commande_updates_{instance.livreur.id}"
        
#         # Debugging line
#         print(f"Sending message to group: {group_name}")

#         # Send the update to the appropriate group
#         async_to_sync(channel_layer.group_send)(
#             group_name,
#             {
#                 'type': 'send_commande_update',  # This method must match the method in your consumer
#                 'message': message
#             }
#         )
@receiver(post_save, sender=Livreur)
def notify_livreur_status(sender, instance, **kwargs):
    """
    Broadcast Livreur status updates to WebSocket group based on wilaya.
    If is_available becomes False, notify the frontend to remove the Livreur.
    """
    channel_layer = get_channel_layer()
    group_name = f'livreurs_online_{instance.wilaya}'  # Assuming `wilaya` is a field in Livreur

    # Prepare the message data
    message = {
        'livreur_id': instance.id,
          # Replace with the actual field for Livreur name
        'is_available': instance.is_available,
    }

    # Broadcast the message
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'livreur_status_update',
            'message': message,
        }
    )
#singal handle real time chnage of status of commande 
PREVIOUS_STATUS = {}

@receiver(pre_save, sender=Commande)
def cache_previous_status(sender, instance, **kwargs):
    """
    Cache the previous status of the Commande before it's saved.
    """
    if instance.pk:
        try:
            # Fetch the existing Commande instance from the database
            previous_instance = Commande.objects.get(pk=instance.pk)
            PREVIOUS_STATUS[instance.pk] = (previous_instance.status, previous_instance.livreur_id)
        except Commande.DoesNotExist:
            # Commande doesn't exist in the database yet
            PREVIOUS_STATUS[instance.pk] = (None, None)

@receiver(post_save, sender=Commande)
def notify_client_on_status_change(sender, instance:Commande, **kwargs):
    """
    Notify the client if the Commande's status has changed.
    """
    prev = PREVIOUS_STATUS.get(instance.pk, (None, None))
    previous_status, previous_livreur_id = prev if isinstance(prev, tuple) else (prev, None)
    current_status = instance.status
    current_livreur_id = instance.livreur_id if hasattr(instance, 'livreur_id') else (instance.livreur.id if instance.livreur else None)

    # Check if the status or assigned livreur has changed
    if previous_status != current_status or previous_livreur_id != current_livreur_id:
        logger.info(f"Status/Livreur changed for Commande {instance.pk}: status({previous_status} -> {current_status}), livreur({previous_livreur_id} -> {current_livreur_id})")

        # Notify the client in real-time via WebSocket
        channel_layer = get_channel_layer()
        client_id = instance.client.id
        commande_artciles=CommandeArticle.objects.filter(commande__id=instance.id)
        prix_total=0
        owner_tc = getattr(getattr(getattr(instance, 'magasin', None), 'owner', None), 'type_compte', None)
        if not (owner_tc and getattr(owner_tc, 'name', None) == "starshop"):
            
            for e in commande_artciles :
                prix_total+=e.subtotal
                print (f"prix : {e.subtotal}")
        if (prix_total == 0 or not commande_artciles.exists()) and instance.total_price:
            prix_total = instance.total_price

        async_to_sync(channel_layer.group_send)(
            f'client_commande_updates_{client_id}',
            {
                
                'type': 'send_commande_update',
                'commande': {
                    'id': instance.id,
                    'status': current_status,
                    'total_price': str(prix_total),
                    "livreur_first_name":instance.livreur.partenneur.user.first_name if instance.livreur and instance.livreur.partenneur and instance.livreur.partenneur.user else "pas en cour trouve livreur",
                    "livreur_last_name":instance.livreur.partenneur.user.last_name if instance.livreur and instance.livreur.partenneur and instance.livreur.partenneur.user else "pas en cour trouve livreur",
                    "livreur_phone" :instance.livreur.partenneur.user.phone_number_1 if instance.livreur and instance.livreur.partenneur and instance.livreur.partenneur.user else "pas numero",
                    "livreur_lat" :str(instance.livreur.partenneur.latitude) if instance.livreur and instance.livreur.partenneur and instance.livreur.partenneur.user else "pas lat",
                    "livreur_lon":str(instance.livreur.partenneur.longitude) if instance.livreur and instance.livreur.partenneur and instance.livreur.partenneur.user else "pas log",
                    "livreur_profil_image":str(instance.livreur.partenneur.user.image_url)  if instance.livreur and instance.livreur.partenneur and instance.livreur.partenneur.user else None,
                    "prix_de_livrison" :str(instance.delivery_price),
                    "delivery_price" :str(instance.delivery_price),
                    "prix_de_tax" :str(instance.prix_de_tax),
                    "specific" :instance.specific or "",
                    "distination" :instance.distination or "",
                    "type_livraison" :instance.type_livraison or "",
                    "magasin_name" :instance.magasin.name if instance.magasin else "",
                }
            }
        )

    # Clean up the previous status after processing
    PREVIOUS_STATUS.pop(instance.pk, None)
#singals to create action automatique 



# @receiver(post_save, sender=Commande)
# def create_action_on_bulk_payment_validation(sender, instance, created, **kwargs):
#     """
#     This signal listens for changes in the Commande model and creates a single action
#     when multiple commandes are validated (valide_payment=True).
#     """
#     if not created and instance.valide_payment and instance.emp_val:
#         # This will run once for each updated commande, so we need to aggregate intelligently.
#         agent = instance.emp_val

#         # Retrieve all commandes that were updated in this bulk operation
#         updated_commandes = Commande.objects.filter(emp_val=agent, valide_payment=True)

#         # Calculate the total delivery price for these commandes
#         total_amount = sum(commande.delivery_price for commande in updated_commandes)
#         total_amount *= Decimal('0.12')  # Apply the 12% adjustment

#         # Create a single action for the bulk operation
#         with transaction.atomic():
#             Actions.objects.create(
#                 agent=agent,
#                 livreur=updated_commandes.first().livreur if updated_commandes.exists() else None,
#                 total_amount=total_amount,
#             )



#singalllls de send message to web socket magasin so he can see etat chnage of his commande 



@receiver(pre_save, sender=Commande)
def capture_previous_state(sender, instance, **kwargs):
    """Capture previous state before save"""
    if instance.pk:
        try:
            old_instance = Commande.objects.get(pk=instance.pk)
            instance._previous_status = old_instance.status
            
        except Commande.DoesNotExist:
            instance._previous_status = None
            instance._previous_livreur = None


        if instance.tracker.has_changed("status") :

            
            message = {
                'id': instance.id,
                'client': instance.client.username,
                'magasin': instance.magasin.name,
                'total_price': str(instance.total_price),
                'status': instance.status,
                "created_at": str(instance.created_at),
                
            }
                
            channel_layer=get_channel_layer()
            magasin_group = f"commande_updates_{instance.magasin.pk}"
            async_to_sync(channel_layer.group_send)(
            magasin_group,
            {
                'type': 'send_commande_update',
                'message': message
            }
        )
             





# receiver(post_save, sender=Commande)
# def send_commande_update_status(sender, instance, created, **kwargs):
#     if update :
    
#         print ("my newwwwww singallllllllllllssssssssssssssssssssssssssssssssssss")

#      # Trigger only if it's created, livreur is assigned, or status changes
#         channel_layer = get_channel_layer()
#         status_changed =instance.status != getattr(instance, '_previous_status', None)


#         # Debugging line
#         print(f"my newww singalssssssss: {instance.id}, Livreur ID: {instance.livreur.id}")
#         if not any([created, status_changed]):
#          return

#         message = {
#             'id': instance.id,
#             'client': instance.client.username,
#             'magasin': instance.magasin.name,
#             'total_price': str(instance.total_price),
#             'status': instance.get_status_display(),
#             'livreur_id': instance.livreur.id
#         }

#         magasin_group = f"commande_updates_{instance.magasin.id}"
#         async_to_sync(channel_layer.group_send)(
#         magasin_group,
#         {
#             'type': 'send_commande_update',
#             'message': message
#         }
#     )

@receiver(post_save, sender=Commande)
def notify_livreur_on_status_change(sender, instance, **kwargs):
    """
    Sends WebSocket notification to livreur when Commande status changes.
    """
    
    try:
        # Ne pas envoyer de notification si le statut est livreur_pret_commande ou in_progress
        if instance.status in ['livreur_pret_commande', 'in_progress']:
            return

        # Trigger if status changed or livreur was assigned/changed, and livreur exists
        if (instance.tracker.has_changed('status') or instance.tracker.has_changed('livreur')) and instance.livreur:
            
            channel_layer = get_channel_layer()
            group_name = f'livreur_commande_updates_{instance.livreur.id}'
            produis = CommandeArticle.objects.filter(commande__id=instance.id)
            prix_total = 0
            for p in produis:
                prix_total += p.subtotal
                
            magasin_lat = str(instance.magasin.owner.latitude) if instance.magasin and hasattr(instance.magasin, 'owner') and instance.magasin.owner and instance.magasin.owner.latitude else "0.0"
            magasin_lon = str(instance.magasin.owner.longitude) if instance.magasin and hasattr(instance.magasin, 'owner') and instance.magasin.owner and instance.magasin.owner.longitude else "0.0"
            client_lat = str(instance.client.latitude) if instance.client and instance.client.latitude else "0.0"
            client_lon = str(instance.client.longitude) if instance.client and instance.client.longitude else "0.0"

            # Prepare WebSocket message
            message = {
                'type': 'livreur_notification',
                'message': {
                    'commande_id': instance.id,
                    'new_status': instance.status,
                    'action': 'assigne' if instance.status == 'confirmed' else instance.status,
                    'client': instance.client.username if instance.client else "",
                    'total_price': str(prix_total or instance.total_price or "0"),
                    "items": instance.itemss or "",
                    "distance": str(instance.distance or "0"),
                    "trip_time": str(instance.trip_time or "0"),
                    "logo_magasin": str(instance.magasin.image) if instance.magasin and instance.magasin.image else "",
                    "logo_client": str(instance.client.image_url) if instance.client and instance.client.image_url else "",
                    "rating": str(instance.magasin.rating) if instance.magasin and instance.magasin.rating else "5.0",
                    "magasin_name": instance.magasin.name if instance.magasin else "",
                    "client_name": instance.distination or (instance.client.username if instance.client else ""),
                    "client_phone": "",  # Masqué par défaut jusqu'à validation explicite
                    "client_localtion": instance.client.localtion_name if instance.client else "",
                    "magasin_adresse": instance.magasin.address if instance.magasin else "",
                    "client_lat": client_lat,
                    "client_lon": client_lon,
                    "magasin_lat": magasin_lat,
                    "magasin_lon": magasin_lon
                }
            }

            # Send to the specific livreur who was assigned the commande
            async_to_sync(channel_layer.group_send)(group_name, message)
           
            try:
                wilaya_val = getattr(instance.client, 'wilaya_code', None) or (instance.magasin.wilaya if instance.magasin else None)
                if wilaya_val:
                    s_w = str(wilaya_val).strip()
                    if s_w.isdigit():
                        livreurs_ids = Livreur.objects.filter(partenneur__user__wilaya_code=int(s_w)).exclude(id=instance.livreur.id).values_list('id', flat=True)
                    else:
                        clean_w = s_w.replace("wilaya de", "").replace("Wilaya de", "").replace("wilaya", "").replace("Wilaya", "").strip()
                        livreurs_ids = Livreur.objects.filter(
                            Q(wilaya__icontains=clean_w) | Q(partenneur__user__wilaya__icontains=clean_w)
                        ).exclude(id=instance.livreur.id).values_list('id', flat=True)
                    message2 = {
                        "type": "livreur_notification",
                        "message": {
                            "commande_id": instance.id,
                            "task": "This commande has already been taken",
                        }
                    }
                    for id in livreurs_ids:
                        async_to_sync(channel_layer.group_send)(f'livreur_commande_updates_{id}', message2)
            except Exception as other_err:
                logger.warning(f"Error notifying other livreurs: {other_err}")
            
    except Exception as e:
        logger.error(f"WebSocket notification failed: {e}")
# todo create singals for update rating produis 
@receiver(post_save,sender=ReviewsProduis)
def update_rating_produis (sender,instance,created,**kwargs):
    if created : 
        print('iammmm hereeeeeeeeeeeeeee ')
        produis_cible=Produis.objects.get(id=instance.article.id)
       
        avg_rating = ReviewsProduis.objects.filter(article__id=instance.article.pk).aggregate(Avg('star'))['star__avg']
        avg_rating = round(avg_rating, 2) if avg_rating is not None else 0.0
        print("avg rating : %.2f" % avg_rating)
        
        produis_cible.rating = float(avg_rating) if avg_rating is not None else 0.0
       
        produis_cible.save()


#singals for update rating for magasin 
@receiver(post_save,sender=ReviewsMagasin)
def update_rating_produis (sender,instance,created,**kwargs):
    if created : 
        print('iammmm hereeeeeeeeeeeeeee ')
        magasin=Magasin.objects.get(id=instance.magasin.id)
       
        avg_rating = ReviewsMagasin.objects.filter(magasin__id=instance.magasin.pk).aggregate(Avg('star'))['star__avg']
        avg_rating = round(avg_rating, 2) if avg_rating is not None else 0.0
        print("avg rating : %.2f" % avg_rating)
        
        magasin.rating = float(avg_rating) if avg_rating is not None else 0.0
       
        magasin.save()



#updtae wzeb socket magasin ouvert et fermer 


# @receiver(post_save, sender=Magasin)
# def notify_magasin_status_change(sender, instance, **kwargs):
#     """Send WebSocket update when EtatOuverture changes"""
#     # Check if the EtatOuverture field has changed
#     if instance.tracker_etat_ouvrage.has_changed('EtatOuverture'):
#         print(f"EtatOuverture changed for magasin {instance.id}")


#         # Serialize the updated instance
#         serializer = MagasinSerializer(instance)
        
#         # Get channel layer
#         channel_layer = get_channel_layer()
        

#         # Send update to the appropriate group
#         async_to_sync(channel_layer.group_send)(
#             f'magasin_ouverte_{instance.wilaya}',
#             {
#                 'type': 'magasin.update',
#                 'data': serializer.data
#             }
#         )
@receiver(post_save, sender=Commande)
def notify_livreur_on_delivery_accepte(sender, instance:Commande, **kwargs):
    try:
        print(f"instane id 2 : {instance.id}")
        # Retrieve previous values; ensure these are set before saving.
        previous_livreur = getattr(instance, '_previous_livreur', None)
        previous_etat = getattr(instance, '_previous_status', None)
        current_livreur = instance.livreur
        current_etat = instance.status
        
        
        # Check that the etat changed from 'PAUSE' to 'CONFIRMED'
        # and optionally that there was no previous livreur and now there is one.
        if previous_livreur is None and current_livreur and previous_etat=="search" and current_etat=="confirmed" :
            
        
            channel_layer = get_channel_layer()
            #todo 
            livreus=Livreur.objects.filter(partenneur__user__wilaya_code=instance.livreur.partenneur.user.wilaya_code)
            for livreur in livreus:
                if livreur.id != current_livreur.id:
                    async_to_sync(channel_layer.group_send)(
                    f'livreur_commande_updates_{livreur.id}',
                    {
                        'type': 'livreur_notification_commande_remove',
                        'commande_id': instance.id
                    }
                    )
                
            
            
    except Exception as e:
        logger.error(f"WebSocket notification failed: {e}")

@receiver(post_save, sender=Commande)
def notify_livreur_on_status_change(sender, instance, **kwargs):
    """
    Sends WebSocket notification to livreur when Commande status changes.
    """
    
    try:
        # Ne pas envoyer de notification si le statut est livreur_pret_commande ou in_progress
        if instance.status in ['livreur_pret_commande', 'in_progress']:
            return

        # Trigger if status changed or livreur was assigned/changed, and livreur exists
        if (instance.tracker.has_changed('status') or instance.tracker.has_changed('livreur')) and instance.livreur:
            
            channel_layer = get_channel_layer()
            group_name = f'livreur_commande_updates_{instance.livreur.id}'
            produis = CommandeArticle.objects.filter(commande__id=instance.id)
            prix_total = 0
            for p in produis:
                prix_total += p.subtotal
                
            magasin_lat = str(instance.magasin.owner.latitude) if instance.magasin and hasattr(instance.magasin, 'owner') and instance.magasin.owner and instance.magasin.owner.latitude else "0.0"
            magasin_lon = str(instance.magasin.owner.longitude) if instance.magasin and hasattr(instance.magasin, 'owner') and instance.magasin.owner and instance.magasin.owner.longitude else "0.0"
            client_lat = str(instance.client.latitude) if instance.client and instance.client.latitude else "0.0"
            client_lon = str(instance.client.longitude) if instance.client and instance.client.longitude else "0.0"

            # Prepare WebSocket message
            message = {
                'type': 'livreur_notification',
                'message': {
                    'commande_id': instance.id,
                    'new_status': instance.status,
                    'action': 'assigne' if instance.status == 'confirmed' else instance.status,
                    'client': instance.client.username if instance.client else "",
                    'total_price': str(prix_total or instance.total_price or "0"),
                    "items": instance.itemss or "",
                    "distance": str(instance.distance or "0"),
                    "trip_time": str(instance.trip_time or "0"),
                    "logo_magasin": str(instance.magasin.image) if instance.magasin and instance.magasin.image else "",
                    "logo_client": str(instance.client.image_url) if instance.client and instance.client.image_url else "",
                    "rating": str(instance.magasin.rating) if instance.magasin and instance.magasin.rating else "5.0",
                    "magasin_name": instance.magasin.name if instance.magasin else "",
                    "client_name": instance.distination or (instance.client.username if instance.client else ""),
                    "client_phone": "",  # Masqué par défaut jusqu'à validation explicite
                    "client_localtion": instance.client.localtion_name if instance.client else "",
                    "magasin_adresse": instance.magasin.address if instance.magasin else "",
                    "client_lat": client_lat,
                    "client_lon": client_lon,
                    "magasin_lat": magasin_lat,
                    "magasin_lon": magasin_lon
                }
            }

            # Send to the specific livreur who was assigned the commande
            async_to_sync(channel_layer.group_send)(group_name, message)
           
            try:
                wilaya_val = getattr(instance.client, 'wilaya_code', None) or (instance.magasin.wilaya if instance.magasin else None)
                if wilaya_val:
                    s_w = str(wilaya_val).strip()
                    if s_w.isdigit():
                        livreurs_ids = Livreur.objects.filter(partenneur__user__wilaya_code=int(s_w)).exclude(id=instance.livreur.id).values_list('id', flat=True)
                    else:
                        clean_w = s_w.replace("wilaya de", "").replace("Wilaya de", "").replace("wilaya", "").replace("Wilaya", "").strip()
                        livreurs_ids = Livreur.objects.filter(
                            Q(wilaya__icontains=clean_w) | Q(partenneur__user__wilaya__icontains=clean_w)
                        ).exclude(id=instance.livreur.id).values_list('id', flat=True)
                    message2 = {
                        "type": "livreur_notification",
                        "message": {
                            "commande_id": instance.id,
                            "task": "This commande has already been taken",
                        }
                    }
                    for id in livreurs_ids:
                        async_to_sync(channel_layer.group_send)(f'livreur_commande_updates_{id}', message2)
            except Exception as other_err:
                logger.warning(f"Error notifying other livreurs: {other_err}")
            
    except Exception as e:
        logger.error(f"WebSocket notification failed: {e}")
# todo create singals for update rating produis 
@receiver(post_save,sender=ReviewsProduis)
def update_rating_produis (sender,instance,created,**kwargs):
    if created : 
        print('iammmm hereeeeeeeeeeeeeee ')
        produis_cible=Produis.objects.get(id=instance.article.id)
       
        avg_rating = ReviewsProduis.objects.filter(article__id=instance.article.pk).aggregate(Avg('star'))['star__avg']
        avg_rating = round(avg_rating, 2) if avg_rating is not None else 0.0
        print("avg rating : %.2f" % avg_rating)
        
        produis_cible.rating = float(avg_rating) if avg_rating is not None else 0.0
       
        produis_cible.save()


#singals for update rating for magasin 
@receiver(post_save,sender=ReviewsMagasin)
def update_rating_produis (sender,instance,created,**kwargs):
    if created : 
        print('iammmm hereeeeeeeeeeeeeee ')
        magasin=Magasin.objects.get(id=instance.magasin.id)
       
        avg_rating = ReviewsMagasin.objects.filter(magasin__id=instance.magasin.pk).aggregate(Avg('star'))['star__avg']
        avg_rating = round(avg_rating, 2) if avg_rating is not None else 0.0
        print("avg rating : %.2f" % avg_rating)
        
        magasin.rating = float(avg_rating) if avg_rating is not None else 0.0
       
        magasin.save()



#updtae wzeb socket magasin ouvert et fermer 


# @receiver(post_save, sender=Magasin)
# def notify_magasin_status_change(sender, instance, **kwargs):
#     """Send WebSocket update when EtatOuverture changes"""
#     # Check if the EtatOuverture field has changed
#     if instance.tracker_etat_ouvrage.has_changed('EtatOuverture'):
#         print(f"EtatOuverture changed for magasin {instance.id}")


#         # Serialize the updated instance
#         serializer = MagasinSerializer(instance)
        
#         # Get channel layer
#         channel_layer = get_channel_layer()
        

#         # Send update to the appropriate group


# =========================================================================
# AUTO-UPDATE nbr_commandes (+1 lors du passage à livrée, -1 si annulation)
# =====================================================================================

def _increment_user_nbr_commandes(user):
    """Incrémente nbr_commandes de +1 pour l'utilisateur."""
    if user is None:
        return
    try:
        from employer.models import CustomUser as CU
        from django.db.models import F
        CU.objects.filter(pk=user.pk).update(nbr_commandes=F('nbr_commandes') + 1)
    except Exception as e:
        logger.error(f"Error incrementing nbr_commandes for user #{getattr(user, 'pk', '?')}: {e}")

def _decrement_user_nbr_commandes(user):
    """Décrémente nbr_commandes de -1 pour l'utilisateur (min 0)."""
    if user is None:
        return
    try:
        from employer.models import CustomUser as CU
        from django.db.models import F, Case, When
        CU.objects.filter(pk=user.pk).update(
            nbr_commandes=Case(
                When(nbr_commandes__gt=0, then=F('nbr_commandes') - 1),
                default=0
            )
        )
    except Exception as e:
        logger.error(f"Error decrementing nbr_commandes for user #{getattr(user, 'pk', '?')}: {e}")


@receiver(post_save, sender=Commande)
def auto_update_nbr_commandes_on_save(sender, instance, created, **kwargs):
    """
    Incrémente nbr_commandes (+1) pour le client et le livreur lorsque la commande
    devient livrée ('delivered').
    """
    try:
        previous_status = getattr(instance, '_previous_status', None)
        current_status = instance.status

        # Cas 1: La commande devient 'delivered' (nouvelle ou mise à jour de statut)
        if current_status == 'delivered' and (created or previous_status != 'delivered'):
            if instance.client_id:
                _increment_user_nbr_commandes(instance.client)

            if instance.livreur_id and hasattr(instance.livreur, 'partenneur') and instance.livreur.partenneur:
                _increment_user_nbr_commandes(instance.livreur.partenneur.user)

            if instance.magasin_id:
                try:
                    owner_partenaire = instance.magasin.owner
                    if owner_partenaire and owner_partenaire.user:
                        _increment_user_nbr_commandes(owner_partenaire.user)
                except Exception:
                    pass

        # Cas 2: La commande était 'delivered' et son statut change vers autre chose (ex: annulée)
        elif previous_status == 'delivered' and current_status != 'delivered':
            if instance.client_id:
                _decrement_user_nbr_commandes(instance.client)

            if instance.livreur_id and hasattr(instance.livreur, 'partenneur') and instance.livreur.partenneur:
                _decrement_user_nbr_commandes(instance.livreur.partenneur.user)

            if instance.magasin_id:
                try:
                    owner_partenaire = instance.magasin.owner
                    if owner_partenaire and owner_partenaire.user:
                        _decrement_user_nbr_commandes(owner_partenaire.user)
                except Exception:
                    pass

    except Exception as e:
        logger.error(f"Error in auto_update_nbr_commandes_on_save for Commande #{instance.id}: {e}")


@receiver(post_delete, sender=Commande)
def auto_update_nbr_commandes_on_delete(sender, instance, **kwargs):
    """
    Décrémente nbr_commandes si une commande livrée est supprimée.
    """
    try:
        if instance.status == 'delivered':
            if instance.client_id:
                _decrement_user_nbr_commandes(instance.client)

            if instance.livreur_id and hasattr(instance.livreur, 'partenneur') and instance.livreur.partenneur:
                _decrement_user_nbr_commandes(instance.livreur.partenneur.user)

            if instance.magasin_id:
                try:
                    owner_partenaire = instance.magasin.owner
                    if owner_partenaire and owner_partenaire.user:
                        _decrement_user_nbr_commandes(owner_partenaire.user)
                except Exception:
                    pass

    except Exception as e:
        logger.error(f"Error in auto_update_nbr_commandes_on_delete for Commande #{instance.id}: {e}")
