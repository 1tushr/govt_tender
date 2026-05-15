import logging
from datetime import datetime, timedelta
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import selectinload
from app.database import AsyncSession
from app.models import Tender, User, UserTenderAction

logger = logging.getLogger(__name__)


async def match_tenders_for_user(user: User, db: AsyncSession) -> list[Tender]:
    """
    Find matching tenders for a user based on their profile.
    Returns list of tenders sorted by deadline.
    """
    now = datetime.utcnow()
    
    # Base query - only active tenders with future deadlines
    query = select(Tender).where(
        and_(
            Tender.is_active == True,
            Tender.deadline > now
        )
    )
    
    # Value range filter
    value_filters = []
    if user.value_min:
        value_filters.append(or_(
            Tender.value_max >= user.value_min,
            Tender.value_max.is_(None)
        ))
    if user.value_max and user.value_max < 9999999999:
        value_filters.append(or_(
            Tender.value_min <= user.value_max,
            Tender.value_min.is_(None)
        ))
    
    if value_filters:
        query = query.where(and_(*value_filters))
    
    # State filter
    if user.states and 'All India' not in user.states:
        query = query.where(or_(
            Tender.state.in_(user.states),
            Tender.state.is_(None)
        ))
    
    # Keyword match using full-text search
    if user.keywords:
        keyword_filters = []
        for keyword in user.keywords:
            # Match against title and category
            keyword_filters.append(
                Tender.title.ilike(f'%{keyword}%')
            )
            if Tender.category is not None:
                keyword_filters.append(
                    Tender.category.ilike(f'%{keyword}%')
                )
        
        if keyword_filters:
            query = query.where(or_(*keyword_filters))
    
    # Exclude tenders user has already acted on
    seen_query = select(UserTenderAction.tender_id).where(
        UserTenderAction.user_id == user.id
    )
    query = query.where(Tender.id.not_in(seen_query))
    
    # Order by deadline (most urgent first) and limit results
    query = query.order_by(Tender.deadline.asc()).limit(20)
    
    result = await db.execute(query)
    tenders = result.scalars().all()
    
    logger.info(f"Found {len(tenders)} matching tenders for user {user.email}")
    return tenders


def calculate_eligibility_score(tender: Tender, user: User) -> int:
    """
    Calculate how well a user matches tender eligibility (0-100 score).
    Higher score = better match.
    """
    score = 100
    
    if not tender.eligibility:
        return score
    
    eligibility = tender.eligibility
    
    # Turnover check
    turnover_required = eligibility.get('turnover_min_lakh')
    if turnover_required and hasattr(user, 'turnover_lakh') and user.turnover_lakh:
        if user.turnover_lakh < turnover_required:
            score -= 40  # Significant penalty
    
    # MSE/Startup reservation check
    reserved_for = eligibility.get('reserved_for')
    if reserved_for == 'MSE' and not getattr(user, 'is_mse', False):
        score -= 50
    elif reserved_for == 'startup' and not getattr(user, 'is_startup', False):
        score -= 50
    elif reserved_for == 'women' and not getattr(user, 'is_women_owned', False):
        score -= 50
    
    # Experience check (if we track it)
    exp_required = eligibility.get('experience_years')
    if exp_required and hasattr(user, 'experience_years') and user.experience_years:
        if user.experience_years < exp_required:
            score -= 30
    
    return max(0, score)


def get_urgency_level(deadline: datetime) -> str:
    """Determine urgency level based on days remaining."""
    if not deadline:
        return 'normal'
    
    days_left = (deadline - datetime.utcnow()).days
    
    if days_left <= 2:
        return 'critical'
    elif days_left <= 5:
        return 'urgent'
    elif days_left <= 10:
        return 'soon'
    else:
        return 'normal'
