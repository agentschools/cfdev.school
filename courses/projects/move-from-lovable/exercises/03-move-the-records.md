---
description: "Export your app’s data from Lovable and migrate it to another database provider."
agent-instructions: |
  Follow the interview's app and scope throughout, using a disposable copy and synthetic records. Adapt book names, row counts and policies to that app. Verify all selected data, relationships and sequences. Pause if CSV cannot preserve them. Document retained services and verify their integrations; code deployment alone doesn't complete data migration.

  1. Help the student prepare a new Supabase project after reviewing its plan. Confirm source and destination project IDs differ. Keep secrets in local ignored files or the provider's dashboard, never conversation logs or Git. Ask what should be in the new database before importing any rows; wait for their prediction.
  2. Review the exported application migration. Recreate only public.books, its SELECT grant, RLS and SELECT-only policy at the destination, using the small reference below to check the result. Exclude seeds, auth/storage schemas, unrelated objects and source-specific roles. Apply once to a fresh destination; never use DROP or --clean to work around conflicts.
  3. In Lovable, open More → Database, open books and Export CSV. Verify this is a complete three-row export with id,title,is_read, including the dashboard edit from exercise 1. Save it outside the repo. Import it through the destination Table Editor's CSV import into the empty books table, preserving IDs and booleans. Do not regenerate the rows from the original seed prompt.
  4. Query both databases with the ordered SELECT below. Compare every ID, title and boolean, not just the count. Confirm no extra seed rows, no missing IDs and no unexpected columns. Record a synthetic before/after comparison in the learner's notes. Check SELECT with the destination public key and test that public writes are rejected and leave records unchanged.
  5. Ask the student why running only the schema migration wouldn't have brought their changed read state across. Wait for their explanation.
  6. Mark complete with PUT /api/progress/{studentId} as /llms.txt describes.
---

# Move the records

Using your own app? Keep its schema and features. Your agent adapts these checks to your agreed scope; the book names and three rows below describe the reading-list path. Some services may remain on the original backend, and your migration notes should say which.

Prepare the destination before changing the app's connection. We're moving one small table with CSV, which makes the difference between structure and records easy to see.

Your agent reviews the source migration against this contract, then applies the equivalent to the new Supabase project. Don't insert the seed books again.

```sql
create table public.books (
  id integer primary key,
  title text not null,
  is_read boolean not null default false
);
alter table public.books enable row level security;
grant select on public.books to anon;
create policy "Anyone can read books"
  on public.books for select to anon using (true);
```

With RLS enabled and no write policies, the public client can read but can't change these rows. The owner dashboard remains your editing tool. See [Supabase's RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security).

Export `books` from Lovable and import the CSV into the empty destination table. Then run this in both dashboards:

```sql
select id, title, is_read from public.books order by id;
```

Compare all three rows, including the state you changed earlier. Keep the CSV private and outside the repository, even though this lab uses synthetic records.

Lovable also offers full database exports. Those require a different restore procedure, including managed schemas and roles; this CSV exercise doesn't demonstrate user, storage, or whole-database migration. See [Lovable's migration guide](https://docs.lovable.dev/tips-tricks/external-deployment-hosting) before attempting a larger move.
