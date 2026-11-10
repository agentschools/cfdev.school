import type { APIRoute } from "astro";

// Course media lives in R2, served at media.cfdev.school. Authors commit files
// to public/media/ and reference them as /media/..., which `npm run dev` serves
// from disk. CI uploads them to R2 at the same path and removes them from the
// branch (.github/workflows/preview.yml), so in previews and production the
// request falls through to this route and goes to R2, which handles Range
// requests for video seeking.
export const prerender = false;

const MEDIA_ORIGIN = "https://media.cfdev.school";

export const GET: APIRoute = ({ params }) => Response.redirect(`${MEDIA_ORIGIN}/${params.path}`, 302);
