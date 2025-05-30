@echo off
echo ============================================
echo EHS E-Learning Platform - Windows Deployment
echo ============================================

REM Set environment variables
call environment.bat

REM Create directories
if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs

echo.
echo [1/4] Building React Frontend...
cd "Frontend yash\ehs-learning-platform"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

call npm run build
if %errorlevel% neq 0 (
    echo ERROR: React build failed
    pause
    exit /b 1
)

echo.
echo [2/4] Copying React build to Spring Boot static resources...
cd ..\..
if exist "EHS\src\main\resources\static" rmdir /s /q "EHS\src\main\resources\static"
mkdir "EHS\src\main\resources\static"
xcopy "Frontend yash\ehs-learning-platform\build\*" "EHS\src\main\resources\static\" /e /y

echo.
echo [3/4] Building Spring Boot Application...
cd EHS
call mvnw.cmd clean package -DskipTests -Pprod
if %errorlevel% neq 0 (
    echo ERROR: Spring Boot build failed
    pause
    exit /b 1
)

echo.
echo [4/4] Build completed successfully!
echo JAR file location: EHS\target\EHS-0.0.1-SNAPSHOT.jar
echo.
echo To start the application, run: start-application.bat
echo.
pause