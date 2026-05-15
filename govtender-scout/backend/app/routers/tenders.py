from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy import select, and_
from app.database import async_session_maker
from app.models import Tender
from app.matching.engine import calculate_eligibility_score

router = APIRouter(prefix='/api/tenders', tags=['tenders'])


class TenderResponse(BaseModel):
    id: str
    tender_id: str
    portal: str
    title: str
    category: Optional[str]
    state: Optional[str]
    value_min: Optional[int]
    value_max: Optional[int]
    deadline: Optional[datetime]
    doc_url: Optional[str]
    eligibility: Optional[dict]
    scraped_at: datetime
    match_score: Optional[int] = None
    
    class Config:
        from_attributes = True


@router.get('/', response_model=List[TenderResponse])
async def list_tenders(
    portal: Optional[str] = None,
    category: Optional[str] = None,
    state: Optional[str] = None,
    min_value: Optional[int] = None,
    max_value: Optional[int] = None,
    days_until_deadline: Optional[int] = None,
    limit: int = 50,
    offset: int = 0
):
    """List tenders with optional filters."""
    async with async_session_maker() as db:
        query = select(Tender).where(Tender.is_active == True)
        
        # Apply filters
        if portal:
            query = query.where(Tender.portal == portal)
        
        if category:
            query = query.where(Tender.category.ilike(f'%{category}%'))
        
        if state:
            query = query.where(Tender.state == state)
        
        if min_value:
            query = query.where(
                (Tender.value_min >= min_value) | (Tender.value_min.is_(None))
            )
        
        if max_value:
            query = query.where(
                (Tender.value_max <= max_value) | (Tender.value_max.is_(None))
            )
        
        if days_until_deadline:
            deadline_threshold = datetime.utcnow() + timedelta(days=days_until_deadline)
            query = query.where(Tender.deadline <= deadline_threshold)
        
        # Only include future deadlines
        query = query.where(Tender.deadline > datetime.utcnow())
        
        # Order by deadline
        query = query.order_by(Tender.deadline.asc()).offset(offset).limit(limit)
        
        result = await db.execute(query)
        tenders = result.scalars().all()
        
        return tenders


@router.get('/{tender_id}', response_model=TenderResponse)
async def get_tender(tender_id: str):
    """Get details of a specific tender."""
    async with async_session_maker() as db:
        result = await db.execute(
            select(Tender).where(Tender.id == tender_id)
        )
        tender = result.scalar_one_or_none()
        
        if not tender:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tender not found"
            )
        
        return tender


@router.get('/search')
async def search_tenders(
    q: str,
    limit: int = 20,
    offset: int = 0
):
    """Search tenders by keyword in title or category."""
    async with async_session_maker() as db:
        query = (
            select(Tender)
            .where(
                and_(
                    Tender.is_active == True,
                    Tender.deadline > datetime.utcnow(),
                    (Tender.title.ilike(f'%{q}%')) | 
                    (Tender.category.ilike(f'%{q}%'))
                )
            )
            .order_by(Tender.deadline.asc())
            .offset(offset)
            .limit(limit)
        )
        
        result = await db.execute(query)
        tenders = result.scalars().all()
        
        return {
            'query': q,
            'tenders': tenders,
            'total': len(tenders)
        }


@router.get('/stats')
async def get_tender_stats():
    """Get statistics about available tenders."""
    async with async_session_maker() as db:
        # Count by portal
        portal_query = select(
            Tender.portal,
            func.count(Tender.id)
        ).where(
            and_(
                Tender.is_active == True,
                Tender.deadline > datetime.utcnow()
            )
        ).group_by(Tender.portal)
        
        result = await db.execute(portal_query)
        portal_counts = dict(result.all())
        
        # Total count
        total_query = select(func.count(Tender.id)).where(
            and_(
                Tender.is_active == True,
                Tender.deadline > datetime.utcnow()
            )
        )
        result = await db.execute(total_query)
        total = result.scalar()
        
        return {
            'total_active': total,
            'by_portal': portal_counts,
            'last_updated': datetime.utcnow().isoformat()
        }
