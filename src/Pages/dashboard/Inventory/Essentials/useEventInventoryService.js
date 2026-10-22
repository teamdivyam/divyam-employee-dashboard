import { useQuery } from "@tanstack/react-query";
import useAuthSession from "@/hooks/useAuthSession";
import { hasAllocationEditRole } from "./allocationEditAccess";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import EventService from "@/services/event-booking-workspace.service";

// The employee API scopes every inventory request to an assigned event.
// Keep the shared allocation UI on that boundary rather than admin-only routes.
export function createEventInventoryService(eventId, session, canEditAssignedEvent = false) {
  const requireEvent = () => {
    if (!eventId) throw new Error("Select an assigned event first.");
    return eventId;
  };
  const listAllocations = (params = {}) =>
    EventService.listCompanyInventoryAllocations({ ...params, eventId: requireEvent() });
  const listItems = (params = {}) =>
    EventService.getCompanyInventoryItems({ ...params, eventId: requireEvent() });
  const findRecord = async (fetchPage, field, matches) => {
    let page = 1;
    while (true) {
      const response = await fetchPage({ page, limit: 100 });
      const data = response.data?.data;
      const rows = data?.[field];
      if (!Array.isArray(rows)) throw new Error("Inventory information is unavailable. Please retry.");
      const found = rows.find(matches);
      if (found) return found;
      if (!data.pagination?.hasNextPage && page >= (data.pagination?.totalPages || 1)) break;
      if (!rows.length) break;
      page += 1;
    }
    throw Object.assign(new Error("This inventory record is no longer available for the assigned event."), { code: "INVENTORY_RECORD_NOT_FOUND" });
  };
  return {
    accessRole: session?.accessRole,
    canUpdateRequirements: hasAllocationEditRole(session),
    canUpdateAllocations: hasAllocationEditRole(session) || (session?.accessRole === "Employee" && canEditAssignedEvent),
    getAllocationReportSource: allocationId => EventService.getCompanyInventoryAllocationReportSource({ eventId: requireEvent(), allocationId }),
    getInventoryV2Items: listItems,
    listInventoryV2Allocations: listAllocations,
    getInventoryV2AllocationById: async (id) => ({
      data: { data: await findRecord(listAllocations, "entries", row => String(row._id) === String(id)) },
    }),
    getInventoryV2ItemById: async (id) => ({
      data: { data: { item: await findRecord(listItems, "items", row => [row._id, row.itemId].some(value => String(value) === String(id))) } },
    }),
    createInventoryV2Allocation: (payload) =>
      EventService.createCompanyInventoryAllocation({ eventId: requireEvent(), payload }),
    updateInventoryV2Allocation: (allocationId, payload) =>
      EventService.updateCompanyInventoryAllocation({ eventId: requireEvent(), allocationId, payload }),
  };
}

export default function useEventInventoryService() {
  const { eventId } = useParams();
  const { data: session } = useAuthSession();
  const capability = useQuery({
    queryKey: ["event-allocation-edit-access", eventId, session?.employeeId],
    queryFn: async () => (await EventService.getCompanyInventoryAllocationEditAccess({ eventId })).data?.data?.canEditAllocations === true,
    enabled: Boolean(eventId && session?.accessRole === "Employee"),
    staleTime: 0,
    retry: false,
  });
  return useMemo(() => createEventInventoryService(eventId, session, capability.data === true && !capability.isError), [eventId, session, capability.data, capability.isError]);
}
