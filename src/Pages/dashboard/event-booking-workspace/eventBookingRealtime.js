export const subscribeEventBookingUpdates = (socket, refresh, delay = 250) => {
  let timer;
  const scheduleRefresh = () => {
    clearTimeout(timer);
    timer = setTimeout(refresh, delay);
  };
  socket.on('event-bookings:changed', scheduleRefresh);
  socket.on('connect', scheduleRefresh);
  return () => {
    clearTimeout(timer);
    socket.off('event-bookings:changed', scheduleRefresh);
    socket.off('connect', scheduleRefresh);
  };
};
