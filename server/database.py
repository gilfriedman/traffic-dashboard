from pymongo import MongoClient
from server.config import MONGODB_URI, DATABASE_NAME, COLLECTION_NAME

_client = None
_db = None


def get_db():
    global _client, _db
    if _db is None:
        _client = MongoClient(MONGODB_URI)
        _db = _client[DATABASE_NAME]
    return _db


def get_collection():
    return get_db()[COLLECTION_NAME]
