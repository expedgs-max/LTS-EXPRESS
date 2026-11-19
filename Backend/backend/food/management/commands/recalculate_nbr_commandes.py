"""
Commande de management pour recalculer nbr_commandes sur tous les CustomUser existants.

Usage:
    python manage.py recalculate_nbr_commandes
"""
from django.core.management.base import BaseCommand
from django.db.models import Q, Count


class Command(BaseCommand):
    help = "Recalcule et met à jour le champ nbr_commandes pour tous les utilisateurs (commandes livrées)"

    def handle(self, *args, **options):
        from employer.models import CustomUser
        from food.models import Commande

        users = CustomUser.objects.all()
        total = users.count()
        updated = 0
        errors = 0

        self.stdout.write(f"Traitement de {total} utilisateurs...")

        for user in users.iterator():
            try:
                client_count = Commande.objects.filter(client=user, status='delivered').count()
                livreur_count = Commande.objects.filter(
                    livreur__partenneur__user=user, status='delivered'
                ).count()
                magasin_count = Commande.objects.filter(
                    magasin__owner__user=user, status='delivered'
                ).count()

                nbr = client_count + livreur_count + magasin_count

                if user.nbr_commandes != nbr:
                    CustomUser.objects.filter(pk=user.pk).update(nbr_commandes=nbr)
                    updated += 1

            except Exception as e:
                errors += 1
                self.stderr.write(f"  Erreur pour user #{user.pk}: {e}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Terminé ! {updated} utilisateurs mis à jour sur {total}. "
                f"{errors} erreur(s)."
            )
        )
