import {
  isIncludedClientPayment,
  isReceivedClientPayment,
  paymentMetricsFromClientSummary,
} from './eventPaymentSummary.utils.js';

const idOf = value => String(value?._id ?? value ?? '');
const amount = value => Number(value) || 0;

export function nextPaymentMilestone(milestones = []) {
  const dueTime = (item) => {
    const time = Date.parse(item.dueDate);
    return Number.isFinite(time) ? time : Infinity;
  };
  return milestones
    .filter(item => item && ['Pending', 'Scheduled', 'Overdue', 'Partial'].includes(item.status))
    .sort((left, right) => dueTime(left) - dueTime(right))[0];
}

// Combine scheduled milestones with recorded payments that have no milestone.
export function buildClientPaymentRows(data, booking, filters = {}) {
  if (!data) return data;
  const milestones = data.milestones || [];
  const linkedIds = new Set(milestones.flatMap(item => (item.paymentTransactions || []).map(idOf)));
  const payments = [...new Map([...(data.payments || []), ...(booking.payments || [])]
    .filter(isIncludedClientPayment)
    .map(item => [idOf(item), item])).values()];
  const standalone = payments.filter(item => !item.eventFinance?.milestoneId && !linkedIds.has(idOf(item)))
    .map(payment => {
      const received = isReceivedClientPayment(payment) ? amount(payment.amount) : 0;
      return {
        _id: 'payment-' + idOf(payment), paymentId: idOf(payment), isStandalonePayment: true,
        name: payment.title || (payment.isAdvance ? 'Booking advance' : 'Client payment'),
        description: payment.notes || '', dueDate: payment.dueDate,
        amount: amount(payment.amount), receivedAmount: received,
        balance: Math.max(0, amount(payment.amount) - received), status: received ? 'Paid' : 'Scheduled',
        lastPaymentDate: payment.transactionDate, paymentTransactions: [payment],
      };
    });
  const rows = [...milestones, ...standalone];
  const search = (filters.search || '').trim().toLowerCase();
  const filtered = rows.filter(item =>
    (!search || [item.name, item.description].some(value => String(value || '').toLowerCase().includes(search)))
    && (!filters.status || filters.status === 'all' || item.status === filters.status)
    && (!filters.milestone || filters.milestone === 'all' || idOf(item) === filters.milestone));
  const limit = Number(filters.limit) || 10;
  const totalPages = Math.ceil(filtered.length / limit);
  const page = Math.min(Number(filters.page) || 1, Math.max(1, totalPages));
  const payment = paymentMetricsFromClientSummary(data.summary);
  const summary = {
    ...data.summary,
    contractValue: payment.total,
    totalReceived: payment.received,
    pendingAmount: payment.pending,
    receivedPercentage: payment.percentage,
  };
  return { ...data, summary, milestones: filtered.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, totalMilestones: filtered.length, totalPages } };
}
