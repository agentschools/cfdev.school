import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BACKGROUND_CONTEXT as context } from "@earendil-works/chord/context";
import { createModels, fauxProvider, fauxAssistantMessage } from "@earendil-works/pi-ai";
import { AssistantEntry, createRegistry, Harness } from "@earendil-works/pi-durable";
import { openNodeSqliteStorage } from "@earendil-works/pi-durable/storage/sqlite/node";

test("real Pi Durable persists student turns and deduplicates a submission after SQLite reopen (simulated model)", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cfds-pi-"));
  const path = join(directory, "session.sqlite");
  const faux = fauxProvider({ provider: "test-only", models: [{ id: "simulated" }] });
  faux.setResponses([
    fauxAssistantMessage("Who is your game for?"),
    messages => {
      assert(JSON.stringify(messages).includes("My kids"));
      assert(JSON.stringify(messages).includes("Who is your game for?"));
      return fauxAssistantMessage("Thanks. Your game is for your kids.");
    },
  ]);
  const models = createModels();
  models.setProvider(faux.provider);
  const open = async () => Harness.open(await openNodeSqliteStorage(path), { models, registry: createRegistry(), settings: { retry: { enabled: false }, documentRetentionMs: 0 } }, context);
  let harness = await open();
  try {
    let root = await harness.root(context, { agent: { model: { provider: "test-only", modelId: "simulated" } } });
    const first = await root.submit({ type: "input", content: "Interview me", requestId: "first" }, context);
    assert.equal((await first.wait(context)).status, "done");
    await harness.close(context);
    harness = await open();
    root = await harness.root(context);
    const duplicate = await root.submit({ type: "input", content: "Interview me", requestId: "first" }, context);
    assert.equal((await duplicate.wait(context)).status, "done");
    assert.equal(faux.state.callCount, 1);
    const second = await root.submit({ type: "input", content: "My kids", requestId: "second" }, context);
    const result = await second.wait(context);
    assert.equal(result.status, "done");
    const answer = await root.commit(tx => tx.entry(AssistantEntry, result.answer), context);
    assert(JSON.stringify(answer.model).includes("your kids"));
    assert.equal(faux.state.callCount, 2);
  } finally {
    await harness.close(context);
    await rm(directory, { recursive: true, force: true });
  }
});
