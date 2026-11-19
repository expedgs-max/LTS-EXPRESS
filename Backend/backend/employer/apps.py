from django.apps import AppConfig


class EmployerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'employer'
    def ready(self):
        import employer.signals 
        from employer.task import start_scheduler  # Import scheduler function
        start_scheduler()
