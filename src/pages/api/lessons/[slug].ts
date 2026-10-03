import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json" };

export const GET: APIRoute = async ({ params }) => {
  const [entry] = await getCollection("lessons", (entry) => entry.data.lessonSlug === params.slug);
  if (!entry) {
    return new Response(JSON.stringify({ error: "Lesson not found" }), { status: 404, headers: jsonHeaders });
  }

  return new Response(
    JSON.stringify({
      slug: entry.data.lessonSlug,
      title: entry.data.title,
      description: entry.data.description,
      quiz: entry.data.quiz,
      agentInstructions: entry.data.agentInstructions,
    }),
    { headers: jsonHeaders },
  );
};
