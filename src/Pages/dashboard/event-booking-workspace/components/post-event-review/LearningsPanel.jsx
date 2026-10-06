/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { Eye, Lightbulb, MoreVertical, Plus, Search, Sparkles, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@components/components/ui/avatar";
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
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

import { initials } from "../../eventBookingDashboard.utils";

const PAGE_SIZE = 10;
const valueOf = (learning, key, fallback = "") => {
  if (key === "type") {
    return (
      learning.learningType ||
      learning.type ||
      (learning.impact === "High" ? "Improvement" : "Worked Well")
    );
  }
  if (key === "relatedTo")
    return learning.relatedTo || learning.category || fallback;
  return learning[key] || fallback;
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

export function LearningsToolbar({
  learnings,
  search,
  onSearchChange,
  relatedFilter,
  onRelatedChange,
  functionFilter,
  onFunctionChange,
  typeFilter,
  onTypeChange,
  onAddLearning,
}) {
  const filterOptions = useMemo(
    () => ({
      related: [...new Set(learnings.map((item) => valueOf(item, "relatedTo")).filter(Boolean))],
      functions: [...new Set(learnings.flatMap((item) => item.functions || []).filter(Boolean))],
      types: [...new Set(learnings.map((item) => valueOf(item, "type")).filter(Boolean))],
    }),
    [learnings],
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5 lg:flex-nowrap">
      <div className="relative min-w-[300px] flex-1 sm:w-48 sm:flex-none">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search learnings..."
          className="h-8 pl-8 text-[11px]"
        />
      </div>
      <Select value={relatedFilter} onValueChange={onRelatedChange}>
        <SelectTrigger className="h-8 w-24 text-[11px]"><SelectValue placeholder="Related To" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Related To</SelectItem>
          {filterOptions.related.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={functionFilter} onValueChange={onFunctionChange}>
        <SelectTrigger className="h-8 w-24 text-[11px]"><SelectValue placeholder="Functions" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Functions</SelectItem>
          {filterOptions.functions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={onTypeChange}>
        <SelectTrigger className="h-8 w-20 text-[11px]"><SelectValue placeholder="Types" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {filterOptions.types.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        className="h-8 shrink-0 gap-1.5 px-2 text-[11px] text-primary-foreground hover:bg-primary/90"
        variant="custom"
        onClick={onAddLearning}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Add Learning
      </Button>
    </div>
  );
}

export default function LearningsPanel({
  learnings = [],
  search = "",
  relatedFilter = "all",
  functionFilter = "all",
  typeFilter = "all",
  onAddLearning,
  onEditLearning,
  onDeleteLearning,
}) {
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [search, relatedFilter, functionFilter, typeFilter]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return learnings.filter((item) => {
      const observation = item.observation || item.description || "";
      const recommended = item.recommendedPractice || "";
      const functions = item.functions || [];
      return (
        (!query ||
          [item.title, observation, recommended, item.relatedItem].some(
            (value) =>
              String(value || "")
                .toLowerCase()
                .includes(query),
          )) &&
        (relatedFilter === "all" ||
          valueOf(item, "relatedTo") === relatedFilter) &&
        (functionFilter === "all" || functions.includes(functionFilter)) &&
        (typeFilter === "all" || valueOf(item, "type") === typeFilter)
      );
    });
  }, [functionFilter, learnings, relatedFilter, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const rows = filtered.slice(startIndex, startIndex + PAGE_SIZE);
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <Lightbulb className="h-8 w-8 text-amber-500/60" />
          <p className="text-sm font-semibold">No learnings found</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Capture reusable observations and best practices from this event.
          </p>
          {!search &&
          relatedFilter === "all" &&
          functionFilter === "all" &&
          typeFilter === "all" ? (
            <Button size="sm" className="mt-1" onClick={onAddLearning}>
              Add Learning
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed text-left text-xs [&_td]:border-0 [&_th]:border-0">
            <colgroup>
              <col className="w-[4%]" />
              <col className="w-[25%]" />
              <col className="w-[14%]" />
              <col className="w-[15%]" />
              <col className="w-[12%]" />
              <col className="w-[17%]" />
              <col className="w-[13%]" />
            </colgroup>
            <thead className="bg-muted/45 text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Learning</th>
                <th className="px-3 py-2.5">Related To</th>
                <th className="px-3 py-2.5">Function(s)</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Added By</th>
                <th className="px-4 py-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((learning, index) => {
                const type = valueOf(learning, "type");
                const relatedTo = valueOf(
                  learning,
                  "relatedTo",
                  "Overall Event",
                );
                const observation =
                  learning.observation || learning.description || "";
                const functions = learning.functions?.length
                  ? learning.functions
                  : ["Overall Event"];
                const addedBy =
                  learning.addedByName ||
                  learning.createdBy?.name ||
                  "Admin Team";
                return (
                  <tr
                    key={learning._id || learning.id || index}
                    className="border-b border-border/70 last:border-0 hover:bg-muted/25"
                  >
                    <td className="px-3 py-3 font-medium">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold leading-snug">
                        {learning.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                        {observation}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                          <Sparkles className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold">{relatedTo}</p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {learning.relatedItem || "General"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {functions.slice(0, 2).map((name) => (
                          <span
                            key={name}
                            className="rounded bg-primary/10 px-2 py-1 text-[10px] text-primary"
                          >
                            {name}
                          </span>
                        ))}
                        {functions.length > 2 ? (
                          <span className="text-[10px] text-muted-foreground">
                            +{functions.length - 2}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded px-2 py-1 text-[10px] font-semibold ${type === "Worked Well" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"}`}
                      >
                        {type}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                            {initials(addedBy)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{addedBy}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDate(learning.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center align-middle">
                      <div className="inline-flex items-center justify-center gap-0.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 px-2.5 text-xs text-primary"
                          onClick={() => onEditLearning?.(learning)}
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          View
                        </Button>
                        {onDeleteLearning && <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="More learning actions"
                              className="h-7 w-6 text-muted-foreground"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem
                              onClick={() => onDeleteLearning?.(learning._id || learning.id)}
                              className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete Learning
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

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length} learnings
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </Button>
            <Button size="sm" className="h-7 w-7 p-0 text-xs">
              {currentPage}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs"
              disabled={currentPage === totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}


