/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock,
  FileText,
  Loader2,
  MessageSquareText,
  Plus,
  Search,
} from "lucide-react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { toast } from "sonner";

import AdminService from "../../../services/event-booking-workspace.service";
import { Badge } from "@components/components/ui/badge";
import { Button } from "@components/components/ui/button";
import { Card, CardContent } from "@components/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/components/ui/dialog";
import { Input } from "@components/components/ui/input";
import { Label } from "@components/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import { Textarea } from "@components/components/ui/textarea";
import EventSummaryCards from "./components/EventSummaryCards";
import { getFinalPreferenceCount } from "./eventBookingDashboard.utils";

import useDebouncedValue from "../../../hooks/useDebouncedValue";

const defaultFilters = {
  search: "",
  type: "all",
  module: "all",
  teamMember: "all",
  dateFrom: "",
  dateTo: "",
  page: 1,
  limit: 10,
};

const activityPresentation = {
  "Internal Note": {
    icon: MessageSquareText,
    dot: "bg-pink-500",
    surface: "border-pink-200 bg-pink-50 text-pink-600 dark:border-pink-900 dark:bg-pink-950/40 dark:text-pink-300",
  },
  Payment: {
    icon: Banknote,
    dot: "bg-emerald-500",
    surface: "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  Invoice: {
    icon: FileText,
    dot: "bg-green-600",
    surface: "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300",
  },
  Document: {
    icon: FileText,
    dot: "bg-blue-600",
    surface: "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  },
  "Client Approval": {
    icon: ClipboardCheck,
    dot: "bg-violet-600",
    surface: "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",
  },
  Task: {
    icon: ClipboardCheck,
    dot: "bg-cyan-600",
    surface: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-300",
  },
  Status: {
    icon: CheckCircle2,
    dot: "bg-orange-500",
    surface: "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300",
  },
  Preference: {
    icon: Clock,
    dot: "bg-purple-600",
    surface: "border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300",
  },
  Other: {
    icon: CircleAlert,
    dot: "bg-pink-500",
    surface: "border-pink-200 bg-pink-50 text-pink-600 dark:border-pink-900 dark:bg-pink-950/40 dark:text-pink-300",
  },
};

const moduleTones = {
  Commercial: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  Event: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "Client Payments": "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  "Cost & Settlements": "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  "Invoices & Receipts": "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300",
  Documents: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  "Client Updates": "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
  "Tasks & Workflow": "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300",
};

const moduleTagStyles = {
  Commercial: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  Event: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "Client Payments": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  "Cost & Settlements": "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  "Invoices & Receipts": "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  Documents: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  "Client Updates": "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  "Tasks & Workflow": "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
};

const activityColorPalette = [
  { dot: "bg-emerald-500", surface: "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" },
  { dot: "bg-violet-600", surface: "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300", badge: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300" },
  { dot: "bg-blue-600", surface: "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300", badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" },
  { dot: "bg-orange-500", surface: "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300", badge: "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300" },
  { dot: "bg-pink-500", surface: "border-pink-200 bg-pink-50 text-pink-600 dark:border-pink-900 dark:bg-pink-950/40 dark:text-pink-300", badge: "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300" },
  { dot: "bg-cyan-600", surface: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-300", badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300" },
  { dot: "bg-purple-600", surface: "border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300", badge: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300" },
  { dot: "bg-teal-600", surface: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300", badge: "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300" },
];

const activityColor = (activity) => {
  const seed = String(activity?._id || `${activity?.type || ""}-${activity?.title || ""}-${activity?.activityDate || ""}`);
  const hash = [...seed].reduce((value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0, 0);
  return activityColorPalette[hash % activityColorPalette.length];
};

const validDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const ACTIVITY_TIME_ZONE = "Asia/Kolkata";

const dateKey = (value) => {
  const date = validDate(value);
  return date
    ? new Intl.DateTimeFormat("en-CA", {
        timeZone: ACTIVITY_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date)
    : "Unknown date";
};

const dateLabel = (value) => {
  const date = validDate(value);
  if (!date) return { date: "Unknown date", weekday: "" };
  return {
    date: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: ACTIVITY_TIME_ZONE,
    }).format(date),
    weekday: new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      timeZone: ACTIVITY_TIME_ZONE,
    }).format(date),
  };
};

const timeLabel = (value) => {
  const date = validDate(value);
  return date
    ? new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: ACTIVITY_TIME_ZONE,
      }).format(date)
    : "—";
};

const splitTime = (value) => {
  const date = validDate(value);
  if (!date) return { time: "—", period: "" };
  const formatted = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: ACTIVITY_TIME_ZONE,
  }).format(date);
  const [time, period] = formatted.split(/\s+/);
  return { time, period: (period || "").toUpperCase() };
};

const formatAuditTimestamp = (value) => {
  const date = validDate(value);
  if (!date) return "—";
  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: ACTIVITY_TIME_ZONE,
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: ACTIVITY_TIME_ZONE,
  }).format(date);
  return `${datePart} at ${timePart}`;
};

const parseBeforeAfter = (description) => {
  if (!description) return null;
  const arrowMatch = description.match(/^(?:.*?:)?\s*(.*?)\s*(?:→|->)\s*(.*?)$/);
  if (arrowMatch && arrowMatch[1] && arrowMatch[2]) {
    const before = arrowMatch[1].replace(/^(?:Stage|Status|State):\s*/i, "").trim();
    return { before, after: arrowMatch[2].trim() };
  }
  const changedMatch = description.match(/changed from (.*?) to (.*?)(?:\.|$)/i);
  if (changedMatch) {
    return { before: changedMatch[1].trim(), after: changedMatch[2].trim() };
  }
  return null;
};

const initials = (name) =>
  String(name || "Admin")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

function InternalNoteDialog({ open, onOpenChange, saving, onSave }) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!note.trim()) return;
    try {
      await onSave({ title: title.trim() || undefined, note: note.trim() });
      setTitle("");
      setNote("");
      onOpenChange(false);
    } catch {
      // Mutation feedback is handled by the page.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-xl flex-col gap-0 overflow-hidden rounded-lg p-0">
        <DialogHeader className="border-b border-purple-100/70 bg-[#f0edfd]/80 px-6 py-4 pr-12 text-left dark:border-purple-900/30 dark:bg-purple-950/20">
          <DialogTitle className="text-lg font-bold text-foreground">Add Internal Note</DialogTitle>
          <DialogDescription className="text-xs">
            Keep an internal event update visible to the team.
          </DialogDescription>
        </DialogHeader>
        <form id="event-internal-note-form" onSubmit={submit} className="space-y-4 px-6 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="internal-note-title">Title</Label>
            <Input
              id="internal-note-title"
              value={title}
              maxLength={150}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Internal Note Added"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="internal-note-body">Note</Label>
            <Textarea
              id="internal-note-body"
              value={note}
              maxLength={2000}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Write the update for your team..."
              className="min-h-28 resize-none text-xs"
              required
            />
            <p className="text-right text-xs text-muted-foreground">{note.length}/2000</p>
          </div>
        </form>
        <DialogFooter className="flex-row justify-end gap-2 border-t border-border px-6 py-3">
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="event-internal-note-form"
            disabled={saving || !note.trim()}
            className={
              note.trim()
                ? "bg-gradient-to-r from-purple-600 to-blue-600 font-medium text-white shadow-sm hover:from-purple-700 hover:to-blue-700"
                : ""
            }
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DateRangeFilter({ filters, onChange }) {
  const hasRange = filters.dateFrom || filters.dateTo;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 w-full sm:w-auto min-w-0 justify-start gap-2 px-3 text-xs font-normal">
          <CalendarDays className="h-4 w-4 text-blue-600" />
          {hasRange ? `${filters.dateFrom || "Any"} – ${filters.dateTo || "Any"}` : "Select Date Range"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="activity-date-from">From</Label>
          <Input
            id="activity-date-from"
            type="date"
            value={filters.dateFrom}
            max={filters.dateTo || undefined}
            onChange={(event) => onChange({ dateFrom: event.target.value, page: 1 })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="activity-date-to">To</Label>
          <Input
            id="activity-date-to"
            type="date"
            value={filters.dateTo}
            min={filters.dateFrom || undefined}
            onChange={(event) => onChange({ dateTo: event.target.value, page: 1 })}
          />
        </div>
        {hasRange ? (
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => onChange({ dateFrom: "", dateTo: "", page: 1 })}>
            Clear date range
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

const normalizeActivity = (activity) => {
  let title = activity.title || "";
  let description = activity.description || "";
  let type = activity.type;

  if (description.includes("->")) {
    description = description.replace(/->/g, "→");
  }

  if (/lifecycleAutomation/i.test(description) || /lifecycleAutomation/i.test(title)) {
    title = "Lifecycle automation updated";
    description = "Automation pause settings changed";
    type = "Other";
  } else if (/executionReadiness/i.test(description) || /executionReadiness/i.test(title)) {
    title = "Execution readiness updated";
    description = "Readiness settings changed";
    type = "Other";
  } else if (/bookingStatus/i.test(title) || /booking status/i.test(title)) {
    title = "Booking status updated";
    type = "Status";
  } else if (/visualPreference/i.test(title) || /visual preference/i.test(title)) {
    title = "Visual preference updated";
    type = "Preference";
  } else if (/^Updated:\s*/i.test(description)) {
    const rawFields = description.replace(/^Updated:\s*/i, "").split(",").map((s) => s.trim());
    const fieldLabels = {
      guestCount: "Guest count",
      eventType: "Event type",
      eventName: "Event name",
      venue: "Venue",
      city: "City",
      eventDate: "Event date",
      eventEndDate: "Event end date",
      functions: "Functions",
      servicesSelected: "Selected services",
      servicesRequired: "Required services",
      assignedManager: "Event manager",
      clientNotes: "Client notes",
      internalNotes: "Internal notes",
      bookingStatus: "Booking status",
    };
    const prettyFields = rawFields.map((f) => fieldLabels[f] || f.replace(/([A-Z])/g, " $1").toLowerCase());
    description = `Updated: ${prettyFields.join(", ")}`;
  }

  if (/^Stage:\s*(.*)\.?$/i.test(description)) {
    description = description.replace(/^Stage:\s*/i, "").replace(/\.$/, "").trim();
  }

  return { ...activity, title, description, type };
};

function ActivityDetailDialog({ activity, open, onOpenChange, eventId }) {
  const navigate = useNavigate();
  if (!activity) return null;
  const item = normalizeActivity(activity);
  const presentation = activityPresentation[item.type] || activityPresentation.Other;
  const color = activityColor(item);
  const Icon = presentation.icon;
  const beforeAfter = parseBeforeAfter(activity.description) || parseBeforeAfter(item.description);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${color.surface || presentation.surface}`}>
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold">{item.title}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">{formatAuditTimestamp(item.activityDate)}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-3 py-2 text-xs">
          <div className="flex items-center justify-between rounded-md bg-muted/40 p-2.5">
            <span className="text-muted-foreground">Recorded By:</span>
            <span className="font-semibold text-foreground">{activity.actor?.name || "Admin"}</span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-muted/40 p-2.5">
            <span className="text-muted-foreground">Module:</span>
            <Badge variant="outline" className={moduleTones[item.module] || ""}>{item.module}</Badge>
          </div>
          {beforeAfter ? (
            <div className="grid grid-cols-2 gap-2 rounded-md border border-border p-3">
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground">Before:</span>
                <p className="mt-0.5 font-medium text-foreground">{beforeAfter.before}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground">After:</span>
                <p className="mt-0.5 font-medium text-foreground">{beforeAfter.after}</p>
              </div>
            </div>
          ) : null}
          <div className="rounded-md border border-border p-3 space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground">Details / Summary:</p>
            <p className="whitespace-pre-wrap text-foreground">{item.description || "No additional details available."}</p>
            {activity.description && activity.description !== item.description && !beforeAfter ? (
              <p className="text-[11px] text-muted-foreground">Original log: {activity.description}</p>
            ) : null}
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          {item.action?.target ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-blue-600"
              onClick={() => {
                onOpenChange(false);
                navigate(`/dashboard/assigned-events/${eventId}/${item.action.target.replace(/^\//, '')}`);
              }}
            >
              Go to Section <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : <div />}
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActivityRow({ activity, onOpenDetail }) {
  const item = normalizeActivity(activity);
  const presentation = activityPresentation[item.type] || activityPresentation.Other;
  const color = activityColor(item);
  const Icon = presentation.icon;
  const timeInfo = splitTime(item.activityDate);

  return (
    <div className="border-t border-border/50 first:border-t-0 hover:bg-slate-50/50 transition-colors">
      <div className="hidden min-w-[960px] grid-cols-[60px_24px_minmax(220px,1fr)_120px_150px_165px_110px] items-center gap-3 px-4 py-3 md:grid">
        {/* Time column (stacked) */}
        <div className="w-14 shrink-0 text-center leading-tight">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{timeInfo.time}</p>
          <p className="text-[10px] font-medium text-muted-foreground">{timeInfo.period}</p>
        </div>

        {/* Timeline dot & vertical connector */}
        <div className="relative flex h-full items-center justify-center before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-border/60">
          <span className={`z-10 h-2 w-2 rounded-full ring-4 ring-card ${color.dot || presentation.dot}`} />
        </div>

        {/* Icon & Title / Subtitle */}
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${color.surface || presentation.surface}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
            <p className="truncate text-xs text-muted-foreground" title={item.description}>{item.description || "—"}</p>
          </div>
        </div>

        {/* Module tag */}
        <div className="flex justify-center">
          <span className={`inline-flex h-6 w-28 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold ${moduleTagStyles[item.module] || moduleTagStyles.Event}`}>
            {item.module}
          </span>
        </div>

        {/* Actor */}
        <div className="flex min-w-0 items-center gap-2">
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold ${color.badge || "bg-pink-100 text-pink-700"}`}>
            {initials(item.actor?.name)}
          </span>
          <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300" title={item.actor?.name}>
            {item.actor?.name || "Admin"}
          </span>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground whitespace-nowrap">
          {formatAuditTimestamp(item.activityDate)}
        </div>

        {/* Action Link: View Details → */}
        <div className="text-right">
          <button
            type="button"
            onClick={() => onOpenDetail(item)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline shrink-0"
          >
            View Details <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile view */}
      <div className="flex gap-2.5 p-3 md:hidden">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${color.surface || presentation.surface}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
            <span className="shrink-0 text-[11px] text-muted-foreground">{timeLabel(item.activityDate)}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.description || "—"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex h-5 items-center justify-center rounded px-2 text-[10px] font-semibold ${moduleTagStyles[item.module] || moduleTagStyles.Event}`}>
              {item.module}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-bold ${color.badge || "bg-pink-100 text-pink-700"}`}>
                {initials(item.actor?.name)}
              </span>
              {item.actor?.name || "Admin"}
            </span>
            <button
              type="button"
              onClick={() => onOpenDetail(item)}
              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View Details <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityTimeline({ activities, onOpenDetail }) {
  const groups = useMemo(() => {
    const grouped = new Map();
    activities.forEach((activity) => {
      const key = dateKey(activity.activityDate);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(activity);
    });
    return [...grouped.entries()];
  }, [activities]);

  if (!activities.length) {
    return (
      <Card><CardContent className="grid min-h-52 place-items-center text-center"><div><ClipboardCheck className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 font-semibold">No activity found</p><p className="mt-1 text-xs text-muted-foreground">Try changing the filters or add an internal note.</p></div></CardContent></Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {groups.map(([key, items]) => {
            const label = dateLabel(items[0]?.activityDate);
            return (
              <section key={key}>
                <div className="flex items-center gap-3 bg-slate-50/90 dark:bg-muted/40 px-5 py-2.5 border-y border-border/50">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{label.date}</span>
                  <span className="text-xs font-normal text-muted-foreground">{label.weekday}</span>
                </div>
                {items.map((activity) => <ActivityRow key={activity._id} activity={activity} onOpenDetail={onOpenDetail} />)}
              </section>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityPagination({ pagination, onChange }) {
  const page = Number(pagination?.page || 1);
  const limit = Number(pagination?.limit || 10);
  const total = Number(pagination?.totalRecords || 0);
  const totalPages = Number(pagination?.totalPages || 0);
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + Math.max(1, Math.min(page - 2, totalPages - 4)));

  return (
    <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">Showing {total ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, total)} of {total} activities</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground">Rows per page</span>
        <Select value={String(limit)} onValueChange={(value) => onChange({ page: 1, limit: Number(value) })}>
          <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
          <SelectContent>{[10, 25, 50].map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => onChange({ page: page - 1 })}><ChevronLeft className="h-4 w-4" /></Button>
        {pages.map((item) => <Button key={item} variant={item === page ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => onChange({ page: item })}>{item}</Button>)}
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={!totalPages || page >= totalPages} onClick={() => onChange({ page: page + 1 })}><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

export default function EventActivityPage() {
  const { eventId } = useParams();

  const [filters, setFilters] = useState(defaultFilters);
  const [noteOpen, setNoteOpen] = useState(false);
  const [detailActivity, setDetailActivity] = useState(null);
  const debouncedSearch = useDebouncedValue(filters.search, 350);

  const { booking, bookingQuery } = useOutletContext();
  const activityQuery = useQuery({
    queryKey: [
      "event-activities",
      eventId,
      debouncedSearch,
      filters.type,
      filters.module,
      filters.teamMember,
      filters.dateFrom,
      filters.dateTo,
      filters.page,
      filters.limit,
    ],
    queryFn: async () => (
      await AdminService.getEventActivities({
        eventId,
        search: debouncedSearch || undefined,
        type: filters.type === "all" ? undefined : filters.type,
        module: filters.module === "all" ? undefined : filters.module,
        teamMember: filters.teamMember === "all" ? undefined : filters.teamMember,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        page: filters.page,
        limit: filters.limit,
      })
    ).data?.eventActivities,
    enabled: Boolean(eventId),
  });
  const noteMutation = useMutation({
    mutationFn: (payload) => AdminService.addEventInternalNote({ eventId, ...payload }),
    onSuccess: () => {
      toast.success("Internal note added");
      activityQuery.refetch();
      bookingQuery.refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to add internal note"),
  });

  const functions = useMemo(() => booking?.functions || [], [booking]);
  const services = useMemo(
    () =>
      Array.from(
        new Set([
          ...(booking?.servicesRequired || []),
          ...(booking?.servicesSelected || [])
            .map((item) => item.name || item.service)
            .filter(Boolean),
        ]),
      ),
    [booking],
  );
  const metrics = useMemo(
    () => ({
      functions: functions.length,
      services: services.length,
      peakGuests: Math.max(
        Number(booking?.guestCount || 0),
        ...functions.map((item) => Number(item.guestCount || 0)),
      ),
      preferences: getFinalPreferenceCount(booking),
      approvals: (booking?.approvals || []).filter(
        (item) => item.status === "Pending",
      ).length,
    }),
    [booking, functions, services],
  );
  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const mergeFilters = (values) => setFilters((current) => ({ ...current, ...values }));

  if (bookingQuery.isLoading) return <div className="crm-page grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!booking) return <div className="crm-page p-5"><Card><CardContent className="p-8 text-center">Event booking not found.</CardContent></Card></div>;

  return (
    <div className="min-w-0 space-y-3">
      <EventSummaryCards metrics={metrics} compactMetrics />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(event) => setFilter("search", event.target.value)}
            className="h-9 w-full pl-9 text-xs placeholder:text-[11px]"
            placeholder="Search activity..."
          />
        </div>
        <Select value={filters.type} onValueChange={(value) => setFilter("type", value)}>
          <SelectTrigger className="h-9 w-full sm:w-[155px] shrink-0 text-xs">
            <SelectValue placeholder="All Activity Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activity Types</SelectItem>
            {(activityQuery.data?.options?.types || []).map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.module} onValueChange={(value) => setFilter("module", value)}>
          <SelectTrigger className="h-9 w-full sm:w-[130px] shrink-0 text-xs">
            <SelectValue placeholder="All Modules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {(activityQuery.data?.options?.modules || []).map((module) => (
              <SelectItem key={module} value={module}>{module}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.teamMember} onValueChange={(value) => setFilter("teamMember", value)}>
          <SelectTrigger className="h-9 w-full sm:w-[155px] shrink-0 text-xs">
            <SelectValue placeholder="All Team Members" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Team Members</SelectItem>
            {(activityQuery.data?.options?.teamMembers || []).map((member) => (
              <SelectItem key={member.value} value={member.value}>{member.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="w-full sm:w-auto shrink-0">
          <DateRangeFilter filters={filters} onChange={mergeFilters} />
        </div>
        <Button
          className="h-9 w-full sm:w-auto shrink-0 gap-1.5 px-3 text-xs"
          onClick={() => setNoteOpen(true)}
          variant="custom"
        >
          <Plus className="h-4 w-4" />
          Add Internal Note
        </Button>
      </div>

      {activityQuery.isLoading && !activityQuery.data ? (
        <Card><CardContent className="grid min-h-64 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></CardContent></Card>
      ) : activityQuery.isError && !activityQuery.data ? (
        <Card><CardContent className="grid min-h-52 place-items-center text-center"><div><CircleAlert className="mx-auto h-8 w-8 text-destructive" /><p className="mt-3 font-semibold">Unable to load event activity</p><Button variant="outline" size="sm" className="mt-3" onClick={() => activityQuery.refetch()}>Try Again</Button></div></CardContent></Card>
      ) : (
        <>
          <ActivityTimeline activities={activityQuery.data?.activities || []} onOpenDetail={setDetailActivity} />
          <ActivityPagination pagination={activityQuery.data?.pagination} onChange={mergeFilters} />
        </>
      )}

      <InternalNoteDialog open={noteOpen} onOpenChange={setNoteOpen} saving={noteMutation.isPending} onSave={(payload) => noteMutation.mutateAsync(payload)} />
      <ActivityDetailDialog activity={detailActivity} open={Boolean(detailActivity)} onOpenChange={(open) => !open && setDetailActivity(null)} eventId={eventId} />
    </div>
  );
}
