@echo off
chcp 65001 >nul
echo ====================================
echo   WPS AI 样式助手 - 打包工具
echo ====================================
echo.

:: 设置打包目标目录
set PKG_DIR=%cd%\wps-ai-stylist-package
set ZIP_NAME=wps-ai-stylist.zip

echo [1/4] 清理旧的打包文件...
if exist "%PKG_DIR%" rd /s /q "%PKG_DIR%"
if exist "%ZIP_NAME%" del /f /q "%ZIP_NAME%"
echo.

echo [2/4] 创建打包目录结构...
mkdir "%PKG_DIR%"
echo.

echo [3/4] 复制必要文件...

:: 复制根目录文件
copy "一键安装.bat" "%PKG_DIR%\" >nul
copy "启动插件.bat" "%PKG_DIR%\" >nul
copy "README.md" "%PKG_DIR%\" >nul

:: 复制 backend 文件夹（排除不需要的）
echo - 复制后端文件...
xcopy "backend\*.py" "%PKG_DIR%\backend\" /E /I /Y /Q >nul
xcopy "backend\requirements.txt" "%PKG_DIR%\backend\" /Y /Q >nul

:: 复制 wps-native 文件夹（排除 node_modules）
echo - 复制前端文件...
xcopy "wps-native\*.html" "%PKG_DIR%\wps-native\" /E /I /Y /Q >nul
xcopy "wps-native\*.xml" "%PKG_DIR%\wps-native\" /E /I /Y /Q >nul
xcopy "wps-native\*.js" "%PKG_DIR%\wps-native\" /E /I /Y /Q >nul
xcopy "wps-native\*.css" "%PKG_DIR%\wps-native\" /E /I /Y /Q >nul
xcopy "wps-native\*.json" "%PKG_DIR%\wps-native\" /E /I /Y /Q >nul
if exist "wps-native\images" xcopy "wps-native\images\*" "%PKG_DIR%\wps-native\images\" /E /I /Y /Q >nul
echo.

echo [4/4] 压缩打包...
:: 使用 PowerShell 压缩（Windows 10+）
powershell -command "Compress-Archive -Path '%PKG_DIR%\*' -DestinationPath '%ZIP_NAME%' -Force"
echo.

:: 清理临时文件夹
rd /s /q "%PKG_DIR%"

echo ====================================
echo   ✅ 打包完成！
echo ====================================
echo.
echo 生成的文件: %ZIP_NAME%
echo 文件位置: %cd%
echo.
echo 现在可以将 %ZIP_NAME% 分享给其他人了！
echo.
pause
