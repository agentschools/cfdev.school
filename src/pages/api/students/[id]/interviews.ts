import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { type BuiltInCourse, getBuiltInCourses } from "../../../../lib/courses";
import { loadExternalCourses, resolveCourse } from "../../../../lib/external-courses";
import { broadcastProgress, findStudent, loadProgress } from "../../../../lib/progress-store";
import { type Interviews, interviewsSchema, saveInterviewSchema } from "../../../../schemas/interview";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json", "Cache-Control": "no-store" };

interface InterviewRow {
  course_id: string;
  /** JSON array of { question, answer } pairs. */
  responses: string;
  summary: string;
  updated_at: string;
}

/** The student's interviews, one per course: built-in courses in catalog order, then reported ones, oldest first. */
async function loadInterviews(studentId: string, courses: BuiltInCourse[]): Promise<Interviews> {
  const [{ results }, externalCourses] = await Promise.all([
    env.DB.prepare("SELECT * FROM interviews WHERE student_id = ?").bind(studentId).all<InterviewRow>(),
    loadExternalCourses(studentId),
  ]);
  const order = [...courses.map((course) => course.name), ...externalCourses.map((course) => course.url)];

  return interviewsSchema.parse({
    studentId,
    interviews: order.flatMap((course) => {
      const row = results.find((item) => item.course_id === course);
      if (!row) return [];
      return [{ course, responses: JSON.parse(row.responses), summary: row.summary, updatedAt: row.updated_at }];
    }),
  });
}

function studentNotFound(): Response {
  return new Response(JSON.stringify({ error: "Student not found" }), { status: 404, headers: jsonHeaders });
}

export const GET: APIRoute = async ({ params }) => {
  const studentId = params.id ?? "";
  if (!(await findStudent(studentId))) return studentNotFound();

  const interviews = await loadInterviews(studentId, await getBuiltInCourses());
  return new Response(JSON.stringify(interviews), { headers: jsonHeaders });
};

/** Replaces one course's interview, then pushes the new summary to the student's open tabs with their progress. */
export const PUT: APIRoute = async ({ params, request }) => {
  const studentId = params.id ?? "";
  const student = await findStudent(studentId);
  if (!student) return studentNotFound();

  const parsed = saveInterviewSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.message }), { status: 400, headers: jsonHeaders });
  }
  const body = parsed.data;

  const courses = await getBuiltInCourses();
  const course = await resolveCourse(studentId, body.course, courses);
  if (!course) {
    return new Response(
      JSON.stringify({
        error: `No course "${body.course}". GET /api/courses lists the built-in ones; report a course hosted elsewhere with PUT /api/students/{id}/courses first.`,
      }),
      { status: 400, headers: jsonHeaders },
    );
  }

  // Optional compare-and-save for browser forms; agent clients keep their existing PUT semantics.
  const expected = request.headers?.get("X-Interview-Version") ?? null;
  const result = await env.DB.prepare(
    `INSERT INTO interviews (student_id, course_id, responses, summary, updated_at)
     SELECT ?, ?, ?, ?, ?
     WHERE ? IS NULL OR (? = 'none' AND NOT EXISTS (
       SELECT 1 FROM interviews WHERE student_id = ? AND course_id = ?
     )) OR EXISTS (
       SELECT 1 FROM interviews WHERE student_id = ? AND course_id = ? AND updated_at = ?
     )
     ON CONFLICT(student_id, course_id) DO UPDATE SET
       responses = excluded.responses,
       summary = excluded.summary,
       updated_at = CASE WHEN excluded.updated_at <= interviews.updated_at
         THEN strftime('%Y-%m-%dT%H:%M:%fZ', julianday(interviews.updated_at) + 1.0 / 86400000)
         ELSE excluded.updated_at END
     WHERE ? IS NULL OR interviews.updated_at = ?`,
  )
    .bind(studentId, course.id, JSON.stringify(body.responses), body.summary, new Date().toISOString(),
      expected, expected, studentId, course.id, studentId, course.id, expected, expected, expected)
    .run();

  if (result.meta.changes === 0) {
    return new Response(JSON.stringify({ error: "This interview changed in another session. Reload saved answers before submitting." }), { status: 409, headers: jsonHeaders });
  }

  await broadcastProgress(await loadProgress(studentId, student.created_at, courses));
  const interviews = await loadInterviews(studentId, courses);
  return new Response(JSON.stringify(interviews), { headers: jsonHeaders });
};
