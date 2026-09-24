const idOf = (value) => String(value?._id ?? value ?? "");
const amount = (value) => Number(value) || 0;

// Keep the payment summary aligned with the admin view. The API summary is
// milestone-based, while booking payments can also contain standalone client
// receipts that must be reflected in the received and pending data cards.
function buildClientPaymentSummary(data, booking) {
  if (!data) return data;

  const payments = [
    ...new Map(
      (booking?.payments || [])
        .filter(
          (item) =>
            item &&
            !item.isDeleted &&
            item.eventFinance?.includeInEventSummary !== false &&
            (!item.direction || item.direction === "In") &&
            (!item.party?.type || item.party.type === "Client"),
        )
        .map((item) => [String(item._id || item), item]),
    ).values(),
  ];
  const summary = { ...data.summary };

  if (Array.isArray(booking?.payments)) {
    summary.totalReceived = payments
      .filter((item) => ["Received", "Paid", "Completed"].includes(item.status))
      .reduce((total, item) => total + amount(item.amount), 0);
    summary.pendingAmount = Math.max(
      0,
      amount(summary.contractValue) - summary.totalReceived,
    );
    summary.receivedPercentage =
      amount(summary.contractValue) > 0
        ? Math.round(
            (summary.totalReceived / amount(summary.contractValue)) * 100,
          )
        : 0;
  }

  return summary;
}

// Match the Admin client-payment view: scheduled milestones and client
// payments that were recorded without a milestone are displayed together.
export function buildClientPaymentRows(data, booking, filters = {}) {
  if (!data) return data;

  const milestones = data.milestones || [];
  const linkedIds = new Set(
    milestones.flatMap((item) =>
      (item.paymentTransactions || []).map(idOf),
    ),
  );
  const payments = [
    ...new Map(
      (booking?.payments || [])
        .filter(
          (item) =>
            item &&
            !item.isDeleted &&
            item.eventFinance?.includeInEventSummary !== false &&
            (!item.direction || item.direction === "In") &&
            (!item.party?.type || item.party.type === "Client"),
        )
        .map((item) => [idOf(item), item]),
    ).values(),
  ];
  const standalone = payments
    .filter(
      (item) =>
        !item.eventFinance?.milestoneId && !linkedIds.has(idOf(item)),
    )
    .map((payment) => {
      const received = ["Received", "Paid", "Completed"].includes(
        payment.status,
      )
        ? amount(payment.amount)
        : 0;
      return {
        _id: `payment-${idOf(payment)}`,
        paymentId: idOf(payment),
        isStandalonePayment: true,
        name:
          payment.title ||
          (payment.isAdvance ? "Booking advance" : "Client payment"),
        description: payment.notes || "",
        dueDate: payment.dueDate,
        amount: amount(payment.amount),
        receivedAmount: received,
        balance: Math.max(0, amount(payment.amount) - received),
        status: received ? "Paid" : "Scheduled",
        lastPaymentDate: payment.transactionDate,
        paymentTransactions: [payment],
      };
    });
  const rows = [...milestones, ...standalone];
  const search = (filters.search || "").trim().toLowerCase();
  const filtered = rows.filter(
    (item) =>
      (!search ||
        [item.name, item.description].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(search),
        )) &&
      (!filters.status ||
        filters.status === "all" ||
        item.status === filters.status) &&
      (!filters.milestone ||
        filters.milestone === "all" ||
        idOf(item) === filters.milestone),
  );
  const limit = Number(filters.limit) || 10;
  const totalPages = Math.ceil(filtered.length / limit);
  const page = Math.min(
    Number(filters.page) || 1,
    Math.max(1, totalPages),
  );

  return {
    ...data,
    summary: buildClientPaymentSummary(data, booking),
    milestones: filtered.slice((page - 1) * limit, page * limit),
    pagination: {
      page,
      limit,
      totalMilestones: filtered.length,
      totalPages,
    },
  };
}
