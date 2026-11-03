import { describe, expect, it } from "vitest";
import { serveMediaWithRange } from "./media-range";

function fakeAssets(body: Uint8Array): Fetcher {
  return {
    fetch: async () =>
      new Response(body, {
        status: 200,
        headers: { "content-type": "video/mp4", etag: '"test-etag"' },
      }),
  } as unknown as Fetcher;
}

describe("serveMediaWithRange", () => {
  const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

  it("adds Accept-Ranges and Content-Length on a normal GET", async () => {
    const res = await serveMediaWithRange(new Request("https://cfdev.school/media/clip.mp4"), fakeAssets(data));
    expect(res.status).toBe(200);
    expect(res.headers.get("accept-ranges")).toBe("bytes");
    expect(res.headers.get("content-length")).toBe("10");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(data);
  });

  it("returns 206 Partial Content with Content-Range for a byte range", async () => {
    const req = new Request("https://cfdev.school/media/clip.mp4", {
      headers: { Range: "bytes=2-5" },
    });
    const res = await serveMediaWithRange(req, fakeAssets(data));
    expect(res.status).toBe(206);
    expect(res.headers.get("accept-ranges")).toBe("bytes");
    expect(res.headers.get("content-range")).toBe("bytes 2-5/10");
    expect(res.headers.get("content-length")).toBe("4");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(new Uint8Array([2, 3, 4, 5]));
  });

  it("handles open-ended and suffix ranges", async () => {
    const openRes = await serveMediaWithRange(
      new Request("https://cfdev.school/media/clip.mp4", { headers: { Range: "bytes=7-" } }),
      fakeAssets(data),
    );
    expect(openRes.status).toBe(206);
    expect(openRes.headers.get("content-range")).toBe("bytes 7-9/10");
    expect(new Uint8Array(await openRes.arrayBuffer())).toEqual(new Uint8Array([7, 8, 9]));

    const suffixRes = await serveMediaWithRange(
      new Request("https://cfdev.school/media/clip.mp4", { headers: { Range: "bytes=-3" } }),
      fakeAssets(data),
    );
    expect(suffixRes.status).toBe(206);
    expect(suffixRes.headers.get("content-range")).toBe("bytes 7-9/10");
    expect(new Uint8Array(await suffixRes.arrayBuffer())).toEqual(new Uint8Array([7, 8, 9]));
  });

  it("returns 416 when the requested range is out of bounds", async () => {
    const res = await serveMediaWithRange(
      new Request("https://cfdev.school/media/clip.mp4", { headers: { Range: "bytes=20-30" } }),
      fakeAssets(data),
    );
    expect(res.status).toBe(416);
    expect(res.headers.get("content-range")).toBe("bytes */10");
  });
});
