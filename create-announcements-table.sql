-- Create announcements table for course admin panel
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'instructors'))
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_course_id ON announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to announcements" ON announcements
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin full access to announcements" ON announcements
  FOR ALL USING (true);

-- Insert sample announcements
INSERT INTO announcements (course_id, title, content, priority, created_by) VALUES
('CS101', 'Welcome to Computer Science 101', 'Welcome to our introductory computer science course. Please review the syllabus and course materials.', 'high', (SELECT id FROM auth.users LIMIT 1)),
('CS101', 'Assignment 1 Released', 'The first programming assignment has been released. Due date is next Friday.', 'normal', (SELECT id FROM auth.users LIMIT 1)),
('MATH201', 'Midterm Exam Schedule', 'The midterm exam is scheduled for next week. Please check the detailed schedule in the course materials.', 'high', (SELECT id FROM auth.users LIMIT 1));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER announcements_updated_at_trigger
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_announcements_updated_at();