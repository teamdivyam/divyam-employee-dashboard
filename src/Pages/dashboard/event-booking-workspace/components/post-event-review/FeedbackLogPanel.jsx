/* eslint-disable react/prop-types */
import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Mail,
  Plus,
  MoreVertical,
  Eye,
  Trash2,
  MessageSquareQuote,
} from "lucide-react";

import { Button } from "@components/components/ui/button";
import { Avatar, AvatarFallback } from "@components/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import { Input } from "@components/components/ui/input";

import StarRating from "./StarRating";
import {
  FEEDBACK_FROM_OPTIONS,
  SOURCE_OPTIONS,
  SOURCE_BADGES,
} from "./postEventReview.constants";
import { initials } from "../../eventBookingDashboard.utils";

const PAGE_SIZE = 10;

export function FeedbackLogToolbar({
  search,
  onSearchChange,
  filterSource,
  onSourceChange,
  filterRole,
  onRoleChange,
  onAddNew,
  onRequestFeedback,
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 lg:flex-nowrap">
      <div className="relative min-w-[300px] flex-1 sm:w-48 sm:flex-none">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search feedback..."
          className="h-8 w-full rounded-md pl-8 text-[11px]"
        />
      </div>

      <Select value={filterSource} onValueChange={onSourceChange}>
        <SelectTrigger className="h-8 w-24 text-[11px]">
          <SelectValue placeholder="All Sources" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">All Sources</SelectItem>
          {SOURCE_OPTIONS.map((source) => (
            <SelectItem key={source} value={source} className="text-xs">{source}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filterRole} onValueChange={onRoleChange}>
        <SelectTrigger className="h-8 w-24 text-[11px]">
          <SelectValue placeholder="All Roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">All Roles</SelectItem>
          {FEEDBACK_FROM_OPTIONS.map((role) => (
            <SelectItem key={role} value={role} className="text-xs">{role}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        className="h-8 shrink-0 gap-1.5 border-primary px-2 text-[11px] text-primary hover:bg-primary/5"
        onClick={onRequestFeedback}
      >
        <Mail className="h-3.5 w-3.5" aria-hidden="true" />
        Request Feedback
      </Button>

      <Button
        size="sm"
        className="h-8 shrink-0 gap-1.5 px-2 text-[11px] text-primary-foreground hover:bg-primary/90"
        variant="custom"
        onClick={onAddNew}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Add Feedback
      </Button>
    </div>
  );
}

export default function FeedbackLogPanel({
  feedbacks,
  search = "",
  filterSource = "all",
  filterRole = "all",
  onEdit,
  onDelete,
  onAddNew,
}) {
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [search, filterSource, filterRole]);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((fb) => {
      const matchSearch =
        !search.trim() ||
        fb.nameReference?.toLowerCase().includes(search.toLowerCase()) ||
        fb.feedbackFrom?.toLowerCase().includes(search.toLowerCase()) ||
        fb.observation?.toLowerCase().includes(search.toLowerCase()) ||
        fb.relatedTo?.toLowerCase().includes(search.toLowerCase());

      const matchSource = filterSource === "all" || fb.source === filterSource;
      const matchRole = filterRole === "all" || fb.feedbackFrom === filterRole;

      return matchSearch && matchSource && matchRole;
    });
  }, [feedbacks, search, filterSource, filterRole]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredFeedbacks.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleFeedbacks = filteredFeedbacks.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
      {/* Table */}
      <div className="overflow-x-auto border-y border-border">
        <table className="w-full min-w-[980px] table-fixed text-left text-xs">
          <colgroup>
            <col className="w-[4%]" />
            <col className="w-[9%]" />
            <col className="w-[17%]" />
            <col className="w-[9%]" />
            <col className="w-[11%]" />
            <col className="w-[9%]" />
            <col className="w-[30%]" />
            <col className="w-[11%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-3 py-2.5 font-semibold text-muted-foreground">
                #
              </th>
              <th className="px-3 py-2.5 font-semibold text-muted-foreground">
                Date
              </th>
              <th className="px-3 py-2.5 font-semibold text-muted-foreground">
                Feedback From
              </th>
              <th className="px-3 py-2.5 font-semibold text-muted-foreground">
                Source
              </th>
              <th className="px-3 py-2.5 font-semibold text-muted-foreground">
                Related To
              </th>
              <th className="px-3 py-2.5 font-semibold text-muted-foreground">
                Rating
              </th>
              <th className="px-3 py-2.5 font-semibold text-muted-foreground">
                Feedback Summary
              </th>
              <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredFeedbacks.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-xs text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <MessageSquareQuote className="h-8 w-8 text-muted-foreground/40" />
                    <p className="font-semibold text-foreground text-sm">
                      No feedback recorded yet
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Record feedback when it is received.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              visibleFeedbacks.map((fb, idx) => (
                <tr
                  key={fb._id || fb.id || startIndex + idx}
                  className="border-b border-border/70 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-3 font-medium text-foreground">
                    {startIndex + idx + 1}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-foreground">
                    {fb.feedbackDate
                      ? new Date(fb.feedbackDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 shrink-0 rounded-full">
                        <AvatarFallback
                          className={`rounded-full text-[10px] font-bold ${
                            fb.avatarBg || "bg-primary/10 text-primary"
                          }`}
                        >
                          {fb.avatarInitials ||
                            initials(fb.nameReference || fb.feedbackFrom)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-xs leading-tight">
                          {fb.feedbackFrom}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate leading-tight">
                          {fb.nameReference}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${
                        SOURCE_BADGES[fb.source] ||
                        "bg-muted text-muted-foreground"
                      }`}
                    >
                      {fb.source}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-foreground">
                    {fb.relatedTo}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {fb.rating > 0 ? (
                      <div className="space-y-0.5">
                        <StarRating value={fb.rating} readonly size="sm" />
                        <span className="text-[11px] text-muted-foreground block font-medium">
                          {fb.rating}/5
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground font-medium text-sm">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs leading-relaxed text-foreground">
                    <p className="line-clamp-2 break-words">{fb.observation}</p>
                  </td>
                  <td className="whitespace-nowrap px-2 py-3 text-center align-middle">
                    <div className="inline-flex items-center justify-center gap-0.5">
                      <button
                        onClick={() => onEdit(fb)}
                        className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-primary transition hover:bg-muted"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        View
                      </button>
                      {onDelete && <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="More feedback actions"
                            className="h-7 w-6 text-muted-foreground"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem
                            onClick={() => onDelete(fb._id || fb.id)}
                            className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete Feedback
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredFeedbacks.length > 0 && (
        <div className="flex flex-col gap-3 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p>
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + PAGE_SIZE, filteredFeedbacks.length)} of{" "}
            {filteredFeedbacks.length} feedback entries
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="h-8 px-2.5 text-xs"
            >
              Previous
            </Button>
            <Button
              size="sm"
              className="h-8 w-8 bg-primary p-0 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {currentPage}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              className="h-8 px-2.5 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


