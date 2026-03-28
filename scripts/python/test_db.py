import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Path to root .env.local
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_PATH = os.path.join(BASE_DIR, '.env.local')
load_dotenv(ENV_PATH)

MONGODB_URI = os.getenv('MONGODB_URI')

print(f"Testing connection to: {MONGODB_URI.split('@')[-1]}") # Print cluster part only for security
try:
    client = MongoClient(MONGODB_URI)
    # The ping command is cheap and does not require auth for some clusters,
    # but for Atlas it does.
    client.admin.command('ping')
    print("Ping successful!")
    
    db_name = MONGODB_URI.split('/')[-1].split('?')[0] or 'freelancehub'
    db = client[db_name]
    print(f"Connected to DB: {db_name}")
    print(f"Collections: {db.list_collection_names()}")
except Exception as e:
    print(f"Connection failed: {e}")
