import re
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)


# Common certification patterns in Indian tenders
CERTIFICATION_PATTERNS = [
    r'ISO\s*9001',
    r'ISO\s*14001',
    r'ISO\s*45001',
    r'OHSAS\s*18001',
    r'MSME',
    r'Udyam\s*(Registration|Certificate)',
    r'PAN\s*Card',
    r'GST\s*Registration',
    r'TAN\s*Certificate',
    r'Class\s*I\s*Contractor',
    r'Class\s*II\s*Contractor',
    r'Class\s*III\s*Contractor',
]

# Patterns for MSE/Startup reservations
MSE_PATTERNS = [
    r'micro.*small.*enterprise',
    r'mse.*preferred',
    r'mse.*reserved',
    r'startup.*india',
    r'dipp.*recognized',
]

WOMEN_PATTERNS = [
    r'women.*entrepreneur',
    r'women.*owned',
    r'female.*owned',
]


async def parse_eligibility(raw_text: str) -> dict:
    """
    Parse tender text using rule-based extraction (free alternative to AI).
    Extracts eligibility criteria using regex patterns.
    Returns structured eligibility data.
    """
    if not raw_text or len(raw_text.strip()) < 100:
        logger.warning("Insufficient text for eligibility parsing")
        return {}
    
    text_lower = raw_text.lower()
    
    eligibility = {
        'turnover_min_lakh': _extract_turnover(raw_text),
        'experience_years': _extract_experience(raw_text),
        'certifications': _extract_certifications(raw_text),
        'reserved_for': _extract_reserved_category(text_lower),
        'state_preference': _extract_state_preference(raw_text),
        'summary': _generate_summary(raw_text)[:200]  # Simple summary
    }
    
    logger.info("Successfully parsed eligibility criteria (rule-based)")
    return eligibility


def _extract_turnover(text: str) -> Optional[float]:
    """Extract minimum turnover requirement from text."""
    # Look for patterns like "turnover of Rs. 5 crore" or "minimum turnover 50 lakhs"
    patterns = [
        r'turnover.*?(?:of|not\s+less\s+than|minimum).*?₹?\s*([\d,]+)\s*(crore|lakh|million)',
        r'(?:minimum|annual).*?turnover.*?₹?\s*([\d,]+)\s*(crore|lakh|million)',
        r'₹?\s*([\d,]+)\s*(crore|lakh).*?turnover',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            amount_str = match.group(1).replace(',', '')
            unit = match.group(2).lower()
            
            try:
                amount = float(amount_str)
                # Convert to lakhs
                if unit == 'crore':
                    return amount * 100  # 1 crore = 100 lakh
                elif unit == 'million':
                    return amount * 10  # 1 million ≈ 10 lakh
                else:  # lakh
                    return amount
            except ValueError:
                continue
    
    return None


def _extract_experience(text: str) -> Optional[int]:
    """Extract years of experience required."""
    patterns = [
        r'(?:minimum|at\s+least|not\s+less\s+than)?\s*([\d]+)\s*(?:years?|yrs?)\s*(?:experience|track record|similar work)',
        r'experience.*?(?:of|in).*?([\d]+)\s*(?:years?|yrs?)',
        r'([\d]+)\s*(?:years?|yrs?)\s*(?:experience|similar.*work)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                return int(match.group(1))
            except ValueError:
                continue
    
    return None


def _extract_certifications(text: str) -> List[str]:
    """Extract required certifications from text."""
    certifications = []
    
    for pattern in CERTIFICATION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            cert_name = re.match(pattern, text, re.IGNORECASE)
            if cert_name:
                certifications.append(cert_name.group(0).upper())
    
    # Remove duplicates
    return list(set(certifications))


def _extract_reserved_category(text_lower: str) -> Optional[str]:
    """Determine if tender is reserved for specific category."""
    for pattern in MSE_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return 'MSE'
    
    for pattern in WOMEN_PATTERNS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return 'women'
    
    if re.search(r'startup', text_lower, re.IGNORECASE):
        return 'startup'
    
    return None


def _extract_state_preference(text: str) -> Optional[str]:
    """Extract state preference if any."""
    indian_states = [
        'maharashtra', 'karnataka', 'tamil nadu', 'gujarat', 'rajasthan',
        'uttar pradesh', 'madhya pradesh', 'west bengal', 'andhra pradesh',
        'telangana', 'kerala', 'punjab', 'haryana', 'bihar', 'odisha',
        'assam', 'jharkhand', 'chhattisgarh', 'uttarakhand', 'himachal pradesh',
        'goa', 'tripura', 'manipur', 'meghalaya', 'nagaland', 'mizoram',
        'arunachal pradesh', 'sikkim', 'delhi'
    ]
    
    # Check for state-specific preferences
    for state in indian_states:
        pattern = rf'(?:preference|reservation|local.*prefer).*?{state}'
        if re.search(pattern, text, re.IGNORECASE):
            return state.title()
    
    return None


def _generate_summary(text: str) -> str:
    """Generate a simple summary from the first meaningful sentence."""
    # Split into sentences
    sentences = re.split(r'[.!?]', text)
    
    for sentence in sentences:
        sentence = sentence.strip()
        if len(sentence) > 30 and len(sentence) < 300:
            # Skip boilerplate text
            if not any(skip in sentence.lower() for skip in ['tender notice', 'corrigendum', 'last date']):
                return sentence
    
    return text[:200] if text else ''


def validate_eligibility(eligibility: dict) -> dict:
    """Validate and normalize eligibility data."""
    validated = {}
    
    # Turnover
    if 'turnover_min_lakh' in eligibility:
        try:
            val = eligibility['turnover_min_lakh']
            validated['turnover_min_lakh'] = float(val) if val is not None else None
        except (ValueError, TypeError):
            validated['turnover_min_lakh'] = None
    
    # Experience
    if 'experience_years' in eligibility:
        try:
            val = eligibility['experience_years']
            validated['experience_years'] = int(val) if val is not None else None
        except (ValueError, TypeError):
            validated['experience_years'] = None
    
    # Certifications
    if 'certifications' in eligibility:
        certs = eligibility['certifications']
        if isinstance(certs, list):
            validated['certifications'] = [str(c).strip().upper() for c in certs if c]
        else:
            validated['certifications'] = []
    
    # Reserved for
    reserved = eligibility.get('reserved_for')
    if reserved in ['MSE', 'startup', 'women', None]:
        validated['reserved_for'] = reserved
    else:
        validated['reserved_for'] = None
    
    # State preference
    validated['state_preference'] = eligibility.get('state_preference')
    
    # Summary
    validated['summary'] = eligibility.get('summary', '')
    
    return validated
