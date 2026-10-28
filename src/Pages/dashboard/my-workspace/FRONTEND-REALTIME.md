# Central Command frontend realtime integration

## Backend contract

Reuse the application's existing Socket.IO client if present. The backend already initializes Socket.IO in `src/server.js` through `src/sockets/socketServer.js`, on the same origin/port as HTTP, default namespace `/`, path `/socket.io`. This configuration, its authentication, existing task/event handlers, and rooms are unchanged.

The new server event is `central-command:changed`, with payload `{ "refresh": true }`. It is a cache invalidation hint, not a message or summary response. It goes to existing authenticated user rooms; all signed-in internal users may receive it, including users outside the changed conversation. It contains no IDs or message content. Always fetch data through HTTP, which rechecks current permissions and conversation visibility. There is no client join/subscribe command and no socket message-send command.

Notifications occur after successful Central Command controller mutations (including reads marked, tasks, follow-ups and uploads), immediately after a dashboard message is persisted, after WhatsApp delivery attempts, new inbound WhatsApp messages, and changed delivery callbacks. Duplicate hints are expected. This does not subscribe to arbitrary database edits or changes made through other modules. Existing event-booking notifications remain separate.

## Connect using the existing login session

Install `socket.io-client` version 4 in the frontend if absent. Use a single shared browser instance per authenticated app session, not one per conversation/component. Connect to the backend **origin**, without `/v2/api/central-command` appended:

```js
import { io } from "socket.io-client";

export const socket = io(BACKEND_ORIGIN, {
  path: "/socket.io",
  withCredentials: true,
  autoConnect: false,
});
// After successful portal login and after listeners are registered:
socket.connect();
// On logout/account switch: disconnect and clear the previous account's cache.
```

Reuse an existing instance instead of creating the above if task/event updates already use one. Login and API fetches must also include credentials. Authentication reads the portal-specific HttpOnly access cookie and browser Origin; it does not read `auth.token`. Do not copy tokens into localStorage. The frontend origin must match the backend's existing allowed origins and portal mapping. Use HTTPS in deployed environments, with the existing cookies' domain/SameSite/Secure settings permitting requests.

## Refresh cache without page reloads or interval polling

The following adapter is framework-independent. `refreshVisiblePanel` must refetch the summary, the current filtered inbox page, and the latest messages for the currently selected conversation through your API/query cache. It should also invalidate active tasks/follow-ups/files where displayed. Read current selection at execution time; do not capture an old conversation ID.

```js
export function subscribeCentralCommand(socket, refreshVisiblePanel, onStatus, onError) {
  let disposed = false;
  let timer;
  let running = false;
  let dirty = false;

  async function flush() {
    if (disposed || running) return;
    running = true;
    try {
      while (dirty && !disposed) {
        dirty = false;
        try { await refreshVisiblePanel(); }
        catch (error) { onError(error); }
      }
    } finally { running = false; }
  }
  function schedule() {
    if (disposed) return;
    dirty = true;
    clearTimeout(timer);
    timer = setTimeout(flush, 100);
  }
  const onConnect = () => { onStatus("connected"); schedule(); };
  const onDisconnect = () => onStatus("disconnected");
  const onConnectError = (error) => { onStatus("error"); onError(error); };
  socket.on("central-command:changed", schedule);
  socket.on("connect", onConnect);
  socket.on("disconnect", onDisconnect);
  socket.on("connect_error", onConnectError);
  if (socket.connected) onConnect();
  else schedule(); // Initial REST load still works while offline.

  return () => {
    disposed = true;
    clearTimeout(timer);
    socket.off("central-command:changed", schedule);
    socket.off("connect", onConnect);
    socket.off("disconnect", onDisconnect);
    socket.off("connect_error", onConnectError);
  };
}
```

Use this once in the Central Command panel lifecycle. The panel removes only its own listeners on unmount; the auth/session owner manages connection teardown. Do not register change listeners inside `connect`, since reconnects would add duplicates. Cancel in-flight HTTP requests on unmount/account switch and key cached results by account, conversation and filters so a late response cannot replace another thread.

Refetch these endpoints using `credentials: "include"` (or Axios `withCredentials: true`):

| UI | Endpoint |
| --- | --- |
| Summary badges | `GET /v2/api/central-command/summary` |
| Inbox/last message/unread counts | `GET /v2/api/central-command/conversations` with current filters |
| Active thread | `GET /v2/api/central-command/conversations/:id/messages?page=1&limit=25` |
| Active work/file tabs | Existing `/tasks`, `/follow-ups`, `/files` queries with their current context |

Messages are returned newest-first. Always refresh page 1 for new messages even if the user has loaded older pages; merge by `_id`, deduplicate, and render chronologically if desired. Invalidate/reconcile older pages because offset pagination can shift. Do not scroll a user away from older history; display a new-message indicator. A query library can invalidate all `['central-command']` queries and refetch active ones, provided every panel query uses that prefix.

Continue sending messages with `POST /conversations/:id/messages`, including the existing idempotency key. Retain the same key for retrying the same logical message. Update from the HTTP response and deduplicate by `_id`; the socket hint can arrive before the POST completes. Mark read with `POST /conversations/:id/read` only when a newly visible unread message is actually read, not unconditionally after every refetch, to avoid a read/refetch notification loop. Internal notes remain filtered by HTTP permissions.

When selecting an event, await `GET /events/:id?conversationId=...` as documented in the API guides. Event association and socket connection are independent.

## Reconnect, expiry and deployment

Show status from `connect`, `disconnect` and `connect_error`; inspect `socket.connected` for current state. Socket.IO handles transport reconnects. After **every** connect/reconnect, refetch the panel: missed server events are not replayed by this implementation. Also refetch on window focus/network restoration as a recovery path. Keep an explicit retry control for HTTP failures.

On an authentication `connect_error`, use the application's existing HTTP refresh/login flow. After a successful refresh, call `socket.connect()`; do not retry authentication indefinitely. A 401/403 on refetch must clear inaccessible UI data and follow the normal auth/permission handling. Reconnect the shared socket after an account or portal change. Existing socket authentication occurs at handshake; HTTP remains authoritative for current permissions.

The reverse proxy must route `/socket.io/` to the same backend and support HTTP polling plus WebSocket upgrade. In DevTools, inspect `/socket.io/?EIO=4...`: a `connect` event confirms Socket.IO connection; a successful upgrade normally shows HTTP 101. Polling fallback can still deliver realtime events. This repository has a process-local Socket.IO instance and no cross-process adapter. For multiple backend workers/replicas, events emitted on one worker cannot notify clients connected to another without shared adapter infrastructure; this change does not alter that configuration.

## Acceptance checks

1. Log in with two authorized browser sessions and verify both show connected.
2. Send a message from one; confirm the other updates its active thread, inbox preview and summary without reloading.
3. Check a background thread updates unread counts; opening/reading it clears badges in other tabs without a refetch loop.
4. Verify inbound WhatsApp and delivery status updates trigger a refresh. Internal notes must never appear to employees.
5. Disconnect a browser, send messages, reconnect and verify the REST catch-up shows missed messages exactly once.
6. Navigate away/back repeatedly and verify one listener set, no duplicate messages, and no stale thread replacement.
7. Log out or revoke API access; verify refetches do not expose old cached content and logout disconnects the socket.

References: [Socket.IO client options](https://socket.io/docs/v4/client-options/), [client lifecycle API](https://socket.io/docs/v4/client-api/), [delivery guarantees](https://socket.io/docs/v4/delivery-guarantees/).
