# 🏏 Cricklytics Deployment Checklist

## Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All code committed to GitHub
- [ ] Environment variables configured
- [ ] Database initialization working locally
- [ ] Frontend builds successfully
- [ ] Backend API endpoints tested

### 2. Domain Setup
- [ ] Domain `oshoupadhyay.in` configured
- [ ] DNS managed by Vercel
- [ ] Subdomain `cricklytics` available

## Deployment Steps

### Phase 1: Backend Deployment (Render)

- [ ] Create Render account (if not exists)
- [ ] Connect GitHub repository to Render
- [ ] Create new Web Service:
  - [ ] Name: `cricklytics-backend`
  - [ ] Root Directory: `backend`
  - [ ] Build Command: `pip install -r requirements.txt`
  - [ ] Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
  - [ ] Plan: Free
- [ ] Configure Environment Variables:
  - [ ] `SECRET_KEY`: (generate secure key)
  - [ ] `PYTHON_VERSION`: `3.11`
- [ ] Deploy and test backend
- [ ] Note backend URL: `https://cricklytics-backend.onrender.com`

### Phase 2: Frontend Deployment (Vercel)

- [ ] Create Vercel account (if not exists)
- [ ] Connect GitHub repository to Vercel
- [ ] Import project:
  - [ ] Project Name: `cricklytics`
  - [ ] Framework: Create React App
  - [ ] Root Directory: `frontend`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `build`
- [ ] Configure Environment Variables:
  - [ ] `REACT_APP_API_URL`: `https://cricklytics-backend.onrender.com`
  - [ ] `REACT_APP_ENV`: `production`
- [ ] Deploy frontend
- [ ] Test deployment on Vercel URL

### Phase 3: Domain Configuration

- [ ] Add custom domain in Vercel:
  - [ ] Domain: `cricklytics.oshoupadhyay.in`
  - [ ] Configure DNS settings
  - [ ] Wait for DNS propagation
- [ ] Test subdomain access
- [ ] Verify SSL certificate

## Post-Deployment Testing

### Backend Tests
- [ ] Health check: `https://cricklytics-backend.onrender.com/`
- [ ] API documentation: `https://cricklytics-backend.onrender.com/docs`
- [ ] Database initialization successful
- [ ] CORS headers working

### Frontend Tests
- [ ] Site loads: `https://cricklytics.oshoupadhyay.in`
- [ ] User registration works
- [ ] User login works
- [ ] API calls successful
- [ ] Match creation works
- [ ] Scoring interface functional

### Integration Tests
- [ ] Frontend → Backend communication
- [ ] Authentication flow
- [ ] Data persistence
- [ ] Real-time updates (if applicable)

## Monitoring & Maintenance

- [ ] Set up monitoring alerts
- [ ] Configure backup strategy
- [ ] Document admin procedures
- [ ] Plan for scaling (if needed)

## Troubleshooting

### Common Issues to Check:
- [ ] CORS configuration
- [ ] Environment variables
- [ ] API endpoint URLs
- [ ] Database connectivity
- [ ] SSL/HTTPS redirection

## Rollback Plan

If deployment fails:
- [ ] Revert to previous commit
- [ ] Check error logs on platforms
- [ ] Verify configuration files
- [ ] Test locally before redeploying

## Success Criteria

✅ **Deployment is successful when:**
- Backend responds at `https://cricklytics-backend.onrender.com`
- Frontend loads at `https://cricklytics.oshoupadhyay.in`
- Users can register and login
- Match creation and scoring works
- No CORS or API errors
- SSL certificate valid

---

**Estimated Deployment Time:** 30-60 minutes
**Cost:** $0 (using free tiers)
**Maintenance:** Minimal (serverless platforms)
