/**
 * A fake `astro:content` for page and component tests, which can't load real
 * content collections (see AGENTS.md's "Testing Astro components"). Eight small
 * courses shaped like the real ones. Use it with:
 *
 *   vi.mock("astro:content", async () => (await import("<path>/test/fake-content")).fakeAstroContent);
 */
const collections = {
  courses: [
    { id: "agent-setup", filePath: "courses/agent-setup/COURSE.md", body: "\n# Agent setup\n\nIntro.\n", data: { name: "agent-setup", description: "Set up your agent." } },
    {
      id: "workers",
      filePath: "courses/fundamentals/workers/COURSE.md",
      body: "\n# Workers\n\nIntro.\n",
      data: { name: "workers", description: "Ship your first Worker." },
    },
    { id: "bindings", filePath: "courses/fundamentals/bindings/COURSE.md", body: "\n# Bindings\n\nIntro.\n", data: { name: "bindings", description: "Learn bindings." } },
    {
      id: "publish-a-website",
      filePath: "courses/projects/publish-a-website/COURSE.md",
      body: "\n# Publish a website\n\nIntro.\n",
      data: { name: "publish-a-website", description: "Build and publish a site." },
    },
    {
      id: "run-a-blog-with-emdash",
      filePath: "courses/projects/run-a-blog-with-emdash/COURSE.md",
      body: "\n# Run a blog with EmDash\n\nIntro.\n",
      data: { name: "run-a-blog-with-emdash", description: "Run a blog with EmDash." },
    },
    {
      id: "build-a-guestbook",
      filePath: "courses/projects/build-a-guestbook/COURSE.md",
      body: "\n# Build a guestbook\n\nIntro.\n",
      data: { name: "build-a-guestbook", description: "Build a guestbook." },
    },
    {
      id: "build-a-drawing-game",
      filePath: "courses/projects/build-a-drawing-game/COURSE.md",
      body: "\n# Build a drawing game\n\nIntro.\n",
      data: { name: "build-a-drawing-game", description: "Build a drawing game." },
    },
    {
      id: "durable-objects",
      filePath: "courses/fundamentals/durable-objects/COURSE.md",
      body: "\n# Durable Objects\n\nIntro.\n",
      data: { name: "durable-objects", description: "Learn Durable Objects." },
    },
  ],
  exercises: [
    { id: "agent-setup/00-interview", body: "\n# Interview\n", data: { description: "Tell your agent about you." } },
    { id: "agent-setup/01-models", body: "\n# Models\n", data: { description: "Pick a model." } },
    { id: "agent-setup/02-instructions", body: "\n# Instructions\n", data: { description: "Write instructions." } },
    {
      id: "workers/01-deploy-a-worker",
      body: "\n# Deploy a Worker\n",
      data: { description: "Deploy a Worker." },
    },
    { id: "bindings/01-live-objects", body: "\n# Live objects\n", data: { description: "See what a binding is." } },
  ],
  defaultInterview: [{ id: "default-interview", body: "\n# Interview\n", data: { description: "About this course." } }],
  authorsGuide: [{ id: "authors", body: "\n# Writing a course\n", data: { description: "How to write a course." } }],
};

export const fakeAstroContent = {
  getCollection: async (name: keyof typeof collections) => collections[name],
  render: async () => ({ Content: () => null }),
};
