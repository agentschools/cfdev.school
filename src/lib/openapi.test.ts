import { describe, expect, it } from "vitest";
import { openApiDocument } from "./openapi";

describe("openApiDocument", () => {
  it("documents POST /api/students", () => {
    const operation = openApiDocument.paths?.["/api/students"]?.post;
    expect(operation).toBeDefined();
    expect(operation?.responses?.["201"]).toBeDefined();
  });

  it("documents GET and PUT /api/students/{id}/interview", () => {
    const path = openApiDocument.paths?.["/api/students/{id}/interview"];
    expect(path?.get?.responses?.["200"]).toBeDefined();
    expect(path?.get?.responses?.["404"]).toBeDefined();
    expect(path?.put?.responses?.["200"]).toBeDefined();
    expect(path?.put?.requestBody).toBeDefined();
  });
});
