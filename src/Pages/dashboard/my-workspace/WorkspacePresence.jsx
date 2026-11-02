/* eslint-disable react/prop-types */
export default function WorkspacePresence({ presence, available }) {
  if (presence === null) return null;
  const known = available && presence !== undefined;
  const online = known && presence.isOnline === true;
  const lastSeen = known && !online && presence.lastSeenAt ? new Date(presence.lastSeenAt) : null;
  const lastSeenLabel = lastSeen && !Number.isNaN(lastSeen.getTime()) ? lastSeen.toLocaleString() : null;
  const label = known ? online ? 'Online' : 'Offline' : 'Status unavailable';
  return <span className={'workspace-avatar-presence ' + (known ? online ? 'is-online' : 'is-offline' : 'is-unknown')} role="img" aria-label={label} title={label + (lastSeenLabel ? ' · Last seen ' + lastSeenLabel : '')} />;
}
