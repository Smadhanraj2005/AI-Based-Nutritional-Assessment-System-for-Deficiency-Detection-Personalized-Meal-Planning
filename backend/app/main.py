from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router

app = FastAPI(
    title="AI Nutritional Deficiency Assessment & Meal Planning API",
    description="Full-stack AI health platform detecting nutrient deficiencies using ML, Bayesian updating, and SHAP explainability.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "AI-Based Nutritional Assessment System",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
