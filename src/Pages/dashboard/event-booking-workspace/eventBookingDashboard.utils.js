import { formatDate } from './components/EventBookingComponents';

export const dateParam = (year, month, day) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export const monthRange = ({ year, month }) => ({
  startDate: dateParam(year, month, 1),
  endDate: dateParam(year, month, new Date(year, month, 0).getDate()),
});

export const initials = (name = '') => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase() || 'NA';

export const avatarUrl = (person) => person?.profilePicture?.small
  || person?.profilePicture?.medium
  || person?.profilePicture?.original
  || person?.profileImage?.smallUrl
  || person?.profileImage?.mediumUrl
  || person?.profileImage?.originalUrl
  || person?.profileImage
  || person?.avatar
  || '';

export const customerPhone = (booking) => {
  const phone = String(booking.customer?.phone ?? '').trim();
  if (!phone) return '-';
  return `+91 ${phone.replace(/^\+91\s*/, '')}`;
};

export const bookingCode = (booking) => {
  if (booking.eventCode) return booking.eventCode;
  const year = new Date(booking.eventDate || booking.createdAt || Date.now()).getFullYear();
  return `BK-${year}-${String(booking._id || '').slice(-4).toUpperCase() || '----'}`;
};

export const getEventVisualPreferences = (booking) => {
  if (Array.isArray(booking?.customer?.visualPreferences)) return booking.customer.visualPreferences;
  if (Array.isArray(booking?.finalPreferences)) return booking.finalPreferences;
  if (Array.isArray(booking?.preferences)) return booking.preferences;
  return [];
};

export const getFinalPreferenceCount = (booking) => {
  if (Array.isArray(booking?.customer?.visualPreferences)) {
    return booking.customer.visualPreferences.filter((item) => item?.status === 'Final Preference').length;
  }
  return getEventVisualPreferences(booking).length;
};

export const planningStage = (booking) => {
  if (booking.bookingStatus === 'Completed') return 'Post-Event Closure';
  if (booking.bookingStatus === 'Cancelled') return 'Cancelled';
  if (booking.executionReadiness?.isReady) return 'Execution Ready';
  if (booking.bookingStatus === 'Confirmed') return 'Requirements Lock';
  if (['Proposal Pending', 'Proposal Sent'].includes(booking.bookingStatus)) return 'Client Approvals';
  return 'Onboarding';
};

export const readinessPercentage = (booking) => {
  if (booking.bookingStatus === 'Completed') return 100;
  const readiness = booking.executionReadiness || {};
  const totalTasks = Number(readiness.totalTasks || 0);
  const completedTasks = Number(readiness.completedTasks || 0);
  const calculated = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const percentage = readiness.percentage === undefined || readiness.percentage === null
    ? calculated
    : Number(readiness.percentage);
  return Math.max(0, Math.min(100, Number.isFinite(percentage) ? percentage : calculated));
};

export const planningViewStage = (booking) => {
  if (['Proposal Pending', 'Proposal Sent'].includes(booking.bookingStatus)) return 'Client Approvals';
  const percentage = readinessPercentage(booking);
  if (percentage >= 80) return 'Final Planning';
  if (booking.vendorAssignments?.length || booking.servicesSelected?.some((service) => service.assignedVendor)) {
    return 'Vendor Planning';
  }
  return 'Requirements Locked';
};

export const planningStageStep = (stage) => ({
  'Requirements Locked': 2,
  'Client Approvals': 3,
  'Vendor Planning': 4,
  'Final Planning': 5,
}[stage] || 1);

export const stageClass = (stage) => ({
  'Client Approvals': 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-300',
  'Requirements Lock': 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300',
  'Requirements Locked': 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300',
  'Vendor Planning': 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300',
  'Final Planning': 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300',
  'Execution Ready': 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300',
  'Post-Event Closure': 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300',
  Cancelled: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-400/30 dark:bg-slate-400/10 dark:text-slate-300',
}[stage] || 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-400/30 dark:bg-slate-400/10 dark:text-slate-300');

export const numericAmount = (value) => {
  const parsed = Number(value?.$numberDecimal ?? value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const currencyAmount = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(numericAmount(value));

export const shortPaymentDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(date);
};

const withWeekday = (startDate, endDate, label) => {
  if (!startDate || Number.isNaN(startDate.getTime())) return label;
  const formatter = new Intl.DateTimeFormat('en-GB', { weekday: 'short' });
  const startWeekday = formatter.format(startDate);
  const hasDifferentEndDate = endDate
    && !Number.isNaN(endDate.getTime())
    && startDate.toDateString() !== endDate.toDateString();
  const weekdayLabel = hasDifferentEndDate
    ? `${startWeekday} \u2013 ${formatter.format(endDate)}`
    : startWeekday;
  return `${label} (${weekdayLabel})`;
};

export const eventDateLabel = (booking, { includeWeekday = false } = {}) => {
  const dates = (booking.functions || [])
    .map((item) => item.date && new Date(item.date))
    .filter((date) => date && !Number.isNaN(date.getTime()))
    .sort((a, b) => a - b);

  if (dates.length > 1 && dates[0].toDateString() !== dates.at(-1).toDateString()) {
    const label = compactDateRange(dates[0], dates.at(-1));
    return includeWeekday ? withWeekday(dates[0], dates.at(-1), label) : label;
  }
  if (!booking.eventDate) return 'Date Pending';
  const eventStartDate = new Date(booking.eventDate);
  const eventEndDate = booking.eventEndDate && new Date(booking.eventEndDate);
  if (eventEndDate
    && !Number.isNaN(eventStartDate.getTime())
    && !Number.isNaN(eventEndDate.getTime())
    && eventStartDate.toDateString() !== eventEndDate.toDateString()) {
    const label = compactDateRange(eventStartDate, eventEndDate);
    return includeWeekday ? withWeekday(eventStartDate, eventEndDate, label) : label;
  }
  const label = formatDate(booking.eventDate);
  return includeWeekday ? withWeekday(eventStartDate, eventStartDate, label) : label;
};

const compactDateRange = (startDate, endDate) => {
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const sameMonth = sameYear && startDate.getMonth() === endDate.getMonth();
  const startFormat = sameMonth
    ? { day: '2-digit' }
    : sameYear
      ? { day: '2-digit', month: 'short' }
      : { day: '2-digit', month: 'short', year: 'numeric' };
  const start = new Intl.DateTimeFormat('en-GB', startFormat).format(startDate);
  return `${start} – ${formatDate(endDate)}`;
};

export const daysRemaining = (booking) => {
  if (booking.bookingStatus === 'Completed') return 'Event completed';
  if (booking.bookingStatus === 'Cancelled') return 'Booking cancelled';
  if (!booking.eventDate) return '';
  const eventDate = new Date(booking.eventDate);
  if (Number.isNaN(eventDate.getTime())) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  const days = Math.ceil((eventDate - today) / 86400000);
  if (days === 0) return 'Today';
  return days < 0 ? `${Math.abs(days)} days ago` : `${days} days remaining`;
};

export const getKeyPendingItems = (booking) => {
  const pendingItems = [];
  const addItem = (item) => {
    const normalized = String(item || '').trim();
    if (normalized && !pendingItems.includes(normalized)) pendingItems.push(normalized);
  };

  (booking.issues || [])
    .filter((issue) => !['Resolved', 'Closed'].includes(issue.status))
    .forEach((issue) => addItem(issue.description || issue.issueType));

  if (['Proposal Pending', 'Proposal Sent'].includes(booking.bookingStatus)) addItem('Client approval pending');
  if (!booking.venue) addItem('Venue selection');
  if (!Number(booking.guestCount || 0)) addItem('Guest count finalisation');

  const pendingVendors = (booking.vendorAssignments || []).filter((vendor) => (
    !['Confirmed', 'Accepted'].includes(vendor.confirmationStatus)
  )).length;
  if (pendingVendors) addItem(`${pendingVendors} vendor${pendingVendors === 1 ? '' : 's'} pending`);

  const pendingServices = (booking.servicesSelected || []).filter((service) => (
    !['Confirmed', 'Completed'].includes(service.status)
  )).length;
  if (pendingServices) addItem(`${pendingServices} service confirmation${pendingServices === 1 ? '' : 's'}`);

  (booking.eventTasks || [])
    .filter((task) => task && task.status !== 'Completed')
    .forEach((task) => addItem(task.taskTitle));

  const readiness = booking.executionReadiness || {};
  const pendingTasks = Math.max(0, Number(readiness.totalTasks || 0) - Number(readiness.completedTasks || 0));
  if (pendingTasks) addItem(`${pendingTasks} planning task${pendingTasks === 1 ? '' : 's'} pending`);
  if (readiness.remarks && readinessPercentage(booking) < 100) addItem(readiness.remarks);

  return pendingItems.slice(0, 2);
};

export const getPaymentMetrics = (booking) => {
  const summary = booking.paymentSummary || {};
  const finance = booking.finance || {};
  const total = numericAmount(summary.totalAmount || finance.bookingValue);
  const received = Math.max(
    numericAmount(summary.receivedAmount || finance.amountReceived),
    numericAmount(summary.advanceAmount),
  );
  const pending = booking.paymentStatus === 'Full Paid'
    ? 0
    : Math.max(0, total - received);
  const statusPercentage = Number.parseInt(String(booking.paymentStatus || '').match(/\d+/)?.[0], 10);
  const percentage = booking.paymentStatus === 'Full Paid'
    ? 100
    : total > 0
      ? Math.round((received / total) * 100)
      : Number.isFinite(statusPercentage) ? statusPercentage : 0;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const nextDueDate = summary.nextPaymentDueDate || finance.nextPaymentDueDate;
  const dueLabel = clampedPercentage === 100
    ? 'All payments cleared'
    : nextDueDate
      ? `Next due: ${shortPaymentDate(nextDueDate)}`
      : booking.paymentStatus === 'No Payment'
        ? 'Payment not received'
        : 'Payment pending';

  return { clampedPercentage, dueLabel, pending };
};

export const closureDetails = (booking) => {
  const payment = getPaymentMetrics(booking);
  const functions = booking.functions || [];
  const tasks = booking.eventTasks || [];
  const vendors = booking.vendorAssignments || [];
  const documents = booking.documents || [];
  const timelineText = (booking.timeline || [])
    .map((item) => `${item.title || ''} ${item.description || ''} ${item.note || ''}`)
    .join(' ')
    .toLowerCase();
  const documentText = documents
    .map((item) => `${item.documentName || ''} ${item.documentType || ''}`)
    .join(' ')
    .toLowerCase();
  const checks = [
    { label: 'Event completion', complete: booking.bookingStatus === 'Completed' },
    { label: 'Function closure', complete: !functions.length || functions.every((item) => item.status === 'Completed') },
    { label: 'Task closure', complete: !tasks.length || tasks.every((item) => item.status === 'Completed') },
    { label: 'Vendor work closure', complete: !vendors.length || vendors.every((item) => ['Completed', 'Closed'].includes(item.status) || item.workStatus === 'Closed') },
    { label: 'Vendor settlement', complete: !vendors.length || vendors.every((item) => item.paymentStatus === 'Paid') },
    { label: 'Final payment', complete: payment.clampedPercentage === 100 },
    { label: 'Client feedback', complete: timelineText.includes('feedback') },
    { label: 'Post-event report', complete: documentText.includes('report') || documentText.includes('closure') },
  ];
  const pending = checks.filter((item) => !item.complete);
  const completed = checks.length - pending.length;

  return {
    completed,
    total: checks.length,
    percentage: Math.round((completed / checks.length) * 100),
    pending,
    paymentPending: payment.clampedPercentage < 100,
    key: pending.length ? 'pending' : 'complete',
  };
};

export const getOnboardingProgress = (booking) => {
  const hasManager = Boolean(booking.assignedManager?._id || booking.assignedManager);
  const hasPaymentMilestone = numericAmount(booking.paymentSummary?.receivedAmount)
    + numericAmount(booking.paymentSummary?.advanceAmount) > 0
    || ['Advance Received', 'Partially Received', '30% Received', '50% Received', '75% Received', 'Full Paid']
      .includes(booking.paymentStatus);
  const checks = [
    Boolean(booking.eventDate),
    Boolean(booking.venue || booking.city),
    Number(booking.guestCount || 0) > 0,
    Number(booking.noOfFunctions || 0) > 0 || Boolean(booking.functions?.length),
    Boolean(booking.servicesRequired?.length || booking.servicesSelected?.length),
    hasManager,
    hasPaymentMilestone,
  ];
  const completed = checks.filter(Boolean).length;

  return {
    completed,
    total: checks.length,
    hasManager,
    message: !hasManager
      ? 'Event Manager not assigned'
      : !hasPaymentMilestone
        ? 'Payment milestone pending'
        : completed < checks.length
          ? 'Planning checklist pending'
          : 'Ready to move into planning',
  };
};

export const localDateKey = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const timeOnDate = (dateValue, timeValue) => {
  if (!timeValue) return null;
  const date = new Date(dateValue || Date.now());
  if (Number.isNaN(date.getTime())) return null;
  const match = String(timeValue).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const todayFunctions = (booking) => {
  const todayKey = localDateKey();
  const functions = (booking.functions || []).filter((item) => (
    !item.date || localDateKey(item.date) === todayKey
  ));
  if (functions.length) return functions;
  return [{
    name: booking.eventType || booking.eventName || 'Event',
    date: booking.eventDate,
    status: booking.bookingStatus === 'Completed' ? 'Completed' : 'Confirmed',
  }];
};

export const getLiveDetails = (booking) => {
  const now = new Date();
  const functions = todayFunctions(booking);
  const timedFunctions = functions.map((item) => ({
    ...item,
    startsAt: timeOnDate(item.date || booking.eventDate, item.startTime),
    endsAt: timeOnDate(item.date || booking.eventDate, item.endTime),
  }));
  const currentFunction = timedFunctions.find((item) => item.status === 'In Progress')
    || timedFunctions.find((item) => item.startsAt && (!item.endsAt || item.endsAt >= now))
    || timedFunctions.at(-1);
  const startedAt = currentFunction?.startsAt;
  const endsAt = currentFunction?.endsAt;
  const minutesUntilStart = startedAt ? Math.round((startedAt - now) / 60000) : null;
  const isCompleted = booking.bookingStatus === 'Completed'
    || timedFunctions.every((item) => item.status === 'Completed');

  if (isCompleted) {
    return { key: 'completed', label: 'Completed', detail: 'Function completed', tone: 'emerald', currentFunction, functions: timedFunctions };
  }
  if (currentFunction?.status === 'In Progress' || (startedAt && endsAt && startedAt <= now && endsAt >= now)) {
    return {
      key: 'live',
      label: 'Live Now',
      detail: startedAt ? `Started ${currentFunction.startTime}` : 'In progress',
      tone: 'green',
      currentFunction,
      functions: timedFunctions,
    };
  }
  if (minutesUntilStart !== null && minutesUntilStart >= 0 && minutesUntilStart <= 90) {
    return {
      key: 'starting_soon',
      label: 'Starting Soon',
      detail: `Starts ${currentFunction.startTime}`,
      tone: 'blue',
      currentFunction,
      functions: timedFunctions,
    };
  }
  if (startedAt && startedAt < now) {
    return {
      key: 'delayed',
      label: 'Delayed',
      detail: `Scheduled ${currentFunction.startTime}`,
      tone: 'red',
      currentFunction,
      functions: timedFunctions,
    };
  }
  return {
    key: 'upcoming',
    label: 'Upcoming',
    detail: currentFunction?.startTime ? `Starts ${currentFunction.startTime}` : 'Scheduled today',
    tone: 'slate',
    currentFunction,
    functions: timedFunctions,
  };
};

export const functionTimeLabel = (item) => {
  if (!item?.startTime && !item?.endTime) return 'Time pending';
  if (!item.endTime) return item.startTime;
  return `${item.startTime || 'TBD'} – ${item.endTime}`;
};

export const getNextMilestone = (booking, liveDetails) => {
  const pendingTasks = (booking.eventTasks || [])
    .filter((task) => task && task.status !== 'Completed')
    .sort((left, right) => new Date(left.dueDate || 8640000000000000) - new Date(right.dueDate || 8640000000000000));
  if (pendingTasks.length) {
    const task = pendingTasks[0];
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    return {
      label: task.taskTitle || task.title || 'Pending task',
      time: dueDate && !Number.isNaN(dueDate.getTime())
        ? new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(dueDate)
        : 'Due today',
    };
  }

  const currentIndex = liveDetails.functions.findIndex((item) => item === liveDetails.currentFunction);
  const nextFunction = liveDetails.functions.slice(Math.max(0, currentIndex + 1))
    .find((item) => item.status !== 'Completed');
  if (nextFunction) return { label: nextFunction.name || 'Next function', time: nextFunction.startTime || 'Time pending' };
  if (liveDetails.key === 'completed') return { label: 'All milestones completed', time: '' };
  return { label: 'Execution in progress', time: liveDetails.currentFunction?.endTime || '' };
};

export const liveToneClass = (tone) => ({
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  emerald: 'bg-green-50 text-green-700 dark:bg-green-400/10 dark:text-green-300',
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-400/10 dark:text-slate-300',
}[tone]);

export const inactiveBookingDetails = (booking) => {
  const isOnHold = booking.bookingStatus === 'On Hold';
  const details = isOnHold ? booking.holdDetails || {} : booking.cancellationDetails || {};
  const changedAt = isOnHold ? details.heldAt : details.cancelledAt;
  const fallbackReason = String(booking.notes || '').trim();
  const previousStatus = isOnHold ? details.previousStatus : booking.lastPlanningStatus;
  const snapshotBooking = previousStatus ? { ...booking, bookingStatus: previousStatus } : booking;
  const readiness = readinessPercentage(booking);
  const pendingCount = Math.max(
    getKeyPendingItems(booking).length,
    Number(booking.executionReadiness?.totalTasks || 0) - Number(booking.executionReadiness?.completedTasks || 0),
  );

  return {
    changedAt: changedAt || booking.updatedAt,
    changedBy: details.cancelledByType || (isOnHold ? 'Admin' : 'Not recorded'),
    expectedResumeDate: details.expectedResumeDate,
    isOnHold,
    pendingCount: Math.max(0, pendingCount),
    planningStage: planningViewStage(snapshotBooking),
    readiness,
    reason: details.reason || fallbackReason || (isOnHold ? 'Hold reason not recorded' : 'Cancellation reason not recorded'),
  };
};

export const settlementDetails = (booking) => {
  const payment = getPaymentMetrics(booking);
  const status = booking.settlementStatus
    || (payment.clampedPercentage === 100 ? 'Complete' : booking.bookingStatus === 'Cancelled' ? 'Outstanding' : 'Pending');

  return { ...payment, status };
};
