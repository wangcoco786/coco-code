@echo off
chcp 65001 >nul
title AI-PM Platform

echo.
echo ╔══════════════════════════════════════╗
echo ║     AI-PM Platform 启动脚本          ║
echo ╚══════════════════════════════════════╝
echo.

:: 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到 Node.js，请先安装：https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
echo.

:: 检查是否已构建
if not exist "dist\index.html" (
    echo 📦 首次运行，正在构建前端...
    call npm run build
    if errorlevel 1 (
        echo ❌ 构建失败，请检查错误信息
        pause
        exit /b 1
    )
    echo ✅ 构建完成
    echo.
)

:: 启动服务器
echo 🚀 正在启动服务器...
echo.
node server.js

pause
