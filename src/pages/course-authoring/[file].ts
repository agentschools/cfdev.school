import type { APIRoute, GetStaticPaths } from "astro";
import skill from "../../../.agents/skills/create-course/SKILL.md?raw";
import spec from "../../../.agents/skills/create-course/SPEC.md?raw";

// Preserve relative links in the installed skill for authors using the website.
export const prerender = true;
export const getStaticPaths = (() => [
  { params: { file: "SKILL.md" }, props: { markdown: skill } },
  { params: { file: "SPEC.md" }, props: { markdown: spec } },
]) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => new Response(props.markdown, {
  headers: { "Content-Type": "text/markdown; charset=utf-8" },
});
