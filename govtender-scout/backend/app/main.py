"""
GovTender Scout - FastAPI Backend Application
Government Tender Auto-Scanner with AI-powered eligibility matching
"""

import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import get_settings
from app.database import init_db, close_db
from app.workers.scheduler import start_scheduler, stop_scheduler

# Import routers
from app.routers import users, tenders, webhooks

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    # Startup
    logger.info("=" * 60)
    logger.info("GOVTENDER SCOUT - Starting up...")
    logger.info("=" * 60)
    
    try:
        # Initialize database
        logger.info("Initializing database...")
        await init_db()
        logger.info("Database initialized ✓")
        
        # Start background scheduler
        if not settings.DEBUG:
            logger.info("Starting background job scheduler...")
            start_scheduler()
            logger.info("Scheduler started ✓")
        
        logger.info("=" * 60)
        logger.info("Server ready to accept requests!")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"Startup failed: {str(e)}", exc_info=True)
        raise
    
    yield
    
    # Shutdown
    logger.info("=" * 60)
    logger.info("GOVTENDER SCOUT - Shutting down...")
    logger.info("=" * 60)
    
    try:
        # Stop scheduler
        stop_scheduler()
        logger.info("Scheduler stopped ✓")
        
        # Close database connections
        await close_db()
        logger.info("Database connections closed ✓")
        
    except Exception as e:
        logger.error(f"Shutdown error: {str(e)}")
    
    logger.info("Goodbye! 👋")


# Create FastAPI application
app = FastAPI(
    title="GovTender Scout API",
    description="AI-powered government tender scanner and matcher",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://govtenderscout.com",
        "https://www.govtenderscout.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "type": type(exc).__name__
        }
    )


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return {
        "status": "healthy",
        "service": "govtender-scout-api",
        "version": "1.0.0"
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": "GovTender Scout API",
        "version": "1.0.0",
        "description": "AI-powered government tender scanner",
        "docs": "/docs",
        "health": "/health"
    }


# Include routers
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(tenders.router, prefix=settings.API_PREFIX)
app.include_router(webhooks.router, prefix=settings.API_PREFIX)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        workers=1
    )
