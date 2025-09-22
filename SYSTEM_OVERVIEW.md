# JP Extrusiontech - Complete Backend & Admin Panel System

## 🎯 **System Overview**

This is a comprehensive backend system for the JP Extrusiontech mobile app with a remote monitoring admin panel. The backend serves the mobile app, while the admin panel provides real-time monitoring and management capabilities.

## 🏗️ **Architecture**

```
Mobile App ←→ Backend API ←→ Database
                ↕
         Admin Panel (Remote Monitoring)
```

## 🔧 **Backend Features**

### **Authentication System**
- User registration/login with JWT tokens
- Admin role-based access control
- Password reset via SMTP email
- Account lockout protection

### **Admin API Endpoints**
- `/api/admin/dashboard` - Real-time statistics
- `/api/admin/stats` - Analytics with charts data
- `/api/admin/users` - User management with pagination
- `/api/admin/activity` - Activity tracking
- `/api/admin/catalogue/downloads` - Download history
- `/api/admin/newsletter/subscribers` - Newsletter management

### **Activity Tracking**
- Comprehensive logging of all user actions
- IP address and user agent tracking
- Real-time activity monitoring
- Admin action logging

### **Email Notifications (SMTP)**
- **Admin Emails**: `info@jpel.in`, `rakesh@jpel.in`
- **From Address**: `media@jpel.in` (Port 587)
- **Notifications**: New user registration, admin logins, password resets

### **Security Features**
- Rate limiting and CORS protection
- Input validation and sanitization
- Secure file upload/download
- JWT token management

## 🖥️ **Admin Panel Features**

### **Access Control**
- **URL**: `https://your-domain.com/admin/login`
- **Credentials**: 
  - Email: `admin@jpapp.com`
  - Password: `jpeljaiko1854#`
- **Blank Screen**: Shows white screen for all other routes

### **Dashboard**
- Real-time user statistics
- Growth charts and analytics
- Download trends
- Recent activity feed
- System health monitoring

### **User Management**
- View all registered users
- Search and filter functionality
- Activate/deactivate accounts
- User activity history
- Soft delete capabilities

### **Activity Monitoring**
- Real-time activity tracking
- User login/logout events
- Catalogue download activities
- Newsletter subscriptions
- Admin action logs
- IP address tracking

### **Catalogue Management**
- File upload and management
- Download statistics
- Download history tracking
- File metadata management

### **Newsletter Management**
- Subscriber list management
- Status control (active/inactive)
- CSV export functionality
- Subscription source tracking

## 📁 **Project Structure**

```
backend/
├── src/
│   ├── models/          # Database models
│   ├── controllers/     # API controllers
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication & validation
│   ├── services/        # Email service
│   └── utils/           # Activity logging
├── frontend/            # React admin panel
│   ├── src/
│   │   ├── pages/       # Admin pages
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # Authentication context
│   │   └── services/    # API service
└── scripts/             # Admin seed script
```

## 🚀 **Deployment Guide**

### **Backend Deployment**
1. Set up MongoDB database
2. Configure environment variables
3. Run admin seed script: `npm run seed:admin`
4. Deploy to Sevalla or your server
5. Configure SMTP settings

### **Admin Panel Deployment**
1. Build React app: `npm run build`
2. Deploy `dist` folder to web server
3. Configure routing for `/admin/login`
4. Set production API URL

## 📊 **Monitoring Capabilities**

### **Real-time Monitoring**
- User registration trends
- App usage analytics
- Catalogue download metrics
- Newsletter engagement rates
- System performance metrics

### **Security Monitoring**
- Admin login tracking
- User activity patterns
- IP address monitoring
- Failed login attempts
- Suspicious activity alerts

### **Business Intelligence**
- User growth charts
- Download popularity trends
- Geographic user distribution
- Newsletter subscription rates
- App engagement metrics

## 🔐 **Security Features**

- **Authentication**: JWT tokens with role-based access
- **Email Security**: SMTP with secure credentials
- **Data Protection**: Input validation and sanitization
- **Access Control**: Admin-only endpoints protection
- **Activity Logging**: Comprehensive audit trail
- **Rate Limiting**: API abuse prevention

## 📧 **Email Configuration**

### **SMTP Settings**
- **Host**: smtp.gmail.com (or your SMTP server)
- **Port**: 587 (TLS)
- **From**: media@jpel.in
- **Admin Notifications**: info@jpel.in, rakesh@jpel.in

### **Email Types**
- New user registration notifications
- Admin login alerts
- Password reset emails
- System status updates

## 🎯 **Perfect for Remote Monitoring**

This system provides everything needed for remote monitoring of your mobile app:

✅ **Real-time user activity tracking**  
✅ **Comprehensive analytics dashboard**  
✅ **User management capabilities**  
✅ **Security monitoring and alerts**  
✅ **Business intelligence and reporting**  
✅ **Email notifications for important events**  
✅ **Mobile-friendly admin interface**  

The admin panel gives you complete visibility into your mobile app's backend performance, user engagement, and system health - all accessible remotely through a secure web interface!
