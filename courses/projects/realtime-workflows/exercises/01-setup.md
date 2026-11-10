---
description: "Clone the starter code, install packages, and run the dev server."
agent-instructions: |
  Ask the user which directory they'd like to clone the starter repository to. Then, execute the steps from the lesson in order. Make sure to explain to the user what you're doing before each one. Explain to the user what you did and show that you got a successful response from checking the health endpoint. You don't need to ask the user any questions other than confirming they are ready to go to the next exercise.
---

# Setup

Setup the starter repository on your local machine.

## Set up the starter

Clone the starter code to your desired directory.

```bash
git clone https://github.com/jamesqquick/realtime-workflows-demo
cd ./realtime-workflows-demo
```

Install dependencies:

```bash
pnpm install
```

Start the dev server:

```bash
pnpm dev
```

In another terminal or in the browser, make a test request to the `/api/health` endpoint:

```bash
curl http://localhost:5173/api/health
```

You should see confirmation that your server is running correctly with an `{ "ok": true}` response.
