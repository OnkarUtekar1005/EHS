# EHS E-Learning Platform - Deployment Package

## 📁 Package Contents

```
deployment/
├── ULTIMATE_DEPLOYMENT_GUIDE.md    # Complete deployment guide
├── README.md                       # This file
├── configs/
│   ├── .env                        # Environment variables (IP-based)
│   ├── .env-domain                 # Environment variables (Domain-based)
│   ├── server.conf                 # SSL certificate configuration
│   ├── ehs-ip.conf                 # Nginx config for IP access
│   └── ehs-domain.conf             # Nginx config for domain access
├── credentials/
│   └── (place google-drive-service-account.json here)
├── docs/
└── uploads/
```

## 🚀 Quick Start

1. **Read the guide**: `ULTIMATE_DEPLOYMENT_GUIDE.md`
2. **Build your application** (backend JAR + frontend build)
3. **Copy files** to deployment machine
4. **Follow the guide** step by step

## 📝 What You Need to Add

### From Your Build:
- [ ] `EHS-0.0.1-SNAPSHOT.jar` → `backend/` folder
- [ ] Frontend `build/*` files → `frontend/` folder
- [ ] Google Drive JSON → `credentials/` folder

### Configuration Updates:
- [ ] Update email settings in `.env` files
- [ ] Update Google Drive folder ID in `.env` files
- [ ] Update domain name in `ehs-domain.conf` (if using domain)

## 🎯 Access Information

### IP-Based Access:
- **URL**: `https://192.168.222.216`
- **Config**: Use `configs/.env` and `configs/ehs-ip.conf`
- **SSL**: Self-signed certificate

### Domain-Based Access:
- **URL**: `https://ehslearning.ddns.net` (change to your domain)
- **Config**: Use `configs/.env-domain` and `configs/ehs-domain.conf`
- **SSL**: Let's Encrypt certificate (free, auto-renewing)

## 🔧 Default Credentials

**Database:**
- Username: `ehs_user`
- Password: `EHS@2025!Secure`
- Database: `ehs_elearning_production`

**Application Admin:**
- Username: `admin`
- Password: `admin123`
- **⚠️ CHANGE IMMEDIATELY AFTER FIRST LOGIN**

## 📞 Support

- Complete instructions in `ULTIMATE_DEPLOYMENT_GUIDE.md`
- Troubleshooting section included
- Maintenance procedures documented

---
**🎉 Ready for professional deployment!**