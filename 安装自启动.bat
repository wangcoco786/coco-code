@echo off
chcp 65001 >nul
title 安装 AI-PM Platform 自启动服务

echo.
echo ╔══════════════════════════════════════════╗
echo ║   安装 AI-PM Platform 开机自启动          ║
echo ╚══════════════════════════════════════════╝
echo.

:: 获取当前目录（项目路径）
set PROJECT_DIR=%~dp0
:: 去掉末尾反斜杠
if "%PROJECT_DIR:~-1%"=="\" set PROJECT_DIR=%PROJECT_DIR:~0,-1%

echo 项目路径: %PROJECT_DIR%
echo.

:: 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到 Node.js，请先安装：https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('where node') do set NODE_PATH=%%i
echo Node.js 路径: %NODE_PATH%
echo.

:: 先构建一次（如果 dist 不存在）
if not exist "%PROJECT_DIR%\dist\index.html" (
    echo 📦 正在构建前端...
    cd /d "%PROJECT_DIR%"
    call npm run build
    if errorlevel 1 (
        echo ❌ 构建失败
        pause
        exit /b 1
    )
    echo ✅ 构建完成
    echo.
)

:: 创建任务计划（开机时以 SYSTEM 身份运行，无需登录）
echo 📋 正在注册任务计划...

schtasks /create /tn "AI-PM-Platform" /tr "\"%NODE_PATH%\" \"%PROJECT_DIR%\server.js\"" /sc onstart /ru SYSTEM /rl HIGHEST /f >nul 2>&1

if errorlevel 1 (
    echo ❌ 注册失败，尝试以当前用户注册...
    schtasks /create /tn "AI-PM-Platform" /tr "\"%NODE_PATH%\" \"%PROJECT_DIR%\server.js\"" /sc onlogon /ru "%USERNAME%" /rl HIGHEST /f >nul 2>&1
    if errorlevel 1 (
        echo ❌ 注册失败，请以管理员身份运行此脚本
        pause
        exit /b 1
    )
    echo ✅ 已注册为登录时自启动（当前用户）
) else (
    echo ✅ 已注册为开机自启动（系统级）
)

:: 立即启动服务
echo.
echo 🚀 正在立即启动服务...
schtasks /run /tn "AI-PM-Platform" >nul 2>&1

:: 等待 3 秒后检查
timeout /t 3 /nobreak >nul

:: 验证是否在运行
netstat -ano | findstr ":3000" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  服务可能还在启动中，请稍等几秒后访问
) else (
    echo ✅ 服务已在运行，端口 3000 已监听
)

echo.
echo ╔══════════════════════════════════════════╗
echo ║   安装完成！                              ║
echo ╚══════════════════════════════════════════╝
echo.
echo  访问地址：
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        echo    http://%%b:3000
    )
)
echo.
echo  每次开机后服务会自动启动，无需手动操作。
echo.
echo  管理命令：
echo    停止服务：schtasks /end /tn "AI-PM-Platform"
echo    启动服务：schtasks /run /tn "AI-PM-Platform"
echo    卸载自启：schtasks /delete /tn "AI-PM-Platform" /f
echo.
pause
