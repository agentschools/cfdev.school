-- Schema source of truth: src/schemas/progress.ts
-- Lesson completions are now per harness (see #52): a student can complete
-- the same lesson once per agent. SQLite can't change a primary key in place,
-- and existing rows have no harness to key on, so this drops and recreates
-- the table. Acceptable pre-launch, there are no real users yet.
DROP TABLE lesson_completions;
CREATE TABLE lesson_completions (
  student_id TEXT NOT NULL REFERENCES students(id),
  lesson_slug TEXT NOT NULL,
  harness TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  model TEXT,
  summary TEXT,
  PRIMARY KEY (student_id, lesson_slug, harness)
);
