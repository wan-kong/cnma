import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Circle, LoaderCircle, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Todo, TodoStatus } from "@/api/todos";
import { HttpError } from "@/lib/http";
import { todosQueryOptions, useCreateTodo, useDeleteTodo, useUpdateTodo } from "@/queries/todos";

export const Route = createFileRoute("/")({ component: Home });

const filters: Array<{ value: TodoStatus; label: string }> = [
  { value: "all", label: "全部" },
  { value: "active", label: "进行中" },
  { value: "completed", label: "已完成" },
];

function errorMessage(error: unknown) {
  return error instanceof HttpError ? error.message : "请求未完成，请重试";
}

function TodoRow({ todo }: { todo: Todo }) {
  const updateMutation = useUpdateTodo();
  const deleteMutation = useDeleteTodo();
  const pending = updateMutation.isPending || deleteMutation.isPending;

  return (
    <li className="group flex min-h-16 items-center gap-3 border-b border-border/80 py-3 last:border-b-0">
      <button
        type="button"
        aria-label={todo.completed ? `将“${todo.title}”标为未完成` : `完成“${todo.title}”`}
        disabled={pending}
        onClick={() =>
          updateMutation.mutate({ id: todo.id, input: { completed: !todo.completed } })
        }
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-[transform,color] duration-150 active:scale-95 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [@media(hover:hover)]:hover:text-primary"
      >
        {updateMutation.isPending ? (
          <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
        ) : todo.completed ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3.5" aria-hidden="true" />
          </span>
        ) : (
          <Circle className="size-5" aria-hidden="true" />
        )}
      </button>
      <span
        className={`min-w-0 flex-1 text-sm leading-6 transition-[opacity,color] duration-150 ${
          todo.completed ? "text-muted-foreground line-through opacity-70" : "text-foreground"
        }`}
      >
        {todo.title}
      </span>
      <button
        type="button"
        aria-label={`删除“${todo.title}”`}
        disabled={pending}
        onClick={() => deleteMutation.mutate(todo.id)}
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-70 transition-[transform,opacity,color] duration-150 active:scale-95 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:outline-none [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:hover:text-destructive"
      >
        {deleteMutation.isPending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 className="size-4" aria-hidden="true" />
        )}
      </button>
    </li>
  );
}

function Home() {
  const [status, setStatus] = useState<TodoStatus>("all");
  const [title, setTitle] = useState("");
  const todosQuery = useQuery(todosQueryOptions(status));
  const createMutation = useCreateTodo();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = title.trim();
    if (!value) return;
    createMutation.mutate(
      { title: value },
      {
        onSuccess: () => setTitle(""),
      },
    );
  }

  const total = todosQuery.data?.length ?? 0;

  return (
    <>
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-50 -translate-y-20 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground focus:translate-y-0"
      >
        跳到主要内容
      </a>
      <main
        id="main-content"
        className="mx-auto min-h-screen w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-20"
      >
        <header className="mb-10">
          <div className="mb-4 flex items-center gap-2 text-xs font-medium tracking-[0.12em] text-primary uppercase">
            <span className="size-2 rounded-full bg-primary" />
            TanStack Query + Fetch
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.022em] text-balance sm:text-4xl">
            Todo List 请求示例
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground text-pretty sm:text-base">
            一个可直接运行的 CRUD Demo，展示统一 HTTP 客户端、领域 API、Query Key
            工厂与缓存失效策略。
          </p>
        </header>

        <section
          aria-labelledby="todo-heading"
          className="rounded-xl bg-card p-4 shadow-[0_1px_3px_rgba(20,35,28,0.12)] sm:p-6"
        >
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2 id="todo-heading" className="text-lg font-semibold tracking-[-0.012em]">
              今日任务
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums">{total} 项</span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="todo-title" className="sr-only">
              新增任务
            </label>
            <input
              id="todo-title"
              value={title}
              maxLength={80}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="输入任务，按回车添加"
              className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
            <button
              type="submit"
              disabled={!title.trim() || createMutation.isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-[transform,opacity] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {createMutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              添加任务
            </button>
          </form>

          {createMutation.isError && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {errorMessage(createMutation.error)}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-border">
            <div role="group" aria-label="筛选任务" className="flex gap-1">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={status === filter.value}
                  onClick={() => setStatus(filter.value)}
                  className="relative min-h-10 px-3 text-sm text-muted-foreground transition-[transform,color] duration-150 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none aria-pressed:text-foreground aria-pressed:after:absolute aria-pressed:after:inset-x-2 aria-pressed:after:bottom-[-1px] aria-pressed:after:h-0.5 aria-pressed:after:rounded-full aria-pressed:after:bg-primary"
                >
                  {filter.label}
                </button>
              ))}
            </div>
            {todosQuery.isFetching && !todosQuery.isPending && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <RefreshCw className="size-3 animate-spin" /> 正在同步
              </span>
            )}
          </div>

          {todosQuery.isPending ? (
            <div className="flex min-h-44 items-center justify-center text-sm text-muted-foreground">
              <LoaderCircle className="mr-2 size-4 animate-spin" /> 正在加载任务
            </div>
          ) : todosQuery.isError ? (
            <div
              role="alert"
              className="flex min-h-44 flex-col items-center justify-center gap-3 text-center"
            >
              <p className="text-sm text-destructive">{errorMessage(todosQuery.error)}</p>
              <button
                type="button"
                onClick={() => todosQuery.refetch()}
                className="min-h-10 rounded-lg px-4 text-sm font-medium text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                重新请求
              </button>
            </div>
          ) : todosQuery.data.length === 0 ? (
            <div className="flex min-h-44 flex-col items-center justify-center text-center">
              <Check className="mb-3 size-5 text-primary" />
              <p className="text-sm font-medium">这个分类暂无任务</p>
              <p className="mt-1 text-xs text-muted-foreground">切换分类或添加一条新任务</p>
            </div>
          ) : (
            <ul aria-live="polite">
              {todosQuery.data.map((todo) => (
                <TodoRow key={todo.id} todo={todo} />
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <code>GET /api/todos</code>
          <code>POST /api/todos</code>
          <code>PATCH /api/todos/:id</code>
          <code>DELETE /api/todos/:id</code>
        </footer>
      </main>
    </>
  );
}
