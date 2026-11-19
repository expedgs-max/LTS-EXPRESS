from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.db.models import Sum
from decimal import Decimal
import logging
from .models import *


logger = logging.getLogger(__name__)

tax_pay_partener = 0.20
from django.utils.timezone import now

@receiver(pre_save, sender=Coursa)
def detect_etat_and_paye_change(sender, instance, **kwargs):
    """
    Pre-save signal to detect changes in 'etat' and 'paye'.
    Saves the previous state to use in the post_save signal.
    """
    if instance.pk:  # Update scenario
        previous = Coursa.objects.filter(pk=instance.pk).first()
        if previous:
            instance._previous_etat = previous.etat
            instance._previous_paye = previous.paye
        else:
            instance._previous_etat = None
            instance._previous_paye = None
    else:  # New instance
        instance._previous_etat = None
        instance._previous_paye = None


@receiver(post_save, sender=Coursa)
def handle_payment_updates(sender, instance, created, **kwargs):
    """
    Post-save signal to handle payment updates based on 'etat' and 'paye' changes.
    """
    partner = instance.partener
    payment, _ = Payment.objects.get_or_create(partner=partner)

    # Handle courses transitioning to 'terminee'
    if instance._previous_etat != 'terminee' and instance.etat == 'terminee':
        unpaid_courses = Coursa.objects.filter(partener=partner, etat='terminee', paye=False)
        total_tax = unpaid_courses.aggregate(Sum('prix'))['prix__sum'] or 0
        payment.total_tax_tawsile = Decimal(total_tax) * Decimal(tax_pay_partener)
        
        payment.save()

    # Handle courses being marked as paid
    if instance._previous_paye is False and instance.paye is True:
        deduction = Decimal(instance.prix) * Decimal(tax_pay_partener)
        payment.total_tax_tawsile -= deduction
        payment.total_tax_tawsile = max(payment.total_tax_tawsile, Decimal('0.00'))  # Ensure no negative values
        logger.info(f"Partner {partner.id}: Deducted {deduction} for paid course. New total: {payment.total_tax_tawsile}.")
        payment.save()

    # Handle courses being marked as unpaid again
    if instance._previous_paye is True and instance.paye is False:
        unpaid_courses = Coursa.objects.filter(partener=partner, etat='terminee', paye=False)
        total_tax = unpaid_courses.aggregate(Sum('prix'))['prix__sum'] or 0
        payment.total_tax_tawsile = Decimal(total_tax) * Decimal(tax_pay_partener)
        logger.info(f"Partner {partner.id}: Total unpaid tax recalculated after unmarking paid. New total: {payment.total_tax_tawsile}.")
        payment.save()

    # Ensure the payment is updated after any change to `paye`
    payment.save()

@receiver(post_save, sender=Coursa)
def update_payment_etat_on_paye_change(sender, instance, created, **kwargs):
    """
    Post-save signal to update the 'etat' of related Payment_Par_partener instances
    to 'accepte' when 'paye' is set to True in Coursa.
    """
    # Check if 'paye' is set to True and the previous value was False (or None)
    if instance.paye and instance._previous_paye is not True:
        # Find all Payment_Par_partener instances related to this Coursa
        payments = Payment_Par_partener.objects.filter(courses=instance)

        for payment in payments:
            # Update the 'etat' field of Payment_Par_partener to 'accepte'
            payment.etat = 'accepte'
            payment.save()

            # Log the change for debugging purposes
            logger.info(f"Payment {payment.id} for partner {payment.partner.id} has been marked as 'accepte'.")
@receiver(pre_save, sender=CustomUser)
def store_old_is_active(sender, instance, **kwargs):
    """
    Store the previous value of the is_active field.
    """
    if instance.pk:  # Only for existing users
        previous_instance = CustomUser.objects.get(pk=instance.pk)
        instance._old_is_active = previous_instance.is_active
    else:
        instance._old_is_active = None


# @receiver(post_save, sender=CustomUser)
# def create_action_for_superviseur(sender, instance, created, **kwargs):
#     """
#     Signal that triggers when a superviseur's 'is_active' field is updated.
#     It creates an Action_Superviseur record every time is_active is changed.
#     """
#     # Ensure we're not creating a new user (we care only about updates to existing users)
#     if not created:
#         try:
#             user = get_current_user()
#             # Get the previous value of is_active from custom attribute
#             previous_is_active = getattr(instance, '_old_is_active', None)

#             # Compare previous and current is_active field
#             if previous_is_active != instance.is_active:
#                 print(f"is_active has changed! (Previous: {previous_is_active}, Current: {instance.is_active})")

#                 # Create the Action_Superviseur record
#                 Action_Superviseur.objects.create(
                    
#                      # Assuming you have a related 'partenneur'
#                     date=now()  # Current timestamp when the action happens
#                 )
#         except Exception as e:
#             print(f"Error creating Action_Superviseur: {e}")
#________________________________singals for creating Action_Superviseur_________________
@receiver(pre_save,sender=Flixy)
def actions_centre_appel (sender, instance, **kwargs):
    
    if instance.pk:  # Update scenario
        previous = Flixy.objects.filter(pk=instance.pk).first()
        if previous and previous.etat == 'en_attente' and instance.etat == 'accepte':
            # Create the Actions_centre_appel_flixy record
            Actions_centre_appel_flixy.objects.create(
                centre_appel=instance.centre_appel,


                prix=instance.somme,
                prix_a_envoye=instance.somme_a_envoye,
                superviseur=instance.superviseur,


                etat="accepte",
                data_de_creation=now()  
            )

#singals pour creation de remise automatioque 
from employer.models import generate_random_code
@receiver(post_save, sender=Partenneur)  # <-- Use post_save here
def remise_automatique(sender, instance, created, **kwargs):
    if created:  # Only for newly created instances
        Remise.objects.create(
            partenneur=instance,  # Directly assign the instance (not partenneur__id)
            pourcentage=2,
            code_invitation=generate_random_code(8),
            revunu=0
        )

@receiver(post_save, sender=Coursa)
def create_historique_coursa(sender, instance, created, **kwargs):
    """
    Create a HistoriqueCoursa record when the 'etat' of a Coursa changes.
    """
    if not created:  # Only for updates, not new instances
        if hasattr(instance, '_previous_etat') and instance._previous_etat != instance.etat:  # Check if 'etat' has changed
            HistoriqueCoursa.objects.create(
                coursa=instance,
                client=instance.client,
                etat=instance.etat,
                previous_etat=instance._previous_etat,
                partenneur=instance.partener,
            )
