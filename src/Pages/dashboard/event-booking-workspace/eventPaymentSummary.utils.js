const RECEIVED_PAYMENT_STATUSES = new Set([
  'received',
  'paid',
  'completed',
  'reconciled',
  'partially paid',
]);

const isPresent = (value) => value !== undefined && value !== null && value !== '';

export const paymentAmount = (value) => {
  const parsed = Number(value?.$numberDecimal ?? value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const isIncludedClientPayment = (payment) => Boolean(
  payment
  && !payment.isDeleted
  && payment.eventFinance?.includeInEventSummary !== false
  && payment.eventFinance?.stage !== 'Invoice'
  && payment.transactionType !== 'Refund'
  && (!payment.direction || payment.direction === 'In')
  && (!payment.party?.type || payment.party.type === 'Client'),
);

export const isReceivedClientPayment = (payment) => (
  isIncludedClientPayment(payment)
  && RECEIVED_PAYMENT_STATUSES.has(String(payment.status || '').toLowerCase())
);

const firstAmount = (...values) => {
  const value = values.find(isPresent);
  return value === undefined ? { found: false, value: 0 } : { found: true, value: paymentAmount(value) };
};

const receivedFromTransactions = (payments) => {
  if (!Array.isArray(payments)) return { found: false, value: 0 };

  const seen = new Set();
  let found = false;
  const value = payments.reduce((total, payment, index) => {
    if (!isIncludedClientPayment(payment)) return total;
    found = true;
    if (!isReceivedClientPayment(payment)) return total;

    const key = String(payment._id ?? payment.transactionId ?? payment.receiptNumber ?? `payment-${index}`);
    if (seen.has(key)) return total;
    seen.add(key);
    return total + Math.max(0, paymentAmount(payment.amount));
  }, 0);

  return { found, value };
};

const calculateMetrics = ({ total, received, pending }) => {
  const safeTotal = Math.max(0, paymentAmount(total.value));
  let safeReceived;

  if (received.found) {
    safeReceived = Math.max(0, paymentAmount(received.value));
  } else if (total.found && pending.found) {
    safeReceived = Math.max(0, safeTotal - Math.max(0, paymentAmount(pending.value)));
  } else {
    safeReceived = 0;
  }

  const safePending = total.found
    ? Math.max(0, safeTotal - safeReceived)
    : Math.max(0, paymentAmount(pending.value));
  const percentage = safeTotal > 0
    ? Math.max(0, Math.min(100, Math.round((safeReceived / safeTotal) * 100)))
    : 0;

  return {
    total: safeTotal,
    received: safeReceived,
    pending: safePending,
    percentage,
    clampedPercentage: percentage,
    hasTotal: total.found && safeTotal > 0,
    isComplete: total.found && safeTotal > 0 && safeReceived >= safeTotal,
  };
};

export const paymentMetricsFromClientSummary = (summary = {}) => calculateMetrics({
  total: firstAmount(summary.contractValue, summary.totalAmount),
  received: firstAmount(summary.totalReceived, summary.receivedAmount),
  pending: firstAmount(summary.pendingAmount, summary.balanceAmount, summary.outstandingAmount),
});

export const paymentMetricsFromBooking = (booking = {}) => {
  const summary = booking.paymentSummary || booking.clientPaymentSummary || {};
  const total = firstAmount(
    summary.contractValue,
    summary.totalAmount,
    booking.finance?.bookingValue,
    booking.commercialTerms?.finalContractValue,
    booking.commercialTerms?.totalAmount,
    booking.totalAgreedValue,
    booking.commercialTerms?.baseProposalValue,
  );
  const pending = firstAmount(
    summary.pendingAmount,
    summary.balanceAmount,
    summary.outstandingAmount,
    booking.finance?.amountPending,
  );
  const ledgerReceived = receivedFromTransactions(booking.payments);
  let received = ledgerReceived.found
    ? ledgerReceived
    : firstAmount(
      summary.totalReceived,
      summary.receivedAmount,
      booking.finance?.amountReceived,
    );

  // A stored balance is the safest fallback when a legacy record has no
  // explicit total-received field.
  if (!received.found && total.found && pending.found) {
    received = { found: true, value: Math.max(0, total.value - pending.value) };
  }
  if (!received.found) received = firstAmount(summary.advanceAmount);

  return calculateMetrics({ total, received, pending });
};

export const hasOverduePaymentMilestone = (booking = {}, now = new Date()) => {
  if (paymentMetricsFromBooking(booking).isComplete) return false;
  return (booking.paymentMilestones || []).some((milestone) => {
    if (!milestone || ['Cancelled', 'Paid'].includes(milestone.status)) return false;
    if (paymentAmount(milestone.receivedAmount) >= paymentAmount(milestone.amount)) return false;
    const dueTime = milestone.dueDate ? new Date(milestone.dueDate).getTime() : NaN;
    return milestone.status === 'Overdue' || (Number.isFinite(dueTime) && dueTime < now.getTime());
  });
};
