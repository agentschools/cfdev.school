---
description: "Start a React app on a Worker and build a canvas that works with a mouse, a finger, or a pen."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  Read this course's interview (GET /api/students/{id}/interviews): who the game is for and what they'll draw set the page's look, browser experience sets how much React you explain, and where they'll play sets the canvas size and how much phone testing to do. Teach the body's sections as you go, before the code that uses them.

  1. Ask the student what to call the game: it becomes the directory and Worker name, so suggest something short and lowercase with hyphens. Wait for their reply. Then create the project with `cf init <name>`, and write a short `AGENTS.md` in it: what the game is, that it's React + Vite on one Worker built with `cf`, and the commands (`cf dev`, `npm run typecheck`, `cf deploy`). Never run Wrangler in this project.
  2. Add React to the Vite project `cf init` made:
     - `npm i react react-dom` and `npm i -D @vitejs/plugin-react @types/react @types/react-dom`.
     - In `vite.config.ts`, add `react()` from `@vitejs/plugin-react` before `cloudflare()` in `plugins`. If they'll play on a phone, also set `server: { host: true }` so `cf dev` is reachable from other devices on their network (it prints a Network URL).
     - An `index.html` at the project root with `<div id="root"></div>` and `<script type="module" src="/app/main.tsx"></script>`, plus a viewport meta tag.
     - `app/main.tsx` rendering `<App />` from `app/App.tsx`. The browser code goes in `app/`, the Worker stays in `src/`.
     - In `tsconfig.json`: add `"dom"` and `"dom.iterable"` to `lib`, set `"jsx": "react-jsx"`, and add `"app"` to `include`. One tsconfig works for both, because `cf init` sets `skipLibCheck`.
     - Replace the Worker in `src/index.ts` with one that returns a 404 for every request, and remove the sample `WORLD` binding from `cloudflare.config.ts`. Explain that `cf` serves the built page as static assets first, so the Worker only sees requests that aren't files, like the `/api/guess` endpoint in the next exercise. No assets configuration is needed.
  3. Build the canvas in `App.tsx`, as in the body: a fixed pixel size (e.g. 512×512) scaled with CSS (`width: 100%`, `aspect-ratio: 1`), filled white on mount and on Clear, `touch-action: none`, and `onPointerDown`/`onPointerMove`/`onPointerUp`/`onPointerCancel` with `setPointerCapture`, converting each pointer position from CSS pixels to canvas pixels. Give the canvas an `aria-label` that says what to do. Ask the student for the brush (width and color) and the page's heading, and style it for the audience they named.
  4. Add a "What the model will see" preview: draw the canvas onto a 256×256 canvas, export it with `toDataURL("image/png")`, and show it as an `<img>` with alt text. This is the image the next exercise sends.
  5. Before they try it on a phone, ask the student to predict what happens if you remove `touch-action: none`. Wait for their answer. Then have them try it with and without, on a real phone with the Network URL (same Wi-Fi) or with their browser's device emulation, and put it back.
  6. Verify before completing. YOU must:
     - run `npm run typecheck` and `cf build`, and confirm both pass;
     - fetch the local dev server's `/` and confirm it returns the page with `<div id="root">`, and fetch `/api/anything` and confirm a 404;
     - ask the student to draw something, press Clear, draw again, and tell you what the preview shows.
     Don't mark it complete on the student's word alone: the typecheck, build, and fetches must pass too.
  7. Comprehension check: ask the student why the canvas is filled white instead of left transparent, and why the preview is smaller than the canvas. (On a transparent background the model sees nothing, as the body says; and a smaller image is fewer tokens, which the next exercise measures.) Gently correct anything off.
  8. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then move on to "add-a-decision-model".

  Out of scope here: guessing, rounds, colors and undo, and saving drawings.
---

# Build a canvas

Every round of your game starts with a blank canvas. In this exercise you'll start the app and build that canvas: something you can draw on with a mouse, a finger, or a pen, plus a preview of exactly what the model will see when it guesses.

## What you'll build

A React app on a Worker, made with `cf init`, with a drawing canvas, a Clear button, and a small preview of your drawing at the size you'll send to the model.

## One Worker, two halves

Your game is one Worker with two halves. The page, written in React, runs in the player's browser: that's where the drawing happens. The Worker runs on Cloudflare: in the next exercise it gets an endpoint that sends each drawing to the model. Vite builds the page into static files, and Cloudflare serves those files before your Worker code runs, so the Worker only handles what isn't a file, like `/api/guess`.

```text
my-game/
├── index.html            the page's shell
├── app/                  runs in the browser
│   ├── main.tsx
│   └── App.tsx
├── src/index.ts          runs on Cloudflare
├── cloudflare.config.ts
└── vite.config.ts
```

## Drawing with pointer events

Pointer events cover a mouse, a finger, and a pen with the same code, so you don't need separate touch handling:

```tsx title="app/App.tsx"
const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
  e.currentTarget.setPointerCapture(e.pointerId); // keep drawing if the pointer leaves the canvas
  const ctx = e.currentTarget.getContext("2d")!;
  ctx.beginPath();
  ctx.moveTo(...toCanvas(e));
  drawing.current = true;
};

const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
  if (!drawing.current) return;
  const ctx = e.currentTarget.getContext("2d")!;
  ctx.lineTo(...toCanvas(e));
  ctx.stroke();
};
```

Two details matter on a phone. The canvas has a fixed size in pixels but is stretched to fit the screen with CSS, so each pointer position has to be converted from screen pixels to canvas pixels (that's `toCanvas`). And without `touch-action: none` on the canvas, dragging a finger scrolls the page instead of drawing.

## What the model will see

The model doesn't need your full-size canvas. Before sending a drawing, your page shrinks it to 256×256 pixels and turns it into a PNG. The preview shows that image, so what you see is what the model gets. The canvas is filled white first, because a PNG's empty pixels are transparent, not white. When we sent black lines on a transparent background, the model answered exactly as it did for an empty canvas: it saw nothing at all.

## Prerequisites

Your agent can help you with these.

- [Node.js](https://nodejs.org/) installed.
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up).
- The [`cf` CLI](/courses/agent-setup/cli) installed. You'll log in when the next exercise calls the model.
