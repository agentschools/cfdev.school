-- Schema source of truth: src/schemas/interview.ts
-- Replaces the technical background and Cloudflare familiarity questions
-- with AI agent experience and platforms used before.
ALTER TABLE interview_answers ADD COLUMN agent_experience TEXT;
-- JSON array of strings, NULL until answered.
ALTER TABLE interview_answers ADD COLUMN platforms_used TEXT;
ALTER TABLE interview_answers DROP COLUMN technical_background;
ALTER TABLE interview_answers DROP COLUMN cloudflare_familiarity;
