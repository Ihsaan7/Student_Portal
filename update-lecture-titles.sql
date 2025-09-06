-- Update lecture titles to simple format (Lecture 1, Lecture 2, etc.)
-- This will change titles from "Introduction to Data Structures" to just "Lecture 1"

UPDATE lectures 
SET title = 'Lecture ' || lecture_number
WHERE course_code = 'CS201';

-- Verify the changes
SELECT lecture_number, title, description 
FROM lectures 
WHERE course_code = 'CS201' 
ORDER BY lecture_number 
LIMIT 10;
