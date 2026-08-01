from apscheduler.schedulers.background import BackgroundScheduler

from app.services.news_fetch_service import fetch_latest_news

scheduler = BackgroundScheduler()


def start_scheduler():

    if scheduler.running:
        return

    scheduler.add_job(
        fetch_latest_news,
        trigger="interval",
        minutes=1,          # <-- Use 1 minute for testing
        id="fetch_news",
        replace_existing=True
    )

    scheduler.start()

    print("✅ News Scheduler Started")