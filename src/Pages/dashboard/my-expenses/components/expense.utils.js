import { EMPTY_ANALYTICS, PAGE_SIZE } from "./expense.constants";

export function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

export function numberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function displayText(value) {
  return value || "—";
}

export function displayPerson(value) {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return displayText(firstPresent(value.fullName, value.name, value.teamName, value.department, value.employeeId));
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(numberOrZero(value));
}

export function formatOptionalCurrency(value) {
  return value === undefined || value === null || value === "" ? "—" : formatCurrency(value);
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(date);
}

export function formatTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(date).toUpperCase();
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(date);
}

export function formatMonthPeriod(value) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(value || ""))) return "—";
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function getCurrentMonthFilters() {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Kolkata", year: "numeric", month: "numeric" }).formatToParts(new Date());
  return { year: Number(parts.find((part) => part.type === "year")?.value), month: Number(parts.find((part) => part.type === "month")?.value) };
}

export function toMonthPeriod(filters) {
  return `${filters.year}-${String(filters.month).padStart(2, "0")}`;
}

export function getKolkataDate() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function createEmptyExpenseForm() {
  return { expenseName: "", expenseDate: getKolkataDate(), expenseFor: "", linkedTo: "", category: "", paymentSource: "", expenseAmount: "", paidTo: "", businessPurpose: "", supportingNote: "", attachments: [] };
}

export function createExpenseFormFromExpense(expense = {}) {
  return {
    expenseName: expense.expenseName || "",
    expenseDate: String(expense.expenseDate || "").slice(0, 10),
    expenseFor: expense.expenseFor || "",
    linkedTo: expense.linkedTo || "",
    category: expense.category || "",
    paymentSource: expense.paymentSource || "",
    expenseAmount: expense.expenseAmount === undefined || expense.expenseAmount === null
      ? ""
      : String(expense.expenseAmount),
    paidTo: expense.paidTo || "",
    businessPurpose: expense.businessPurpose || "",
    supportingNote: expense.supportingNote || "",
    attachments: [],
  };
}

export function buildExpenseFormData(payload) {
  const formData = new FormData();
  ["expenseName", "expenseDate", "monthPeriod", "expenseFor", "paymentSource", "expenseAmount"].forEach((field) => formData.append(field, String(payload[field])));
  if (payload.status) formData.append("status", payload.status);
  ["linkedTo", "paidTo", "businessPurpose", "supportingNote"].forEach((field) => { if (payload[field]?.trim()) formData.append(field, payload[field].trim()); });
  if (payload.category) formData.append("category", payload.category);
  payload.attachments.forEach((file) => formData.append("attachments", file));
  return formData;
}

export function joiErrorMap(error) {
  return error.details.reduce((errors, detail) => { const field = detail.path[0]; if (field && !errors[field]) errors[field] = detail.message; return errors; }, {});
}

export function normalizeAnalytics(data = {}) {
  return Object.fromEntries(Object.keys(EMPTY_ANALYTICS).map((key) => [key, { amount: numberOrZero(data?.[key]?.amount), counts: numberOrZero(data?.[key]?.counts) }]));
}

export function normalizeExpense(expense = {}) {
  return { ...expense, _id: expense._id || "", expenseId: expense.expenseId || "", expenseName: expense.expenseName || "", category: expense.category || "", linkedTo: expense.linkedTo || "", expenseFor: expense.expenseFor || "", paymentSource: expense.paymentSource || "", status: expense.status || "Pending Finance Review", expenseAmount: numberOrZero(expense.expenseAmount), amountCover: numberOrZero(expense.amountCover), balanceAmount: numberOrZero(expense.balanceAmount) };
}

export function normalizeExpenseResponse(data = {}) {
  const pagination = data?.pagination || {};
  return { expenses: Array.isArray(data?.expenses) ? data.expenses.map(normalizeExpense) : [], pagination: { page: Math.max(numberOrZero(pagination.page), 1), limit: Math.max(numberOrZero(pagination.limit), PAGE_SIZE), total: Math.max(numberOrZero(pagination.total), 0), totalPages: Math.max(numberOrZero(pagination.totalPages), 0) } };
}

export function hasApprovedAmount(expense) {
  return String(expense.status || "").toLowerCase().includes("approved") || expense.amountCover > 0;
}

export function getRecommendedAmount(expense) {
  const financeReview = expense.financeReview || expense.financeApproval || {};
  return firstPresent(financeReview.recommendedAmount, financeReview.approvedAmount, expense.recommendedAmount, hasApprovedAmount(expense) ? expense.amountCover : undefined);
}

export function getAdjustment(expense) {
  if (expense.paymentSource === "Office Expense Advance") return "Adjusted with Advance";
  if (expense.paymentSource === "Paid Directly by Company") return "Not Reimbursable";
  if (expense.paymentSource === "Paid Personally" && hasApprovedAmount(expense)) return "Included in Salary";
  return "—";
}

export function getAdvanceId(advanceExpense) {
  if (typeof advanceExpense === "string") return advanceExpense;
  return advanceExpense?.advanceExpenseId || advanceExpense?.expenseId || "Office advance";
}

export function getActionLabel(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("correction")) return "Edit & Resubmit";
  if (normalized.includes("draft")) return "Edit";
  return "View";
}

export function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.msg || error?.message || fallback;
}

export function expenseDateFromValue(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : undefined;
}

export function expenseDateToValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatExpenseDateValue(value) {
  const [year, month, day] = String(value).split("-");
  return `${day}-${month}-${year}`;
}

export function getInitials(name) {
  return String(name).trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "EM";
}

export function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(Math.round(bytes / 1024), 1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getAttachmentName(attachment) {
  if (typeof attachment === "string") {
    const fileName = attachment.split("/").pop()?.split("?")[0];
    return decodeURIComponent(fileName || "Attachment");
  }
  return firstPresent(attachment?.originalName, attachment?.fileName, attachment?.filename, attachment?.name) || "Attachment";
}

export function getAttachmentUrl(attachment) {
  if (typeof attachment === "string") return attachment;
  return firstPresent(attachment?.url, attachment?.secureUrl, attachment?.fileUrl, attachment?.path);
}

export function getAttachmentSize(attachment) {
  if (!attachment || typeof attachment === "string") return "Attached file";
  if (attachment.formattedSize) return attachment.formattedSize;
  return Number.isFinite(Number(attachment.size)) ? formatFileSize(Number(attachment.size)) : firstPresent(attachment.mimeType, attachment.mimetype, "Attached file");
}

export function getAttachmentKey(attachment, index) {
  if (typeof attachment === "string") return `${attachment}-${index}`;
  return firstPresent(attachment?._id, attachment?.id, getAttachmentUrl(attachment), getAttachmentName(attachment), index);
}

export function downloadCsv(filename, headers, rows) {
  const toCsvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(toCsvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadExpenseCsv(expenses, monthPeriod) {
  downloadCsv(`expense-statement-${monthPeriod}.csv`, ["Claim ID", "Expense Name", "Category", "Linked To", "Expense Date", "Payment Source", "Expense Amount", "Approved Amount", "Status"], expenses.map((expense) => [expense.expenseId, expense.expenseName, expense.category, expense.linkedTo, formatDate(expense.expenseDate), expense.paymentSource, expense.expenseAmount, hasApprovedAmount(expense) ? expense.amountCover : "", expense.status]));
}
