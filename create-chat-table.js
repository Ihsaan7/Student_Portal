// MANUAL SETUP INSTRUCTIONS FOR SUPABASE
// =====================================
//
// Since the ai_chat_history table doesn't exist, you need to create it manually.
// 
// 1. Go to your Supabase dashboard (https://supabase.com/dashboard)
// 2. Select your project
// 3. Go to the SQL Editor
// 4. Copy and paste the SQL below:

console.log(`
=== SUPABASE TABLE SETUP REQUIRED ===

The ai_chat_history table is missing. Please follow these steps:

1. Go to your Supabase dashboard (https://supabase.com/dashboard)
2. Select your project
3. Go to the SQL Editor
4. Copy and paste the following SQL:

--- START SQL ---
CREATE TABLE ai_chat_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_user BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_ai_chat_history_user_id ON ai_chat_history(user_id);
CREATE INDEX idx_ai_chat_history_created_at ON ai_chat_history(created_at);
CREATE INDEX idx_ai_chat_history_user_created ON ai_chat_history(user_id, created_at);

-- Enable Row Level Security
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own chat history" ON ai_chat_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON ai_chat_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat messages" ON ai_chat_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages" ON ai_chat_history
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_chat_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_ai_chat_history_updated_at
    BEFORE UPDATE ON ai_chat_history
    FOR EACH ROW EXECUTE FUNCTION update_ai_chat_history_updated_at();
--- END SQL ---

5. Click "Run" to execute the SQL
6. The table will be created and the chat history will start working

After creating the table, the AI chat will save conversation history properly.
`);