# Hostinger Deployment Guide for JP App Backend

## 🚀 Quick Hostinger Deployment Steps

### 1. Prerequisites
- [ ] Hostinger VPS or Cloud Hosting account
- [ ] MongoDB Atlas cluster set up
- [ ] Gmail app password configured
- [ ] Domain name pointing to Hostinger

### 2. Environment Setup
```bash
# Copy the environment template
cp env.production.example .env

# Edit .env with your actual values
nano .env
```

### 3. Required Environment Variables
```env
# Database - Get from MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jpapp?retryWrites=true&w=majority

# JWT Secret - Generate a strong random key
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# SMTP Configuration (Primary - for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=media.jpel@gmail.com

# Gmail Fallback (Secondary - for development)
GMAIL_APP_PASSWORD=your-gmail-app-password

# Server Configuration
PORT=5001
NODE_ENV=production

# CORS - Update with your Hostinger domain
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com
FRONTEND_URL=https://your-domain.com
```

### 4. Hostinger Deployment Methods

#### Option A: Git Integration (Recommended)
1. **Upload to GitHub**: Push your code to GitHub
2. **Hostinger Git**: Go to Hostinger control panel → Git Integration
3. **Connect Repository**: Link your GitHub repo
4. **Set Build Commands**:
   - Build Command: `npm install && npm run build:frontend`
   - Start Command: `npm start`
5. **Set Environment Variables**: Add all variables from .env
6. **Deploy**: Click deploy button

#### Option B: File Manager Upload
1. **Build Locally**: Run `npm run build:frontend`
2. **Upload Files**: Upload entire project via File Manager
3. **Set Permissions**: Ensure proper file permissions
4. **Configure Environment**: Set variables in Hostinger panel

### 5. Hostinger-Specific Configuration

#### Node.js Version
- Ensure Hostinger supports Node.js 16+ (check in control panel)
- Update engines in package.json if needed

#### Port Configuration
- Hostinger may assign a specific port
- Update PORT in environment variables
- Check Hostinger documentation for port requirements

#### SSL/HTTPS
- Enable SSL certificate in Hostinger panel
- Update CORS_ORIGIN to use HTTPS
- Update frontend API URLs to HTTPS

### 6. Testing Your Deployment

#### Health Check
```bash
curl https://your-domain.com/api/health
```

#### Test API Endpoints
```bash
# Test catalogue download tracking
curl -X POST https://your-domain.com/api/catalogue/download \
  -H "Content-Type: application/json" \
  -d '{"productId": "test", "productTitle": "Test Product"}'

# Test admin login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@jpgroup.industries", "password": "your-password"}'
```

### 7. Frontend Integration
Update your JP App frontend to use the Hostinger backend:

```javascript
// In your JP App project
const API_BASE_URL = 'https://your-domain.com/api';
```

### 8. Troubleshooting

#### Common Issues
- **Port Issues**: Check Hostinger assigned port
- **CORS Errors**: Verify CORS_ORIGIN includes your domain
- **Database Connection**: Check MongoDB Atlas IP whitelist
- **Email Issues**: Verify Gmail app password

#### Debug Commands
```bash
# Check if server is running
ps aux | grep node

# Check logs
tail -f /path/to/your/app/logs

# Test database connection
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('DB OK')).catch(err => console.log('DB Error:', err))"
```

### 9. Production Checklist
- [ ] Environment variables set correctly
- [ ] MongoDB Atlas connected
- [ ] Gmail app password working
- [ ] SSL certificate enabled
- [ ] CORS configured for production domain
- [ ] Frontend built and served correctly
- [ ] API endpoints tested
- [ ] Admin panel accessible
- [ ] File uploads working
- [ ] Email notifications working

### 10. Monitoring
- Set up uptime monitoring
- Monitor error logs
- Track API performance
- Monitor database connections

## 🎯 Next Steps
1. Set up your .env file
2. Deploy to Hostinger
3. Test all functionality
4. Update your JP App frontend
5. Monitor and maintain

---

**Need Help?** Check Hostinger documentation or contact their support team.
