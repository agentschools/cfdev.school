import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// This is a local-only copy of the BUILT config. Never edit the deployment config.
const file = resolve("dist/server/rehearsal.wrangler.json");
const config = JSON.parse(await readFile("dist/server/wrangler.json", "utf8"));
config.name = "cloudflare-dev-school-rehearsal";
config.workers_dev = false;
delete config.routes;
delete config.route;
delete config.account_id;
config.d1_databases = [{ binding: "DB", database_name: "cloudflare-dev-school-rehearsal", database_id: "00000000-0000-0000-0000-000000000001", migrations_dir: resolve("migrations"), remote: false }];
config.kv_namespaces = [{ binding: "SESSION", id: "00000000000000000000000000000001", remote: false }];
await writeFile(file, JSON.stringify(config, null, 2));
console.log(`Local-only school config: ${file}`);
