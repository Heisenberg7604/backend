# JP App Backend - Hostinger KVM 1 Deployment Guide

## 🚀 Complete Deployment Guide for Hostinger KVM 1 VPS

This guide will walk you through deploying your JP App backend on Hostinger's KVM 1 VPS hosting.

---

## 📋 Prerequisites

### **Required Accounts & Services:**
- [ ] Hostinger KVM 1 VPS account
- [ ] MongoDB Atlas account (free tier available)
- [ ] Gmail account with App Password
- [ ] Domain name (optional, can use IP)
- [ ] SSH access to your VPS

### **VPS Specifications (KVM 1):**
- **RAM:** 1GB
- **Storage:** 20GB SSD
- **CPU:** 1 vCPU
- **Bandwidth:** 1TB
- **OS:** Ubuntu 20.04/22.04 LTS

---

## 🛠️ Step 1: VPS Setup & Access

### **1.1 Access Your VPS**
```bash
# Connect to your VPS via SSH
ssh root@your-vps-ip-address

# Or if you have a username
ssh username@your-vps-ip-address
```

### **1.2 Update System**
```bash
# Update package lists
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git vim nano htop
```

### **1.3 Create Non-Root User (Security Best Practice)**
```bash
# Create a new user
adduser jpapp

# Add user to sudo group
usermod -aG sudo jpapp

# Switch to new user
su - jpapp
```

---

## 🐍 Step 2: Install Node.js

### **2.1 Install Node.js 18.x (Recommended)**
```bash
# Download and install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### **2.2 Install PM2 (Process Manager)**
```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify PM2 installation
pm2 --version
```

---

## 🗄️ Step 3: Database Setup (MongoDB Atlas)

### **3.1 Create MongoDB Atlas Cluster**
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Sign up for free account
3. Create new cluster (choose free M0 tier)
4. Choose region closest to your VPS

### **3.2 Configure Database Access**
```bash
# In MongoDB Atlas dashboard:
# 1. Go to "Database Access"
# 2. Click "Add New Database User"
# 3. Username: jpapp-user
# 4. Password: Generate strong password
# 5. Database User Privileges: "Read and write to any database"
```

### **3.3 Configure Network Access**
```bash
# In MongoDB Atlas dashboard:
# 1. Go to "Network Access"
# 2. Click "Add IP Address"
# 3. Add your VPS IP address
# 4. Or add 0.0.0.0/0 for all IPs (less secure)
```

### **3.4 Get Connection String**
```bash
# In MongoDB Atlas dashboard:
# 1. Go to "Clusters"
# 2. Click "Connect"
# 3. Choose "Connect your application"
# 4. Copy connection string
# 5. Replace <password> with your user password
```

---

## 📧 Step 4: Email Configuration (Gmail)

### **4.1 Enable 2FA on Gmail**
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification
3. Enable 2FA if not already enabled

### **4.2 Generate App Password**
1. Go to Google Account settings
2. Security → 2-Step Verification → App passwords
3. Select "Mail" as app
4. Generate password (save this password)

---

## 📁 Step 5: Deploy Your Application

### **5.1 Clone Your Repository**
```bash
# Navigate to home directory
cd /home/jpapp

# Clone your repository
git clone https://github.com/your-username/jp-app-backend.git

# Navigate to project directory
cd jp-app-backend
```

### **5.2 Install Dependencies**
```bash
# Install backend dependencies
npm install

# Install frontend dependencies and build
cd frontend
npm install
npm run build
cd ..
```

### **5.3 Create Environment File**
```bash
# Create .env file
nano .env
```

### **5.4 Configure Environment Variables**
```env
# Database Configuration
MONGODB_URI="mongodb+srv://jpapp-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/jpapp?retryWrites=true&w=majority"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"
JWT_EXPIRE="7d"

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=media@jpel.in
SMTP_PASS=YOUR_GMAIL_APP_PASSWORD
SMTP_FROM=media@jpel.in

# Gmail Fallback
GMAIL_APP_PASSWORD="YOUR_GMAIL_APP_PASSWORD"

# Server Configuration
PORT=5001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN="https://your-domain.com,https://www.your-domain.com"
FRONTEND_URL="https://your-domain.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"

# OTP Configuration
OTP_SECRET="your-otp-secret-key-for-two-factor-authentication"

# File Upload Configuration
MAX_FILE_SIZE=52428800
UPLOAD_PATH="./uploads"
```

### **5.5 Create Admin User**
```bash
# Create admin user in database
node create-admin.js
```

---

## 🔧 Step 6: Configure PM2

### **6.1 Create PM2 Ecosystem File**
```bash
# Create PM2 configuration
nano ecosystem.config.js
```

### **6.2 PM2 Configuration**
```javascript
module.exports = {
  apps: [{
    name: 'jp-app-backend',
    script: 'src/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '500M',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### **6.3 Create Logs Directory**
```bash
# Create logs directory
mkdir logs
```

---

## 🌐 Step 7: Configure Nginx (Reverse Proxy)

### **7.1 Install Nginx**
```bash
# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### **7.2 Configure Nginx**
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/jp-app
```

### **7.3 Nginx Configuration**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Main application
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Login rate limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File upload size limit
    client_max_body_size 50M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
```

### **7.4 Enable Site**
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/jp-app /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔒 Step 8: SSL Certificate (Let's Encrypt)

### **8.1 Install Certbot**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y
```

### **8.2 Obtain SSL Certificate**
```bash
# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 🚀 Step 9: Start Your Application

### **9.1 Start with PM2**
```bash
# Navigate to project directory
cd /home/jpapp/jp-app-backend

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### **9.2 Verify Application**
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs jp-app-backend

# Check if application is running
curl http://localhost:5001/api/health
```

---

## 🔧 Step 10: Firewall Configuration

### **10.1 Configure UFW Firewall**
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow your application port (if direct access needed)
sudo ufw allow 5001

# Check firewall status
sudo ufw status
```

---

## 📊 Step 11: Monitoring & Maintenance

### **11.1 Setup Monitoring**
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Check system resources
htop
df -h
free -h
```

### **11.2 Setup Log Rotation**
```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/jp-app
```

```bash
/home/jpapp/jp-app-backend/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 jpapp jpapp
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 🧪 Step 12: Testing Your Deployment

### **12.1 Test API Endpoints**
```bash
# Test health endpoint
curl https://your-domain.com/api/health

# Test catalogue endpoint
curl https://your-domain.com/api/catalogue

# Test admin login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@jpgroup.com", "password": "jpeljaiko1854#"}'
```

### **12.2 Test File Upload**
```bash
# Test file upload (replace with actual file)
curl -X POST https://your-domain.com/api/catalogue/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "catalogue=@test.pdf"
```

---

## 🔄 Step 13: Updates & Maintenance

### **13.1 Update Application**
```bash
# Navigate to project directory
cd /home/jpapp/jp-app-backend

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild frontend
cd frontend
npm install
npm run build
cd ..

# Restart application
pm2 restart jp-app-backend
```

### **13.2 Backup Database**
```bash
# Create backup script
nano backup-mongodb.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/jpapp/backups"
mkdir -p $BACKUP_DIR

# MongoDB Atlas backup (use Atlas backup feature)
# Or export data
mongodump --uri="YOUR_MONGODB_URI" --out="$BACKUP_DIR/mongodb_backup_$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/mongodb_backup_$DATE.tar.gz" "$BACKUP_DIR/mongodb_backup_$DATE"

# Remove uncompressed backup
rm -rf "$BACKUP_DIR/mongodb_backup_$DATE"

echo "Backup completed: mongodb_backup_$DATE.tar.gz"
```

---

## 🚨 Troubleshooting

### **Common Issues:**

#### **1. Application Won't Start**
```bash
# Check PM2 logs
pm2 logs jp-app-backend

# Check if port is in use
sudo netstat -tlnp | grep :5001

# Check environment variables
pm2 show jp-app-backend
```

#### **2. Database Connection Issues**
```bash
# Test MongoDB connection
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.log('❌ Database error:', err));
"
```

#### **3. Email Not Working**
```bash
# Test email configuration
node test-email.js
```

#### **4. Nginx Issues**
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx configuration
sudo nginx -t
```

#### **5. SSL Certificate Issues**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew
```

---

## 📋 Deployment Checklist

- [ ] VPS access configured
- [ ] Node.js 18.x installed
- [ ] PM2 installed
- [ ] MongoDB Atlas cluster created
- [ ] Database user configured
- [ ] Network access configured
- [ ] Gmail App Password generated
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Admin user created
- [ ] PM2 configuration created
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained
- [ ] Application started with PM2
- [ ] Firewall configured
- [ ] Monitoring setup
- [ ] Log rotation configured
- [ ] API endpoints tested
- [ ] File upload tested
- [ ] Backup strategy implemented

---

## 🎯 Your Application URLs

After successful deployment:

- **Main Application:** `https://your-domain.com`
- **API Health Check:** `https://your-domain.com/api/health`
- **Admin Panel:** `https://your-domain.com/admin/login`
- **API Documentation:** `https://your-domain.com/api`

---

## 📞 Support

If you encounter issues:

1. **Check Logs:** `pm2 logs jp-app-backend`
2. **Check Status:** `pm2 status`
3. **Restart App:** `pm2 restart jp-app-backend`
4. **Check Nginx:** `sudo systemctl status nginx`
5. **Check SSL:** `sudo certbot certificates`

---

**🎉 Congratulations!** Your JP App backend is now deployed on Hostinger KVM 1 VPS and ready to serve your application!
