const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');
const env = {};

envLines.forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, ...valueParts] = trimmedLine.split('=');
    if (key && valueParts.length > 0) {
      env[key] = valueParts.join('=');
    }
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  try {
    console.log('\n--- Testing Supabase Connection ---');
    
    console.log('1. Testing connection directly with announcements table...');
    
    const { data: announcements, error: announcementError } = await supabase
      .from('announcements')
      .select('*')
      .limit(1);
    
    if (announcementError) {
      console.error('Announcements Error:', announcementError);
      
      if (announcementError.code === '42P01') {
        console.log('❌ Announcements table does not exist');
        return { tableExists: false };
      } else {
        console.log('❌ Other error with announcements table');
        return { tableExists: true, error: announcementError };
      }
    }
    
    console.log('✓ Announcements table exists');
    console.log('Number of announcements found:', announcements?.length || 0);
    
    if (announcements && announcements.length > 0) {
      console.log('Sample announcement:', announcements[0]);
    }
    
    return { tableExists: true, announcements };
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error };
  }
}

// Run the test
testSupabaseConnection()
  .then((result) => {
    console.log('\n--- Test Complete ---');
    if (result?.tableExists === false) {
      console.log('SOLUTION: You need to create the announcements table in your Supabase database');
    }
  })
  .catch(console.error);
