-- Fixed Lecture System Database Setup
-- This script handles existing table structure issues

-- 1. Create lectures table
CREATE TABLE IF NOT EXISTS lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code TEXT NOT NULL,
    lecture_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_code, lecture_number)
);

-- 2. Create handouts table
CREATE TABLE IF NOT EXISTS handouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    uploaded_by UUID REFERENCES auth.users(id),
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Handle existing lecture_videos table
-- First check what columns exist and fix the structure
DO $$
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lecture_videos'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Check if lecture_id column exists
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'lecture_videos' 
            AND column_name = 'lecture_id'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            -- Drop and recreate the table if it doesn't have the right structure
            RAISE NOTICE 'Dropping existing lecture_videos table due to schema mismatch';
            DROP TABLE lecture_videos CASCADE;
        END IF;
    END IF;
    
    -- Create the table with correct schema (will only create if doesn't exist)
    CREATE TABLE IF NOT EXISTS lecture_videos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        video_url TEXT,
        duration INTEGER, -- in seconds
        is_available BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'lecture_videos table created successfully with lecture_id column';
END $$;

-- 4. Create handout_likes table for the like system
CREATE TABLE IF NOT EXISTS handout_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handout_id UUID REFERENCES handouts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(handout_id, user_id)
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lectures_course_code ON lectures(course_code);
CREATE INDEX IF NOT EXISTS idx_lectures_lecture_number ON lectures(lecture_number);
CREATE INDEX IF NOT EXISTS idx_handouts_lecture_id ON handouts(lecture_id);
CREATE INDEX IF NOT EXISTS idx_handouts_approved ON handouts(is_approved);
CREATE INDEX IF NOT EXISTS idx_lecture_videos_lecture_id ON lecture_videos(lecture_id);
CREATE INDEX IF NOT EXISTS idx_handout_likes_handout_id ON handout_likes(handout_id);
CREATE INDEX IF NOT EXISTS idx_handout_likes_user_id ON handout_likes(user_id);

-- 6. Create a view for handouts with like counts
CREATE OR REPLACE VIEW handouts_with_likes AS
SELECT 
    h.*,
    COALESCE(l.like_count, 0) as like_count
FROM handouts h
LEFT JOIN (
    SELECT 
        handout_id,
        COUNT(*) as like_count
    FROM handout_likes
    GROUP BY handout_id
) l ON h.id = l.handout_id;

-- 7. Insert sample lectures for CS201 (45 lectures)
INSERT INTO lectures (course_code, lecture_number, title, description) VALUES
('CS201', 1, 'Introduction to Data Structures', 'Overview of data structures and their importance'),
('CS201', 2, 'Arrays and Strings', 'Understanding arrays and string manipulation'),
('CS201', 3, 'Linked Lists - Part 1', 'Introduction to linked lists and basic operations'),
('CS201', 4, 'Linked Lists - Part 2', 'Advanced linked list operations and variations'),
('CS201', 5, 'Stacks', 'Stack data structure and its applications'),
('CS201', 6, 'Queues', 'Queue data structure and implementation'),
('CS201', 7, 'Trees - Introduction', 'Basic concepts of tree data structures'),
('CS201', 8, 'Binary Trees', 'Binary tree implementation and traversal'),
('CS201', 9, 'Binary Search Trees', 'BST operations and properties'),
('CS201', 10, 'Tree Traversals', 'Different methods of tree traversal'),
('CS201', 11, 'Heap Data Structure', 'Min heap and max heap implementation'),
('CS201', 12, 'Priority Queues', 'Priority queue using heaps'),
('CS201', 13, 'Hashing - Introduction', 'Hash tables and hash functions'),
('CS201', 14, 'Collision Resolution', 'Handling collisions in hash tables'),
('CS201', 15, 'Graphs - Introduction', 'Graph representation and basic concepts'),
('CS201', 16, 'Graph Traversal - DFS', 'Depth-first search algorithm'),
('CS201', 17, 'Graph Traversal - BFS', 'Breadth-first search algorithm'),
('CS201', 18, 'Shortest Path Algorithms', 'Dijkstra and Floyd-Warshall algorithms'),
('CS201', 19, 'Minimum Spanning Tree', 'Kruskal and Prim algorithms'),
('CS201', 20, 'Sorting Algorithms - Part 1', 'Bubble sort, selection sort, insertion sort'),
('CS201', 21, 'Sorting Algorithms - Part 2', 'Merge sort and quick sort'),
('CS201', 22, 'Sorting Algorithms - Part 3', 'Heap sort and radix sort'),
('CS201', 23, 'Searching Algorithms', 'Linear and binary search techniques'),
('CS201', 24, 'Dynamic Programming - Introduction', 'Basic concepts of dynamic programming'),
('CS201', 25, 'Dynamic Programming - Examples', 'Fibonacci, knapsack problem'),
('CS201', 26, 'Greedy Algorithms', 'Greedy approach and examples'),
('CS201', 27, 'Divide and Conquer', 'Divide and conquer strategy'),
('CS201', 28, 'Backtracking', 'Backtracking algorithm and applications'),
('CS201', 29, 'String Algorithms', 'Pattern matching and string processing'),
('CS201', 30, 'Advanced Tree Structures', 'AVL trees and red-black trees'),
('CS201', 31, 'B-Trees', 'B-tree structure and operations'),
('CS201', 32, 'Trie Data Structure', 'Trie implementation and applications'),
('CS201', 33, 'Segment Trees', 'Segment tree for range queries'),
('CS201', 34, 'Fenwick Tree', 'Binary indexed tree implementation'),
('CS201', 35, 'Disjoint Set Union', 'Union-find data structure'),
('CS201', 36, 'Advanced Graph Algorithms', 'Topological sorting and strongly connected components'),
('CS201', 37, 'Network Flow', 'Maximum flow algorithms'),
('CS201', 38, 'Computational Geometry', 'Basic geometric algorithms'),
('CS201', 39, 'Advanced Sorting', 'External sorting and parallel sorting'),
('CS201', 40, 'Memory Management', 'Memory allocation and garbage collection'),
('CS201', 41, 'Cache-Friendly Algorithms', 'Optimizing for cache performance'),
('CS201', 42, 'Parallel Data Structures', 'Concurrent data structures'),
('CS201', 43, 'Advanced Hashing', 'Consistent hashing and bloom filters'),
('CS201', 44, 'Algorithm Analysis', 'Time and space complexity analysis'),
('CS201', 45, 'Course Review and Final Concepts', 'Summary and advanced topics')
ON CONFLICT (course_code, lecture_number) DO NOTHING;

-- 8. Insert sample videos (only after ensuring tables are properly set up)
-- Check if lectures exist first, then insert videos
DO $$
BEGIN
    -- Only insert videos if we have lectures
    IF EXISTS (SELECT 1 FROM lectures WHERE course_code = 'CS201') THEN
        INSERT INTO lecture_videos (lecture_id, title, is_available) 
        SELECT 
            l.id,
            'Video: ' || l.title,
            CASE 
                WHEN l.lecture_number <= 10 THEN true
                ELSE false
            END
        FROM lectures l 
        WHERE l.course_code = 'CS201'
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Sample videos inserted successfully';
    ELSE
        RAISE NOTICE 'No lectures found, skipping video insertion';
    END IF;
END $$;

-- 9. Disable RLS for now (enable later for security)
ALTER TABLE lectures DISABLE ROW LEVEL SECURITY;
ALTER TABLE handouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE handout_likes DISABLE ROW LEVEL SECURITY;

-- 10. Create function to get lecture count for a course
CREATE OR REPLACE FUNCTION get_lecture_count(course_code_param TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM lectures WHERE course_code = course_code_param);
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to toggle handout like
CREATE OR REPLACE FUNCTION toggle_handout_like(handout_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    like_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM handout_likes 
        WHERE handout_id = handout_id_param AND user_id = user_id_param
    ) INTO like_exists;
    
    IF like_exists THEN
        DELETE FROM handout_likes 
        WHERE handout_id = handout_id_param AND user_id = user_id_param;
        RETURN false;
    ELSE
        INSERT INTO handout_likes (handout_id, user_id) 
        VALUES (handout_id_param, user_id_param);
        RETURN true;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 12. Verify setup
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Tables created: lectures, handouts, lecture_videos, handout_likes';
    RAISE NOTICE 'Sample data inserted for CS201 course';
END $$;
