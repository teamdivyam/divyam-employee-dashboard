import React from "react";
import { Badge } from "@components/components/ui/badge";
import { MoreVertical } from "lucide-react";

export const formatDate = (value, options = {}) => {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(new Date(value));
};

export const formatDateTime = (value) => {
  if (!value) return "Not available";
  return `${formatDate(value)} ${new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))}`;
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const toneClass = (value = "") => {
  const item = String(value).toLowerCase();
  if (item.includes("complete") || item.includes("approved") || item.includes("paid")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300";
  }
  if (item.includes("high") || item.includes("rework") || item.includes("rejected")) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300";
  }
  if (item.includes("medium") || item.includes("pending") || item.includes("progress")) {
    return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300";
  }
  if (item.includes("submitted")) {
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-300";
  }
  if (item.includes("low")) {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300";
  }
  return "border-border bg-muted/60 text-muted-foreground";
};

export function StatusBadge({ children }) {
  return (
    <Badge variant="outline" className={`rounded-md px-2 py-0.5 text-xs font-medium ${toneClass(children)}`}>
      {children || "Not available"}
    </Badge>
  );
}

export function CategoryBadge({ children }) {
  return (
    <Badge variant="outline" className="rounded-md border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300">
      {children || "General"}
    </Badge>
  );
}

export function MetricCard({ label, value, subLabel, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300",
    red: "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-400/10 dark:text-slate-300",
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tones[tone] || tones.blue}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{subLabel}</p>
        </div>
      </div>
    </div>
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

export function IconPill({ icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300",
    red: "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300",
  };

  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tones[tone] || tones.blue}`}>
      <Icon className="h-5 w-5" />
    </span>
  );
}

export function MoreButton() {
  return (
    <button type="button" className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted">
      <MoreVertical className="h-4 w-4" />
    </button>
  );
}

export function TableButton({ children, onClick }) {
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

export function DataTable({ headers, rows, emptyText }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length ? rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-muted/30">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 align-middle text-foreground">{cell}</td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={headers.length} className="px-4 py-12 text-center text-muted-foreground">{emptyText}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function DetailLine({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 text-sm">
      {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /> : null}
      <div className="grid min-w-0 flex-1 grid-cols-[120px_1fr] gap-3">
        <span className="text-muted-foreground">{label}</span>
        <span className="break-words font-medium text-foreground">{value || "Not available"}</span>
      </div>
    </div>
  );
}
