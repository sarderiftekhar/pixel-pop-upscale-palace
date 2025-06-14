#!/usr/bin/env node

/**
 * Environment Configuration Checker
 * Validates that all required environment variables are properly set
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');

if (!fs.existsSync(envPath)) {
  log('❌ .env file not found!', 'red');
  log('Please copy .env.example to .env and configure your API keys.', 'yellow');
  process.exit(1);
}

// Simple env loader since we're in ES module
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#') && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

// Set process.env for compatibility
Object.assign(process.env, envVars);

header('🔍 ENVIRONMENT CONFIGURATION CHECK');

const checks = [
  {
    name: '🎨 Stability AI API Key',
    key: 'VITE_STABILITY_API_KEY',
    required: true,
    validate: (value) => value && value.startsWith('sk-') && value.length > 10,
    message: 'Should start with "sk-" and be a valid API key'
  },
  {
    name: '🎨 Stability AI Server Key',
    key: 'STABILITY_API_KEY',
    required: true,
    validate: (value) => value && value.startsWith('sk-') && value.length > 10,
    message: 'Should start with "sk-" and be a valid API key'
  },
  {
    name: '💳 Stripe Publishable Key',
    key: 'VITE_STRIPE_PUBLISHABLE_KEY',
    required: true,
    validate: (value) => value && (value.startsWith('pk_test_') || value.startsWith('pk_live_')),
    message: 'Should start with "pk_test_" or "pk_live_"'
  },
  {
    name: '💳 Stripe Secret Key',
    key: 'STRIPE_SECRET_KEY',
    required: true,
    validate: (value) => value && (value.startsWith('sk_test_') || value.startsWith('sk_live_')),
    message: 'Should start with "sk_test_" or "sk_live_"'
  },
  {
    name: '💳 Stripe Webhook Secret',
    key: 'STRIPE_WEBHOOK_SECRET',
    required: false,
    validate: (value) => !value || value.startsWith('whsec_'),
    message: 'Should start with "whsec_" (optional for development)'
  },
  {
    name: '🗄️ Supabase URL',
    key: 'VITE_SUPABASE_URL',
    required: true,
    validate: (value) => value && value.includes('supabase.co'),
    message: 'Should be a valid Supabase URL'
  },
  {
    name: '🗄️ Supabase Anon Key',
    key: 'VITE_SUPABASE_ANON_KEY',
    required: true,
    validate: (value) => value && value.startsWith('eyJ'),
    message: 'Should be a valid JWT token starting with "eyJ"'
  },
  {
    name: '🌐 Application URL',
    key: 'VITE_APP_URL',
    required: true,
    validate: (value) => value && (value.startsWith('http://') || value.startsWith('https://')),
    message: 'Should be a valid URL starting with http:// or https://'
  }
];

let allValid = true;
let warnings = 0;

for (const check of checks) {
  const value = process.env[check.key];
  const hasValue = value && value !== `your_${check.key.toLowerCase()}_here` && !value.includes('your_') && value !== '';
  
  if (check.required && !hasValue) {
    log(`❌ ${check.name}: Missing or not configured`, 'red');
    log(`   Set ${check.key} in your .env file`, 'yellow');
    log(`   ${check.message}`, 'blue');
    allValid = false;
  } else if (hasValue && !check.validate(value)) {
    log(`⚠️  ${check.name}: Invalid format`, 'yellow');
    log(`   ${check.message}`, 'blue');
    warnings++;
  } else if (hasValue) {
    log(`✅ ${check.name}: Configured`, 'green');
  } else {
    log(`➖ ${check.name}: Optional (not set)`, 'blue');
  }
  
  console.log('');
}

// Additional checks
header('🔧 ADDITIONAL CHECKS');

// Check for test vs production keys
const stripePublishable = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (stripePublishable && stripeSecret) {
  const isTestMode = stripePublishable.startsWith('pk_test_') && stripeSecret.startsWith('sk_test_');
  const isLiveMode = stripePublishable.startsWith('pk_live_') && stripeSecret.startsWith('sk_live_');
  
  if (isTestMode) {
    log('✅ Stripe is in TEST mode - good for development', 'green');
  } else if (isLiveMode) {
    log('⚠️  Stripe is in LIVE mode - make sure this is intentional!', 'yellow');
  } else {
    log('❌ Stripe keys mismatch - test and live keys are mixed', 'red');
    allValid = false;
  }
}

// Check if .env is in .gitignore
const gitignorePath = path.join(__dirname, '..', '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  if (gitignore.includes('.env')) {
    log('✅ .env is properly ignored by Git', 'green');
  } else {
    log('⚠️  .env should be added to .gitignore for security', 'yellow');
    warnings++;
  }
} else {
  log('⚠️  .gitignore file not found', 'yellow');
  warnings++;
}

// Summary
header('📊 SUMMARY');

if (allValid && warnings === 0) {
  log('🎉 All environment variables are properly configured!', 'green');
  log('You can now run "npm run dev" to start your application.', 'blue');
} else if (allValid && warnings > 0) {
  log(`✅ Environment is valid with ${warnings} warning(s).`, 'yellow');
  log('Your app should work, but consider fixing the warnings.', 'blue');
} else {
  log('❌ Environment configuration is incomplete.', 'red');
  log('Please fix the missing/invalid variables before running the app.', 'yellow');
  log('\nTo get help with setup:', 'blue');
  log('1. Read ENV_SETUP.md for detailed instructions');
  log('2. Run "node scripts/setup-apis.js" for interactive setup');
}

console.log('\n');

process.exit(allValid ? 0 : 1);