@echo off
echo ============================================
echo Starting EHS E-Learning Platform
echo ============================================

REM Set environment variables
call environment.bat

REM Check if JAR file exists
if not exist "EHS\target\EHS-0.0.1-SNAPSHOT.jar" (
    echo ERROR: Application JAR not found!
    echo Please run deploy.bat first to build the application.
    pause
    exit /b 1
)

echo Starting application on http://localhost:8080
echo Press Ctrl+C to stop the application
echo.

REM Start the application
java -jar EHS\target\EHS-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod

pause