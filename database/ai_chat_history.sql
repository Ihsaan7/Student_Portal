-- AI Chat History Table
-- This table stores conversation history between users and the AI assistant

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
-- Users can only see their own chat history
CREATE POLICY "Users can view own chat history" ON ai_chat_history
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own chat messages
CREATE POLICY "Users can insert own chat messages" ON ai_chat_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own chat messages (for editing)
CREATE POLICY "Users can update own chat messages" ON ai_chat_history
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own chat messages
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
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_chat_history_updated_at();

-- Add comments for documentation
COMMENT ON TABLE ai_chat_history IS 'Stores conversation history between users and AI assistant';
COMMENT ON COLUMN ai_chat_history.user_id IS 'Reference to the user who sent/received the message';
COMMENT ON COLUMN ai_chat_history.message IS 'The actual message content';
COMMENT ON COLUMN ai_chat_history.sender IS 'Who sent the message: user or ai';
COMMENT ON COLUMN ai_chat_history.file_info IS 'JSON metadata about uploaded files (name, size, type, etc.)';
COMMENT ON COLUMN ai_chat_history.created_at IS 'When the message was created';
COMMENT ON COLUMN ai_chat_history.updated_at IS 'When the message was last updated';