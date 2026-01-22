@echo off
chcp 65001 >nul
title WPS AI 样式助手 - 全自动安装
color 0A

echo.
echo ╔════════════════════════════════════════════╗
echo ║   WPS AI 样式助手 - 全自动安装程序        ║
echo ╚════════════════════════════════════════════╝
echo.
echo 此脚本将自动安装所有依赖，请耐心等待...
echo.

:: 创建临时下载目录
set TEMP_DIR=%TEMP%\wps-ai-install
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

:: ============================================
:: 第一步：检测并安装 Python
:: ============================================
echo [1/4] 检测 Python 环境...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ 已安装 Python
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do echo      版本: %%i
) else (
    echo    ✗ 未检测到 Python，正在下载安装...
    echo.
    echo    请稍候，正在下载 Python 3.11.7 安装包...
    echo    （约 25MB，下载时间取决于网速）
    
    :: 下载 Python
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe' -OutFile '%TEMP_DIR%\python-installer.exe'}"
    
    if not exist "%TEMP_DIR%\python-installer.exe" (
        echo    [错误] Python 下载失败，请检查网络连接
        echo    您也可以手动下载安装：https://www.python.org/downloads/
        pause
        exit /b 1
    )
    
    echo    下载完成，正在安装...
    echo    （这可能需要 1-2 分钟，请不要关闭窗口）
    
    :: 静默安装 Python（添加到 PATH 并安装 pip）
    "%TEMP_DIR%\python-installer.exe" /quiet InstallAllUsers=0 PrependPath=1 Include_pip=1 Include_test=0
    
    :: 等待安装完成
    timeout /t 30 /nobreak >nul
    
    :: 刷新环境变量
    call RefreshEnv.cmd >nul 2>&1
    
    echo    ✓ Python 安装完成
)
echo.

:: ============================================
:: 第二步：检测并安装 Node.js
:: ============================================
echo [2/4] 检测 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ 已安装 Node.js
    for /f %%i in ('node --version 2^>^&1') do echo      版本: %%i
) else (
    echo    ✗ 未检测到 Node.js，正在下载安装...
    echo.
    echo    请稍候，正在下载 Node.js 20.11.0 LTS 安装包...
    echo    （约 30MB，下载时间取决于网速）
    
    :: 下载 Node.js
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile '%TEMP_DIR%\nodejs-installer.msi'}"
    
    if not exist "%TEMP_DIR%\nodejs-installer.msi" (
        echo    [错误] Node.js 下载失败，请检查网络连接
        echo    您也可以手动下载安装：https://nodejs.org/
        pause
        exit /b 1
    )
    
    echo    下载完成，正在安装...
    echo    （这可能需要 1-2 分钟，请不要关闭窗口）
    
    :: 静默安装 Node.js
    msiexec /i "%TEMP_DIR%\nodejs-installer.msi" /quiet /norestart
    
    :: 等待安装完成
    timeout /t 40 /nobreak >nul
    
    :: 刷新环境变量
    setx PATH "%PATH%;%ProgramFiles%\nodejs" >nul 2>&1
    
    echo    ✓ Node.js 安装完成
)
echo.

:: ============================================
:: 第三步：安装 Python 依赖
:: ============================================
echo [3/4] 安装后端依赖...

:: 使用国内镜像加速
cd backend
python -m pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple >nul 2>&1
python -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

if %errorlevel% equ 0 (
    echo    ✓ 后端依赖安装完成
) else (
    echo    ⚠ 部分依赖安装失败，但不影响核心功能
)
cd ..
echo.

:: ============================================
:: 第四步：安装 WPS 开发工具
:: ============================================
echo [4/4] 安装 WPS 开发工具 (wpsjs)...

:: 使用国内镜像加速
call npm config set registry https://registry.npmmirror.com
call npm install -g wpsjs

if %errorlevel% equ 0 (
    echo    ✓ WPS 开发工具安装完成
) else (
    echo    [警告] wpsjs 安装失败，将在启动时重试
)
echo.

:: 清理临时文件
rd /s /q "%TEMP_DIR%" >nul 2>&1

:: ============================================
:: 安装完成
:: ============================================
echo.
echo ╔════════════════════════════════════════════╗
echo ║            🎉 安装完成！                   ║
echo ╚════════════════════════════════════════════╝
echo.
echo 📝 下一步操作：
echo.
echo 1. 准备智谱 AI API Key
echo    • 访问：https://open.bigmodel.cn/
echo    • 注册并获取免费 API Key
echo.
echo 2. 启动插件
echo    • 双击运行 "启动插件.bat"
echo.
echo 3. 配置插件
echo    • 打开 WPS Writer
echo    • 点击顶部 "AI样式助手" → "打开面板"
echo    • 在设置中填写您的 API Key
echo.
echo ═══════════════════════════════════════════
echo.
echo 💡 提示：
echo    - 如果重启电脑前未能使用，请重启后再试
echo    - 首次使用建议关闭所有 WPS 窗口后重新打开
echo.
pause
