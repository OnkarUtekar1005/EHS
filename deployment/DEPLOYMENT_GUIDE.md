# Complete Deployment Guide: protecther.site

Deploy EHS E-Learning Platform to protecther.site with ethernet IPv6 connection.

## Prerequisites

- ✅ Domain: protecther.site (Hostinger DNS)
- ✅ IPv6: 2402:e280:3e6c:205:1c09:98cb:1524:807c
- ✅ Database: PostgreSQL (username: postgres, password: root)
- ✅ Email: techview@gmail.com

## Step 1: Configure Hostinger DNS

**Login to Hostinger DNS Management and add:**

```
Type: AAAA
Name: @
Content: 2402:e280:3e6c:205:1c09:98cb:1524:807c
TTL: 300

Type: AAAA
Name: www
Content: 2402:e280:3e6c:205:1c09:98cb:1524:807c
TTL: 300
```

**Test DNS propagation:**
```cmd
nslookup protecther.site
ping -6 protecther.site
```

## Step 2: Windows Firewall Configuration

```cmd
# Open Command Prompt as Administrator

# Allow HTTP (port 80)
netsh advfirewall firewall add rule name="Allow HTTP" dir=in action=allow protocol=TCP localport=80

# Allow HTTPS (port 443)
netsh advfirewall firewall add rule name="Allow HTTPS" dir=in action=allow protocol=TCP localport=443

# Allow PostgreSQL (port 5432) - if needed
netsh advfirewall firewall add rule name="Allow PostgreSQL" dir=in action=allow protocol=TCP localport=5432
```

## Step 3: Generate SSL Certificate

```cmd
# Navigate to config directory
cd "deployment\config"

# Run SSL generation script
generate-ssl.bat
```

## Step 4: Update Application Configuration

### Copy environment file
```cmd
copy "deployment\config\.env" "C:\deployment\backend\.env"
```

### Update application.properties
**Edit:** `EHS\src\main\resources\application.properties`

**Change these lines:**
```properties
spring.mvc.cors.allowed-origin-patterns=https://protecther.site,https://www.protecther.site,http://localhost:*,https://localhost:*
```

### Update Spring Security CORS
**Edit:** `EHS\src\main\java\com\ehs\elearning\security\SecurityConfig.java`

**Update the allowed origins:**
```java
configuration.setAllowedOriginPatterns(Arrays.asList(
    "https://protecther.site",
    "https://www.protecther.site",
    "http://localhost:*",
    "https://localhost:*"
));
```

## Step 5: Build and Deploy Backend

```cmd
cd "EHS"

# Clean and build
mvn clean package -DskipTests

# Copy JAR to deployment directory
copy target\EHS-0.0.1-SNAPSHOT.jar C:\deployment\backend\

# Copy environment file
copy "deployment\config\.env" C:\deployment\backend\
```

## Step 6: Build and Deploy Frontend

```cmd
cd "Frontend yash\ehs-learning-platform"

# Build frontend
npm run build

# Copy to deployment directory
rmdir /s /q C:\deployment\frontend
xcopy build C:\deployment\frontend /s /e /i
```

## Step 7: Configure Nginx

### Stop existing nginx
```cmd
cd C:\nginx
nginx.exe -s stop
```

### Create required directories
```cmd
mkdir C:\nginx\conf\sites
mkdir C:\nginx\temp
mkdir C:\nginx\temp\client_body_temp
mkdir C:\nginx\temp\proxy_temp
mkdir C:\nginx\temp\fastcgi_temp
mkdir C:\nginx\temp\uwsgi_temp
mkdir C:\nginx\temp\scgi_temp
mkdir C:\nginx\logs
```

### Copy configuration files
```cmd
copy "deployment\config\nginx.conf" C:\nginx\conf\nginx.conf
copy "deployment\config\protecther.conf" C:\nginx\conf\sites\protecther.conf
```

### Test nginx configuration
```cmd
cd C:\nginx
nginx.exe -t
```

## Step 8: Start Services

### Start PostgreSQL
```cmd
net start postgresql-x64-14
```

### Start Backend
```cmd
cd C:\deployment\backend
java -jar EHS-0.0.1-SNAPSHOT.jar
```
**Or set up as Windows service (recommended):**
```cmd
# Install NSSM if not installed
# Download from: https://nssm.cc/download

# Create service
nssm install EHS-Backend "C:\Program Files\Java\jdk-17\bin\java.exe"
nssm set EHS-Backend Arguments "-jar C:\deployment\backend\EHS-0.0.1-SNAPSHOT.jar"
nssm set EHS-Backend AppDirectory "C:\deployment\backend"
nssm set EHS-Backend DisplayName "EHS E-Learning Backend"
nssm set EHS-Backend Description "Protecther E-Learning Platform Backend Service"

# Start service
net start EHS-Backend
```

### Start Nginx
```cmd
cd C:\nginx
nginx.exe
```

## Step 9: Test Deployment

### Test HTTPS Access
```cmd
# Test domain resolution
nslookup protecther.site

# Test HTTPS access
curl -k https://protecther.site/health
```

### Test in Browser
1. **Open:** https://protecther.site
2. **Should redirect from:** http://protecther.site
3. **Test login:** Use admin credentials
4. **Test API:** Check browser console for errors

### Test API Endpoints
```cmd
# Test login API
curl -k -X POST https://protecther.site/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

## Step 10: Create Admin User (if needed)

**Connect to PostgreSQL:**
```cmd
psql -U postgres -d ehs_elearning
```

**Create admin user:**
```sql
INSERT INTO users (id, username, email, password, role, created_at, updated_at) 
VALUES (
  gen_random_uuid(),
  'admin',
  'admin@protecther.site',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
  'ADMIN',
  NOW(),
  NOW()
);
```

## Troubleshooting

### Issue: "This site can't be reached"
**Solution:**
1. Check DNS: `nslookup protecther.site`
2. Check firewall rules
3. Verify IPv6 connectivity: `ping -6 protecther.site`

### Issue: "SSL Certificate Error"
**Solution:**
1. Regenerate certificate: Run `generate-ssl.bat`
2. Check certificate paths in nginx config
3. Browser warning is normal for self-signed certificates

### Issue: "502 Bad Gateway"
**Solution:**
1. Check backend is running: `netstat -ano | findstr :8080`
2. Check backend logs
3. Verify nginx proxy configuration

### Issue: "CORS Errors"
**Solution:**
1. Check CORS configuration in application.properties
2. Verify Spring Security CORS settings
3. Clear browser cache

## Maintenance Commands

```cmd
# Check services
tasklist | findstr nginx
tasklist | findstr java
net query EHS-Backend

# Restart services
nginx.exe -s reload
net restart EHS-Backend

# View logs
type C:\nginx\logs\error.log
type C:\nginx\logs\access.log

# Check IPv6 address (if changed)
curl ifconfig.me
```

## Success Checklist

- [ ] DNS AAAA records configured
- [ ] Firewall ports opened
- [ ] SSL certificate generated
- [ ] Backend built and deployed
- [ ] Frontend built and deployed
- [ ] Nginx configured and running
- [ ] Backend service running
- [ ] HTTPS site accessible
- [ ] Login functionality working
- [ ] API endpoints responding
- [ ] Admin user created

---

**🎉 Your EHS E-Learning Platform should now be live at https://protecther.site!**