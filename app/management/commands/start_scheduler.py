import logging
from django.core.management.base import BaseCommand
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django.conf import settings
import pytz
import atexit

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Start the APScheduler for scheduled tasks'
    
    def handle(self, *args, **options):
        self.stdout.write("Starting APScheduler...")
        
        scheduler = BackgroundScheduler()
        vietnam_tz = pytz.timezone('Asia/Ho_Chi_Minh')
        
        # Schedule your crawl job for 8:00 PM Vietnam time daily
        scheduler.add_job(
            self.run_crawl_job,
            trigger=CronTrigger(hour=20, minute=0, timezone=vietnam_tz),  # 8:00 PM Vietnam time
            id='daily_crawl',
            name='Daily data crawl at 8:00 PM',
            replace_existing=True
        )
        
        # Start the scheduler
        scheduler.start()
        logger.info("Scheduler started with daily job at 8:00 PM Vietnam time")
        
        # Register shutdown hook
        atexit.register(lambda: scheduler.shutdown())
        
        # Keep the process running
        try:
            self.stdout.write(
                self.style.SUCCESS(
                    "Scheduler started successfully! Daily crawl scheduled at 8:00 PM Vietnam time."
                )
            )
            # Keep the main thread alive
            while True:
                pass
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING("Shutting down scheduler..."))
            scheduler.shutdown()
    
    def run_crawl_job(self):
        from django.core.management import call_command
        logger.info("Executing scheduled crawl job...")
        try:
            call_command('crawl_worker')
            logger.info("Crawl job completed successfully")
        except Exception as e:
            logger.error(f"Crawl job failed: {e}")