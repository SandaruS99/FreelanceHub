@echo off
cd /d "%~dp0"
echo Running Automated WhatsApp Invoice Sender...
echo (NOTE: Next.js app must be running for PDF downloads!)
.\venv\Scripts\python.exe whatsapp_sender.py
pause
