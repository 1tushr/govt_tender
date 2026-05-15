import asyncio
import logging
import os
import httpx
from playwright.async_api import Page
from app.scrapers.base import BaseScraper

logger = logging.getLogger(__name__)

GEM_API_BASE = 'https://bidplus.gem.gov.in/bid/api/bid/list'


class GemScraper(BaseScraper):
    """Scraper for GeM (Government e-Marketplace) portal."""
    
    PORTAL = 'gem'
    
    async def scrape(self, page: Page) -> list[dict]:
        """Scrape tenders from GeM API."""
        tenders = []
        
        # Build proxy dict if credentials exist
        proxy_url = None
        if os.getenv('PROXY_USER') and os.getenv('PROXY_PASS'):
            proxy_url = f"http://{os.getenv('PROXY_USER')}:{os.getenv('PROXY_PASS')}@proxy.brightdata.com:22225"
        
        proxies = {'http://': proxy_url, 'https://': proxy_url} if proxy_url else None
        
        try:
            async with httpx.AsyncClient(proxies=proxies, timeout=30.0) as client:
                # Scrape first 10 pages (20 bids per page = 200 bids)
                for page_num in range(1, 11):
                    logger.info(f"Scraping GeM page {page_num}")
                    
                    try:
                        response = await client.get(
                            GEM_API_BASE,
                            params={'pageNo': page_num, 'pageSize': 20},
                            headers={
                                'Accept': 'application/json',
                                'User-Agent': 'Mozilla/5.0 (compatible; GovTenderBot/1.0)'
                            }
                        )
                        
                        if response.status_code != 200:
                            logger.warning(f"GeM API returned status {response.status_code}")
                            break
                        
                        data = response.json()
                        bids = data.get('data', [])
                        
                        if not bids:
                            logger.info("No more bids on GeM")
                            break
                        
                        for bid in bids:
                            try:
                                bid_no = bid.get('bid_no', '')
                                item_name = bid.get('item_name', '')
                                category = bid.get('category', '')
                                state = bid.get('state', '')
                                
                                # Calculate approximate value
                                quantity = int(bid.get('quantity', 0) or 0)
                                unit_price = int(bid.get('unit_price', 0) or 0)
                                value = quantity * unit_price if quantity and unit_price else None
                                
                                # Parse deadline
                                deadline_str = bid.get('bid_end_date', '')
                                deadline = self._parse_date(deadline_str) if deadline_str else None
                                
                                tenders.append({
                                    'portal': self.PORTAL,
                                    'tender_id': str(bid_no),
                                    'title': item_name,
                                    'category': category,
                                    'state': state,
                                    'value_min': value,
                                    'value_max': value,
                                    'deadline': deadline,
                                    'doc_url': f'https://bidplus.gem.gov.in/showbidDocument/{bid_no}',
                                    'scraped_at': asyncio.get_event_loop().time(),
                                })
                            except Exception as e:
                                logger.warning(f"Error parsing GeM bid: {str(e)}")
                                continue
                        
                        await asyncio.sleep(1)  # Rate limiting
                        
                    except httpx.HTTPError as e:
                        logger.error(f"GeM HTTP error on page {page_num}: {str(e)}")
                        continue
                
        except Exception as e:
            logger.error(f"GeM scraping error: {str(e)}")
        
        return tenders
