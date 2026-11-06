---
description: "Make sure your app and its data work correctly on Cloudflare."
agent-instructions: |
  Follow the course's teaching approach and the steps below with the learner. Use their chosen app; don't replace it with the example. Independently verify the completion checks and pause on unsupported dependencies.
  1. Mark complete only after the page's checks pass, using the progress procedure in /llms.txt.
---

# Verify the migration

Matching records at two URLs could mean both apps still use the same database. Make a destination-only change to prove independence.

1. Predict what each app will show if you change one destination book. Change its read state in the destination dashboard, then fetch data in a separate request and refresh the Workers app. Bypass cached results during verification.
2. Confirm the new state appears on Workers while the source database and original preview keep their original values. For an existing app, use an equivalent synthetic record change within the agreed scope.
3. Confirm public reads work. For the reading list, public INSERT, UPDATE and DELETE must be denied or affect zero rows, leaving records unchanged; verify there are no write controls or private credentials. For your own app, check its intended access policies and retained integrations. Try it from another browser or device.
4. Save the evidence: source/destination project IDs, record IDs and states, verified commit, framework/package versions, deployment URL and remaining services. Keep secret keys out of these notes. Code deployment alone doesn't prove a database migration, and retained dependencies mean the whole backend hasn't moved.

## Rehearse cutover and rollback

This lab ends at a temporary Workers URL. For a real move, keep the original app available, stop source edits, take a final export, compare again, and verify before switching traffic. Keep only one writable system active.

Before new edits happen, returning to the unchanged source is straightforward. After the new database accepts changes, switching a URL back can lose those changes. Stop edits and reconcile them first; a previous code deployment doesn't restore database contents.

Explain that rollback limit to your agent before finishing. Together, review the row comparison and any migration gaps; don't delete the original as a completion step.

## Finish the lab

Save your migration branch and notes. You now maintain access policies, backups, updates and costs. The reading-list path hasn't migrated accounts, files, functions, AI or connectors. Keep the inventory accurate for an existing app too.

Remove lab resources you no longer want to stop ongoing costs, and delete local CSV exports when no longer needed. Keep anything you want to continue using.
