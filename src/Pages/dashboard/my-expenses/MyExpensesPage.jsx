import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import TabComp from "@components/components/tab-comp";
import useCurrentEmployee from "@/hooks/useCurrentEmployee";
import EmployeeV2Service from "@/services/employee-v2.service";
import AddExpenseDialog from "./components/AddExpenseDialog";
import ExpenseDetailDialog from "./components/ExpenseDetailDialog";
import ExpenseMetrics from "./components/ExpenseMetrics";
import ExpensePageHeader from "./components/ExpensePageHeader";
import AllExpensesTab from "./components/tabs/AllExpensesTab";
import ApprovedExpensesTab from "./components/tabs/ApprovedExpensesTab";
import DraftExpensesTab from "./components/tabs/DraftExpensesTab";
import OfficeAdvanceTab from "./components/tabs/OfficeAdvanceTab";
import PendingReviewTab from "./components/tabs/PendingReviewTab";
import {
  DEFAULT_TAB,
  EMPTY_ANALYTICS,
  EXPENSE_STATUS_BY_TAB,
  EXPENSE_TABS,
  PAGE_SIZE,
  TAB_VALUES,
} from "./components/expense.constants";
import { attachmentSchema, expenseFormSchema } from "./components/expense.schemas";
import {
  buildExpenseFormData,
  createEmptyExpenseForm,
  downloadExpenseCsv,
  getCurrentMonthFilters,
  getErrorMessage,
  joiErrorMap,
  normalizeAnalytics,
  normalizeExpenseResponse,
  toMonthPeriod,
} from "./components/expense.utils";

const LIST_TAB_COMPONENTS = {
  "all-expenses": AllExpensesTab,
  drafts: DraftExpensesTab,
  "pending-review": PendingReviewTab,
  approved: ApprovedExpensesTab,
};

export default function MyExpensesPage() {
  const queryClient = useQueryClient();
  const { data: currentEmployee, isLoading: isEmployeeLoading } = useCurrentEmployee();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = TAB_VALUES.has(requestedTab) ? requestedTab : DEFAULT_TAB;
  const isOfficeAdvanceTab = activeTab === "office-advance";
  const [monthFilters, setMonthFilters] = useState(getCurrentMonthFilters);
  const [filters, setFilters] = useState({
    search: "",
    debouncedSearch: "",
    category: "All Category",
    expenseFor: "All Expense",
    paymentSource: "All Payment Source",
  });
  const [page, setPage] = useState(1);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState(createEmptyExpenseForm);
  const [expenseErrors, setExpenseErrors] = useState({});
  const [expenseFormError, setExpenseFormError] = useState("");
  const monthPeriod = toMonthPeriod(monthFilters);
  const expenseStatus = EXPENSE_STATUS_BY_TAB[activeTab];

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setFilters((current) => ({ ...current, debouncedSearch: current.search.trim() }));
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [filters.search]);

  useEffect(() => {
    if (requestedTab === null || TAB_VALUES.has(requestedTab)) return;
    const next = new URLSearchParams(searchParams);
    next.delete("tab");
    setSearchParams(next, { replace: true });
  }, [requestedTab, searchParams, setSearchParams]);

  useEffect(() => setPage(1), [
    activeTab,
    filters.category,
    filters.debouncedSearch,
    filters.expenseFor,
    filters.paymentSource,
    monthPeriod,
  ]);

  const analyticsQuery = useQuery({
    queryKey: ["employee-expense-analytics", monthPeriod],
    queryFn: async ({ signal }) => {
      const response = await EmployeeV2Service.getEmployeeExpenseAnalytics({ monthPeriod, signal });
      return normalizeAnalytics(response.data?.data);
    },
  });

  const expensesQuery = useQuery({
    queryKey: [
      "employee-expenses",
      monthPeriod,
      activeTab,
      page,
      filters.debouncedSearch,
      filters.category,
      filters.expenseFor,
      filters.paymentSource,
    ],
    queryFn: async ({ signal }) => {
      const response = await EmployeeV2Service.getEmployeeExpenses({
        monthPeriod,
        pagination: page,
        limit: PAGE_SIZE,
        search: filters.debouncedSearch,
        category: filters.category,
        expenseFor: filters.expenseFor,
        paymentSource: filters.paymentSource,
        status: expenseStatus,
        signal,
      });
      return normalizeExpenseResponse(response.data?.data);
    },
    enabled: !isOfficeAdvanceTab,
    placeholderData: (previous) => previous,
  });

  const officeAdvanceQuery = useQuery({
    queryKey: ["employee-office-advance-expenses", monthPeriod],
    queryFn: async ({ signal }) => {
      const response = await EmployeeV2Service.getEmployeeExpenses({
        monthPeriod,
        pagination: 1,
        limit: 100,
        expenseFor: "All Expense",
        category: "All Category",
        paymentSource: "Office Expense Advance",
        signal,
      });
      return normalizeExpenseResponse(response.data?.data).expenses;
    },
    enabled: isOfficeAdvanceTab,
  });

  const analytics = analyticsQuery.data || EMPTY_ANALYTICS;
  const expenses = expensesQuery.data?.expenses || [];
  const totalRows = expensesQuery.data?.pagination.total || 0;
  const totalPages = Math.max(Math.ceil(totalRows / PAGE_SIZE), 1);

  useEffect(() => {
    if (!expensesQuery.isFetching && page > totalPages) setPage(totalPages);
  }, [expensesQuery.isFetching, page, totalPages]);

  const createExpenseMutation = useMutation({
    mutationFn: (payload) => EmployeeV2Service.createEmployeeExpense(buildExpenseFormData(payload)),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Expense submitted successfully");
      setIsAddExpenseOpen(false);
      setExpenseForm(createEmptyExpenseForm());
      setExpenseErrors({});
      setExpenseFormError("");
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ["employee-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["employee-office-advance-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["employee-expense-analytics"] });
    },
    onError: (error) => {
      const validationError = error?.response?.data?.validationError;
      if (validationError && typeof validationError === "object") {
        setExpenseErrors((current) => ({ ...current, ...validationError }));
      }
      const message = getErrorMessage(error, "Unable to submit expense");
      setExpenseFormError(message);
      toast.error(message);
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const request = (pagination) => EmployeeV2Service.getEmployeeExpenses({
        monthPeriod,
        pagination,
        limit: 100,
        search: filters.debouncedSearch,
        category: filters.category,
        expenseFor: filters.expenseFor,
        paymentSource: filters.paymentSource,
        status: expenseStatus,
      });
      const firstPage = normalizeExpenseResponse((await request(1)).data?.data);
      const remainingResponses = firstPage.pagination.totalPages > 1
        ? await Promise.all(Array.from({ length: firstPage.pagination.totalPages - 1 }, (_, index) => request(index + 2)))
        : [];
      return [
        ...firstPage.expenses,
        ...remainingResponses.flatMap((response) => normalizeExpenseResponse(response.data?.data).expenses),
      ];
    },
    onSuccess: (downloadedExpenses) => {
      downloadExpenseCsv(downloadedExpenses, monthPeriod);
      toast.success("Expense statement downloaded");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to download statement")),
  });

  const setActiveTab = (tab) => {
    if (!TAB_VALUES.has(tab)) return;
    const next = new URLSearchParams(searchParams);
    if (tab === DEFAULT_TAB) next.delete("tab");
    else next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const updateExpenseField = (field, value) => {
    setExpenseForm((current) => ({ ...current, [field]: value }));
    setExpenseErrors((current) => ({ ...current, [field]: undefined }));
    setExpenseFormError("");
  };

  const validateExpenseField = (field) => {
    const { error } = expenseFormSchema.extract(field).validate(expenseForm[field]);
    setExpenseErrors((current) => ({ ...current, [field]: error?.details?.[0]?.message }));
  };

  const addExpenseFiles = (files) => {
    const nextFiles = [...expenseForm.attachments, ...files];
    const { error } = attachmentSchema.validate(nextFiles);
    if (error) {
      setExpenseErrors((current) => ({ ...current, attachments: error.details[0].message }));
      return;
    }
    updateExpenseField("attachments", nextFiles);
  };

  const submitExpense = (status) => {
    const payload = {
      ...expenseForm,
      monthPeriod: expenseForm.expenseDate.slice(0, 7),
      ...(status ? { status } : {}),
    };
    const { error, value } = expenseFormSchema.validate(payload, { abortEarly: false, stripUnknown: true });
    if (error) {
      setExpenseErrors(joiErrorMap(error));
      setExpenseFormError("Please correct the highlighted fields");
      return;
    }
    setExpenseErrors({});
    setExpenseFormError("");
    createExpenseMutation.mutate(value);
  };

  const handleAddExpenseOpenChange = (open) => {
    if (!open && createExpenseMutation.isPending) return;
    setIsAddExpenseOpen(open);
    if (!open) {
      setExpenseForm(createEmptyExpenseForm());
      setExpenseErrors({});
      setExpenseFormError("");
    }
  };

  const ListTab = LIST_TAB_COMPONENTS[activeTab] || AllExpensesTab;
  const listTabProps = {
    expenses,
    loading: expensesQuery.isFetching || isEmployeeLoading,
    error: expensesQuery.error,
    onRetry: () => expensesQuery.refetch(),
    onView: setSelectedExpense,
    filters,
    onFilterChange: updateFilter,
    page,
    totalRows,
    onPageChange: setPage,
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <main className="mx-auto max-w-[1700px] space-y-3 p-3 md:p-4">
        <ExpensePageHeader
          monthFilters={monthFilters}
          onMonthChange={setMonthFilters}
          downloadDisabled={isOfficeAdvanceTab}
          downloading={downloadMutation.isPending}
          onDownload={() => downloadMutation.mutate()}
          onAddExpense={() => setIsAddExpenseOpen(true)}
        />
        <ExpenseMetrics analytics={analytics} loading={analyticsQuery.isLoading} />
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <TabComp
            tabs={EXPENSE_TABS}
            value={activeTab}
            onValueChange={setActiveTab}
            className="[&_.tab-comp-trigger]:text-[12px] [&_.tab-comp-trigger]:font-medium"
            listClassName="rounded-none border-x-0 border-t-0 shadow-none"
            ariaLabel="Expense views"
          />
          {isOfficeAdvanceTab ? (
            <OfficeAdvanceTab
              analytics={analytics}
              expenses={officeAdvanceQuery.data || []}
              loading={officeAdvanceQuery.isFetching || analyticsQuery.isLoading}
              error={officeAdvanceQuery.error}
              monthPeriod={monthPeriod}
              onRetry={() => officeAdvanceQuery.refetch()}
            />
          ) : <ListTab {...listTabProps} />}
        </section>
      </main>
      <ExpenseDetailDialog expense={selectedExpense} employee={currentEmployee} onOpenChange={(open) => !open && setSelectedExpense(null)} />
      <AddExpenseDialog
        open={isAddExpenseOpen}
        onOpenChange={handleAddExpenseOpenChange}
        employee={currentEmployee}
        form={expenseForm}
        errors={expenseErrors}
        formError={expenseFormError}
        availableAdvance={analytics.officeAdvanceBalanced.amount}
        onFieldChange={updateExpenseField}
        onFieldBlur={validateExpenseField}
        onAddFiles={addExpenseFiles}
        onRemoveFile={(index) => updateExpenseField("attachments", expenseForm.attachments.filter((_, fileIndex) => fileIndex !== index))}
        onSubmit={submitExpense}
        submitting={createExpenseMutation.isPending}
      />
    </div>
  );
}
