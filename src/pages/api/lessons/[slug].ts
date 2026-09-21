import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { harnessProfileSchema } from "../../../data/harnesses";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json" };

export const GET: APIRoute = async ({ params, url }) => {
  const slug = params.slug;
  const requestedHarness = url.searchParams.get("harness");
  const harness = harnessProfileSchema.shape.id.safeParse(requestedHarness).success ? requestedHarness : "generic";

  const entries = await getCollection("lessons", (entry) => entry.data.lessonSlug === slug);
  if (entries.length === 0) {
    return new Response(JSON.stringify({ error: "Lesson not found" }), { status: 404, headers: jsonHeaders });
  }

  const entry = entries.find((e) => e.data.harness === harness) ?? entries.find((e) => e.data.harness === "generic");
  if (!entry) {
    return new Response(JSON.stringify({ error: "No content variant available for this lesson" }), {
      status: 404,
      headers: jsonHeaders,
    });
  }

  return new Response(
    JSON.stringify({
      slug: entry.data.lessonSlug,
      harness: entry.data.harness,
      title: entry.data.title,
      description: entry.data.description,
      quiz: entry.data.quiz,
      agentInstructions: entry.data.agentInstructions,
    }),
    { headers: jsonHeaders },
  );
};
