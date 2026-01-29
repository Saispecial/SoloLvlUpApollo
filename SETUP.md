# Healthcare EI Training App - Setup Guide

## 🚀 Quick Start

Your application is running at: **http://localhost:3001**

### ✅ What's Working Right Now:
- Main Dashboard with all features
- AI Tools (with fallback responses)
- Training modules and progress tracking
- Mobile responsive design
- All UI components and navigation

### 🔧 To Enable Full Functionality:

#### 1. Add Gemini API Key (for AI features)
1. Visit: https://makersuite.google.com/app/apikey
2. Create a free API key
3. Open `.env.local` file in your project
4. Add: `GEMINI_API_KEY=your_api_key_here`
5. Restart the development server

#### 2. Optional: Add Supabase (for database features)
1. Visit: https://supabase.com
2. Create a free project
3. Add your project details to `.env.local`

### 🏠 **Recommended: Start with Main Dashboard**
Instead of `/counselor`, visit: **http://localhost:3001** (main dashboard)

The main dashboard has:
- ✅ Training modules
- ✅ AI Tools section
- ✅ Progress tracking
- ✅ Assessment center
- ✅ Reflection tools
- ✅ Analytics

### 🤖 AI Tools Available:
1. **Reframe** - Emotional first aid
2. **Assumptions Lab** - Challenge limiting beliefs  
3. **Control & Influence Map** - Manage overwhelm
4. **Change Companion** - Relationship support
5. **Breathing Exercise** - Stress relief

### 📱 Navigation:
- Use the bottom navigation on mobile
- All features accessible from main dashboard
- Training program with 4-week structure

### 🔧 If Issues Persist:
1. Clear browser cache
2. Restart development server: `npm run dev`
3. Check console for any errors

The application is fully functional - just start from the main dashboard!