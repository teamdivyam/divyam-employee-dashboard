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
  FileText,
  Loader2,
  MessageSquareText,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import AdminService from "../../../services/event-booking-workspace.service";
import { Avatar, AvatarFallback } from "@components/components/ui/avatar";
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
import EventDetailTabs from "./components/EventDetailTabs";
import EventFunctionsHeader from "./components/EventFunctionsHeader";
import { getBookingDetail } from "./components/EventBookingComponents";
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
    surface: "bg-pink-500/10 text-pink-600 dark:text-pink-300",
  },
  Payment: {
    icon: Banknote,
    dot: "bg-emerald-500",
    surface: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  },
  Invoice: {
    icon: FileText,
    dot: "bg-green-600",
    surface: "bg-green-500/10 text-green-700 dark:text-green-300",
  },
  Document: {
    icon: FileText,
    dot: "bg-blue-600",
    surface: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  },
  "Client Approval": {
    icon: ClipboardCheck,
    dot: "bg-violet-600",
    surface: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  },
  Task: {
    icon: ClipboardCheck,
    dot: "bg-cyan-600",
    surface: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  },
  Status: {
    icon: CheckCircle2,
    dot: "bg-blue-600",
    surface: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  },
  Other: {
    icon: CircleAlert,
    dot: "bg-amber-500",
    surface: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  },
};

const moduleTones = {
  Commercial: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  "Client Payments": "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  "Cost & Settlements": "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  "Invoices & Receipts": "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300",
  Documents: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  "Client Updates": "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
  "Tasks & Workflow": "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300",
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

const dateTimeLabel = (value) => {
  const date = validDate(value);
  return date
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: ACTIVITY_TIME_ZONE,
      }).format(date)
    : "—";
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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Internal Note</DialogTitle>
          <DialogDescription>
            Keep an internal event update visible to the admin team.
          </DialogDescription>
        </DialogHeader>
        <form id="event-internal-note-form" onSubmit={submit} className="space-y-4">
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
              className="min-h-28 resize-none"
              required
            />
            <p className="text-right text-xs text-muted-foreground">{note.length}/2000</p>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="event-internal-note-form" disabled={saving || !note.trim()}>
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
        <Button variant="outline" className="h-9 w-full min-w-0 justify-start gap-2 px-3 font-normal">
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
          <Button variant="ghost" size="sm" className="w-full" onClick={() => onChange({ dateFrom: "", dateTo: "", page: 1 })}>
            Clear date range
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function ActivityAction({ eventId, action }) {
  const navigate = useNavigate();
  if (!action) return null;
  if (action.url) {
    return (
      <Button variant="ghost" size="sm" className="gap-1 px-2 text-blue-600" asChild>
        <a href={action.url} target="_blank" rel="noreferrer">
          {action.label}<ArrowRight className="h-3.5 w-3.5" />
        </a>
      </Button>
    );
  }
  const target = action.target ? `/${action.target}` : "";
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1 px-2 text-blue-600"
      onClick={() => navigate(`/dashboard/assigned-events/${eventId}${target}`)}
    >
      {action.label}<ArrowRight className="h-3.5 w-3.5" />
    </Button>
  );
}

function ActivityRow({ activity, eventId }) {
  const presentation = activityPresentation[activity.type] || activityPresentation.Other;
  const Icon = presentation.icon;
  return (
    <div className="border-t border-border first:border-t-0">
      <div className="hidden min-w-[960px] grid-cols-[70px_28px_minmax(240px,1fr)_150px_150px_165px_125px] items-center md:grid">
        <div className="px-2.5 py-1.5 text-xs text-muted-foreground">{timeLabel(activity.activityDate)}</div>
        <div className="relative flex h-full items-center justify-center before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-border">
          <span className={`z-10 h-2.5 w-2.5 rounded-full ring-4 ring-card ${presentation.dot}`} />
        </div>
        <div className="flex min-w-0 items-center gap-2 px-2.5 py-1.5">
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${presentation.surface}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-blue-950 dark:text-blue-200">{activity.title}</p>
            <p className="truncate text-xs text-muted-foreground" title={activity.description}>{activity.description || "—"}</p>
          </div>
        </div>
        <div className="px-2.5 py-1.5">
          <Badge variant="outline" className={`w-full justify-center ${moduleTones[activity.module] || "border-border bg-muted text-muted-foreground"}`}>
            {activity.module}
          </Badge>
        </div>
        <div className="flex min-w-0 items-center gap-2 px-2.5 py-1.5">
          <Avatar className="h-7 w-7"><AvatarFallback className="bg-blue-50 text-[11px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{initials(activity.actor?.name)}</AvatarFallback></Avatar>
          <span className="truncate text-xs">{activity.actor?.name || "Admin"}</span>
        </div>
        <div className="px-2.5 py-1.5 text-xs text-muted-foreground">{dateTimeLabel(activity.activityDate)}</div>
        <div className="px-2 py-1.5 text-right"><ActivityAction eventId={eventId} action={activity.action} /></div>
      </div>

      <div className="flex gap-2.5 p-2.5 md:hidden">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${presentation.surface}`}><Icon className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-blue-950 dark:text-blue-200">{activity.title}</p>
            <span className="shrink-0 text-[11px] text-muted-foreground">{timeLabel(activity.activityDate)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{activity.description || "—"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={moduleTones[activity.module] || ""}>{activity.module}</Badge>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><UserRound className="h-3 w-3" />{activity.actor?.name || "Admin"}</span>
            <ActivityAction eventId={eventId} action={activity.action} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityTimeline({ activities, eventId }) {
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
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {groups.map(([key, items]) => {
            const label = dateLabel(items[0]?.activityDate);
            return (
              <section key={key}>
                <div className="flex items-center gap-2.5 bg-muted/60 px-3 py-1.5">
                  <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-blue-950 shadow-sm dark:text-blue-200">{label.date}</span>
                  <span className="text-xs text-muted-foreground">{label.weekday}</span>
                </div>
                {items.map((activity) => <ActivityRow key={activity._id} activity={activity} eventId={eventId} />)}
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
  const navigate = useNavigate();
  const [filters, setFilters] = useState(defaultFilters);
  const [noteOpen, setNoteOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(filters.search, 350);

  const bookingQuery = useQuery({
    queryKey: ["event-booking-detail", eventId],
    queryFn: async () => (await AdminService.getEventBookingDetail({ eventId })).data,
    enabled: Boolean(eventId),
  });
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

  const booking = getBookingDetail(bookingQuery.data);
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
    <div className="crm-page min-h-screen space-y-3 p-3 sm:p-4 lg:p-5">
      <EventFunctionsHeader
        booking={booking}
        metrics={metrics}
        compactMetrics
        onBack={() => navigate("/dashboard/assigned-events")}
        onEdit={() => navigate(`/dashboard/assigned-events/${eventId}`)}
        onMarkReady={() => navigate(`/dashboard/assigned-events/${eventId}`)}
        onOpenPlanning={() => navigate(`/dashboard/assigned-events/${eventId}/operations`)}
        primaryActionLabel="Open Operations Plan"
      />
      <EventDetailTabs activePrimary="activity" />

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_160px_160px_176px_176px_auto] xl:items-center">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={filters.search} onChange={(event) => setFilter("search", event.target.value)} className="h-9 pl-9" placeholder="Search activity..." />
        </div>
        <Select value={filters.type} onValueChange={(value) => setFilter("type", value)}>
          <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Activity Types</SelectItem>{(activityQuery.data?.options?.types || []).map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.module} onValueChange={(value) => setFilter("module", value)}>
          <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Modules</SelectItem>{(activityQuery.data?.options?.modules || []).map((module) => <SelectItem key={module} value={module}>{module}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.teamMember} onValueChange={(value) => setFilter("teamMember", value)}>
          <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Team Members</SelectItem>{(activityQuery.data?.options?.teamMembers || []).map((member) => <SelectItem key={member.value} value={member.value}>{member.label}</SelectItem>)}</SelectContent>
        </Select>
        <DateRangeFilter filters={filters} onChange={mergeFilters} />
        <Button className="h-9 w-full gap-2 px-3 xl:w-auto" onClick={() => setNoteOpen(true)}><Plus className="h-4 w-4" />Add Internal Note</Button>
      </div>

      {activityQuery.isLoading && !activityQuery.data ? (
        <Card><CardContent className="grid min-h-64 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></CardContent></Card>
      ) : activityQuery.isError && !activityQuery.data ? (
        <Card><CardContent className="grid min-h-52 place-items-center text-center"><div><CircleAlert className="mx-auto h-8 w-8 text-destructive" /><p className="mt-3 font-semibold">Unable to load event activity</p><Button variant="outline" size="sm" className="mt-3" onClick={() => activityQuery.refetch()}>Try Again</Button></div></CardContent></Card>
      ) : (
        <>
          <ActivityTimeline activities={activityQuery.data?.activities || []} eventId={eventId} />
          <ActivityPagination pagination={activityQuery.data?.pagination} onChange={mergeFilters} />
        </>
      )}

      <InternalNoteDialog open={noteOpen} onOpenChange={setNoteOpen} saving={noteMutation.isPending} onSave={(payload) => noteMutation.mutateAsync(payload)} />
    </div>
  );
}
