#!/usr/bin/env node

/**
 * Stripe Products Setup Script
 * Creates credit packages as products in Stripe and returns price IDs
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
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#') && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const STRIPE_SECRET_KEY = envVars.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  log('❌ STRIPE_SECRET_KEY not found in .env file', 'red');
  process.exit(1);
}

// Credit packages to create
const packages = [
  {
    id: 'starter',
    name: '50 Credits',
    description: 'Perfect for trying out the service',
    credits: 50,
    price: 4.99,
    popular: false
  },
  {
    id: 'popular',
    name: '100 Credits',
    description: 'Most popular choice',
    credits: 100,
    price: 8.99,
    popular: true
  },
  {
    id: 'pro',
    name: '250 Credits',
    description: 'For power users',
    credits: 250,
    price: 19.99,
    popular: false
  },
  {
    id: 'enterprise',
    name: '500 Credits',
    description: 'Maximum value pack',
    credits: 500,
    price: 34.99,
    popular: false
  }
];

async function createStripeProduct(pkg) {
  try {
    // Create product
    const productResponse = await fetch('https://api.stripe.com/v1/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        name: pkg.name,
        description: `${pkg.description} - ${pkg.credits} image upscaling credits`,
        'metadata[credits]': pkg.credits.toString(),
        'metadata[packageId]': pkg.id
      })
    });

    if (!productResponse.ok) {
      const error = await productResponse.text();
      throw new Error(`Product creation failed: ${error}`);
    }

    const product = await productResponse.json();
    log(`✅ Created product: ${pkg.name} (${product.id})`, 'green');

    // Create price
    const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        product: product.id,
        unit_amount: Math.round(pkg.price * 100).toString(), // Convert to cents
        currency: 'usd',
        'metadata[credits]': pkg.credits.toString(),
        'metadata[packageId]': pkg.id
      })
    });

    if (!priceResponse.ok) {
      const error = await priceResponse.text();
      throw new Error(`Price creation failed: ${error}`);
    }

    const price = await priceResponse.json();
    log(`✅ Created price: $${pkg.price} (${price.id})`, 'green');

    return {
      ...pkg,
      productId: product.id,
      priceId: price.id
    };

  } catch (error) {
    log(`❌ Failed to create ${pkg.name}: ${error.message}`, 'red');
    return null;
  }
}

async function updateServiceFile(createdPackages) {
  const serviceFilePath = path.join(__dirname, '..', 'src', 'services', 'stripe.ts');
  
  try {
    let content = fs.readFileSync(serviceFilePath, 'utf8');
    
    // Generate new creditPackages array
    const newPackages = createdPackages.map(pkg => `  {
    id: '${pkg.id}',
    credits: ${pkg.credits},
    price: ${pkg.price},
    popular: ${pkg.popular},
    priceId: '${pkg.priceId}',
    description: '${pkg.description}'
  }`).join(',\n');

    // Replace the creditPackages array
    const packageRegex = /export const creditPackages: CreditPackage\[\] = \[[\s\S]*?\];/;
    const newArray = `export const creditPackages: CreditPackage[] = [
${newPackages}
];`;

    content = content.replace(packageRegex, newArray);
    
    fs.writeFileSync(serviceFilePath, content);
    log('✅ Updated src/services/stripe.ts with new price IDs', 'green');
    
  } catch (error) {
    log(`❌ Failed to update service file: ${error.message}`, 'red');
    log('You\'ll need to manually update the price IDs in src/services/stripe.ts', 'yellow');
  }
}

async function main() {
  header('💳 STRIPE PRODUCTS SETUP');
  
  log('Creating credit packages in Stripe...', 'yellow');
  log('This will create products and prices for your image upscaler.\n');

  const createdPackages = [];
  
  for (const pkg of packages) {
    log(`Creating ${pkg.name}...`, 'blue');
    const result = await createStripeProduct(pkg);
    if (result) {
      createdPackages.push(result);
    }
    console.log(''); // spacing
  }

  if (createdPackages.length === 0) {
    log('❌ No products were created successfully', 'red');
    process.exit(1);
  }

  header('📋 CREATED PRODUCTS');
  
  log('Successfully created the following products in Stripe:\n', 'green');
  
  createdPackages.forEach(pkg => {
    log(`${pkg.name}:`, 'bold');
    log(`  Product ID: ${pkg.productId}`, 'blue');
    log(`  Price ID: ${pkg.priceId}`, 'blue');
    log(`  Amount: $${pkg.price} (${pkg.credits} credits)`, 'blue');
    console.log('');
  });

  // Update service file
  await updateServiceFile(createdPackages);

  header('🎉 SETUP COMPLETE');
  
  log('Your Stripe products are now configured!', 'green');
  log('\nNext steps:', 'yellow');
  log('1. Verify the products in your Stripe Dashboard');
  log('2. Set up webhooks for payment processing');
  log('3. Test the payment flow with test cards');
  log('4. Run "npm run dev" to start your application\n');

  log('Price IDs have been automatically updated in your code.', 'blue');
  log('Your app is now ready for payment processing!', 'green');
}

main().catch(error => {
  log('❌ Setup failed: ' + error.message, 'red');
  process.exit(1);
});