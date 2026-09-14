import type { APIRoute } from "astro";
import { listExercises } from "../../data/exercises";

export const prerender = false;

const jsonHeaders = { "Content-Type": "application/json" };

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(listExercises()), { headers: jsonHeaders });
};
