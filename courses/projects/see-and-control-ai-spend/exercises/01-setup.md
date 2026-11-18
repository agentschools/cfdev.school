---
description: "Clone the starter code, install packages, and run the dev server."
agent-instructions: |
  Ask the user which directory they'd like to clone the starter repository to. Then, execute the steps from the exercise in order. Make sure to explain to the user what you're doing before each one. In "View the results", request `/api/config` at the local URL printed by `npm run dev`. Before marking this exercise complete, confirm it returns HTTP 200 with `mode: "direct"`, a `model`, and `callers` containing the IDs `free`, `pro`, and `bot`. Show the successful response to the user, then confirm they are ready for "Add AI Gateway".
---

# Setup

Set up the starter repository on your local machine. The application has three buttons representing Free user, Pro user, and Background bot.

By default, all three callers use a short test prompt. Their task labels represent different kinds of work so you can test attribution and model-selection rules. You're inspecting how requests are handled, rather than comparing the quality of generated answers.

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

Log in to Cloudflare, select the account that has Workers AI enabled, and start the app:

```sh
cf auth login
export CLOUDFLARE_ACCOUNT_ID=<YOUR-ACCOUNT-ID>
npm run dev
```

## View the results

Open the local URL printed by `npm run dev`. Request `/api/config` at that same local URL. You should receive HTTP 200 and a JSON response with `mode: "direct"`, the configured `model`, and `callers` containing the IDs `free`, `pro`, and `bot`.

The app has three types of requests to send for testing:

- **Free user**
- **Pro user**
- **Background bot**

The application sends real requests to Workers AI but does not display the generated answers. Instead, it shows request details such as the selected model and status.

The chart shows how many requests belong to each caller label during your current page session. It is a request-count breakdown, not a dollar-spend chart. You'll inspect estimated costs in AI Gateway logs after connecting AI Gateway.

You'll use those in the next exercise, [Add AI Gateway](/courses/see-and-control-ai-spend/add-ai-gateway).
