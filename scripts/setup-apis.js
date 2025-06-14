#!/usr/bin/env node

/**
 * API Setup and Testing Script
 * This script helps you configure and test your API connections
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '..', '.env');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function header(text) {
  console.log('\n' + colors.bold + colors.blue + '='.repeat(50));
  console.log(' ' + text);
  console.log('='.repeat(50) + colors.reset + '\n');
}

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupStabilityAI() {
  header('🎨 STABILITY AI SETUP');
  
  log('To get your Stability AI API key:', 'yellow');
  log('1. Visit: https://platform.stability.ai/', 'blue');
  log('2. Create an account or sign in');
  log('3. Go to "Account" → "API Keys"');
  log('4. Generate a new API key');
  log('5. Add credits to your account for image processing\n');
  
  const apiKey = await question('Enter your Stability AI API key (starts with sk-): ');
  
  if (!apiKey || !apiKey.startsWith('sk-')) {
    log('❌ Invalid API key format. Should start with "sk-"', 'red');
    return null;
  }
  
  log('✅ Stability AI key looks valid!', 'green');
  return apiKey;
}

async function setupStripe() {
  header('💳 STRIPE SETUP');
  
  log('To get your Stripe keys:', 'yellow');
  log('1. Visit: https://dashboard.stripe.com/', 'blue');
  log('2. Create an account or sign in');
  log('3. Go to "Developers" → "API keys"');
  log('4. Copy your Publishable key and Secret key\n');
  
  log('For testing, use TEST keys (they start with pk_test_ and sk_test_)', 'yellow');
  log('For production, use LIVE keys (they start with pk_live_ and sk_live_)\n');
  
  const publishableKey = await question('Enter your Stripe Publishable key: ');
  const secretKey = await question('Enter your Stripe Secret key: ');
  
  if (!publishableKey || !secretKey) {
    log('❌ Both keys are required', 'red');
    return null;
  }
  
  if (publishableKey.startsWith('pk_test_') && secretKey.startsWith('sk_test_')) {
    log('✅ Test keys detected - good for development!', 'green');
  } else if (publishableKey.startsWith('pk_live_') && secretKey.startsWith('sk_live_')) {
    log('✅ Live keys detected - for production use', 'green');
  } else {
    log('⚠️  Key format might be incorrect', 'yellow');
  }
  
  return { publishableKey, secretKey };
}

async function setupSupabase() {
  header('🗄️ SUPABASE SETUP');
  
  log('To get your Supabase configuration:', 'yellow');
  log('1. Visit: https://supabase.com/', 'blue');
  log('2. Create a new project or select existing');
  log('3. Go to "Settings" → "API"');
  log('4. Copy your Project URL and anon public key\n');
  
  const url = await question('Enter your Supabase Project URL: ');
  const anonKey = await question('Enter your Supabase anon key: ');
  
  if (!url || !anonKey) {
    log('❌ Both URL and anon key are required', 'red');
    return null;
  }
  
  if (url.includes('supabase.co') && anonKey.startsWith('eyJ')) {
    log('✅ Supabase configuration looks valid!', 'green');
  } else {
    log('⚠️  Configuration format might be incorrect', 'yellow');
  }
  
  return { url, anonKey };
}

function updateEnvFile(config) {
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update Stability AI
    if (config.stabilityAI) {
      envContent = envContent.replace(
        /VITE_STABILITY_API_KEY=.*/,
        `VITE_STABILITY_API_KEY=${config.stabilityAI}`
      );
      envContent = envContent.replace(
        /STABILITY_API_KEY=.*/,
        `STABILITY_API_KEY=${config.stabilityAI}`
      );
    }
    
    // Update Stripe
    if (config.stripe) {
      envContent = envContent.replace(
        /VITE_STRIPE_PUBLISHABLE_KEY=.*/,
        `VITE_STRIPE_PUBLISHABLE_KEY=${config.stripe.publishableKey}`
      );
      envContent = envContent.replace(
        /STRIPE_SECRET_KEY=.*/,
        `STRIPE_SECRET_KEY=${config.stripe.secretKey}`
      );
    }
    
    // Update Supabase
    if (config.supabase) {
      envContent = envContent.replace(
        /VITE_SUPABASE_URL=.*/,
        `VITE_SUPABASE_URL=${config.supabase.url}`
      );
      envContent = envContent.replace(
        /VITE_SUPABASE_ANON_KEY=.*/,
        `VITE_SUPABASE_ANON_KEY=${config.supabase.anonKey}`
      );
    }
    
    fs.writeFileSync(envPath, envContent);
    log('✅ Environment file updated successfully!', 'green');
    
  } catch (error) {
    log('❌ Error updating environment file: ' + error.message, 'red');
  }
}

async function testConnections() {
  header('🧪 TESTING API CONNECTIONS');
  
  log('Testing connections with your configured keys...', 'yellow');
  
  // Load environment variables
  require('dotenv').config({ path: envPath });
  
  // Test Stability AI
  log('\n🎨 Testing Stability AI connection...');
  try {
    const response = await fetch('https://api.stability.ai/v1/engines/list', {
      headers: {
        'Authorization': `Bearer ${process.env.VITE_STABILITY_API_KEY}`
      }
    });
    
    if (response.ok) {
      log('✅ Stability AI connection successful!', 'green');
    } else {
      log('❌ Stability AI connection failed: ' + response.status, 'red');
    }
  } catch (error) {
    log('❌ Stability AI test failed: ' + error.message, 'red');
  }
  
  // Test Stripe
  log('\n💳 Testing Stripe connection...');
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const account = await stripe.accounts.retrieve();
    log('✅ Stripe connection successful!', 'green');
    log(`   Account: ${account.email || account.id}`, 'blue');
  } catch (error) {
    log('❌ Stripe test failed: ' + error.message, 'red');
  }
  
  // Test Supabase
  log('\n🗄️ Testing Supabase connection...');
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
    
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (!error) {
      log('✅ Supabase connection successful!', 'green');
    } else {
      log('❌ Supabase test failed: ' + error.message, 'red');
    }
  } catch (error) {
    log('❌ Supabase test failed: ' + error.message, 'red');
  }
}

async function main() {
  header('🚀 IMAGE UPSCALER API SETUP');
  
  log('This script will help you configure your API keys securely.', 'yellow');
  log('Make sure you have accounts with Stability AI, Stripe, and Supabase.\n');
  
  const config = {};
  
  // Setup each service
  log('Would you like to configure each service? (You can skip any you already have set up)\n');
  
  const setupStability = await question('Configure Stability AI? (y/n): ');
  if (setupStability.toLowerCase() === 'y') {
    config.stabilityAI = await setupStabilityAI();
  }
  
  const setupStripeQ = await question('Configure Stripe? (y/n): ');
  if (setupStripeQ.toLowerCase() === 'y') {
    config.stripe = await setupStripe();
  }
  
  const setupSupabaseQ = await question('Configure Supabase? (y/n): ');
  if (setupSupabaseQ.toLowerCase() === 'y') {
    config.supabase = await setupSupabase();
  }
  
  // Update environment file
  if (Object.keys(config).length > 0) {
    header('💾 UPDATING CONFIGURATION');
    updateEnvFile(config);
  }
  
  // Test connections
  const testQ = await question('Would you like to test the API connections? (y/n): ');
  if (testQ.toLowerCase() === 'y') {
    await testConnections();
  }
  
  header('🎉 SETUP COMPLETE!');
  log('Your environment is now configured.', 'green');
  log('\nNext steps:', 'yellow');
  log('1. Run "npm run dev" to start the development server');
  log('2. Upload a test image and try upscaling');
  log('3. Test the payment flow with Stripe test cards');
  log('4. Check the ENV_SETUP.md file for more detailed instructions\n');
  
  rl.close();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log('❌ An error occurred: ' + error.message, 'red');
  process.exit(1);
});

// Run the setup
main().catch(console.error);