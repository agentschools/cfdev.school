/**
 * Serves static `/media/*` assets with HTTP Range support (`206 Partial Content`
 * and `Accept-Ranges: bytes`). Workers Static Assets returns `200 OK` without
 * `Accept-Ranges` or `Content-Range`, which prevents browsers from seeking in
 * `<video>` elements.
 */
export async function serveMediaWithRange(request: Request, assets: Fetcher): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return assets.fetch(request);
  }

  // Fetch the underlying asset without Range so ASSETS returns the full body.
  const assetHeaders = new Headers(request.headers);
  assetHeaders.delete("range");
  assetHeaders.delete("if-range");
  const asset = await assets.fetch(new Request(request.url, { method: "GET", headers: assetHeaders }));
  if (!asset.ok || asset.status === 304) return asset;

  const bytes = new Uint8Array(await asset.arrayBuffer());
  const total = bytes.byteLength;

  const headers = new Headers(asset.headers);
  headers.set("accept-ranges", "bytes");

  const rangeHeader = request.headers.get("range");
  if (!rangeHeader) {
    headers.set("content-length", String(total));
    return new Response(request.method === "HEAD" ? null : bytes, { status: 200, headers });
  }

  const parsed = parseByteRange(rangeHeader, total);
  if (!parsed) {
    headers.set("content-range", `bytes */${total}`);
    headers.delete("content-length");
    return new Response(null, { status: 416, headers });
  }

  const { start, end } = parsed;
  const slice = bytes.subarray(start, end + 1);
  headers.set("content-range", `bytes ${start}-${end}/${total}`);
  headers.set("content-length", String(slice.byteLength));
  return new Response(request.method === "HEAD" ? null : slice, { status: 206, headers });
}

function parseByteRange(header: string, total: number): { start: number; end: number } | null {
  if (total <= 0) return null;
  // Single byte range: bytes=start-end, bytes=start-, or bytes=-suffix
  const match = header.trim().match(/^bytes=(\d*)-(\d*)$/i);
  if (!match) return null;
  const [, startStr, endStr] = match;
  if (!startStr && !endStr) return null;

  if (!startStr) {
    const suffix = Number(endStr);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    const start = Math.max(0, total - suffix);
    return { start, end: total - 1 };
  }

  const start = Number(startStr);
  const end = endStr ? Math.min(Number(endStr), total - 1) : total - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= total || start > end) {
    return null;
  }
  return { start, end };
}
