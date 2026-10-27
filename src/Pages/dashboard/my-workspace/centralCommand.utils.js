export const idOf = value => typeof value === 'string' ? value : value?._id || '';
export const initials = name => (name || '').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'NA';
export const dateLabel = value => value && !Number.isNaN(new Date(value).getTime())
  ? new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not set';
export const localDateInput = value => value ? new Date(new Date(value).getTime() + 330 * 60000).toISOString().slice(0, 16) : '';
export function datePayload(value) {
  const date = new Date(value + ':00+05:30');
  if (Number.isNaN(date.getTime())) throw new Error('Enter a valid date and time.');
  return date.toISOString();
}
export function errorMessage(error) {
  const body = error?.response?.data;
  const message = body?.message || body?.msg || error?.message || 'Unable to complete this action.';
  if (message.includes('ROUTE_NOT_FOUND')) return 'Central Command is not available yet. Please contact your administrator.';
  return message.split('|')[0];
}
export function canUse(admin, permission) {
  if (!admin) return false;
  const matches = key => key === '*' || key === permission || (key.endsWith(':*') && permission.startsWith(key.slice(0, -1)));
  if (admin.permissionOverrides?.deny?.some(matches)) return false;
  if (admin.permissionOverrides?.allow?.some(matches)) return true;
  const permissions = admin.effectivePermissions ?? admin.permissions;
  if (Array.isArray(permissions) && permissions.every(p => typeof p === 'string')) return permissions.some(matches);
  return false;
}
export const editableTask = task => ['Pending', 'In progress', 'Changes requested'].includes(task?.status);
export function createSendAttempt(payload, previous) {
  const fingerprint = JSON.stringify(payload);
  return previous?.fingerprint === fingerprint ? previous : { fingerprint, body: { ...payload, idempotencyKey: crypto.randomUUID() } };
}
export function chronologicalMessages(pages) {
  // Offset pages can overlap when a new message arrives. Keep the newest page's
  // channel state instead of replacing it with an older cached copy.
  const unique = new Map();
  for (const page of pages || []) {
    for (const message of page.items || []) {
      if (!unique.has(message._id)) unique.set(message._id, message);
    }
  }
  return [...unique.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a._id.localeCompare(b._id));
}
