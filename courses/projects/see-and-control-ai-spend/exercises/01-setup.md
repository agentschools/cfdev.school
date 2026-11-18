---
description: "Clone the starter code, install packages, and run the dev server."
agent-instructions: |
  Ask the user which directory they'd like to clone the starter repository to. Then, execute the steps from the exercise in order. Make sure to explain to the user what you're doing before each one. In "View the results", request `/api/config` at the local URL printed by `npm run dev`. Before marking this exercise complete, confirm it returns HTTP 200 with `mode: "direct"`, a `model`, and `userTypes` containing the IDs `free`, `pro`, and `bot`. Show the successful response to the user, then confirm they are ready for "Add AI Gateway".
---

# Setup

Set up the starter repository on your local machine. The application has three buttons representing three personas: Free user, Pro user, and Background bot.

By default, all three callers use a short test prompt. You won't be comparing the quality of the answers. Instead, you'll be inspecting how requests are handled and optimizing model usage to become more cost effective.

## Set up the starter

Clone the starter code to your desired directory.

```bash
git clone https://github.com/jamesqquick/ai-spend-control-course
cd ./ai-spend-control-course
```

Install dependencies:

```bash
npm install
```

Log in to Cloudflare, select an account that has Workers AI enabled, and start the app:

```sh
cf auth login
export CLOUDFLARE_ACCOUNT_ID=<YOUR-ACCOUNT-ID>
npm run dev
```

## View the results

Open the local URL printed by `npm run dev`. Here, you'll see buttons to send AI requests from three different user personas for testing:

- **Free user**
- **Pro user**
- **Background bot**

These personas are defined in `./src/demo-data.ts`

```ts
export const USER_TYPES = {
  free: {
    label: "Free user",
    prompt: PROMPT,
  },
  pro: {
    label: "Pro user",
    prompt: PROMPT,
  },
  bot: {
    label: "Background bot",
    prompt: PROMPT,
  },
} as const;
```

The application sends real requests to Workers AI but does not display the generated answers. Instead, it shows request details such as the selected model and status.

The chart shows how many requests belong to each user persona during your current page session. At this point, each requests shows "not routed through Gateway" as it's missing the necessary metadata to classify requests. You'll implement that functionality through the rest of this course.
