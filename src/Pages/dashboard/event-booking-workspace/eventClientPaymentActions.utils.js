export async function deleteClientPaymentEntry({ selected, eventId, service, refetch }) {
  if (selected.isStandalonePayment) return service.deleteEventClientPayment({ eventId, paymentId: selected.paymentId });
  const result = await refetch({ throwOnError: true });
  const milestone = result.data?.milestones?.find(item => String(item._id) === String(selected._id));
  if (!milestone) throw new Error('Milestone no longer appears in this payment schedule. Refresh and try again.');
  const paymentIds = [...new Set((milestone.paymentTransactions || [])
    .filter(payment => payment && !payment.isDeleted)
    .map(payment => typeof payment === 'string' ? payment : payment._id).filter(Boolean).map(String))];
  for (const paymentId of paymentIds) await service.deleteEventClientPayment({ eventId, paymentId });
  return service.deleteEventPaymentMilestone({ eventId, milestoneId: selected._id });
}
