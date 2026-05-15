from fastapi import APIRouter, Request, HTTPException, status
import hmac
import hashlib
import os
import logging
import json
from sqlalchemy import select
from app.database import async_session_maker
from app.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/api/webhooks', tags=['webhooks'])

# Razorpay plan mapping (optional - only needed if using paid subscriptions)
PLAN_MAP = {
    os.getenv('RZP_PLAN_BASIC', ''): 'basic',
    os.getenv('RZP_PLAN_PRO', ''): 'pro',
    os.getenv('RZP_PLAN_AGENCY', ''): 'agency'
}


@router.post('/razorpay')
async def razorpay_webhook(request: Request):
    """
    Handle Razorpay subscription webhooks.
    Events: subscription.activated, subscription.cancelled, payment.failed
    
    Note: This is optional. Only configure if you're ready to accept payments.
    For free tier, you can skip Razorpay setup entirely.
    """
    # Get signature from headers
    signature = request.headers.get('X-Razorpay-Signature', '')
    
    if not signature:
        logger.warning("Razorpay webhook called without signature")
        return {'status': 'ignored'}
    
    # Get request body
    body = await request.body()
    
    # Verify signature (only if webhook secret is configured)
    webhook_secret = os.getenv('RZP_WEBHOOK_SECRET')
    if webhook_secret:
        expected_signature = hmac.new(
            webhook_secret.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            logger.warning("Invalid webhook signature")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature"
            )
    else:
        logger.info("RZP_WEBHOOK_SECRET not configured, skipping signature verification")
    
    # Parse event data
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON"
        )
    
    event = data.get('event', '')
    payload = data.get('payload', {})
    
    logger.info(f"Received Razorpay webhook event: {event}")
    
    async with async_session_maker() as db:
        if event == 'subscription.activated':
            await handle_subscription_activated(payload, db)
        
        elif event == 'subscription.cancelled':
            await handle_subscription_cancelled(payload, db)
        
        elif event == 'payment.failed':
            await handle_payment_failed(payload, db)
        
        else:
            logger.info(f"Ignoring event type: {event}")
    
    return {'status': 'ok'}


async def handle_subscription_activated(payload: dict, db):
    """Handle subscription activation."""
    try:
        subscription = payload.get('subscription', {}).get('entity', {})
        sub_id = subscription.get('id')
        plan_id = subscription.get('plan_id')
        
        if not sub_id:
            logger.error("No subscription ID in payload")
            return
        
        # Determine plan name
        plan_name = PLAN_MAP.get(plan_id, 'basic')
        
        # Find user by Razorpay subscription ID
        result = await db.execute(
            select(User).where(User.razorpay_sub_id == sub_id)
        )
        user = result.scalar_one_or_none()
        
        if user:
            user.plan = plan_name
            await db.commit()
            logger.info(f"Activated {plan_name} plan for user {user.email}")
        else:
            logger.warning(f"User not found for subscription {sub_id}")
            
    except Exception as e:
        logger.error(f"Error handling subscription activation: {str(e)}")


async def handle_subscription_cancelled(payload: dict, db):
    """Handle subscription cancellation."""
    try:
        subscription = payload.get('subscription', {}).get('entity', {})
        sub_id = subscription.get('id')
        
        if not sub_id:
            return
        
        # Find user and downgrade to free
        result = await db.execute(
            select(User).where(User.razorpay_sub_id == sub_id)
        )
        user = result.scalar_one_or_none()
        
        if user:
            user.plan = 'free'
            user.wa_enabled = False
            await db.commit()
            logger.info(f"Downgraded user {user.email} to free plan")
        else:
            logger.warning(f"User not found for cancelled subscription {sub_id}")
            
    except Exception as e:
        logger.error(f"Error handling subscription cancellation: {str(e)}")


async def handle_payment_failed(payload: dict, db):
    """Handle payment failure."""
    try:
        payment = payload.get('payment', {}).get('entity', {})
        subscription_id = payment.get('subscription_id')
        
        if not subscription_id:
            return
        
        # Log the failure
        result = await db.execute(
            select(User).where(User.razorpay_sub_id == subscription_id)
        )
        user = result.scalar_one_or_none()
        
        if user:
            logger.warning(f"Payment failed for user {user.email} - subscription {subscription_id}")
            
    except Exception as e:
        logger.error(f"Error handling payment failure: {str(e)}")
