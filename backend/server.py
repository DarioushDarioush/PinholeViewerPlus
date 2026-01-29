from fastapi import FastAPI, APIRouter, File, UploadFile
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime
from PIL import Image
import io
import base64


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.post("/analyze-brightness")
async def analyze_brightness(file: UploadFile = File(...)):
    """
    Analyze the brightness of an uploaded image and return average luminance
    """
    try:
        # Read the image data
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize to reasonable size for faster processing
        image.thumbnail((200, 200))
        
        # Get pixel data
        pixels = list(image.getdata())
        
        # Calculate average luminance using standard formula
        # Y = 0.299R + 0.587G + 0.114B
        total_luminance = 0
        for r, g, b in pixels:
            luminance = 0.299 * r + 0.587 * g + 0.114 * b
            total_luminance += luminance
        
        avg_luminance = total_luminance / len(pixels)
        
        # Calculate EV from luminance
        # Using standard photographic formula
        # EV ranges typically: 0 (very dark) to 255 (pure white)
        # Map to photographic EV scale
        
        # Very dark (0-30): EV 2-6
        # Dark (30-60): EV 6-9
        # Medium (60-120): EV 9-12
        # Bright (120-180): EV 12-14
        # Very bright (180-255): EV 14-17
        
        if avg_luminance < 30:
            ev = 2 + (avg_luminance / 30) * 4
        elif avg_luminance < 60:
            ev = 6 + ((avg_luminance - 30) / 30) * 3
        elif avg_luminance < 120:
            ev = 9 + ((avg_luminance - 60) / 60) * 3
        elif avg_luminance < 180:
            ev = 12 + ((avg_luminance - 120) / 60) * 2
        else:
            ev = 14 + ((avg_luminance - 180) / 75) * 3
        
        logger.info(f"Analyzed image: avg_luminance={avg_luminance:.2f}, calculated_ev={ev:.2f}")
        
        return {
            "avg_luminance": round(avg_luminance, 2),
            "ev": round(ev, 2),
            "pixel_count": len(pixels)
        }
        
    except Exception as e:
        logger.error(f"Error analyzing brightness: {e}")
        return {"error": str(e)}, 500

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
