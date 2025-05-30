@echo off
echo Installing EHS as Windows Service...

REM Download NSSM (Non-Sucking Service Manager)
echo Please download NSSM from: https://nssm.cc/download
echo Extract nssm.exe to C:\EHS-Production\

if not exist "nssm.exe" (
    echo ERROR: nssm.exe not found!
    echo Please download and extract NSSM first.
    pause
    exit /b 1
)

REM Install service
nssm install EHS-ELearning "C:\Program Files\Java\jdk-17\bin\java.exe"
nssm set EHS-ELearning Arguments "-jar C:\EHS-Production\EHS\target\EHS-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod"
nssm set EHS-ELearning AppDirectory "C:\EHS-Production"
nssm set EHS-ELearning DisplayName "EHS E-Learning Platform"
nssm set EHS-ELearning Description "EHS E-Learning Platform Web Application"
nssm set EHS-ELearning Start SERVICE_AUTO_START

echo Service installed successfully!
echo Use 'net start EHS-ELearning' to start the service
echo Use 'net stop EHS-ELearning' to stop the service
pause