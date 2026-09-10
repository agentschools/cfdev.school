import { describe, expect, it } from "vitest";
import { openApiDocument } from "./openapi";

describe("openApiDocument", () => {
  it("documents POST /api/students", () => {
    const operation = openApiDocument.paths?.["/api/students"]?.post;
    expect(operation).toBeDefined();
    expect(operation?.responses?.["201"]).toBeDefined();
  });
});
