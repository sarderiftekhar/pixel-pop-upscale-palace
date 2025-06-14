# 🔐 Environment Variables Setup Guide

This guide will help you securely configure all the API keys and environment variables needed for your image upscaler.

## 📋 Required Services & Keys

You'll need accounts and API keys from these services:

### 1. 🎨 Stability AI (for image upscaling)
- **Website**: https://platform.stability.ai/
- **Purpose**: AI-powered image upscaling
- **Key needed**: API Key

### 2. 💳 Stripe (for payments)
- **Website**: https://dashboard.stripe.com/
- **Purpose**: Credit purchases and payment processing
- **Keys needed**: Publishable Key, Secret Key, Webhook Secret

### 3. 🗄️ Supabase (for database & auth)
- **Website**: https://supabase.com/
- **Purpose**: User authentication and data storage
- **Keys needed**: Project URL, Anon Key

## 🛠️ Step-by-Step Setup

### Step 1: Create your .env file

Copy the example file and customize it:

```bash
cp .env.example .env
```

### Step 2: Get Stability AI API Key

1. Go to https://platform.stability.ai/
2. Sign up/login to your account
3. Navigate to "API Keys" section
4. Generate a new API key
5. Add credits to your account (required for image processing)

**Add to .env:**
```env
VITE_STABILITY_API_KEY=sk-your-stability-api-key-here
STABILITY_API_KEY=sk-your-stability-api-key-here
```

### Step 3: Set up Stripe

1. Go to https://dashboard.stripe.com/
2. Create account or login
3. Get your keys from the "Developers > API keys" section

**For Testing (recommended first):**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key
STRIPE_SECRET_KEY=sk_test_your_test_secret_key
```

**For Production:**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
```

#### Create Stripe Products & Prices

Run these commands with your Stripe secret key:

```bash
# Create 50 Credits product
curl https://api.stripe.com/v1/products \
  -u sk_test_YOUR_SECRET_KEY: \
  -d name="50 Credits" \
  -d description="Starter pack - 50 image upscaling credits"

# Create price for 50 credits ($4.99)
curl https://api.stripe.com/v1/prices \
  -u sk_test_YOUR_SECRET_KEY: \
  -d product=PRODUCT_ID_FROM_ABOVE \
  -d unit_amount=499 \
  -d currency=usd
```

Repeat for all credit packages (100, 250, 500 credits).

### Step 4: Configure Supabase

1. Go to https://supabase.com/
2. Create a new project
3. Go to "Settings > API" to get your keys

**Add to .env:**
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 5: Set Application URL

```env
VITE_APP_URL=http://localhost:5173
```

For production, change to your actual domain.

## 🔧 Update Stripe Price IDs

After creating Stripe products, update the price IDs in the code:

**Edit `src/services/stripe.ts`:**

```typescript
export const creditPackages: CreditPackage[] = [
  {
    id: 'starter',
    credits: 50,
    price: 4.99,
    popular: false,
    priceId: 'price_1234567890abcdef', // ← Replace with actual Price ID
    description: 'Perfect for trying out the service'
  },
  // ... update all packages
];
```

## 🧪 Testing Your Setup

### 1. Test Environment Loading

Create a test file `test-env.js`:

```javascript
// test-env.js
console.log('Environment check:');
console.log('Stability AI:', process.env.VITE_STABILITY_API_KEY ? '✅ Set' : '❌ Missing');
console.log('Stripe Publishable:', process.env.VITE_STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing');
console.log('Supabase URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
```

Run: `node test-env.js`

### 2. Test Stability AI Connection

```bash
curl -X POST "https://api.stability.ai/v2beta/stable-image/upscale" \
  -H "authorization: Bearer YOUR_STABILITY_API_KEY" \
  -H "accept: image/*" \
  -F "image=@test-image.jpg" \
  -F "prompt=high quality"
```

### 3. Test Stripe Connection

```bash
curl https://api.stripe.com/v1/products \
  -u YOUR_STRIPE_SECRET_KEY: \
  -d name="Test Product"
```

## 🚀 Deployment Environment Variables

### Vercel
1. Go to your project dashboard
2. Settings → Environment Variables
3. Add all variables from your .env file

### Netlify
1. Site settings → Environment variables
2. Add each key-value pair

### Custom Server
Use your hosting provider's environment variable system.

## ⚠️ Security Best Practices

### ✅ DO:
- Keep .env files out of version control
- Use different keys for development and production
- Rotate API keys regularly
- Use environment-specific configurations
- Validate environment variables on startup

### ❌ DON'T:
- Commit .env files to Git
- Share API keys in messages/emails
- Use production keys in development
- Hard-code API keys in source code
- Log API keys in console/files

## 🔄 Key Rotation Process

When you need to update API keys:

1. Generate new keys in respective dashboards
2. Update .env file with new keys
3. Restart your application
4. Revoke old keys once confirmed working
5. Update deployed environments

## 🆘 Troubleshooting

### Common Issues:

**"API key not found"**
- Check .env file exists and has correct format
- Verify no extra spaces around the equals sign
- Ensure the file is in the project root

**"CORS errors"**
- Check API URLs are correct
- Verify environment variables are loaded
- Ensure proper headers are set

**"Stripe webhook verification failed"**
- Check webhook secret matches Stripe dashboard
- Verify endpoint URL is publicly accessible
- Test with Stripe CLI for local development

### Debug Commands:

```bash
# Check if .env is being loaded
npm run dev -- --debug

# Test API connections individually
curl -H "Authorization: Bearer $VITE_STABILITY_API_KEY" https://api.stability.ai/v1/engines/list
```

## 📞 Support Resources

- **Stability AI**: https://platform.stability.ai/docs
- **Stripe**: https://stripe.com/docs
- **Supabase**: https://supabase.com/docs

Remember: Never share your actual API keys publicly!