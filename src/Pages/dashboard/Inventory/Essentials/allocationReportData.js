const idOf = value => String(value?._id || value || "");

// Read one allocation only. The event screen may combine several documents;
// its visible rows, filters and pagination are deliberately not export inputs.
export async function loadAllocationReport(service, allocationId, booking, categories = [], expectedEventId = null) {
  const response = await service.getInventoryV2AllocationById(allocationId);
  const allocation = response.data?.data;
  if (!allocation || idOf(allocation._id) !== String(allocationId) || allocation.status === "Cancelled" || !Array.isArray(allocation.items))
    throw new Error("The selected allocation is unavailable. Reopen it and retry.");
  if (expectedEventId && idOf(allocation.event) !== String(expectedEventId))
    throw new Error("The allocation does not belong to the opened event. Reopen the event and retry.");
  const lines = allocation.items.filter(line => line.status !== "Cancelled");
  if (!lines.length) throw new Error("This allocation has no active item requirements to export.");
  const identities = new Set();
  for (const line of lines) {
    const id = idOf(line._id);
    if (!id || identities.has(id) || !idOf(line.item) || !line.itemName || !line.category ||
      !Number.isSafeInteger(line.requiredQuantity) || line.requiredQuantity < 1 ||
      !Number.isSafeInteger(line.remainingCommitment) || line.remainingCommitment < 0 || line.remainingCommitment > line.requiredQuantity)
      throw new Error("The complete allocation line data or reservation coverage is unavailable. No report was downloaded.");
    identities.add(id);
  }
  const records = new Map(), itemIds = [...new Set(lines.map(line => idOf(line.item)))];
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(4, itemIds.length) }, async () => {
    while (cursor < itemIds.length) {
      const id = itemIds[cursor++];
      const result = await service.getInventoryV2ItemById(id);
      const item = result.data?.data?.item;
      // Item detail exposes reconciled free stock, after ALL reservations.
      // Allocation line availableQuantity is planning stock excluding its own reservation.
      if (!item || idOf(item._id) !== id || !Number.isSafeInteger(item.availableQuantity) || item.availableQuantity < 0)
        throw new Error("Current item availability could not be loaded. No partial report was downloaded.");
      records.set(id, item);
    }
  }));
  const categoryRank = new Map(categories.map((category, index) => [category.value, index]));
  const firstCategory = new Map();
  lines.forEach(line => { if (!firstCategory.has(line.category)) firstCategory.set(line.category, firstCategory.size); });
  const rows = lines.map((line, index) => {
    const item = records.get(idOf(line.item));
    return { lineId: idOf(line._id), name: line.itemName, category: line.category, image: item.image || null,
      itemId: line.itemId, unit: line.unit, remarks: line.notes || "", planning: line.planning, sourceLocation: line.sourceLocation,
      required: line.requiredQuantity, reserved: line.remainingCommitment, available: item.availableQuantity,
      sequence: Number.isFinite(item.sequence) && item.sequence > 0 ? item.sequence : Number.MAX_SAFE_INTEGER, index };
  }).sort((a, b) => (categoryRank.get(a.category) ?? categories.length + firstCategory.get(a.category)) -
    (categoryRank.get(b.category) ?? categories.length + firstCategory.get(b.category)) || a.sequence - b.sequence || a.index - b.index);
  // Source quantities are saved planning quantities, not evidence of completed dispatch.
  // Only fetch the explicitly linked source allocation; never search unrelated events.
  let source = null;
  if (lines.some(line => line.planning?.eventQuantity > 0)) {
    const sourceId = idOf(allocation.planning?.designatedSourceAllocation);
    if (!sourceId || sourceId === idOf(allocation._id)) throw new Error("The saved event source is unavailable. No report was downloaded.");
    source = (await (service.getAllocationReportSource
      ? service.getAllocationReportSource(allocationId)
      : service.getInventoryV2AllocationById(sourceId))).data?.data;
    if (!source || idOf(source._id) !== sourceId || !source.event || !source.eventName || idOf(source.event) === idOf(allocation.event))
      throw new Error("The linked source event could not be verified. No report was downloaded.");
  }
  const groupsById = new Map();
  const stores = { main_store: "MAIN STORE", central_store: "CENTRAL STORE", admin_office: "ADMIN OFFICE", warehouse_a: "WAREHOUSE A", warehouse_b: "WAREHOUSE B" };
  const add = (key, name, type, row, quantity, releaseAt = null) => {
    if (!quantity) return;
    if (!groupsById.has(key)) groupsById.set(key, { key, name, type, rows: [] });
    groupsById.get(key).rows.push({ ...row, quantity, releaseAt });
  };
  for (const row of rows) {
    const plan = row.planning;
    if (!row.itemId || !row.unit) throw new Error("Item ID or unit is unavailable. No report was downloaded.");
    if (!plan) {
      if (!stores[row.sourceLocation]) throw new Error("The saved source location is unavailable. No report was downloaded.");
      add(`store:${row.sourceLocation}`, stores[row.sourceLocation], "store", row, row.required);
      continue;
    }
    const { mainStoreQuantity, eventQuantity } = plan;
    if (![mainStoreQuantity, eventQuantity].every(q => Number.isSafeInteger(q) && q >= 0) || mainStoreQuantity + eventQuantity !== row.required ||
      !["MAIN_STORE", "EVENT_SOURCE", "SPLIT_SOURCE"].includes(plan.fulfilmentPlan) ||
      (plan.fulfilmentPlan === "MAIN_STORE" && eventQuantity !== 0) ||
      (plan.fulfilmentPlan === "EVENT_SOURCE" && (mainStoreQuantity !== 0 || eventQuantity <= 0)) ||
      (plan.fulfilmentPlan === "SPLIT_SOURCE" && (!mainStoreQuantity || !eventQuantity)))
      throw new Error("Saved source quantities do not reconcile with the allocation. No report was downloaded.");
    add("store:main_store", "MAIN STORE", "store", row, mainStoreQuantity);
    if (eventQuantity) {
      const line = lines.find(entry => idOf(entry._id) === row.lineId);
      const sourceLine = source?.items?.find(entry => idOf(entry._id) === idOf(plan.sourceAllocationLine));
      if (!sourceLine || idOf(sourceLine.item) !== idOf(line.item)) throw new Error("The source item does not match this allocation. No report was downloaded.");
      // releaseBy is a date-only plan for the source allocation, not an actual release timestamp.
      const releaseDay = source.planning?.releaseBy;
      add(`event:${idOf(source._id)}`, source.eventName, "event", row, eventQuantity, releaseDay || null);
    }
  }
  const groups = [...groupsById.values()].sort((a, b) => (a.type === "event") - (b.type === "event"));
  const linkedBooking = booking && (allocation.event ? idOf(booking._id) === idOf(allocation.event)
    : allocation.crmCustomerId && idOf(booking.crmCustomerId) === idOf(allocation.crmCustomerId)) ? booking : null;
  const ownerId = idOf(allocation.createdBy);
  const owner = [allocation.createdBy, linkedBooking?.createdBy, allocation.latestDispatch?.performedBy,
    ...(allocation.returnHistory || []).map(entry => entry.performedBy)].find(person => ownerId && idOf(person) === ownerId && (person?.name || person?.fullName));
  return { allocationId: idOf(allocation._id), reference: allocation.allocationCode || idOf(allocation._id),
    eventName: allocation.eventName, clientName: linkedBooking?.customer?.name,
    eventDate: allocation.eventDate, venue: allocation.venue, plannedIssueDate: allocation.plannedIssueDate,
    owner: owner?.name || owner?.fullName, generatedAt: new Date(),
    requiredFrom: allocation.planning?.requiredFrom, releaseBy: allocation.planning?.releaseBy, quantityLabel: "Planned Qty", groups, rows };
}

// Event Operations has no selected allocation: export all saved allocations for this exact event.
// Customer/CRM matches and visible filtered rows are never report inputs.
export async function loadEventAllocationReport(service, eventId, booking, categories = []) {
  if (!eventId) throw new Error("Open an event before downloading its allocation.");
  const ids = new Set();
  let page = 1, more;
  do {
    const response = await service.listInventoryV2Allocations({ event: eventId, page, limit: 100 });
    const data = response.data?.data;
    if (!Array.isArray(data?.entries)) throw new Error("Event allocations could not be loaded.");
    for (const allocation of data.entries) {
      if (idOf(allocation.event) === String(eventId) && allocation.status !== "Cancelled") ids.add(idOf(allocation._id));
    }
    more = Boolean(data.pagination?.hasNextPage || page < (data.pagination?.totalPages || 1));
    if (more && !data.entries.length) throw new Error("Incomplete event allocation response. Retry the download.");
    page += 1;
  } while (more);
  if (!ids.size) throw new Error("This event has no saved allocations to download.");
  const reports = [];
  for (const id of ids) reports.push(await loadAllocationReport(service, id, booking, categories, eventId));
  if (reports.length === 1) return reports[0];
  const groups = new Map();
  for (const report of reports) for (const group of report.groups) {
    if (!groups.has(group.key)) groups.set(group.key, { ...group, rows: [] });
    groups.get(group.key).rows.push(...group.rows);
  }
  // Do not invent a shared period when separately saved allocations disagree.
  const same = field => reports.every(report => report[field] === reports[0][field]) ? reports[0][field] : undefined;
  return { ...reports[0], reference: reports.map(report => report.reference).join(" / "),
    requiredFrom: same("requiredFrom"), releaseBy: same("releaseBy"),
    rows: reports.flatMap(report => report.rows), groups: [...groups.values()].sort((a, b) => (a.type === "event") - (b.type === "event")) };
}
