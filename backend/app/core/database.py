from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

class Database:
    client: AsyncIOMotorClient = None
    
    @classmethod
    async def connect_db(cls):
        cls.client = AsyncIOMotorClient(settings.mongodb_url)
        print(f"Connected to MongoDB at {settings.mongodb_url}")
    
    @classmethod
    async def close_db(cls):
        if cls.client:
            cls.client.close()
            print("Closed MongoDB connection")
    
    @classmethod
    def get_db(cls):
        return cls.client[settings.database_name]


async def get_database():
    return Database.get_db()
