# Cloudflare Dev School

This is the human plan for Cloudflare Dev School, a web app that teaches people how to build on Cloudflare using their AI-powered agentic tools of choice.

The app will largely be modeled after OpenCode School, the open-source project that teaches people how to build awesome things on their computer with OpenCode.

Like OpenCode School, signup is free.

Students log in with their Cloudflare account (or create one as part of the signup process), using Cloudflare's new support for self-managed OAuth clients.

Once logged in, students will have their Cloudflare account connected to the app, and will be able to follow along with the lessons using their own Cloudflare account.

We'll store the student's enrollment, profile, and progress through the lessons in a database, using a schema similar to the one used by OpenCode School.

## AI tools

The homepage should make it clear that Cloudflare Dev School works with any AI-powered agent harness. It should include cards with logos for each of these:

- OpenCode (Cloudflare's pick): The open-source agent harness that lets you connect to any model from any provider. Best with Cloudflare's AI gateway, which lets you connect to multiple providers (OpenAI, Claude, Google, etc.) with unified billing, dynamic routing, observability, caching, and more.
- Claude Code: The crowd favorite. The vibe-coding app that started it all.
- OpenAI Codex: The underdog from the incumbent AI provider. Late to the party, but catching up fast.
- Gemini: Google's offering. Still new and evolving, but has potential to be a strong contender.

##  AI tools research

Let's do some research and build structured data profiles about each of the supported agent harnesses, with info that we'll want to know later on, like:

- the default name and location of the global instructions file, e.g. CLAUDE.md for Claude, or AGENTS.md for the various agent harnesses that support it.
- the name of the CLI command to run the tool
- the tool's support for Skills files.. where they should be located, etc
- the name and location of the global configuration file for things like MCP server configuration
- what models the tool supports, and data for those models in terms of name, shorthand id, cost, speed, accuracy, context window size, vision support, tool use, etc. 
  - OpenAI: GPT 5.5, GPT 5.4 mini, etc
  - Anthropic: Claude Opus, Sonnet, Haiku, etc.
  - Google: Gemini 3.1 Pro, Gemini 3.1 Flash, etc.
  - OpenCode: OpenAI, Claude, Google, and Workers AI open-source models, all through the Cloudflare AI gateway

Make sure we're fetching the very latest info for each of these tools, and creating a repeatable process for keeping this info up to date, since these tools are evolving rapidly.

## Student Journey

1. Students land on the homepage, which gives an overview of the school, lists the supported AI agent harnesses, and a prominent call to action to **enroll**. -- Free forever. No credit card required.
2. Students sign up using their existing Cloudflare account, or create a new one as part of the signup process.
3. Students land back on the site, with a celebratory confetti animation modeled after the one on OpenCode School, which does an animated cypher effect to reveal the student's unique ID. Students should be assigned a randomly generated student id, just like OpenCode School, with the same format and same set of adjectives and nouns.
4. The post-enrollment page should have a list of popular agents for the student to choose from. The main four should be OpenCode, Claude Code, Codex, and Gemini, but other agents harnesses should be included as well, with less emphasis.
5. After choosing a harness, students are presented with an "agent prompt", similar to the OpenCode School agent prompt. Their task is to copy the prompt and paste it into their agent harness.
6. After pasting the prompt into their agent, the agent starts the school interview process, collecting information about the student's technical background, experience with Cloudflare, and learning goals. The agent uses the Cloudflare Dev School's API to store the student's responses in a database, which will be used to personalize the student's learning experience and track their progress through the lessons.
7. After completing the interview, students progress through lessons.
8. After completing the lessons, students receive a personalized certificate of completion that they can share on social media and add to their resume.
9. After completing the lessons and receiving their certificate, students have the perfect foundation to start building on Cloudflare. The next step is to dive into exercises.
10. Exercises are like mini-projects, just like in OpenCode School. Each exercise teaches the student about a different product or feature of Cloudflare, and challenges them to build and deploy something that uses the product or feature.

## API

The Cloudflare Dev School API works the same way as the OpenCode School API. It's a pubic API, documented with OpenAPI, and has endpoints for managing enrollment, lessons, exercises, and progress.

Like OpenCode School, students' browsers should cache student id enrollment data in local storage, and use the API to fetch updates about their enrollment and progress as needed.

The Cloudflare Dev School llms.txt file should closely follow the format of the OpenCode School llms.txt file, with instructions for the agent on how to the sytem works and how to discover the API schema and interact with the API to store and retrieve information about the student's enrollment, lessons, exercises, and progress.

## Signup

The signup process should use social login with Cloudflare's new self-managed OAuth clients. This will allow students to sign up and log in using their existing Cloudflare account, without having to create a new account or remember another password.

The OAuth client should ask for a bare minimum of scopes to start. We can add more scopes as the user progresses through the lessons and needs to connect their account to more services. For example, we might start with just an account-reading scope, which allows us to read the student's account information and personalize their learning experience.

## Interview

After enrolling and jumping into their agent, students are presented with some interview questions.

This should be modeled after the OpenCode School agent prompt and interview process.

Like OpenCode School, the agent should automatically detect the operating system the student is using.

The interview should also include a few additional questions:

- Familiarity with Cloudflare
- Quizzes: Ask students if they want to be quizzed at the end of each lesson. Recommend that they give it a try knowing that they can skip or disable quizzes later on if they’re not helpful or too time-consuming.

## Lessons

Like OpenCode School, the lessons will cover the basics of getting your machine set up to build apps on Cloudflare with AI superpowers. Once the lessons are complete, students will have a fully functional agent-powered development environment.

- Models: An overview of the different language models available through the user's agent harness, and guidance on choosing the right model.
- Instructions: The things you should document in your global AGENTS.md for a good experience building on Cloudflare.
- CLI: Wrangler is the command-line interface for Cloudflare. We'll cover how to use it to build and deploy your projects.
- Skills: Cloudflare has official skills for all of the products in the Developer Platform.
- Tools: We'll install Cloudflare's official MCP server

### Lesson: Models

This lesson should have content that is tailored to the specific agent harness the student is using, with a breakdown of available models and explanation of the tradeoffs between them in terms of cost, speed, accuracy, context window size, etc.

If the user is using OpenCode, this lesson should cover how to configure a custom Cloudflare AI gateway to connect to multiple providers like OpenAI, Claude, Google, etc., and how to choose the right model for your use case. See this page for context: https://opencode.school/exercises/use-an-ai-gateway/

If the user is using Claude Code, the different Claude models (Haiku, Sonnet, Opus), and cover the tradeoffs between them in terms of cost, speed, accuracy, context window size, etc.

If the user is using OpenAI Codex, cover the different Codex models (e.g. GPT 5.5, GPT 5.4 mini, etc.) and their tradeoffs.

### Lesson: Instructions

The instructions lesson should guide the student through adding some Cloudflare-flavored instructions to their global instructions file, e.g. CLAUDE.md for Claude, or AGENTS.md for the various agent harnesses that support it. Let's do some research in advance to discover the default name and location of the global instructions file for each popular agent harness.

Working with Cloudflare
- Use JSONC for Workers configs, not TOML
- Use .env for secrets, not .dev.vars
- Always use latest Wrangler and Cloudflare npm packages
- Prefer API/CLI over the dashboard
- Favor Workers over Pages
- Use Hono for Workers apps when appropriate
- Work email: me@my-work-email.com
- Personal subdomain: my-workers-subdomains.workers.dev
- Domains on Cloudflare: my-domain.com, another-domain.com

Students may need to fully quit and restart their agent harness app for these changes to take effect.

### Lesson: CLI

Wrangler is the command-line interface for Cloudflare, and is an essential tool for building on Cloudflare. This lesson should cover how to install Wrangler, how to authenticate it with your Cloudflare account, and how to use it to build and deploy projects. In this lesson we'll just install and authenticate Wrangler, and in later lessons we'll cover how to actually use it build and deploy projects.

### Lesson: Skills

In this lesson we should give an overview of what skills are and what makes them useful. Make it clear that they are loaded only when needed, so they don't fill up the model's context window. See https://opencode.school/lessons/skills/ for more content.

We'll install https://github.com/cloudflare/skills

We can probably use "npx skills add https://github.com/cloudflare/skills" as our preferred installation method, since it supports all the agent harnesses.

The command should install the skills globally (so they're available to all their projects) in the appropriate location for the student's agent harness, and it should install non-interactively, so that the student can just run the command and then move on to the next lesson without having to answer any questions or make any choices.

Students may need to fully quit and restart their agent harness app for these skills to become available.

### Lesson: Tools

There's only one MCP server we need to install: https://github.com/cloudflare/mcp

A token-efficient MCP server for the entire Cloudflare API. 2500 endpoints in 1k tokens, powered by Code Mode.

## Design

The site design should draw inspiration from OpenCode School, but with a Cloudflare twist.

The color scheme should be based on Cloudflare's brand colors, and the overall aesthetic should be clean and minimalistic.

The site should be responsive and work on desktop and mobile devices.

The site should support dark and light mode, and honor the student's system preferences. If the student changes their system preferences while using the site, the site should update its theme accordingly.

## Architecture

- Use this approach to type design and documentation: https://shiptypes.com/
- Use test-driven development, building the application in small, testable increments.
- Add a GitHub Actions workflow to run tests and linting on every pull request
- Add a GitHub Actions workflow to deploy the app to production on merges to main.
- Use the latest version of Astro. Model the app structure after OpenCode School's codebase.

## Reference material

Before building the app, we'll need to gather reference material to inform the design and content of the lessons. This will include:

OpenCode School:
- https://opencode.school
- https://opencode.school/llms.txt
- https://opencode.school/api/openapi.json
- https://github.com/opencodeschool/opencode.school

OAuth:
- https://login-with-cloudflare.ziki.boo
- https://github.com/zeke/login-with-cloudflare

Skills:
- https://opencode.school/lessons/skills
- https://skills.sh
- https://agentskills.io
- https://github.com/cloudflare/skills

MCP:
- https://github.com/cloudflare/mcp
