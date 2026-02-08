import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

# URL from config or default
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "hft_db"

async def check_positions():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("--- Checking 'positions' collection ---")
    count = await db.positions.count_documents({})
    print(f"Total documents: {count}")
    
    cursor = db.positions.find({})
    async for doc in cursor:
        print(doc)

    print("\n--- Checking 'account' collection ---")
    async for doc in db.account.find({}):
        print(doc)

    print("\n--- Checking 'connection_status' collection ---")
    async for doc in db.connection_status.find({}):
        print(doc)

if __name__ == "__main__":
    asyncio.run(check_positions())

