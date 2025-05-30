# 🌐 Network Deployment - Quick Start Guide

## 🎯 Goal: Make Your App Accessible to Other People on the Network

### ⚡ Super Quick Setup (15 minutes)

1. **Copy project to: `C:\EHS-Production\`**

2. **Install prerequisites:**
   - Java 17, PostgreSQL, Node.js (same as local deployment)

3. **Set up database:**
   ```cmd
   psql -U postgres -h localhost
   CREATE DATABASE ehs_elearning_prod;
   \q
   ```

4. **Edit credentials in `environment-network.bat`**

5. **Run network deployment:**
   ```cmd
   # Run as Administrator for firewall setup
   deploy-network.bat
   ```

6. **Start the application:**
   ```cmd
   start-application-network.bat
   ```

### 📱 Share with Users

After deployment, the script will show you:
```
Users can access the application at:
  http://192.168.1.100:8080  (your actual IP)
  http://COMPUTER-NAME:8080
```

**Share these URLs with your team!**

## 🔍 Key Differences from Local Deployment

| Feature | Local Only | Network Access |
|---------|------------|----------------|
| **Scripts** | `deploy.bat` | `deploy-network.bat` |
| **Startup** | `start-application.bat` | `start-application-network.bat` |
| **Access** | localhost:8080 only | IP:8080 from any device |
| **Firewall** | Not needed | Automatically configured |
| **Config** | application-prod.properties | application-network.properties |

## 🛡️ What the Network Scripts Do Automatically

1. **Configure Windows Firewall** - Opens port 8080
2. **Get Your IP Address** - Finds your computer's network IP
3. **Update CORS Settings** - Allows network access
4. **Set Server Address** - Listens on all network interfaces (0.0.0.0)
5. **Show Access URLs** - Displays URLs for users to access

## 📱 User Instructions (Share This)

### For Your Team:
1. **Connect to the same WiFi/Network**
2. **Open any web browser**
3. **Go to: `http://[THE_IP_SHOWN]:8080`**
4. **Login and use the application normally**

### Works On:
- ✅ Windows computers
- ✅ Mac computers  
- ✅ Mobile phones
- ✅ Tablets
- ✅ Any device with a web browser

## 🔧 Troubleshooting

### Can't access from other devices?

1. **Check firewall:**
   ```cmd
   netsh advfirewall firewall show rule name="EHS-App-Port8080"
   ```

2. **Verify app is listening:**
   ```cmd
   netstat -an | findstr :8080
   ```
   Should show: `0.0.0.0:8080`

3. **Test from another device:**
   - Ping the server: `ping [SERVER_IP]`
   - Try different browsers

### IP Address Changed?
- Run `deploy-network.bat` again
- Share new URL with users

## 🎉 Success Checklist

- [ ] Application starts without errors
- [ ] You can access via localhost:8080
- [ ] Others can access via your IP:8080
- [ ] All features work from other devices
- [ ] Mobile devices can access and use the app

**That's it! Your EHS E-Learning Platform is now accessible to your entire network!**