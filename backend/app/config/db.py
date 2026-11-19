from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config.env import settings

_client: AsyncIOMotorClient = None
_db: AsyncIOMotorDatabase = None


async def connect_db() -> None:
    global _client, _db
    _client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=10000)
    _db = _client.buyer_dna
    await _client.admin.command("ping")
    print("[MongoDB] Connected successfully")


async def disconnect_db() -> None:
    global _client
    if _client:
        _client.close()
        print("[MongoDB] Disconnected")


def get_db() -> AsyncIOMotorDatabase:
    return _db
