import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

/**
 * A stand-in for a D1 database in route tests: an in-memory SQLite database
 * with every migration in migrations/ applied, so tests run the routes' real
 * SQL against the real schema. Covers only the parts of the D1 API the
 * routes use (prepare, bind, first, all, run, batch).
 */
export function createSqliteD1(): D1Database {
  const sqlite = new DatabaseSync(":memory:");
  for (const file of readdirSync("migrations").filter((name) => name.endsWith(".sql")).sort()) {
    sqlite.exec(readFileSync(`migrations/${file}`, "utf8"));
  }

  function statement(sql: string, params: SQLInputValue[] = []) {
    return {
      bind: (...values: SQLInputValue[]) => statement(sql, values),
      first: async () => sqlite.prepare(sql).get(...params) ?? null,
      all: async () => ({ results: sqlite.prepare(sql).all(...params) }),
      run: async () => {
        sqlite.prepare(sql).run(...params);
        return { success: true };
      },
    };
  }

  return {
    prepare: (sql: string) => statement(sql),
    batch: async (statements: ReturnType<typeof statement>[]) => {
      sqlite.exec("BEGIN");
      try {
        const results = [];
        for (const item of statements) results.push(await item.run());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  } as unknown as D1Database;
}
