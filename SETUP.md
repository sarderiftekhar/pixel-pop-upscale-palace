# PixelBoost - AI Image Upscaler Setup Guide

This is a complete image upscaling application with Stability AI integration and Stripe payments. Follow this guide to set up and deploy your own instance.

## 🚀 Features

- **AI-Powered Image Upscaling**: Uses Stability AI for high-quality image enhancement (2x, 4x, 8x)
- **Credit System**: Pay-per-use model with Stripe integration
- **User Authentication**: Secure login with Supabase Auth
- **Real-time Processing**: Progress tracking and error handling
- **Responsive Design**: Works on desktop and mobile
- **Transaction History**: Complete payment and usage tracking

## 📋 Prerequisites

Before setting up, you'll need accounts with:

1. **Stability AI** - for image upscaling API
2. **Stripe** - for payment processing
3. **Supabase** - for database and authentication

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd pixel-pop-upscale-palace-main
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your API keys:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stability AI Configuration
VITE_STABILITY_API_KEY=your_stability_ai_api_key
STABILITY_API_KEY=your_stability_ai_api_key_for_server

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Application Configuration
VITE_APP_URL=http://localhost:5173
```

### 3. Stability AI Setup

1. **Get API Key**:
   - Visit [Stability AI Platform](https://platform.stability.ai/)
   - Create an account and get your API key
   - Add credits to your account for image processing

2. **Test API Connection**:
   ```bash
   curl -X POST "https://api.stability.ai/v2beta/stable-image/upscale" \
   -H "authorization: Bearer YOUR_API_KEY" \
   -H "accept: image/*" \
   -F "image=@path/to/your/image.jpg" \
   -F "prompt=high quality, detailed, sharp"
   ```

### 4. Stripe Setup

1. **Create Stripe Account**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/)
   - Get your publishable and secret keys

2. **Create Products and Prices**:
   ```bash
   # Create products for each credit package
   curl https://api.stripe.com/v1/products \
   -u sk_test_...: \
   -d name="50 Credits" \
   -d description="Starter pack - 50 image upscaling credits"

   # Create price for the product
   curl https://api.stripe.com/v1/prices \
   -u sk_test_...: \
   -d product=prod_... \
   -d unit_amount=499 \
   -d currency=usd
   ```

3. **Update Price IDs**:
   - Update `src/services/stripe.ts` with your actual Stripe Price IDs
   - Replace the placeholder `price_1234567890abcdef` values

4. **Configure Webhooks**:
   - In Stripe Dashboard, go to Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`

### 5. Supabase Setup

1. **Create Project**:
   - Go to [Supabase](https://supabase.com/)
   - Create a new project
   - Get your project URL and anon key

2. **Database Setup**:
   - The migration file is already created in `supabase/migrations/`
   - Run migrations: `supabase db push`

3. **Configure Auth**:
   - Enable email authentication in Supabase Auth settings
   - Set up email templates (optional)

### 6. Deploy API Routes

The application includes API routes that need to be deployed. Choose one option:

#### Option A: Vercel (Recommended)

1. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Configure Environment Variables**:
   - In Vercel dashboard, add all environment variables
   - Redeploy if needed

#### Option B: Netlify Functions

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Create `netlify.toml`**:
   ```toml
   [build]
     functions = "api"
     publish = "dist"
   
   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200
   ```

#### Option C: Custom Server

1. **Create Express Server**:
   - Set up Express.js server
   - Import and use the API route functions
   - Deploy to your preferred hosting service

### 7. Configure CORS (if using custom domain)

Update the API routes to allow requests from your domain:

```typescript
// In each API route file
res.setHeader('Access-Control-Allow-Origin', 'https://your-domain.com');
```

## 🧪 Testing

### 1. Test Stability AI Integration

1. Start development server: `npm run dev`
2. Upload a test image
3. Try upscaling with different factors
4. Check browser network tab for API calls

### 2. Test Stripe Payments

1. Use Stripe test mode
2. Use test card numbers (4242 4242 4242 4242)
3. Complete a test purchase
4. Verify credits are added to user account
5. Check Stripe dashboard for payment records

### 3. Test Webhooks

1. Use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
2. Trigger test webhook events
3. Verify credit updates in database

## 🚀 Production Deployment

### 1. Security Checklist

- [ ] All API keys are in environment variables
- [ ] Stripe is in live mode with real keys
- [ ] Webhook endpoints are secured
- [ ] CORS is properly configured
- [ ] Database RLS policies are enabled

### 2. Performance Optimization

- [ ] Enable image compression on upload
- [ ] Implement request rate limiting
- [ ] Add CDN for static assets
- [ ] Monitor API usage and costs

### 3. Monitoring Setup

- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor Stability AI usage and costs
- [ ] Track Stripe payment success rates
- [ ] Set up database performance monitoring

## 📝 Important Notes

### Credit Costs

- Current setup uses 1 credit per upscale operation
- You can modify `StabilityAIService.estimateCreditCost()` for dynamic pricing
- Consider image size and scale factor for more accurate pricing

### API Limits

- **Stability AI**: Check your plan limits and rate limits
- **Stripe**: Be aware of API rate limits for high-traffic scenarios
- **Supabase**: Monitor database and auth usage

### Error Handling

- Network failures are handled with retries
- Payment failures redirect to error page
- Processing errors show user-friendly messages
- All errors are logged for debugging

## 🔧 Customization

### Credit Packages

Edit `src/services/stripe.ts` to modify credit packages:

```typescript
export const creditPackages: CreditPackage[] = [
  {
    id: 'starter',
    credits: 50,
    price: 4.99,
    popular: false,
    priceId: 'price_your_stripe_price_id',
    description: 'Perfect for trying out the service'
  },
  // Add more packages...
];
```

### Upscaling Options

Modify `src/components/ImageProcessor.tsx` to add more options:

```typescript
const scaleOptions = [
  { value: 2, label: '2x (Fast)', description: 'Quick enhancement' },
  { value: 4, label: '4x (Quality)', description: 'Balanced quality/speed' },
  { value: 8, label: '8x (Maximum)', description: 'Best quality' },
  // Add custom scales...
];
```

## 🆘 Troubleshooting

### Common Issues

1. **Stability AI API Errors**:
   - Check API key validity
   - Verify account credits
   - Ensure image format is supported

2. **Stripe Payment Failures**:
   - Verify webhook endpoint is accessible
   - Check webhook secret matches
   - Ensure price IDs are correct

3. **Supabase Connection Issues**:
   - Verify project URL and keys
   - Check RLS policies
   - Ensure database is accessible

### Debug Mode

Set `VITE_DEBUG=true` in your environment for additional logging.

## 📞 Support

For issues and questions:
- Check the error logs in browser console
- Verify all API keys are correct
- Test individual services separately
- Contact respective service support for API issues

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.