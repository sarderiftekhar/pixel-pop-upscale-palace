# 🔧 Quick Environment Setup

## Step 1: Create .env file

Create a `.env` file in your project root with these variables:

```env
# Stability AI API Key (Required for image upscaling)
VITE_STABILITY_API_KEY=sk-your-stability-api-key

# Supabase Configuration (Required for authentication)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: Stripe for payments
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret

# App URL
VITE_APP_URL=http://localhost:5173
```

## Step 2: Get Stability AI API Key

1. Go to https://platform.stability.ai/
2. Sign up/login
3. Navigate to "API Keys"
4. Generate a new API key
5. **Important**: Add credits to your account (required for processing)

## Step 3: Get Supabase Keys

1. Go to https://supabase.com/
2. Create a new project
3. Go to Settings → API
4. Copy your Project URL and anon/public key

## Step 4: Restart Development Server

```bash
npm run dev
```

## ⚠️ Important Notes

- **Never commit your .env file** - it's already in .gitignore
- **Stability AI costs money** - each upscale uses credits from your account
- **Test with small images first** - to avoid unexpected costs
- **Check your Stability AI balance** before processing large batches

## 🧪 Testing

1. Upload a small test image
2. Try 2x upscaling first
3. Check the result quality
4. Monitor your Stability AI credit usage

The app will now use real AI upscaling instead of simulation! 