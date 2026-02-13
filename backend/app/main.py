from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from .core.config import settings
from .core.database import Database
from .api import research, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    await Database.connect_db()
    yield
    # Shutdown
    await Database.close_db()


app = FastAPI(
    title="InsightEngine API",
    description="Autonomous Research Platform with Multi-Agent System",
    version="1.0.0",
    lifespan=lifespan
)

# Exception handler for validation errors
@app.exception_handler(Exception)
async def validation_exception_handler(request, exc):
    print(f"Validation error: {exc}")
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc)}
    )

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(research.router)
app.include_router(auth.router)


@app.get("/")
async def root():
    return {
        "message": "InsightEngine API",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
