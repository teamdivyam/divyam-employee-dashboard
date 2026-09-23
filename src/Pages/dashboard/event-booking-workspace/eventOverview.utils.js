const list = (value) => Array.isArray(value) ? value : [];
const idOf = (value) => String(value?._id ?? value ?? '');
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export const overviewDate = (value, withTime = false) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: true } : {}),
  }).format(new Date(value));
};

export const overviewTime = (value) => {
  if (!value) return '-';
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return value;
  const hour = Number(match[1]);
  return `${String(hour % 12 || 12).padStart(2, '0')}:${match[2]}${hour >= 12 ? ' PM' : ' AM'}`;
};

const progress = (label, items, complete) => {
  const total = items.length;
  const done = items.filter(complete).length;
  return { label, total, pending: total - done, percentage: total ? Math.round(done / total * 100) : null };
};

export const buildOverviewDetails = (booking) => {
  const functions = list(booking.functions);
  const services = list(booking.servicesSelected);
  const payments = list(booking.payments);
  const seen = new Set();
  const history = payments.filter((item) => {
    const key = item._id || item.transactionId || item.receiptNumber;
    if (!key) return true;
    if (seen.has(String(key))) return false;
    seen.add(String(key));
    return true;
  }).sort((a, b) => new Date(b.transactionDate || b.paymentDate || b.paidOn || b.createdAt || 0) - new Date(a.transactionDate || a.paymentDate || a.paidOn || a.createdAt || 0));
  const total = number(booking.paymentSummary?.totalAmount ?? booking.finance?.bookingValue);
  const received = number(booking.paymentSummary?.receivedAmount ?? booking.finance?.amountReceived);
  const pending = number(booking.paymentSummary?.pendingAmount ?? booking.finance?.amountPending ?? Math.max(0, total - received));
  const percentage = total > 0 ? Math.max(0, Math.min(100, Math.round(received / total * 100))) : 0;
  const proposalId = idOf(booking.commercialTerms?.acceptedProposalId);
  const proposalVersions = [...list(booking.proposalVersions), ...list(booking.customer?.proposalVersions)]
    .filter((item) => item.fileUrl)
    .sort((a, b) => number(b.version) - number(a.version)
      || new Date(b.createdAt || b.sharedAt || 0) - new Date(a.createdAt || a.sharedAt || 0));
  const proposal = proposalVersions.find((item) => proposalId && idOf(item) === proposalId) || proposalVersions[0];
  return {
    functions, services, history, total, received, pending, percentage, proposal,
    peakGuests: Math.max(number(booking.guestCount), ...functions.map((item) => number(item.guestCount))),
    readinessRows: [
      progress('Client Approvals', list(booking.approvals), (item) => item.status === 'Approved'),
      progress('Vendor Readiness', list(booking.vendorAssignments), (item) => ['Confirmed', 'Accepted', 'Completed'].includes(item.confirmationStatus ?? item.status)),
      progress('Inventory Readiness', list(booking.inventoryRequirements), (item) => ['Ready', 'Confirmed', 'Delivered', 'Completed'].includes(item.status)),
      { label: 'Checklist Readiness', total: number(booking.executionReadiness?.totalTasks), pending: Math.max(0, number(booking.executionReadiness?.totalTasks) - number(booking.executionReadiness?.completedTasks)), percentage: number(booking.executionReadiness?.totalTasks) > 0 ? Math.min(100, Math.round(number(booking.executionReadiness?.completedTasks) / number(booking.executionReadiness?.totalTasks) * 100)) : null },
    ],
  };
};

export const linkedServiceFunctions = (service, functions) => {
  const ids = list(service.linkedFunctions).map(idOf);
  return functions.filter((item) => ids.includes(idOf(item)) || (!ids.length && list(item.linkedServices).includes(service.service)));
};
