from fastapi import FastAPI
import os

app = FastAPI(title="Cricklytics API Test", version="1.0.0")

@app.get("/")
def root():
    return {"message": "Cricklytics API is running!", "status": "success"}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "cricklytics-backend"}

# For development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
