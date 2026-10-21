// PATCH treats items as the complete active requirement set. Carry persisted
// identities explicitly; workflow status and coverage remain server-owned.
export function allocationLinePayload(line) {
  return {
    ...(line._id || line.allocationLineId ? { allocationLineId: line._id || line.allocationLineId } : {}),
    item: typeof line.item === "string" ? line.item : line.item?._id,
    sourceLocation: line.sourceLocation,
    requiredQuantity: line.requiredQuantity,
    notes: line.notes || null,
    ...(line.planning ? { planning: line.planning } : {}),
  };
}

export function allocationVersion(allocation) {
  if (!allocation?._id || !allocation.updatedAt || !Number.isFinite(Date.parse(allocation.updatedAt))) {
    throw new Error("The allocation version is unavailable. Refresh before saving.");
  }
  return { expectedUpdatedAt: allocation.updatedAt,
    ...(Number.isInteger(allocation.__v) ? { expectedVersion: allocation.__v } : {}) };
}

export function appendAllocationRequirements(allocation, additions) {
  const version = allocationVersion(allocation);
  const existing = allocation.items.filter(line => line.status !== "Cancelled");
  if (existing.some(line => !line._id || !line.item)
    || new Set(existing.map(line => line._id)).size !== existing.length) {
    throw new Error("Existing requirement identities are unavailable. Refresh before saving.");
  }
  if (additions.some(line => line._id || line.allocationLineId)) {
    throw new Error("A saved requirement cannot be added again as a new line.");
  }
  return { ...version, items: [...existing, ...additions].map(allocationLinePayload) };
}

// Re-read before amending, but never adopt a newer version behind the user's
// draft. The server performs the final atomic concurrency check on PATCH.
export async function saveAllocationContinuation(saved, payload, service) {
  if (!saved) return service.createInventoryV2Allocation(payload);
  const response = await service.getInventoryV2AllocationById(saved.allocationId);
  const current = response.data?.data;
  if (!current || current._id !== saved.allocationId || current.updatedAt !== saved.expectedUpdatedAt) {
    throw new Error("The allocation has changed. Go back and reopen it before saving.");
  }
  if (current.status !== "Draft" || current.verifiedAt || current.coverage?.requirementsLocked
    || current.items.some(line => line.status === "Reserved" || line.preparedQuantity > 0)) {
    throw new Error("This allocation is committed. Open the existing allocation to review the permitted actions.");
  }
  return service.updateInventoryV2Allocation(current._id, { ...appendAllocationRequirements(current, payload.items), ...(payload.planning ? {planning: payload.planning} : {}) });
}
