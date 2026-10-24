import { formatInTimeZone } from 'date-fns-tz';

const defaultZone = 'Asia/Kolkata';
export const localDateKey = (value = new Date(), timeZone = defaultZone) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? formatInTimeZone(date, timeZone, 'yyyy-MM-dd') : '';
};

export const todayFunctions = (booking, now = new Date(), timeZone = defaultZone) => {
  const today = localDateKey(now, timeZone);
  const functions = (booking.functions || []).filter(item => {
    if (item.status === 'Cancelled') return false;
    const start = localDateKey(item.fromDate || item.date || null, timeZone);
    const end = localDateKey(item.toDate || null, timeZone) || start;
    return !start || (start <= today && today <= end);
  });
  return functions.length ? functions : [{
    name: booking.eventType || booking.eventName || 'Event',
    date: today,
    status: booking.bookingStatus === 'Completed' ? 'Completed' : 'Confirmed',
  }];
};

export const getLiveDetails = (booking, now = new Date(), timeZone = defaultZone) => {
  const today = localDateKey(now, timeZone);
  const eventDate = localDateKey(booking.eventDate || null, timeZone);
  const functions = todayFunctions(booking, now, timeZone);
  const completed = booking.bookingStatus === 'Completed' || (eventDate && eventDate < today);
  const live = eventDate === today;
  return {
    key: completed ? 'completed' : live ? 'live' : 'upcoming',
    label: completed ? 'Completed' : live ? 'Live Today' : 'Upcoming',
    detail: completed ? 'Event date passed' : live ? 'Scheduled today' : 'Scheduled for a later date',
    tone: completed ? 'emerald' : live ? 'green' : 'slate',
    currentFunction: functions[0], functions,
  };
};
