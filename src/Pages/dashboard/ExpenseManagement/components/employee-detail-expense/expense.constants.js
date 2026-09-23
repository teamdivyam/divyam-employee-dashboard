import {
  BadgeIndianRupee,
  Building2,
  Clock3,
  FileText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

export const PAGE_SIZE = 7;
export const DEFAULT_TAB = "all-expenses";
export const TAB_VALUES = new Set([
  DEFAULT_TAB,
  "drafts",
  "pending-review",
  "approved",
  "office-advance",
]);

export const EXPENSE_STATUS_BY_TAB = {
  drafts: "draft",
  "pending-review": "pending review",
  approved: "approved",
};

export const CATEGORY_OPTIONS = [
  "All Category",
  "Travel",
  "Fuel",
  "Food",
  "Material Purchase",
  "Event Essentials",
  "Hospitality",
  "Logistics",
  "Vendor Payment",
  "Office Purchase",
  "Miscellaneous",
];

export const EXPENSE_FOR_OPTIONS = [
  "All Expense",
  "Event",
  "Client",
  "Office",
  "General Work",
];

export const PAYMENT_SOURCE_OPTIONS = [
  "All Payment Source",
  "Paid Personally",
  "Office Expense Advance",
  "Paid Directly by Company",
];

export const EXPENSE_TABS = [
  { value: DEFAULT_TAB, label: "All Expenses", icon: WalletCards },
  { value: "drafts", label: "Drafts", icon: FileText },
  { value: "pending-review", label: "Pending Review", icon: Clock3 },
  { value: "approved", label: "Approved", icon: ShieldCheck },
  { value: "office-advance", label: "Office Advance", icon: Building2 },
];

export const METRIC_CONFIG = [
  { key: "totalClaim", label: "Total Claimed", icon: WalletCards, iconClass: "bg-[hsl(var(--chart-1)/0.12)] text-[hsl(var(--chart-1))]", suffix: "Claims" },
  { key: "draftExpense", label: "Draft Expenses", icon: FileText, iconClass: "bg-[hsl(var(--chart-3)/0.12)] text-[hsl(var(--chart-3))]", suffix: "Claims" },
  { key: "pendingReview", label: "Pending Review", icon: Clock3, iconClass: "bg-[hsl(var(--chart-3)/0.12)] text-[hsl(var(--chart-3))]", suffix: "Claims" },
  { key: "approvedAmount", label: "Approved Amount", icon: ShieldCheck, iconClass: "bg-[hsl(var(--chart-2)/0.12)] text-[hsl(var(--chart-2))]", suffix: "Claims" },
  { key: "officeAdvanceReceived", label: "Office Advance Received", icon: Building2, iconClass: "bg-[hsl(var(--chart-4)/0.12)] text-[hsl(var(--chart-4))]", suffix: "This Month" },
  { key: "officeAdvanceBalanced", label: "Office Advance Balance", icon: BadgeIndianRupee, iconClass: "bg-[hsl(var(--chart-5)/0.12)] text-[hsl(var(--chart-5))]", suffix: "Available Balance" },
];

export const EMPTY_ANALYTICS = {
  totalClaim: { amount: 0, counts: 0 },
  draftExpense: { amount: 0, counts: 0 },
  pendingReview: { amount: 0, counts: 0 },
  approvedAmount: { amount: 0, counts: 0 },
  officeAdvanceReceived: { amount: 0, counts: 0 },
  officeAdvanceBalanced: { amount: 0, counts: 0 },
};
