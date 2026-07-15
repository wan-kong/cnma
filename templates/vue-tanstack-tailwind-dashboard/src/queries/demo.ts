import { useMutation, useQuery, useQueryCache } from "@pinia/colada";
import type { MaybeRefOrGetter } from "vue";
import { toValue } from "vue";
import {
  getDemoAnalytics,
  getDemoRecord,
  getDemoRecords,
  getDemoSummary,
  updateDemoRecord,
  type DemoRecordQuery,
  type DemoRecordStatus,
} from "@/api/demo";

export function useDemoSummaryQuery() {
  return useQuery({
    key: ["demo", "summary"],
    query: getDemoSummary,
    staleTime: 30_000,
  });
}

export function useDemoRecordsQuery(getParams: () => DemoRecordQuery) {
  return useQuery({
    key: () => ["demo", "records", getParams()],
    query: () => getDemoRecords(getParams()),
    placeholderData: (previous) => previous,
  });
}

export function useDemoRecordQuery(id: MaybeRefOrGetter<number | null>) {
  return useQuery({
    key: () => ["demo", "record", toValue(id) ?? "none"],
    query: () => getDemoRecord(toValue(id) as number),
    enabled: () => toValue(id) !== null,
  });
}

export function useDemoRecordStatusMutation() {
  const queryCache = useQueryCache();
  return useMutation({
    mutation: ({ id, status }: { id: number; status: DemoRecordStatus }) =>
      updateDemoRecord(id, { status }),
    async onSettled() {
      await Promise.all([
        queryCache.invalidateQueries({ key: ["demo", "summary"] }),
        queryCache.invalidateQueries({ key: ["demo", "records"] }),
        queryCache.invalidateQueries({ key: ["demo", "record"] }),
      ]);
    },
  });
}

export function useDemoAnalyticsQuery() {
  return useQuery({
    key: ["demo", "analytics"],
    query: getDemoAnalytics,
    staleTime: 30_000,
  });
}
