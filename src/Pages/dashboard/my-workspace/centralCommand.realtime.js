// Hints are invalidations only. Keep one refresh running and remember hints
// received during it, so a slow HTTP response cannot swallow a later change.
export function subscribeCentralCommand(socket, refresh, onStatus, onError) {
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
        try { await refresh(); } catch (error) { if (!disposed) onError(error); }
      }
    } finally { running = false; }
  }
  const schedule = () => {
    if (disposed) return;
    dirty = true;
    clearTimeout(timer);
    timer = setTimeout(flush, 100);
  };
  const connect = () => { onStatus('connected'); schedule(); };
  const disconnect = () => onStatus('disconnected');
  const error = error => { onStatus('error'); onError(error); };
  socket.on('central-command:changed', schedule);
  socket.on('connect', connect);
  socket.on('disconnect', disconnect);
  socket.on('connect_error', error);
  if (socket.connected) connect();
  else { onStatus('disconnected'); schedule(); }
  return { schedule, dispose: () => {
    disposed = true;
    clearTimeout(timer);
    socket.off('central-command:changed', schedule);
    socket.off('connect', connect);
    socket.off('disconnect', disconnect);
    socket.off('connect_error', error);
  } };
}
