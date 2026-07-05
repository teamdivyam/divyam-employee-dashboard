import React from "react";
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import { Textarea } from "@components/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@components/components/ui/sheet";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  Filter,
  FolderOpen,
  HelpCircle,
  Inbox,
  Loader2,
  MoreVertical,
  PackageCheck,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  DataTable,
  DetailLine,
  formatDate,
  formatDateTime,
  IconPill,
  MetricCard,
  SectionCard,
  StatusBadge,
  TableButton,
} from "../../my-tasks/components/WorkPanelUI";

export const REQUEST_LIMIT = 8;

export const emptyRequestForm = {
  requestTitle: "",
  description: "",
  requestType: "Event Requirement",
  relatedEventName: "",
  relatedEventId: "",
  priority: "High",
  remarks: "",
  attachments: [],
};

const requestTypeIcons = {
  "Expense Approval": FileCheck2,
  "Leave Approval": BadgeCheck,
  "Event Requirement": CalendarDays,
  "Inventory Request": PackageCheck,
  "Task Proof Approval": ClipboardCheck,
  "Document Approval": FileText,
  "Vendor / Support": BriefcaseBusiness,
  "Issue Escalation": AlertCircle,
  "Rework Resubmission": RotateCcw,
  "Other Request": Inbox,
};

const tones = ["orange", "green", "blue", "green", "violet", "violet", "orange", "red", "violet", "slate"];

export function PageHeader({ search, onSearch }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">My Requests / Approvals</h1>
        <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-500">
          <span>Home</span>
          <span>/</span>
          <span>My Requests / Approvals</span>
        </div>
      </div>
      <div className="relative w-full lg:w-[420px]">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search requests..."
          className="h-12 rounded-lg border-slate-200 bg-white pl-11 pr-12 text-sm shadow-sm"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500">
          Ctrl K
        </span>
      </div>
    </div>
  );
}

export function MetricsGrid({ analytics }) {
  const metrics = [
    ["Total Requests", pad(analytics.totalRequests), "All Requests", ClipboardList, "blue"],
    ["Pending Approval", pad(analytics.pendingApproval), "Awaiting Review", Clock3, "orange"],
    ["Approved", pad(analytics.approvedThisYear), "This Year", CheckCircle2, "green"],
    ["Rejected", pad(analytics.rejectedThisYear), "This Year", XCircle, "red"],
    ["Rework Required", pad(analytics.reworkRequired), "Need Action", RotateCcw, "violet"],
    ["This Month Requests", pad(analytics.thisMonthRequests), "May 2025", CalendarDays, "blue"],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {metrics.map(([label, value, subLabel, Icon, tone]) => (
        <MetricCard key={label} label={label} value={value} subLabel={subLabel} icon={Icon} tone={tone} />
      ))}
    </div>
  );
}

export function RequestFilters({ filters, meta, onFilter, onOpenCreate }) {
  const tabs = ["All Requests", "Pending", "Under Review", "Approved", "Rejected", "Rework"];
  return (
    <div className="flex w-full items-center gap-3 overflow-x-auto border-b border-slate-200 p-4">
      <div className="flex shrink-0 items-center gap-2">
        {tabs.map((tab) => {
          const active = filters.status === (tab === "All Requests" ? "all" : tab);
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onFilter("status", tab === "All Requests" ? "all" : tab)}
              className={`h-9 whitespace-nowrap rounded-md border px-3 text-xs font-medium transition ${
                active
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <FilterSelect label="Types" value={filters.requestType} values={meta.requestTypes || []} onChange={(value) => onFilter("requestType", value)} />
        <FilterSelect label="Status" value={filters.status} values={meta.requestStatuses || []} onChange={(value) => onFilter("status", value)} />
        <FilterSelect label="Priority" value={filters.priority} values={meta.requestPriorities || []} onChange={(value) => onFilter("priority", value)} />
        <Button variant="outline" className="h-9 shrink-0 gap-2 rounded-md border-slate-200 bg-white px-3 text-xs font-medium text-slate-700">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
        <Button className="h-9 shrink-0 gap-2 rounded-md bg-slate-950 px-4 text-xs font-medium text-white hover:bg-slate-800" onClick={onOpenCreate}>
          <Plus className="h-4 w-4" />
          Create Request
        </Button>
      </div>
    </div>
  );
}

export function RequestsTable({ requests, filters, pagination, loading, onView, onPage }) {
  if (loading && !requests.length) {
    return (
      <div className="p-12 text-center text-sm text-slate-500">
        <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-blue-600" />
        Loading requests
      </div>
    );
  }

  return (
    <>
      <DataTable
        emptyText="No requests found."
        headers={["#", "Request Title", "Request Type", "Related To", "Priority", "Status", "Submitted On", "Reviewing / Approved By", "Action"]}
        rows={requests.map((request, index) => {
          const Icon = requestTypeIcons[request.requestType] || FileText;
          return [
            (filters.page - 1) * REQUEST_LIMIT + index + 1,
            <div className="flex items-center gap-3">
              <IconPill icon={Icon} tone={tones[index % tones.length]} />
              <button type="button" className="min-w-0 text-left" onClick={() => onView(request)}>
                <span className="block font-semibold text-slate-950">{request.requestTitle}</span>
                <span className="block max-w-[260px] truncate text-xs font-medium text-slate-500">{request.description}</span>
              </button>
            </div>,
            <span className="font-medium text-slate-700">{request.requestType}</span>,
            <span>
              <span className="block font-semibold text-slate-950">{request.relatedTo?.eventName || request.relatedTo?.name || "Office"}</span>
              <span className="block text-xs text-slate-500">{request.relatedTo?.eventDate ? formatDate(request.relatedTo.eventDate) : "General"}</span>
            </span>,
            <StatusBadge>{request.priority}</StatusBadge>,
            <StatusBadge>{request.status}</StatusBadge>,
            <span className="text-slate-700">{formatDateTime(request.submittedOn)}</span>,
            <span>
              <span className="block font-semibold text-slate-950">{request.reviewingApprovedBy?.fullName || request.reviewingApprovedBy?.name || "Pending"}</span>
              <span className="block text-xs text-slate-500">{request.reviewingApprovedBy?.designation || request.reviewingApprovedBy?.role || "Reviewer"}</span>
            </span>,
            <div className="flex items-center gap-2">
              <TableButton onClick={() => onView(request)}>View</TableButton>
              <button type="button" className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={() => onView(request)}>
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>,
          ];
        })}
      />
      <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-600">
          Showing {requests.length ? (filters.page - 1) * REQUEST_LIMIT + 1 : 0} to {(filters.page - 1) * REQUEST_LIMIT + requests.length} of {pagination?.totalRequests || requests.length} requests
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={(pagination?.page || 1) <= 1} onClick={() => onPage(filters.page - 1)}>‹</Button>
          {Array.from({ length: Math.min(pagination?.totalPages || 1, 4) }).map((_, index) => (
            <Button key={index} variant="outline" size="sm" className={(pagination?.page || 1) === index + 1 ? "border-blue-500 text-blue-600" : ""} onClick={() => onPage(index + 1)}>
              {index + 1}
            </Button>
          ))}
          <Button variant="outline" size="sm" disabled={(pagination?.page || 1) >= (pagination?.totalPages || 1)} onClick={() => onPage(filters.page + 1)}>›</Button>
        </div>
      </div>
    </>
  );
}

export function RequestTypes() {
  return (
    <SectionCard title="Request Types" className="lg:col-span-2">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Object.entries(requestTypeIcons).map(([label, Icon], index) => (
          <button key={label} type="button" className="rounded-lg border border-slate-200 bg-white p-4 text-center transition hover:border-blue-200 hover:bg-blue-50/40">
            <IconPill icon={Icon} tone={tones[index % tones.length]} />
            <span className="mt-3 block text-xs font-semibold text-slate-800">{label}</span>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

export function QuickActions({ onCreate }) {
  const actions = [
    ["Create New Request", "Raise a new request for approval", Plus],
    ["View My Documents", "Check submitted documents", FileText],
    ["Approval Guidelines", "Company request policy", ClipboardCheck],
    ["Need Help?", "Contact admin / manager", HelpCircle],
  ];

  return (
    <SectionCard title="Quick Actions">
      <div className="space-y-3">
        {actions.map(([title, sub, Icon], index) => (
          <button key={title} type="button" onClick={index === 0 ? onCreate : undefined} className="flex w-full items-center gap-3 rounded-md p-1 text-left hover:bg-slate-50">
            <IconPill icon={Icon} tone={tones[index]} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-950">{title}</span>
              <span className="block text-xs font-medium text-slate-500">{sub}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-slate-500" />
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

export function RequestDetailSheet({ open, onOpenChange, request, loading, onEdit }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-white p-0 sm:max-w-xl">
        <div className="p-6">
          <SheetHeader className="border-b border-slate-200 pb-4 text-left">
            <SheetTitle className="text-xl font-semibold text-slate-950">Request Details</SheetTitle>
            <SheetDescription>Review request, attachments, timeline, and available actions.</SheetDescription>
          </SheetHeader>
          {!request ? (
            <div className="mt-6 rounded-lg border border-slate-200 p-6 text-center text-sm text-slate-500">Select a request to view details.</div>
          ) : (
            <div className="space-y-5 pt-5">
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> : null}
              <div className="flex items-start gap-4">
                <IconPill icon={requestTypeIcons[request.requestType] || FileText} tone="violet" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">{request.requestTitle}</h3>
                      <p className="text-sm font-medium text-slate-500">Request ID: {request.requestId || request._id}</p>
                    </div>
                    <StatusBadge>{request.status}</StatusBadge>
                  </div>
                </div>
              </div>
              <div className="space-y-4 border-b border-slate-200 pb-5">
                <DetailLine icon={FolderOpen} label="Request Type" value={request.requestType} />
                <DetailLine icon={FileText} label="Related To" value={request.relatedTo?.eventName || request.relatedTo?.name || "Office"} />
                <DetailLine icon={CalendarDays} label="Event Date" value={request.relatedTo?.eventDate ? formatDate(request.relatedTo.eventDate) : "General"} />
                <DetailLine icon={AlertCircle} label="Priority" value={request.priority} />
                <DetailLine icon={Clock3} label="Submitted On" value={formatDateTime(request.submittedOn)} />
                <DetailLine icon={UserRound} label="Submitted By" value={request.employeeId?.fullName || "You"} />
                <DetailLine icon={UserRound} label="Reviewing By" value={request.reviewingApprovedBy?.fullName || request.reviewingApprovedBy?.name || "Pending"} />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-950">Description / Reason</h3>
                <p className="text-sm leading-6 text-slate-700">{request.description || "No description provided."}</p>
              </div>
              <Attachments attachments={request.attachments || []} />
              <ApprovalTimeline request={request} />
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-950">Remarks</h3>
                <p className="text-sm text-slate-600">{request.approvalTimeline?.at?.(-1)?.remarks || "Waiting for review from Event Manager."}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-11 gap-2 border-slate-200" onClick={onEdit} disabled={!["Pending", "Rework"].includes(request.status)}>
                  <Pencil className="h-4 w-4" />
                  Edit Request
                </Button>
                <Button variant="outline" className="h-11 gap-2 border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                  Cancel Request
                </Button>
                <Button className="col-span-2 h-11 gap-2 bg-slate-950 text-white hover:bg-slate-800" onClick={onEdit} disabled={request.status !== "Rework"}>
                  <Upload className="h-4 w-4" />
                  Resubmit Request
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function RequestFormSheet({ open, mode, form, setForm, onOpenChange, onSubmit, loading, meta }) {
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const requestTypes = meta.requestTypes?.length ? meta.requestTypes : ["Event Requirement", "Expense Approval", "Leave Approval", "Inventory Request", "Task Proof Approval"];
  const priorities = meta.requestPriorities?.length ? meta.requestPriorities : ["High", "Medium", "Low"];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-white sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold text-slate-950">{mode === "edit" ? "Edit Request" : "Create Request"}</SheetTitle>
          <SheetDescription>{mode === "edit" ? "Update editable request details and attach documents." : "Raise a new request for manager approval."}</SheetDescription>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
          <FormInput label="Request Title" value={form.requestTitle} onChange={(value) => setField("requestTitle", value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Request Type" value={form.requestType} values={requestTypes} onChange={(value) => setField("requestType", value)} />
            <SelectField label="Priority" value={form.priority} values={priorities} onChange={(value) => setField("priority", value)} />
            <FormInput label="Related Event Name" value={form.relatedEventName} onChange={(value) => setField("relatedEventName", value)} />
            <FormInput label="Event ID" value={form.relatedEventId} onChange={(value) => setField("relatedEventId", value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">Description / Reason</label>
            <Textarea value={form.description} onChange={(event) => setField("description", event.target.value)} className="min-h-28 resize-none border-slate-200" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">{mode === "edit" ? "Update Remarks" : "Submission Remarks"}</label>
            <Textarea value={form.remarks} onChange={(event) => setField("remarks", event.target.value)} className="min-h-20 resize-none border-slate-200" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">Attachments</label>
            <Input type="file" multiple onChange={(event) => setField("attachments", Array.from(event.target.files || []).slice(0, 10))} className="border-slate-200" />
            <p className="text-xs font-medium text-slate-500">Attach up to 10 documents.</p>
          </div>
          <Button type="submit" className="h-11 w-full gap-2 bg-slate-950 text-white hover:bg-slate-800" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {mode === "edit" ? "Update Request" : "Create Request"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Attachments({ attachments }) {
  if (!attachments.length) {
    return <p className="text-sm text-slate-500">No attachments added.</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-950">Attachments</h3>
      {attachments.map((file, index) => (
        <a key={file._id || file.url || index} href={file.url || file.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50">
          <Paperclip className="h-5 w-5 text-red-500" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-slate-950">{file.originalName || file.fileName || `Attachment ${index + 1}`}</span>
            <span className="text-xs text-slate-500">{file.size ? `${Math.round(file.size / 1024)} KB` : "Document"}</span>
          </span>
          <Download className="h-4 w-4 text-slate-500" />
        </a>
      ))}
    </div>
  );
}

function ApprovalTimeline({ request }) {
  const fallback = [
    ["Submitted", request.submittedOn, "By You"],
    ["Under Review", request.status === "Under Review" ? request.updatedAt || request.submittedOn : null, request.reviewingApprovedBy?.fullName],
    ["Approved", request.status === "Approved" ? request.updatedAt : null, null],
    ["Rejected / Rework", ["Rejected", "Rework"].includes(request.status) ? request.updatedAt : null, null],
  ];
  const items = request.approvalTimeline?.length
    ? request.approvalTimeline.map((item) => [item.status || item.title, item.createdAt || item.date, item.by?.fullName || item.remarks])
    : fallback;

  return (
    <div className="space-y-4 border-t border-slate-200 pt-4">
      <h3 className="text-sm font-semibold text-slate-950">Approval Timeline</h3>
      {items.map(([title, date, by], index) => (
        <div key={`${title}-${index}`} className="flex gap-3 text-sm">
          <span className={`mt-1 h-3 w-3 rounded-full ${date ? (index === 0 ? "bg-emerald-500" : "bg-blue-500") : "border border-slate-300 bg-slate-100"}`} />
          <span className="flex-1">
            <span className="block font-semibold text-slate-950">{title}</span>
            <span className="block text-xs text-slate-500">{date ? formatDateTime(date) : "Pending"}</span>
          </span>
          {by ? <span className="max-w-[140px] text-right text-xs text-slate-500">{by}</span> : null}
        </div>
      ))}
    </div>
  );
}

function FilterSelect({ label, value, values, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[132px] rounded-md border-slate-200 bg-white text-xs font-medium text-slate-700">
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
      <label className="text-sm font-semibold text-slate-900">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
        <SelectContent>
          {values.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function FormInput({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-900">{label}</label>
      <Input value={value || ""} onChange={(event) => onChange(event.target.value)} className="border-slate-200" />
    </div>
  );
}

function pad(value) {
  return String(Number(value) || 0).padStart(2, "0");
}
