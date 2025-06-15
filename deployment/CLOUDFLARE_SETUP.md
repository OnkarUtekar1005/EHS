# CloudFlare Tunnel Setup for protecther.site

Complete guide to deploy protecther.site using CloudFlare Tunnel (no port forwarding needed).

## Prerequisites

- Domain: protecther.site (registered)
- Local server running on: https://localhost:443
- CloudFlare account (free)

## Step 1: Create CloudFlare Account

1. Go to **https://cloudflare.com/**
2. Click **"Sign Up"**
3. Enter email and password
4. Verify email address

## Step 2: Add Domain to CloudFlare

1. Login to CloudFlare Dashboard
2. Click **"Add a Site"**
3. Enter: **protecther.site**
4. Click **"Add Site"**
5. Select **"Free Plan"**
6. Click **"Continue"**

CloudFlare will scan your existing DNS records.

## Step 3: Update Nameservers

CloudFlare will provide 2 nameservers like:
```
lucas.ns.cloudflare.com
raina.ns.cloudflare.com
```

**Update at Hostinger:**
1. Login to **Hostinger**
2. Go to **Domains** → **Manage**
3. Find **protecther.site**
4. Click **"Manage"**
5. Go to **"DNS/Nameservers"**
6. Change to **"Custom Nameservers"**
7. Enter CloudFlare nameservers:
   - Nameserver 1: `lucas.ns.cloudflare.com`
   - Nameserver 2: `raina.ns.cloudflare.com`
8. Click **"Save"**

**Wait 5-24 hours for nameserver propagation.**

## Step 4: Install CloudFlare Tunnel

### Download cloudflared
1. Go to: **https://github.com/cloudflare/cloudflared/releases**
2. Download **cloudflared-windows-amd64.exe**
3. Rename to **cloudflared.exe**
4. Create folder: **C:\cloudflared**
5. Place **cloudflared.exe** in **C:\cloudflared**

### Authenticate CloudFlare
```cmd
cd C:\cloudflared
cloudflared.exe tunnel login
```

- Opens browser automatically
- Login with your CloudFlare account
- Authorize cloudflared
- Close browser when done

## Step 5: Create Tunnel

```cmd
cd C:\cloudflared
cloudflared.exe tunnel create protecther-tunnel
```

**Save the Tunnel ID!** It looks like:
```
Created tunnel protecther-tunnel with id 12345678-1234-1234-1234-123456789abc
```

## Step 6: Create Tunnel Configuration

**Create file: `C:\cloudflared\config.yml`**

```yaml
tunnel: 12345678-1234-1234-1234-123456789abc
credentials-file: C:\Users\%USERNAME%\.cloudflared\12345678-1234-1234-1234-123456789abc.json

ingress:
  - hostname: protecther.site
    service: https://localhost:443
  - hostname: www.protecther.site
    service: https://localhost:443
  - service: http_status:404
```

**Replace `12345678-1234-1234-1234-123456789abc` with your actual Tunnel ID!**

## Step 7: Create DNS Records

```cmd
cd C:\cloudflared
cloudflared.exe tunnel route dns 12345678-1234-1234-1234-123456789abc protecther.site
cloudflared.exe tunnel route dns 12345678-1234-1234-1234-123456789abc www.protecther.site
```

**Replace Tunnel ID with yours!**

## Step 8: Start Tunnel

```cmd
cd C:\cloudflared
cloudflared.exe tunnel run 12345678-1234-1234-1234-123456789abc
```

**Keep this command prompt open!**

## Step 9: Test Access

1. Open browser
2. Go to: **https://protecther.site**
3. Should show your application with trusted SSL

## Step 10: Set Up as Windows Service (Optional)

### Install NSSM
1. Download from: **https://nssm.cc/download**
2. Extract to: **C:\nssm**

### Create Service
```cmd
# Run as Administrator
C:\nssm\nssm.exe install CloudFlare-Tunnel C:\cloudflared\cloudflared.exe
C:\nssm\nssm.exe set CloudFlare-Tunnel Arguments "tunnel run 12345678-1234-1234-1234-123456789abc"
C:\nssm\nssm.exe set CloudFlare-Tunnel AppDirectory C:\cloudflared
C:\nssm\nssm.exe set CloudFlare-Tunnel DisplayName "CloudFlare Tunnel - Protecther"
C:\nssm\nssm.exe set CloudFlare-Tunnel Description "CloudFlare Tunnel for protecther.site"

# Start service
net start CloudFlare-Tunnel
```

## Alternative: Quick Setup Method

**For immediate testing:**
```cmd
cd C:\cloudflared
cloudflared.exe tunnel --url https://localhost:443
```

This gives you a temporary URL like: `https://random-name.trycloudflare.com`

## CloudFlare Dashboard Configuration

### SSL/TLS Settings
1. Go to **SSL/TLS** → **Overview**
2. Set to **"Full (strict)"** or **"Full"**

### Security Settings
1. Go to **Security** → **Settings**
2. Set **Security Level** to **"Medium"**

### Speed Settings
1. Go to **Speed** → **Optimization**
2. Enable **"Auto Minify"** for CSS, HTML, JS
3. Enable **"Brotli"** compression

## Troubleshooting

### Issue: "tunnel credentials file not found"
**Solution:**
```cmd
cloudflared.exe tunnel login
```

### Issue: "failed to serve tunnel"
**Solution:**
1. Check if nginx is running on localhost:443
2. Verify config.yml file exists
3. Check Tunnel ID is correct

### Issue: "DNS not propagating"
**Solution:**
```cmd
# Check DNS
nslookup protecther.site 1.1.1.1

# Force DNS
cloudflared.exe tunnel route dns TUNNEL_ID protecther.site
```

### Issue: "502 Bad Gateway"
**Solution:**
1. Check local server is running: `curl https://localhost:443`
2. Verify nginx configuration
3. Check backend is running on port 8080

## Verification Commands

```cmd
# Check tunnel status
cloudflared.exe tunnel info 12345678-1234-1234-1234-123456789abc

# List all tunnels
cloudflared.exe tunnel list

# Test local server
curl https://localhost:443/health

# Check DNS
nslookup protecther.site 1.1.1.1
```

## Benefits of CloudFlare Tunnel

✅ **No port forwarding required**
✅ **No router configuration needed**
✅ **Works behind any firewall/NAT**
✅ **Trusted SSL certificate (no warnings)**
✅ **Global CDN for faster access**
✅ **DDoS protection**
✅ **Free plan available**
✅ **Professional setup**

## Important Notes

1. **Keep tunnel running** - If tunnel stops, site becomes inaccessible
2. **Use Windows Service** for production (auto-restart)
3. **Nameserver change** can take up to 24 hours
4. **CloudFlare provides SSL** - no need for Let's Encrypt
5. **Local SSL still needed** for tunnel connection

## Success Checklist

- [ ] CloudFlare account created
- [ ] Domain added to CloudFlare
- [ ] Nameservers updated at Hostinger
- [ ] cloudflared.exe downloaded
- [ ] Tunnel authenticated
- [ ] Tunnel created and ID saved
- [ ] config.yml file created
- [ ] DNS records created
- [ ] Tunnel running
- [ ] Website accessible at https://protecther.site
- [ ] SSL shows as trusted (green lock)
- [ ] Optional: Windows service configured

---

**Result: Your protecther.site will be accessible worldwide with trusted SSL, bypassing all router/firewall issues!**