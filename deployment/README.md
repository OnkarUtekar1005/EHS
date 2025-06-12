# EHS E-Learning Platform - Deployment Package

## Overview
This folder contains everything needed to deploy the EHS E-Learning Platform using the JAR + Static Files method.

## Folder Structure
```
deployment/
├── README.md                       # This file
├── .env                           # Environment variables (UPDATE BEFORE USE)
├── docs/
│   ├── DEPLOYMENT_GUIDE.md        # Complete deployment instructions
│   └── NGINX_INSTALLATION.md      # Nginx installation guide
├── credentials/                   # Place Google Drive credentials here
│   └── (google-drive-service-account.json - ADD THIS FILE)
└── uploads/                       # Empty folder for file uploads
```

## Quick Start

1. **Read the Documentation**
   - Start with `docs/NGINX_INSTALLATION.md` if nginx is not installed
   - Follow `docs/DEPLOYMENT_GUIDE.md` for complete deployment steps

2. **Build the Application** (on development machine)
   ```bash
   # Backend
   cd "../EHS"
   mvn clean package -DskipTests
   cp target/EHS-0.0.1-SNAPSHOT.jar ../deployment/
   
   # Frontend
   cd "../Frontend yash/ehs-learning-platform"
   npm run build
   cp -r build/* ../../../deployment/frontend/
   ```

3. **Configure Environment**
   - Update `.env` file with your deployment machine details
   - Add Google Drive service account JSON to `credentials/` folder

4. **Copy to Deployment Machine**
   - Transfer this entire `deployment/` folder to your deployment machine

5. **Follow Deployment Guide**
   - Execute steps in `docs/DEPLOYMENT_GUIDE.md`

## Files Still Needed

### From Development Build:
- [ ] `EHS-0.0.1-SNAPSHOT.jar` (Backend JAR file)
- [ ] `frontend/` folder (Frontend build files)

### From External Sources:
- [ ] `credentials/google-drive-service-account.json` (Google Drive API credentials)

### To Configure:
- [ ] Update `.env` file with deployment machine IP addresses
- [ ] Update database credentials in `.env`
- [ ] Verify email credentials in `.env`

## Deployment Machine Requirements

- Java 17+
- PostgreSQL 12+
- Nginx (optional, for production)
- Network access to SMTP and Google APIs

## Support

If you encounter issues:
1. Check the troubleshooting section in `docs/DEPLOYMENT_GUIDE.md`
2. Verify all prerequisites are installed
3. Check log files for specific error messages

---
**Created**: 2025-06-12  
**Last Updated**: 2025-06-12