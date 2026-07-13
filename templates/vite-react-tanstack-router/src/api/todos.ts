import { http } from "./client";

export type TodoStatus = "all" | "active" | "completed";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface CreateTodoInput {
  title: string;
}

export type UpdateTodoInput = Partial<Pick<Todo, "title" | "completed">>;

export function getTodos(status: TodoStatus, signal?: AbortSignal) {
  return http.get<Todo[]>("/todos", { query: { status }, signal });
}

export function createTodo(input: CreateTodoInput) {
  return http.post<Todo>("/todos", input);
}

export function updateTodo(id: string, input: UpdateTodoInput) {
  return http.patch<Todo>(`/todos/${id}`, input);
}

export function deleteTodo(id: string) {
  return http.delete<void>(`/todos/${id}`);
}
