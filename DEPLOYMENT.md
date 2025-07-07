# Cricklytics Deployment Guide

This guide will help you deploy your Cricklytics application to a subdomain on your domain `oshoupadhyay.in`.

## Architecture Overview

- **Frontend**: React app deployed on Vercel (subdomain: `cricklytics.oshoupadhyay.in`)
- **Backend**: FastAPI server deployed on Render (free tier)
- **Database**: SQLite database on Render

## Step 1: Deploy Backend to Render

### Option A: Using Render Dashboard (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `cricklytics-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

5. Add Environment Variables:
   - `SECRET_KEY`: Generate a secure random key (or let Render generate one)
   - `PYTHON_VERSION`: `3.11`

6. Click "Create Web Service"

### Option B: Using render.yaml (Alternative)

1. Push the `backend/render.yaml` file to your repository
2. Connect your repository to Render
3. Render will automatically detect the configuration

## Step 2: Deploy Frontend to Vercel

### Prerequisites
- Vercel account connected to your GitHub
- Domain `oshoupadhyay.in` DNS managed by Vercel

### Steps

1. **Push your code to GitHub** (if not already done)

2. **Connect to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - **Project Name**: `cricklytics`
     - **Framework Preset**: Create React App
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `build`

3. **Configure Environment Variables** in Vercel:
   - `REACT_APP_API_URL`: `https://cricklytics-backend.onrender.com`
   - `REACT_APP_ENV`: `production`

4. **Deploy**: Click "Deploy"

## Step 3: Configure Custom Domain

### In Vercel Dashboard:

1. Go to your project settings
2. Click "Domains"
3. Add domain: `cricklytics.oshoupadhyay.in`
4. Vercel will provide DNS configuration

### In your Domain Provider (GoDaddy):

Since your DNS is managed by Vercel, add the subdomain:
1. Go to Vercel → Settings → Domains
2. Add `cricklytics.oshoupadhyay.in`
3. Follow Vercel's DNS configuration instructions

## Step 4: Update Backend URL

Once your Render backend is deployed:

1. Note the backend URL (e.g., `https://cricklytics-backend.onrender.com`)
2. Update the `vercel.json` file with the correct Render URL
3. Update frontend environment variables
4. Redeploy on Vercel

## Step 5: Test Your Deployment

1. **Backend Health Check**: 
   - Visit `https://cricklytics-backend.onrender.com`
   - Should return: `{"message": "Cricklytics API is running!"}`

2. **Frontend**: 
   - Visit `https://cricklytics.oshoupadhyay.in`
   - Test user registration/login
   - Test API connectivity

## Important Notes

### Render Free Tier Limitations:
- **Sleep after inactivity**: Your backend will sleep after 15 minutes of inactivity
- **Cold start**: First request after sleep may take 30-60 seconds
- **Monthly usage**: 750 hours per month (sufficient for most use cases)

### Database Considerations:
- SQLite database persists on Render's disk
- Consider upgrading to PostgreSQL for production use
- Backup your database regularly

### Security:
- Generate a strong `SECRET_KEY` for production
- Consider using environment variables for sensitive data
- Enable HTTPS (automatically handled by Vercel and Render)

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Check that your frontend domain is in the `allowed_origins` list
2. **404 on API calls**: Verify the backend URL in environment variables
3. **Database not initializing**: Check Render logs for database creation errors
4. **Build failures**: Check dependencies in `requirements.txt`

### Monitoring:
- **Render**: Check logs in Render dashboard
- **Vercel**: Check function logs in Vercel dashboard
- **Browser**: Use developer tools to debug API calls

## Costs

- **Render**: Free tier (750 hours/month)
- **Vercel**: Free tier (100GB bandwidth/month)
- **Domain**: Already owned (`oshoupadhyay.in`)

Total monthly cost: $0 (within free tier limits)

## Future Enhancements

1. **Database Upgrade**: Consider PostgreSQL on Render
2. **CDN**: Optimize static assets delivery
3. **Monitoring**: Add application monitoring
4. **CI/CD**: Automated testing and deployment
5. **SSL**: Already handled by platforms

## Support

- **Render Documentation**: https://render.com/docs
- **Vercel Documentation**: https://vercel.com/docs
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
