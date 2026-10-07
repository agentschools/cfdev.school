import { describe, expect, it } from "vitest";
import { openApiDocument } from "./openapi";

describe("openApiDocument", () => {
  it("documents POST /api/students", () => {
    const operation = openApiDocument.paths?.["/api/students"]?.post;
    expect(operation).toBeDefined();
    expect(operation?.responses?.["201"]).toBeDefined();
  });

  it("documents GET and PUT /api/students/{id}/interviews, and not the old /interview", () => {
    const path = openApiDocument.paths?.["/api/students/{id}/interviews"];
    expect(path?.get?.responses?.["200"]).toBeDefined();
    expect(path?.get?.responses?.["404"]).toBeDefined();
    expect(path?.put?.responses?.["200"]).toBeDefined();
    expect(path?.put?.responses?.["400"]).toBeDefined();
    expect(path?.put?.requestBody).toBeDefined();
    expect(openApiDocument.paths?.["/api/students/{id}/interview"]).toBeUndefined();
  });

  it("documents PUT /api/students/{id}/courses", () => {
    const operation = openApiDocument.paths?.["/api/students/{id}/courses"]?.put;
    expect(operation?.requestBody).toBeDefined();
    expect(operation?.responses?.["200"]).toBeDefined();
    expect(operation?.responses?.["400"]).toBeDefined();
    expect(operation?.responses?.["404"]).toBeDefined();
  });

  it("documents GET /api/courses", () => {
    expect(openApiDocument.paths?.["/api/courses"]?.get?.responses?.["200"]).toBeDefined();
  });

  it("documents GET /api/harnesses/{id}", () => {
    const operation = openApiDocument.paths?.["/api/harnesses/{id}"]?.get;
    expect(operation?.responses?.["200"]).toBeDefined();
    expect(operation?.responses?.["404"]).toBeDefined();
  });

  it("documents GET and PUT /api/progress/{studentId}", () => {
    const path = openApiDocument.paths?.["/api/progress/{studentId}"];
    expect(path?.get?.responses?.["200"]).toBeDefined();
    expect(path?.get?.responses?.["404"]).toBeDefined();
    expect(path?.put?.responses?.["200"]).toBeDefined();
    expect(path?.put?.responses?.["400"]).toBeDefined();
    expect(path?.put?.requestBody).toBeDefined();
  });

  it("documents DELETE /api/progress/{studentId}", () => {
    const operation = openApiDocument.paths?.["/api/progress/{studentId}"]?.delete;
    expect(operation?.responses?.["200"]).toBeDefined();
    expect(operation?.responses?.["404"]).toBeDefined();
  });
});
