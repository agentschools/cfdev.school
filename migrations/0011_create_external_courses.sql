-- Schema source of truth: src/schemas/course.ts
-- Courses hosted outside this site (#77), one row per student per course,
-- as the student's agent reported them. course_id is the course's
-- normalized URL (src/lib/course-url.ts).
CREATE TABLE external_courses (
  student_id TEXT NOT NULL REFERENCES students(id),
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  -- JSON array of { "slug", "title", "url" }, interview first.
  exercises TEXT NOT NULL,
  -- When the course was first reported, for ordering. Kept on re-reports.
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (student_id, course_id)
);
