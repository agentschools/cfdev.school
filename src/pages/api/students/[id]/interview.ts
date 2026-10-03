import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { interviewAnswersSchema, interviewSchema, type Interview } from "../../../../schemas/interview";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json" };

interface InterviewRow {
  student_id: string;
  agent_experience: string | null;
  /** JSON array of strings. */
  platforms_used: string | null;
  learning_goals: string | null;
  os: string | null;
  quiz_opt_in: number;
  updated_at: string;
}

function rowToInterview(row: InterviewRow): Interview {
  return interviewSchema.parse({
    studentId: row.student_id,
    agentExperience: row.agent_experience,
    platformsUsed: row.platforms_used === null ? null : JSON.parse(row.platforms_used),
    learningGoals: row.learning_goals,
    os: row.os,
    quizOptIn: Boolean(row.quiz_opt_in),
    updatedAt: row.updated_at,
  });
}

export const GET: APIRoute = async ({ params }) => {
  const studentId = params.id;
  const row = await env.DB.prepare("SELECT * FROM interview_answers WHERE student_id = ?")
    .bind(studentId)
    .first<InterviewRow>();

  if (!row) {
    return new Response(JSON.stringify({ error: "Interview not found" }), { status: 404, headers: jsonHeaders });
  }

  return new Response(JSON.stringify(rowToInterview(row)), { headers: jsonHeaders });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const studentId = params.id;

  const student = await env.DB.prepare("SELECT id FROM students WHERE id = ?").bind(studentId).first();
  if (!student) {
    return new Response(JSON.stringify({ error: "Student not found" }), { status: 404, headers: jsonHeaders });
  }

  const body = interviewAnswersSchema.parse(await request.json().catch(() => ({})));
  const existing = await env.DB.prepare("SELECT * FROM interview_answers WHERE student_id = ?")
    .bind(studentId)
    .first<InterviewRow>();

  const agentExperience = body.agentExperience ?? existing?.agent_experience ?? null;
  const platformsUsed = body.platformsUsed ?? (existing?.platforms_used ? JSON.parse(existing.platforms_used) : null);
  const learningGoals = body.learningGoals ?? existing?.learning_goals ?? null;
  const os = body.os ?? existing?.os ?? null;
  const quizOptIn = body.quizOptIn ?? (existing ? Boolean(existing.quiz_opt_in) : true);
  const updatedAt = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO interview_answers (student_id, agent_experience, platforms_used, learning_goals, os, quiz_opt_in, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(student_id) DO UPDATE SET
       agent_experience = excluded.agent_experience,
       platforms_used = excluded.platforms_used,
       learning_goals = excluded.learning_goals,
       os = excluded.os,
       quiz_opt_in = excluded.quiz_opt_in,
       updated_at = excluded.updated_at`,
  )
    .bind(
      studentId,
      agentExperience,
      platformsUsed === null ? null : JSON.stringify(platformsUsed),
      learningGoals,
      os,
      quizOptIn ? 1 : 0,
      updatedAt,
    )
    .run();

  const interview = interviewSchema.parse({
    studentId,
    agentExperience,
    platformsUsed,
    learningGoals,
    os,
    quizOptIn,
    updatedAt,
  });

  return new Response(JSON.stringify(interview), { headers: jsonHeaders });
};
