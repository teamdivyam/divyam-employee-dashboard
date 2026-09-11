import axiosRequest from "../utils/axios";

const eventPath = (eventId, suffix = "") => `/event-booking/${eventId}${suffix}`;

const appendValues = (formData, values) => {
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") formData.append(key, value);
  });
};

const EventBookingWorkspaceService = {
  getEventBookingManagers: (params = {}) =>
    axiosRequest.get("/event-booking/managers", { params }),
  getEventBookingAnalytics: (params = {}) =>
    axiosRequest.get("/event-booking/analytics", { params }),
  getEventBookings: (params = {}) =>
    axiosRequest.get("/event-booking", { params }),
  createEventBooking: (formData) => axiosRequest.post("/event-booking", formData),
  adminGetEmployee: (params = {}) => axiosRequest.get("/assigned-clients", { params }),
  getEventBookingDetail: ({ eventId }) => axiosRequest.get(eventPath(eventId)),
  updateEventBooking: ({ eventId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId), formData),
  markEventExecutionReady: ({ eventId, remarks }) =>
    axiosRequest.patch(eventPath(eventId, "/execution-ready"), { remarks }),
  revokeEventExecutionReady: ({ eventId, bookingStatus, note }) =>
    axiosRequest.patch(eventPath(eventId, "/execution-ready/revoke"), { bookingStatus, note }),
  resumeEventBooking: ({ eventId, note }) =>
    axiosRequest.patch(eventPath(eventId, "/resume"), { note }),

  addEventFunction: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/functions"), formData),
  updateEventFunction: ({ eventId, functionId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, `/functions/${functionId}`), formData),
  addEventService: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/services"), formData),
  updateEventService: ({ eventId, serviceId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, `/services/${serviceId}`), formData),
  addEventHospitalityRequirement: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/hospitality"), formData),
  updateEventHospitalityRequirement: ({ eventId, requirementId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, `/hospitality/${requirementId}`), formData),
  addEventGuest: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/guests"), formData),
  updateEventGuest: ({ eventId, guestId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, `/guests/${guestId}`), formData),
  addEventAccommodationProperty: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/properties"), formData),
  updateEventAccommodationProperty: ({ eventId, propertyId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, `/properties/${propertyId}`), formData),
  addEventStayAllocation: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/stays"), formData),
  updateEventStayAllocation: ({ eventId, allocationId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, `/stays/${allocationId}`), formData),
  addEventTransportVehicle: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/vehicles"), formData),
  updateEventTransportVehicle: ({ eventId, vehicleId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, `/vehicles/${vehicleId}`), formData),
  addEventTransportAssignment: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/transports"), formData),
  updateEventTransportAssignment: ({ eventId, assignmentId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, `/transports/${assignmentId}`), formData),
  addEventTeamMember: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/team"), formData),
  addEventPayment: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/payments"), formData),
  addEventTask: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/tasks"), formData),
  addEventDocument: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/documents"), formData),
  addEventVendor: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/vendors"), formData),
  updateEventVendor: ({ eventId, vendorAssignmentId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, `/vendors/${vendorAssignmentId}`), formData),

  getEventInventory: ({ eventId, ...params }) =>
    axiosRequest.get(eventPath(eventId, "/operations/inventory"), { params }),
  addEventInventoryRequirement: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/operations/inventory"), formData),
  updateEventInventoryRequirement: ({ eventId, requirementId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, `/operations/inventory/${requirementId}`), formData),
  deleteEventInventoryRequirement: ({ eventId, requirementId }) =>
    axiosRequest.delete(eventPath(eventId, `/operations/inventory/${requirementId}`)),
  getEventLogistics: ({ eventId, ...params }) =>
    axiosRequest.get(eventPath(eventId, "/operations/logistics"), { params }),
  addEventLogisticsMovement: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/operations/logistics"), formData),
  updateEventLogisticsMovement: ({ eventId, movementId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, `/operations/logistics/${movementId}`), formData),
  deleteEventLogisticsMovement: ({ eventId, movementId }) =>
    axiosRequest.delete(eventPath(eventId, `/operations/logistics/${movementId}`)),
  getEventRunSheet: ({ eventId, ...params }) =>
    axiosRequest.get(eventPath(eventId, "/operations/run-sheet"), { params }),
  addEventRunSheetItem: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/operations/run-sheet"), formData),
  updateEventRunSheetItem: ({ eventId, itemId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, `/operations/run-sheet/${itemId}`), formData),
  deleteEventRunSheetItem: ({ eventId, itemId }) =>
    axiosRequest.delete(eventPath(eventId, `/operations/run-sheet/${itemId}`)),
  uploadEventChecklistProofs: ({ eventId, itemId, files }) => {
    const formData = new FormData();
    Array.from(files || []).forEach((file) => formData.append("files", file));
    return axiosRequest.post(eventPath(eventId, `/operations/run-sheet/${itemId}/proofs`), formData);
  },
  getEventRoleResponsibilities: ({ eventId, ...params }) =>
    axiosRequest.get(eventPath(eventId, "/operations/roles-responsibilities"), { params }),
  addEventRoleResponsibility: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/operations/roles-responsibilities"), formData),
  updateEventRoleResponsibility: ({ eventId, sheetId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, `/operations/roles-responsibilities/${sheetId}`), formData),
  deleteEventRoleResponsibility: ({ eventId, sheetId }) =>
    axiosRequest.delete(eventPath(eventId, `/operations/roles-responsibilities/${sheetId}`)),

  getEventActivities: ({ eventId, ...params }) =>
    axiosRequest.get(eventPath(eventId, "/activity"), { params }),
  addEventInternalNote: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/activity/internal-notes"), formData),
  getEventFinance: ({ eventId }) => axiosRequest.get(eventPath(eventId, "/finance")),
  getEventClientPayments: ({ eventId, ...params }) =>
    axiosRequest.get(eventPath(eventId, "/finance/client-payments"), { params }),
  addEventPaymentMilestone: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/finance/client-payments/milestones"), formData),
  updateEventPaymentMilestone: ({ eventId, milestoneId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, `/finance/client-payments/milestones/${milestoneId}`), formData),
  deleteEventPaymentMilestone: ({ eventId, milestoneId }) =>
    axiosRequest.delete(eventPath(eventId, `/finance/client-payments/milestones/${milestoneId}`)),
  recordEventClientPayment: ({ eventId, milestoneId, receipts = [], ...values }) => {
    const formData = new FormData();
    appendValues(formData, values);
    Array.from(receipts).forEach((file) => formData.append("receipts", file));
    return axiosRequest.post(eventPath(eventId, `/finance/client-payments/milestones/${milestoneId}/payments`), formData);
  },
  downloadEventClientPaymentReport: ({ eventId, ...params }) =>
    axiosRequest.get(eventPath(eventId, "/finance/client-payments/report"), { params, responseType: "blob" }),
  getEventVendorSettlements: ({ eventId, ...params }) =>
    axiosRequest.get(eventPath(eventId, "/finance/cost-settlements/vendor-settlements"), { params }),
  updateEventVendorSettlement: ({ eventId, assignmentId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, `/finance/cost-settlements/vendor-settlements/${assignmentId}`), formData),
  recordEventVendorSettlement: ({ eventId, assignmentId, receipts = [], ...values }) => {
    const formData = new FormData();
    appendValues(formData, values);
    Array.from(receipts).forEach((file) => formData.append("receipts", file));
    return axiosRequest.post(eventPath(eventId, `/finance/cost-settlements/vendor-settlements/${assignmentId}/payments`), formData);
  },
  getEventExpenses: ({ eventId, ...params }) =>
    axiosRequest.get(eventPath(eventId, "/finance/cost-settlements/event-expenses"), { params }),
  addEventExpense: ({ eventId, billReceipt, ...values }) => {
    const formData = new FormData();
    appendValues(formData, values);
    if (billReceipt) formData.append("billReceipt", billReceipt);
    return axiosRequest.post(eventPath(eventId, "/finance/cost-settlements/event-expenses"), formData);
  },
  getEventInvoicesReceipts: ({ eventId, ...params }) =>
    axiosRequest.get(eventPath(eventId, "/finance/invoices-receipts"), { params }),
  createEventInvoice: ({ eventId, invoiceDocument, ...values }) => {
    const formData = new FormData();
    appendValues(formData, values);
    if (invoiceDocument) formData.append("invoiceDocument", invoiceDocument);
    return axiosRequest.post(eventPath(eventId, "/finance/invoices-receipts/invoices"), formData);
  },
  getEventDocuments: ({ eventId, ...params }) =>
    axiosRequest.get(eventPath(eventId, "/finance/documents"), { params }),
  uploadEventDocument: ({ eventId, document, ...values }) => {
    const formData = new FormData();
    appendValues(formData, values);
    if (document) formData.append("document", document);
    return axiosRequest.post(eventPath(eventId, "/finance/documents"), formData);
  },
  attachEventAcceptedProposal: ({ eventId, file, ...values }) => {
    const formData = new FormData();
    appendValues(formData, values);
    formData.append("proposal", file);
    return axiosRequest.post(eventPath(eventId, "/finance/accepted-proposal"), formData);
  },
  updateEventCommercialTerms: ({ eventId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, "/finance/commercial-terms"), formData),
  addEventCommercialChange: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/finance/commercial-changes"), formData),
  updateEventCommercialChange: ({ eventId, changeId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, `/finance/commercial-changes/${changeId}`), formData),
  deleteEventCommercialChange: ({ eventId, changeId }) =>
    axiosRequest.delete(eventPath(eventId, `/finance/commercial-changes/${changeId}`)),
  addEventCommercialNote: ({ eventId, ...formData }) =>
    axiosRequest.post(eventPath(eventId, "/finance/commercial-notes"), formData),
  updateEventCommercialNote: ({ eventId, noteId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, `/finance/commercial-notes/${noteId}`), formData),
  deleteEventCommercialNote: ({ eventId, noteId }) =>
    axiosRequest.delete(eventPath(eventId, `/finance/commercial-notes/${noteId}`)),

  addEventClientApproval: ({ eventId, formData }) =>
    axiosRequest.post(eventPath(eventId, "/approvals"), formData),
  updateEventClientApproval: ({ eventId, approvalId, ...formData }) =>
    axiosRequest.patch(eventPath(eventId, `/approvals/${approvalId}`), formData),
  adminAddCustomerPreference: ({ customerId, formData }) =>
    axiosRequest.post(`/event-booking/customers/${customerId}/preference`, formData),
  getVendors: ({ eventId, ...params }) =>
    axiosRequest.get(eventPath(eventId, "/vendor-options"), { params }),
  addVendorDocument: ({ eventId, vendorId, formData }) =>
    axiosRequest.patch(eventPath(eventId, `/vendors/${vendorId}/documents`), formData, { params: { action: "add" } }),
};

export default EventBookingWorkspaceService;
