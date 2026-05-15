from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from app.database import async_session_maker
from app.models import User, Tender, UserTenderAction, DigestLog

router = APIRouter(prefix='/api/users', tags=['users'])


class ProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    phone_wa: Optional[str] = None
    keywords: List[str] = []
    categories: List[str] = []
    states: List[str] = []
    value_min: int = 0
    value_max: int = 9999999999
    wa_enabled: bool = False
    email_enabled: bool = True


class UserProfileResponse(BaseModel):
    id: str
    email: str
    business_name: Optional[str]
    phone_wa: Optional[str]
    plan: str
    keywords: List[str]
    categories: List[str]
    states: List[str]
    value_min: int
    value_max: int
    wa_enabled: bool
    email_enabled: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


async def get_current_user(supabase_uid: str = Header(...)) -> User:
    """
    Dependency to get current user from Supabase UID.
    In production, verify JWT token from Supabase.
    """
    async with async_session_maker() as db:
        result = await db.execute(
            select(User).where(User.supabase_uid == supabase_uid)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return user


@router.get('/profile', response_model=UserProfileResponse)
async def get_profile(user: User = Depends(get_current_user)):
    """Get current user's profile."""
    return user


@router.put('/profile', response_model=UserProfileResponse)
async def update_profile(
    data: ProfileUpdate,
    user: User = Depends(get_current_user)
):
    """Update user profile and preferences."""
    async with async_session_maker() as db:
        # Update user fields
        update_data = data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        await db.commit()
        await db.refresh(user)
    
    return user


@router.get('/tenders')
async def get_user_tenders(
    action: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    user: User = Depends(get_current_user)
):
    """Get tenders for current user with optional action filter."""
    async with async_session_maker() as db:
        query = (
            select(Tender)
            .join(UserTenderAction)
            .where(UserTenderAction.user_id == user.id)
            .order_by(Tender.deadline.asc())
            .offset(offset)
            .limit(limit)
        )
        
        if action:
            query = query.where(UserTenderAction.action == action)
        
        result = await db.execute(query)
        tenders = result.scalars().all()
        
        return {
            'tenders': tenders,
            'total': len(tenders),
            'limit': limit,
            'offset': offset
        }


@router.post('/tenders/{tender_id}/action')
async def set_tender_action(
    tender_id: str,
    action: str,  # 'applied', 'watching', 'skip'
    user: User = Depends(get_current_user)
):
    """Mark a tender with an action (applied/watching/skip)."""
    if action not in ['applied', 'watching', 'skip']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action. Must be 'applied', 'watching', or 'skip'"
        )
    
    async with async_session_maker() as db:
        # Upsert action
        stmt = (
            insert(UserTenderAction)
            .values(
                user_id=user.id,
                tender_id=tender_id,
                action=action,
                noted_at=datetime.utcnow()
            )
            .on_conflict_do_update(
                index_elements=['user_id', 'tender_id'],
                set_={'action': action, 'noted_at': datetime.utcnow()}
            )
        )
        await db.execute(stmt)
        await db.commit()
    
    return {'status': 'success', 'action': action}


@router.get('/digests')
async def get_digest_history(
    limit: int = 30,
    user: User = Depends(get_current_user)
):
    """Get user's digest send history."""
    async with async_session_maker() as db:
        result = await db.execute(
            select(DigestLog)
            .where(DigestLog.user_id == user.id)
            .order_by(DigestLog.sent_at.desc())
            .limit(limit)
        )
        digests = result.scalars().all()
        
        return {
            'digests': digests,
            'total': len(digests)
        }
