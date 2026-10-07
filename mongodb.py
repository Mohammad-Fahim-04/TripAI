import os

from pymongo import MongoClient
from pymongo.database import Database


def connect_mongodb() -> tuple[MongoClient, Database]:
    mongodb_uri = os.getenv("MONGODB_URI")
    if not mongodb_uri:
        raise ValueError("MONGODB_URI is missing. Please add it to your .env file.")

    database_name = os.getenv("MONGODB_DATABASE", "tripmate")
    client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")

    return client, client[database_name]
