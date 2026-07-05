import React from "react";
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@components/components/ui/sheet";
import { Textarea } from "@components/components/ui/textarea";
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  ImageIcon,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import {
  DataTable,
  DetailLine,
  formatDate,
  formatDateTime,
  IconPill,
  MetricCard,
  StatusBadge,
  TableButton,
} from "../../my-tasks/components/WorkPanelUI";

export const REPORT_LIMIT = 8;

export const emptyReportForm = {
  reportTitle: "",
  reportType: "",
  relatedTo: "",
  relatedEvent: "",
  relatedTask: "",
  submittedTo: "",
  workSummary: "",
  issuesFaced: "",
  pendingWork: "",
  workCompleted: "",
  remarks: "",
  status: "Submitted",
  proofs: [],
};

const reportIcons = {
  "Daily Work Report": ClipboardList,
  "Event Work Report": CalendarDays,
  "Vendor Report": BriefcaseBusiness,
  "Inventory Report": FileCheck2,
  "Issue Report": AlertCircle,
  "Task Completion Report": ClipboardCheck,
  "Attendance Report": UserRound,
};

const tones = ["violet", "blue", "orange", "green", "red", "blue", "violet", "orange"];

export function PageHeader({ search, onSearch }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-slate-950">My Reports</h1>
        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-500">
          <span>Home</span>
          <span>/</span>
          <span>My Reports</span>
        </div>
      </div>
      <div className="relative w-full lg:w-[390px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search reports..."
          className="h-10 rounded-lg border-slate-200 bg-white pl-10 text-xs shadow-sm"
        />
      </div>
    </div>
  );
}

export function ReportMetrics({ analytics }) {
  const items = [
    ["Reports Submitted", analytics.reportsSubmitted || 0, "All Time", ClipboardList, "violet"],
    ["Pending Reports", analytics.pendingReports || 0, "Awaiting Review", FileText, "orange"],
    ["Approved Reports", analytics.approvedReports || 0, "Approved", CheckCircle2, "green"],
    ["Rework Required", analytics.reworkRequired || 0, "Need Improvement", RotateCcw, "red"],
    ["This Month Reports", analytics.thisMonthReports || 0, "May 2025", CalendarDays, "blue"],
    ["Event Reports", analytics.eventReports || 0, "Related to Events", CalendarDays, "violet"],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map(([label, value, subLabel, Icon, tone]) => (
        <MetricCard key={label} label={label} value={pad(value)} subLabel={subLabel} icon={Icon} tone={tone} />
      ))}
    </div>
  );
}

export function ReportFilters({ filters, meta, onFilter, onSubmitReport }) {
  const tabs = ["All Reports", "Draft", "Submitted", "Reviewed", "Approved", "Rework"];
  return (
    <div className="flex w-full items-center gap-3 overflow-x-auto border-b border-slate-200 p-4">
      <div className="flex shrink-0 items-center gap-2">
        {tabs.map((tab) => {
          const value = tab === "All Reports" ? "all" : tab;
          const active = filters.status === value;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onFilter("status", value)}
              className={`h-9 whitespace-nowrap rounded-md border px-3 text-xs font-medium transition ${
                active ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <FilterSelect label="Types" value={filters.reportType} values={meta.reportTypes || []} onChange={(value) => onFilter("reportType", value)} />
        <FilterSelect label="Status" value={filters.status} values={meta.reportStatuses || []} onChange={(value) => onFilter("status", value)} />
        <FilterSelect label="Related" value={filters.relatedTo} values={meta.reportRelatedTypes || []} onChange={(value) => onFilter("relatedTo", value)} />
        <Button variant="outline" className="h-9 gap-2 rounded-md border-slate-200 bg-white px-3 text-xs font-medium text-slate-700">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
        <Button className="h-9 gap-2 rounded-md bg-violet-700 px-4 text-xs font-medium text-white hover:bg-violet-800" onClick={onSubmitReport}>
          <Plus className="h-4 w-4" />
          Submit Report
        </Button>
      </div>
    </div>
  );
}

export function ReportsTable({ reports, filters, pagination, loading, onView, onPage }) {
  if (loading && !reports.length) {
    return <LoadingBlock label="Loading reports" />;
  }

  return (
    <>
      <DataTable
        emptyText="No reports found."
        headers={["#", "Report Title", "Report Type", "Related To", "Related Event / Task", "Submitted On", "Submitted To", "Status", "Action"]}
        rows={reports.map((report, index) => {
          const Icon = reportIcons[report.reportType] || FileText;
          return [
            (filters.page - 1) * REPORT_LIMIT + index + 1,
            <div className="flex items-center gap-3">
              <IconPill icon={Icon} tone={tones[index % tones.length]} />
              <button type="button" className="text-left" onClick={() => onView(report)}>
                <span className="block font-semibold text-slate-950">{report.reportTitle}</span>
                <span className="block text-xs font-normal text-slate-500">{report.reportId}</span>
              </button>
            </div>,
            <ReportTypeBadge>{report.reportType}</ReportTypeBadge>,
            <span className="font-medium text-slate-800">{report.relatedTo}</span>,
            <span>
              <span className="block font-medium text-slate-900">{report.relatedEvent?.eventName || report.relatedTask?.title || report.relatedName || "General Work"}</span>
              <span className="block text-xs text-slate-500">{report.relatedEvent?.eventDate ? formatDate(report.relatedEvent.eventDate) : ""}</span>
            </span>,
            <span className="text-slate-700">{formatDateTime(report.submittedOn)}</span>,
            <span>
              <span className="block font-medium text-slate-900">{report.submittedTo?.name || report.submittedTo?.fullName || "-"}</span>
              <span className="block text-xs text-slate-500">{report.submittedTo?.designation || ""}</span>
            </span>,
            <StatusBadge>{report.status}</StatusBadge>,
            <div className="flex items-center gap-2">
              <TableButton onClick={() => onView(report)}>View</TableButton>
              <button type="button" className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" onClick={() => onView(report)}>
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>,
          ];
        })}
      />
      <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-slate-600">
          Showing {reports.length ? (filters.page - 1) * REPORT_LIMIT + 1 : 0} to {(filters.page - 1) * REPORT_LIMIT + reports.length} of {pagination?.totalReports || reports.length} reports
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={(pagination?.page || 1) <= 1} onClick={() => onPage(filters.page - 1)}>Prev</Button>
          {Array.from({ length: Math.min(pagination?.totalPages || 1, 4) }).map((_, index) => (
            <Button key={index} variant="outline" size="sm" className={(pagination?.page || 1) === index + 1 ? "border-violet-500 text-violet-700" : ""} onClick={() => onPage(index + 1)}>
              {index + 1}
            </Button>
          ))}
          <Button variant="outline" size="sm" disabled={(pagination?.page || 1) >= (pagination?.totalPages || 1)} onClick={() => onPage(filters.page + 1)}>Next</Button>
        </div>
      </div>
    </>
  );
}

export function ReportDetailSheet({ open, onOpenChange, report, loading, onEdit, onResubmit }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-white p-0 sm:max-w-xl">
        <div className="p-6">
          <SheetHeader className="border-b border-slate-200 pb-4 text-left">
            <SheetTitle className="text-lg font-semibold text-slate-950">Report Details</SheetTitle>
            <SheetDescription>Review report information, proofs, remarks, and timeline.</SheetDescription>
          </SheetHeader>
          {!report ? (
            <div className="mt-6 rounded-lg border border-slate-200 p-6 text-center text-xs text-slate-500">Select a report to view details.</div>
          ) : (
            <div className="space-y-5 pt-5">
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-violet-600" /> : null}
              <div className="flex items-start gap-4">
                <IconPill icon={reportIcons[report.reportType] || FileText} tone="violet" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">{report.reportTitle}</h3>
                      <p className="text-xs font-medium text-slate-500">{report.reportType}</p>
                      <p className="mt-1 text-xs text-slate-500">Report ID: {report.reportId || report._id}</p>
                    </div>
                    <StatusBadge>{report.status}</StatusBadge>
                  </div>
                </div>
              </div>
              <div className="space-y-4 border-b border-slate-200 pb-4">
                <DetailLine icon={CalendarDays} label="Related Event" value={report.relatedEvent?.eventName || report.relatedTo} />
                <DetailLine icon={CalendarDays} label="Event Date" value={report.relatedEvent?.eventDate ? formatDate(report.relatedEvent.eventDate) : "Not available"} />
                <DetailLine icon={ClockIcon} label="Submitted On" value={formatDateTime(report.submittedOn)} />
                <DetailLine icon={UserRound} label="Submitted By" value={report.employeeId?.fullName || "You"} />
                <DetailLine icon={UserRound} label="Submitted To" value={report.submittedTo?.name || report.submittedTo?.fullName || "Not available"} />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-950">Work Summary</h3>
                <p className="text-xs leading-5 text-slate-700">{report.workSummary || "No summary available."}</p>
              </div>
              <ProofPreview proofs={report.proofs || []} />
              <ManagerReview report={report} />
              <ReportTimeline report={report} />
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-10 gap-2 border-violet-200 text-xs font-medium text-violet-700" onClick={onEdit} disabled={!["Draft", "Rework"].includes(report.status)}>
                  <Pencil className="h-4 w-4" />
                  Edit Report
                </Button>
                <Button variant="outline" className="h-10 gap-2 border-slate-200 text-xs font-medium">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button className="col-span-2 h-10 gap-2 bg-red-50 text-xs font-medium text-red-600 hover:bg-red-100" onClick={onResubmit} disabled={!["Draft", "Rework"].includes(report.status)}>
                  <RotateCcw className="h-4 w-4" />
                  Resubmit Report
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ReportFormSheet({
  open,
  mode,
  form,
  setForm,
  meta,
  employees,
  events,
  onOpenChange,
  onSubmit,
  loading,
}) {
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const reportTypes = meta.reportTypes?.length ? meta.reportTypes : ["Daily Work Report", "Event Work Report", "Vendor Report", "Inventory Report", "Issue Report", "Task Completion Report", "Attendance Report"];
  const relatedTypes = meta.reportRelatedTypes?.length ? meta.reportRelatedTypes : ["Office", "Event", "Vendor", "Inventory", "Duty", "Task"];
  const completedOptions = meta.workCompletedOptions?.length ? meta.workCompletedOptions : ["Yes", "No", "Partial"];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto bg-white sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold text-slate-950">{mode === "edit" ? "Edit Report" : mode === "resubmit" ? "Resubmit Report" : "Submit Report"}</SheetTitle>
          <SheetDescription>{mode === "new" ? "Submit a work report with proofs for review." : "Update report details and submit for review."}</SheetDescription>
        </SheetHeader>
        <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Report Type *" value={form.reportType} values={reportTypes} placeholder="Select Report Type" onChange={(value) => setField("reportType", value)} />
            <FormInput label="Report Title *" value={form.reportTitle} placeholder="Enter report title" onChange={(value) => setField("reportTitle", value)} disabled={mode === "resubmit"} />
            <SelectField label="Related To *" value={form.relatedTo} values={relatedTypes} placeholder="Select" onChange={(value) => setField("relatedTo", value)} disabled={mode === "resubmit"} />
            <SelectObjectField label="Related Event / Task" value={form.relatedEvent} items={events} getValue={(item) => item._id} getLabel={(item) => `${item.eventName} (${item.city || "Event"})`} placeholder="Select Event" onChange={(value) => setField("relatedEvent", value)} disabled={mode === "resubmit"} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextareaField label="Issues Faced" value={form.issuesFaced} placeholder="Describe issues or challenges..." onChange={(value) => setField("issuesFaced", value)} />
            <TextareaField label="Pending Work" value={form.pendingWork} placeholder="Mention pending work details..." onChange={(value) => setField("pendingWork", value)} />
          </div>
          <TextareaField label="Work Summary *" value={form.workSummary} placeholder="Write details of work done, summary, outcomes..." onChange={(value) => setField("workSummary", value)} tall />
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Work Completed" value={form.workCompleted} values={completedOptions} placeholder="Select" onChange={(value) => setField("workCompleted", value)} />
            <SelectObjectField label="Submit To *" value={form.submittedTo} items={employees} getValue={(item) => item._id} getLabel={(item) => `${item.name} - ${item.designation || "Employee"}`} placeholder="Select Manager" onChange={(value) => setField("submittedTo", value)} disabled={mode === "resubmit"} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextareaField label="Remarks" value={form.remarks} placeholder="Add remarks..." onChange={(value) => setField("remarks", value)} />
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Upload Proof / Photos / Files</label>
              <label className="grid min-h-24 cursor-pointer place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-600 hover:bg-slate-100">
                <Upload className="mb-2 h-5 w-5 text-slate-500" />
                <span className="font-medium">Drag & drop files here</span>
                <span>or click to upload</span>
                <span className="mt-2 text-slate-500">JPG, PNG, PDF up to 10MB</span>
                <Input type="file" multiple className="hidden" onChange={(event) => setField("proofs", Array.from(event.target.files || []).slice(0, 10))} />
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <Button type="button" variant="outline" className="h-10 min-w-[120px] text-xs font-medium" onClick={() => onOpenChange(false)}>Reset</Button>
            <Button type="submit" className="h-10 min-w-[160px] gap-2 bg-violet-700 text-xs font-medium text-white hover:bg-violet-800" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {mode === "resubmit" ? "Resubmit Report" : "Submit Report"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
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

function SelectField({ label, value, values, onChange, placeholder, disabled = false }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-9 border-slate-200 text-xs font-normal">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {values.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function SelectObjectField({ label, value, items, getValue, getLabel, onChange, placeholder, disabled = false }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-9 border-slate-200 text-xs font-normal">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => <SelectItem key={getValue(item)} value={getValue(item)}>{getLabel(item)}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function FormInput({ label, value, onChange, placeholder, disabled = false }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <Input value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} className="h-9 border-slate-200 text-xs" />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, tall = false }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <Textarea value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`${tall ? "min-h-24" : "min-h-20"} resize-none border-slate-200 text-xs`} />
    </div>
  );
}

function ReportTypeBadge({ children }) {
  return (
    <span className="inline-flex rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">
      {children || "Report"}
    </span>
  );
}

function ProofPreview({ proofs }) {
  if (!proofs.length) return <p className="text-xs text-slate-500">No proofs uploaded.</p>;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-950">Proof / Attachments</h3>
      <div className="flex gap-2">
        {proofs.slice(0, 4).map((proof, index) => (
          <a key={proof._id || proof.url || index} href={proof.url || proof.fileUrl} target="_blank" rel="noreferrer" className="grid h-16 w-20 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-xs text-slate-500">
            {proof.url || proof.fileUrl ? <img src={proof.url || proof.fileUrl} alt={proof.fileName || "Proof"} className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5" />}
          </a>
        ))}
      </div>
      <p className="text-xs text-slate-500">{proofs.length} files uploaded</p>
    </div>
  );
}

function ManagerReview({ report }) {
  const review = report.remarks?.find((item) => item.employee) || report.remarks?.[0];
  if (!review) return null;
  return (
    <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4">
      <h3 className="text-sm font-semibold text-slate-950">Manager Review</h3>
      <p className="mt-2 text-xs leading-5 text-slate-700">{review.note || "No remarks available."}</p>
      <p className="mt-2 text-xs text-slate-500">{review.addedAt ? `Reviewed On: ${formatDateTime(review.addedAt)}` : ""}</p>
    </div>
  );
}

function ReportTimeline({ report }) {
  const items = report.statusTimeline?.length
    ? report.statusTimeline.map((item) => [item.status, item.createdAt || item.date, item.by?.name || item.by?.fullName])
    : [
        ["Submitted", report.submittedOn, "By You"],
        ["Reviewed", report.status === "Reviewed" || report.status === "Approved" ? report.updatedAt || report.submittedOn : null, report.submittedTo?.name],
        ["Approved", report.status === "Approved" ? report.updatedAt || report.submittedOn : null, report.submittedTo?.name],
      ];

  return (
    <div className="space-y-3 border-t border-slate-200 pt-4">
      <h3 className="text-sm font-semibold text-slate-950">Report Status Timeline</h3>
      {items.map(([title, date, by], index) => (
        <div key={`${title}-${index}`} className="flex gap-3 text-xs">
          <span className={`mt-1 h-3 w-3 rounded-full ${date ? "bg-emerald-500" : "border border-slate-300 bg-slate-100"}`} />
          <span className="flex-1">
            <span className="block font-medium text-slate-950">{title}</span>
            <span className="block text-slate-500">{date ? formatDateTime(date) : "Pending"}</span>
          </span>
          {by ? <span className="max-w-[130px] text-right text-slate-500">{by}</span> : null}
        </div>
      ))}
    </div>
  );
}

function LoadingBlock({ label }) {
  return (
    <div className="p-12 text-center text-xs text-slate-500">
      <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-violet-600" />
      {label}
    </div>
  );
}

function pad(value) {
  return String(Number(value) || 0).padStart(2, "0");
}

function ClockIcon(props) {
  return <CalendarDays {...props} />;
}
