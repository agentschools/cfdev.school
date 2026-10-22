---
description: "Turn guesses into a game: rounds, a win rule you choose, and a page that copes with slow or failed guesses."
agent-instructions: |
  Guide the student through this exercise end to end. Do not skip verification.

  This builds on the app from "add-a-decision-model"; check GET /api/progress/{studentId} first, and read the project's `AGENTS.md`. Read this course's interview for who the game is for. Teach the body's sections as you go, before the code that uses them.

  1. Add rounds: each round picks a target word at random from `WORDS` (never the same one twice in a row) and shows it as "Draw: <word>". Add a Skip button that starts a new round, and clear the canvas and the last guess on every new round.
  2. Before choosing a win rule, have the student predict what Clef guesses for an empty canvas. Wait for their answer. Then have them press Guess on an empty canvas, and teach the body's "The highest bar isn't always right" section with what they saw.
  3. Ask the student to choose how a round is won, using the body's options, and wait for their choice:
     - the top guess is the target;
     - the top guess is the target and at least a threshold they pick (suggest 60%);
     - either of those, plus a `finished` `noul` question ("Is the drawing complete enough that a person would confidently recognize what it is?") above a threshold, so a half-finished drawing doesn't win by luck.
     Separately, offer adding a "nothing" word to `WORDS` ("Nothing recognizable yet: a blank canvas or a scribble"), and never pick it as a target. Build what they chose. Show the win as text (with `role="status"`), not only a color or animation, and offer a next-round button.
  4. Make the page cope with the network, as in the body's "When a guess is slow, fails, or arrives late" section:
     - give each request a timeout with `AbortSignal.timeout()` (about 8 seconds);
     - on a timeout, a network error, or a non-2xx response, show a short message (with `role="alert"`) that says they can press Guess again, and read the Worker's JSON `error` if there is one;
     - keep a round counter in a `useRef`, remember it when a request starts, and ignore the answer if the round has changed by the time it arrives;
     - keep Guess disabled while a request is in flight.
     Have the student review the change before they try it.
  5. Try it: have the student press Guess and then Skip straight away, and confirm the old answer doesn't show up in the new round. Then stop `cf dev`, press Guess, and confirm the error message appears instead of a frozen page. Start `cf dev` again.
  6. Verify before completing. YOU must:
     - run `npm run typecheck` and confirm it passes;
     - `POST /api/guess` an empty 256×256 white PNG and show the student the top guess and its probability (and the `finished` probability, if they added that question);
     - ask the student to play three rounds, including one they skip and one they win, and tell you what happened.
     Don't trust the student saying it worked.
  7. Comprehension check: ask the student why Clef's highest probability doesn't mean its guess is correct, and what the round counter protects against. (The probabilities only cover their list and always add up to 100%, so Clef always has a top guess, even for nothing; and an answer to an old round arriving after a new one started.) Gently correct anything off.
  8. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes. Then move on to "launch-your-game".

  Out of scope here: guessing live while drawing ("launch-your-game" compares that with the Guess button), scores across rounds, timers, sound, multiplayer, and saving drawings.
---

# Draw and guess

Your app can guess a drawing. Now make it a game: a word to draw, a way to win, and a next round. Then make it hold up when the network doesn't.

## What makes it a game

A round has a target word. The player draws it and presses Guess. If Clef's guess matches, by a rule you choose, they win and go again. That rule is yours to decide, and it changes how the game feels: a strict rule is a challenge, and a loose one is friendly for young kids.

## The highest bar isn't always right

Clef always has a top guess, even for an empty canvas. The probabilities only cover the words on your list, and they always add up to 100%, so something has to come first. When we sent an empty canvas with an eight-word list, Clef said "person" with 34%. It wasn't seeing a person: there was simply nothing better on the list.

That's why "the top guess is the target" isn't enough on its own. There are three ways to make winning mean something, and you can combine them:

- A threshold: the target has to be the top guess and above, say, 60%. On that empty canvas, 34% wouldn't win.
- A "nothing" word on your list, described as "Nothing recognizable yet: a blank canvas or a scribble". With one, the empty canvas came back "nothing" at 63%. A random scribble still came back "tree" at 24%, but with "nothing" close behind at 20%, so a threshold still helps.
- A second question in the same request. Clef can answer several questions about one drawing at once, so you can also ask a `noul` question: is the drawing finished enough that a person would recognize it? The empty canvas scored 6% and the scribble 16%, while a clear drawing of a house scored 86%.

## When a guess is slow, fails, or arrives late

A guess usually takes under half a second, but your game shouldn't assume it will. Three things can go wrong:

- It's slow, or never comes back. Give up after a few seconds and say so.
- It fails, because the network drops or the Worker returns an error. Show a message, and let the player try again.
- It arrives late. A player presses Guess and then Skip. The answer for the old drawing arrives after the new round has started, and shows up under the wrong word.

The fix for the last one is a round counter: remember which round a request belongs to, and ignore the answer if the round has moved on:

```tsx title="app/App.tsx"
const sentInRound = round.current;
const res = await fetch("/api/guess", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ image }),
  signal: AbortSignal.timeout(8000),
});
const data = await res.json();
if (sentInRound !== round.current) return; // this answer belongs to an earlier round
```

## Prerequisites

- You've completed [Add a decision model](/courses/build-a-drawing-game/add-a-decision-model) and still have that project on disk.
