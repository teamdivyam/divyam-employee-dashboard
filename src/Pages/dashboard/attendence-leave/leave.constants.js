export const LEAVE_TYPES = [
  "Casual Leave",
  "Emergency Leave",
  "Compensatory Off",
  "Sick Leave",
  "Unpaid Leave",
];

export const LEAVE_DURATIONS = [
  "Full Day",
  "Half Day",
  "Multiple Days",
];

export const HALF_DAY_PERIODS = [
  "First Half",
  "Second Half",
];

export const LEAVE_REQUEST_STATUSES = [
  "Pending",
  "Approved",
  "Rejected",
  "Cancelled",
];

export const LEDGER_TRANSACTION_TYPES = [
  "Opening Balance",
  "Accrual",
  "Leave Taken",
  "Carry Forward",
  "Adjustment",
  "Encashment",
  "Expiry",
  "Reversal",
];

export const LEDGER_SOURCE_TYPES = [
  "Policy",
  "LeaveRequest",
  "ManualAdjustment",
  "CarryForward",
  "AccrualJob",
  "Encashment",
  "System",
];

export function normalizeLeaveRequest(request = {}) {
  return {
    ...request,
    halfDayPeriod: request.halfDayPeriod ?? null,
    workHandover: request.workHandover ?? null,
    attachments: request.attachments || [],
    approvalHistory: (request.approvalHistory || []).map((history) => ({
      ...history,
      remarks: history.remarks ?? null,
      actionBy: history.actionBy ?? null,
    })),
  };
}
