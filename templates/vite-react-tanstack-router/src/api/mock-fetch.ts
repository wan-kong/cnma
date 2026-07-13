import type { CreateTodoInput, Todo, UpdateTodoInput } from "./todos";

const STORAGE_KEY = "tanstack-todo-demo";
const initialTodos: Todo[] = [
  { id: "query-keys", title: "为资源定义稳定的 Query Key", completed: true, createdAt: 1 },
  { id: "request-layer", title: "用 Fetch 封装统一请求层", completed: false, createdAt: 2 },
  { id: "mutation", title: "在 Mutation 成功后失效列表缓存", completed: false, createdAt: 3 },
];

function readTodos() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? (JSON.parse(saved) as Todo[]) : initialTodos;
}

function writeTodos(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function json(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}

async function requestBody<T>(init?: RequestInit) {
  const body = init?.body;
  if (typeof body === "string") return JSON.parse(body) as T;
  if (body instanceof Blob) return JSON.parse(await body.text()) as T;
  return {} as T;
}

export const mockFetch: typeof globalThis.fetch = async (input, init) => {
  await new Promise((resolve) => setTimeout(resolve, 280));
  if (init?.signal?.aborted) throw init.signal.reason;

  const path = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const url = new URL(path, window.location.origin);
  const method = init?.method ?? "GET";
  const id = url.pathname.match(/^\/api\/todos\/([^/]+)$/)?.[1];
  let todos = readTodos();

  if (url.pathname === "/api/todos" && method === "GET") {
    const status = url.searchParams.get("status") ?? "all";
    const filtered = todos.filter((todo) =>
      status === "active" ? !todo.completed : status === "completed" ? todo.completed : true,
    );
    return json(filtered.sort((a, b) => b.createdAt - a.createdAt));
  }

  if (url.pathname === "/api/todos" && method === "POST") {
    const payload = await requestBody<CreateTodoInput>(init);
    const todo: Todo = {
      id: crypto.randomUUID(),
      title: payload.title,
      completed: false,
      createdAt: Date.now(),
    };
    writeTodos([todo, ...todos]);
    return json(todo, { status: 201 });
  }

  const current = todos.find((todo) => todo.id === id);
  if (!current) return json({ message: "任务不存在或已被删除" }, { status: 404 });

  if (method === "PATCH") {
    const payload = await requestBody<UpdateTodoInput>(init);
    const updated = { ...current, ...payload };
    todos = todos.map((todo) => (todo.id === id ? updated : todo));
    writeTodos(todos);
    return json(updated);
  }

  if (method === "DELETE") {
    writeTodos(todos.filter((todo) => todo.id !== id));
    return new Response(null, { status: 204 });
  }

  return json({ message: "接口不存在" }, { status: 404 });
};
