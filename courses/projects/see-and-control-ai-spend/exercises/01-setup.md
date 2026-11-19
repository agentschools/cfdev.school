---
description: "Clone the starter code, install packages, and run the dev server."
agent-instructions: |
  - Ask which directory to clone the starter into.
  - Depth: big picture, introduce the buttons and receipt; how it works, trace browser to Worker to Workers AI; hands-on, walk through the request handler.
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

Keep the selected account ID handy. You'll use the same account to create AI Gateway and open its logs in later exercises. The app runs locally, but its AI binding sends real requests to Workers AI. You don't need to deploy the Worker during this course.

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

The chart groups requests by their request metadata during your current page session. At this point, every request appears under "not routed through Gateway" because the application calls Workers AI directly. You'll connect AI Gateway and attach user-type metadata in the next exercises.

Check the app's configuration at `/api/config` on the local URL printed by `npm run dev`. It should return HTTP `200` with `mode: "direct"`, a `model` value, and `userTypes` containing `free`, `pro`, and `bot`.

Click **Free user** once. In **Usage receipt**, confirm that **User type** says `Free user`, **Request metadata** says `not routed through Gateway`, and **Status** shows `OK · HTTP 200`. Resolve any request errors before continuing.
