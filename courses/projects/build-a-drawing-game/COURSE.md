---
name: build-a-drawing-game
description: "Build a drawing game where an AI model guesses what players draw: your theme, your word list, your rules. You'll draw on a canvas, ask a decision model on Workers AI for a guess, turn it into a game, and put it online for others to play."
compatibility: "Requires the Agent setup course, a Cloudflare account (the Workers Free plan works), Node.js, and the cf CLI. Built with React; you don't need to know it already."
metadata:
  author: Cloudflare Dev School
---

# Build a drawing game

<figure>
<video controls playsinline preload="none" width="1920" height="1080" crossorigin="anonymous" poster="https://media.cfdev.school/courses/build-a-drawing-game/clef-pictionary-poster.jpg">
<source src="https://media.cfdev.school/courses/build-a-drawing-game/clef-pictionary.mp4" type="video/mp4">
<track kind="captions" src="https://media.cfdev.school/courses/build-a-drawing-game/clef-pictionary-captions.vtt" srclang="en" label="English">
<a href="https://x.com/Jilles/status/2108669382322761992">Watch Jilles's video on X</a>.
</video>
<figcaption>Clef Pictionary, by <a href="https://x.com/Jilles">Jilles Soeters</a>. Used with permission. <a href="https://x.com/Jilles/status/2108669382322761992">Original post</a> · <a href="https://github.com/jillesme/clef-pictionary">Source code</a> · <a href="https://clef.jilles.fyi">Play it</a></figcaption>
</figure>

In this five-minute video, Jilles draws shapes, animals, and Cloudflare icons on a canvas, and a model guesses each one in under half a second. The bars beside the drawing are the model's answer: a probability for every word on his list. The model is [Clef](https://developers.cloudflare.com/workers-ai/models/clef-flash/), a decision model on Workers AI. It doesn't write a reply, it scores the options you give it. Changing the game means changing the list: no training, no new model.

This is a project course. You'll build your own version, and it doesn't have to look like his. So, before you start: what would you make yours about? Farm animals for your kids, inside jokes for a party, things in your kitchen, your team's tools?

## What you'll build

A drawing game, as a React app on one Worker:

- a canvas that works with a mouse, a finger, or a pen;
- a Worker endpoint that sends each drawing to Clef, with your word list, and returns a probability for every word;
- rounds, a win rule you choose, and a game that copes with slow or failed guesses;
- limits on what each guess costs and how many guesses a minute it allows, so you can share it without worrying.

There's no database, no accounts, and no multiplayer: a drawing goes in, probabilities come out.
