import React from "react";
import { Badge } from "@components/components/ui/badge";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flag,
  MapPin,
  MoreVertical,
  UsersRound,
} from "lucide-react";

export const placeholderEventImage =
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80";

export const formatDate = (value, options = {}) => {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(new Date(value));
};

export const formatDay = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(new Date(value));
};

export const formatDateTime = (value) => {
  if (!value) return "Not available";
  return `${formatDate(value)} ${new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))}`;
};

export const getEventImage = (event) =>
  event?.coverImage?.large ||
  event?.coverImage?.medium ||
  event?.coverImage?.small ||
  event?.coverImage?.original ||
  placeholderEventImage;

const badgeTone = (value = "") => {
  const normalized = value.toLowerCase();
  if (normalized.includes("confirm") || normalized.includes("complete") || normalized.includes("issued")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300";
  }
  if (normalized.includes("high") || normalized.includes("not checked") || normalized.includes("pending")) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300";
  }
  if (normalized.includes("medium") || normalized.includes("planning") || normalized.includes("planned") || normalized.includes("progress")) {
    return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300";
  }
  if (normalized.includes("low")) {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300";
  }
  return "border-border bg-muted/60 text-muted-foreground";
};

export function StatusBadge({ children }) {
  return (
    <Badge variant="outline" className={`rounded-md px-2 py-0.5 text-xs font-medium ${badgeTone(String(children || ""))}`}>
      {children || "Not available"}
    </Badge>
  );
}

export function RoleBadge({ children }) {
  return (
    <Badge variant="outline" className="rounded-md border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-300">
      {children || "Team Member"}
    </Badge>
  );
}

export function SectionCard({ title, icon: Icon, action, children, className = "" }) {
  return (
    <section className={`rounded-lg border border-border bg-card text-card-foreground shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function MetricCard({ label, value, subLabel, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300",
    red: "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300",
  };
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tones[tone] || tones.blue}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value ?? 0}</p>
          <p className="text-xs text-muted-foreground">{subLabel}</p>
        </div>
      </div>
    </div>
  );
}

export function DetailStat({ icon: Icon, label, value, subValue, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-400/10 dark:text-slate-300",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300",
    red: "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300",
  };
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tones[tone] || tones.blue}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">{value || "Not available"}</p>
          {subValue ? <p className="text-xs text-muted-foreground">{subValue}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function ReadinessBar({ value = 0 }) {
  const percentage = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="min-w-[80px]">
      <p className="mb-2 text-sm font-semibold text-foreground">{percentage}%</p>
      <div className="h-1.5 rounded-full bg-muted">
        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export function TableActionButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
    >
      {children}
    </button>
  );
}

export function MoreButton() {
  return (
    <button type="button" className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted">
      <MoreVertical className="h-4 w-4" />
    </button>
  );
}

export const metricConfig = [
  ["totalAssigned", "Total Assigned", "All Events", CalendarDays, "blue"],
  ["upcomingEvents", "Upcoming Events", "Next 30 Days", CalendarDays, "green"],
  ["planningEvents", "In Progress / Planning", "Planning Stage", Flag, "orange"],
  ["completedEvents", "Completed Events", "This Year", CheckCircle2, "violet"],
  ["thisWeekEvents", "This Week Events", "7 Days", Clock3, "blue"],
  ["pendingEventTasks", "Pending Event Tasks", "Across Events", CalendarDays, "red"],
];

export const detailStats = {
  date: CalendarDays,
  venue: MapPin,
  city: Building2,
  guest: UsersRound,
};
