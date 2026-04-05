// TST-FR-601: API cache tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCached,
  setCache,
  cachedFetch,
  invalidateCache,
  getCacheStats,
} from "./apiCache";

beforeEach(() => {
  invalidateCache();
});

describe("apiCache [FR-601]", () => {
  it("returns null for missing cache key [T6.1]", () => {
    expect(getCached("missing")).toBeNull();
  });

  it("stores and retrieves cached data [T6.1]", () => {
    setCache("test-key", { data: "hello" });
    expect(getCached("test-key")).toEqual({ data: "hello" });
  });

  it("returns null for expired cache entry [T6.1]", () => {
    setCache("expired", "value", -1); // TTL<0 → already expired
    expect(getCached("expired")).toBeNull();
  });

  it("cachedFetch returns cached value without calling fetcher [T6.1]", async () => {
    setCache("cached-url", { result: 42 });
    const fetcher = vi.fn().mockResolvedValue({ result: 99 });

    const result = await cachedFetch("cached-url", fetcher);

    expect(result).toEqual({ result: 42 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("cachedFetch calls fetcher on cache miss [T6.1]", async () => {
    const fetcher = vi.fn().mockResolvedValue({ result: 99 });

    const result = await cachedFetch("new-url", fetcher);

    expect(result).toEqual({ result: 99 });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("cachedFetch stores result in cache after fetch [T6.1]", async () => {
    const fetcher = vi.fn().mockResolvedValue("fetched-data");

    await cachedFetch("store-test", fetcher);

    expect(getCached("store-test")).toBe("fetched-data");
  });

  it("cachedFetch deduplicates concurrent requests [T6.1]", async () => {
    let resolvePromise: (v: string) => void;
    const fetcher = vi.fn().mockImplementation(
      () => new Promise<string>((r) => { resolvePromise = r; })
    );

    const p1 = cachedFetch("dedup-key", fetcher);
    const p2 = cachedFetch("dedup-key", fetcher);

    resolvePromise!("result");
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1).toBe("result");
    expect(r2).toBe("result");
    expect(fetcher).toHaveBeenCalledOnce(); // Only 1 call!
  });

  it("invalidateCache clears all entries [T6.1]", () => {
    setCache("a", 1);
    setCache("b", 2);
    invalidateCache();
    expect(getCacheStats().size).toBe(0);
  });

  it("invalidateCache clears by prefix [T6.1]", () => {
    setCache("/routes/1", "r1");
    setCache("/routes/2", "r2");
    setCache("/incidents", "i1");

    invalidateCache("/routes");

    expect(getCached("/routes/1")).toBeNull();
    expect(getCached("/routes/2")).toBeNull();
    expect(getCached("/incidents")).toBe("i1");
  });
});
