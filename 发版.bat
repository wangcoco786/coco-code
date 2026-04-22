@echo off
chcp 65001 >nul
title AI-PM Platform 发版

echo.
echo ╔══════════════════════════════════════════╗
echo ║     AI-PM Platform 发版脚本              ║
echo ╚══════════════════════════════════════════╝
echo.

set PROJECT_DIR=%~dp0
if "%PROJECT_DIR:~-1%"=="\" set PROJECT_DIR=%PROJECT_DIR:~0,-1%

cd /d "%PROJECT_DIR%"

:: 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到 Node.js
    pause & exit /b 1
)

:: 构建
echo 📦 正在构建新版本...
call npm run build
if errorlevel 1 (
    echo ❌ 构建失败，请检查错误信息
    pause & exit /b 1
)
echo ✅ 构建完成
echo.

:: 停止旧服务
echo 🛑 正在停止旧服务...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 "') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul

:: 启动新服务（后台）
echo 🚀 正在启动新服务...
start /b "" node server.js > logs.txt 2>&1
timeout /t 3 /nobreak >nul

:: 验证
netstat -ano | findstr ":3000" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  服务启动中，请稍等...
) else (
    echo ✅ 新版本已上线！
)

echo.
echo  访问地址：
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do echo    http://%%b:3000
)
echo.
echo  请通知团队成员按 Ctrl+Shift+R 刷新浏览器
echo.
pause
