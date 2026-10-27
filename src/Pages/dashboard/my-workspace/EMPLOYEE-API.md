# Central Command API - Employee My Workspace handoff

Verified against local routes, controllers, services, validators and models on 27 October 2026. This document targets the `Employee` role. Examples use illustrative IDs and are not production responses. Integrate the existing backend contract; do not invent endpoints or reuse legacy task APIs for these records.

## 1. Base URL, authentication and conventions

The router is mounted in `src/app.js` at:

```text
/v2/api/central-command
```

All paths below are relative to this base. Use the existing Employee portal login and portal-specific authentication cookies from the configured employee frontend origin. Send `credentials: "include"` (Fetch) or `withCredentials: true` (Axios). Do not send employee IDs or roles to impersonate the caller; the backend derives identity from the cookie.

Every protected endpoint requires an active authenticated internal account, completion of mandatory password change, and `notification:view:self`. Task reads additionally require `task:view:self`; task draft/submission additionally require `task:manage:self`. Respect effective permission overrides and handle 403 even if a control was visible.

Use JSON with `Content-Type: application/json`, except multipart file uploads. IDs are 24-character hexadecimal MongoDB `_id` strings, not employee codes, event codes, file URLs or task numbers. Body strings are trimmed; unknown body/query keys are stripped. Dates in request bodies require an explicit timezone, for example `2026-11-18T09:30:00.000Z` or `2026-11-18T15:00:00+05:30`. Today/Upcoming calculations use `Asia/Kolkata`.

`page`: integer 1-10000, default 1. `limit`: integer 1-100, default 25. Supported `search` values are at most 100 characters. Only send filters documented for the endpoint: the shared query validator accepts some fields that individual services ignore.

### Response conventions

`Success<T>` means HTTP 200 (unless specified otherwise):

```json
{ "success": true, "data": {} }
```

Here `data` is the documented object `T`. `Page<T>` means:

```json
{
  "success": true,
  "data": { "items": [], "total": 0, "page": 1, "limit": 25 }
}
```

These notation names are not literal response fields. Optional fields may be absent or null. Records may contain `__v` and embedded `_id` fields; treat them as opaque. Do not post whole returned objects back as edit payloads.

### Access rules

- Employees see only conversations in which they participate. Internal management notes are excluded from message lists, previews, unread counts and message search.
- Event access covers the event manager, `assignedTeam.employee`, `servicesSelected.assignedLead` (service lead), or the employee assigned to the event's customer. Conversation membership alone does not grant event access.
- Employees see tasks assigned to themselves. Follow-ups are scoped to records assigned to or created by themselves.
- Individual task/follow-up reads and mutations recheck event access. A previously listed record can become inaccessible after reassignment; handle 404.
- Files are event-scoped. Employees cannot see or upload internal management files.

## 2. Endpoint map

| Method | Path | Employee use | Additional permission |
|---|---|---|---|
| GET | `/summary` | Workspace badges | None |
| GET | `/people` | Start-chat person picker | None |
| GET | `/conversations` | Inbox | None |
| POST | `/conversations` | Start/reuse internal-person conversation | None |
| GET | `/conversations/:id` | Conversation detail | None |
| PATCH | `/conversations/:id` | Add accessible event context only | None |
| GET | `/conversations/:id/messages` | Read message history | None |
| POST | `/conversations/:id/messages` | Send dashboard message | None |
| POST | `/conversations/:id/read` | Mark rendered messages read | None |
| GET | `/conversations/:id/messages/:messageId/media/:index` | Read incoming WhatsApp media | None |
| GET | `/events` | Accessible events/context picker | None |
| GET | `/events/:id` | Event context detail | None |
| GET | `/tasks` | My tasks | `task:view:self` |
| GET | `/tasks/:id` | Assigned task detail | `task:view:self` |
| PATCH | `/tasks/:id/draft` | Save work draft | `task:manage:self` |
| POST | `/tasks/:id/submit` | Submit work for review | `task:manage:self` |
| GET | `/follow-ups` | My reminders | None |
| POST | `/follow-ups` | Create personal reminder | None |
| GET | `/follow-ups/:id` | Reminder detail | None |
| PATCH | `/follow-ups/:id` | Edit own created pending reminder | None |
| POST | `/follow-ups/:id/actions` | Done/Undo; Cancel own created reminder | None |
| GET | `/files` | Event shared files | None |
| POST | `/files` | Upload event file/proof | None |
| GET | `/files/:id/preview` | Get temporary preview URL | None |
| GET | `/files/:id/download` | Get temporary download URL | None |

All entries still require the common `notification:view:self` permission.

## 3. Summary and people

### GET `/summary`

No body or implemented filters. Returns `Success<WorkspaceSummary>`:

```json
{
  "success": true,
  "data": {
    "unreadMessages": 3,
    "pendingTasks": 2,
    "activeEvents": 4,
    "followUpsToday": 1,
    "pendingReplies": 1,
    "whatsappConfigured": true
  }
}
```

- `unreadMessages`: other senders' visible unread messages, not number of conversations.
- `pendingTasks`: assigned tasks in Pending, In progress or Changes requested; excludes Under review.
- `activeEvents`: accessible events excluding Completed and Cancelled; includes On Hold.
- `followUpsToday`: scoped Pending reminders due today in Asia/Kolkata.
- `pendingReplies`: conversations whose latest non-internal message was not sent by the caller. This is independent of unread state.
- `whatsappConfigured`: provider configuration presence, not employee permission to send/link WhatsApp and not proof that this conversation is linked.

### GET `/people?page=1&limit=25&search=Neha`

Returns `Page<Person>`, sorted by name then ID. Excludes the caller and inactive accounts. Includes Admin/Super Admin plus event managers, team members and customer-assigned employees collected from the caller's accessible events.

```json
{
  "_id": "111111111111111111111111",
  "name": "Neha",
  "accessRole": "Admin",
  "designation": "Event Manager",
  "profileImage": { "smallUrl": "https://example.test/avatar.jpg" }
}
```

`profileImage` may include additional image metadata/URLs. Render a fallback if image or designation is missing. There is no implemented `eventId` or role filter here. Current limitation: although service-lead assignments grant event access, the people picker does not separately collect other service leads from `servicesSelected`.

## 4. Conversations

### GET `/conversations`

Filters: `page`, `limit`, `search`, `eventId`, `status`, `contactType`, `tab=All|Unread|Needs reply`. Use `contactType=Employee` for internal chat. Search checks title and visible message text. `status=Open|Closed` is useful; arbitrary nonempty values pass validation but normally match nothing. Returns `Page<ConversationListItem>`, newest updated first, then descending ID.

```json
{
  "_id": "222222222222222222222222",
  "title": "Asha",
  "contactType": "Employee",
  "contactId": "333333333333333333333333",
  "participants": [
    { "_id": "111111111111111111111111", "name": "Neha", "accessRole": "Admin", "designation": "Event Manager", "profileImage": { "smallUrl": "https://example.test/avatar.jpg" } },
    { "_id": "333333333333333333333333", "name": "Asha", "accessRole": "Employee", "designation": "Coordinator" }
  ],
  "eventIds": ["444444444444444444444444"],
  "management": true,
  "status": "Open",
  "lastMessage": null,
  "unreadCount": 0
}
```

`lastMessage` is a Message or null. For one-to-one chat labels, select the participant whose `_id` differs from the authenticated employee; the stored conversation title can be the employee's own name. Do not assume participant ordering.

### POST `/conversations`

```json
{
  "contactType": "Employee",
  "participantId": "111111111111111111111111",
  "eventId": "444444444444444444444444"
}
```

`participantId` required; `contactType` defaults to Employee; `eventId` optional. Do not send `contactId`. Employees cannot create Client/Vendor conversations or chat with themselves. Peer must be active; a non-management peer must share an accessible event with the caller. An explicit event must be accessible to both participants.

Returns HTTP 201 `Success<Conversation>`, including when reusing the existing participant pair. Reuse can add the event link; it does not reopen a Closed conversation. Names are not populated: `participants` is an array of employee ID strings. Refresh the conversation list to obtain participant profiles.

### GET `/conversations/:id`

Returns `Success<Conversation>` with `participants: string[]`, `eventIds`, `contactType`, `contactId`, `title`, `status`, `management`, optional `assignedTo`, and timestamps. Does not add `lastMessage` or `unreadCount`. Do not replace populated inbox participants with these raw IDs in shared UI state. WhatsApp phone is not returned by normal reads.

### PATCH `/conversations/:id`

Employee-supported payload:

```json
{ "eventId": "444444444444444444444444" }
```

Adds the event without duplication; checks every participant's current event access. Returns `Success<Conversation>`. Employees cannot change `status` or `assignedTo`; those fields return 403. No unlink/reopen/close control is available to employees.

## 5. Messages and read state

### GET `/conversations/:id/messages?page=1&limit=25`

Returns `Page<Message>` sorted newest first by `createdAt`, then descending ID. Only pagination is implemented for this endpoint. Reverse/merge pages for chronological display and deduplicate by `_id`. Fetching messages does not mark them read.

```json
{
  "_id": "555555555555555555555555",
  "conversation": "222222222222222222222222",
  "sender": "333333333333333333333333",
  "senderName": "Asha",
  "source": "Dashboard",
  "internal": false,
  "text": "Stage checks are complete.",
  "attachments": [],
  "inboundMedia": [],
  "readBy": ["333333333333333333333333"],
  "dashboard": { "status": "Sent", "attempt": 0 },
  "whatsapp": { "status": "Not applicable", "attempt": 0 },
  "createdAt": "2026-11-18T09:30:00.000Z"
}
```

`attachments` are file IDs, not populated files. Resolve metadata through event file lists. `inboundMedia` entries contain `url`, `contentType` and possibly `_id`; fetch their bytes through the authenticated endpoint below. `source` is Dashboard or WhatsApp. Use `readBy` for dashboard read indicators; reads do not change `dashboard.status`. Channel statuses can be Not applicable, Pending, Sending, Sent, Delivered, Read, Failed or Unknown. Returned records may also include template/provider fields and server-namespaced idempotency metadata; these are not edit fields.

### POST `/conversations/:id/messages`

```json
{
  "text": "Stage checks are complete.",
  "attachments": [],
  "internal": false,
  "idempotencyKey": "7317f0a6-a3fd-488d-9f4e-804de33e891f"
}
```

Returns HTTP 201 `Success<Message>`. `text`: max 4000 characters, defaults empty. `attachments`: defaults empty, max 10 distinct uploaded file IDs. `internal`: defaults false; true is forbidden for employees. `idempotencyKey`: required, max 100 characters, letters/digits/underscore/hyphen only. For the employee composer require nonblank text or at least one attachment. The shared validator also accepts `templateSid` (`HX` plus 32 hexadecimal characters) and `templateVariables` (up to 30 numeric-string keys with string values up to 1000 characters); these are provider-template fields and are not needed for employee dashboard sends.

Conversation must be Open; Closed returns 409. Each attached file must be accessible, non-internal, and belong to an event linked to the conversation. All internal participants must currently have access to that file's event. Uploading a file alone does not send a message.

Employee sends in Employee conversations use Dashboard only. Do not display a channel selector or claim that sending from My Workspace sends WhatsApp. Incoming management/WhatsApp messages can still appear.

Generate one key per logical send, for example `crypto.randomUUID()`. Preserve the same key **and unchanged payload** when retrying a network failure. Same key/content returns the original message; changed content with the same key returns 409. Use a new key for a new message. Retain the original client key rather than reusing the server-namespaced returned key.

### POST `/conversations/:id/read`

```json
{ "throughMessageId": "555555555555555555555555" }
```

Returns `Success<{ read: true }>`. Send the newest message actually rendered in the open conversation. Marks visible messages through that message's timestamp/ID; later messages remain unread. Refresh inbox badges and summary after success.

### GET `/conversations/:id/messages/:messageId/media/:index`

`:index` is a zero-based integer 0-9. Requires an accessible conversation and a non-internal incoming WhatsApp message. Returns HTTP 200 **binary bytes**, not a JSON success envelope. PDF/JPEG/PNG/WebP use inline disposition; other types use attachment/octet-stream. Fetch with cookies, read `response.blob()`, and create/revoke an object URL. Never directly fetch the stored provider URL or put provider credentials in the browser. Missing media returns 404; unavailable configuration 503; upstream failures 502.

## 6. Events

### GET `/events`

Filters: `page`, `limit`, `search` (event name), `conversationId`. Returns `Page<EventSummary>`, sorted by event date then ID ascending. With `conversationId`, only accessible events already linked to that conversation are returned. An empty list means no available context; do not invent an event ID.

```json
{
  "_id": "444444444444444444444444",
  "eventName": "Annual Celebration",
  "eventDate": "2026-11-18T00:00:00.000Z",
  "eventEndDate": "2026-11-19T00:00:00.000Z",
  "venue": "Main Hall",
  "city": "Delhi",
  "guestCount": 150,
  "assignedManager": { "_id": "111111111111111111111111", "name": "Neha" },
  "bookingStatus": "Planning"
}
```

No implemented booking-status/tab filter here. Missing manager may be null.

### GET `/events/:id`

Returns `Success<EventDetail>` with `_id`, `eventName`, `eventDate`, `eventEndDate`, `venue`, `city`, `guestCount`, `assignedManager`, `assignedTeam`, `customer`, `bookingStatus`. Unlike the list, manager/customer references are not populated. This is limited context, not the full event-booking detail contract. Employees cannot PATCH events through this router.

## 7. My tasks

These are Central Command tasks, not the separate general task module. Preserve their IDs and status vocabulary.

### GET `/tasks` and GET `/tasks/:id`

Require `task:view:self`. List filters: `page`, `limit`, `eventId`, `conversationId`, `search` (title), `status`, `tab=All|Today|Upcoming|Done|Active`. Returns `Page<Task>`, sorted by due date then ID ascending; detail returns `Success<Task>`.

Tabs: Done means Completed; Active means Pending/In progress/Changes requested. Today bounds due dates to today in Asia/Kolkata; Upcoming starts tomorrow. Today/Upcoming do not implicitly exclude completed/cancelled records; combine with `status` if needed. Active/Done override `status`.

```json
{
  "_id": "666666666666666666666666",
  "eventId": "444444444444444444444444",
  "conversationId": "222222222222222222222222",
  "title": "Verify stage lighting",
  "instructions": "Check each light and attach a photo.",
  "assignedTo": "333333333333333333333333",
  "createdBy": "111111111111111111111111",
  "dueAt": "2026-11-18T09:30:00.000Z",
  "proofRequired": true,
  "referenceFiles": [],
  "status": "Pending",
  "workUpdate": "",
  "proofFiles": [],
  "history": []
}
```

References are IDs, not populated people/events/files. Optional review fields: `submittedAt`, `reviewedAt`, `reviewedBy`, `feedback`. History entries contain `action`, `actor`, `at`, optional `feedback`. Timestamps may be present.

| Status | Employee action |
|---|---|
| Pending | Save draft or submit |
| In progress | Save draft or submit |
| Changes requested | Read feedback, edit and resubmit |
| Under review | Read-only; wait for management review |
| Completed | Read-only |
| Cancelled | Read-only |

### PATCH `/tasks/:id/draft`

Requires `task:manage:self` and caller to be assignee.

```json
{ "workUpdate": "Lighting checked; awaiting final photo.", "proofFiles": [] }
```

At least one of `workUpdate` (max 5000, empty allowed) or `proofFiles` (max 10 distinct file IDs) is required. Omitted proofFiles retains existing proofs; an explicit array replaces them, including clearing with `[]`. Files must be non-internal and belong to this task's event. Returns `Success<Task>`; saving a Pending task moves it to In progress. Other editable statuses stay unchanged.

### POST `/tasks/:id/submit`

Requires `task:manage:self` and caller to be assignee.

```json
{
  "workUpdate": "All lighting checks passed.",
  "proofFiles": ["888888888888888888888888"]
}
```

Nonblank `workUpdate` required, max 5000 characters. Proof files required when `proofRequired` is true. **Always send the full final proofFiles array:** the submit validator defaults an omitted array to `[]`, so existing draft proofs are not automatically retained. Maximum 10 distinct IDs, uploaded to the same event and non-internal.

Returns `Success<Task>` with status Under review and `submittedAt`. Locked statuses return 409. Management can Approve (Completed) or Request changes (Changes requested with feedback). Employees cannot mark tasks Completed directly, create/edit task definitions, reassign tasks, or review work.

## 8. My follow-ups

Follow-ups are personal reminders. A Call/Message type does not place a call, send a message, or schedule automatic WhatsApp delivery.

### GET `/follow-ups` and GET `/follow-ups/:id`

List filters: `page`, `limit`, `eventId`, `conversationId`, `search` (title), `status`, `tab=All|Today|Upcoming|Done|Active`. Returns `Page<FollowUp>` sorted due date then ID ascending; detail returns `Success<FollowUp>`.

Active means Pending; Done means Done. Today/Upcoming filter dates but do not automatically filter status. Use `tab=Today&status=Pending` for today's unfinished reminders. Records are scoped to caller as assignee or creator.

```json
{
  "_id": "777777777777777777777777",
  "eventId": "444444444444444444444444",
  "conversationId": "222222222222222222222222",
  "title": "Discuss the budget",
  "assignedTo": "333333333333333333333333",
  "createdBy": "333333333333333333333333",
  "dueAt": "2026-11-18T09:40:00.000Z",
  "type": "Call",
  "note": "Confirm the revised estimate.",
  "status": "Pending"
}
```

Statuses: Pending, Done, Cancelled. `completedAt` may be absent, a timestamp, or null. IDs are not populated.

### POST `/follow-ups`

```json
{
  "title": "Discuss the budget",
  "dueAt": "2026-11-18T09:40:00.000Z",
  "type": "Call",
  "note": "Confirm the revised estimate.",
  "eventId": "444444444444444444444444",
  "conversationId": "222222222222222222222222"
}
```

Required: `title` (nonblank, max 200), `dueAt` (ISO timezone), `type` (Call or Message), `eventId`. Optional: `note` (max 5000, empty allowed), `conversationId`, `assignedTo`.

Omit `assignedTo` to default to the caller. An employee can only assign themselves. Event must be accessible; if conversationId is supplied, caller must participate and the event must already be linked to that conversation. Returns HTTP 201 `Success<FollowUp>` with status Pending. Service-lead assignments count as event access.

### PATCH `/follow-ups/:id`

```json
{ "dueAt": "2026-11-19T09:40:00.000Z", "note": "Rescheduled with the client." }
```

At least one of `title`, `dueAt`, `type`, `note`, `assignedTo`; same field limits as creation. Employees may edit only reminders they created, only while Pending. Any assignee value must be their own ID. An employee assigned a management-created reminder cannot reschedule/edit it; ask the creator. Event/conversation cannot be changed here. Returns `Success<FollowUp>`.

### POST `/follow-ups/:id/actions`

```json
{ "action": "Done" }
```

Actions: Done sets status Done and completedAt; Undo sets Pending and clears completedAt; Cancel sets Cancelled and clears completedAt. Assignees can Done/Undo their accessible reminders, including management-created ones. Cancel is restricted to the creator for employees. Cancelled reminders cannot be undone or acted on (409). Returns `Success<FollowUp>`.

## 9. Shared files and evidence

### GET `/files?eventId=444444444444444444444444`

`eventId` is required. Supports `page`, `limit`, `search` (filename). Returns `Page<SharedFile>`, newest created first; excludes removed and internal files. Requires event access.

```json
{
  "_id": "888888888888888888888888",
  "eventId": "444444444444444444444444",
  "uploadedBy": "333333333333333333333333",
  "name": "stage-check.jpg",
  "size": 184320,
  "contentType": "image/jpeg",
  "internal": false,
  "removed": false,
  "createdAt": "2026-11-18T09:20:00.000Z"
}
```

### POST `/files`

Multipart fields: `file` (one nonempty file), `eventId` (required), `internal` (omit or false). Maximum 30 MiB, one file, two text fields. There is no upload MIME allowlist in this router, but inline preview supports only the types listed below. Employees cannot upload internal files.

```js
const form = new FormData();
form.append("file", file);
form.append("eventId", selectedEventId);
const response = await fetch(`${API_BASE}/files`, {
  method: "POST", credentials: "include", body: form,
});
// Check response.ok before accepting response.data._id as a ready file.
```

Do not set Content-Type manually for FormData. Returns HTTP 201 `Success<SharedFile>` after storage succeeds. Store returned `_id` in message attachments or task proofFiles/reference display. No presigned-upload or upload-finalize endpoint exists. Uploading alone neither submits a task nor sends a message.

### GET `/files/:id/preview` and GET `/files/:id/download`

Return JSON, not bytes:

```json
{ "success": true, "data": { "url": "https://example.test/signed-file-url", "expiresIn": 300 } }
```

Request with authentication, then open/fetch the returned signed URL. Preview is inline for PDF/JPEG/PNG/WebP; other types download. URLs expire after 300 seconds: request fresh URLs on demand instead of persisting them as permanent links. Storage unavailability can return 503. Employees cannot rename/delete even their own uploaded files through this router.

## 10. Routes/actions not available to Employee UI

| Route/action | Restriction |
|---|---|
| PUT `/conversations/:id/whatsapp` | Super Admin only |
| POST `/conversations/:id/messages/:messageId/retry` | Service rejects non-management callers; retry dashboard send via original idempotency key instead |
| POST `/conversations` with Client/Vendor | Management only |
| PATCH `/conversations/:id` with status/assignedTo | Management only |
| POST messages with internal=true | Management only |
| PATCH `/events/:id` | Management only |
| POST `/tasks`, PATCH `/tasks/:id`, POST `/tasks/:id/review` | Management only plus task permissions |
| PATCH/DELETE `/files/:id` | Management only |
| GET/POST `/quick-replies`, PATCH/DELETE `/quick-replies/:id` | Management only, including reads |
| POST `/webhooks/whatsapp/inbound`, POST `/webhooks/whatsapp/status` | Provider callbacks, not frontend APIs |

Do not expose management controls based only on a named permission: the role restrictions still apply. There are no employee delete endpoints for conversations, messages, tasks or follow-ups, and no message-edit endpoint.

## 11. Error handling

Global API failures commonly use:

```json
{
  "statusCode": 400,
  "success": false,
  "error": { "message": "Validation message|ERRDVYM_VALIDATION" },
  "message": "Validation message|ERRDVYM_VALIDATION",
  "msg": "Validation message|ERRDVYM_VALIDATION"
}
```

Use HTTP status plus top-level `message`, falling back to `msg`. Nested error shape may vary; do not assume a field-error array. Upload/proxy failures may not use the usual JSON envelope.

| Status | Frontend handling |
|---|---|
| 400 | Invalid/missing fields, missing event context, unlinked conversation event, missing required proof; retain form and show message |
| 401 | Use existing expired-session/login flow |
| 403 | Permission/role/password-change/ownership restriction; show existing app flow or action error |
| 404 | Missing or no-longer-accessible conversation/event/work/file; refresh selection and avoid leaking details |
| 409 | Closed conversation, locked task/reminder, changed record or idempotency conflict; refresh and reconcile before retry |
| 429 | Respect rate limiting/backoff |
| 500/502/503 | Preserve draft, display retryable service error as appropriate; do not claim action succeeded |

Multer upload-limit/protocol errors are not specifically normalized here and may be returned as 500. Enforce the file limit client-side and handle any non-2xx response.

## 12. My Workspace integration sequence

1. Reuse employee session, effective permissions and existing password-change flow. Set `API_BASE` to the backend origin plus `/v2/api/central-command`.
2. Load summary and independently paginated inbox, tasks, follow-ups and accessible events. Gate task calls by their additional permissions; a task permission failure should not blank the inbox.
3. On opening a conversation, load detail, messages and `/events?conversationId=...`. Keep populated inbox participant metadata in a separate cache. Render the other participant's name, designation and small profile image.
4. Offer All/Unread/Needs reply inbox tabs. Mark read only through the newest rendered message. Refresh inbox/summary after reads and sends.
5. For new chats, use `/people`, then POST `/conversations`. Fetch the inbox afterward. Attach event context only when both participants can access it.
6. Require an accessible selected event for task evidence, shared files and follow-up creation. Upload first; include only successful file IDs. For conversation attachments/reminders, ensure the event is linked to the conversation.
7. Task form: retain workUpdate, full proof-file selection and feedback; enable draft/submit only in editable statuses. After submission, show Under review and refetch task/summary. Show requested changes on refresh.
8. Follow-up form: default to self, hide employee assignment selector. Gate edits by creator and Pending status; allow assigned users Done/Undo. Refresh list and summary after mutation.
9. Use loading, empty, forbidden, stale-context, upload-progress and retry states. Retain unsent text and the original idempotency key on uncertain send outcomes.
10. This router has no WebSocket/SSE endpoint. Use explicit refresh or modest polling while the workspace is visible; cancel stale requests when changing selected conversations/events, pause polling in the background and back off on errors.

### Frontend acceptance checks

- Text-only send with `attachments: []` succeeds; retry after a lost response does not duplicate it.
- Participant avatars/designations tolerate missing fields; detail fetch does not overwrite populated participant objects.
- Internal notes, WhatsApp link/retry and management controls are absent for Employee users.
- Service-lead event context works; unrelated event access fails gracefully.
- Required proof prevents empty submission; draft proofs survive submission because the full array is sent.
- Under review/Completed/Cancelled tasks cannot be edited; Changes requested shows feedback and permits resubmission.
- Management-created reminders allow Done/Undo but not employee edits/cancellation; self-created pending reminders can be edited/cancelled.
- File upload errors do not create fake ready attachments; expired signed URLs are renewed.
- Today filters use backend Asia/Kolkata boundaries; displayed timestamps respect the app's chosen timezone.
- Permission loss, event reassignment and 404/409 responses refresh stale state without discarding unsaved input unnecessarily.

## 13. Implementation references

- `src/app.js`: actual mount and global response/error handling.
- `central-command.routes.js`: middleware and endpoint registration.
- `central-command.validation.js`: accepted fields, defaults and limits.
- `central-command.controller.js`: status codes/envelopes and binary media response.
- `central-command.service.js`: inbox, messages, people, event context and summary.
- `central-command.access.js`: conversation/event/file access, including service leads.
- `central-command.work.service.js`: task state transitions and reminder ownership.
- `central-command.file.service.js`: file access, storage and signed URLs.
- `central-command.model.js`, `central-command.constants.js`: shapes and statuses.

This handoff reflects the current local implementation, including the mounted route, participant designation/small image projection, empty attachment support, and service-lead access. Consult source when backend behavior changes; older handoff documents may describe an earlier mount or field set.
