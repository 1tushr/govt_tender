import asyncio
import logging
import os
import io
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import httpx

logger = logging.getLogger(__name__)


async def download_and_extract(url: str, tender_id: str) -> str:
    """
    Download PDF from URL and extract text.
    Uses OCR for scanned pages.
    Returns extracted text (capped at 8000 chars).
    
    Note: Cloud storage (R2/S3) removed for free tier.
    PDFs are processed in-memory only.
    """
    if not url:
        logger.warning("No URL provided for PDF extraction")
        return ''
    
    try:
        # Download PDF
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(
                url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (compatible; GovTenderBot/1.0)'
                }
            )
        
        if response.status_code != 200:
            logger.warning(f"Failed to download PDF: {url} (status {response.status_code})")
            return ''
        
        pdf_content = response.content
        
        # Extract text from PDF
        text = await extract_text_from_pdf(pdf_content)
        
        # Cap text to avoid huge processing
        return text[:8000] if text else ''
        
    except Exception as e:
        logger.error(f"Error downloading/extracting PDF {url}: {str(e)}")
        return ''


async def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extract text from PDF, using OCR for scanned pages."""
    try:
        doc = fitz.open(stream=pdf_content, filetype='pdf')
        full_text = []
        
        for page_num, page in enumerate(doc):
            # Try to get text directly
            text = page.get_text()
            
            if len(text.strip()) > 50:
                # Text-based page
                full_text.append(text)
            else:
                # Scanned page - use OCR
                logger.info(f"Page {page_num} appears scanned, using OCR")
                try:
                    # Render page to image
                    pix = page.get_pixmap(dpi=200)
                    img_data = pix.tobytes('png')
                    img = Image.open(io.BytesIO(img_data))
                    
                    # OCR with English and Hindi
                    ocr_text = pytesseract.image_to_string(img, lang='eng+hin')
                    if ocr_text.strip():
                        full_text.append(ocr_text)
                except Exception as e:
                    logger.warning(f"OCR failed on page {page_num}: {str(e)}")
        
        doc.close()
        return '\n'.join(full_text)
        
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        return ''
