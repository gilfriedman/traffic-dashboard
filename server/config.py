import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

MONGODB_URI = os.getenv('MONGODB_URI')
DATABASE_NAME = 'traffic_study'
COLLECTION_NAME = 'traffic_data'
