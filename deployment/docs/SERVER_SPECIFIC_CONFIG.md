# Server-Specific Configuration for IP: 192.168.222.216

## SSL Certificate Generation for Your Server

### Step 1: Generate SSL Certificate with Correct IP

```cmd
# Navigate to OpenSSL directory
cd "C:\Program Files\OpenSSL-Win64\bin"

# Create SSL directory
mkdir C:\nginx\ssl

# Generate private key
openssl genrsa -out C:\nginx\ssl\nginx.key 2048

# Create certificate request with IP SAN
openssl req -new -key C:\nginx\ssl\nginx.key -out C:\nginx\ssl\nginx.csr -config C:\nginx\ssl\server.conf
```

### Step 2: Create OpenSSL Configuration File

Create file: `C:\nginx\ssl\server.conf`

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
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = ehs-learning.local
IP.1 = 192.168.222.216
IP.2 = 127.0.0.1
```

### Step 3: Generate Certificate with IP SAN

```cmd
# Generate self-signed certificate with IP SAN
openssl x509 -req -days 365 -in C:\nginx\ssl\nginx.csr -signkey C:\nginx\ssl\nginx.key -out C:\nginx\ssl\nginx.crt -extensions v3_req -extfile C:\nginx\ssl\server.conf
```

## Nginx Configuration for Your Server

### Create: `C:\nginx\conf\sites\ehs-production.conf`

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name 192.168.222.216 localhost;
    return 301 https://$server_name$request_uri;
}

# HTTPS server for EHS frontend
server {
    listen 443 ssl http2;
    server_name 192.168.222.216 localhost;
    
    # SSL Configuration
    ssl_certificate C:/nginx/ssl/nginx.crt;
    ssl_certificate_key C:/nginx/ssl/nginx.key;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Document root - UPDATE THIS PATH
    root C:/deployment/frontend;
    index index.html;
    
    # Increase client max body size for file uploads
    client_max_body_size 200M;
    
    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;
        
        # Add headers for SPA
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
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
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Static file handling with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
    }
    
    # Special handling for service worker
    location /service-worker.js {
        add_header Cache-Control "no-cache";
        expires off;
    }
    
    # Security - deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

## Windows Firewall Configuration

```cmd
# Run as Administrator

# Allow HTTP traffic
netsh advfirewall firewall add rule name="EHS-HTTP" dir=in action=allow protocol=TCP localport=80

# Allow HTTPS traffic
netsh advfirewall firewall add rule name="EHS-HTTPS" dir=in action=allow protocol=TCP localport=443

# Allow backend traffic (optional - only if direct access needed)
netsh advfirewall firewall add rule name="EHS-Backend" dir=in action=allow protocol=TCP localport=8080

# Check current rules
netsh advfirewall firewall show rule name="EHS-HTTP"
netsh advfirewall firewall show rule name="EHS-HTTPS"
```

## Updated .env File

Your `.env` file has been updated with:

```bash
# Frontend URL
FRONTEND_URL=https://192.168.222.216
```

## CORS Configuration Update

Since you're using HTTPS and a specific IP, you may need to update your Spring Boot CORS configuration.

### Update application.properties

Add these properties:

```properties
# CORS configuration for specific IP
spring.mvc.cors.allowed-origins=https://192.168.222.216,http://192.168.222.216
spring.mvc.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.mvc.cors.allowed-headers=*
spring.mvc.cors.allow-credentials=true
spring.mvc.cors.exposed-headers=Content-Security-Policy
```

## Testing Your Configuration

### 1. Generate Certificate
```cmd
# Run the SSL certificate generation commands above
```

### 2. Test Nginx Configuration
```cmd
# Test configuration
C:\nginx\nginx.exe -t

# Start/reload nginx
C:\nginx\nginx.exe -s reload
```

### 3. Test Access

From any device on your network:

```bash
# Test HTTP redirect
curl -I http://192.168.222.216

# Test HTTPS access (ignore SSL warnings for self-signed)
curl -k https://192.168.222.216

# Test from browser
# Navigate to: https://192.168.222.216
```

### 4. Backend Test
```bash
# Test backend directly
curl http://192.168.222.216:8080/actuator/health

# Test through nginx proxy
curl -k https://192.168.222.216/api/health
```

## Access URLs

After deployment, access your application at:

- **Frontend**: `https://192.168.222.216`
- **Backend API**: `https://192.168.222.216/api/`
- **Direct Backend**: `http://192.168.222.216:8080` (if enabled)

## Client Browser Setup

For self-signed certificates, users will need to:

1. Navigate to `https://192.168.222.216`
2. Click "Advanced" when seeing security warning
3. Click "Proceed to 192.168.222.216 (unsafe)"

For production, consider using a domain name and Let's Encrypt certificate.

## Deployment Checklist for Your Server

- [ ] Generate SSL certificate with IP SAN
- [ ] Update nginx configuration with your paths
- [ ] Configure Windows firewall
- [ ] Update .env file (already done)
- [ ] Test certificate generation
- [ ] Test nginx configuration
- [ ] Deploy frontend files to correct path
- [ ] Start backend JAR file
- [ ] Test access from another device

---
**Server IP**: 192.168.222.216  
**Created**: 2025-06-12  
**Version**: 1.0