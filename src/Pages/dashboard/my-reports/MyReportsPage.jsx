import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import EmployeeService from "@/services/employee.service";
import PageLocked from "@components/components/PageLocked";
import {
  emptyReportForm,
  PageHeader,
  ReportDetailSheet,
  ReportFilters,
  ReportFormSheet,
  ReportMetrics,
  ReportsTable,
  REPORT_LIMIT,
} from "./components/MyReportsComponents";

export default function MyReportsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    reportType: "all",
    relatedTo: "all",
    page: 1,
  });
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formMode, setFormMode] = useState(null);
  const [form, setForm] = useState(emptyReportForm);

  const analyticsQuery = useQuery({
    queryKey: ["my-report-analytics"],
    queryFn: async () => {
      const response = await EmployeeService.getMyReportAnalytics();
      return response.data.analytics;
    },
  });

  const reportsQuery = useQuery({
    queryKey: ["my-reports", filters],
    queryFn: async () => {
      const response = await EmployeeService.getMyReports({
        page: filters.page,
        limit: REPORT_LIMIT,
        search: filters.search || undefined,
        status: filters.status === "all" ? undefined : filters.status,
        reportType: filters.reportType === "all" ? undefined : filters.reportType,
        relatedTo: filters.relatedTo === "all" ? undefined : filters.relatedTo,
      });
      return response.data;
    },
    placeholderData: (previous) => previous,
  });

  const employeeSelectQuery = useQuery({
    queryKey: ["my-report-select-employees"],
    queryFn: async () => {
      const response = await EmployeeService.getMyReportEmployees({ limit: 50 });
      return response.data.employees || [];
    },
  });

  const eventSelectQuery = useQuery({
    queryKey: ["my-report-select-events"],
    queryFn: async () => {
      const response = await EmployeeService.getMyReportEvents({ limit: 50 });
      return response.data.events || [];
    },
  });

  const reports = reportsQuery.data?.reports || [];
  const pagination = reportsQuery.data?.pagination;
  const meta = reportsQuery.data?.meta || {};

  const selectedFromList = useMemo(
    () => reports.find((report) => report._id === selectedReportId || report.reportId === selectedReportId),
    [reports, selectedReportId]
  );

  const detailQuery = useQuery({
    queryKey: ["my-report-detail", selectedReportId],
    queryFn: async () => {
      const response = await EmployeeService.getMyReportDetail({ reportId: selectedReportId });
      return response.data.report;
    },
    enabled: Boolean(selectedReportId) && isDetailOpen,
  });

  const reportDetail = selectedReportId ? { ...selectedFromList, ...(detailQuery.data || {}) } : null;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["my-reports"] });
    queryClient.invalidateQueries({ queryKey: ["my-report-analytics"] });
    if (selectedReportId) {
      queryClient.invalidateQueries({ queryKey: ["my-report-detail", selectedReportId] });
    }
  };

  const submitMutation = useMutation({
    mutationFn: ({ mode }) => {
      if (mode === "resubmit") {
        return EmployeeService.resubmitMyReport({
          reportId: selectedReportId,
          data: buildResubmitPayload(form),
        });
      }
      const formData = buildReportFormData(form, mode);
      if (mode === "edit") {
        return EmployeeService.updateMyReport({ reportId: selectedReportId, formData });
      }
      return EmployeeService.submitMyReport({ formData });
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Report saved successfully");
      setFormMode(null);
      setForm(emptyReportForm);
      invalidate();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to save report"),
  });

  const setFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === "page" ? value : 1,
    }));
  };

  const openDetail = (report) => {
    setSelectedReportId(report._id || report.reportId);
    setIsDetailOpen(true);
  };

  const openSubmit = () => {
    setForm(emptyReportForm);
    setFormMode("new");
  };

  const openEdit = () => {
    if (!reportDetail) return;
    setForm(reportToForm(reportDetail));
    setFormMode("edit");
  };

  const openResubmit = () => {
    if (!reportDetail) return;
    setForm(reportToForm(reportDetail));
    setFormMode("resubmit");
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 p-4 text-slate-950 md:p-6">
        <div className="mx-auto max-w-[1700px] space-y-4">
        <PageHeader search={filters.search} onSearch={(value) => setFilter("search", value)} />
        <ReportMetrics analytics={analyticsQuery.data || {}} />

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <ReportFilters
            filters={filters}
            meta={meta}
            onFilter={setFilter}
            onSubmitReport={openSubmit}
          />
          <ReportsTable
            reports={reports}
            filters={filters}
            pagination={pagination}
            loading={reportsQuery.isFetching}
            onView={openDetail}
            onPage={(page) => setFilter("page", page)}
          />
        </section>
      </div>

      <ReportDetailSheet
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        report={reportDetail}
        loading={detailQuery.isFetching}
        onEdit={openEdit}
        onResubmit={openResubmit}
      />

        <ReportFormSheet
          open={Boolean(formMode)}
          mode={formMode}
          form={form}
          setForm={setForm}
          meta={meta}
          employees={employeeSelectQuery.data || []}
          events={eventSelectQuery.data || []}
          loading={submitMutation.isPending}
          onOpenChange={(open) => !open && setFormMode(null)}
          onSubmit={() => submitMutation.mutate({ mode: formMode })}
        />
      </div>
      <PageLocked className="z-[100]" />
    </div>
  );
}

function buildReportFormData(form, mode) {
  const formData = new FormData();
  formData.append("reportTitle", form.reportTitle);
  formData.append("reportType", form.reportType);
  formData.append("relatedTo", form.relatedTo);
  if (form.relatedEvent) formData.append("relatedEvent", form.relatedEvent);
  if (form.relatedTask) formData.append("relatedTask", form.relatedTask);
  formData.append("submittedTo", form.submittedTo);
  formData.append("workSummary", form.workSummary);
  formData.append("issuesFaced", form.issuesFaced);
  formData.append("pendingWork", form.pendingWork);
  formData.append("workCompleted", form.workCompleted);
  formData.append("remarks", form.remarks);
  formData.append("status", form.status || "Submitted");
  if (mode === "edit") {
    formData.append("updateRemarks", form.remarks || "Report edited by employee.");
  }
  form.proofs.forEach((file) => formData.append("proofs", file));
  return formData;
}

function buildResubmitPayload(form) {
  return {
    workSummary: form.workSummary,
    issuesFaced: form.issuesFaced,
    pendingWork: form.pendingWork,
    workCompleted: form.workCompleted,
    remarks: form.remarks,
  };
}

function reportToForm(report) {
  return {
    reportTitle: report.reportTitle || "",
    reportType: report.reportType || "",
    relatedTo: report.relatedTo || "",
    relatedEvent: report.relatedEvent?._id || report.relatedEvent || "",
    relatedTask: report.relatedTask?._id || report.relatedTask || "",
    submittedTo: report.submittedTo?._id || report.submittedTo || "",
    workSummary: report.workSummary || "",
    issuesFaced: report.issuesFaced || "",
    pendingWork: report.pendingWork || "",
    workCompleted: report.workCompleted || "",
    remarks: report.remarks?.[0]?.note || "",
    status: report.status || "Submitted",
    proofs: [],
  };
}
