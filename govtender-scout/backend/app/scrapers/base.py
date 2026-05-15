from abc import ABC, abstractmethod
import logging
from playwright.async_api import async_playwright, Page
from app.database import async_session_maker
from app.models import Tender
from datetime import datetime

logger = logging.getLogger(__name__)


class BaseScraper(ABC):
    """Abstract base class for all tender scrapers."""
    
    PORTAL = ''
    
    async def run(self) -> int:
        """Execute the scraper and save results to database."""
        logger.info(f"Starting {self.PORTAL} scraper...")
        
        try:
            async with async_playwright() as pw:
                browser = await pw.chromium.launch(
                    headless=True
                )
                page = await browser.new_page()
                await page.set_extra_http_headers({
                    'User-Agent': 'Mozilla/5.0 (compatible; GovTenderBot/1.0; +https://govtenderscout.com/bot)',
                    'Accept-Language': 'en-US,en;q=0.9'
                })
                
                tenders = await self.scrape(page)
                await browser.close()
            
            await self.save(tenders)
            logger.info(f"{self.PORTAL} scraper completed: {len(tenders)} tenders found")
            return len(tenders)
            
        except Exception as e:
            logger.error(f"{self.PORTAL} scraper failed: {str(e)}")
            return 0
    
    @abstractmethod
    async def scrape(self, page: Page) -> list[dict]:
        """
        Scrape tender data from the portal.
        Returns a list of tender dictionaries.
        """
        pass
    
    async def save(self, items: list[dict]):
        """Save scraped tenders to database, avoiding duplicates."""
        async with async_session_maker() as db:
            saved_count = 0
            for item in items:
                # Check if tender already exists
                existing = await db.execute(
                    Tender.__table__.select().where(
                        Tender.tender_id == item.get('tender_id')
                    )
                )
                if not existing.first():
                    tender = Tender(**item)
                    db.add(tender)
                    saved_count += 1
            
            await db.commit()
            logger.info(f"Saved {saved_count} new tenders from {self.PORTAL}")
    
    def _parse_date(self, date_str: str) -> datetime | None:
        """Parse date string into datetime object."""
        if not date_str:
            return None
        
        date_str = date_str.strip()
        formats = [
            '%d-%b-%Y',
            '%d/%m/%Y',
            '%Y-%m-%d',
            '%d-%m-%Y',
            '%B %d, %Y',
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        logger.warning(f"Could not parse date: {date_str}")
        return None
