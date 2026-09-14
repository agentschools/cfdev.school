import type { APIRoute } from "astro";
import { getExercise } from "../../../data/exercises";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json" };

export const GET: APIRoute = async ({ params }) => {
  const exercise = getExercise(params.slug ?? "");
  if (!exercise) {
    return new Response(JSON.stringify({ error: "Exercise not found" }), {
      status: 404,
      headers: jsonHeaders,
    });
  }

  return new Response(JSON.stringify(exercise), { headers: jsonHeaders });
};
