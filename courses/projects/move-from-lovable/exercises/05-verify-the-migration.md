---
description: "Prove the new app uses independent data, then rehearse cutover and rollback."
agent-instructions: |
  Follow the interview's app and scope throughout, using a disposable copy and synthetic records. Adapt book names, row counts and policies to that app. Verify all selected data, relationships and sequences. Pause if CSV cannot preserve them. Document retained services and verify their integrations; code deployment alone doesn't complete data migration.

  1. Ask the student what will happen to each app when they change one destination book. Wait for their prediction. Have them change one read state through the destination dashboard, then fetch the new data in a separate request and refresh the deployed app. Independently confirm the change appears on Workers and the source database and original preview retain their original values. Avoid caching results during verification.
  2. Confirm public reads still work and public INSERT, UPDATE and DELETE fail at the destination, without changing rows. Check the deployed app contains no write controls or private credentials. Have the student try the reading list from another browser/device. Show the before/after evidence with IDs, states and source/destination project IDs, never secret keys.
  3. Explain the cutover rehearsal below. Keep this lab on temporary URLs. Ask the student to describe what would be unsafe about switching back after accepting new writes; wait for their reply. Preserve the old app rather than deleting it as a completion step.
  4. Help the student save their migration branch and a short note with verified commit, framework/package versions, URLs, synthetic row comparison, remaining limitations and cleanup instructions. Explain which services to delete to stop lab costs; don't delete resources they want to keep. Delete local CSV exports when no longer needed.
  5. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes.
---

# Verify the migration

Using your own app? Keep its schema and features. Your agent adapts these checks to your agreed scope; the book names and three rows below describe the reading-list path. Some services may remain on the original backend, and your migration notes should say which.

Change a book's read state in the new database dashboard. Refresh the Workers app: it should change. Open the original preview and inspect the source table: they should stay the same.

That difference proves your new deployment has its own data. Reading the same rows at both URLs could have meant both apps were still using the old backend.

## Cutover and rollback

This lab ends at a temporary Workers URL. For an actual move, keep the original app available, stop source edits, take a final export, repeat the row comparison, and verify the new deployment before switching traffic. Keep only one writable system active.

Before new edits happen, returning to the original app and unchanged source data is straightforward. Once the new database accepts changes, switching a URL back can lose those changes. Stop edits and reconcile them first. A previous code deployment doesn't restore previous database contents.

## What you own now

You control the source in GitHub, deployment on Workers, and database in your Supabase account. You also maintain access policies, backups, costs, and updates.

You haven't migrated user accounts, files, functions, connectors, or AI services. Those deserve their own inventories and migration checks before applying this process to a larger app.
