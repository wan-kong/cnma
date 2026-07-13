import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { createTodo, deleteTodo, getTodos, updateTodo } from "@/api/todos";
import type { CreateTodoInput, TodoStatus, UpdateTodoInput } from "@/api/todos";

export const todoKeys = {
  all: ["todos"] as const,
  lists: () => [...todoKeys.all, "list"] as const,
  list: (status: TodoStatus) => [...todoKeys.lists(), { status }] as const,
};

export const todosQueryOptions = (status: TodoStatus) =>
  queryOptions({
    queryKey: todoKeys.list(status),
    queryFn: ({ signal }) => getTodos(status, signal),
    staleTime: 30_000,
  });

export function useCreateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTodoInput) => createTodo(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todoKeys.lists() }),
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTodoInput }) => updateTodo(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todoKeys.lists() }),
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todoKeys.lists() }),
  });
}
