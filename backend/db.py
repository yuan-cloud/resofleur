from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging

logger = logging.getLogger(__name__)

# Lazy initialization - don't connect at import time
_client = None
_db = None


def get_database():
    """Get the database instance with lazy initialization"""
    global _client, _db
    
    if _db is None:
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        db_name = os.environ.get('DB_NAME', 'resofleur')
        
        # Ensure db_name is never empty
        if not db_name or db_name.strip() == '':
            db_name = 'resofleur'
        
        logger.info(f"Connecting to MongoDB: {mongo_url[:20]}... DB: {db_name}")
        
        # Add connection timeout for Railway
        _client = AsyncIOMotorClient(
            mongo_url,
            serverSelectionTimeoutMS=5000,  # 5 second timeout
            connectTimeoutMS=5000
        )
        _db = _client[db_name]
        logger.info("MongoDB client initialized")
    
    return _db


def close_database():
    """Close the database connection"""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed")
