/* eslint-disable react/prop-types */
import { useState } from "react";
import { FileText, UsersRound } from "lucide-react";

import TabComp from "@components/components/tab-comp";
import {
  AddExpenseDialog,
  MoreExpenseFiltersDialog,
} from "./EventExpenseDialogs";
import EventExpenseRegister from "./EventExpenseRegister";
import {
  ExpenseToolbar,
  VendorSettlementToolbar,
} from "./EventCostSettlementToolbars";
import {
  RecordSettlementDialog,
  SettlementDetailDialog,
  SettlementTermsDialog,
} from "./EventVendorSettlementDialogs";
import EventVendorSettlementRegister from "./EventVendorSettlementRegister";

const costTabs = [
  { value: "vendors", label: "Vendor Settlements", icon: UsersRound },
  { value: "expenses", label: "Event Expenses", icon: FileText },
];

const defaultPaymentModes = [
  "Bank Transfer",
  "UPI",
  "NEFT",
  "RTGS",
  "IMPS",
  "Card",
  "Cash",
  "Cheque",
  "Wallet",
  "Other",
];

const extraExpenseFilterKeys = [
  "fundingSource",
  "settlementStatus",
  "proofStatus",
];

const emptyOptions = {};
const emptyList = [];

export default function EventCostSettlementsPanel({
  view,
  onViewChange,
  vendorData,
  vendorFilters,
  onVendorFiltersChange,
  vendorLoading,
  vendorError,
  onRetryVendors,
  expenseData,
  expenseFilters,
  onExpenseFiltersChange,
  expenseLoading,
  expenseError,
  onRetryExpenses,
  onUpdateSettlement,
  onRecordSettlement,
  onAddExpense,
  updatingSettlement,
  recordingSettlement,
  addingExpense,
}) {
  const [termsSettlement, setTermsSettlement] = useState(null);
  const [recordDialog, setRecordDialog] = useState({
    open: false,
    settlement: null,
  });
  const [detailSettlement, setDetailSettlement] = useState(null);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  const vendorOptions = vendorData?.options || emptyOptions;
  const expenseOptions = expenseData?.options || emptyOptions;
  const activeExtraFilters = extraExpenseFilterKeys.filter(
    (key) => expenseFilters[key] && expenseFilters[key] !== "all",
  ).length;

  const setVendorFilter = (key, value) =>
    onVendorFiltersChange({
      ...vendorFilters,
      [key]: value,
      page: key === "page" ? value : 1,
    });

  const setExpenseFilter = (key, value) =>
    onExpenseFiltersChange({
      ...expenseFilters,
      [key]: value,
      page: 1,
    });

  const openRecordDialog = (settlement = null) =>
    setRecordDialog({ open: true, settlement });

  const setRecordDialogOpen = (open) =>
    setRecordDialog((current) => ({
      open,
      settlement: open ? current.settlement : null,
    }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <TabComp
          tabs={costTabs}
          value={view}
          onValueChange={onViewChange}
          variant="detail"
          distribution="content"
          density="compact"
          display="inline-block"
          flush
          className="shrink-0"
          listClassName="[&_.tab-comp-trigger[data-state=active]]:!bg-blue-50 dark:[&_.tab-comp-trigger[data-state=active]]:!bg-blue-400/10"
          ariaLabel="Cost and settlement views"
        />

        {view === "expenses" ? (
          <ExpenseToolbar
            filters={expenseFilters}
            options={expenseOptions}
            activeExtraFilters={activeExtraFilters}
            onFilterChange={setExpenseFilter}
            onMoreFilters={() => setMoreFiltersOpen(true)}
            onAddExpense={() => setExpenseOpen(true)}
          />
        ) : (
          <VendorSettlementToolbar
            filters={vendorFilters}
            options={vendorOptions}
            onFilterChange={setVendorFilter}
            onRecordSettlement={() => openRecordDialog()}
          />
        )}
      </div>

      {view === "expenses" ? (
        <EventExpenseRegister
          data={expenseData}
          filters={expenseFilters}
          onFiltersChange={onExpenseFiltersChange}
          loading={expenseLoading}
          error={expenseError}
          onRetry={onRetryExpenses}
        />
      ) : (
        <EventVendorSettlementRegister
          data={vendorData}
          filters={vendorFilters}
          onFiltersChange={onVendorFiltersChange}
          loading={vendorLoading}
          error={vendorError}
          onRetry={onRetryVendors}
          onViewSettlement={setDetailSettlement}
          onEditSettlement={setTermsSettlement}
          onRecordPayment={openRecordDialog}
        />
      )}

      <SettlementTermsDialog
        settlement={termsSettlement}
        onOpenChange={setTermsSettlement}
        saving={updatingSettlement}
        onSave={onUpdateSettlement}
      />
      <RecordSettlementDialog
        open={recordDialog.open}
        onOpenChange={setRecordDialogOpen}
        settlements={vendorOptions.vendors || emptyList}
        selected={recordDialog.settlement}
        paymentModes={vendorOptions.paymentModes || defaultPaymentModes}
        saving={recordingSettlement}
        onSave={onRecordSettlement}
      />
      <SettlementDetailDialog
        settlement={detailSettlement}
        onOpenChange={setDetailSettlement}
      />
      <MoreExpenseFiltersDialog
        open={moreFiltersOpen}
        onOpenChange={setMoreFiltersOpen}
        filters={expenseFilters}
        options={expenseOptions}
        onApply={(values) =>
          onExpenseFiltersChange({ ...expenseFilters, ...values, page: 1 })
        }
      />
      <AddExpenseDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        options={expenseOptions}
        saving={addingExpense}
        onSave={onAddExpense}
      />
    </div>
  );
}
