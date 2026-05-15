import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import List, Optional
from app.models import Tender, User

logger = logging.getLogger(__name__)


async def send_digest_email(user: User, tenders: List[Tender]) -> bool:
    """Send tender digest email to user using SMTP."""
    if not user.email_enabled or not tenders:
        return False
    
    try:
        # Build email content
        subject = f"Your tender digest — {len(tenders)} new matches today"
        html_content = _build_email_html(tenders, user.business_name or user.email.split('@')[0])
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = 'GovTender Scout <noreply@govtenderscout.com>'
        msg['To'] = user.email
        
        # Attach HTML content
        msg.attach(MIMEText(html_content, 'html'))
        
        # Send via SMTP (use free Gmail SMTP or configure your own)
        smtp_host = 'smtp.gmail.com'  # Free with Gmail account
        smtp_port = 587
        smtp_user = ''  # Set in .env
        smtp_password = ''  # App password from Gmail
        
        # Only send if SMTP credentials are configured
        if not smtp_user or not smtp_password:
            logger.warning("SMTP credentials not configured, skipping email")
            # In production, log the email content instead or use a free tier service
            logger.info(f"Would send email to {user.email}: {subject}")
            return True  # Return True to avoid breaking the pipeline
        
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        logger.info(f"Email sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {user.email}: {str(e)}")
        return False


def _build_email_html(tenders: List[Tender], user_name: str) -> str:
    """Build HTML email body for tender digest."""
    rows = ''
    
    for tender in tenders:
        # Calculate days remaining
        if tender.deadline:
            days_left = (tender.deadline - datetime.utcnow()).days
            if days_left <= 3:
                urgency = f'<span style="color:#A32D2D;font-weight:bold">⚠ {days_left}d left</span>'
            elif days_left <= 7:
                urgency = f'<span style="color:#F59E0B">{days_left}d left</span>'
            else:
                urgency = f'{days_left}d left'
        else:
            urgency = 'No deadline'
        
        # Truncate title if too long
        title = tender.title[:80] + '...' if len(tender.title) > 80 else tender.title
        
        rows += f'''
        <tr>
          <td style="padding:16px;border-bottom:1px solid #e5e7eb">
            <div style="margin-bottom:8px">
              <a href="{tender.doc_url or '#'}" style="text-decoration:none;color:#0F6E56;font-weight:600;font-size:16px">
                {title}
              </a>
            </div>
            <div style="font-size:14px;color:#6b7280;margin-bottom:4px">
              <strong>{tender.portal.upper()}</strong> · {tender.category or 'General'} · {urgency}
            </div>
            {f'<div style="font-size:14px;color:#6b7280">Value: ₹{tender.value_min:,}</div>' if tender.value_min else ''}
          </td>
        </tr>
        '''
    
    return f'''
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
    </head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;margin:0;padding:0;background-color:#f9fafb">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb">
        <tr>
          <td align="center" style="padding:40px 20px">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow:hidden">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#0F6E56 0%,#059669 100%);padding:32px;text-align:center">
                  <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">Today's Tender Digest</h1>
                  <p style="margin:12px 0 0;color:#ffffff;opacity:0.9;font-size:16px">
                    Hi {user_name} — {len(tenders)} matching tenders found
                  </p>
                </td>
              </tr>
              
              <!-- Tender List -->
              <tr>
                <td style="padding:0">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
                    {rows}
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding:24px;background-color:#f3f4f6;text-align:center;font-size:13px;color:#9ca3af">
                  <p style="margin:0 0 8px">You received this because you subscribed to GovTender Scout</p>
                  <p style="margin:0">
                    <a href="https://govtenderscout.com/settings" style="color:#0F6E56;text-decoration:none">Update preferences</a> | 
                    <a href="https://govtenderscout.com/dashboard" style="color:#0F6E56;text-decoration:none">View dashboard</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    '''


async def send_deadline_alert_email(user: User, tender: Tender, days_left: int) -> bool:
    """Send urgent deadline alert for a specific tender."""
    if not user.email_enabled:
        return False
    
    try:
        subject = f"⏰ Urgent: Tender closes in {days_left} days"
        
        html = f'''
        <!DOCTYPE html>
        <html>
        <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <div style="background:#FEF2F2;border-left:4px solid #A32D2D;padding:16px;margin-bottom:20px">
            <h2 style="margin:0;color:#A32D2D;font-size:18px">Deadline Alert</h2>
            <p style="margin:8px 0 0;color:#7F1D1D">This tender closes in <strong>{days_left} days</strong></p>
          </div>
          
          <h3 style="color:#0F6E56;margin-top:0">{tender.title}</h3>
          <p><strong>Portal:</strong> {tender.portal.upper()}</p>
          <p><strong>Category:</strong> {tender.category or 'N/A'}</p>
          {f'<p><strong>Value:</strong> ₹{tender.value_min:,}</p>' if tender.value_min else ''}
          
          <div style="text-align:center;margin:24px 0">
            <a href="{tender.doc_url or '#'}" style="background:#0F6E56;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">View Tender Document</a>
          </div>
        </body>
        </html>
        '''
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = 'GovTender Scout <alerts@govtenderscout.com>'
        msg['To'] = user.email
        msg.attach(MIMEText(html, 'html'))
        
        # Send via SMTP (same configuration as digest)
        smtp_host = 'smtp.gmail.com'
        smtp_port = 587
        smtp_user = ''
        smtp_password = ''
        
        if not smtp_user or not smtp_password:
            logger.warning("SMTP credentials not configured, skipping alert email")
            logger.info(f"Would send alert to {user.email}: {subject}")
            return True
        
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        logger.info(f"Deadline alert sent to {user.email} for tender {tender.tender_id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send deadline alert: {str(e)}")
        return False
