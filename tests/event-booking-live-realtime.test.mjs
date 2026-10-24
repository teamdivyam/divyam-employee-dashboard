import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { setTimeout as wait } from 'node:timers/promises';
import { getLiveDetails } from '../src/Pages/dashboard/event-booking-workspace/eventBookingLive.utils.js';
import { subscribeEventBookingUpdates } from '../src/Pages/dashboard/event-booking-workspace/eventBookingRealtime.js';
test('the event stays live all day regardless of function times or delayed flags', () => {
    const event = { eventDate: '2026-10-24', functions: [{ fromDate: '2026-10-24', startTime: '09:00', endTime: '10:00', status: 'Delayed' }] };
    for (const now of ['2026-10-23T18:30:00Z', '2026-10-24T12:00:00Z', '2026-10-24T18:29:59Z']) {
        assert.equal(getLiveDetails(event, new Date(now)).label, 'Live Today');
    }
});
test('the next calendar day is Completed even when later functions exist', () => {
    assert.equal(getLiveDetails({ eventDate: '2026-10-24', eventEndDate: '2026-10-30', functions: [{ fromDate: '2026-10-26' }] }, new Date('2026-10-24T18:30:00Z')).label, 'Completed');
});
test('business timezone defines the calendar date', () => {
    const event = { eventDate: '2026-10-24' };
    const now = new Date('2026-10-24T19:00:00Z');
    assert.equal(getLiveDetails(event, now, 'Asia/Kolkata').label, 'Completed');
    assert.equal(getLiveDetails(event, now, 'America/New_York').label, 'Live Today');
});
test('change bursts combine into a single refresh and reconnect recovers missed changes', async () => {
    const socket = new EventEmitter();
    let count = 0;
    const cleanup = subscribeEventBookingUpdates(socket, () => { count++; }, 10);
    socket.emit('event-bookings:changed');
    socket.emit('event-bookings:changed');
    await wait(40);
    assert.equal(count, 1);
    socket.emit('connect');
    await wait(40);
    assert.equal(count, 2);
    cleanup();
});
test('idle clients do not poll and cleanup preserves other listeners', async () => {
    const socket = new EventEmitter();
    let count = 0;
    const other = () => {};
    socket.on('event-bookings:changed', other);
    const cleanup = subscribeEventBookingUpdates(socket, () => { count++; }, 10);
    await wait(40);
    assert.equal(count, 0);
    socket.emit('event-bookings:changed');
    cleanup();
    await wait(40);
    assert.equal(count, 0);
    assert.equal(socket.listenerCount('event-bookings:changed'), 1);
});