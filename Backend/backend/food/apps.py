from django.apps import AppConfig


class FoodConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'food'
    def ready(self):
        import food.signals
        try:
            from .models import Livreur
            Livreur.objects.all().update(is_available=False)
        except Exception:
            pass  
