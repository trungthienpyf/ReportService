from django.apps import AppConfig
import os
import logging

logger = logging.getLogger(__name__)

class AppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app'


    def ready(self):
        """Được gọi khi Django khởi động"""
        # Chỉ chạy trong main process, tránh chạy 2 lần khi debug mode
        if os.environ.get('RUN_MAIN') == 'true' or not os.environ.get('DJANGO_AUTO_RELOAD'):
            try:
                from .cron_manager import cron_manager
                cron_manager.start()
                logger.info("Cron Manager đã khởi động cùng Django server")
            except Exception as e:
                logger.error(f"Lỗi khi khởi động Cron Manager: {str(e)}")