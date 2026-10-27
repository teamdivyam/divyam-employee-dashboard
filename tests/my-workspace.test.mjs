import test from 'node:test';
import assert from 'node:assert/strict';
import { canUse, chronologicalMessages, createSendAttempt, editableTask, datePayload } from '../src/Pages/dashboard/my-workspace/centralCommand.utils.js';

test('employee permissions respect effective grants and explicit denials', () => {
  const employee = { accessRole: 'Employee', permissions: ['notification:view:self', 'task:*'] };
  assert.equal(canUse(employee, 'task:manage:self'), true);
  assert.equal(canUse({ ...employee, permissionOverrides: { deny: ['task:manage:self'] } }, 'task:manage:self'), false);
  assert.equal(canUse({ accessRole: 'Employee' }, 'task:view:self'), false);
  assert.equal(canUse(employee, 'notification:manage'), false);
});
test('only editable task statuses permit updates', () => {
  for (const status of ['Pending', 'In progress', 'Changes requested']) assert.equal(editableTask({ status }), true);
  for (const status of ['Under review', 'Completed', 'Cancelled']) assert.equal(editableTask({ status }), false);
});
test('message pagination deduplicates overlaps and retains newest server state', () => {
  const newer = { _id: 'b', createdAt: '2026-10-27T10:00:00Z', readBy: ['peer'] };
  const older = { _id: 'a', createdAt: '2026-10-27T09:00:00Z' };
  const result = chronologicalMessages([{ items: [newer] }, { items: [{ ...newer, readBy: [] }, older] }]);
  assert.deepEqual(result, [older, newer]);
});
test('retry preserves idempotency key and changed content creates a new key', () => {
  const body = { text: 'Ready', attachments: [], internal: false };
  const first = createSendAttempt(body);
  assert.equal(createSendAttempt(body, first), first);
  assert.notEqual(createSendAttempt({ ...body, text: 'Updated' }, first).body.idempotencyKey, first.body.idempotencyKey);
});
test('reminder input is interpreted in IST independently of host timezone', () => {
  assert.equal(datePayload('2026-11-18T15:00'), '2026-11-18T09:30:00.000Z');
  assert.throws(() => datePayload('invalid'));
});
