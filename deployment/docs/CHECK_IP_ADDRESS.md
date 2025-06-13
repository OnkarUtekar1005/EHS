# How to Check Deployment Machine IP Address

## Windows

### Method 1: Command Prompt
```cmd
# Open Command Prompt (cmd) and run:

# Show all network interfaces
ipconfig

# Show detailed information
ipconfig /all

# Show only IPv4 addresses
ipconfig | findstr IPv4
```

### Method 2: PowerShell
```powershell
# Open PowerShell and run:

# Get all IP addresses
Get-NetIPAddress -AddressFamily IPv4

# Get only active network interfaces
Get-NetIPConfiguration | Where-Object {$_.NetAdapter.Status -eq "Up"}

# Simple IP display
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*"}).IPAddress
```

### Method 3: GUI Method
1. Press `Win + R`
2. Type `ncpa.cpl` and press Enter
3. Right-click your active network connection
4. Select "Status" → "Details"
5. Look for "IPv4 Address"

### Method 4: Settings App
1. Press `Win + I`
2. Go to "Network & Internet"
3. Click on your connection type (Wi-Fi/Ethernet)
4. Click on your network name
5. Scroll down to see IP address

## Linux

### Method 1: ip command (Modern)
```bash
# Show all interfaces
ip addr show

# Show only IPv4
ip -4 addr show

# Show specific interface (e.g., eth0)
ip addr show eth0

# Show only IP addresses
ip route get 1.1.1.1 | grep -oP 'src \K\S+'
```

### Method 2: ifconfig (Traditional)
```bash
# Install if not available (Ubuntu/Debian)
sudo apt install net-tools

# Show all interfaces
ifconfig

# Show specific interface
ifconfig eth0

# Show only IP addresses
ifconfig | grep -oP 'inet \K\d+\.\d+\.\d+\.\d+'
```

### Method 3: hostname command
```bash
# Show local IP
hostname -I

# Show all IP addresses
hostname --all-ip-addresses
```

### Method 4: Using nmcli (NetworkManager)
```bash
# Show connection details
nmcli device show

# Show only IP
nmcli -t -f IP4.ADDRESS dev show | grep IP4.ADDRESS | cut -d: -f2
```

## macOS

### Method 1: Terminal
```bash
# Show all interfaces
ifconfig

# Show only active interfaces with IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Using system_profiler
system_profiler SPNetworkDataType | grep "IPv4 Addresses"

# Quick IP lookup
ipconfig getifaddr en0  # For Wi-Fi
ipconfig getifaddr en1  # For Ethernet
```

### Method 2: System Preferences
1. Click Apple menu → "System Preferences"
2. Click "Network"
3. Select your active connection (Wi-Fi/Ethernet)
4. IP address shown on the right

### Method 3: Network Utility
1. Open "Network Utility" (search in Spotlight)
2. Go to "Info" tab
3. Select your network interface
4. IP address displayed

## Understanding IP Types

### Private IP Addresses (Internal Network)
- **192.168.x.x** - Most common home/office networks
- **10.x.x.x** - Corporate networks
- **172.16.x.x - 172.31.x.x** - Medium networks

### Example Results:
```
Ethernet adapter:
   IPv4 Address: 192.168.1.100    ← This is your LOCAL IP
   
Wi-Fi adapter:
   IPv4 Address: 192.168.1.105    ← This is your WIRELESS IP
```

### Loopback (Localhost)
- **127.0.0.1** - Always points to the same machine

## Find Public IP Address

If you need external access:

### Command Line
```bash
# Windows/Linux/macOS
curl ifconfig.me
curl ipinfo.io/ip
curl checkip.amazonaws.com

# Windows only
nslookup myip.opendns.com resolver1.opendns.com
```

### Browser
Visit any of these websites:
- https://whatismyipaddress.com/
- https://ipinfo.io/
- https://checkip.amazonaws.com/

## For EHS Deployment

### 1. Find Your Deployment Machine IP
Use the methods above to find the IP address of the machine where you'll deploy EHS.

**Example Result:**
```
IPv4 Address: 192.168.1.100
```

### 2. Update .env File
Edit your `.env` file in the deployment folder:

```bash
# Before (localhost)
FRONTEND_URL=http://localhost:3000

# After (actual IP)
FRONTEND_URL=http://192.168.1.100:3000
```

### 3. Test Connectivity
From another machine on the same network:
```bash
# Test if deployment machine is reachable
ping 192.168.1.100

# Test if ports are open (after deployment)
telnet 192.168.1.100 3000  # Frontend
telnet 192.168.1.100 8080  # Backend
```

## Network Configuration Notes

### For Home Networks:
- Most home routers use `192.168.1.x` or `192.168.0.x`
- Your deployment machine will get an IP in this range
- Other devices on the same network can access using this IP

### For Office Networks:
- May use `10.x.x.x` or `172.16.x.x` ranges
- Check with IT department for proper IP assignment
- May need firewall rules for port access

### Static vs Dynamic IP:
- **Dynamic (DHCP)**: IP may change after restart
- **Static**: IP stays the same (recommended for servers)

### Setting Static IP (Windows):
1. Go to Network adapter settings
2. Right-click → Properties
3. Select "Internet Protocol Version 4 (TCP/IPv4)"
4. Click Properties
5. Select "Use the following IP address"
6. Enter IP, subnet mask, and gateway

### Setting Static IP (Linux):
```bash
# Ubuntu/Debian - edit netplan
sudo nano /etc/netplan/01-netcfg.yaml

# Example configuration:
network:
  version: 2
  ethernets:
    eth0:
      addresses: [192.168.1.100/24]
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]

# Apply changes
sudo netplan apply
```

## Quick Reference Card

| OS | Quick Command | Example Output |
|---|---|---|
| Windows | `ipconfig` | IPv4 Address: 192.168.1.100 |
| Linux | `hostname -I` | 192.168.1.100 |
| macOS | `ifconfig \| grep "inet "` | inet 192.168.1.100 |

**Remember**: Use the IP address you find in your `.env` configuration for the EHS deployment!

---
**Created**: 2025-06-12  
**Version**: 1.0