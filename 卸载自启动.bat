@echo off
chcp 65001 >nul
title 卸载 AI-PM Platform 自启动服务

echo.
echo ╔══════════════════════════════════════════╗
echo ║   卸载 AI-PM Platform 自启动服务          ║
echo ╚══════════════════════════════════════════╝
echo.

:: 先停止服务
echo 🛑 正在停止服务...
schtasks /end /tn "AI-PM-Platform" >nul 2>&1

:: 删除任务计划
echo 🗑️  正在删除任务计划...
schtasks /delete /tn "AI-PM-Platform" /f >nul 2>&1

if errorlevel 1 (
    echo ⚠️  任务计划不存在或已删除
) else (
    echo ✅ 自启动服务已卸载
)

echo.
echo 如需重新安装，运行"安装自启动.bat"
echo.
pause
