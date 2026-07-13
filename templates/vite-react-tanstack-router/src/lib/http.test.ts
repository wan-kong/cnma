import { describe, expect, it, vi } from "vite-plus/test";
import { HttpError, createHttpClient } from "./http";

describe("createHttpClient", () => {
  it("序列化查询参数并合并请求头", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ items: [1, 2] }));
    const client = createHttpClient({
      baseUrl: "/api",
      defaultHeaders: { accept: "application/json", "x-client": "demo" },
      fetch: fetcher,
    });

    await expect(
      client.get<{ items: number[] }>("/todos", {
        query: { status: "active", tag: ["query", "fetch"], ignored: undefined },
        headers: { "x-client": "test" },
      }),
    ).resolves.toEqual({ items: [1, 2] });

    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("/api/todos?status=active&tag=query&tag=fetch");
    expect(new Headers(init?.headers).get("accept")).toBe("application/json");
    expect(new Headers(init?.headers).get("x-client")).toBe("test");
  });

  it("自动序列化 JSON 请求体并支持空响应", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ id: "1", title: "测试" }, { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = createHttpClient({ fetch: fetcher });

    await client.post("/todos", { title: "测试" });
    const [, init] = fetcher.mock.calls[0];
    expect(init?.body).toBe('{"title":"测试"}');
    expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
    await expect(client.delete("/todos/1")).resolves.toBeUndefined();
  });

  it("将非成功响应转换为带状态码和响应数据的 HttpError", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ message: "任务不存在" }, { status: 404 }));
    const client = createHttpClient({ fetch: fetcher });

    const promise = client.get("/todos/missing");
    await expect(promise).rejects.toEqual(
      expect.objectContaining<HttpError>({
        name: "HttpError",
        message: "任务不存在",
        status: 404,
        data: { message: "任务不存在" },
      }),
    );
  });
});
