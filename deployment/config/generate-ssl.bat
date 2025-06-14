@echo off
echo Generating SSL certificate for protecther.site...

:: Create SSL directory
mkdir C:\deployment\ssl 2>nul

:: Remove old certificates
del C:\deployment\ssl\protecther.* 2>nul

:: Generate private key with correct parameters
openssl genrsa -out C:\deployment\ssl\protecther.key 2048

:: Generate certificate signing request
openssl req -new -key C:\deployment\ssl\protecther.key -out C:\deployment\ssl\protecther.csr -config ssl-config.txt

:: Generate self-signed certificate with proper extensions
openssl x509 -req -days 365 -in C:\deployment\ssl\protecther.csr -signkey C:\deployment\ssl\protecther.key -out C:\deployment\ssl\protecther.crt -extensions v3_req -extfile ssl-config.txt

:: Verify certificate
echo.
echo Verifying certificate...
openssl x509 -in C:\deployment\ssl\protecther.crt -text -noout | findstr "Key Usage"
openssl x509 -in C:\deployment\ssl\protecther.crt -text -noout | findstr "Extended Key Usage"

echo.
echo SSL certificate generated successfully!
echo Files created:
echo - C:\deployment\ssl\protecther.key
echo - C:\deployment\ssl\protecther.crt
echo.
echo Certificate details verified above.
pause