# EventGenie Deployment Guide

This guide covers deploying EventGenie to various platforms including Vercel, Netlify, and Heroku.

## 🚀 Quick Deployment Options

### Option 1: Vercel (Recommended)
- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Vercel
- **Database**: MongoDB Atlas

### Option 2: Netlify + Vercel
- **Frontend**: Deploy to Netlify
- **Backend**: Deploy to Vercel
- **Database**: MongoDB Atlas

### Option 3: Heroku
- **Frontend**: Deploy to Heroku
- **Backend**: Deploy to Heroku
- **Database**: MongoDB Atlas

## 📋 Prerequisites

1. **MongoDB Atlas Account**: Set up a free MongoDB Atlas cluster
2. **GitHub Account**: For version control
3. **Vercel/Netlify Account**: For deployment

## 🔧 Environment Setup

### 1. MongoDB Atlas Setup
1. Create a MongoDB Atlas account
2. Create a new cluster (free tier available)
3. Create a database user
4. Get your connection string
5. Add your IP to the whitelist

### 2. Environment Variables

#### Backend (.env)
```env
PORT=5001
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/eventgenie?retryWrites=true&w=majority
NODE_ENV=production
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=https://your-backend-url.vercel.app
VITE_APP_NAME=EventGenie
```

## 🚀 Deployment Steps

### Backend Deployment (Vercel)

1. **Push to GitHub**:
   ```bash
   cd server
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set root directory to `server`
   - Add environment variables:
     - `MONGO_URI`: Your MongoDB Atlas connection string
     - `NODE_ENV`: `production`

3. **Get Backend URL**:
   - Copy the deployment URL (e.g., `https://eventgenie-backend.vercel.app`)

### Frontend Deployment

#### Option A: Vercel
1. **Update API URL**:
   - Set `VITE_API_BASE_URL` to your backend URL
   
2. **Deploy**:
   - Import repository to Vercel
   - Set root directory to `eventgenie`
   - Add environment variable: `VITE_API_BASE_URL`

#### Option B: Netlify
1. **Update netlify.toml**:
   - Replace `your-backend-url.vercel.app` with your actual backend URL

2. **Deploy**:
   - Connect GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variable: `VITE_API_BASE_URL`

## 🔧 Manual Deployment

### Local Testing
```bash
# Backend
cd server
npm install
npm start

# Frontend (in new terminal)
cd eventgenie
npm install
npm run dev
```

### Production Build
```bash
# Backend
cd server
npm install
npm start

# Frontend
cd eventgenie
npm install
npm run build
npm run start
```

## 🐛 Common Issues & Solutions

### 1. CORS Errors
**Issue**: Frontend can't connect to backend
**Solution**: Ensure backend CORS is configured properly

### 2. Environment Variables Not Loading
**Issue**: API calls still use localhost
**Solution**: 
- Check environment variable names (must start with `VITE_` for frontend)
- Restart development server after adding .env files

### 3. MongoDB Connection Issues
**Issue**: Can't connect to database
**Solution**:
- Check MongoDB Atlas connection string
- Ensure IP is whitelisted
- Verify database user credentials

### 4. Build Failures
**Issue**: Frontend build fails
**Solution**:
- Check Node.js version (requires >=18)
- Clear node_modules and reinstall
- Check for syntax errors in React components

## 📊 Performance Optimization

### Frontend
- Code splitting with Vite
- Lazy loading of components
- Image optimization
- Bundle analysis

### Backend
- Database indexing
- API response caching
- Rate limiting
- Error handling

## 🔒 Security Considerations

1. **Environment Variables**: Never commit .env files
2. **API Keys**: Use environment variables for all secrets
3. **CORS**: Configure properly for production domains
4. **Database**: Use strong passwords and enable authentication
5. **HTTPS**: Always use HTTPS in production

## 📞 Support

For deployment issues:
1. Check the console logs
2. Verify environment variables
3. Test API endpoints
4. Check database connectivity

## 🔄 Continuous Deployment

Set up automatic deployments:
1. Connect GitHub repository to deployment platform
2. Configure environment variables
3. Set up automatic builds on push to main branch
4. Test deployment pipeline 