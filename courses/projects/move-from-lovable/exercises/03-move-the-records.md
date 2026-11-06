---
description: "Export your app’s data from Lovable and migrate it to another database provider."
agent-instructions: |
  Follow the course's teaching approach and the steps below with the learner. Use their chosen app; don't replace it with the example. Independently verify the completion checks and pause on unsupported dependencies.
  1. Mark complete only after the page's checks pass, using the progress procedure in /llms.txt.
---

# Move the records

We'll use a separate Supabase project and its HTTP API. Prepare the database before changing the app's connection. Predict what's in an empty destination before importing anything.

1. Review the destination plan, create a new project, and confirm its project ID differs from the source. Keep secrets in ignored local files or provider dashboards, never Git or conversation logs.
2. Review the source application migration with your agent. Apply only the selected application schema and policies to the fresh destination, excluding seeds and managed auth/storage schemas. Don't use `DROP` or `--clean` to work around conflicts. For the reading list, check against this contract:

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

RLS and the SELECT-only policy allow public reads while preventing public changes. The owner dashboard remains the editor. See [Supabase's RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security).

3. In Lovable, open More → Database, open `books`, and Export CSV. Check it contains all three rows and the `id,title,is_read` columns, including your changed read state. Save the export outside the repo. Import it through the destination Table Editor's CSV import into the empty table. Preserve IDs and booleans; don't recreate rows from the seed prompt.
4. Run this query in both dashboards and compare every value, not just the count:

```sql
select id, title, is_read from public.books order by id;
```

5. Check for missing IDs, duplicate seeds and unexpected columns. Verify SELECT with the destination public key. Try public INSERT, UPDATE and DELETE against disposable probe records: they must be denied or affect zero rows, and no records may change. Save the synthetic comparison in your notes.

For an existing app, use its selected tables and intended access policies instead. Preserve all selected rows, relationships and generated IDs/sequences. If CSV can't represent that data safely, pause and plan a supported restore. Keep excluded services explicitly on the original backend.

[Lovable's full database exports](https://docs.lovable.dev/tips-tricks/external-deployment-hosting) use a different restore procedure involving managed schemas and roles. This small CSV exercise doesn't migrate user accounts or storage.

Before continuing, explain why running only a schema migration wouldn't preserve the changed read state.
