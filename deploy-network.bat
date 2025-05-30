@echo off
echo ============================================
echo EHS E-Learning Platform - Network Deployment
echo ============================================

REM Set environment variables and get network info
call environment-network.bat

REM Create directories
if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs

echo.
echo [NETWORK SETUP] Configuring Windows Firewall...
echo Adding firewall rule for port 8080...
netsh advfirewall firewall delete rule name="EHS-App-Port8080" >nul 2>&1
netsh advfirewall firewall add rule name="EHS-App-Port8080" dir=in action=allow protocol=TCP localport=8080
if %errorlevel% equ 0 (
    echo Firewall rule added successfully!
) else (
    echo WARNING: Could not add firewall rule. You may need to run as Administrator.
    echo Or manually allow port 8080 in Windows Firewall.
)

echo.
echo [1/5] Building React Frontend...
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
echo [2/5] Copying React build to Spring Boot static resources...
cd ..\..
if exist "EHS\src\main\resources\static" rmdir /s /q "EHS\src\main\resources\static"
mkdir "EHS\src\main\resources\static"
xcopy "Frontend yash\ehs-learning-platform\build\*" "EHS\src\main\resources\static\" /e /y

echo.
echo [3/5] Updating network configuration...
REM Update the application-network.properties with actual IP
powershell -Command "(Get-Content 'EHS\src\main\resources\application-network.properties') -replace 'YOUR_COMPUTER_IP', '%COMPUTER_IP%' -replace 'YOUR_COMPUTER_NAME', '%COMPUTER_NAME%' | Set-Content 'EHS\src\main\resources\application-network.properties'"

echo.
echo [4/5] Building Spring Boot Application...
cd EHS
call mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 (
    echo ERROR: Spring Boot build failed
    pause
    exit /b 1
)

echo.
echo [5/5] Network deployment completed successfully!
echo JAR file location: EHS\target\EHS-0.0.1-SNAPSHOT.jar
echo.
echo ============================================
echo NETWORK ACCESS INFORMATION
echo ============================================
echo.
echo Users can access the application at:
echo   http://%COMPUTER_IP%:8080
echo   http://%COMPUTER_NAME%:8080
echo   http://localhost:8080 (from this computer)
echo.
echo To start the application, run: start-application-network.bat
echo.
echo IMPORTANT NOTES:
echo 1. Make sure this computer stays connected to the network
echo 2. Users need to be on the same network to access the application
echo 3. If IP address changes, you may need to redeploy
echo 4. Ensure Windows Firewall allows port 8080
echo.
pause