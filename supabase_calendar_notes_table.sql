-- Create calendar_notes table for storing user notes/reminders
CREATE TABLE IF NOT EXISTS calendar_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_notes_user_date ON calendar_notes(user_id, date);

-- Enable Row Level Security (RLS)
ALTER TABLE calendar_notes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own notes
CREATE POLICY "Users can view their own calendar notes" ON calendar_notes
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own notes
CREATE POLICY "Users can insert their own calendar notes" ON calendar_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own notes
CREATE POLICY "Users can update their own calendar notes" ON calendar_notes
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own notes
CREATE POLICY "Users can delete their own calendar notes" ON calendar_notes
    FOR DELETE USING (auth.uid() = user_id); 