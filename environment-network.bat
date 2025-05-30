@echo off
REM Set environment variables for EHS Application - Network Deployment

REM Get computer's IP address automatically
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do set COMPUTER_IP=%%a
set COMPUTER_IP=%COMPUTER_IP: =%

REM Get computer name
set COMPUTER_NAME=%COMPUTERNAME%

echo.
echo ============================================
echo EHS Network Deployment Configuration
echo ============================================
echo Computer Name: %COMPUTER_NAME%
echo Computer IP: %COMPUTER_IP%
echo.
echo Users can access the application at:
echo   http://%COMPUTER_IP%:8080
echo   http://%COMPUTER_NAME%:8080
echo ============================================
echo.

REM Database Configuration
set DB_USERNAME=postgres
set DB_PASSWORD=your_secure_db_password_here

REM JWT Secret (Generate a secure 256-bit key)
set JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here_please_generate_a_proper_256_bit_key

REM Email Configuration
set EMAIL_USERNAME=your_email@gmail.com
set EMAIL_PASSWORD=your_gmail_app_password

REM Application Environment
set SPRING_PROFILES_ACTIVE=network

echo Environment variables set for EHS Network Production