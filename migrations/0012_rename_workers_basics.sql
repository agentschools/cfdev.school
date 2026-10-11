-- Workers basics became the Workers course in the fundamentals track (#98).
-- Renamed in place, with no backward compatibility, since there are no real
-- students yet.
UPDATE course_exercise_completions
SET course_id = 'workers',
    exercise_url = replace(exercise_url, '/courses/workers-basics/', '/courses/workers/')
WHERE course_id = 'workers-basics';

UPDATE course_completions SET course_id = 'workers' WHERE course_id = 'workers-basics';

UPDATE interviews SET course_id = 'workers' WHERE course_id = 'workers-basics';
