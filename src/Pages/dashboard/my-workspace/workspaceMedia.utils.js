export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const CHAT_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
export function uploadError(file, chat = false) {
  if (!file?.size) return 'Choose a nonempty file.';
  if (file.size > MAX_FILE_BYTES) return 'Choose a file up to 20 MiB.';
  if (chat && !CHAT_FILE_TYPES.includes(file.type)) return 'Choose a JPEG, PNG, GIF, WebP image or PDF.';
  return '';
}
const idOf = value => typeof value === 'string' ? value : value?._id || '';
export function canEditMessage(message, latestOwnId, conversation, employeeId, now = Date.now()) {
  const age = now - new Date(message.createdAt).getTime();
  return conversation.contactType === 'Employee' && conversation.status === 'Open'
    && idOf(message.sender) === employeeId && message.source === 'Dashboard'
    && message._id === latestOwnId && Number.isFinite(age) && age >= 0 && age < 600000
    && Array.isArray(message.readBy) && !message.readBy.some(reader => idOf(reader) !== employeeId)
    && ['Not applicable', 'Failed'].includes(message.whatsapp?.status)
    && !message.templateSid && !message.whatsapp?.templateSid && !message.template && !message.templateId && !message.whatsapp?.template && !message.whatsapp?.templateId;
}
