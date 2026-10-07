-- Drops what #75 and #76 replaced, now that nothing on main reads it (#82):
-- exercise_completions and lesson_completions (replaced by
-- course_exercise_completions and course_completions), interview_answers
-- (replaced by interviews), and course_exercise_completions.summary
-- (interview summaries live on interviews).
DROP TABLE exercise_completions;
DROP TABLE lesson_completions;
DROP TABLE interview_answers;
ALTER TABLE course_exercise_completions DROP COLUMN summary;
