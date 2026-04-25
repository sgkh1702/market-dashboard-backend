from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.stocks import router as stocks_router

app = FastAPI(title="Market Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later for Netlify domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks_router)

@app.get("/")
def root():
    return {
        "status": "Market Dashboard API",
        "search_endpoint": "/api/stocks/search?q=rel",
        "research_endpoint": "/api/stocks/RELIANCE/research",
        "refresh_endpoint": "/api/stocks/RELIANCE/refresh"
    }