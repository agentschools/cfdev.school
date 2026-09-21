-- Schema source of truth: src/schemas/progress.ts
CREATE TABLE lesson_completions (
  student_id TEXT NOT NULL REFERENCES students(id),
  lesson_slug TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  model TEXT,
  PRIMARY KEY (student_id, lesson_slug)
);
