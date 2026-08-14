@echo off
cd /d c:\item-lp-071\dist\ai-pm-platform
git push origin main > push-log.txt 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> push-log.txt
