import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { type BuiltInCourse, getBuiltInCourses } from "../../../../lib/courses";
import { loadExternalCourses, resolveCourse } from "../../../../lib/external-courses";
import { broadcastProgress, findStudent, loadProgress } from "../../../../lib/progress-store";
import { type Interviews, interviewsSchema, saveInterviewSchema } from "../../../../schemas/interview";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json" };

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

  await env.DB.prepare(
    `INSERT INTO interviews (student_id, course_id, responses, summary, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(student_id, course_id) DO UPDATE SET
       responses = excluded.responses,
       summary = excluded.summary,
       updated_at = excluded.updated_at`,
  )
    .bind(studentId, course.id, JSON.stringify(body.responses), body.summary, new Date().toISOString())
    .run();

  await broadcastProgress(await loadProgress(studentId, student.created_at, courses));
  const interviews = await loadInterviews(studentId, courses);
  return new Response(JSON.stringify(interviews), { headers: jsonHeaders });
};
