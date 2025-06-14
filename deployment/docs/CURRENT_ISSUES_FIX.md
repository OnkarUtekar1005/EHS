# Fix Current Deployment Issues

## Issues Identified:

1. **SSL Certificate Error**: `ERR_SSL_KEY_USAGE_INCOMPATIBLE`
2. **Nginx Configuration Conflicts**: Duplicate server names
3. **Deprecated HTTP2 Directive**
4. **Windows Firewall**: Not configured

## Fix 1: Windows Firewall Configuration (CRITICAL)

### Run Command Prompt as Administrator:
```cmd
# Allow HTTP traffic
netsh advfirewall firewall add rule name="EHS-HTTP" dir=in action=allow protocol=TCP localport=80

# Allow HTTPS traffic  
netsh advfirewall firewall add rule name="EHS-HTTPS" dir=in action=allow protocol=TCP localport=443

# Allow backend traffic (optional)
netsh advfirewall firewall add rule name="EHS-Backend" dir=in action=allow protocol=TCP localport=8080

# Verify rules were added
netsh advfirewall firewall show rule name="EHS-HTTPS"
```

## Fix 2: Clean Nginx Configuration

### Step 1: Stop Nginx
```cmd
cd C:\nginx
nginx.exe -s stop
```

### Step 2: Clean Configuration Directory
```cmd
# Remove all files from sites directory
del C:\nginx\conf\sites\*.conf

# We'll add only one clean configuration
```

### Step 3: Create Clean Configuration
Create file: `C:\nginx\conf\sites\ehs-clean.conf`

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name 192.168.222.216;
    return 301 https://$server_name$request_uri;
}

# HTTPS server for EHS frontend
server {
    listen 443 ssl;
    http2 on;
    server_name 192.168.222.216;
    
    # SSL Configuration
    ssl_certificate C:/deployment/ssl/nginx.crt;
    ssl_certificate_key C:/deployment/ssl/nginx.key;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Document root
    root C:/deployment/frontend;
    index index.html;
    
    # File upload size
    client_max_body_size 200M;
    
    # Frontend routing (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://192.168.222.216" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # Handle preflight requests
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "https://192.168.222.216";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
            add_header Access-Control-Allow-Credentials true;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security - deny hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

## Fix 3: Regenerate SSL Certificate

### Step 1: Delete Old Certificate
```cmd
del C:\deployment\ssl\nginx.crt
del C:\deployment\ssl\nginx.key
del C:\deployment\ssl\nginx.csr
```

### Step 2: Create Proper SSL Configuration
Create file: `C:\deployment\ssl\server-fixed.conf`

```ini
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C=US
ST=State
L=City
O=EHS Learning Platform
OU=IT Department
CN=192.168.222.216

[v3_req]
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 192.168.222.216
IP.2 = 127.0.0.1
```

### Step 3: Generate New Certificate
```cmd
# Navigate to OpenSSL directory
cd "C:\Program Files\OpenSSL-Win64\bin"

# Generate private key
openssl genrsa -out C:\deployment\ssl\nginx.key 2048

# Generate certificate request
openssl req -new -key C:\deployment\ssl\nginx.key -out C:\deployment\ssl\nginx.csr -config C:\deployment\ssl\server-fixed.conf

# Generate self-signed certificate
openssl x509 -req -days 365 -in C:\deployment\ssl\nginx.csr -signkey C:\deployment\ssl\nginx.key -out C:\deployment\ssl\nginx.crt -extensions v3_req -extfile C:\deployment\ssl\server-fixed.conf

# Verify certificate
openssl x509 -in C:\deployment\ssl\nginx.crt -text -noout
```

## Fix 4: Update Main Nginx Configuration

Edit `C:\nginx\conf\nginx.conf`:

```nginx
worker_processes  auto;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    
    # Logging
    access_log  logs/access.log;
    error_log   logs/error.log;
    
    # Basic settings
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout  65;
    client_max_body_size 200M;
    
    # Temp directories
    client_body_temp_path temp/client_body_temp;
    proxy_temp_path temp/proxy_temp;
    fastcgi_temp_path temp/fastcgi_temp;
    uwsgi_temp_path temp/uwsgi_temp;
    scgi_temp_path temp/scgi_temp;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Include ONLY our clean configuration
    include sites/ehs-clean.conf;
}
```

## Fix 5: Complete Restart Sequence

### Step 1: Stop Everything
```cmd
# Stop nginx
cd C:\nginx
nginx.exe -s stop

# Stop backend (Ctrl+C in its window)

# Check nothing is running
tasklist | findstr nginx
tasklist | findstr java
```

### Step 2: Test Configuration
```cmd
# Test nginx configuration
cd C:\nginx
nginx.exe -t

# Should show no warnings now
```

### Step 3: Start Services
```cmd
# Start nginx
cd C:\nginx
nginx.exe

# Start backend in new command prompt
cd C:\deployment\backend
java -jar EHS-0.0.1-SNAPSHOT.jar
```

## Fix 6: Test Access

### Step 1: Test Local Access
```cmd
# Test HTTP redirect
curl -I http://192.168.222.216

# Test HTTPS (ignore SSL warning for self-signed)
curl -k https://192.168.222.216

# Test backend
curl http://localhost:8080/actuator/health
```

### Step 2: Browser Test
1. Clear browser cache and cookies
2. Navigate to: `https://192.168.222.216`
3. You'll see SSL warning - click "Advanced" → "Proceed to 192.168.222.216"
4. Should see EHS login page

## Fix 7: If SSL Still Doesn't Work

### Alternative: HTTP Only (Temporary)
Create `C:\nginx\conf\sites\ehs-http-only.conf`:

```nginx
server {
    listen 80;
    server_name 192.168.222.216;
    
    root C:/deployment/frontend;
    index index.html;
    
    client_max_body_size 200M;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then update `.env`:
```bash
FRONTEND_URL=http://192.168.222.216
```

Access via: `http://192.168.222.216` (no HTTPS)

## Quick Fix Commands Summary

```cmd
# 1. Configure firewall (as Administrator)
netsh advfirewall firewall add rule name="EHS-HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="EHS-HTTPS" dir=in action=allow protocol=TCP localport=443

# 2. Stop nginx
cd C:\nginx
nginx.exe -s stop

# 3. Clean configuration
del C:\nginx\conf\sites\*.conf

# 4. Copy clean configuration (use content above)
# Create: C:\nginx\conf\sites\ehs-clean.conf

# 5. Regenerate SSL certificate (use commands above)

# 6. Test and start
nginx.exe -t
nginx.exe

# 7. Start backend
cd C:\deployment\backend
java -jar EHS-0.0.1-SNAPSHOT.jar
```

## Expected Result
- **No nginx warnings**
- **Firewall allows traffic**
- **Clean SSL certificate**
- **Access works**: `https://192.168.222.216`

Follow these fixes in order, and your deployment should work properly!