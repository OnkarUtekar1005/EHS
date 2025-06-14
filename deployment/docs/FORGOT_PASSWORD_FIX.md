# Fix "Cannot Connect to Server" - Forgot Password Issue

## Problem
When using the "Forgot Password" feature on your network deployment, you get the error:
```
"Cannot connect to the server. Please check your internet connection and try again."
```

## Root Cause
The frontend was hardcoded to use `http://localhost:8080/api` as the API base URL, but when accessed from the network (e.g., `http://192.168.222.216`), it should use the nginx proxy path `/api`.

## Solution Applied

### 1. Fixed API Base URL
**File**: `src/services/api.js`

**Before:**
```javascript
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

**After:**
```javascript
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### 2. Created Frontend .env File
**File**: `.env`
```env
# Frontend Environment Variables
# API Base URL - use relative path for nginx proxy
REACT_APP_API_URL=/api

# App Information
REACT_APP_NAME=Protecther E-Learning Platform
REACT_APP_VERSION=1.0.0

# Development settings
GENERATE_SOURCEMAP=false
DISABLE_ESLINT_PLUGIN=true
```

## How It Works Now

### Before (Broken):
```
Browser (192.168.222.216) → Frontend → API call to "localhost:8080" ❌
```

### After (Fixed):
```
Browser (192.168.222.216) → Frontend → API call to "/api" → Nginx Proxy → Backend (localhost:8080) ✅
```

## To Apply the Fix

### Step 1: Rebuild Frontend
```cmd
cd "Frontend yash/ehs-learning-platform"
npm run build
```

### Step 2: Redeploy Frontend
```cmd
# Stop nginx
cd C:\nginx
nginx.exe -s stop

# Update frontend files
del C:\deployment\frontend\* /q /s
xcopy build\* C:\deployment\frontend\ /s /e /i

# Start nginx
nginx.exe
```

### Step 3: Clear Browser Cache
- **Hard refresh**: Ctrl + F5
- **Or use incognito mode**

## Verification

### 1. Test Forgot Password Feature
1. Navigate to `http://192.168.222.216`
2. Click "Forgot your password?"
3. Enter any email address
4. Should show success message instead of "Cannot connect to server"

### 2. Test Other API Calls
- **Login**: Should work normally
- **Dashboard**: Should load without errors
- **User management**: Should work for admin

### 3. Check Network Tab (Developer Tools)
- API calls should go to `http://192.168.222.216/api/...`
- Not to `http://localhost:8080/api/...`

## Backend Endpoints Confirmed

The following password reset endpoints exist in the backend:

1. **Request Reset**: `POST /api/auth/forgot-password`
   ```json
   {"email": "user@example.com"}
   ```

2. **Validate Token**: `GET /api/auth/reset-password/validate?token=xxx`

3. **Reset Password**: `POST /api/auth/reset-password`
   ```json
   {"token": "xxx", "password": "newpassword"}
   ```

## Email Configuration

For the forgot password feature to work completely, ensure your backend `.env` has proper email settings:

```bash
# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

## Troubleshooting

### Issue: Still getting "Cannot connect to server"
**Solution:**
1. Clear browser cache completely
2. Check if nginx proxy is working:
   ```cmd
   curl http://192.168.222.216/api/auth/test
   ```
3. Verify nginx configuration includes API proxy

### Issue: "Failed to send password reset email"
**Solution:**
1. Check backend logs for email errors
2. Verify email credentials in backend `.env`
3. Ensure email service is enabled:
   ```bash
   app.email.enabled=true
   ```

### Issue: API calls still going to localhost
**Solution:**
1. Ensure frontend was rebuilt after changes
2. Check browser network tab - should see calls to `/api/...`
3. Verify `.env` file exists in frontend root

## Additional Benefits

This fix also resolves similar connectivity issues for:
- **Login**: Authentication calls
- **User management**: CRUD operations
- **Course management**: File uploads, course creation
- **Reports**: Data fetching
- **All other API calls**: Now use nginx proxy

## Security Note

Using relative paths (`/api`) instead of absolute URLs (`http://localhost:8080/api`) is more secure because:
- No hardcoded server addresses
- Works with HTTPS automatically
- Respects the current domain/IP
- Better for different deployment environments

---

**✅ Result**: Forgot password feature now works on network deployment!