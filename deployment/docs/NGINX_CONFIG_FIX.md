# Fix Nginx Configuration Conflicts

## Issues in Your Current nginx.conf:

1. **Duplicate includes**: You have both `include sites/*.conf;` and `include sites/ehs-clean.conf;`
2. **Conflicting servers**: Default server block conflicts with your EHS config
3. **Missing PID directory**: nginx.pid file location issue

## Solution: Clean nginx.conf

Replace your entire `C:\nginx\conf\nginx.conf` with this clean version:

```nginx
worker_processes  auto;
error_log  logs/error.log;
pid        logs/nginx.pid;

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
    
    # Include ONLY EHS configuration
    include sites/ehs-clean.conf;
}
```

## Step-by-Step Fix:

### Step 1: Force Stop Nginx
```cmd
# Kill any nginx processes
tasklist | findstr nginx

# If you see nginx processes, kill them:
taskkill /f /im nginx.exe
```

### Step 2: Create Required Directories
```cmd
cd C:\nginx

# Create temp directories
mkdir temp
mkdir temp\client_body_temp
mkdir temp\proxy_temp
mkdir temp\fastcgi_temp
mkdir temp\uwsgi_temp
mkdir temp\scgi_temp

# Ensure logs directory exists
mkdir logs
```

### Step 3: Clean Configuration
```cmd
# Remove old configurations
del C:\nginx\conf\sites\*.conf

# We'll create only one clean config
```

### Step 4: Create Clean EHS Configuration
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

### Step 5: Replace nginx.conf
Replace the entire content of `C:\nginx\conf\nginx.conf` with the clean version above.

### Step 6: Test Configuration
```cmd
cd C:\nginx
nginx.exe -t

# Should show:
# nginx: the configuration file C:\nginx/conf/nginx.conf syntax is ok
# nginx: configuration file C:\nginx/conf/nginx.conf test is successful
```

### Step 7: Start Nginx
```cmd
cd C:\nginx
nginx.exe

# Should start without warnings
```

## Alternative: HTTP-Only Configuration (If SSL Still Fails)

If you continue having SSL issues, create this HTTP-only config:

Create `C:\nginx\conf\sites\ehs-http.conf`:

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
        
        # CORS headers
        add_header Access-Control-Allow-Origin "http://192.168.222.216" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        add_header Access-Control-Allow-Credentials true always;
        
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "http://192.168.222.216";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
            add_header Access-Control-Allow-Credentials true;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Then update your `.env` file:
```bash
FRONTEND_URL=http://192.168.222.216
```

And access via: `http://192.168.222.216`

## Verification Commands

```cmd
# Check nginx processes
tasklist | findstr nginx

# Test configuration
cd C:\nginx
nginx.exe -t

# Test access
curl http://192.168.222.216
curl https://192.168.222.216  # if using HTTPS

# Check logs if issues
type C:\nginx\logs\error.log
```

## Quick Fix Summary

1. **Kill nginx**: `taskkill /f /im nginx.exe`
2. **Clean config**: Replace nginx.conf with clean version
3. **Create directories**: `mkdir temp` and subdirectories
4. **Create EHS config**: Single clean configuration file
5. **Test**: `nginx.exe -t`
6. **Start**: `nginx.exe`

This should resolve all the conflicting server names and configuration issues!