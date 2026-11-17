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

Open the local URL (default to `localhost:4321`). There are three types of requests to send for testing:

- **Free user**
- **Pro user**
- **Background bot**

You'll use those shortly.
