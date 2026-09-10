-- Schema source of truth: src/schemas/interview.ts
CREATE TABLE interview_answers (
  student_id TEXT PRIMARY KEY REFERENCES students(id),
  technical_background TEXT,
  cloudflare_familiarity TEXT,
  learning_goals TEXT,
  os TEXT,
  quiz_opt_in INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
