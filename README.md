# SoloLvlUpApollo

A comprehensive emotional intelligence development platform for healthcare professionals, featuring AI-powered tools, 3D nurse interactions, and personalized training modules.

## 🚀 Features

- **AI-Powered Tools**: Cognitive reframing, assumptions lab, breathing exercises
- **3D Nurse Companion**: Interactive 3D counseling experience with animations
- **Training Modules**: Week-based emotional intelligence development program
- **Assessment Center**: Validated EI assessments (TEIQue-SF, HEIT, SSEIT)
- **Analytics Dashboard**: Progress tracking and insights
- **Mobile Responsive**: Optimized for all devices

## 🛠 Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **UI**: React 19, Tailwind CSS, Radix UI
- **3D Graphics**: Three.js, React Three Fiber
- **AI**: Google Gemini API
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Testing**: Vitest, Testing Library

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/Saispecial/SoloLvlUpApollo.git
cd SoloLvlUpApollo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your API keys to `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

5. Run the development server:
```bash
npm run dev
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Saispecial/SoloLvlUpApollo)

### Manual Deployment

```bash
npm run build
npm start
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini AI API key | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Optional |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Optional |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Optional |

## 📱 Features Overview

### AI Tools
- **Assumptions Lab**: Challenge limiting beliefs
- **Control & Influence Map**: Manage stress and priorities
- **Change Companion**: Navigate workplace relationships
- **Reframe**: Quick emotional regulation
- **Breathing Exercise**: Physiological grounding

### 3D Nurse Companion
- Interactive 3D nurse model with animations
- Voice-responsive interactions
- Emotional feedback system
- WebGL-based rendering with fallbacks

### Training Program
- 12-week structured EI development
- Daily tasks and activities
- Progress tracking and badges
- Reflection and journaling

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:run
```

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For access or contributions, please contact the repository owner.

## 📞 Support

For support or questions, please contact: saispecial20056@gmail.com