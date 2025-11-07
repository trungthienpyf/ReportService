# app/cron_manager.py
import threading
import time
import schedule
from django.core.management import call_command
import logging
from datetime import datetime
import pytz

logger = logging.getLogger(__name__)

class CronManager:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CronManager, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            self.is_running = False
            self.thread = None
            self._initialized = True

    def run_crawl_job(self):
        """Chạy crawl worker command"""
        try:
            vietnam_tz = pytz.timezone('Asia/Ho_Chi_Minh')
            now = datetime.now(vietnam_tz)
            logger.info(f"{now.strftime('%H:%M')} - Tự động chạy crawl_worker")
            
            call_command('crawl_worker', '--no-loop')
            
            logger.info("✅ Hoàn thành crawl_worker")
        except Exception as e:
            logger.error(f"Lỗi khi chạy crawl_worker: {str(e)}")

    def schedule_jobs(self):
        """Lên lịch các cron jobs"""
        # Xóa tất cả jobs cũ
        schedule.clear()
        
        # Chạy lúc 22:00 hàng ngày (giờ Việt Nam)
        schedule.every().day.at("22:00").do(self.run_crawl_job)
        
        logger.info("Đã lên lịch crawl_worker chạy lúc 22:00 hàng ngày")

    def run_pending_jobs(self):
        """Chạy các jobs đã đến giờ trong background"""
        logger.info("Background cron thread đã khởi động")
        
        while self.is_running:
            try:
                schedule.run_pending()
            except Exception as e:
                logger.error(f"Lỗi khi chạy scheduled jobs: {str(e)}")
            
            # Kiểm tra mỗi 60 giây
            time.sleep(60)

    def start(self):
        """Bắt đầu cron manager"""
        if self.is_running:
            logger.warning("Cron Manager đã chạy từ trước")
            return
        
        self.is_running = True
        self.schedule_jobs()
        
        # Khởi động thread để chạy background
        self.thread = threading.Thread(
            target=self.run_pending_jobs, 
            daemon=True,  # Thread sẽ tự động dừng khi main thread dừng
            name="CronScheduler"
        )
        self.thread.start()
        
        logger.info("Cron Manager đã khởi động - Sẽ chạy crawl_worker lúc 22:00 hàng ngày")

    def stop(self):
        """Dừng cron manager"""
        if not self.is_running:
            return
            
        self.is_running = False
        schedule.clear()
        
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=5)
            
        logger.info("⏹️ Cron Manager đã dừng")

cron_manager = CronManager()