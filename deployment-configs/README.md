# EHS E-Learning Platform - Deployment Configs

Essential configuration files for deploying protecther.site

## Files Overview

### Backend Configuration
- **`.env`** - Backend environment variables (database, JWT, email, etc.)

### Nginx Configuration  
- **`nginx.conf`** - Complete nginx server configuration
  - HTTP server on port 80 (for CloudFlare Tunnel)
  - HTTPS server on port 443 (for direct access)
  - API proxy to backend
  - CloudFlare IP trust settings

### SSL Configuration
- **`ssl-config.txt`** - SSL certificate configuration
- **`generate-ssl.bat`** - Script to generate self-signed SSL certificates

### CloudFlare Tunnel
- **`cloudflare-config.yml`** - CloudFlare Tunnel configuration template
  - Update YOUR_TUNNEL_ID with actual tunnel ID

### Frontend Environment
- **`.env.development`** - React development environment
- **`.env.production`** - React production environment

## Usage

### 1. Backend Setup
```cmd
copy .env C:\deployment\backend\.env
```

### 2. Nginx Setup  
```cmd
copy nginx.conf C:\nginx\conf\nginx.conf
```

### 3. SSL Certificate
```cmd
copy ssl-config.txt C:\deployment\config\
copy generate-ssl.bat C:\deployment\config\
cd C:\deployment\config
generate-ssl.bat
```

### 4. CloudFlare Tunnel
```cmd
copy cloudflare-config.yml C:\cloudflared\config.yml
# Edit config.yml and replace YOUR_TUNNEL_ID with actual ID
```

### 5. Frontend Environment
```cmd
# For development
copy .env.development "Frontend yash/ehs-learning-platform/.env.development"

# For production  
copy .env.production "Frontend yash/ehs-learning-platform/.env.production"
```

## Directory Structure After Setup

```
C:\deployment\
├── backend\
│   ├── .env
│   └── EHS-0.0.1-SNAPSHOT.jar
├── frontend\
│   └── (React build files)
└── ssl\
    ├── protecther.key
    └── protecther.crt

C:\nginx\
└── conf\
    └── nginx.conf

C:\cloudflared\
└── config.yml
```

## Quick Deployment Commands

### Build and Deploy Backend
```cmd
cd EHS
mvn clean package -DskipTests
copy target\EHS-0.0.1-SNAPSHOT.jar C:\deployment\backend\
```

### Build and Deploy Frontend  
```cmd
cd "Frontend yash/ehs-learning-platform"
npm run build
rmdir /s /q C:\deployment\frontend
xcopy build C:\deployment\frontend /s /e /i
```

### Start Services
```cmd
# Start backend
cd C:\deployment\backend
java -jar EHS-0.0.1-SNAPSHOT.jar

# Start nginx
cd C:\nginx
nginx.exe

# Start CloudFlare tunnel
cd C:\cloudflared  
cloudflared.exe tunnel run --config config.yml YOUR_TUNNEL_ID
```

## Access Points

- **Development**: http://localhost:3000 (React dev server)
- **Local Production**: http://localhost (nginx)
- **Public Production**: https://protecther.site (CloudFlare)