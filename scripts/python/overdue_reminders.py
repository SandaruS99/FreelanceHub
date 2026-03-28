import os
import sys
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

# Import the existing sender functions if possible, or re-implement
try:
    from whatsapp_sender import get_db, send_via_whatsapp, download_invoice_pdf, APP_URL
except ImportError:
    # Fallback if import doesn't work (relative paths can be tricky)
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ENV_PATH = os.path.join(BASE_DIR, '.env.local')
    load_dotenv(ENV_PATH)
    MONGODB_URI = os.getenv('MONGODB_URI')
    APP_URL = os.getenv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
    
    def get_db():
        client = MongoClient(MONGODB_URI)
        db_name = MONGODB_URI.split('/')[-1].split('?')[0] or 'freelancehub'
        return client[db_name]

def run_overdue_reminders():
    print(f"Checking for overdue invoices at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}...")
    db = get_db()
    
    # Current date
    now = datetime.now()
    
    # 1. First, find all 'sent' or 'viewed' invoices that are past their due date
    # Mongoose stores dates as UTC, so we should compare carefully
    query = {
        "status": {"$in": ["sent", "viewed", "overdue"]},
        "dueDate": {"$lt": now}
    }
    
    overdue_invoices = list(db.invoices.find(query))
    
    if not overdue_invoices:
        print("No overdue invoices found.")
        return

    print(f"Found {len(overdue_invoices)} overdue items.")
    
    for inv in overdue_invoices:
        # Mark as 'overdue' in the system if it was just 'sent'
        if inv['status'] != 'overdue':
            print(f"Updating status for Invoice {inv['invoiceNumber']} to 'overdue'...")
            db.invoices.update_one({"_id": inv["_id"]}, {"$set": {"status": "overdue"}})
            
        # Get client
        client = db.clients.find_one({"_id": inv['clientId']})
        if not client or (not client.get('whatsapp') and not client.get('phone')):
            continue
            
        whatsapp_num = client.get('whatsapp') or client.get('phone')
        
        # Check if we should send a reminder today
        # To avoid spamming, we could record 'lastReminderSentAt'
        last_remind = inv.get('lastReminderSentAt')
        if last_remind:
            # Maybe only remind every 3 days?
            days_since = (now - last_remind).days
            if days_since < 3:
                print(f"Skipping reminder for {inv['invoiceNumber']} - last sent {days_since} days ago.")
                continue

        print(f"Preparing overdue reminder for {client['name']} (Invoice {inv['invoiceNumber']})")
        
        # Construct message
        pay_url = f"{APP_URL}/preview/invoice/{inv['publicToken']}/pay"
        message = (
            f"*Friendly Payment Reminder* 🔔\n\n"
            f"Hello *{client['name']}*, your invoice *{inv['invoiceNumber']}* is currently past its due date ({inv['dueDate'].strftime('%Y-%m-%d')}).\n\n"
            f"You can view and securely pay the balance here:\n"
            f"💳 *Payment Link:* {pay_url}\n\n"
            f"If you have already sent the payment, please disregard this message. Thank you!"
        )
        
        # We can call the sender function
        try:
            from whatsapp_sender import send_via_whatsapp
            send_via_whatsapp(whatsapp_num, message)
            
            # Update last reminder timestamp
            db.invoices.update_one({"_id": inv["_id"]}, {"$set": {"lastReminderSentAt": now}})
            print("Reminder sent via WhatsApp.")
        except ImportError:
            print("whatsapp_sender.py not found or could not import send_via_whatsapp.")

if __name__ == "__main__":
    run_overdue_reminders()
