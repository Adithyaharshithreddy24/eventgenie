# EventGenie Deployment Checklist

Use this checklist to ensure a successful deployment of your EventGenie application.

## ✅ Pre-Deployment Checklist

### Environment Setup
- [ ] MongoDB Atlas cluster created and configured
- [ ] Database user created with proper permissions
- [ ] IP whitelist configured (or 0.0.0.0/0 for development)
- [ ] Connection string copied and tested

### Code Preparation
- [ ] All hardcoded localhost URLs replaced with environment variables
- [ ] API configuration file created (`eventgenie/src/config/api.js`)
- [ ] Environment example files created (`env.example`)
- [ ] `.env` files added to `.gitignore`
- [ ] Migration script run (if needed)

### Testing
- [ ] Application runs locally without errors
- [ ] All API endpoints tested
- [ ] Database connections working
- [ ] Frontend can communicate with backend
- [ ] No console errors in browser

## 🚀 Deployment Steps

### Backend Deployment (Vercel)

1. **Repository Setup**
   - [ ] Code pushed to GitHub
   - [ ] Repository is public or Vercel has access

2. **Vercel Configuration**
   - [ ] Import repository to Vercel
   - [ ] Set root directory to `server`
   - [ ] Framework preset: Node.js
   - [ ] Build command: `npm install`
   - [ ] Output directory: (leave empty)

3. **Environment Variables**
   - [ ] `MONGO_URI`: MongoDB Atlas connection string
   - [ ] `NODE_ENV`: `production`
   - [ ] `PORT`: (Vercel will set automatically)

4. **Deploy**
   - [ ] Click "Deploy"
   - [ ] Wait for build to complete
   - [ ] Test backend URL (e.g., `https://your-app.vercel.app`)

### Frontend Deployment

#### Option A: Vercel
1. **Repository Setup**
   - [ ] Same repository as backend

2. **Vercel Configuration**
   - [ ] Import repository to Vercel (new project)
   - [ ] Set root directory to `eventgenie`
   - [ ] Framework preset: Vite
   - [ ] Build command: `npm run build`
   - [ ] Output directory: `dist`

3. **Environment Variables**
   - [ ] `VITE_API_BASE_URL`: Your backend URL

4. **Deploy**
   - [ ] Click "Deploy"
   - [ ] Wait for build to complete
   - [ ] Test frontend URL

#### Option B: Netlify
1. **Repository Setup**
   - [ ] Code pushed to GitHub

2. **Netlify Configuration**
   - [ ] Connect GitHub repository
   - [ ] Build command: `npm run build`
   - [ ] Publish directory: `dist`
   - [ ] Node version: 18

3. **Environment Variables**
   - [ ] `VITE_API_BASE_URL`: Your backend URL

4. **Deploy**
   - [ ] Trigger deployment
   - [ ] Wait for build to complete
   - [ ] Test frontend URL

## 🔍 Post-Deployment Testing

### Backend Testing
- [ ] Health check endpoint responds (`/`)
- [ ] API endpoints accessible
- [ ] Database connections working
- [ ] CORS configured correctly
- [ ] No errors in Vercel logs

### Frontend Testing
- [ ] Application loads without errors
- [ ] Navigation works correctly
- [ ] API calls succeed
- [ ] No console errors
- [ ] Responsive design works
- [ ] All features functional

### Integration Testing
- [ ] User registration works
- [ ] Login/logout functionality
- [ ] Service browsing works
- [ ] Booking system functional
- [ ] Admin panel accessible
- [ ] Vendor dashboard works

## 🐛 Common Issues & Solutions

### Build Failures
- [ ] Check Node.js version (>=18)
- [ ] Clear cache and rebuild
- [ ] Check for syntax errors
- [ ] Verify all dependencies installed

### CORS Errors
- [ ] Backend CORS configured for frontend domain
- [ ] Check environment variables
- [ ] Verify API URLs are correct

### Database Connection Issues
- [ ] Check MongoDB Atlas connection string
- [ ] Verify IP whitelist
- [ ] Check database user permissions
- [ ] Test connection locally

### Environment Variables Not Loading
- [ ] Restart deployment after adding variables
- [ ] Check variable names (VITE_ prefix for frontend)
- [ ] Verify no typos in variable names

## 📊 Performance Optimization

### Frontend
- [ ] Bundle size optimized
- [ ] Images compressed
- [ ] Code splitting implemented
- [ ] Caching configured

### Backend
- [ ] Database indexes created
- [ ] API response times acceptable
- [ ] Error handling implemented
- [ ] Logging configured

## 🔒 Security Checklist

- [ ] Environment variables not committed to Git
- [ ] API keys secured
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Database access restricted
- [ ] Input validation implemented

## 📝 Documentation

- [ ] README updated with deployment URLs
- [ ] API documentation updated
- [ ] Environment setup documented
- [ ] Troubleshooting guide created

## 🎉 Final Steps

- [ ] Update README with live URLs
- [ ] Test all user flows
- [ ] Monitor application performance
- [ ] Set up error monitoring
- [ ] Configure analytics (optional)
- [ ] Share deployment URLs with team

---

**Deployment Status**: ⏳ Pending | ✅ Complete | ❌ Failed

**Notes**: 
- Add any specific issues or customizations here
- Document any manual steps taken
- Note any workarounds implemented 