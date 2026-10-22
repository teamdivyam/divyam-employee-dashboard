// Match the existing centralized Inventory V2 PATCH role policy.
export const hasAllocationEditRole = session =>
  ['Super Admin', 'Admin', 'Inventory'].includes(session?.accessRole);

// Prepared/reserved requirements remain amendable until verification or dispatch.
export function canEditAllocationRequirements(allocation, accessRole) {
  if (accessRole === 'Inventory' && allocation && (allocation.status === 'Confirmed'
    || allocation.items?.some(line => Number(line.preparedQuantity || 0) > 0
      || Number(line.verifiedQuantity || 0) > 0
      || ['Reserved', 'Dispatched', 'Returned'].includes(line.status)))) return false;
  return Boolean(allocation && allocation.status !== 'Cancelled'
    && !allocation.verifiedAt && !allocation.coverage?.requirementsLocked
    && Array.isArray(allocation.items)
    && !allocation.items.some(line => Number(line.dispatchedQuantity || 0) > 0
      || ['Dispatched', 'Returned'].includes(line.status)));
}
