@echo off
echo ============================================
echo Starting EHS E-Learning Platform (Network Mode)
echo ============================================

REM Set environment variables and get network info
call environment-network.bat

REM Check if JAR file exists
if not exist "EHS\target\EHS-0.0.1-SNAPSHOT.jar" (
    echo ERROR: Application JAR not found!
    echo Please run deploy-network.bat first to build the application.
    pause
    exit /b 1
)

echo.
echo ============================================
echo APPLICATION STARTING
echo ============================================
echo.
echo Local access: http://localhost:8080
echo Network access: http://%COMPUTER_IP%:8080
echo Computer name access: http://%COMPUTER_NAME%:8080
echo.
echo Share these URLs with other users on your network!
echo.
echo Press Ctrl+C to stop the application
echo ============================================
echo.

REM Start the application
java -jar EHS\target\EHS-0.0.1-SNAPSHOT.jar --spring.profiles.active=network

pause