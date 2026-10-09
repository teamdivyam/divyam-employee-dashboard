/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Users,
  UtensilsCrossed,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@components/components/ui/avatar";
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/components/ui/dropdown-menu";

import { initials } from "../../eventBookingDashboard.utils";
import {
  ISSUE_STATUS_BADGES,
  ISSUE_STATUS_OPTIONS,
} from "./postEventReview.constants";

const PAGE_SIZE = 10;

// Helper to get category icon and tone
function getRelatedToInfo(relatedTo, service) {
  const norm = String(relatedTo || "").toLowerCase();
  if (norm.includes("service")) {
    return {
      icon: UtensilsCrossed,
      bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      label: "Service",
      subLabel: service || "Catering",
    };
  }
  if (norm.includes("vendor")) {
    return {
      icon: Users,
      bg: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      label: "Vendor",
      subLabel: service || "Decor Vendor",
    };
  }
  if (norm.includes("operation")) {
    return {
      icon: Settings,
      bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      label: "Operations",
      subLabel: service || "Equipment",
    };
  }
  if (norm.includes("function")) {
    return {
      icon: Layers,
      bg: "bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400 border-pink-200 dark:border-pink-800",
      label: "Function",
      subLabel: service || "Wedding",
    };
  }
  return {
    icon: Sparkles,
    bg: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    label: "Overall Event",
    subLabel: service || "General",
  };
}

function formatDate(d) {
  if (!d) return "—";
  try {
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return d;
    return parsed.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export function IssuesActionsToolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  onAddIssue,
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 lg:flex-nowrap">
      <div className="relative min-w-[300px] flex-1 sm:w-48 sm:flex-none">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search issues..."
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-8 pl-8 text-[11px] placeholder:text-muted-foreground/70"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="h-8 w-24 text-[11px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">All Status</SelectItem>
          {ISSUE_STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status.toLowerCase()} className="text-xs">{status}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="h-8 w-24 text-[11px]">
          <SelectValue placeholder="All Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">All Priority</SelectItem>
          <SelectItem value="high" className="text-xs">High</SelectItem>
          <SelectItem value="medium" className="text-xs">Medium</SelectItem>
          <SelectItem value="low" className="text-xs">Low</SelectItem>
        </SelectContent>
      </Select>
      <Button
        size="sm"
        className="h-8 shrink-0 gap-1.5 px-2 text-[11px] text-primary-foreground hover:bg-primary/90"
        variant="custom"
        onClick={onAddIssue}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Add Issue
      </Button>
    </div>
  );
}

export default function IssuesActionsPanel({
  issues = [],
  searchTerm = "",
  statusFilter = "all",
  priorityFilter = "all",
  onAddIssue,
  onEditIssue,
  onDeleteIssue,
  onUpdateStatus,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => setCurrentPage(1), [searchTerm, statusFilter, priorityFilter]);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      const title = iss.title || iss.issueTitle || iss.description || "";
      const source = iss.source || iss.issueSource || "";
      const owner = iss.owner || iss.assignee || "";
      const related = iss.relatedTo || iss.service || "";

      const matchSearch =
        !searchTerm.trim() ||
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        related.toLowerCase().includes(searchTerm.toLowerCase());

      const issStatus = (iss.status || "Open").toLowerCase();
      const matchStatus =
        statusFilter === "all" || issStatus === statusFilter.toLowerCase();

      const issPriority = (iss.priority || "Medium").toLowerCase();
      const matchPriority =
        priorityFilter === "all" ||
        issPriority === priorityFilter.toLowerCase();

      return matchSearch && matchStatus && matchPriority;
    });
  }, [issues, searchTerm, statusFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredIssues.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageItems = filteredIssues.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-xs">

      {filteredIssues.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          <div className="flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500/70" />
            <p className="font-semibold text-foreground text-sm">
              {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                ? "No issues found"
                : "No issues recorded yet"}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                ? "No issues match your current filters."
                : "Log an issue when it is reported or observed."}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left [&_td]:border-0 [&_th]:border-0">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-xs font-semibold text-muted-foreground">
                <th className="w-10 py-3 pl-4 pr-2 text-center">#</th>
                <th className="min-w-[220px] px-4 py-3">Issue</th>
                <th className="min-w-[160px] px-4 py-3">Related To</th>
                <th className="w-24 py-3 pl-0 pr-4">
                  <span className="-ml-4">Priority</span>
                </th>
                <th className="min-w-[170px] px-4 py-3">Owner</th>
                <th className="w-36 py-3 pl-0 pr-4">
                  <span className="-ml-4">Target Date</span>
                </th>
                <th className="w-28 py-3 pl-0 pr-4">
                  <span className="-ml-4">Status</span>
                </th>
                <th className="w-28 py-3 pl-4 pr-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs text-foreground">
              {pageItems.map((iss, index) => {
                const issueId = iss._id || iss.id || `issue-${index}`;
                const title =
                  iss.title ||
                  iss.issueTitle ||
                  iss.description ||
                  "Untitled Issue";
                const source =
                  iss.source || iss.issueSource || "Client Feedback";
                const priority = iss.priority || "Medium";
                const status = iss.status || "Open";
                const ownerName = iss.owner || iss.assignee || "Admin Team";
                const ownerRole =
                  iss.ownerRole ||
                  (ownerName.includes("Lead") ? "Lead" : "Operations Team");
                const targetDate = iss.targetDate || iss.date;
                const relatedInfo = getRelatedToInfo(
                  iss.relatedTo,
                  iss.service || iss.relatedItem,
                );
                const IconComp = relatedInfo.icon;

                const priorityBadgeClass =
                  {
                    High: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
                    Medium:
                      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
                    Low: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
                  }[priority] || "bg-muted text-muted-foreground";

                const statusBadgeClass =
                  ISSUE_STATUS_BADGES[status] ||
                  "bg-muted text-muted-foreground border-border";

                return (
                  <tr
                    key={issueId}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {/* # Index */}
                    <td className="py-3.5 pl-4 pr-2 text-center text-xs font-medium text-muted-foreground">
                      {startIndex + index + 1}
                    </td>

                    {/* Issue Title + Source */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-foreground leading-snug">
                        {title}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Reported from {source}
                      </div>
                    </td>

                    {/* Related To */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${relatedInfo.bg}`}
                        >
                          <IconComp className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-xs text-foreground leading-tight">
                            {relatedInfo.label}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {relatedInfo.subLabel}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 pl-0 pr-4">
                      <span
                        className={`-ml-4 inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${priorityBadgeClass}`}
                      >
                        {priority}
                      </span>
                    </td>

                    {/* Owner */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 shrink-0 rounded-full">
                          <AvatarFallback className="rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {initials(ownerName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-xs text-foreground leading-tight truncate">
                            {ownerName}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {ownerRole}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Target Date */}
                    <td className="py-3.5 pl-0 pr-4 text-xs text-muted-foreground">
                      <div className="-ml-4 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                        <span>{formatDate(targetDate)}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 pl-0 pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={`-ml-4 inline-flex cursor-pointer items-center justify-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-opacity hover:opacity-80 ${statusBadgeClass}`}
                          >
                            {status}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="text-xs">
                          {ISSUE_STATUS_OPTIONS.map((st) => (
                            <DropdownMenuItem
                              key={st}
                              className="text-xs"
                              onClick={() => onUpdateStatus?.(iss, st)}
                            >
                              {st}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 pl-2 pr-2 text-center align-middle">
                      <div className="inline-flex items-center justify-center gap-0.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 border-border px-2.5 text-xs text-primary hover:bg-primary/5"
                          onClick={() => onEditIssue?.(iss)}
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          View
                        </Button>
                        {onDeleteIssue && <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="More issue actions"
                              className="h-7 w-6 text-muted-foreground"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem
                              onClick={() => onDeleteIssue?.(issueId)}
                              className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete Issue
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-border/80 px-4 py-3 sm:px-5">
        <p className="text-xs text-muted-foreground">
          Showing {filteredIssues.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(startIndex + PAGE_SIZE, filteredIssues.length)} of{" "}
          {filteredIssues.length} issues
        </p>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Previous
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
            <Button
              key={pNum}
              variant={safePage === pNum ? "default" : "outline"}
              size="sm"
              className={`h-8 w-8 p-0 text-xs ${
                safePage === pNum
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : ""
              }`}
              onClick={() => setCurrentPage(pNum)}
            >
              {pNum}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}


