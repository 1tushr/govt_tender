import asyncio
import logging
from datetime import datetime
from sqlalchemy import select, and_
from app.database import async_session_maker
from app.models import Tender, User, DigestLog
from app.scrapers.cppp import CpppScraper
from app.scrapers.gem import GemScraper
from app.parsers.pdf_extractor import download_and_extract
from app.parsers.ai_parser import parse_eligibility, validate_eligibility
from app.matching.engine import match_tenders_for_user
from app.notifications.email import send_digest_email, configure_resend
from app.notifications.whatsapp import send_digest_whatsapp
from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()


async def run_daily_pipeline():
    """
    Main daily pipeline that:
    1. Scrapes all portals for new tenders
    2. Parses PDF documents with AI
    3. Matches tenders to users
    4. Sends notifications
    """
    logger.info("=" * 60)
    logger.info("DAILY PIPELINE STARTED")
    logger.info(f"Timestamp: {datetime.utcnow().isoformat()}")
    logger.info("=" * 60)
    
    try:
        # Configure services
        if settings.RESEND_API_KEY:
            configure_resend(settings.RESEND_API_KEY)
        
        # Step 1: Scrape all portals
        logger.info("\n[STEP 1] Scraping tender portals...")
        scrapers = [
            CpppScraper(),
            GemScraper()
        ]
        
        total_scraped = 0
        for scraper in scrapers:
            try:
                count = await scraper.run()
                logger.info(f"  ✓ {scraper.PORTAL.upper()}: {count} tenders scraped")
                total_scraped += count
            except Exception as e:
                logger.error(f"  ✗ {scraper.PORTAL.upper()} failed: {str(e)}")
        
        logger.info(f"Total scraped: {total_scraped}")
        
        # Step 2: Parse unparsed tenders with AI
        logger.info("\n[STEP 2] Parsing tender documents with AI...")
        async with async_session_maker() as db:
            # Get tenders that haven't been parsed yet
            query = (
                select(Tender)
                .where(
                    and_(
                        Tender.parsed_at.is_(None),
                        Tender.doc_url.isnot(None),
                        Tender.is_active == True
                    )
                )
                .limit(50)  # Rate limit AI calls
            )
            result = await db.execute(query)
            unparsed_tenders = result.scalars().all()
        
        parsed_count = 0
        for tender in unparsed_tenders:
            try:
                logger.info(f"  Parsing tender {tender.tender_id}...")
                
                # Download and extract text from PDF
                raw_text = await download_and_extract(tender.doc_url, str(tender.id))
                
                if raw_text:
                    # Parse eligibility with AI
                    eligibility = await parse_eligibility(raw_text)
                    
                    if 'error' not in eligibility:
                        eligibility = validate_eligibility(eligibility)
                    
                    # Update tender record
                    async with async_session_maker() as db:
                        tender.raw_text = raw_text
                        tender.eligibility = eligibility
                        tender.parsed_at = datetime.utcnow()
                        await db.commit()
                    
                    parsed_count += 1
                    logger.info(f"  ✓ Parsed successfully")
                else:
                    logger.warning(f"  ✗ No text extracted")
                
                # Rate limit AI API calls
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"  ✗ Failed to parse {tender.tender_id}: {str(e)}")
        
        logger.info(f"Total parsed: {parsed_count}")
        
        # Step 3: Match and notify users
        logger.info("\n[STEP 3] Matching tenders and sending notifications...")
        async with async_session_maker() as db:
            # Get all active paid users
            query = select(User).where(
                and_(
                    User.plan.in_(['basic', 'pro', 'agency']),
                    User.email_enabled == True
                )
            )
            result = await db.execute(query)
            paid_users = result.scalars().all()
        
        notified_count = 0
        for user in paid_users:
            try:
                async with async_session_maker() as db:
                    matches = await match_tenders_for_user(user, db)
                
                if not matches:
                    logger.info(f"  - {user.email}: No matches")
                    continue
                
                # Send email digest
                email_sent = False
                if user.email_enabled:
                    email_sent = await send_digest_email(user, matches)
                    logger.info(f"  {'✓' if email_sent else '✗'} Email to {user.email}: {len(matches)} matches")
                
                # Send WhatsApp digest (Pro/Agency only)
                wa_sent = False
                if user.wa_enabled and user.plan in ['pro', 'agency']:
                    wa_sent = await send_digest_whatsapp(user, matches)
                    logger.info(f"  {'✓' if wa_sent else '✗'} WhatsApp to {user.phone_wa}")
                
                # Log digest
                if email_sent or wa_sent:
                    async with async_session_maker() as db:
                        digest_log = DigestLog(
                            user_id=user.id,
                            channel='email' if email_sent else 'whatsapp',
                            tender_ids=[str(t.id) for t in matches],
                            status='sent' if (email_sent or wa_sent) else 'failed'
                        )
                        db.add(digest_log)
                        user.last_digest_at = datetime.utcnow()
                        await db.commit()
                    
                    notified_count += 1
                
            except Exception as e:
                logger.error(f"  ✗ Failed to notify {user.email}: {str(e)}")
        
        logger.info(f"Total notified: {notified_count}/{len(paid_users)}")
        
        # Step 4: Cleanup old data
        logger.info("\n[STEP 4] Cleaning up old data...")
        # Could add logic here to archive old tenders, clean logs, etc.
        
        logger.info("\n" + "=" * 60)
        logger.info("DAILY PIPELINE COMPLETED SUCCESSFULLY")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"PIPELINE FAILED: {str(e)}", exc_info=True)
        raise
