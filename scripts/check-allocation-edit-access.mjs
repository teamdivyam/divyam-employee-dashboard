import assert from 'node:assert/strict';
import { canEditAllocationRequirements, hasAllocationEditRole } from '../src/Pages/dashboard/Inventory/Essentials/allocationEditAccess.js';
import { allocationLinePayload, allocationVersion } from '../src/Pages/dashboard/Inventory/Essentials/allocationAmendment.js';

const draft = { _id: 'a1', status: 'Draft', updatedAt: '2026-10-22T06:00:00.000Z', __v: 2, items: [{ _id: 'l1', item: 'i1', requiredQuantity: 4, sourceLocation: 'main_store', status: 'Draft' }] };
assert.equal(canEditAllocationRequirements(draft), true);
assert.equal(canEditAllocationRequirements({ ...draft, status: 'Confirmed', items: [{ ...draft.items[0], status: 'Reserved' }] }), true);
for (const allocation of [null, { ...draft, status: 'Cancelled' }, { ...draft, verifiedAt: draft.updatedAt }, { ...draft, coverage: { requirementsLocked: true } }, { ...draft, items: [{ ...draft.items[0], dispatchedQuantity: 1 }] }, { ...draft, items: [{ ...draft.items[0], status: 'Dispatched' }] }, { ...draft, items: [{ ...draft.items[0], status: 'Returned' }] }]) {
  assert.equal(canEditAllocationRequirements(allocation), false);
}
assert.deepEqual(allocationVersion(draft), { expectedUpdatedAt: draft.updatedAt, expectedVersion: 2 });
assert.deepEqual(allocationLinePayload(draft.items[0]), { allocationLineId: 'l1', item: 'i1', sourceLocation: 'main_store', requiredQuantity: 4, notes: null });
console.log('Allocation edit checks passed: draft/reserved access, verification/dispatch locks, line identity and concurrency payload.');

for (const accessRole of ['Admin', 'Super Admin', 'Inventory']) assert.equal(hasAllocationEditRole({ accessRole }), true);
for (const accessRole of ['Employee', 'Finance', undefined]) assert.equal(hasAllocationEditRole({ accessRole }), false);
assert.equal(canEditAllocationRequirements(draft, 'Inventory'), true);
assert.equal(canEditAllocationRequirements({ ...draft, status: 'Confirmed' }, 'Inventory'), false);
assert.equal(canEditAllocationRequirements({ ...draft, items: [{ ...draft.items[0], preparedQuantity: 1 }] }, 'Inventory'), false);
assert.equal(canEditAllocationRequirements({ ...draft, status: 'Confirmed' }, 'Admin'), true);
console.log('Role and Inventory Head preparation restrictions passed.');
