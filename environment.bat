@echo off
REM Set environment variables for EHS Application

REM Database Configuration
set DB_USERNAME=postgres
set DB_PASSWORD=your_secure_db_password_here

REM JWT Secret (Generate a secure 256-bit key)
set JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here_please_generate_a_proper_256_bit_key

REM Email Configuration
set EMAIL_USERNAME=your_email@gmail.com
set EMAIL_PASSWORD=your_gmail_app_password

REM Application Environment
set SPRING_PROFILES_ACTIVE=prod

echo Environment variables set for EHS Production