/**
 * A fake `astro:content` for page and component tests, which can't load real
 * content collections (see AGENTS.md's "Testing Astro components"). Two small
 * courses shaped like the real ones. Use it with:
 *
 *   vi.mock("astro:content", async () => (await import("<path>/test/fake-content")).fakeAstroContent);
 */
const collections = {
  courses: [
    { id: "agent-setup", body: "\n# Agent setup\n\nIntro.\n", data: { name: "agent-setup", description: "Set up your agent." } },
    {
      id: "workers-basics",
      body: "\n# Workers basics\n\nIntro.\n",
      data: { name: "workers-basics", description: "Ship your first Worker." },
    },
  ],
  exercises: [
    { id: "agent-setup/00-interview", body: "\n# Interview\n", data: { description: "Tell your agent about you." } },
    { id: "agent-setup/01-models", body: "\n# Models\n", data: { description: "Pick a model." } },
    { id: "agent-setup/02-instructions", body: "\n# Instructions\n", data: { description: "Write instructions." } },
    {
      id: "workers-basics/01-deploy-first-worker",
      body: "\n# Deploy your first Worker\n",
      data: { description: "Deploy a Worker." },
    },
  ],
  defaultInterview: [{ id: "default-interview", body: "\n# Interview\n", data: { description: "About this course." } }],
  authorsGuide: [{ id: "authors", body: "\n# Writing a course\n", data: { description: "How to write a course." } }],
};

export const fakeAstroContent = {
  getCollection: async (name: keyof typeof collections) => collections[name],
  render: async () => ({ Content: () => null }),
};
