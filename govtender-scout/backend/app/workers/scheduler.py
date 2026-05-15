import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.workers.daily_job import run_daily_pipeline

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = AsyncIOScheduler(timezone='Asia/Kolkata')


def start_scheduler():
    """
    Start the APScheduler with all configured jobs.
    Call this during FastAPI startup.
    """
    # Daily tender scraping and notification pipeline
    # Runs at 6:00 AM IST every day
    scheduler.add_job(
        run_daily_pipeline,
        trigger=CronTrigger(hour=6, minute=0),
        id='daily_pipeline',
        name='Daily Tender Pipeline',
        replace_existing=True,
        misfire_grace_time=3600  # 1 hour grace period
    )
    
    # Deadline alert job
    # Runs at 9:00 AM and 6:00 PM IST to check for tenders closing in 72h
    scheduler.add_job(
        run_deadline_alerts,
        trigger=CronTrigger(hour=9, minute=0),
        id='deadline_alerts_morning',
        name='Morning Deadline Alerts',
        replace_existing=True
    )
    
    scheduler.add_job(
        run_deadline_alerts,
        trigger=CronTrigger(hour=18, minute=0),
        id='deadline_alerts_evening',
        name='Evening Deadline Alerts',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler started with daily pipeline at 6:00 AM IST")


def stop_scheduler():
    """Stop the scheduler during shutdown."""
    scheduler.shutdown(wait=False)
    logger.info("Scheduler stopped")


async def run_deadline_alerts():
    """
    Send deadline alerts for tenders closing within 72 hours.
    This is a placeholder - implement based on requirements.
    """
    from datetime import datetime, timedelta
    from sqlalchemy import select, and_
    from app.database import async_session_maker
    from app.models import User, Tender, UserTenderAction
    from app.notifications.email import send_deadline_alert_email
    from app.notifications.whatsapp import send_deadline_alert_whatsapp
    
    logger.info("Running deadline alert job...")
    
    now = datetime.utcnow()
    deadline_threshold = now + timedelta(hours=72)
    
    async with async_session_maker() as db:
        # Find tenders closing within 72 hours
        query = (
            select(Tender)
            .where(
                and_(
                    Tender.is_active == True,
                    Tender.deadline > now,
                    Tender.deadline <= deadline_threshold
                )
            )
        )
        result = await db.execute(query)
        urgent_tenders = result.scalars().all()
        
        if not urgent_tenders:
            logger.info("No urgent deadlines found")
            return
        
        # Get users who haven't acted on these tenders
        for tender in urgent_tenders:
            days_left = (tender.deadline - now).days
            
            # Find interested users (simplified - would use matching engine in production)
            user_query = (
                select(User)
                .where(User.plan.in_(['basic', 'pro', 'agency']))
            )
            user_result = await db.execute(user_query)
            users = user_result.scalars().all()
            
            alerted = 0
            for user in users:
                # Check if user already acted on this tender
                action_query = select(UserTenderAction).where(
                    and_(
                        UserTenderAction.user_id == user.id,
                        UserTenderAction.tender_id == tender.id
                    )
                )
                action_result = await db.execute(action_query)
                if action_result.scalar_one_or_none():
                    continue  # User already acted
                
                # Send alert
                if user.email_enabled:
                    await send_deadline_alert_email(user, tender, days_left)
                
                if user.wa_enabled and user.plan in ['pro', 'agency']:
                    await send_deadline_alert_whatsapp(user, tender, days_left)
                
                alerted += 1
            
            logger.info(f"Alerted {alerted} users about tender {tender.tender_id}")
    
    logger.info(f"Deadline alert job completed. Found {len(urgent_tenders)} urgent tenders.")
