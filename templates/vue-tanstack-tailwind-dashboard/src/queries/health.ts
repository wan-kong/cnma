import { useQuery } from "@pinia/colada";
import { getHealth } from "@/api/health";

export function useHealthQuery() {
  return useQuery({
    key: ["health"],
    query: getHealth,
  });
}
