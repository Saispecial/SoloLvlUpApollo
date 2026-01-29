# Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Option 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Saispecial/SoloLvlUpApollo)

### Option 2: Manual Setup

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import `Saispecial/SoloLvlUpApollo`

2. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm install` (auto-detected)
   - Node.js Version: **18.x** (recommended)

3. **Environment Variables**
   Add these in Vercel Dashboard → Settings → Environment Variables:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-app-name.vercel.app`

## 🔧 Vercel Configuration

The project includes `vercel.json` with optimized settings:

- **Framework**: Next.js (auto-detected)
- **Region**: US East (iad1) for optimal performance
- **Security Headers**: XSS protection, content type sniffing prevention
- **Runtime**: Node.js 18.x (default)

## 📊 Build Optimization

- **Next.js 16.1.6**: Latest stable version with security fixes
- **Package Import Optimization**: Faster builds and smaller bundles
- **Image Optimization**: Disabled for compatibility (can be enabled if needed)
- **Turbopack**: Configured for faster builds

## 🔍 Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Ensure all required API keys are provided
- Review build logs in Vercel dashboard
- Verify Node.js version is 18.x or higher

### Runtime Errors
- Check function logs in Vercel dashboard
- Verify API endpoints are accessible
- Ensure database connections are configured

### Performance Issues
- Monitor Core Web Vitals in Vercel Analytics
- Check bundle size in build output
- Consider enabling image optimization if using external images

## 🚀 Post-Deployment

1. **Test All Features**
   - AI tools functionality
   - 3D nurse interactions
   - Training modules
   - Assessment forms

2. **Set Up Monitoring**
   - Enable Vercel Analytics
   - Configure error tracking
   - Set up uptime monitoring

3. **Custom Domain** (Optional)
   - Add custom domain in Vercel dashboard
   - Configure DNS settings
   - Enable SSL certificate

## 📈 Performance Tips

- Use Vercel Edge Functions for global performance
- Enable ISR (Incremental Static Regeneration) for dynamic content
- Implement proper caching strategies
- Optimize images and assets

## 🔒 Security

- All security headers are configured in `vercel.json`
- Environment variables are encrypted at rest
- API routes use proper authentication
- HTTPS is enforced by default

Your SoloLvlUpApollo app is now ready for production on Vercel! 🎉