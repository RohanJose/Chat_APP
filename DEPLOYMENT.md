# 🚀 Deployment Guide: Vercel + Railway

This guide will walk you through deploying your Stranger Chat app to Vercel (frontend) and Railway (backend).

## 📋 Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Railway Account** - Sign up at [railway.app](https://railway.app)
4. **MongoDB Atlas Account** - For database hosting

## 🔧 Step 1: Prepare Your Code

### 1.1 Install CLI Tools

```bash
# Install Railway CLI
npm install -g @railway/cli

# Install Vercel CLI
npm install -g vercel
```

### 1.2 Login to Services

```bash
# Login to Railway
railway login

# Login to Vercel
vercel login
```

## 🚂 Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your repository
5. Choose the `backend` folder as the source

### 2.2 Configure Environment Variables

In your Railway project dashboard, add these environment variables:

```env
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.vercel.app
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stranger-chat
```

**Important Notes:**
- Replace `your-frontend-url.vercel.app` with your actual Vercel URL (you'll get this after deploying the frontend)
- Replace the MongoDB URI with your actual MongoDB Atlas connection string
- Initially, you can set `CORS_ORIGIN` to `*` for testing, then update it after getting your Vercel URL

### 2.3 Deploy

Railway will automatically deploy your backend. Wait for the deployment to complete and note the generated URL.

## ☁️ Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

### 3.2 Configure Environment Variables

In your Vercel project settings, add these environment variables:

```env
REACT_APP_API_URL=https://your-backend-url.railway.app/api
REACT_APP_SOCKET_URL=https://your-backend-url.railway.app
REACT_APP_NODE_ENV=production
```

**Important Notes:**
- Replace `your-backend-url.railway.app` with your actual Railway backend URL
- You can get this URL from your Railway project dashboard

### 3.3 Deploy

Click "Deploy" and wait for the build to complete. Vercel will give you a URL for your frontend.

## 🔄 Step 4: Update CORS Settings

After getting your Vercel frontend URL, update the `CORS_ORIGIN` environment variable in Railway:

1. Go to your Railway project dashboard
2. Update the `CORS_ORIGIN` variable with your Vercel URL
3. Redeploy the backend (Railway will do this automatically)

## 🧪 Step 5: Test Your Deployment

1. **Test Frontend**: Visit your Vercel URL
2. **Test Backend**: Visit `https://your-backend-url.railway.app/health`
3. **Test Video Chat**: Try starting a video chat session
4. **Test Text Chat**: Try starting a text chat session

## 🔧 Troubleshooting

### Common Issues

#### 1. CORS Errors
- Make sure `CORS_ORIGIN` in Railway matches your Vercel URL exactly
- Check that the backend is redeployed after updating CORS settings

#### 2. WebSocket Connection Issues
- Ensure your Railway backend supports WebSockets (it should by default)
- Check that the `REACT_APP_SOCKET_URL` in Vercel is correct

#### 3. MongoDB Connection Issues
- Verify your MongoDB Atlas connection string
- Ensure your IP address is whitelisted in MongoDB Atlas
- Check that your database user has the correct permissions

#### 4. Build Failures
- Make sure all dependencies are properly installed
- Check that your React app builds locally with `npm run build`

### Debug Commands

```bash
# Check Railway logs
railway logs

# Check Railway status
railway status

# Redeploy Railway
railway up

# Check Vercel deployment status
vercel ls
```

## 📱 Custom Domain (Optional)

### Vercel Custom Domain
1. Go to your Vercel project settings
2. Add your custom domain
3. Update your DNS records as instructed

### Railway Custom Domain
1. Go to your Railway project settings
2. Add a custom domain
3. Update your DNS records as instructed

## 🔒 Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **CORS**: Restrict CORS origins to only your frontend domain in production
3. **MongoDB**: Use strong passwords and restrict IP access
4. **HTTPS**: Both Vercel and Railway provide HTTPS by default

## 📊 Monitoring

### Railway Monitoring
- View logs in real-time
- Monitor resource usage
- Set up alerts for downtime

### Vercel Monitoring
- View build logs
- Monitor performance
- Set up analytics

## 🔄 Continuous Deployment

Both Vercel and Railway support automatic deployments:
- **Vercel**: Automatically deploys on every push to your main branch
- **Railway**: Automatically deploys on every push to your main branch

## 📞 Support

- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Railway**: [railway.app/support](https://railway.app/support)
- **MongoDB Atlas**: [cloud.mongodb.com/support](https://cloud.mongodb.com/support)

## 🎉 Congratulations!

Your Stranger Chat app is now deployed and accessible worldwide! 

**Next Steps:**
1. Share your app with friends
2. Monitor usage and performance
3. Consider adding analytics
4. Plan for scaling if needed
