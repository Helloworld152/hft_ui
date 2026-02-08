import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "hft_db"

async def clean_positions():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("--- Cleaning 'positions' collection ---")
    result = await db.positions.delete_many({})
    print(f"Deleted {result.deleted_count} documents.")

if __name__ == "__main__":
    asyncio.run(clean_positions())
