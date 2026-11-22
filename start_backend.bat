@echo off
echo ========================================================
echo Starting I-ITSM Backend Server (FastAPI + Uvicorn)
echo URL: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo ========================================================
cd backend
python main.py
pause

