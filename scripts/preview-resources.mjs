// Trusted controller: never import code or configuration from the PR artifact.
export function previewIdentity(number) {
  if (!/^[1-9][0-9]{0,8}$/.test(String(number))) throw new Error('Invalid PR number');
  const worker = `cloudflare-dev-school-pr-${number}`;
  return { worker, database: `${worker}-db`, session: `${worker}-session` };
}

export function previewConfig(number, databaseId, sessionId) {
  if (!/^[0-9a-f-]{36}$/.test(databaseId) || databaseId === '2c5a6216-085a-4896-8d0f-13255adbdefc') throw new Error('Unsafe D1 ID');
  if (!/^[0-9a-f]{32}$/.test(sessionId) || sessionId === '994f1484fe95462f89b748b3ee7be2ff') throw new Error('Unsafe KV ID');
  const names = previewIdentity(number);
  // Deliberate allowlist. Never spread PR Wrangler config: it could add a
  // production binding, route, build command, service, or script_name.
  return {
    name: names.worker,
    main: './dist/server/entry.mjs',
    compatibility_date: '2026-08-31',
    compatibility_flags: ['nodejs_compat'],
    workers_dev: true,
    no_bundle: true,
    rules: [{ type: 'ESModule', globs: ['**/*.js', '**/*.mjs'] }],
    assets: { binding: 'ASSETS', directory: './dist/client' },
    images: { binding: 'IMAGES' },
    d1_databases: [{ binding: 'DB', database_name: names.database, database_id: databaseId, migrations_dir: './migrations' }],
    kv_namespaces: [{ binding: 'SESSION', id: sessionId }],
    durable_objects: { bindings: [{ name: 'PROGRESS_HUB', class_name: 'ProgressHub' }] },
    migrations: [{ tag: 'v1', new_sqlite_classes: ['ProgressHub'] }],
  };
}

export function resourceManager(api, number) {
  const names = previewIdentity(number);
  async function lookup() {
    const databases = await api(`/d1/database?name=${names.database}&per_page=100`);
    const matching = databases.filter(item => item.name === names.database);
    const namespaces = [];
    for (let page = 1; ; page++) {
      const batch = await api(`/storage/kv/namespaces?per_page=100&page=${page}`);
      namespaces.push(...batch.filter(item => item.title === names.session));
      if (batch.length < 100) break;
    }
    if (matching.length > 1 || namespaces.length > 1) throw new Error('Ambiguous preview resources');
    return { database: matching[0], session: namespaces[0] };
  }
  return {
    async provision() {
      const found = await lookup();
      const database = found.database ?? await api('/d1/database', { method: 'POST', body: { name: names.database } });
      const session = found.session ?? await api('/storage/kv/namespaces', { method: 'POST', body: { title: names.session } });
      // Validates both IDs before migrations or deployment.
      return previewConfig(number, database.uuid, session.id);
    },
    async destroy() {
      const { database, session } = await lookup();
      // Validate everything before the first delete. Missing is idempotent;
      // auth, network and other failures are never mistaken for missing.
      previewConfig(number, database?.uuid ?? '00000000-0000-0000-0000-000000000000', session?.id ?? '00000000000000000000000000000000');
      await api(`/workers/scripts/${names.worker}`, { method: 'DELETE', missingOK: true });
      if (database) await api(`/d1/database/${database.uuid}`, { method: 'DELETE', missingOK: true });
      if (session) await api(`/storage/kv/namespaces/${session.id}`, { method: 'DELETE', missingOK: true });
    },
  };
}
