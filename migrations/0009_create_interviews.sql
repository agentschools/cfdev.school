-- Schema source of truth: src/schemas/interview.ts
-- One interview per student per course (#76). Replaces interview_answers,
-- which is left in place (along with exercise_completions,
-- lesson_completions, and course_exercise_completions.summary) so PR
-- previews, which share this database with production, don't break the code
-- still running on main. They're dropped in a later migration, once nothing
-- on main reads them (#82).
CREATE TABLE interviews (
  student_id TEXT NOT NULL REFERENCES students(id),
  course_id TEXT NOT NULL,
  -- JSON array of { "question": "...", "answer": "..." | ["..."] }.
  responses TEXT NOT NULL,
  summary TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (student_id, course_id)
);
