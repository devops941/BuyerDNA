import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import health, rfm, clustering, behaviour, clv_churn, comprehensive

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade Machine Learning & Customer Behaviour Segmentation API for BuyerDNA SaaS",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router, prefix=settings.API_PREFIX, tags=["Health"])
app.include_router(rfm.router, prefix=f"{settings.API_PREFIX}/rfm", tags=["RFM Analytics"])
app.include_router(clustering.router, prefix=f"{settings.API_PREFIX}/clustering", tags=["Machine Learning Clustering"])
app.include_router(behaviour.router, prefix=f"{settings.API_PREFIX}/behaviour", tags=["Customer Behaviour & Demand"])
app.include_router(clv_churn.router, prefix=f"{settings.API_PREFIX}/churn", tags=["CLV & Churn Analytics"])
app.include_router(comprehensive.router, prefix=f"{settings.API_PREFIX}/comprehensive", tags=["Comprehensive Pipeline"])

@app.get("/")
def root():
    return {
        "service": "BuyerDNA Python ML Service",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "operational"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
