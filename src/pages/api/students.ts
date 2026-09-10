import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { generateStudentId } from "../../lib/student-id";
import { studentSchema } from "../../schemas/student";

export const prerender = false;

export const POST: APIRoute = async () => {
  const db = env.DB;
  const id = await generateStudentId(db);
  const createdAt = new Date().toISOString();

  await db.prepare("INSERT INTO students (id, created_at) VALUES (?, ?)").bind(id, createdAt).run();

  const student = studentSchema.parse({ id, createdAt });

  return new Response(JSON.stringify(student), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
