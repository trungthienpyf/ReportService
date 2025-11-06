from django.apps import AppConfig
import os

class AppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app'

    def ready(self):
        # Import here to avoid AppRegistryNotReady exception
        if os.environ.get('RUN_MAIN') or not os.environ.get('DJANGO_RUNNING_MIGRATIONS'):
            try:
                from app.scheduler import start_scheduler
                start_scheduler()
            except Exception as e:
                # Log the error but don't crash the app
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Could not start scheduler: {e}")
