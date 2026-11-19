from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from asgiref.sync import async_to_sync, sync_to_async
from channels.layers import get_channel_layer
from employer.models import *
from .models import Review
from django.db import close_old_connections
from django.db.models import *
from .serializer import RideTrackingSerializer
from django.core.exceptions import ObjectDoesNotExist
@receiver(post_save, sender=Partenneur)
@receiver(post_delete, sender=Partenneur)
def broadcast_partner_update(sender, instance, **kwargs):
    """
    Broadcast partner updates to all WebSocket clients in the 'partners' group.
    """
    channel_layer = get_channel_layer()
    partners = [
        {
            'id': partner.id,
            'nom_de_magasin': partner.nom_de_magasin,
            'wilaya': partner.user.wilaya,
            'wilaya_code': partner.user.wilaya_code,
            'latitude': str(partner.latitude),
            'longitude': str(partner.longitude),
        }
        for partner in Partenneur.objects.all()
    ]

    async_to_sync(channel_layer.group_send)(
        'partners',
        {
            'type': 'broadcast_update',
            'data': {'partners': partners}
        }
    )
#sinagle for client see all partener connect 
# @receiver(post_save, sender=Partenneur)
# def broadcast_partner_update(sender, instance, created, **kwargs):
#     channel_layer = get_channel_layer()

#     # Determine the group name based on `wilaya`
#     if instance.user and instance.user.wilaya:
#         group_name = f"partener_{instance.user.wilaya}"
#     else:
#         return  # Exit if `wilaya` is not defined

#     # Convert Decimal fields to floats
#     def serialize_decimal(value):
#         return float(value) if isinstance(value, Decimal) else value

#     # Prepare the new partner's data
#     new_partner = {
#         'id': instance.id,
#         'latitude': serialize_decimal(instance.latitude),
#         'longitude': serialize_decimal(instance.longitude),
#         'type_compte': instance.type_compte.name if instance.type_compte else "Unknown",
#         'nom_de_magasin': instance.nom_de_magasin,
#         'is_available': instance.is_available,
#     }

#     # Fetch updated list of partners in the same wilaya
#     partners = list(
#         Partenneur.objects.filter(user__wilaya=instance.user.wilaya).values(
#             'id', 
#             'latitude', 
#             'longitude', 
#             'user__wilaya', 
#             'type_compte__name', 
#             'type_partener__name', 
#             'nom_de_magasin', 
#             'is_available'
#         )
#     )
#     for partner in partners:
#         partner['latitude'] = serialize_decimal(partner['latitude'])
#         partner['longitude'] = serialize_decimal(partner['longitude'])

#     # Broadcast to the WebSocket group
#     async_to_sync(channel_layer.group_send)(
#         group_name,
#         {
#             'type': 'send_partner_data',
#             'partners': partners,
#             'new_partner': new_partner,
#         }
#     )
@receiver(post_save, sender=Partenneur)
def notify_partner_availability(sender, instance:Partenneur, created, **kwargs):
    # Get the channel layer
    channel_layer = get_channel_layer()
    group_name = f"partener_{instance.user.wilaya_code}"  # Adjust based on your group naming convention

    if instance.is_available:
        updated_partners = list(
            Partenneur.objects.filter(
                  user__wilaya_code=instance.user.wilaya_code, is_available=True, type_compte__name__in=["chauffeur", "choffeur", "vtc"], user__role="partener",
            ).select_related("vihucule").values(
                'id',
                'user__id',
                'latitude',
                'longitude',
                'user__wilaya',
                'type_compte__name',
                'type_partener__name',
                'nom_de_magasin',
                'is_available',
                "user__image_url",
                "vihucule__type_vehicule",
                
            )
        )
       

        # Serialize Decimal fields to strings
        for partner in updated_partners:
            partner['latitude'] = str(partner['latitude'])
            partner['longitude'] = str(partner['longitude'])

        async_to_sync(channel_layer.group_send)(group_name, {
            "type": "send.partner.data",
            "partners": updated_partners,  # Send the updated partner list
        })
        # Send a message with the partner's data
        

       
    else:
        # Send an updated list of available partners when one becomes unavailable
        updated_partners = list(
            Partenneur.objects.filter(
                user__wilaya_code=instance.user.wilaya_code, is_available=True, type_compte__name__in=["chauffeur", "choffeur", "vtc"], user__role="partener",
            ).select_related("vihucule").values(
                'id',
                'user__id',
                'latitude',
                'longitude',
                'user__wilaya',
                'type_compte__name',
                'type_partener__name',
                'nom_de_magasin',
                'is_available',
                "user__image_url",
                "vihucule__type_vehicule",
                
            )
        )

        # Serialize Decimal fields to strings
        for partner in updated_partners:
            partner['latitude'] = str(partner['latitude'])
            partner['longitude'] = str(partner['longitude'])

        async_to_sync(channel_layer.group_send)(group_name, {
            "type": "send.partner.data",
            "partners": updated_partners,  # Send the updated partner list
        })
#singalss to update stars whnen a new reviews create 
#__________________________________________________________________________________________
@receiver(post_save, sender=Review)
def update_stars(sender, instance, created, **kwargs):
    if created:  # When a new review is created
        # Calculate the total stars and the number of reviews for the user
        reviews = Review.objects.filter(user=instance.user)
        total_stars = reviews.aggregate(total=Sum('stars'))['total']
        total_reviews = reviews.count()
        user=CustomUser.objects.get(id=instance.user.id)

        # Calculate the new average rating
        if total_reviews > 0:
            new_avg_rating = total_stars / total_reviews
            user.rating=new_avg_rating
            user.save()

            # Update the user's rating (assuming you have a 'rating' field on the CustomUser model)
#real time update langtitude and langitude of partener 
# @receiver(post_save, sender=Partenneur)
# def send_partner_update(sender, instance, **kwargs):
#     close_old_connections()  # Fix SQLite connection issues
#     channel_layer = get_channel_layer()
    
#     active_rides = instance.coursa_set.filter(
#         etat__in=['en_cours', 'en_attente']
#     )
    
#     for ride in active_rides:
#         async_to_sync(channel_layer.group_send)(
#             f'ride_{ride.id}',
#             {
#                 'type': 'force_refresh',
#                 'ride_id': ride.id
#             }
#         )

@receiver(post_save, sender=Coursa)
def send_etat_update(sender, instance, **kwargs):
    @sync_to_async
    def async_handler():
        close_old_connections()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'ride_{instance.id}',
            {'type': 'refresh_ride', 'ride_id': instance.id}
        )
        close_old_connections()
    
    # Run in thread pool
    import threading
    thread = threading.Thread(target=async_handler)
    thread.start()

#calculler le revenuuu 

# @receiver(post_save, sender=Coursa)
# def update_revenue(sender, instance, created, **kwargs):
#     if created :
#         # Query for a Remise where instance.partener is in the inviteurs field
#         remise = Remise.objects.filter(inviteurs=instance.partener).first()
#         if remise is not None:
#             # Assuming 'revunu' is the revenue field (note the field name in Remise)
#             remise.revunu = instance.tax_tawsile * 0.02
#             remise.save()

# @receiver(post_save,sender=Coursa)
# def test_notiifcaruion (sender,instance,created, **kwargs):
#     if created :
        
#         channel_layer = get_channel_layer()
#         notification=Notication_choffeur.objects.create(
#             partenneur=instance.partener,
#             read=False,
#             messgae='Your notification message',

#         )
#         async_to_sync(channel_layer.group_send)(
#         f'notification_chauffeur_{instance.partener.user.pk}',
#         {
#             'type': 'send_notification_7days',
#             'message': notification.message,
#             'date': notification.date_creation
#         }
#     )
 