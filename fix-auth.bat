@echo off
cd /d c:\item-lp-071\dist\ai-pm-platform

echo Logging out from GitHub CLI...
gh auth logout --hostname github.com

echo.
echo Now login with wangcoco786 account...
gh auth login --hostname github.com --web --git-protocol https

echo.
echo Pushing to origin main...
git push origin main
pause
