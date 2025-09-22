# COMPLETE ENVIRONMENT VARIABLES FOR SEVALLA DEPLOYMENT
# Copy these to your Sevalla environment variables

# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=5001
NODE_ENV=production

# ===========================================
# DATABASE CONFIGURATION
# ===========================================
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jpapp?retryWrites=true&w=majority

# ===========================================
# JWT CONFIGURATION
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-change-this
JWT_EXPIRE=7d

# ===========================================
# PASSWORD HASHING
# ===========================================
BCRYPT_SALT=10

# ===========================================
# ADMIN CONFIGURATION
# ===========================================
ADMIN_SEED_EMAIL=admin@jpapp.com
ADMIN_SEED_PASSWORD=jpeljaiko1854#

# ===========================================
# CORS CONFIGURATION (CRITICAL)
# ===========================================
CORS_ORIGIN=https://backend-4t1a3.sevalla.app
FRONTEND_URL=https://backend-4t1a3.sevalla.app

# ===========================================
# RATE LIMITING
# ===========================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ===========================================
# FILE UPLOAD
# ===========================================
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads

# ===========================================
# EMAIL CONFIGURATION
# ===========================================
SMTP_HOST=webmail.jpel.in
SMTP_PORT=587
SMTP_USER=media@jpel.in
SMTP_PASS=your_smtp_password_here
SMTP_FROM=media@jpel.in

# ===========================================
# ADMIN NOTIFICATION EMAILS
# ===========================================
ADMIN_EMAILS=info@jpel.in,rakesh@jpel.in

# ===========================================
# FRONTEND API URL
# ===========================================
VITE_API_URL=https://backend-4t1a3.sevalla.app/api
