@echo off
echo ========================================================
echo Running Automated Test Suite (18 Test Cases)
echo Covers: Strategy, State, Factory, Observer, SLA, AI
echo ========================================================
cd backend
python -m unittest tests.test_itsm -v
pause

