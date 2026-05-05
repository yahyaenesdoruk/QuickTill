from motor.motor_asyncio import AsyncIOMotorClient
import os

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    try:
        await _create_indexes()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Index creation failed (non-fatal): {e}")


async def close_db():
    if client:
        client.close()


async def _create_indexes():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.recipes.create_index("created_at")
    await db.campaigns.create_index("created_at")


def get_db():
    return db
