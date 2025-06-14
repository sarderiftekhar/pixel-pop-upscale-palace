# 🎨 PixelBoost - AI Image Upscaler

A professional image upscaling application powered by Stability AI with Stripe payment integration.

## ✨ Features

- 🤖 **AI-Powered Upscaling**: Uses Stability AI for high-quality 2x, 4x, and 8x image enhancement
- 💳 **Credit System**: Pay-per-use model with Stripe integration
- 🔐 **User Authentication**: Secure login with Supabase
- 📊 **Real-time Progress**: Live processing updates and error handling
- 📱 **Responsive Design**: Works perfectly on desktop and mobile
- 📈 **Transaction History**: Complete payment and usage tracking

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd pixel-pop-upscale-palace-main
npm install
```

### 2. Environment Setup

The project includes helpful setup scripts:

```bash
# Check your current environment configuration
npm run check-env

# Interactive setup wizard for API keys
npm run setup
```

Or manually edit the `.env` file with your API keys:

```env
# Stability AI (required for upscaling)
VITE_STABILITY_API_KEY=sk-your-stability-api-key
STABILITY_API_KEY=sk-your-stability-api-key

# Stripe (required for payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
STRIPE_SECRET_KEY=sk_test_your-key

# Supabase (required for auth & database)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see your app!

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui components
- **AI**: Stability AI API for image upscaling
- **Payments**: Stripe for credit purchases
- **Backend**: Supabase for auth, database, and real-time features
- **Deployment**: Vercel/Netlify ready

## 📚 Documentation

- **[ENV_SETUP.md](./ENV_SETUP.md)** - Detailed environment setup guide
- **[SETUP.md](./SETUP.md)** - Complete installation and deployment guide

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check-env` - Validate environment configuration
- `npm run setup` - Interactive API setup wizard
- `npm run lint` - Run ESLint

## 🌟 Key Components

### Image Processing
- **ImageUploader**: Drag & drop interface with format validation
- **ImageProcessor**: Real-time upscaling with progress tracking
- **Credit System**: Dynamic cost estimation based on image size

### Payment System
- **CreditsTopup**: Stripe checkout integration
- **Payment Pages**: Success/error handling with webhooks
- **Transaction History**: Complete audit trail

### User Management
- **Authentication**: Email/password with Supabase Auth
- **User Dashboard**: Credits balance and usage statistics
- **Profile Management**: Account settings and preferences

## 🔐 Security Features

- Environment variables for all API keys
- Row Level Security (RLS) on database
- Stripe webhook verification
- Input validation and sanitization
- Secure file upload handling

## 🚀 Deployment

### Quick Deploy (Recommended)

**Vercel:**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy
```

### Manual Deployment

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Set up API routes (see SETUP.md for details)
4. Configure environment variables on your hosting platform

## 📊 API Integration

### Stability AI
- Real-time image upscaling
- Progress tracking with callbacks
- Error handling and retry logic
- Automatic format optimization

### Stripe
- Secure checkout sessions
- Webhook event handling
- Credit package management
- Transaction recording

### Supabase
- User authentication
- Credit balance management
- Usage analytics
- Real-time updates

## 🔍 Monitoring & Analytics

The app includes built-in monitoring for:
- Image processing success rates
- Payment completion rates
- User engagement metrics
- Error tracking and debugging

## 🆘 Support & Troubleshooting

**Common Issues:**

1. **API Key Errors**: Run `npm run check-env` to validate configuration
2. **Payment Issues**: Check Stripe webhook configuration
3. **Upload Failures**: Verify file size limits and formats
4. **Build Errors**: Ensure all environment variables are set

**Get Help:**
- Check the troubleshooting section in SETUP.md
- Review error logs in browser console
- Test individual API connections

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

---

**Built with ❤️ using Stability AI, Stripe, and Supabase**
