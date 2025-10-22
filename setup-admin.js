#!/usr/bin/env node

/**
 * Admin Setup Script for StudentNest
 * 
 * This script helps set up the admin panel by:
 * 1. Checking if required files exist
 * 2. Providing SQL commands to run
 * 3. Helping create the first admin user
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function printHeader() {
  console.log('\n' + '='.repeat(60));
  console.log('           StudentNest ADMIN PANEL SETUP');
  console.log('='.repeat(60) + '\n');
}

function printSection(title) {
  console.log('\n' + '-'.repeat(40));
  console.log(title);
  console.log('-'.repeat(40));
}

function checkRequiredFiles() {
  printSection('CHECKING REQUIRED FILES');
  
  const requiredFiles = [
    'admin-setup.sql',
    'lib/adminAuth.js',
    'components/AdminMiddleware.js',
    'app/admin/page.js',
    'app/admin/users/page.js',
    'app/admin/support/page.js',
    'app/admin/courses/page.js',
    'app/admin/settings/page.js'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    const exists = checkFileExists(file);
    console.log(`${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
  });
  
  if (allFilesExist) {
    console.log('\n✅ All required files are present!');
  } else {
    console.log('\n❌ Some required files are missing. Please ensure all admin files are created.');
    return false;
  }
  
  return true;
}

function showDatabaseSetup() {
  printSection('DATABASE SETUP');
  
  console.log('You need to run the SQL commands to set up admin tables.');
  console.log('\nOptions:');
  console.log('1. Copy admin-setup.sql content to Supabase SQL Editor');
  console.log('2. Use psql command line (if available)');
  console.log('3. Run commands manually\n');
  
  const sqlContent = readFile('admin-setup.sql');
  if (sqlContent) {
    console.log('📄 admin-setup.sql content preview:');
    console.log('-'.repeat(50));
    console.log(sqlContent.substring(0, 500) + '...');
    console.log('-'.repeat(50));
    console.log('\n💡 Copy the full content of admin-setup.sql to your Supabase SQL Editor');
  } else {
    console.log('❌ Could not read admin-setup.sql file');
  }
}

function showAdminUserSetup() {
  printSection('ADMIN USER SETUP');
  
  console.log('To create your first admin user, you have several options:\n');
  
  console.log('🔹 Option 1: Update existing user (Recommended)');
  console.log('   1. Log into Supabase Dashboard');
  console.log('   2. Go to Authentication → Users');
  console.log('   3. Find your user and copy the User ID');
  console.log('   4. Run this SQL in Supabase SQL Editor:');
  console.log('   ');
  console.log('   UPDATE users SET role = \'super_admin\' WHERE id = \'YOUR_USER_ID\';');
  console.log('');
  
  console.log('🔹 Option 2: Create new admin during signup');
  console.log('   1. Create a new account through normal signup');
  console.log('   2. Update the role using the SQL command above');
  console.log('');
  
  console.log('🔹 Option 3: Direct database insert');
  console.log('   Run this SQL (replace with your details):');
  console.log('   ');
  console.log(`   INSERT INTO users (id, email, name, role, created_at)`);
  console.log(`   VALUES (`);
  console.log(`     gen_random_uuid(),`);
  console.log(`     'admin@yourdomain.com',`);
  console.log(`     'System Administrator',`);
  console.log(`     'super_admin',`);
  console.log(`     NOW()`);
  console.log(`   );`);
  console.log('');
}

function showTestingInstructions() {
  printSection('TESTING ADMIN ACCESS');
  
  console.log('After setting up the database and admin user:');
  console.log('');
  console.log('1. Start your development server:');
  console.log('   npm run dev');
  console.log('');
  console.log('2. Go to http://localhost:3000/login');
  console.log('');
  console.log('3. Log in with your admin account');
  console.log('');
  console.log('4. You should be redirected to /admin (not /home)');
  console.log('');
  console.log('5. Test admin features:');
  console.log('   ✓ Dashboard overview');
  console.log('   ✓ User management');
  console.log('   ✓ Support queries');
  console.log('   ✓ Course management');
  console.log('   ✓ System settings (super admin only)');
  console.log('');
}

function showRoleExplanation() {
  printSection('ADMIN ROLES EXPLAINED');
  
  console.log('👤 STUDENT (default)');
  console.log('   - Regular user access');
  console.log('   - Can access courses and support');
  console.log('');
  
  console.log('👨‍💼 ADMIN');
  console.log('   - Access to admin panel');
  console.log('   - Can manage users (except super admins)');
  console.log('   - Can handle support queries');
  console.log('   - Can view courses and enrollments');
  console.log('');
  
  console.log('👑 SUPER_ADMIN');
  console.log('   - All admin permissions');
  console.log('   - Can manage other admins');
  console.log('   - Can access system settings');
  console.log('   - Can view admin logs');
  console.log('   - Can delete users');
  console.log('');
}

function showTroubleshooting() {
  printSection('TROUBLESHOOTING');
  
  console.log('❌ "Access Denied" Error:');
  console.log('   - Check user role in database');
  console.log('   - Verify RLS policies are set up');
  console.log('   - Clear browser cache');
  console.log('');
  
  console.log('❌ Admin Panel Not Loading:');
  console.log('   - Check browser console for errors');
  console.log('   - Verify all admin files exist');
  console.log('   - Check network connectivity');
  console.log('');
  
  console.log('❌ Database Errors:');
  console.log('   - Ensure SQL commands ran successfully');
  console.log('   - Check Supabase logs');
  console.log('   - Verify table permissions');
  console.log('');
}

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function interactiveSetup() {
  printHeader();
  
  console.log('This script will guide you through setting up the admin panel.');
  console.log('Make sure you have:');
  console.log('✓ Supabase project set up');
  console.log('✓ Main database tables created');
  console.log('✓ Access to Supabase dashboard\n');
  
  const proceed = await askQuestion('Ready to proceed? (y/n): ');
  if (proceed !== 'y' && proceed !== 'yes') {
    console.log('Setup cancelled.');
    rl.close();
    return;
  }
  
  // Check files
  const filesOk = checkRequiredFiles();
  if (!filesOk) {
    console.log('\nPlease ensure all admin files are created before proceeding.');
    rl.close();
    return;
  }
  
  // Show database setup
  showDatabaseSetup();
  const dbDone = await askQuestion('\nHave you run the database setup SQL? (y/n): ');
  
  if (dbDone !== 'y' && dbDone !== 'yes') {
    console.log('\nPlease run the database setup first, then run this script again.');
    rl.close();
    return;
  }
  
  // Show admin user setup
  showAdminUserSetup();
  const userDone = await askQuestion('\nHave you created your admin user? (y/n): ');
  
  if (userDone !== 'y' && userDone !== 'yes') {
    console.log('\nPlease create your admin user first, then run this script again.');
    rl.close();
    return;
  }
  
  // Show testing instructions
  showTestingInstructions();
  
  // Show additional info
  const showMore = await askQuestion('\nWould you like to see role explanations and troubleshooting? (y/n): ');
  if (showMore === 'y' || showMore === 'yes') {
    showRoleExplanation();
    showTroubleshooting();
  }
  
  console.log('\n🎉 Admin panel setup guide complete!');
  console.log('\nFor detailed instructions, see ADMIN_SETUP_GUIDE.md');
  console.log('\nGood luck with your admin panel! 🚀\n');
  
  rl.close();
}

// Run the interactive setup
if (require.main === module) {
  interactiveSetup().catch(console.error);
}

module.exports = {
  checkRequiredFiles,
  showDatabaseSetup,
  showAdminUserSetup,
  showTestingInstructions
};