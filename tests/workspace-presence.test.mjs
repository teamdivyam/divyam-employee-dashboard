import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { subscribeCentralCommand } from '../src/Pages/dashboard/my-workspace/centralCommand.realtime.js';

const tick = () => new Promise(resolve => setImmediate(resolve));
class Socket extends EventEmitter {
  connected = false;
  attempts = 0;
  connect() { this.attempts++; return this; }
  disconnect() { this.connected = false; this.emit('disconnect', 'io client disconnect'); return this; }
}
function session(refresh) {
  const socket = new Socket();
  let created = 0;
  let unauthorized = 0;
  const source = readFileSync(new URL('../src/services/socket.js', import.meta.url), 'utf8')
    .replace(/^import .*;/gm, '').replaceAll('export const ', 'const ');
  const api = new Function('io', 'config', 'EmployeeV2Service', 'window', source +
    ';return { getSocket, startSocketSession, disconnectSocket };')(
    () => { created++; return socket; }, { BACKEND_URL: 'https://example.test' }, { refresh },
    { dispatchEvent: () => { unauthorized++; } });
  return { socket, api, created: () => created, unauthorized: () => unauthorized };
}

test('presence hints debounce, reconnect catches up, and disposal removes listeners', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const socket = new Socket();
  let refreshes = 0;
  const statuses = [];
  const sub = subscribeCentralCommand(socket, async () => { refreshes++; }, status => statuses.push(status), assert.fail);
  socket.emit('presence:changed', { refresh: true });
  socket.emit('presence:changed', { refresh: true });
  t.mock.timers.tick(100); await tick();
  assert.equal(refreshes, 1);
  socket.emit('disconnect', 'transport close');
  assert.equal(statuses.at(-1), 'disconnected');
  socket.emit('connect');
  t.mock.timers.tick(100); await tick();
  assert.equal(refreshes, 2);
  sub.dispose();
  assert.equal(socket.listenerCount('presence:changed'), 0);
  assert.equal(socket.listenerCount('connect'), 0);
});

test('a hint received during a slow refetch is not lost', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let finish;
  let count = 0;
  const socket = new Socket();
  const sub = subscribeCentralCommand(socket, () => ++count === 1 ? new Promise(resolve => { finish = resolve; }) : Promise.resolve(), () => {}, assert.fail);
  t.mock.timers.tick(100);
  socket.emit('presence:changed', { refresh: true });
  finish(); await tick();
  assert.equal(count, 2);
  sub.dispose();
});

test('shared socket refreshes HTTP auth before reconnecting after server disconnect', async () => {
  let finish;
  const s = session(() => new Promise(resolve => { finish = resolve; }));
  s.api.startSocketSession();
  assert.equal(s.api.getSocket({ connect: false }), s.socket);
  assert.equal(s.created(), 1);
  s.socket.emit('disconnect', 'io server disconnect');
  s.api.getSocket();
  assert.equal(s.socket.attempts, 1);
  finish(); await tick();
  assert.equal(s.socket.attempts, 2);
});

test('revoked auth stops reconnect attempts including manual retry', async () => {
  let refreshes = 0;
  const s = session(async () => { refreshes++; throw new Error('revoked'); });
  s.api.startSocketSession();
  s.socket.emit('disconnect', 'io server disconnect');
  await tick();
  s.api.getSocket();
  s.socket.emit('connect_error', { data: { status: 401 } });
  await tick();
  assert.equal(refreshes, 1);
  assert.equal(s.socket.attempts, 1);
  assert.equal(s.unauthorized(), 1);
});

test('logout prevents a pending auth refresh from reconnecting the previous session', async () => {
  let finish;
  const s = session(() => new Promise(resolve => { finish = resolve; }));
  s.api.startSocketSession();
  s.socket.emit('disconnect', 'io server disconnect');
  s.api.disconnectSocket();
  finish(); await tick();
  assert.equal(s.socket.attempts, 1);
  s.api.startSocketSession();
  assert.equal(s.socket.attempts, 2);
});


test('refreshed but rejected handshake does not enter an auth retry loop', async () => {
  let refreshes = 0;
  const s = session(async () => { refreshes++; });
  s.api.startSocketSession();
  s.socket.emit('connect_error', { data: { status: 401 } });
  await tick();
  s.socket.emit('connect_error', { data: { status: 401 } });
  await tick();
  s.api.getSocket();
  assert.equal(refreshes, 1);
  assert.equal(s.socket.attempts, 2);
  assert.equal(s.unauthorized(), 1);
});

test('presence rendering distinguishes null, offline, online, and unavailable', async () => {
  const { transform } = await import('esbuild');
  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const source = readFileSync(new URL('../src/Pages/dashboard/my-workspace/WorkspacePresence.jsx', import.meta.url), 'utf8');
  const { code } = await transform(source.replace('export default ', ''), { loader: 'jsx' });
  const Component = new Function('React', code + ';return WorkspacePresence;')(React);
  const render = (presence, available = true) => renderToStaticMarkup(React.createElement(Component, { presence, available }));
  assert.equal(render(null), '');
  assert.match(render({ isOnline: true, lastSeenAt: null }), /is-online.*aria-label="Online"/);
  assert.match(render({ isOnline: false, lastSeenAt: null }), /is-offline.*aria-label="Offline"/);
  assert.doesNotMatch(render({ isOnline: false, lastSeenAt: null }), />Offline</);
  assert.doesNotMatch(render({ isOnline: true, lastSeenAt: null }), />Online</);
  assert.doesNotMatch(render({ isOnline: false, lastSeenAt: null }), /Last seen/);
  const unavailable = render({ isOnline: true, lastSeenAt: null }, false);
  assert.match(unavailable, /Status unavailable/);
  assert.match(unavailable, /is-unknown/);
  assert.doesNotMatch(unavailable, /is-online|is-offline|Online/);
  assert.match(render({ isOnline: false, lastSeenAt: '2026-10-31T10:00:00.000Z' }), /Last seen/);
});
