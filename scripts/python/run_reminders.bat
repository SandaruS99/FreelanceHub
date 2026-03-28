@echo off
cd /d "%~dp0"
echo Running Overdue Invoice Reminders...
.\venv\Scripts\python.exe overdue_reminders.py
pause
