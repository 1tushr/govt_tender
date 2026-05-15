import logging
from datetime import datetime
from typing import List
from app.models import Tender, User

logger = logging.getLogger(__name__)


async def send_digest_whatsapp(user: User, tenders: List[Tender]) -> bool:
    """
    Send tender digest via WhatsApp (FREE MODE).
    
    Since WATI/paid WhatsApp APIs require approval and payment,
    this function logs the message for manual sending or can be
    connected to free alternatives like:
    - Twilio WhatsApp (free trial available)
    - Meta WhatsApp Cloud API (free tier: 1000 conversations/month)
    - Manual copy-paste from logs
    
    Returns True to avoid breaking pipeline even if not configured.
    """
    if not user.wa_enabled or not user.phone_wa or not tenders:
        return False
    
    # Log the message for manual sending or future integration
    user_name = user.business_name or user.email.split('@')[0]
    message = _build_whatsapp_message(tenders, user_name)
    
    logger.info("=" * 60)
    logger.info(f"WHATSAPP DIGEST (Manual Send)")
    logger.info(f"To: {user.phone_wa}")
    logger.info(f"User: {user.email}")
    logger.info("-" * 60)
    logger.info(message)
    logger.info("=" * 60)
    
    # In production with Meta WhatsApp Cloud API:
    # - Get free token from developers.facebook.com
    # - Use requests to send template messages
    # - Free tier: 1000 service conversations/month
    
    logger.warning("WhatsApp not configured - message logged above")
    return True  # Return True to avoid breaking pipeline


def _build_whatsapp_message(tenders: List[Tender], user_name: str) -> str:
    """Build WhatsApp message content for tender digest."""
    lines = []
    
    # Header
    lines.append(f"Hi {user_name}, here are your {len(tenders)} tender matches for today:\n")
    
    # List top 5 tenders (WhatsApp message length limits)
    for i, tender in enumerate(tenders[:5], 1):
        title = tender.title[:50] + '...' if len(tender.title) > 50 else tender.title
        
        if tender.deadline:
            days_left = (tender.deadline - datetime.utcnow()).days
            deadline_str = f"{days_left} days"
        else:
            deadline_str = "TBD"
        
        lines.append(f"{i}. *{title}*")
        lines.append(f"   Portal: {tender.portal.upper()} | Closes in: {deadline_str}")
        if tender.value_min:
            lines.append(f"   Value: ₹{tender.value_min:,}")
        lines.append("")
    
    # Footer if more than 5 tenders
    if len(tenders) > 5:
        lines.append(f"...and {len(tenders) - 5} more on your dashboard")
    
    lines.append("\nView all tenders: https://govtenderscout.com/dashboard")
    
    return '\n'.join(lines)


async def send_deadline_alert_whatsapp(user: User, tender: Tender, days_left: int) -> bool:
    """Send urgent deadline alert via WhatsApp (FREE MODE)."""
    if not user.wa_enabled or not user.phone_wa:
        return False
    
    title = tender.title[:60] + '...' if len(tender.title) > 60 else tender.title
    
    message = f"""⏰ *Deadline Alert*

This tender closes in *{days_left} days*:

*{title}*

Portal: {tender.portal.upper()}
Category: {tender.category or 'N/A'}

View now: https://govtenderscout.com/dashboard?tender={tender.id}"""
    
    logger.info("=" * 60)
    logger.info(f"WHATSAPP ALERT (Manual Send)")
    logger.info(f"To: {user.phone_wa}")
    logger.info(f"Tender: {tender.tender_id}")
    logger.info("-" * 60)
    logger.info(message)
    logger.info("=" * 60)
    
    logger.warning("WhatsApp not configured - message logged above")
    return True
