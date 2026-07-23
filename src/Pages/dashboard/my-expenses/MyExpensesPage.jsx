import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import PageLocked from "@components/components/PageLocked";
import { Textarea } from "@components/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@components/components/ui/sheet";
import {
  BadgeIndianRupee,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  Filter,
  FolderOpen,
  HelpCircle,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import EmployeeService from "@/services/employee.service";
import {
  CategoryBadge,
  DataTable,
  DetailLine,
  formatCurrency,
  formatDate,
  IconPill,
  MetricCard,
  SectionCard,
  StatusBadge,
} from "../my-tasks/components/WorkPanelUI";

const emptyForm = {
  label: "",
  description: "",
  date: "",
  amount: "",
  category: "",
  expenseType: "Event",
  paymentMode: "UPI",
  paidBy: "Self",
  billNumber: "",
  relatedName: "",
  billReceipt: null,
};

export default function MyExpensesPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    category: "all",
    expenseType: "all",
    startDate: "2025-05-01",
    endDate: "2025-05-31",
    page: 1,
  });
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [cancelReason, setCancelReason] = useState("");

  const analyticsQuery = useQuery({
    queryKey: ["my-expense-analytics"],
    queryFn: async () => {
      const response = await EmployeeService.getMyExpenseAnalytics();
      return response.data.analytics;
    },
  });

  const expensesQuery = useQuery({
    queryKey: ["my-expenses", filters],
    queryFn: async () => {
      const response = await EmployeeService.getMyExpenses({
        page: filters.page,
        limit: 8,
        search: filters.search || undefined,
        status: filters.status === "all" ? undefined : filters.status,
        category: filters.category === "all" ? undefined : filters.category,
        expenseType: filters.expenseType === "all" ? undefined : filters.expenseType,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      return response.data;
    },
    placeholderData: (previous) => previous,
  });

  const expenses = expensesQuery.data?.expenses || [];
  const pagination = expensesQuery.data?.pagination;

  const selectedExpense = useMemo(
    () => expenses.find((expense) => expense._id === selectedExpenseId || expense.expenseId === selectedExpenseId),
    [expenses, selectedExpenseId]
  );

  const detailQuery = useQuery({
    queryKey: ["my-expense-detail", selectedExpenseId],
    queryFn: async () => {
      const response = await EmployeeService.getMyExpenseDetail({ expenseId: selectedExpenseId });
      return response.data.expense;
    },
    enabled: Boolean(selectedExpenseId) && isDetailOpen,
  });

  const expenseDetail = { ...selectedExpense, ...(detailQuery.data || {}) };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["my-expenses"] });
    queryClient.invalidateQueries({ queryKey: ["my-expense-detail", selectedExpenseId] });
    queryClient.invalidateQueries({ queryKey: ["my-expense-analytics"] });
  };

  const submitMutation = useMutation({
    mutationFn: ({ mode }) => {
      const formData = buildExpenseFormData(form);
      if (mode === "edit") {
        return EmployeeService.updateMyExpense({ expenseId: selectedExpenseId, formData });
      }
      return EmployeeService.submitMyExpense({ formData });
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Expense saved");
      setSheetMode(null);
      setForm(emptyForm);
      invalidate();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to save expense"),
  });

  const cancelMutation = useMutation({
    mutationFn: () => EmployeeService.cancelMyExpense({ expenseId: selectedExpenseId, reason: cancelReason || "Cancelled from dashboard" }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Expense cancelled");
      setCancelReason("");
      invalidate();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to cancel expense"),
  });

  const optionValues = useMemo(() => {
    const category = [...new Set(expenses.map((expense) => expense.category).filter(Boolean))];
    const status = [...new Set(expenses.map((expense) => expense.status).filter(Boolean))];
    const expenseType = [...new Set(expenses.map((expense) => expense.expenseType).filter(Boolean))];
    return { category, status, expenseType };
  }, [expenses]);

  const analytics = analyticsQuery.data || {};
  const metrics = [
    ["Total Submitted", formatCurrency(analytics.totalSubmitted), "This Year", BadgeIndianRupee, "blue"],
    ["Pending Approval", formatCurrency(analytics.pendingApproval), `${analytics.pendingApprovalCount || 0} Claims`, WalletCards, "orange"],
    ["Approved", formatCurrency(analytics.approved), `${analytics.approvedCount || 0} Claims`, CheckCircle2, "green"],
    ["Rejected / Rework", formatCurrency(analytics.rejectedOrRework), `${analytics.rejectedOrReworkCount || 0} Claim`, ReceiptText, "red"],
    ["Paid / Reimbursed", formatCurrency(analytics.paid), `${analytics.paidCount || 0} Claims`, FileText, "violet"],
    ["This Month Expense", formatCurrency(analytics.thisMonthExpense), "May 2025", CalendarDays, "blue"],
  ];

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: key === "page" ? value : 1 }));

  const openExpenseDetail = (expense) => {
    setSelectedExpenseId(expense._id || expense.expenseId);
    setIsDetailOpen(true);
  };

  const openEdit = () => {
    setForm({
      label: expenseDetail?.label || "",
      description: expenseDetail?.description || "",
      date: expenseDetail?.date ? new Date(expenseDetail.date).toISOString().slice(0, 10) : "",
      amount: expenseDetail?.amount || "",
      category: expenseDetail?.category || "",
      expenseType: expenseDetail?.expenseType || "Event",
      paymentMode: expenseDetail?.paymentMode || "UPI",
      paidBy: expenseDetail?.paidBy || "Self",
      billNumber: expenseDetail?.billNumber || "",
      relatedName: expenseDetail?.relatedTo?.name || "",
      billReceipt: null,
    });
    setSheetMode("edit");
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="min-h-[calc(100vh-4rem)] bg-background p-4 text-foreground md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <PageHeader search={filters.search} onSearch={(value) => setFilter("search", value)} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metrics.map(([label, value, subLabel, Icon, tone]) => (
            <MetricCard key={label} label={label} value={value} subLabel={subLabel} icon={Icon} tone={tone} />
          ))}
        </div>

        <div className="space-y-5">
          <div className="space-y-5">
            <section className="rounded-lg border border-border bg-card shadow-sm">
              <div className="flex flex-col gap-4 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-lg font-semibold text-foreground">My Expense Claims</h2>
                <Button className="h-10 gap-2 bg-slate-950 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground" onClick={() => { setForm(emptyForm); setSheetMode("new"); }}>
                  <Plus className="h-4 w-4" />
                  Submit Expense
                </Button>
              </div>

              <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2 xl:grid-cols-[minmax(150px,180px)_minmax(170px,200px)_minmax(150px,180px)_minmax(320px,350px)_140px]">
                <FilterSelect label="Status" value={filters.status} values={optionValues.status} onChange={(value) => setFilter("status", value)} />
                <FilterSelect label="Categories" value={filters.category} values={optionValues.category} onChange={(value) => setFilter("category", value)} />
                <FilterSelect label="Types" value={filters.expenseType} values={optionValues.expenseType} onChange={(value) => setFilter("expenseType", value)} />
                <div className="flex w-[340px] items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground sm:col-span-2 xl:col-span-1">
                  <Input type="date" value={filters.startDate} onChange={(event) => setFilter("startDate", event.target.value)} className="h-6 min-w-[125px] flex-1 border-0 p-0 shadow-none" />
                  <span className="shrink-0 text-muted-foreground">-</span>
                  <Input type="date" value={filters.endDate} onChange={(event) => setFilter("endDate", event.target.value)} className="h-6 min-w-[125px] flex-1 border-0 p-0 shadow-none" />
                </div>
                <Button variant="outline" className="h-10 gap-2 rounded-md">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>

              {expensesQuery.isFetching && !expenses.length ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-theme-color" />
                  Loading expense claims
                </div>
              ) : (
                <DataTable
                  emptyText="No expense claims found."
                  headers={["#", "Date", "Expense Title", "Related To", "Event / Reference", "Category", "Amount", "Bill", "Status", "Action"]}
                  rows={expenses.map((expense, index) => [
                    (filters.page - 1) * 8 + index + 1,
                    formatDate(expense.date),
                    <button className="text-left font-semibold text-foreground" onClick={() => openExpenseDetail(expense)}>{expense.label}</button>,
                    expense.relatedTo?.type || expense.expenseType,
                    expense.relatedTo?.name,
                    <CategoryBadge>{expense.category}</CategoryBadge>,
                    <span className="font-semibold">{formatCurrency(expense.amount)}</span>,
                    <FileText className="h-5 w-5 text-emerald-600" />,
                    <StatusBadge>{expense.status}</StatusBadge>,
                    <button type="button" onClick={() => openExpenseDetail(expense)} className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted">
                      <MoreVertical className="h-4 w-4" />
                    </button>,
                  ])}
                />
              )}

              <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {expenses.length ? 1 : 0} to {expenses.length} of {pagination?.totalExpenses || expenses.length} claims
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={(pagination?.page || 1) <= 1} onClick={() => setFilter("page", filters.page - 1)}>Previous</Button>
                  {Array.from({ length: Math.min(pagination?.totalPages || 1, 2) }).map((_, index) => (
                    <Button key={index} variant="outline" size="sm" className={(pagination?.page || 1) === index + 1 ? "border-primary text-primary" : ""} onClick={() => setFilter("page", index + 1)}>
                      {index + 1}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={(pagination?.page || 1) >= (pagination?.totalPages || 1)} onClick={() => setFilter("page", filters.page + 1)}>Next</Button>
                </div>
              </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-3">
              <ExpenseDonut analytics={analytics} />
              <TopCategories categories={analytics.topCategories || []} />
              <QuickActions onSubmit={() => { setForm(emptyForm); setSheetMode("new"); }} />
            </div>
          </div>
        </div>
      </div>

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <ExpenseDetailPanel
            expense={expenseDetail}
            loading={detailQuery.isFetching}
            onEdit={openEdit}
            cancelReason={cancelReason}
            setCancelReason={setCancelReason}
            cancelMutation={cancelMutation}
          />
        </SheetContent>
      </Sheet>

        <ExpenseFormSheet
          open={Boolean(sheetMode)}
          mode={sheetMode}
          form={form}
          setForm={setForm}
          onOpenChange={(open) => !open && setSheetMode(null)}
          onSubmit={() => submitMutation.mutate({ mode: sheetMode })}
          loading={submitMutation.isPending}
        />
      </div>
      <PageLocked className="z-[100]" />
    </div>
  );
}

function PageHeader({ search, onSearch }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Expenses</h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/dashboard" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span>My Expenses</span>
        </div>
      </div>
      <div className="relative w-full lg:w-[430px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search expenses, events, categories..." className="h-11 rounded-lg pl-10" />
      </div>
    </div>
  );
}

function ExpenseDetailPanel({ expense, loading, onEdit, cancelReason, setCancelReason, cancelMutation }) {
  if (!expense) {
    return (
      <div>
        <SheetHeader>
          <SheetTitle>Expense Details</SheetTitle>
          <SheetDescription>Select an expense claim to view details.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No expense selected.
        </div>
      </div>
    );
  }

  return (
    <div>
      <SheetHeader className="border-b border-border pb-4">
        <SheetTitle>Expense Details</SheetTitle>
        <SheetDescription>Review claim, approval status, and available actions.</SheetDescription>
      </SheetHeader>
      <div className="space-y-5 pt-5">
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-theme-color" /> : null}
        <div className="flex items-start gap-4">
          <IconPill icon={WalletCards} tone="violet" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{expense.label}</h3>
                <p className="text-sm text-muted-foreground">Claim ID: {expense.expenseId}</p>
              </div>
              <StatusBadge>{expense.status}</StatusBadge>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-b border-border pb-4">
          <DetailLine icon={FolderOpen} label="Related To" value={expense.relatedTo?.type || expense.expenseType} />
          <DetailLine icon={CalendarDays} label="Event Name" value={expense.relatedTo?.name} />
          <DetailLine icon={CalendarDays} label="Expense Date" value={formatDate(expense.date)} />
          <DetailLine icon={ReceiptText} label="Category" value={expense.category} />
          <DetailLine icon={BadgeIndianRupee} label="Amount" value={`${formatCurrency(expense.amount)}.00`} />
          <DetailLine icon={CreditCard} label="Payment Mode" value={expense.paymentMode} />
          <DetailLine icon={WalletCards} label="Paid By" value={expense.paidBy} />
          <DetailLine icon={FileText} label="Bill / Receipt" value={expense.bill?.fileName} />
          <DetailLine icon={FileText} label="Bill Number" value={expense.billNumber || "-"} />
          <DetailLine icon={HelpCircle} label="Notes / Reason" value={expense.description || expense.approval?.remarks} />
        </div>

        <div className="space-y-4 border-b border-border pb-4">
          <h3 className="font-semibold text-foreground">Approval & Payment Status</h3>
          {["Submitted", "Under Review", "Approved", "Paid / Reimbursed"].map((step, index) => (
            <div key={step} className="flex gap-3 text-sm">
              <span className={`mt-1 h-3 w-3 rounded-full ${index === 0 ? "bg-emerald-500" : index === 1 ? "bg-blue-500" : "bg-muted-foreground/40"}`} />
              <div className="flex-1">
                <p className="font-medium text-foreground">{step}</p>
                <p className="text-xs text-muted-foreground">{index < 2 ? expense.approval?.submittedAt ? formatDate(expense.approval.submittedAt) : "Pending" : "Pending"}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Remarks</h3>
          <p className="text-sm text-muted-foreground">{expense.approval?.remarks || "Waiting for approval from manager."}</p>
          <Textarea value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Reason for cancellation..." className="min-h-20 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="gap-2" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Edit Claim
          </Button>
          <Button variant="outline" className="gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-400/30 dark:text-red-300 dark:hover:bg-red-400/10" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
            {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Cancel Claim
          </Button>
        </div>
      </div>
    </div>
  );
}

function ExpenseFormSheet({ open, mode, form, setForm, onOpenChange, onSubmit, loading }) {
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{mode === "edit" ? "Edit Expense Claim" : "Submit Expense"}</SheetTitle>
          <SheetDescription>{mode === "edit" ? "Update editable details for this claim." : "Add a new expense claim for approval."}</SheetDescription>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
          <FormInput label="Expense Title" value={form.label} onChange={(value) => setField("label", value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput label="Date" type="date" value={form.date} onChange={(value) => setField("date", value)} />
            <FormInput label="Amount" type="number" value={form.amount} onChange={(value) => setField("amount", value)} />
            <FormInput label="Category" value={form.category} onChange={(value) => setField("category", value)} />
            <FormInput label="Related Event / Reference" value={form.relatedName} onChange={(value) => setField("relatedName", value)} />
            <SelectField label="Expense Type" value={form.expenseType} values={["Event", "Travel", "Office"]} onChange={(value) => setField("expenseType", value)} />
            <SelectField label="Payment Mode" value={form.paymentMode} values={["UPI", "Cash", "Card", "Bank Transfer"]} onChange={(value) => setField("paymentMode", value)} />
            <FormInput label="Paid By" value={form.paidBy} onChange={(value) => setField("paidBy", value)} />
            <FormInput label="Bill Number" value={form.billNumber} onChange={(value) => setField("billNumber", value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Description</label>
            <Textarea value={form.description} onChange={(event) => setField("description", event.target.value)} className="min-h-24 resize-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Bill Receipt</label>
            <Input type="file" onChange={(event) => setField("billReceipt", event.target.files?.[0] || null)} />
          </div>
          <Button type="submit" className="h-11 w-full gap-2 bg-theme-color" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {mode === "edit" ? "Save Claim" : "Submit Expense"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function ExpenseDonut({ analytics }) {
  return (
    <SectionCard title="Expense Summary (This Month)">
      <div className="flex items-center gap-6">
        <div className="grid h-36 w-36 place-items-center rounded-full" style={{ background: "conic-gradient(#22c55e 0 35%, #ec4899 35% 60%, #f59e0b 60% 78%, #60a5fa 78% 92%, #94a3b8 92% 100%)" }}>
          <div className="grid h-24 w-24 place-items-center rounded-full bg-card text-center">
            <p className="text-xl font-bold">{formatCurrency(analytics.thisMonthExpense)}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
        <div className="flex-1 space-y-3 text-sm">
          {(analytics.topCategories || []).slice(0, 4).map((item) => (
            <div key={item.category} className="flex justify-between">
              <span className="text-muted-foreground">{item.category}</span>
              <span className="font-semibold text-foreground">{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function TopCategories({ categories }) {
  return (
    <SectionCard title="Top Categories (This Month)">
      <div className="space-y-3">
        {categories.length ? categories.map((item) => (
          <div key={item.category} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
            <div className="flex items-center gap-3">
              <IconPill icon={FileText} tone="blue" />
              <span className="text-sm font-medium text-foreground">{item.category}</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{formatCurrency(item.amount)}</span>
          </div>
        )) : <p className="text-sm text-muted-foreground">No category data.</p>}
      </div>
    </SectionCard>
  );
}

function QuickActions({ onSubmit }) {
  const actions = [
    ["Submit New Expense", "Add a new expense claim", FileText],
    ["View My Approvals", "Track approval status", CheckCircle2],
    ["Expense Guidelines", "Company expense policy", ReceiptText],
    ["Need Help?", "Contact admin / finance team", HelpCircle],
  ];
  return (
    <SectionCard title="Quick Actions">
      <div className="space-y-4">
        {actions.map(([title, sub, Icon], index) => (
          <button key={title} type="button" onClick={index === 0 ? onSubmit : undefined} className="flex w-full items-center gap-3 text-left">
            <IconPill icon={Icon} tone={["violet", "green", "orange", "blue"][index]} />
            <span>
              <span className="block text-sm font-semibold text-foreground">{title}</span>
              <span className="text-xs text-muted-foreground">{sub}</span>
            </span>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

function FilterSelect({ label, value, values, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 rounded-md">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label}</SelectItem>
        {values.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function SelectField({ label, value, values, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {values.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function FormInput({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <Input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function buildExpenseFormData(form) {
  const formData = new FormData();
  formData.append("label", form.label);
  formData.append("description", form.description);
  formData.append("date", form.date);
  formData.append("amount", form.amount);
  formData.append("category", form.category);
  formData.append("expenseType", form.expenseType);
  formData.append("paymentMode", form.paymentMode);
  formData.append("paidBy", form.paidBy);
  formData.append("billNumber", form.billNumber);
  formData.append("relatedTo", JSON.stringify({ type: form.expenseType, name: form.relatedName }));
  if (form.billReceipt) formData.append("billReceipt", form.billReceipt);
  return formData;
}
