# Network Troubleshooting Guide

## "Failed to fetch" Error Solutions

If you're experiencing "Failed to fetch" errors during login, follow these steps:

### 1. Quick Diagnostics

Visit `/test-connection` in your browser to run comprehensive connectivity tests:
- Browser online status
- Internet connectivity
- Supabase server accessibility
- Network performance metrics

### 2. Common Causes & Solutions

#### A. Network Connectivity Issues
**Symptoms:** Red "Offline" indicator on login page
**Solutions:**
- Check your internet connection
- Try switching between WiFi and mobile data
- Restart your router/modem
- Disable VPN temporarily

#### B. Firewall/Proxy Blocking
**Symptoms:** Can browse other sites but Supabase fails
**Solutions:**
- Temporarily disable firewall
- Check corporate proxy settings
- Whitelist Supabase domains:
  - `*.supabase.co`
  - `*.supabase.com`

#### C. DNS Resolution Issues
**Symptoms:** Intermittent connection failures
**Solutions:**
- Flush DNS cache:
  - Windows: `ipconfig /flushdns`
  - Mac: `sudo dscacheutil -flushcache`
- Try different DNS servers (8.8.8.8, 1.1.1.1)

#### D. Browser Issues
**Symptoms:** Works in one browser but not another
**Solutions:**
- Clear browser cache and cookies
- Disable browser extensions
- Try incognito/private mode
- Update your browser

#### E. Supabase Configuration
**Symptoms:** Environment variable errors in test page
**Solutions:**
- Verify `.env.local` file exists
- Check environment variables:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  ```
- Restart development server after changes

### 3. Advanced Troubleshooting

#### Check Network Performance
- Visit `/test-connection` to see:
  - Connection type (4g, wifi, etc.)
  - Download speed
  - Latency (ping time)

#### Browser Developer Tools
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try logging in
4. Look for failed requests to Supabase
5. Check error details

#### Test Different Networks
- Try mobile hotspot
- Use different WiFi network
- Test from different location

### 4. Error-Specific Solutions

#### "AuthRetryableFetchError: Failed to fetch"
- Usually a temporary network issue
- The app will automatically retry 3 times
- Wait for retry attempts to complete

#### "Network error after 3 attempts"
- Persistent connectivity issue
- Check internet connection
- Try refreshing the page
- Wait a few minutes and try again

#### "Cannot reach authentication servers"
- Supabase servers may be temporarily unavailable
- Check Supabase status page
- Try again in a few minutes

### 5. Prevention Tips

- Keep browser updated
- Use stable internet connection
- Avoid using VPN during authentication
- Clear browser cache regularly
- Check for system updates

### 6. Getting Help

If none of these solutions work:

1. Visit `/test-connection` and screenshot the results
2. Note your:
   - Browser type and version
   - Operating system
   - Network type (WiFi, mobile, etc.)
   - Any error messages
3. Check browser console for additional errors
4. Try the same steps on a different device/network

### 7. Emergency Access

If you cannot resolve the issue:
- Try accessing from a different device
- Use mobile data instead of WiFi
- Contact system administrator if on corporate network
- Clear all browser data and try again

---

**Note:** The login page now includes:
- Real-time network status indicator
- Automatic retry logic for network failures
- Enhanced error messages with troubleshooting tips
- Connectivity checks before attempting login