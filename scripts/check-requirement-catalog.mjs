import assert from 'node:assert/strict';
import { loadActiveRequirementCatalog } from '../src/Pages/dashboard/Inventory/Essentials/requirementCatalog.js';

const response = (items, pagination) => ({ data: { data: { items, pagination } } });
const items = [{ _id: 'chair', name: 'Chair' }, { _id: 'table', name: 'Table' }];

// Employee routes echo page as a query string; load every page in order.
const requestedPages = [];
const catalog = await loadActiveRequirementCatalog(async ({ page, status }) => {
  requestedPages.push(page);
  assert.equal(status, 'active');
  return response([items[page - 1]], { page: String(page), total: 2, totalPages: 2 });
});
assert.deepEqual(requestedPages, [1, 2]);
assert.deepEqual(catalog.items, items);
assert.equal(catalog.pagination.page, 1);

// Numeric and numeric-string metadata both remain supported.
for (const asValue of [value => value, String]) {
  const result = await loadActiveRequirementCatalog(async () => response(items, {
    page: asValue(1), total: asValue(2), totalPages: asValue(1),
  }));
  assert.deepEqual(result.items, items);
}
assert.deepEqual((await loadActiveRequirementCatalog(async () => response([], {
  page: '1', total: 0, totalPages: 0,
}))).items, []);

// Malformed, incomplete and changing responses must still fail safely.
for (const pagination of [
  { page: null, total: 2, totalPages: 1 },
  { page: 'wrong', total: 2, totalPages: 1 },
  { page: '2', total: 2, totalPages: 1 },
  { page: '1', total: null, totalPages: 1 },
  { page: '1', total: 2, totalPages: '' },
]) {
  await assert.rejects(loadActiveRequirementCatalog(async () => response(items, pagination)), /could not be loaded/);
}
await assert.rejects(loadActiveRequirementCatalog(async () => response([items[0]], {
  page: '1', total: 2, totalPages: 1,
})), /complete inventory catalog/);
await assert.rejects(loadActiveRequirementCatalog(async () => response([items[0], items[0]], {
  page: '1', total: 2, totalPages: 1,
})), /complete inventory catalog/);
await assert.rejects(loadActiveRequirementCatalog(async ({ page }) => response([items[page - 1]], {
  page: String(page), total: page === 1 ? 2 : 3, totalPages: 2,
})), /Inventory changed/);
console.log('Requirement catalog checks passed: employee string pagination, numeric pagination, all pages, empty catalog and invalid responses.');
