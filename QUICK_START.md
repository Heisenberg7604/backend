# 🚀 Quick Start - Backend Deployment

## ⚡ 5-Minute Setup

### 1. Prepare Backend
```bash
cd backend
./setup.sh
```

### 2. Edit Environment Variables
```bash
# Edit .env file with your values
nano .env
```

**Required values:**
- `MONGODB_URI` - Get from MongoDB Atlas
- `JWT_SECRET` - Generate random key
- `EMAIL_USER` - Your Gmail
- `EMAIL_PASS` - Gmail app password

### 3. Deploy to Sevalla
1. Go to [sevalla.com](https://sevalla.com)
2. Connect GitHub repo
3. Set environment variables
4. Deploy!

### 4. Test Deployment
```bash
./test-deployment.sh https://your-app.sevalla.com
```

### 5. Update Frontend
```bash
# In project root, create .env
echo "EXPO_PUBLIC_API_URL=https://your-app.sevalla.com/api" > .env
```

## 🎯 That's It!

Your backend is now deployed and ready to serve your JP App!

## 📚 Need Help?

- **Detailed Guide**: See `README.md`
- **Environment Setup**: See `env.production.example`
- **Testing**: Use `test-deployment.sh`
- **Troubleshooting**: Check deployment logs

## 🔗 Useful Links

- [MongoDB Atlas](https://mongodb.com/atlas) - Database
- [Sevalla](https://sevalla.com) - Deployment
- [Railway](https://railway.app) - Alternative deployment
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833) - Email setup
