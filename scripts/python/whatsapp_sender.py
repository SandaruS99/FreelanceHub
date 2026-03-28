import os
import sys
import time
import requests
from pymongo import MongoClient
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv

# Path to root .env.local
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_PATH = os.path.join(BASE_DIR, '.env.local')
load_dotenv(ENV_PATH)

MONGODB_URI = os.getenv('MONGODB_URI')
# Fallback to localhost if not set
APP_URL = os.getenv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')

def get_db():
    try:
        client = MongoClient(MONGODB_URI)
        # Extract DB name from URI or use default
        db_name = MONGODB_URI.split('/')[-1].split('?')[0]
        if not db_name:
            db_name = 'freelancehub'
        return client[db_name]
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        sys.exit(1)

def download_invoice_pdf(public_token, invoice_number):
    print(f"Downloading PDF for Invoice {invoice_number} (Token: {public_token})...")
    # API route: /api/public/invoices/[token]/download
    url = f"{APP_URL}/api/public/invoices/{public_token}/download"
    
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            filename = f"Invoice_{invoice_number}.pdf"
            # Save in a temp location
            file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), filename))
            with open(file_path, 'wb') as f:
                f.write(response.content)
            print(f"Successfully downloaded to: {file_path}")
            return file_path
        else:
            print(f"Failed to download PDF from {url}. Status: {response.status_code}")
            print("Make sure your Next.js app is running!")
    except Exception as e:
        print(f"Error downloading PDF: {e}")
    return None

def send_via_whatsapp(phone, message, file_path=None):
    """
    Automates WhatsApp Web to send a message and optional file.
    Uses a persistent browser context to keep you logged in.
    """
    # Clean phone number (remove non-digits, handle local Zero)
    clean_phone = "".join(filter(str.isdigit, phone))
    if clean_phone.startswith('0') and len(clean_phone) == 10:
        clean_phone = '94' + clean_phone[1:]
    
    # Path for session data
    user_data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'user_data'))
    if not os.path.exists(user_data_dir):
        os.makedirs(user_data_dir)
    
    print(f"Setting up browser for {phone}...")
    
    with sync_playwright() as p:
        # Launch persistent context
        browser = p.chromium.launch_persistent_context(
            user_data_dir, 
            headless=False, # Must be False to allow QR scan if needed
            args=["--start-maximized"]
        )
        
        page = browser.new_page()
        
        # Open WhatsApp Web with pre-filled message
        encoded_msg = requests.utils.quote(message)
        whatsapp_url = f"https://web.whatsapp.com/send?phone={clean_phone}&text={encoded_msg}"
        
        print(f"Navigating to WhatsApp Web for {phone}...")
        page.goto(whatsapp_url)
        
        try:
            # Wait for the "Chat" or "Type a message" div to load
            # Selectors in WhatsApp Web change, but [contenteditable="true"] is fairly stable
            print("Waiting for chat to load (up to 2 minutes)...")
            page.wait_for_selector('div[contenteditable="true"]', timeout=120000)
            print("Chat loaded!")
            
            # Brief pause for UI stability
            time.sleep(3)
            
            if file_path and os.path.exists(file_path):
                print(f"Attaching PDF file: {file_path}")
                
                # 1. Click the 'Attach' icon (plus or paperclip)
                # Newer WA Web uses [data-icon="plus"]
                try:
                    page.click('span[data-icon="plus"]', timeout=5000)
                except:
                    # Older or alternate layout might use [data-icon="attach-menu-plus"] or similar
                    page.click('div[title="Attach"]', timeout=5000)
                
                # 2. Upload the file
                # WhatsApp Web uses a hidden input[type="file"]
                # There are multiple inputs; we want the one for Documents
                # Usually we can just set files on any input[type="file"] that appears after menu click
                # Or wait for it
                page.set_input_files('input[type="file"]', file_path)
                
                # 3. Wait for preview screen and click 'Send'
                print("Waiting for file preview...")
                # The send button icon on the preview screen is often 'send-light' or 'send'
                page.wait_for_selector('span[data-icon="send"]', timeout=15000)
                page.click('span[data-icon="send"]')
                print("PDF Sent successfully!")
                time.sleep(2)
            else:
                # No file, just hit Enter to send the pre-filled text
                page.keyboard.press("Enter")
                print("Text message sent!")
                time.sleep(2)

        except Exception as e:
            print("\n" + "!"*40)
            print(f"Error or Timeout: {e}")
            print("Possible causes:")
            print("1. You are not logged in (Check the browser window and scan QR if needed).")
            print("2. The phone number is invalid for WhatsApp.")
            print("3. WhatsApp Web UI changed.")
            print("!"*40 + "\n")
            # Keep browser open so user can troubleshoot or scan
            print("Keeping browser open for 60 seconds for you to check...")
            time.sleep(60)
        
        browser.close()

def process_pending_invoices():
    db = get_db()
    # Find invoices that are 'sent' but not yet 'whatsappSent'
    # NOTE: I am adding 'whatsappSent' field check
    query = {"status": "sent", "whatsappSent": {"$ne": True}}
    pending = list(db.invoices.find(query))
    
    if not pending:
        print("No pending 'sent' invoices found to process.")
        return

    print(f"Found {len(pending)} pending invoices.")
    
    for inv in pending:
        # Get client details
        client = db.clients.find_one({"_id": inv['clientId']})
        if not client:
            print(f"Could not find client for invoice {inv['invoiceNumber']}. Skipping.")
            continue
            
        whatsapp_num = client.get('whatsapp') or client.get('phone')
        if not whatsapp_num:
            print(f"No contact number for client {client['name']}. Skipping.")
            continue
            
        print(f"\n--- Processing Invoice {inv['invoiceNumber']} ---")
        
        # Download PDF
        pdf_file = download_invoice_pdf(inv['publicToken'], inv['invoiceNumber'])
        
        if not pdf_file:
            print("Skipping this invoice due to PDF download failure.")
            continue
            
        # Compose message
        pay_url = f"{APP_URL}/preview/invoice/{inv['publicToken']}/pay"
        message = (
            f"*Hello {client['name']}*, 👋\n\n"
            f"Your invoice *{inv['invoiceNumber']}* is ready!\n\n"
            f"💳 *View & Securely Pay:* {pay_url}\n\n"
            f"Thank you for your business!"
        )
        
        # Send
        send_via_whatsapp(whatsapp_num, message, pdf_file)
        
        # Mark as sent in DB
        db.invoices.update_one({"_id": inv["_id"]}, {"$set": {"whatsappSent": True}})
        
        # Cleanup temp file
        if os.path.exists(pdf_file):
            os.remove(pdf_file)
            
    print("\nAll done!")

def main():
    import argparse
    parser = argparse.ArgumentParser(description="FreelanceHub - Automated WhatsApp Bot")
    parser.add_argument("--dry-run", action="store_true", help="Tests connections and downloads without sending via WhatsApp")
    args = parser.parse_args()
    
    print("FreelanceHub - Automated WhatsApp Bot")
    print("=====================================")
    
    if args.dry_run:
        print("DRY RUN MODE ENABLED")
        db = get_db()
        query = {"status": "sent", "whatsappSent": {"$ne": True}}
        pending = list(db.invoices.find(query))
        
        if not pending:
            print("No pending invoices found.")
            return

        print(f"Would process {len(pending)} pending invoices.")
        for inv in pending:
            print(f"- Invoice {inv['invoiceNumber']} (Token: {inv['publicToken']})")
    else:
        process_pending_invoices()

if __name__ == "__main__":
    main()
