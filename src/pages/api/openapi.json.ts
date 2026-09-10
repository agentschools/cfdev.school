import type { APIRoute } from "astro";
import { openApiDocument } from "../../lib/openapi";

export const prerender = false;

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(openApiDocument, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
};
