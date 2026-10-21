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

  // Forms must not replace answers saved by an agent or another tab since
  // they loaded. Legacy agent PUTs retain their existing replacement contract.
  const match = request.headers.get("If-Match");
  const createOnly = request.headers.get("If-None-Match") === "*";
  const now = new Date().toISOString();
  const values = [studentId, course.id, JSON.stringify(body.responses), body.summary, now];
  let saved;
  if (match) {
    saved = await env.DB.prepare(
      `UPDATE interviews SET responses = ?, summary = ?,
       updated_at = CASE WHEN updated_at >= ? THEN strftime('%Y-%m-%dT%H:%M:%fZ', updated_at, '+0.001 seconds') ELSE ? END
       WHERE student_id = ? AND course_id = ? AND updated_at = ? RETURNING student_id`,
    ).bind(values[2], values[3], now, now, studentId, course.id, match.replace(/^"|"$/g, "")).first();
  } else if (createOnly) {
    saved = await env.DB.prepare(
      `INSERT INTO interviews (student_id, course_id, responses, summary, updated_at)
       VALUES (?, ?, ?, ?, ?) ON CONFLICT(student_id, course_id) DO NOTHING RETURNING student_id`,
    ).bind(...values).first();
  } else {
    await env.DB.prepare(
      `INSERT INTO interviews (student_id, course_id, responses, summary, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(student_id, course_id) DO UPDATE SET
         responses = excluded.responses,
         summary = excluded.summary,
         updated_at = CASE WHEN interviews.updated_at >= excluded.updated_at
           THEN strftime('%Y-%m-%dT%H:%M:%fZ', interviews.updated_at, '+0.001 seconds')
           ELSE excluded.updated_at END`,
    )
      .bind(...values)
      .run();
    saved = true;
  }
  if (!saved) {
    return new Response(JSON.stringify({ error: "Interview changed. Reload before editing." }), {
      status: 412, headers: jsonHeaders,
    });
  }

  await broadcastProgress(await loadProgress(studentId, student.created_at, courses));
  const interviews = await loadInterviews(studentId, courses);
  return new Response(JSON.stringify(interviews), { headers: jsonHeaders });
};
