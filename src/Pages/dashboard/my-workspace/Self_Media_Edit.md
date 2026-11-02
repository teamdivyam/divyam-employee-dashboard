# Self, chat media and message editing

Implementation guide for Admin and Employee dashboards. All URLs below are relative to `/v2/api/central-command`. Keep the existing authenticated HTTP client, portal cookies, mandatory-password-change handling, permission gates, success envelope (`{ success: true, data: ... }`) and Socket.IO connection.

## 1. Add Self to the context selector

Add a UI-only **Self** option alongside the real events. Do not create a dummy event or send `eventId: "Self"`. Maintain a discriminated selection, for example:

```js
const selection = { kind: "self", employeeId: selectedEmployeeId };
// Or: { kind: "event", eventId: selectedEventId }
```

In Admin's employee conversation, use the employee's `_id` (the conversation's `contactId`). In Employee Dashboard use the logged-in employee's `_id`, including when viewing a colleague conversation: Self always belongs to the logged-in employee there. Do not use an employee code/name or a conversation ID as `employeeId`. Show this option for employee context, not Client/Vendor Self work.

Self belongs to an employee independently of any event or conversation. An employee can access only their own Self context. Admin/Super Admin can access an active employee's Self context. `eventId` and `employeeId` are mutually exclusive. Existing event requests keep working. Existing records do not need to be converted.

### Load the three panels

```http
GET /tasks?employeeId=<employeeId>&page=1&limit=25
GET /follow-ups?employeeId=<employeeId>&page=1&limit=25
GET /files?employeeId=<employeeId>&page=1&limit=25
```

Keep existing `search`, `tab`, `status` and pagination controls where supported. Responses retain `data.items`, `total`, `page`, `limit`. To show all of an employee's Self work, **omit `conversationId`**: passing it to work lists narrows the result to records explicitly linked to that conversation. A missing `employeeId` does not mean Self; unfiltered task/follow-up lists preserve their existing all-accessible-work behavior.

When an actual event is selected, keep the existing `eventId` queries. Self is not returned by `/events`; the UI supplies that selector option. Clear event-only details in the sidebar when Self is selected.

### Create a Self next action (Admin)

```http
POST /tasks
Content-Type: application/json
```

```json
{
  "employeeId": "<employeeId>",
  "assignedTo": "<sameEmployeeId>",
  "title": "Prepare weekly report",
  "instructions": "Upload the completed report",
  "dueAt": "2026-11-01T12:00:00+05:30",
  "proofRequired": true,
  "referenceFiles": []
}
```

Task creation and assignment remain management-only with `task:create`. Employees read their assigned tasks using `task:view:self`, update drafts and submit using `task:manage:self`; the existing review flow remains management-only. Self does not grant employees new task-creation rights. A Self task cannot be reassigned to a different employee: `assignedTo` must equal its `employeeId`.

Use the existing task `PATCH /tasks/:id`, `PATCH /tasks/:id/draft`, `POST /tasks/:id/submit` and `POST /tasks/:id/review` contracts. Upload reference/proof files using the same employee context; another employee's files, chat-only files and event files cannot be used as Self task proof. `eventId`/`employeeId` cannot be changed through task patch.

### Create a Self follow-up

```http
POST /follow-ups
```

```json
{
  "employeeId": "<employeeId>",
  "title": "Submit weekly update",
  "dueAt": "2026-11-01T12:00:00+05:30",
  "type": "Message",
  "note": "Include this week's progress"
}
```

`assignedTo` defaults to `employeeId`; when supplied it must match. Employees can create their own reminders; management can create them for the selected employee. Existing patch/action rules remain unchanged. Dates must include `Z` or a timezone offset.

Task/follow-up creation still permits an optional `conversationId`. If supplied for Self work, it must identify an accessible Employee conversation whose `contactId` equals the Self owner. Omit it for employee-owned work that should survive conversation deletion: the existing conversation delete route deletes work explicitly carrying that conversation ID.

### Upload a Self shared file

```js
const form = new FormData();
form.append("file", file);
form.append("employeeId", employeeId);
// Optional: form.append("internal", "true"); // management only
const { data: envelope } = await api.post("/files", form);
const savedFile = envelope.data;
```

Let the browser/client set the multipart boundary. Do not send an `eventId` or `conversationId` in this request. Files may be at most **20 MiB (20,971,520 bytes)**; this size ceiling now applies to all `/files` uploads. Shared work files retain their existing file-type support, but only supported images/PDFs can subsequently be attached to chat. Internal files remain invisible to employees. File rename/delete remain management-only and used evidence/attachments cannot be deleted through that route.

## 2. Send images and PDFs in employee chat

Use a two-step upload-and-send flow with the existing message API. Chat uploads are scoped to the exact employee conversation and do not require an event or Self selection.

1. Choose a JPEG, PNG, GIF, WebP image or PDF. SVG, HTML and other formats are not supported for chat.
2. Check `file.size <= 20 * 1024 * 1024` locally and show an actionable error for larger files. The backend also checks size and file signature against the declared MIME type.
3. Upload one file per request; wait for its saved `_id`.
4. Send the message with that `_id` in `attachments`. At most ten distinct file IDs are allowed per message.

```js
async function sendAttachment(conversationId, file, caption = "") {
  const form = new FormData();
  form.append("file", file);
  form.append("conversationId", conversationId);
  const uploaded = await api.post("/files", form);
  const fileId = uploaded.data.data._id;
  const payload = {
    text: caption,
    attachments: [fileId],
    internal: false,
    idempotencyKey: crypto.randomUUID(),
  };
  // Retain this exact payload/key for retries if the POST response is lost.
  return api.post(`/conversations/${conversationId}/messages`, payload);
}
```

Use the application's existing API base URL; the example assumes it ends in `/v2/api/central-command`. Attachment-only messages can use `text: ""`. For internal notes, both the upload and message may be marked `internal: true`, and management permissions are required. A chat file cannot be reused in another conversation. Upload failures must not trigger a message send; send retries should reuse the uploaded file and original idempotency key, not reupload it.

Existing event/Self shared files can also be attached if the context matches the conversation and **every participant** has access. Self file access is limited to its employee owner and management; use the conversation-upload flow for peer chats instead. Chat-scoped files do not appear under event or Self shared-file lists. To list them explicitly use `/files?conversationId=<id>`.

### Render attachments on both dashboards

Messages continue to return `attachments` as file IDs. Fetch safe metadata as needed:

```http
GET /files/:id
GET /files/:id/preview
GET /files/:id/download
```

Metadata returns `_id`, `name`, `contentType`, `size`, context IDs and `internal`, without the S3 key. Preview/download return `{ url, expiresIn: 300 }` inside `data`. Use preview for JPEG/PNG/WebP/PDF; GIF downloads are supported but the existing preview policy serves GIF as a download. Show a PDF/file card with filename, size and open/download actions; use an image thumbnail where preview is supported. Renew expired URLs through the authorized API and never persist signed URLs as permanent attachment references. Handle 403/404 when access changes or the conversation is deleted. Treat filenames and message text as text, not HTML.

This implements dashboard chat media. The existing WhatsApp delivery policy is unchanged: provider delivery can fail independently, including due to provider media limits. Display dashboard and WhatsApp delivery status separately; a WhatsApp failure does not mean the dashboard attachment failed. This change does not expand inbound WhatsApp media formats/limits. Uploaded chat files are not automatically removed from storage when a conversation is deleted; the existing delete scope preserves stored files.

## 3. Edit the sender's last unread message

“Seen” means **seen by someone other than the sender**, because sending already adds the sender to `readBy`.

```http
PATCH /conversations/:id/messages/:messageId
Content-Type: application/json
```

```json
{ "text": "Corrected message or attachment caption" }
```

Returns `200 { "success": true, "data": <updatedMessage> }`, including `editedAt`. Display an “Edited” indicator when that field exists. The original `createdAt`, attachments and send idempotency hash remain unchanged.

All conditions must hold:

- Accessible, open Employee conversation.
- Caller is the sender and message source is `Dashboard`.
- It is that sender's latest Dashboard message in the conversation (not necessarily the latest incoming/outgoing message overall). A newer own internal note also makes an older message ineligible for management.
- Less than ten minutes since original `createdAt`; editing does not extend the window. Exactly ten minutes is rejected.
- No other reader exists in `readBy`.
- WhatsApp status is `Not applicable` or `Failed`, and no template is attached. Sending, pending, unknown, sent, delivered and read external deliveries cannot be edited. Editing the dashboard cannot change an already delivered WhatsApp copy.
- New trimmed text has 1–4000 characters. This edits text/captions only; replacing/removing attachments is not supported.

Use these conditions to show an Edit action, but treat the server as authoritative. Do not offer Edit on another user's messages. On `409`, refetch messages and explain that the message is no longer editable; the recipient may have read it while the edit form was open. On success, replace by `_id` in the local cache, close the editor and refresh the inbox preview. Retrying the original send request after an edit still returns the same stored message; do not retry it with a different payload under the original key.

Editing and dashboard message persistence use MongoDB transactions and a conversation revision write to serialize competing sends/edits. The message update additionally checks time, unread state and delivery status atomically. Deploy to a transaction-capable MongoDB replica set/sharded cluster; there is no standalone fallback. Actual transaction concurrency/rollback needs staging verification.

## 4. Realtime, errors and rollout

Reuse `central-command:changed` as described in [FRONTEND-REALTIME.md](./FRONTEND-REALTIME.md). Successful uploads, work changes and message edits emit the existing invalidation notification. Refresh current employee/event queries, messages, inbox and summary without page reload. Cache keys must include account, context kind and context ID. Abort or ignore stale responses when switching between Self, events or employees.

| Status | Frontend handling |
| --- | --- |
| 400 | Missing/conflicting context, wrong assignee/conversation, invalid text or attachment context |
| 401 | Follow normal session refresh/login |
| 403 | Hide inaccessible Self work/files or management actions |
| 404 | Resource or accessible conversation no longer exists |
| 409 | Message no longer editable, locked work, or conflicting send idempotency key; refetch |
| 413 | File exceeds 20 MiB |
| 415 | Chat media format/signature mismatch |
| 503 | File storage is not configured |

No backfill is necessary: existing `eventId` records keep their meaning, Self records store `employeeId`, and chat uploads store `conversationId`. New indexes cover employee work/files and conversation files; deploy indexes using the repository's normal process, without dropping existing indexes. Existing legacy docs saying files require an event or allow 30 MB are superseded by this guide for these routes.

Verify both dashboards in staging:

1. Admin selects employee A → Self, creates a task/reminder and uploads a file. A sees them without selecting an event. Employee B cannot list/get/use them, even with copied IDs.
2. Switch Self → event → another employee: confirm no stale panels or mixed proof-file contexts.
3. Send an image, PDF and attachment-only message with no event selected. Recipient can fetch metadata and preview/download. Check exactly 20 MiB, over-limit, wrong MIME, unsupported format and cross-conversation reuse.
4. Edit the latest own unread message, then verify the recipient and inbox preview update. Reject edits after read, after ten minutes, on an older own message, on another sender's message and during/after external delivery.
5. Race a new send/read against an edit on a transaction-capable staging database. Verify no stale edit succeeds after the competing operation commits.
6. Reconnect both dashboards and confirm messages/edited labels/Self panels catch up without duplicate listeners or duplicate messages.
