-- Schema source of truth: src/schemas/progress.ts
-- Progress is keyed by course and exercise (see #73 and #75), replacing the
-- separate exercise and lesson completion tables. Existing rows are dropped,
-- which is acceptable pre-launch, there are no real users yet.
DROP TABLE exercise_completions;
DROP TABLE lesson_completions;

-- One row per harness that completed an exercise (#52).
CREATE TABLE exercise_completions (
  student_id TEXT NOT NULL REFERENCES students(id),
  course_id TEXT NOT NULL,
  exercise_slug TEXT NOT NULL,
  harness TEXT NOT NULL,
  exercise_url TEXT NOT NULL,
  model TEXT,
  -- Only set on interviews: one sentence about the student's answers.
  summary TEXT,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (student_id, course_id, exercise_slug, harness)
);

-- Written once, when every exercise in the course first has a completion,
-- and kept even if the course gains exercises later.
CREATE TABLE course_completions (
  student_id TEXT NOT NULL REFERENCES students(id),
  course_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (student_id, course_id)
);
