import atexit
import logging
from apscheduler.schedulers.background import BackgroundScheduler

from app.config.config import Config
from app.services.news_fetch_service import fetch_latest_news

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("News Scheduler shut down successfully")


def start_scheduler():

    if scheduler.running:
        return

    interval_minutes = Config.NEWS_FETCH_INTERVAL_MINUTES

    scheduler.add_job(
        fetch_latest_news,
        trigger="interval",
        minutes=interval_minutes,
        id="fetch_news",
        replace_existing=True
    )

    scheduler.start()
    atexit.register(shutdown_scheduler)

    logger.info(f"News Scheduler Started (Interval: {interval_minutes} minutes)")