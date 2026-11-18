import assert from 'node:assert/strict';
import { continuationAllocation } from '../src/Pages/dashboard/Inventory/Essentials/eventAllocationRows.js';
import { canContinueAllocation, saveAllocationContinuation } from '../src/Pages/dashboard/Inventory/Essentials/allocationAmendment.js';

const draft = { _id: 'draft', status: 'Draft', updatedAt: '2026-11-18T06:00:00.000Z', items: [
  { _id: 'existing-line', item: 'existing-item', requiredQuantity: 1, status: 'Draft' },
] };
const dispatched = { ...draft, _id: 'dispatched', status: 'Confirmed', items: [{ ...draft.items[0], dispatchedQuantity: 1 }] };
const saved = allocation => ({ allocationId: allocation._id, expectedUpdatedAt: allocation.updatedAt, canContinueAllocation: canContinueAllocation(allocation) });
const payload = { event: 'event', status: 'Draft', items: [{ item: 'new-item', requiredQuantity: 2 }] };
const calls = [];
const service = {
  createInventoryV2Allocation: async data => calls.push(['create', data]),
  getInventoryV2AllocationById: async id => ({ data: { data: id === draft._id ? draft : dispatched } }),
  updateInventoryV2Allocation: async (id, data) => calls.push(['update', id, data]),
};
for (const lines of [[], [saved(dispatched)], [saved(dispatched), saved({ ...dispatched, _id: 'other' })]]) {
  await saveAllocationContinuation(continuationAllocation(lines), payload, service);
  assert.deepEqual(calls.pop(), ['create', payload]);
}
const lines = [saved(dispatched), saved(draft)];
await saveAllocationContinuation(continuationAllocation(lines), payload, service);
const update = calls.pop();
assert.equal(update[0], 'update');
assert.equal(update[1], 'draft');
assert.equal(update[2].items[0].allocationLineId, 'existing-line');
assert.equal(update[2].items[1].item, 'new-item');
assert.equal(update[2].items.length, 2);
await assert.rejects(saveAllocationContinuation(continuationAllocation(lines, 'dispatched'), payload, service), /committed/);
assert.throws(() => continuationAllocation(lines, 'missing'), /no longer belongs/);
for (const blocked of [
  { ...draft, verifiedAt: draft.updatedAt },
  { ...draft, coverage: { requirementsLocked: true } },
  ...['preparedQuantity', 'verifiedQuantity', 'dispatchedQuantity'].map(field => ({ ...draft, items: [{ ...draft.items[0], [field]: 1 }] })),
]) assert.equal(canContinueAllocation(blocked), false);
assert.equal(calls.length, 0);
console.log('Allocation continuation checks passed: create after dispatch, draft append, explicit ownership and lifecycle locks.');
