-- Simplify lecture titles to just "Lecture 1", "Lecture 2", etc.
-- Remove descriptions to keep it clean and simple

UPDATE lectures 
SET 
    title = 'Lecture ' || lecture_number,
    description = null
WHERE course_code = 'CS201';

-- Verify the changes
SELECT lecture_number, title, description 
FROM lectures 
WHERE course_code = 'CS201' 
ORDER BY lecture_number;
