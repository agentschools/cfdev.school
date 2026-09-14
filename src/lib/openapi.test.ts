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

  it("documents GET /api/exercises and GET /api/exercises/{slug}", () => {
    expect(openApiDocument.paths?.["/api/exercises"]?.get?.responses?.["200"]).toBeDefined();
    const bySlug = openApiDocument.paths?.["/api/exercises/{slug}"];
    expect(bySlug?.get?.responses?.["200"]).toBeDefined();
    expect(bySlug?.get?.responses?.["404"]).toBeDefined();
  });

  it("documents GET and PUT /api/progress/{studentId}", () => {
    const path = openApiDocument.paths?.["/api/progress/{studentId}"];
    expect(path?.get?.responses?.["200"]).toBeDefined();
    expect(path?.get?.responses?.["404"]).toBeDefined();
    expect(path?.put?.responses?.["200"]).toBeDefined();
    expect(path?.put?.responses?.["400"]).toBeDefined();
    expect(path?.put?.requestBody).toBeDefined();
  });
});
