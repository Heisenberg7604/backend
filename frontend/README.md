# JP Admin Panel

A React-based admin panel for monitoring and managing the JP Extrusiontech mobile app backend.

## Features

### 🔐 Authentication
- Secure admin login with credentials: `admin@jpapp.com` / `jpeljaiko1854#`
- JWT token-based authentication
- Automatic token refresh and logout

### 📊 Dashboard
- Real-time statistics and analytics
- User growth charts
- Download trends
- Activity monitoring
- Recent user activities

### 👥 User Management
- View all registered users
- Search and filter users
- Activate/deactivate user accounts
- View user details and activity history
- Soft delete functionality

### 📈 Activity Monitoring
- Real-time activity tracking
- User login/logout events
- Catalogue download activities
- Newsletter subscriptions
- Admin actions logging
- IP address and timestamp tracking

### 📁 Catalogue Management
- Upload and manage catalogue files
- Track download statistics
- View download history
- File management (edit, delete)

### 📧 Newsletter Management
- View newsletter subscribers
- Manage subscription status
- Export subscriber data to CSV
- Track subscription sources

## Access

The admin panel is accessible at:
- **Development**: `http://localhost:3000/admin/login`
- **Production**: `https://your-domain.com/admin/login`

**Default Credentials:**
- Email: `admin@jpapp.com`
- Password: `jpeljaiko1854#`

## Installation & Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your backend API URL:
   ```
   VITE_API_URL=http://localhost:5001/api
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```

4. **Production Build**
   ```bash
   npm run build
   ```

## Architecture

### Route Structure
- `/` - Blank white screen (as requested)
- `/admin/login` - Admin login page
- `/admin/dashboard` - Main dashboard
- `/admin/users` - User management
- `/admin/activities` - Activity monitoring
- `/admin/catalogues` - Catalogue management
- `/admin/newsletter` - Newsletter management

### Key Components
- **AuthContext** - Authentication state management
- **Layout** - Main admin panel layout with sidebar
- **ApiService** - Centralized API communication
- **Pages** - Individual admin pages

### Security Features
- Protected routes requiring authentication
- Automatic token refresh
- Secure logout functionality
- Role-based access control

## Integration with Backend

The admin panel communicates with the backend API endpoints:
- `/api/auth/login` - Admin authentication
- `/api/admin/dashboard` - Dashboard statistics
- `/api/admin/users` - User management
- `/api/admin/activity` - Activity tracking
- `/api/admin/catalogue/downloads` - Download history
- `/api/admin/newsletter/subscribers` - Newsletter management

## Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your web server

3. **Configure environment variables** for production

4. **Set up routing** to serve the admin panel at `/admin/login`

## Monitoring Capabilities

This admin panel provides comprehensive monitoring for:
- **User Registration Trends** - Track new user signups
- **App Usage Analytics** - Monitor user activity patterns
- **Catalogue Download Metrics** - Track popular content
- **Newsletter Engagement** - Monitor subscription rates
- **System Health** - Real-time activity monitoring
- **Security Events** - Track admin logins and user actions

Perfect for remote monitoring of your mobile app's backend performance and user engagement!
