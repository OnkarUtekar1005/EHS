# Nginx Installation Guide

## Ubuntu/Debian Installation

### Method 1: Using Package Manager (Recommended)

```bash
# Update package index
sudo apt update

# Install nginx
sudo apt install nginx -y

# Check if nginx is running
sudo systemctl status nginx
```

### Method 2: Latest Version from Official Repository

```bash
# Install prerequisites
sudo apt install curl gnupg2 ca-certificates lsb-release -y

# Add nginx signing key
curl -fsSL https://nginx.org/keys/nginx_signing.key | sudo gpg --dearmor -o /usr/share/keyrings/nginx-keyring.gpg

# Add nginx repository
echo "deb [signed-by=/usr/share/keyrings/nginx-keyring.gpg] http://nginx.org/packages/ubuntu $(lsb_release -cs) nginx" | sudo tee /etc/apt/sources.list.d/nginx.list

# Set repository pinning
echo -e "Package: *\nPin: origin nginx.org\nPin: release o=nginx\nPin-Priority: 900\n" | sudo tee /etc/apt/preferences.d/99nginx

# Update and install
sudo apt update
sudo apt install nginx -y
```

## CentOS/RHEL/Rocky Linux Installation

### Using YUM/DNF

```bash
# For CentOS/RHEL 7
sudo yum install epel-release -y
sudo yum install nginx -y

# For CentOS/RHEL 8+ or Rocky Linux
sudo dnf install nginx -y

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Windows Installation

### Using Chocolatey
```powershell
# Install Chocolatey first (if not installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install nginx
choco install nginx -y
```

### Manual Installation
1. Download nginx from: https://nginx.org/en/download.html
2. Extract to `C:\nginx`
3. Run `nginx.exe` from command prompt

## macOS Installation

### Using Homebrew
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install nginx
brew install nginx

# Start nginx
brew services start nginx
```

## Post-Installation Setup

### 1. Start and Enable Nginx (Linux)
```bash
# Start nginx service
sudo systemctl start nginx

# Enable nginx to start on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### 2. Basic Configuration Test
```bash
# Test configuration syntax
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx
```

### 3. Firewall Configuration (Linux)

#### Ubuntu/Debian (UFW)
```bash
# Allow nginx through firewall
sudo ufw allow 'Nginx Full'

# Or allow specific ports
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000  # For our EHS application
```

#### CentOS/RHEL (firewalld)
```bash
# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### 4. Directory Structure (Linux)

```bash
# Main directories
/etc/nginx/                 # Configuration files
/etc/nginx/nginx.conf       # Main configuration
/etc/nginx/sites-available/ # Available site configurations
/etc/nginx/sites-enabled/   # Enabled site configurations
/var/log/nginx/             # Log files
/var/www/html/              # Default web root
```

### 5. Basic Commands

```bash
# Start nginx
sudo systemctl start nginx

# Stop nginx
sudo systemctl stop nginx

# Restart nginx
sudo systemctl restart nginx

# Reload configuration (no downtime)
sudo systemctl reload nginx

# Test configuration
sudo nginx -t

# Check nginx version
nginx -v

# Check status
sudo systemctl status nginx
```

## Verification

### 1. Check if Nginx is Running
```bash
# Check process
ps aux | grep nginx

# Check listening ports
sudo netstat -tlnp | grep nginx
# or
sudo ss -tlnp | grep nginx
```

### 2. Test Default Page
- Open browser and go to: `http://localhost`
- You should see the "Welcome to nginx!" page

### 3. Check Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

## Common Issues and Solutions

### Issue 1: Port 80 Already in Use
```bash
# Check what's using port 80
sudo netstat -tlnp | grep :80

# Stop conflicting service (e.g., Apache)
sudo systemctl stop apache2

# Start nginx
sudo systemctl start nginx
```

### Issue 2: Permission Denied
```bash
# Check nginx user permissions
sudo chown -R www-data:www-data /var/www/html/

# Check SELinux (CentOS/RHEL)
sudo setsebool -P httpd_can_network_connect 1
```

### Issue 3: Configuration Errors
```bash
# Always test configuration before reloading
sudo nginx -t

# Check syntax and fix errors in configuration files
```

## Configuration for EHS Application

After installation, refer to the DEPLOYMENT_GUIDE.md for specific nginx configuration for the EHS E-Learning Platform.

### Quick EHS Config Template
```nginx
# /etc/nginx/sites-available/ehs-frontend
server {
    listen 3000;
    server_name localhost;
    
    root /path/to/deployment/frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---
**Note**: After installing nginx, proceed with the main deployment guide to configure it for the EHS application.

**Created**: 2025-06-12  
**Version**: 1.0