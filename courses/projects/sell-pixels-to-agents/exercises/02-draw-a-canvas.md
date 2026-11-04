---
description: "Build a page of pixels with one Durable Object keeping the canvas in SQLite."
agent-instructions: |
  Read the interview and project AGENTS.md. Use their dimensions and theme.
  No prior Durable Objects course is required. Keep the free writer local;
  remove it in the next exercise before deploying.
  
  1. Build a Hono Worker and GET / page showing the grid, coordinates, chosen
     colors, price and a visible Base Sepolia / test tokens label. Free
     GET /canvas returns dimensions and pixels as JSON. Serve HTML from Hono
     or root index.html in cf's Vite project; keep browser code separate from
     src/ and never expose .env. Render text with textContent.
  2. Export Canvas extending DurableObject from cloudflare:workers. Declare
     it under worker.exports in cloudflare.config.ts with
     exports.durableObject({ storage: "sqlite" }) from cf/config, preserving
     cf init's entrypoint import. Route reads and writes through
     ctx.exports.Canvas.getByName("canvas") from the default Worker handler.
     A single small canvas is this object's coordination unit. Generate types
     with npm run typecheck instead of inventing binding interfaces.
  3. Create a pixels table in the constructor with synchronous
     this.ctx.storage.sql.exec. Give it x, y, color and PRIMARY KEY (x,y).
     Local PUT /pixels/:x/:y accepts { color }. Validate canonical integer
     coordinates within bounds and color /^#[0-9a-fA-F]{6}$/ before writing.
     Limit request bodies to 1 KiB, reject malformed JSON/unexpected fields
     with 400 and oversized bodies with 413. Use bound SQL parameters.
     Claim with INSERT ... ON CONFLICT DO NOTHING RETURNING x,y,color:
     201 if inserted, 409 if occupied. Don't read, await, then overwrite.
  4. Ask the student to choose a square and color, and predict what two agents
     writing the same square would do. Wait. Send two concurrent local PUTs
     to that square and repaint from GET /canvas. Let them choose another
     color and square and watch that one appear too.
  5. Verify before completing: npm run typecheck and cf build pass; GET /
     serves the page; /canvas matches their choices; invalid/out-of-range
     input returns 400 without writes; the race gives one 201 and one 409.
     Restart cf dev using the same local state and fetch /canvas to prove
     persistence. Record the state location. Don't deploy the free writer.
  6. Comprehension check: ask why a Worker variable can't safely hold inventory
     and why the SQL primary key matters when two buyers arrive together.
     Wait and correct misunderstandings.
  7. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes.
     Then move on to charge-for-pixels.
---

# Draw a canvas

Your shop starts with a grid. You'll build a page that shows it and a free endpoint that lets an agent color one square. The price on the page is just a label for now. Anyone who can reach the local endpoint can write without paying, which is the problem you'll fix next.

## One place for each pixel

Workers can handle requests in many places. A variable inside one Worker won't give every buyer the same view of what's available, and it won't survive a restart.

A Durable Object gives this small canvas one place to coordinate writes. Its [SQLite storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) keeps the pixels after the object goes to sleep. Every request uses the same object name, `canvas`.

```ts title="cloudflare.config.ts"
// Add this inside worker, keeping the generated name and entrypoint.
// Import exports alongside defineConfig from "cf/config".
exports: {
  Canvas: exports.durableObject({ storage: "sqlite" }),
},
```

The Worker reaches that exported class through [context exports](https://developers.cloudflare.com/workers/runtime-apis/context/#exports):

```ts
return ctx.exports.Canvas.getByName("canvas").fetch(request);
```

## First come, first served

A pixel can be claimed once. A primary key on `(x, y)` makes the database enforce that rule. If two requests try the same square, one succeeds and the other gets `409 Conflict`. You'll try it with two requests at once, then restart your app and check that the winning pixel is still there.
