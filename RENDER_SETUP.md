# 🚀 Render Quick Setup Guide for Cricklytics

## Render Configuration Settings

### Basic Settings
- **Service Name**: `cricklytics-backend`
- **Environment**: `Python 3`
- **Region**: `US East (Virginia)` or closest to your users
- **Branch**: `main`

### Build & Deploy Settings
```
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn server:app --host 0.0.0.0 --port $PORT
```

### Environment Variables
```
SECRET_KEY = [Generate a secure 32-character random string]
PYTHON_VERSION = 3.11
```

## ⚠️ Common Mistakes to Avoid

1. **Wrong Start Command**: 
   - ❌ `gunicorn your_application.wsgi`
   - ✅ `uvicorn server:app --host 0.0.0.0 --port $PORT`

2. **Missing Port Variable**: 
   - ❌ `uvicorn server:app --host 0.0.0.0 --port 8000`
   - ✅ `uvicorn server:app --host 0.0.0.0 --port $PORT`

3. **Wrong Root Directory**: 
   - ❌ Leave empty or use `.`
   - ✅ Use `backend`

## 🔧 Generate SECRET_KEY

Run this command locally to generate a secure key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 📋 Deployment Checklist

- [ ] Root Directory: `backend`
- [ ] Build Command: `pip install -r requirements.txt`  
- [ ] Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- [ ] Environment Variables added
- [ ] Auto-Deploy enabled
- [ ] Free plan selected

## 🧪 Test Your Deployment

Once deployed, test these URLs:
- Health Check: `https://your-service-name.onrender.com/`
- API Docs: `https://your-service-name.onrender.com/docs`

## 📞 Need Help?

If deployment fails, check:
1. **Logs** in Render dashboard
2. **Requirements.txt** has all dependencies
3. **Python version** compatibility
4. **Import statements** in server.py

## ⏱️ Expected Timeline

- **Build Time**: 2-5 minutes
- **Deploy Time**: 1-2 minutes
- **Cold Start**: 30-60 seconds (free tier)
