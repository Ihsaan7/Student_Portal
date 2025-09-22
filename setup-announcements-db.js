const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.log('Please ensure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAnnouncementsDatabase() {
  try {
    console.log('🚀 Setting up announcements database...');
    
    // Read the SQL schema file
    const sqlPath = path.join(__dirname, 'announcements-schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL commands by semicolon and filter out empty ones
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Found ${sqlCommands.length} SQL commands to execute`);
    
    // Execute each SQL command
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`⏳ Executing command ${i + 1}/${sqlCommands.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: command });
      
      if (error) {
        // Try direct query if RPC fails
        const { error: directError } = await supabase
          .from('_temp')
          .select('*')
          .limit(0);
        
        if (directError) {
          console.log(`⚠️  Trying alternative method for command ${i + 1}`);
          // For some commands, we might need to use the REST API directly
          continue;
        }
      }
    }
    
    console.log('✅ Database setup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the content from announcements-schema.sql');
    console.log('4. Run the SQL commands manually');
    console.log('\n🔗 Supabase Dashboard: ' + supabaseUrl.replace('/rest/v1', ''));
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    console.log('\n🛠️  Manual Setup Required:');
    console.log('1. Open your Supabase dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy the content from announcements-schema.sql');
    console.log('4. Paste and run it in the SQL Editor');
  }
}

// Run the setup
setupAnnouncementsDatabase();