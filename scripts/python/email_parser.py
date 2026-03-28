import os
import imaplib
import email
import re
from pymongo import MongoClient
from dotenv import load_dotenv

# Load env from root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_PATH = os.path.join(BASE_DIR, '.env.local')
load_dotenv(ENV_PATH)

MONGODB_URI = os.getenv('MONGODB_URI')

# --- CONFIGURATION (User to fill this part locally) ---
# IMAP_SERVER = 'imap.gmail.com'
# IMAP_USER = 'your-email@gmail.com'
# IMAP_PASS = 'your-app-password'
# -------------------------------------------------------

def get_db():
    client = MongoClient(MONGODB_URI)
    db_name = MONGODB_URI.split('/')[-1].split('?')[0] or 'freelancehub'
    return client[db_name]

def parse_lead_content(body):
    """
    Tries to extract Name, Email, and requirements from an email body.
    You can improve this by using OpenAI API for 'Smart Parsing'.
    """
    name = re.search(r'Name:\s*(.*)', body)
    email_lead = re.search(r'Email:\s*(.*)', body)
    requirements = re.search(r'Requirements:\s*(.*)', body, re.DOTALL)
    
    return {
        'name': name.group(1).strip() if name else 'Unknown Lead',
        'email': email_lead.group(1).strip() if email_lead else None,
        'notes': requirements.group(1).strip() if requirements else body[:200]
    }

def fetch_leads_from_email():
    print("Checking email inbox for new leads...")
    
    # This is a template logic. Usually you need an app password for Gmail.
    print("NOTE: You need to set your IMAP_SERVER, USER, and PASS inside the script to use this.")
    return

    # --- EXAMPLE IMPLEMENTATION ---
    # mail = imaplib.IMAP4_SSL(IMAP_SERVER)
    # mail.login(IMAP_USER, IMAP_PASS)
    # mail.select('inbox')
    
    # # Search for emails with subject 'New Lead'
    # status, data = mail.search(None, '(SUBJECT "New Lead")')
    # db = get_db()
    
    # for num in data[0].split():
    #     status, data = mail.fetch(num, '(RFC822)')
    #     raw_email = data[0][1]
    #     msg = email.message_from_bytes(raw_email)
        
    #     # Extract body
    #     body = ""
    #     if msg.is_multipart():
    #         for part in msg.walk():
    #             if part.get_content_type() == "text/plain":
    #                 body = part.get_payload(decode=True).decode()
    #     else:
    #         body = msg.get_payload(decode=True).decode()
            
    #     lead = parse_lead_content(body)
        
    #     # Check if client already exists
    #     existing = db.clients.find_one({"email": lead['email']})
    #     if not existing:
    #         print(f"Creating new CRM lead for {lead['name']}...")
    #         # Insert new client
    #         client_id = db.clients.insert_one({
    #             "name": lead['name'],
    #             "email": lead['email'],
    #             "notes": lead['notes'],
    #             "status": "active",
    #             "tags": ["Email Lead"],
    #             "createdAt": datetime.now(),
    #             "updatedAt": datetime.now()
    #         }).inserted_id
            
    #         # Create a draft project too
    #         db.projects.insert_one({
    #             "clientId": client_id,
    #             "name": f"Project for {lead['name']}",
    #             "description": lead['notes'],
    #             "status": "on-hold", # Draft status
    #             "createdAt": datetime.now()
    #         })
    #     else:
    #         print(f"Lead {lead['email']} already exists in CRM.")

if __name__ == "__main__":
    fetch_leads_from_email()
