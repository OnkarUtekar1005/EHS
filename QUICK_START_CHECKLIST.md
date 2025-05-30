# 🚀 Quick Start Checklist for Windows Deployment

## Before You Start
1. **Copy this entire project folder to the new Windows laptop at: `C:\EHS-Production\`**
2. **All files are ready - just follow this checklist step by step**

## ✅ Step-by-Step Deployment

### 📥 1. Install Prerequisites (20 minutes)

#### Java 17
- [ ] Download from: https://adoptium.net/temurin/releases/?version=17
- [ ] Install and verify: `java -version`

#### PostgreSQL
- [ ] Download from: https://www.postgresql.org/download/windows/
- [ ] Install with password for 'postgres' user
- [ ] Verify: `psql --version`

#### Node.js
- [ ] Download LTS from: https://nodejs.org/en/download/
- [ ] Install and verify: `node --version`

### 🗄️ 2. Database Setup (5 minutes)

Open Command Prompt as Administrator:
```cmd
psql -U postgres -h localhost
CREATE DATABASE ehs_elearning_prod;
\q
```

### ⚙️ 3. Configure Environment (2 minutes)

Edit `C:\EHS-Production\environment.bat`:
- [ ] Set your PostgreSQL password
- [ ] Set your Gmail credentials
- [ ] Generate a secure JWT secret

### 🔨 4. Build and Deploy (10 minutes)

1. Open Command Prompt as Administrator
2. Navigate to: `cd C:\EHS-Production`
3. Run: `deploy.bat`
4. Wait for "Build completed successfully!" message

### 🚀 5. Start Application (1 minute)

Run: `start-application.bat`

### ✅ 6. Test Application (2 minutes)

- [ ] Open browser: http://localhost:8080
- [ ] Test login functionality
- [ ] Verify all features work

## 🔧 If Something Goes Wrong

### Database Connection Error:
```cmd
# Check PostgreSQL service
services.msc
# Look for "postgresql" service and start it
```

### Port 8080 in use:
```cmd
netstat -ano | findstr :8080
taskkill /PID <PID_NUMBER> /F
```

### Build fails:
```cmd
# Clear npm cache
cd "Frontend yash\ehs-learning-platform"
npm cache clean --force
rmdir /s node_modules
npm install
```

## 📁 Important Files You Have:

✅ **WINDOWS_DEPLOYMENT_GUIDE.md** - Complete detailed guide  
✅ **deploy.bat** - Main deployment script  
✅ **start-application.bat** - Start the application  
✅ **environment.bat** - Environment variables (EDIT THIS!)  
✅ **install-service.bat** - Optional Windows service setup  
✅ **application-prod.properties** - Production configuration  

## 🎯 Success Criteria:

- [ ] Application accessible at http://localhost:8080
- [ ] Login page loads correctly
- [ ] Users can log in successfully
- [ ] Course materials are viewable
- [ ] Certificates can be generated
- [ ] No console errors

## 📞 Quick Support:

**Total Time Needed: ~40 minutes**

Everything is configured and ready - just install the prerequisites and run the scripts!