import asyncio
import logging
from bs4 import BeautifulSoup
from playwright.async_api import Page
from app.scrapers.base import BaseScraper

logger = logging.getLogger(__name__)

BASE_URL = 'https://eprocure.gov.in'


class CpppScraper(BaseScraper):
    """Scraper for CPPP (Central Public Procurement Portal)."""
    
    PORTAL = 'cppp'
    
    async def scrape(self, page: Page) -> list[dict]:
        """Scrape tenders from CPPP portal."""
        tenders = []
        
        try:
            # Navigate to CPPP tenders page
            await page.goto(f'{BASE_URL}/eprocure/app?page=FrontEndTendersByOrganisationDefault', 
                          wait_until='networkidle', timeout=60000)
            
            # Scrape first 5 pages
            for page_num in range(1, 6):
                logger.info(f"Scraping CPPP page {page_num}")
                
                html = await page.content()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Find tender table rows (skip header row)
                rows = soup.select('table.list_table tr')[1:]
                
                for row in rows:
                    cols = row.find_all('td')
                    if len(cols) < 6:
                        continue
                    
                    try:
                        tender_id = cols[0].text.strip()
                        title = cols[2].text.strip()
                        category = cols[3].text.strip()
                        deadline_str = cols[5].text.strip()
                        
                        # Extract document link
                        link_elem = cols[2].find('a')
                        doc_url = None
                        if link_elem and link_elem.get('href'):
                            href = link_elem['href']
                            if href.startswith('/'):
                                doc_url = f"{BASE_URL}{href}"
                            else:
                                doc_url = href
                        
                        tenders.append({
                            'portal': self.PORTAL,
                            'tender_id': tender_id,
                            'title': title,
                            'category': category,
                            'state': None,  # CPPP doesn't always have state
                            'value_min': None,
                            'value_max': None,
                            'deadline': self._parse_date(deadline_str),
                            'doc_url': doc_url,
                            'scraped_at': asyncio.get_event_loop().time(),
                        })
                    except Exception as e:
                        logger.warning(f"Error parsing row: {str(e)}")
                        continue
                
                # Click next button if exists
                next_btn = await page.query_selector('a[title="Next"]')
                if not next_btn:
                    logger.info("No more pages on CPPP")
                    break
                
                await next_btn.click()
                await asyncio.sleep(2)  # Polite delay
            
        except Exception as e:
            logger.error(f"CPPP scraping error: {str(e)}")
        
        return tenders
