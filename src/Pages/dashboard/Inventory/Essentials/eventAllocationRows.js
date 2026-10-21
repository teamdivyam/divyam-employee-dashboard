// Keep combined event reads separate from single-document menu/Prepare queries.
export const eventAllocationDetailKey = allocationId => ["inventoryv2-allocations", "event-view", allocationId];

const referenceId = value => String(value?._id || value || "");

export function eventAllocations(allocations, event, crmCustomerId) {
  const eventId = referenceId(event);
  const customerId = referenceId(crmCustomerId);
  return allocations.filter(allocation => allocation.status !== "Cancelled" && (
    eventId ? referenceId(allocation.event) === eventId
      : !allocation.event && customerId && referenceId(allocation.crmCustomerId) === customerId
  ));
}

// These are display rows, never a replacement allocation document or PATCH payload.
export function allocationDisplayRows(allocations) {
  const keys = new Set();
  return allocations.filter(allocation => allocation.status !== "Cancelled").flatMap(allocation =>
    allocation.items.filter(line => line.status !== "Cancelled").map(line => {
      const ownership = {
        eventId: referenceId(allocation.event),
        allocationId: referenceId(allocation._id),
        allocationLineId: referenceId(line._id),
      };
      const rowKey = JSON.stringify(Object.values(ownership));
      if (!ownership.allocationId || !ownership.allocationLineId || keys.has(rowKey)) {
        throw new Error("Allocation row identities are incomplete or repeated. Refresh before continuing.");
      }
      keys.add(rowKey);
      return { ...line, ownership, rowKey, owningAllocation: allocation };
    })
  );
}

// Sum the server's line summaries, not stock quantities or coverage calculations.
export function eventAllocationSummary(allocations) {
  const active = allocations.filter(allocation => allocation.status !== "Cancelled");
  if (!active.length || active.some(allocation => !allocation.summary)) return undefined;
  const summary = {};
  for (const field of ["requirementLines", "readyLines", "shortageLines"]) {
    if (active.some(allocation => !Number.isFinite(allocation.summary[field]))) return undefined;
    summary[field] = active.reduce((total, allocation) => total + allocation.summary[field], 0);
  }
  summary.allocationProgress = summary.requirementLines
    ? Math.round(summary.readyLines / summary.requirementLines * 100) : 0;
  return summary;
}

export async function loadEventAllocationDetail(service, allocationId) {
  const response = await service.getInventoryV2AllocationById(allocationId);
  const allocation = response.data?.data;
  if (!allocation || allocation.status === "Cancelled") return { ...response, eventAllocations: [] };
  const eventId = referenceId(allocation.event);
  // Older CRM-only documents have no event filter in the existing API.
  // Read all pages and match their exact customer identity locally.
  const documents = [];
  let page = 1;
  let hasNextPage;
  do {
    const result = await service.listInventoryV2Allocations({ limit: 100, page, ...(eventId ? { event: eventId } : {}) });
    const data = result.data?.data;
    if (!Array.isArray(data?.entries) || typeof data.pagination?.hasNextPage !== "boolean"
      || (data.pagination.hasNextPage && !data.entries.length)) {
      throw new Error("The complete event allocation list is unavailable. Refresh before continuing.");
    }
    documents.push(...data.entries);
    hasNextPage = data.pagination.hasNextPage;
    page += 1;
  } while (hasNextPage);
  const related = eventAllocations(documents, allocation.event, allocation.crmCustomerId).map(doc => {
    if (referenceId(doc._id) === allocationId) {
      return { ...doc, items: allocation.items, returnLines: allocation.returnLines, returnSummary: allocation.returnSummary };
    }
    return doc;
  });
  if (!related.some(document => referenceId(document._id) === allocationId)) {
    throw new Error("The selected allocation has changed. Reopen the event before continuing.");
  }
  // Keep the detail document and related documents separate. Never synthesize a merged document.
  allocationDisplayRows(related); // Fail visibly on duplicate or missing identities.
  return { ...response, eventAllocations: related };
}

export function lineItemReadinessStatus(line, returnLines = []) {
  if (line.status === "Cancelled") return "Cancelled";

  const requiredQty = Number(line.requiredQuantity) || 0;
  const dispatchedQty = Number(line.dispatchedQuantity) || 0;

  // Lookup return tracking for this specific allocation line
  const lineId = String(line._id || line.ownership?.allocationLineId || "");
  const returnLine = (returnLines || []).find(r => String(r._id) === lineId);

  const goodQty = Number(line.goodReturnedQuantity ?? returnLine?.goodReturnedQuantity) || 0;
  const damagedQty = Number(line.damagedQuantity ?? returnLine?.damagedQuantity) || 0;
  const missingQty = Number(line.missingQuantity ?? returnLine?.missingQuantity) || 0;
  const accountedQty = goodQty + damagedQty + missingQty;

  const pendingReturnQty = (line.pendingReturnQuantity != null)
    ? Number(line.pendingReturnQuantity)
    : (returnLine?.pendingQuantity != null)
      ? Number(returnLine.pendingQuantity)
      : Math.max(0, dispatchedQty - accountedQty);

  // 1. Fully reconciled return: all dispatched units accounted, 0 pending
  if (dispatchedQty > 0 && accountedQty >= dispatchedQty && pendingReturnQty === 0) {
    return "Returned";
  }

  // 2. Partial return: some units accounted, but pending returns remain
  if (dispatchedQty > 0 && accountedQty > 0 && pendingReturnQty > 0) {
    return "Partially Returned";
  }

  // 3. Fully dispatched: all required units dispatched, but return not yet completed
  if (dispatchedQty >= requiredQty && requiredQty > 0) {
    return "Dispatched";
  }

  // 4. Partial dispatch: some units dispatched, but less than required
  if (dispatchedQty > 0 && dispatchedQty < requiredQty) {
    return "Partially Dispatched";
  }

  // 5. Pre-dispatch: stock readiness
  if (typeof line.netShortage === "number" && typeof line.willReserve === "number") {
    if (line.netShortage === 0) return "Ready";
    return line.willReserve > 0 ? "Partially Ready" : "Shortage";
  }
  return line.netShortage > 0 ? "Shortage" : "Ready";
}

export function continuationAllocation(savedLines, requestedAllocationId) {
  if (requestedAllocationId) {
    const saved = savedLines.find(line => line.allocationId === requestedAllocationId);
    if (!saved) throw new Error("The selected allocation no longer belongs to this event. Refresh before saving.");
    return saved;
  }
  const allocations = new Map(savedLines.map(line => [line.allocationId, line]));
  if (allocations.size > 1) {
    throw new Error("This event has multiple allocations. Open the intended allocation before adding requirements.");
  }
  return allocations.values().next().value;
}

export function overallAllocationLifecycleStatus(allocation, dispatchSummary = null, returnSummary = null) {
  if (!allocation) return "No Allocation";
  if (allocation.status === "Draft") return "Draft";
  if (allocation.status === "Cancelled") return "Cancelled";

  const dispatch = dispatchSummary || allocation.dispatchSummary;
  const ret = returnSummary || allocation.returnSummary;

  const requiredQty = Number(dispatch?.requiredQuantity) || 0;
  const dispatchedQty = Number(dispatch?.dispatchedQuantity) || 0;
  const isFullyDispatched = dispatch?.status === "Dispatched" || (requiredQty > 0 && dispatchedQty >= requiredQty);
  const isPartiallyDispatched = dispatch?.status === "Partially Dispatched" || (dispatchedQty > 0 && dispatchedQty < requiredQty);

  const retDispatchedQty = Number(ret?.dispatchedQuantity) || 0;
  const accountedQty = Number(ret?.accountedQuantity) || 0;
  const pendingReturnQty = Number(ret?.pendingQuantity) || 0;

  // Fully reconciled return: full dispatch verified + complete return review with 0 pending
  const isFullyReturned = isFullyDispatched && (
    ret?.status === "Completed" ||
    (retDispatchedQty > 0 && accountedQty >= retDispatchedQty && pendingReturnQty === 0)
  );

  if (isFullyReturned) {
    return "Returned";
  }

  const isPartiallyReturned = ret?.status === "Partially Returned" || (accountedQty > 0 && pendingReturnQty > 0);
  if (isPartiallyReturned) {
    return "Partially Returned";
  }

  if (isFullyDispatched) {
    return "Dispatched";
  }

  if (isPartiallyDispatched) {
    return "Partially Dispatched";
  }

  if (allocation.status === "Confirmed") {
    return "Reserved";
  }

  return allocation.status || "—";
}
