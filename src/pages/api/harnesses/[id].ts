import type { APIRoute } from "astro";
import { harnesses } from "../../../data/harnesses";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json" };

export const GET: APIRoute = async ({ params }) => {
  const harness = harnesses.find((h) => h.id === params.id);
  if (!harness) {
    return new Response(JSON.stringify({ error: "Harness not found" }), { status: 404, headers: jsonHeaders });
  }

  return new Response(JSON.stringify(harness), { headers: jsonHeaders });
};
