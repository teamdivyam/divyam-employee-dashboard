import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useEventInventoryService from "./useEventInventoryService";

export function usePlanningSources(enabled, editingAllocationId) {
  const { eventId } = useParams();
  const AdminV2Service = useEventInventoryService();
  return useQuery({
    queryKey: ["inventoryv2-allocations", "planning-sources", eventId, editingAllocationId || null], enabled,
    queryFn: async () => {
      const entries = [];
      let page = 1;
      while (true) {
        const response = await AdminV2Service.listInventoryV2Allocations({ page, limit: 100, ...(editingAllocationId ? { editingAllocationId } : {}) });
        const data = response.data?.data;
        if (!Array.isArray(data?.entries) || typeof data.pagination?.hasNextPage !== "boolean") throw new Error("Source allocations could not be loaded.");
        entries.push(...data.entries);
        if (!data.pagination.hasNextPage) return entries;
        if (!data.entries.length) throw new Error("Source allocation list is incomplete.");
        page += 1;
      }
    }, staleTime: 30000, refetchOnMount: "always",
  });
}

