export const PAGE_SIZE = 5;
export const VALID_TABS = ['all', 'planning', 'execution_ready', 'today', 'completed', 'closed'];
export const EMPTY_FILTERS = {
  eventType: 'all',
  city: 'all',
  closureStatus: 'all',
  dateRange: 'all',
  liveStatus: 'all',
  managerId: 'all',
  paymentStatus: 'all',
  readinessStatus: 'all',
  settlementStatus: 'all',
  status: 'all',
  search: '',
};

export const PLANNING_BOOKING_STATUSES = ['Planning', 'Proposal Pending', 'Proposal Sent'];
export const READINESS_FILTER_OPTIONS = [
  { value: 'marked_ready', label: 'Marked Ready' },
  { value: 'pending_clearance', label: 'Final Clearance Pending' },
  { value: 'complete', label: '100% Complete' },
];
export const LIVE_STATUS_OPTIONS = [
  { value: 'live', label: 'Live Now' },
  { value: 'starting_soon', label: 'Starting Soon' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'delayed', label: 'Delayed' },
];
export const CLOSURE_STATUS_OPTIONS = [
  { value: 'pending', label: 'Closure Pending' },
  { value: 'complete', label: 'All Complete' },
  { value: 'payment_pending', label: 'Payment Pending' },
];
export const EVENT_DATE_RANGE_OPTIONS = [
  { value: 'first_half', label: 'First Half (1–15)' },
  { value: 'second_half', label: 'Second Half (16–End)' },
];
export const HOLD_STATUS_OPTIONS = ['On Hold', 'Cancelled'];
export const SETTLEMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Settlement Pending' },
  { value: 'refund_pending', label: 'Refund Pending' },
  { value: 'outstanding', label: 'Outstanding' },
  { value: 'complete', label: 'Settlement Complete' },
];
