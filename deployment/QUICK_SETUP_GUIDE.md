# Quick Setup Guide for Server IP: 192.168.222.216

## Files Created/Updated for Your Server

### 1. SSL Certificate Configuration
- **File**: `server.conf` 
- **Purpose**: OpenSSL config for generating SSL certificate with your IP
- **Action**: Copy to `C:\nginx\ssl\server.conf` on deployment machine

### 2. Nginx Configuration  
- **File**: `ehs-production.conf`
- **Purpose**: Complete nginx config for your server IP
- **Action**: Copy to `C:\nginx\conf\sites\ehs-production.conf` on deployment machine

### 3. Environment Variables
- **File**: `.env` (updated)
- **Change**: `FRONTEND_URL=https://192.168.222.216`
- **Action**: Use this .env file in your deployment

### 4. Backend CORS Configuration
- **File**: `application.properties` (updated)
- **Change**: Added your server IP to allowed origins
- **Action**: Already updated in your codebase

## Step-by-Step Deployment Commands

### On Your Deployment Machine (192.168.222.216):

#### 1. Create SSL Certificate
```cmd
# Create SSL directory
mkdir C:\nginx\ssl

# Copy server.conf to nginx ssl directory
copy deployment\server.conf C:\nginx\ssl\

# Navigate to OpenSSL
cd "C:\Program Files\OpenSSL-Win64\bin"

# Generate private key
openssl genrsa -out C:\nginx\ssl\nginx.key 2048

# Generate certificate request
openssl req -new -key C:\nginx\ssl\nginx.key -out C:\nginx\ssl\nginx.csr -config C:\nginx\ssl\server.conf

# Generate self-signed certificate
openssl x509 -req -days 365 -in C:\nginx\ssl\nginx.csr -signkey C:\nginx\ssl\nginx.key -out C:\nginx\ssl\nginx.crt -extensions v3_req -extfile C:\nginx\ssl\server.conf
```

#### 2. Configure Nginx
```cmd
# Create sites directory
mkdir C:\nginx\conf\sites

# Copy nginx config
copy deployment\ehs-production.conf C:\nginx\conf\sites\

# Update main nginx.conf to include sites
# Add this line to http block in C:\nginx\conf\nginx.conf:
# include sites/*.conf;

# Test configuration
C:\nginx\nginx.exe -t

# Start/reload nginx
C:\nginx\nginx.exe -s reload
```

#### 3. Configure Firewall
```cmd
# Run as Administrator
netsh advfirewall firewall add rule name="EHS-HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="EHS-HTTPS" dir=in action=allow protocol=TCP localport=443
```

#### 4. Deploy Application Files
```cmd
# Create deployment directory
mkdir C:\deployment
mkdir C:\deployment\frontend
mkdir C:\deployment\credentials
mkdir C:\deployment\uploads

# Copy files from your deployment folder:
copy .env C:\deployment\
copy EHS-0.0.1-SNAPSHOT.jar C:\deployment\
# Copy frontend build files to C:\deployment\frontend\
# Copy Google Drive credentials to C:\deployment\credentials\
```

#### 5. Start Backend
```cmd
# Navigate to deployment directory
cd C:\deployment

# Start the JAR file
java -jar EHS-0.0.1-SNAPSHOT.jar
```

## Access URLs

After setup:
- **Frontend**: `https://192.168.222.216`
- **Backend API**: `https://192.168.222.216/api/`

## Files You Still Need

### From Build Process:
1. **Backend JAR**: Build with `mvn clean package -DskipTests`
   - File: `target/EHS-0.0.1-SNAPSHOT.jar`
   - Copy to: `C:\deployment\`

2. **Frontend Build**: Build with `npm run build` 
   - Folder: `build/*`
   - Copy to: `C:\deployment\frontend\`

3. **Google Drive Credentials**: 
   - File: `google-drive-service-account.json`
   - Copy to: `C:\deployment\credentials\`

## What's Already Configured

✅ **SSL Certificate Config**: Ready for your IP  
✅ **Nginx Config**: Configured for HTTPS with your IP  
✅ **CORS Settings**: Backend allows your server IP  
✅ **Environment Variables**: Updated for HTTPS deployment  
✅ **Security Headers**: Added for production use  

## Verification Commands

```cmd
# Test certificate
openssl x509 -in C:\nginx\ssl\nginx.crt -text -noout

# Test nginx config
C:\nginx\nginx.exe -t

# Test connectivity
curl -k https://192.168.222.216
curl http://192.168.222.216:8080/actuator/health
```

## Troubleshooting

- **SSL Errors**: Check certificate paths in nginx config
- **502 Bad Gateway**: Ensure backend is running on port 8080
- **CORS Errors**: Verify backend application.properties has your IP
- **Firewall Issues**: Run firewall commands as Administrator

---
**Ready for deployment on**: 192.168.222.216  
**Protocol**: HTTPS with self-signed certificate  
**Access**: https://192.168.222.216