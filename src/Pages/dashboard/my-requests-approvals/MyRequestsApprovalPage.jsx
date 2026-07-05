import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import EmployeeService from "@/services/employee.service";
import {
  emptyRequestForm,
  MetricsGrid,
  PageHeader,
  QuickActions,
  RequestDetailSheet,
  RequestFilters,
  RequestFormSheet,
  RequestsTable,
  RequestTypes,
  REQUEST_LIMIT,
} from "./components/RequestApprovalComponents";

export default function MyRequestsApprovalPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    requestType: "all",
    priority: "all",
    page: 1,
  });
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formMode, setFormMode] = useState(null);
  const [form, setForm] = useState(emptyRequestForm);

  const analyticsQuery = useQuery({
    queryKey: ["my-request-analytics"],
    queryFn: async () => {
      const response = await EmployeeService.getMyRequestAnalytics();
      return response.data.analytics;
    },
  });

  const requestsQuery = useQuery({
    queryKey: ["my-requests", filters],
    queryFn: async () => {
      const response = await EmployeeService.getMyRequests({
        page: filters.page,
        limit: REQUEST_LIMIT,
        search: filters.search || undefined,
        status: filters.status === "all" ? undefined : filters.status,
        requestType: filters.requestType === "all" ? undefined : filters.requestType,
        priority: filters.priority === "all" ? undefined : filters.priority,
      });
      return response.data;
    },
    placeholderData: (previous) => previous,
  });

  const requests = requestsQuery.data?.requests || [];
  const pagination = requestsQuery.data?.pagination;
  const meta = requestsQuery.data?.meta || {};

  const selectedFromList = useMemo(
    () => requests.find((request) => request._id === selectedRequestId || request.requestId === selectedRequestId),
    [requests, selectedRequestId]
  );

  const detailQuery = useQuery({
    queryKey: ["my-request-detail", selectedRequestId],
    queryFn: async () => {
      const response = await EmployeeService.getMyRequestDetail({ requestId: selectedRequestId });
      return response.data.request;
    },
    enabled: Boolean(selectedRequestId) && isDetailOpen,
  });

  const requestDetail = selectedRequestId ? { ...selectedFromList, ...(detailQuery.data || {}) } : null;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["my-requests"] });
    queryClient.invalidateQueries({ queryKey: ["my-request-analytics"] });
    if (selectedRequestId) {
      queryClient.invalidateQueries({ queryKey: ["my-request-detail", selectedRequestId] });
    }
  };

  const submitMutation = useMutation({
    mutationFn: ({ mode }) => {
      const formData = buildRequestFormData(form, mode);
      if (mode === "edit") {
        return EmployeeService.updateMyRequest({ requestId: selectedRequestId, formData });
      }
      return EmployeeService.submitMyRequest({ formData });
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Request saved successfully");
      setFormMode(null);
      setForm(emptyRequestForm);
      invalidate();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Unable to save request");
    },
  });

  const setFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === "page" ? value : 1,
    }));
  };

  const openDetail = (request) => {
    setSelectedRequestId(request._id || request.requestId);
    setIsDetailOpen(true);
  };

  const openCreate = () => {
    setForm(emptyRequestForm);
    setFormMode("new");
  };

  const openEdit = () => {
    if (!requestDetail) return;
    setForm({
      requestTitle: requestDetail.requestTitle || "",
      description: requestDetail.description || "",
      requestType: requestDetail.requestType || "Event Requirement",
      relatedEventName: requestDetail.relatedTo?.eventName || requestDetail.relatedTo?.name || "",
      relatedEventId: requestDetail.relatedTo?.event?._id || requestDetail.relatedTo?.eventId || "",
      priority: requestDetail.priority || "High",
      remarks: "",
      attachments: [],
    });
    setFormMode("edit");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 p-4 text-slate-950 md:p-6">
      <div className="mx-auto max-w-[1700px] space-y-5">
        <PageHeader search={filters.search} onSearch={(value) => setFilter("search", value)} />
        <MetricsGrid analytics={analyticsQuery.data || {}} />

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <RequestFilters
            filters={filters}
            meta={meta}
            onFilter={setFilter}
            onOpenCreate={openCreate}
          />
          <RequestsTable
            requests={requests}
            filters={filters}
            pagination={pagination}
            loading={requestsQuery.isFetching}
            onView={openDetail}
            onPage={(page) => setFilter("page", page)}
          />
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <RequestTypes />
          <QuickActions onCreate={openCreate} />
        </div>
      </div>

      <RequestDetailSheet
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        request={requestDetail}
        loading={detailQuery.isFetching}
        onEdit={openEdit}
      />

      <RequestFormSheet
        open={Boolean(formMode)}
        mode={formMode}
        form={form}
        setForm={setForm}
        meta={meta}
        loading={submitMutation.isPending}
        onOpenChange={(open) => !open && setFormMode(null)}
        onSubmit={() => submitMutation.mutate({ mode: formMode })}
      />
    </div>
  );
}

function buildRequestFormData(form, mode) {
  const formData = new FormData();
  formData.append("requestTitle", form.requestTitle);
  formData.append("description", form.description);
  formData.append("requestType", form.requestType);
  formData.append("priority", form.priority);
  formData.append(
    "relatedTo",
    JSON.stringify({
      eventId: form.relatedEventId || undefined,
      eventName: form.relatedEventName || undefined,
    })
  );
  formData.append(mode === "edit" ? "updateRemarks" : "submissionRemarks", form.remarks);
  form.attachments.forEach((file) => formData.append("attachments", file));
  return formData;
}
