import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler import util
from django.core.management import call_command
from django.conf import settings

logger = logging.getLogger(__name__)

def daily_crawl_job():
    """
    Job function that runs the crawl worker command
    """
    try:
        logger.info("Starting daily crawl job...")
        call_command('crawl_worker')
        logger.info("Daily crawl job completed successfully")
    except Exception as e:
        logger.error(f"Error in daily crawl job: {e}")

@util.close_old_connections
def delete_old_job_executions(max_age=604_800):
    """
    Delete old job executions to prevent database from filling up
    """
    from django_apscheduler.models import DjangoJobExecution
    DjangoJobExecution.objects.delete_old_job_executions(max_age)

def start_scheduler():
    """
    Start the APScheduler with the daily crawl job
    """
    if settings.DEBUG:
        logger.info("Skipping scheduler start in DEBUG mode")
        return

    scheduler = BackgroundScheduler()
    scheduler.add_jobstore(DjangoJobStore(), "default")
    
    # Schedule the daily crawl job at 10 PM Vietnam time
    scheduler.add_job(
        daily_crawl_job,
        trigger=CronTrigger(
            hour=22, 
            minute=0, 
            timezone=pytz.timezone('Asia/Ho_Chi_Minh')
        ),
        id="daily_crawl_job",
        max_instances=1,
        replace_existing=True,
    )
    
    # Optional: Clean up old job executions weekly
    scheduler.add_job(
        delete_old_job_executions,
        trigger=CronTrigger(
            day_of_week="mon", 
            hour="00", 
            minute="00"
        ),
        id="delete_old_job_executions",
        max_instances=1,
        replace_existing=True,
    )
    
    try:
        logger.info("Starting scheduler...")
        scheduler.start()
    except Exception as e:
        logger.error(f"Error starting scheduler: {e}")
        scheduler.shutdown()