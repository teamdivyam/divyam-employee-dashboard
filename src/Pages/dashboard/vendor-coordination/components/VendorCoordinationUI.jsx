import React from "react";
import { Badge } from "@components/components/ui/badge";
import { MoreVertical } from "lucide-react";

export const formatDate = (value) => {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

export const formatDay = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(new Date(value));
};

export const formatTime = (value) => {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const statusTone = (value = "") => {
  const item = String(value).toLowerCase();
  if (item.includes("confirm") || item.includes("complete")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300";
  }
  if (item.includes("issue") || item.includes("not confirmed") || item.includes("cancel")) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300";
  }
  if (item.includes("pending") || item.includes("assigned")) {
    return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300";
  }
  if (item.includes("progress") || item.includes("setup")) {
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-300";
  }
  if (item.includes("contact") || item.includes("dispatch") || item.includes("venue")) {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300";
  }
  return "border-border bg-muted/60 text-muted-foreground";
};

export function StatusBadge({ children }) {
  return (
    <Badge variant="outline" className={`rounded-md px-2 py-0.5 text-xs font-medium ${statusTone(children)}`}>
      {children || "Not available"}
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
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${tones[tone] || tones.blue}`}>
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

export function VendorLogo({ name, size = "small" }) {
  const classes = size === "large" ? "h-40 w-40 text-5xl" : "h-12 w-12 text-sm";
  return (
    <div className={`${classes} flex shrink-0 items-center justify-center rounded-lg border border-orange-200 bg-slate-950 font-serif font-bold text-orange-400 shadow-sm dark:border-orange-400/30`}>
      {name?.charAt(0) || "V"}
    </div>
  );
}

export function IconButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition hover:bg-muted"
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

export function DataTable({ headers, rows, emptyText }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] text-left text-sm">
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

export function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 text-sm">
      {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /> : null}
      <div>
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 font-semibold text-foreground">{value || "Not available"}</p>
      </div>
    </div>
  );
}
