# EHS E-Learning Platform - JAR Deployment Guide

## Prerequisites on Deployment Machine

### Required Software
- **Java 17 or higher** (`java -version` to check)
- **PostgreSQL** (version 12+)
- **Web Server** (nginx/apache) for frontend
- **Network access** to SMTP and Google Drive APIs

## Step 1: Prepare Files on Development Machine

### Backend (JAR file)
```bash
# Navigate to backend directory
cd "/mnt/d/YASH/Projects GGC/stanley attempt 2/EHS/EHS"

# Clean and build JAR file
mvn clean package -DskipTests

# JAR file will be created at: target/EHS-0.0.1-SNAPSHOT.jar
```

### Frontend (Static files)
```bash
# Navigate to frontend directory
cd "/mnt/d/YASH/Projects GGC/stanley attempt 2/EHS/Frontend yash/ehs-learning-platform"

# Build production files
npm run build

# Static files will be in: build/ folder
```

## Step 2: Files to Copy to Deployment Machine

Create a deployment folder and copy these files:

```
deployment/
├── EHS-0.0.1-SNAPSHOT.jar          # Backend JAR
├── .env                            # Environment variables
├── credentials/
│   └── google-drive-service-account.json
├── frontend/                       # Frontend build files
│   ├── index.html
│   ├── static/
│   └── ... (all files from build/)
└── uploads/                        # Create empty folder for file uploads
```

## Step 3: Environment Configuration

### Update .env file for deployment machine
```bash
# Database Configuration
DB_URL=jdbc:postgresql://localhost:5432/ehs_elearning_test_v2
DB_USERNAME=postgres
DB_PASSWORD=your_production_password

# JWT Configuration (12 hours)
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=43200000
JWT_HEADER=Authorization
JWT_PREFIX=Bearer 

# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# Google Drive Configuration
GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY_PATH=credentials/google-drive-service-account.json
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
GOOGLE_DRIVE_APPLICATION_NAME=EHS E-Learning Platform

# Frontend URL (update with deployment machine IP)
FRONTEND_URL=http://192.168.1.100:3000
```

## Step 4: Database Setup

### Create PostgreSQL Database
```sql
-- Connect to PostgreSQL as postgres user
psql -U postgres

-- Create database
CREATE DATABASE ehs_elearning_test_v2;

-- Create user (optional, or use existing postgres user)
CREATE USER ehs_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ehs_elearning_test_v2 TO ehs_user;

-- Exit
\q
```

## Step 5: Deploy Backend

### Option A: Direct Run
```bash
# Navigate to deployment folder
cd /path/to/deployment

# Run the application
java -jar EHS-0.0.1-SNAPSHOT.jar

# Application will start on port 8080
```

### Option B: Run as Service (Linux)
Create service file: `/etc/systemd/system/ehs-backend.service`
```ini
[Unit]
Description=EHS E-Learning Backend
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/deployment
ExecStart=/usr/bin/java -jar EHS-0.0.1-SNAPSHOT.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable ehs-backend
sudo systemctl start ehs-backend
sudo systemctl status ehs-backend
```

## Step 6: Deploy Frontend

### Option A: Simple HTTP Server (Testing)
```bash
# Using Python
cd /path/to/deployment/frontend
python3 -m http.server 3000

# Using Node.js
npx serve -s . -l 3000
```

### Option B: Nginx (Production)
**See NGINX_INSTALLATION.md for nginx installation steps**

Create nginx config: `/etc/nginx/sites-available/ehs-frontend`
```nginx
server {
    listen 3000;
    server_name localhost;
    
    root /path/to/deployment/frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/ehs-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 7: Verification

### Check Services
```bash
# Backend health
curl http://localhost:8080/actuator/health

# Frontend access
curl http://localhost:3000

# Database connection
psql -U postgres -d ehs_elearning_test_v2 -c "SELECT 1;"
```

### Access Application
- **Frontend**: `http://[deployment-machine-ip]:3000`
- **Backend API**: `http://[deployment-machine-ip]:8080`

## Step 8: Security & Maintenance

### Firewall Rules
```bash
# Allow required ports
sudo ufw allow 3000  # Frontend
sudo ufw allow 8080  # Backend (optional, if direct access needed)
sudo ufw allow 5432  # PostgreSQL (only if external access needed)
```

### Regular Maintenance
- **Logs**: Check application logs in `/var/log/` or service logs
- **Backups**: Regular database backups
- **Updates**: Keep Java and PostgreSQL updated
- **Monitoring**: Monitor disk space, memory usage

### Troubleshooting
- **Backend logs**: `journalctl -u ehs-backend -f`
- **Nginx logs**: `/var/log/nginx/error.log`
- **Database logs**: `/var/log/postgresql/`

## Quick Start Checklist

- [ ] Java 17+ installed
- [ ] PostgreSQL installed and database created
- [ ] JAR file copied to deployment machine
- [ ] .env file updated with correct IPs
- [ ] credentials/ folder copied
- [ ] Frontend build files copied
- [ ] Backend started and running on :8080
- [ ] Frontend served on :3000
- [ ] Application accessible via browser

## Default Access

**Test the deployment by accessing:**
- Frontend: `http://deployment-machine-ip:3000`
- Login with your admin credentials

## Support

For issues during deployment:
1. Check logs for specific error messages
2. Verify all ports are accessible
3. Ensure database is running and accessible
4. Check .env file configuration
5. Verify file permissions

---
**Created**: 2025-06-12  
**Version**: 1.0