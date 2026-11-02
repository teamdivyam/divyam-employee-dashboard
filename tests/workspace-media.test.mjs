import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canEditMessage, uploadError, MAX_FILE_BYTES, CHAT_FILE_TYPES } from '../src/Pages/dashboard/my-workspace/workspaceMedia.utils.js';

const now = Date.parse('2026-11-02T10:00:00Z');
const conversation = { status: 'Open', contactType: 'Employee' };
const message = { _id: 'latest', sender: 'me', source: 'Dashboard', createdAt: new Date(now - 599999).toISOString(), readBy: ['me'], whatsapp: { status: 'Not applicable' } };
const allowed = (changes = {}, context = conversation) => canEditMessage({ ...message, ...changes }, 'latest', context, 'me', now);

test('edit supports own latest unread message and failed external delivery', () => {
  assert.equal(allowed(), true);
  assert.equal(allowed({ whatsapp: { status: 'Failed' }, readBy: [{ _id: 'me' }] }), true);
  assert.equal(allowed({ attachments: ['image'], text: '' }), true);
});
test('edit rejects read, older, foreign, closed, template, and external messages', () => {
  for (const changes of [{ readBy: ['me', 'peer'] }, { readBy: undefined }, { _id: 'older' }, { sender: 'peer' }, { source: 'WhatsApp' }, { templateSid: 'HXtemplate' }, { whatsapp: { status: 'Failed', templateSid: 'HXtemplate' } }]) assert.equal(allowed(changes), false);
  assert.equal(allowed({}, { ...conversation, status: 'Closed' }), false);
  assert.equal(allowed({}, { ...conversation, contactType: 'Client' }), false);
  for (const status of ['Pending', 'Sending', 'Unknown', 'Sent', 'Delivered', 'Read', undefined]) assert.equal(allowed({ whatsapp: { status } }), false);
});
test('edit has strict original ten-minute deadline even after an edit', () => {
  assert.equal(allowed({ createdAt: new Date(now - 600000).toISOString(), editedAt: new Date(now).toISOString() }), false);
  assert.equal(allowed({ createdAt: 'bad date' }), false);
  assert.equal(allowed({ createdAt: new Date(now + 1).toISOString() }), false);
});
test('uploads accept exactly 20 MiB and reject oversized, empty, and unsupported chat files', () => {
  for (const type of CHAT_FILE_TYPES) assert.equal(uploadError({ size: MAX_FILE_BYTES, type }, true), '');
  assert.match(uploadError({ size: MAX_FILE_BYTES + 1, type: 'image/png' }, true), /20 MiB/);
  assert.match(uploadError({ size: 0, type: 'image/png' }, true), /nonempty/);
  for (const type of ['image/svg+xml', 'text/html', 'application/zip', '']) assert.match(uploadError({ size: 100, type }, true), /JPEG/);
  assert.equal(uploadError({ size: 100, type: 'application/zip' }), '');
});
test('file requests include exactly one real context and preserve authenticated client settings', async () => {
  const calls = [];
  const source = readFileSync(new URL('../src/services/central-command.service.js', import.meta.url), 'utf8').replace(/^import .*;/m, '').replace('export default', 'return');
  const service = new Function('employeeV2Request', source)(async request => { calls.push(request); return { data: { data: { _id: 'file' } } }; });
  for (const context of [{ employeeId: 'me' }, { eventId: 'event' }, { conversationId: 'chat' }]) {
    await service.upload(context, new Blob(['test']));
    const call = calls.at(-1);
    assert.deepEqual([...call.data.keys()], ['file', ...Object.keys(context)]);
    assert.equal(call.url, '/central-command/files');
    assert.equal(call.headers['Content-Type'], undefined);
  }
  assert.throws(() => service.upload({ employeeId: 'me', eventId: 'event' }, new Blob(['test'])), /one file context/);
  assert.throws(() => service.upload({}, new Blob(['test'])), /one file context/);
});
