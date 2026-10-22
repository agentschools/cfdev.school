import { describe, expect, it } from "vitest";
import { claimFirstPromptCopy, PROMPT_COPIED_STORAGE_KEY } from "./agent-prompt-copy";

function fakeStorage() {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

describe("claimFirstPromptCopy", () => {
  it("is true only for the first copy", () => {
    const storage = fakeStorage();
    expect(claimFirstPromptCopy(() => storage)).toBe(true);
    expect(storage.items.get(PROMPT_COPIED_STORAGE_KEY)).toBe("1");
    expect(claimFirstPromptCopy(() => storage)).toBe(false);
  });

  it("treats blocked storage as the first copy", () => {
    expect(
      claimFirstPromptCopy(() => {
        throw new Error("blocked");
      }),
    ).toBe(true);
  });
});
