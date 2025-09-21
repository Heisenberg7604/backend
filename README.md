# JP App Backend - Deployment Guide

## 🚀 Quick Start

This guide will help you deploy the JP App backend to a cloud platform. The backend handles catalogue downloads, admin notifications, and user authentication.

## 📋 Prerequisites

- [ ] GitHub repository with your code
- [ ] MongoDB Atlas account (free tier available)
- [ ] Email account for notifications (Gmail recommended)
- [ ] Cloud platform account (Sevalla, Railway, or Heroku)

## 🛠️ Backend Setup

### 1. Environment Variables

Create a `.env` file in your `backend` directory:

```bash
# Copy the template
cp env.production.example .env
```

Edit `.env` with your actual values:

```env
# Database - Get from MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jpapp?retryWrites=true&w=majority

# JWT Secret - Generate a strong random key
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Email Configuration (for admin notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Server Configuration
PORT=5001
NODE_ENV=production

# CORS - Will be set automatically by platform
CORS_ORIGIN=*
```

### 2. MongoDB Atlas Setup

1. **Create Account**: Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. **Create Cluster**: Choose free tier (M0)
3. **Create Database User**:
   - Username: `jpapp-user`
   - Password: Generate strong password
4. **Whitelist IP**: Add `0.0.0.0/0` for all IPs (or your platform's IP)
5. **Get Connection String**: 
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your user password

### 3. Gmail App Password Setup

1. **Enable 2FA** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `EMAIL_PASS`

## 🌐 Deployment Options

### Option 1: Sevalla (Recommended)

**Why Sevalla?**
- ✅ Easy deployment
- ✅ Automatic HTTPS
- ✅ Environment variables support
- ✅ Good for Node.js apps

**Steps:**
1. **Sign Up**: Go to [sevalla.com](https://sevalla.com)
2. **Connect GitHub**: Link your repository
3. **Create New App**:
   - Repository: Select your JP App repo
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Root Directory: Leave empty
4. **Set Environment Variables**:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Your JWT secret key
   - `EMAIL_SERVICE` - gmail
   - `EMAIL_USER` - Your Gmail address
   - `EMAIL_PASS` - Your Gmail app password
   - `NODE_ENV` - production
5. **Deploy**: Click "Deploy" button
6. **Get URL**: Note your app URL (e.g., `https://jp-app-backend.sevalla.com`)

### Option 2: Railway

**Why Railway?**
- ✅ Automatic deployment
- ✅ Free tier available
- ✅ Easy GitHub integration

**Steps:**
1. **Sign Up**: Go to [railway.app](https://railway.app)
2. **Connect GitHub**: Link your repository
3. **Deploy**: Railway auto-detects Node.js
4. **Set Environment Variables**: Same as Sevalla
5. **Get URL**: Railway provides HTTPS URL

### Option 3: Heroku

**Why Heroku?**
- ✅ Reliable platform
- ✅ Good documentation
- ✅ Add-ons available

**Steps:**
1. **Install Heroku CLI**: `npm install -g heroku`
2. **Login**: `heroku login`
3. **Create App**: `heroku create jp-app-backend`
4. **Set Environment Variables**:
   ```bash
   heroku config:set MONGODB_URI="your-mongodb-uri"
   heroku config:set JWT_SECRET="your-jwt-secret"
   heroku config:set EMAIL_SERVICE="gmail"
   heroku config:set EMAIL_USER="your-email@gmail.com"
   heroku config:set EMAIL_PASS="your-app-password"
   heroku config:set NODE_ENV="production"
   ```
5. **Deploy**: `git push heroku main`

## 🔧 Backend Configuration

### 1. Update CORS Settings

In `backend/src/server.js`, ensure CORS is configured for production:

```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

### 2. Static File Serving

Ensure catalogue files are served properly:

```javascript
// Serve catalogue files
app.use('/api/catalogues', express.static(path.join(__dirname, 'catalogues')));
```

### 3. Error Handling

Add production error handling:

```javascript
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('public'));
}
```

## 🧪 Testing Your Deployment

### 1. Health Check

Test if your backend is running:

```bash
curl https://your-app-url.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Test API Endpoints

**Test Catalogue Download Tracking:**
```bash
curl -X POST https://your-app-url.com/api/catalogue/download \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "3",
    "productTitle": "Circular Looms",
    "catalogueUrls": ["catalogue1.pdf", "catalogue2.pdf"],
    "downloadedAt": "2024-01-01T00:00:00.000Z"
  }'
```

**Test Admin Login:**
```bash
curl -X POST https://your-app-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@jpgroup.industries",
    "password": "your-admin-password"
  }'
```

### 3. Test File Serving

Test if catalogue files are accessible:

```bash
curl https://your-app-url.com/api/catalogues/sample.pdf
```

## 📱 Frontend Integration

### 1. Update API URL

In your frontend `app/services/DownloadManager.ts`:

```typescript
private API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-app-url.com/api';
```

### 2. Environment Variables

Create `.env` in your project root:

```env
EXPO_PUBLIC_API_URL=https://your-app-url.com/api
```

### 3. Test Frontend

1. **Restart Expo**: `npx expo start --clear`
2. **Test Downloads**: Try downloading catalogues
3. **Check Admin Panel**: Verify notifications work
4. **Test on Real Device**: Use Expo Go app

## 🔍 Troubleshooting

### Common Issues

**1. CORS Errors**
```bash
# Error: Access to fetch at 'https://...' from origin '...' has been blocked by CORS policy
```
**Solution**: Check CORS configuration in server.js

**2. Database Connection Failed**
```bash
# Error: MongooseError: Operation `users.findOne()` buffering timed out
```
**Solution**: 
- Check MongoDB URI
- Verify IP whitelist
- Check database user permissions

**3. Email Not Sending**
```bash
# Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
**Solution**:
- Enable 2FA on Gmail
- Use App Password (not regular password)
- Check EMAIL_USER and EMAIL_PASS

**4. File Not Found**
```bash
# Error: ENOENT: no such file or directory
```
**Solution**:
- Check file paths in catalogue routes
- Ensure files exist in backend/catalogues/
- Verify static file serving

### Debug Commands

**Check Environment Variables:**
```bash
# On your platform, check if env vars are set
echo $MONGODB_URI
echo $JWT_SECRET
```

**Check Logs:**
```bash
# Sevalla: Check deployment logs in dashboard
# Railway: Check logs in dashboard
# Heroku: heroku logs --tail
```

**Test Database Connection:**
```bash
# Test MongoDB connection
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.log('❌ Database error:', err));
"
```

## 📊 Monitoring

### 1. Health Monitoring

Add health check endpoint:

```javascript
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### 2. Error Logging

Add error logging:

```javascript
// Log errors
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
```

### 3. Performance Monitoring

Consider adding:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry, Bugsnag
- **Performance monitoring**: New Relic, DataDog

## 🚀 Production Checklist

- [ ] Backend deployed and accessible
- [ ] MongoDB connected and working
- [ ] Environment variables set correctly
- [ ] CORS configured for production
- [ ] Static files serving properly
- [ ] Admin notifications working
- [ ] API endpoints tested
- [ ] Frontend updated with production URL
- [ ] Health check endpoint working
- [ ] Error handling in place
- [ ] Logs accessible
- [ ] Backup strategy in place

## 📞 Support

If you encounter issues:

1. **Check Logs**: Look at deployment platform logs
2. **Test Endpoints**: Use curl or Postman to test API
3. **Verify Environment**: Ensure all variables are set
4. **Check Database**: Test MongoDB connection
5. **Test Email**: Verify Gmail app password

## 🔄 Updates

To update your backend:

1. **Push Changes**: `git push origin main`
2. **Redeploy**: Platform will auto-deploy
3. **Test**: Verify everything still works
4. **Monitor**: Check logs for errors

---

**🎉 Congratulations!** Your backend is now deployed and ready to serve your JP App!