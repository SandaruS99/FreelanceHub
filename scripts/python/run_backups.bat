@echo off
cd /d "%~dp0"
echo Running FreelanceHub Daily Backup...
.\venv\Scripts\python.exe db_backup.py
pause
