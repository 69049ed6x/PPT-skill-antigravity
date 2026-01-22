@echo off
chcp 65001 >nul
title WPS AI 样式助手

echo.
echo ====================================
echo   WPS AI 样式助手 正在启动...
echo ====================================
echo.

:: 检查端口占用并清理
echo [1/3] 检查端口占用...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8001') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3889') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo 端口清理完成 ✓
echo.

:: 启动后端
echo [2/3] 启动后端 API 服务（端口 8001）...
start "WPS AI 后端" cmd /k "cd backend && uvicorn main:app --host 0.0.0.0 --port 8001"
timeout /t 2 /nobreak >nul
echo 后端服务已启动 ✓
echo.

:: 启动前端
echo [3/3] 启动前端服务并注册 WPS 插件...
cd wps-native
start "WPS AI 前端" cmd /k "$env:WPS_ADDIN_DEBUG='1'; wpsjs debug"
cd ..
timeout /t 2 /nobreak >nul
echo 前端服务已启动 ✓
echo.

echo ====================================
echo   🎉 启动完成！
echo ====================================
echo.
echo 现在请：
echo 1. 打开 WPS Writer
echo 2. 在顶部找到 "AI样式助手" 选项卡
echo 3. 点击 "打开面板"
echo 4. 在右侧面板底部点击设置（齿轮图标）
echo 5. 填写您的智谱 AI API Key 并保存
echo.
echo 提示：关闭此窗口将停止插件服务
echo.
pause
