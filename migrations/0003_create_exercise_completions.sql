-- Schema source of truth: src/schemas/progress.ts
CREATE TABLE exercise_completions (
  student_id TEXT NOT NULL REFERENCES students(id),
  exercise_slug TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  deployed_url TEXT,
  model TEXT,
  PRIMARY KEY (student_id, exercise_slug)
);
