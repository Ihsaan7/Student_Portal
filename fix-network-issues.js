#!/usr/bin/env node

/**
 * Quick Fix Script for Network and Configuration Issues
 * Run with: node fix-network-issues.js
 */

const fs = require('fs');
const path = require('path');

class NetworkIssueFixer {
  constructor() {
    this.issues = [];
    this.fixes = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: '🔍',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      fix: '🔧'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  checkEnvironmentFile() {
    this.log('Checking environment configuration...');
    
    const envPath = path.join(process.cwd(), '.env.local');
    
    if (!fs.existsSync(envPath)) {
      this.issues.push('Missing .env.local file');
      this.log('Missing .env.local file', 'error');
      return false;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    const missingVars = requiredVars.filter(varName => {
      const regex = new RegExp(`^${varName}=.+`, 'm');
      return !regex.test(envContent);
    });
    
    if (missingVars.length > 0) {
      this.issues.push(`Missing environment variables: ${missingVars.join(', ')}`);
      this.log(`Missing environment variables: ${missingVars.join(', ')}`, 'error');
      return false;
    }
    
    this.log('Environment configuration is valid', 'success');
    return true;
  }

  checkPackageJson() {
    this.log('Checking package.json dependencies...');
    
    const packagePath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packagePath)) {
      this.issues.push('Missing package.json file');
      this.log('Missing package.json file', 'error');
      return false;
    }
    
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const requiredDeps = {
      '@supabase/supabase-js': 'Supabase client library',
      'next': 'Next.js framework',
      'react': 'React library'
    };
    
    const missingDeps = Object.keys(requiredDeps).filter(dep => {
      return !packageContent.dependencies?.[dep] && !packageContent.devDependencies?.[dep];
    });
    
    if (missingDeps.length > 0) {
      this.issues.push(`Missing dependencies: ${missingDeps.join(', ')}`);
      this.log(`Missing dependencies: ${missingDeps.join(', ')}`, 'error');
      return false;
    }
    
    this.log('Package dependencies are valid', 'success');
    return true;
  }

  checkSupabaseConfig() {
    this.log('Checking Supabase configuration...');
    
    const supabasePath = path.join(process.cwd(), 'lib', 'supabase.js');
    
    if (!fs.existsSync(supabasePath)) {
      this.issues.push('Missing lib/supabase.js configuration file');
      this.log('Missing lib/supabase.js configuration file', 'error');
      return false;
    }
    
    const supabaseContent = fs.readFileSync(supabasePath, 'utf8');
    
    // Check for proper imports and exports
    const hasCreateClient = supabaseContent.includes('createClient');
    const hasExport = supabaseContent.includes('export') && supabaseContent.includes('supabase');
    
    if (!hasCreateClient || !hasExport) {
      this.issues.push('Invalid Supabase configuration in lib/supabase.js');
      this.log('Invalid Supabase configuration in lib/supabase.js', 'error');
      return false;
    }
    
    this.log('Supabase configuration is valid', 'success');
    return true;
  }

  createExampleEnvFile() {
    this.log('Creating example .env.local file...', 'fix');
    
    const exampleEnv = `# Supabase Configuration
# Replace with your actual Supabase project values

NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Instructions:
# 1. Go to your Supabase project dashboard
# 2. Navigate to Settings > API
# 3. Copy the Project URL and paste it as NEXT_PUBLIC_SUPABASE_URL
# 4. Copy the anon/public key and paste it as NEXT_PUBLIC_SUPABASE_ANON_KEY
# 5. Save this file and restart your development server
`;
    
    const envPath = path.join(process.cwd(), '.env.local.example');
    fs.writeFileSync(envPath, exampleEnv);
    
    this.fixes.push('Created .env.local.example file with instructions');
    this.log('Created .env.local.example file', 'success');
  }

  generateNetworkTestScript() {
    this.log('Creating network test script...', 'fix');
    
    const testScript = `// Quick Network Test
// Run this in browser console on your app page

async function quickNetworkTest() {
  console.log('🔍 Starting network diagnostics...');
  
  // Test 1: Browser online status
  console.log('Browser online:', navigator.onLine ? '✅' : '❌');
  
  // Test 2: Basic internet connectivity
  try {
    await fetch('https://www.google.com/favicon.ico', { method: 'HEAD', mode: 'no-cors' });
    console.log('Internet connectivity: ✅');
  } catch (e) {
    console.log('Internet connectivity: ❌', e.message);
  }
  
  // Test 3: Supabase connectivity
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const response = await fetch(supabaseUrl + '/rest/v1/', { method: 'HEAD' });
      console.log('Supabase connectivity:', response.ok ? '✅' : '❌');
    } catch (e) {
      console.log('Supabase connectivity: ❌', e.message);
    }
  } else {
    console.log('Supabase URL not configured: ❌');
  }
  
  // Test 4: Network info
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection) {
    console.log('Connection type:', connection.effectiveType);
    console.log('Download speed:', connection.downlink + ' Mbps');
    console.log('Latency:', connection.rtt + 'ms');
  }
}

quickNetworkTest();
`;
    
    const scriptPath = path.join(process.cwd(), 'network-test.js');
    fs.writeFileSync(scriptPath, testScript);
    
    this.fixes.push('Created network-test.js for browser console testing');
    this.log('Created network-test.js', 'success');
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('🔍 NETWORK ISSUE DIAGNOSIS COMPLETE');
    console.log('='.repeat(50));
    
    if (this.issues.length === 0) {
      this.log('No configuration issues found! ✨', 'success');
      console.log('\nIf you\'re still experiencing "Failed to fetch" errors:');
      console.log('1. Visit /test-connection in your browser');
      console.log('2. Check your internet connection');
      console.log('3. Try refreshing the page');
      console.log('4. Review NETWORK_TROUBLESHOOTING.md');
    } else {
      console.log('\n❌ Issues Found:');
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    if (this.fixes.length > 0) {
      console.log('\n🔧 Fixes Applied:');
      this.fixes.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix}`);
      });
    }
    
    console.log('\n📚 Additional Resources:');
    console.log('   • NETWORK_TROUBLESHOOTING.md - Comprehensive troubleshooting guide');
    console.log('   • /test-connection - Live connectivity testing page');
    console.log('   • network-test.js - Browser console network test');
    console.log('\n' + '='.repeat(50));
  }

  async run() {
    console.log('🚀 VU Clone Network Issue Fixer');
    console.log('='.repeat(50));
    
    // Run all checks
    this.checkEnvironmentFile();
    this.checkPackageJson();
    this.checkSupabaseConfig();
    
    // Apply fixes
    if (this.issues.some(issue => issue.includes('.env.local'))) {
      this.createExampleEnvFile();
    }
    
    this.generateNetworkTestScript();
    
    // Print summary
    this.printSummary();
  }
}

// Run the fixer
if (require.main === module) {
  const fixer = new NetworkIssueFixer();
  fixer.run().catch(console.error);
}

module.exports = NetworkIssueFixer;