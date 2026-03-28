import os
import json
import shutil
from datetime import datetime
from pymongo import MongoClient
from bson import json_util
from dotenv import load_dotenv

# Load env from root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_PATH = os.path.join(BASE_DIR, '.env.local')
load_dotenv(ENV_PATH)

MONGODB_URI = os.getenv('MONGODB_URI')

def get_db():
    client = MongoClient(MONGODB_URI)
    db_name = MONGODB_URI.split('/')[-1].split('?')[0]
    if not db_name:
        db_name = 'freelancehub'
    return client[db_name]

def backup_database():
    print(f"Starting Database Backup at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    db = get_db()
    
    # Create backup directory
    backup_root = os.path.abspath(os.path.join(os.path.dirname(__file__), 'backups'))
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = os.path.join(backup_root, f"backup_{timestamp}")
    
    if not os.path.exists(backup_path):
        os.makedirs(backup_path)
        
    collections = db.list_collection_names()
    print(f"Found {len(collections)} collections to backup.")
    
    for coll_name in collections:
        print(f" - Backing up collection: {coll_name}...")
        cursor = db[coll_name].find({})
        data = list(cursor)
        
        file_path = os.path.join(backup_path, f"{coll_name}.json")
        with open(file_path, 'w') as f:
            # Use json_util to handle MongoDB specific types like ObjectId and DateTime
            f.write(json_util.dumps(data, indent=2))
            
    # Zip the backup
    zip_path = shutil.make_archive(backup_path, 'zip', backup_path)
    print(f"\nBackup completed successfully!")
    print(f"Final archive: {zip_path}")
    
    # Cleanup the unzipped directory
    shutil.rmtree(backup_path)
    
    # Cleanup old backups (keep last 7)
    all_zips = sorted([f for f in os.listdir(backup_root) if f.endswith('.zip')])
    if len(all_zips) > 7:
        print(f"Cleaning up {len(all_zips) - 7} old backups...")
        for old_zip in all_zips[:-7]:
            os.remove(os.path.join(backup_root, old_zip))

if __name__ == "__main__":
    backup_database()
