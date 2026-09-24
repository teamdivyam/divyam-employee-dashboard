import AllocationDeleteAction from "./AllocationDeleteAction";
import React, { useState, useMemo, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import CreateEventAllocationPage from "./CreateEventAllocationPage";
import {
  Card,
  CardContent,
} from "@components/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/components/ui/table";
import { Input } from "@components/components/ui/input";
import { Button } from "@components/components/ui/button";
import { Badge } from "@components/components/ui/badge";
import { Label } from "@components/components/ui/label";
import { Textarea } from "@components/components/ui/textarea";
import { Checkbox } from "@components/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@components/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@components/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/components/ui/tooltip";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import {
  Search,
  Calendar,
  User,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
  Plus,
  Loader2,
  Boxes,
  Package,
  MapPin,
  CheckCircle2,
  BarChart3,
  Pencil,
  MoreHorizontal,
  ShieldCheck,
  Truck,
  X,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import AdminService from "../../../../../services/event-booking-workspace.service";
import AdminV2Service from "@/services/employee-v2.service";

// ─── Booking Code — mirrors the project-wide established convention ───────────
// Same fallback logic as eventBookingDashboard.utils.js > bookingCode()
const deriveBookingCode = (booking) => {
  if (booking.eventCode) return booking.eventCode;
  const year = new Date(
    booking.eventDate || booking.createdAt || Date.now()
  ).getFullYear();
  return `BK-${year}-${String(booking._id || "").slice(-4).toUpperCase() || "----"}`;
};

// ─── Format event date safely ─────────────────────────────────────────────────
const formatEventDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd MMM yyyy");
  } catch {
    return "—";
  }
};

// ─── Extract events array safely from varying backend shapes ──────────────────
const extractEvents = (data) => {
  if (!data) return [];
  if (Array.isArray(data.events)) return data.events;
  if (Array.isArray(data.data?.events)) return data.data.events;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
};

// ─── Extract total rows safely from backend response ──────────────────────────
const extractTotalRows = (data) => {
  if (!data) return 0;
  if (typeof data.totalEvents === "number") return data.totalEvents;
  if (typeof data.total === "number") return data.total;
  if (typeof data.data?.totalEvents === "number") return data.data.totalEvents;
  if (typeof data.data?.total === "number") return data.data.total;
  if (typeof data.pagination?.total === "number") return data.pagination.total;
  if (Array.isArray(data.events)) return data.events.length;
  if (Array.isArray(data.data)) return data.data.length;
  if (Array.isArray(data)) return data.length;
  return 0;
};

// ─── Extract total pages safely from backend response ─────────────────────────
const extractTotalPages = (data) => {
  if (!data) return 1;
  if (typeof data.totalPages === "number") return Math.max(1, data.totalPages);
  if (typeof data.data?.totalPages === "number")
    return Math.max(1, data.data.totalPages);
  if (typeof data.pagination?.totalPages === "number")
    return Math.max(1, data.pagination.totalPages);
  return 1;
};

// Read every allocation page so cancelled-only detection cannot hide an older active allocation.
const fetchAllocationHistory = async () => {
  let response = await AdminV2Service.listInventoryV2Allocations({ limit: 100 });
  const entries = [...(response.data?.data?.entries || [])];
  let page = 1;
  let pagination = response.data?.data?.pagination;
  while (pagination?.hasNextPage) {
    const next = await AdminV2Service.listInventoryV2Allocations({ limit: 100, page: ++page });
    entries.push(...(next.data?.data?.entries || []));
    pagination = next.data?.data?.pagination;
  }
  return { ...response, data: { ...response.data, data: { ...response.data.data, entries } } };
};

// ─── Normalizer: Real Booked Event → Allocation Row Model ─────────────────────
const normalizeEvent = (booking, matchingAllocation = null) => {
  const hasAllocation = Boolean(matchingAllocation);

  let progressText = "No allocation yet";
  let progressPercent = 0;
  let shortageText = "—";
  let shortageCount = 0;
  let plannedIssueDate = "—";
  let allocationStatus = "No Allocation";
  let allocationId = null;
  let allocationCode = null;

  if (hasAllocation) {
    allocationId = matchingAllocation._id ? String(matchingAllocation._id) : null;
    allocationCode = matchingAllocation.allocationCode || null;
    allocationStatus = matchingAllocation.status || "Draft";

    if (matchingAllocation.plannedIssueDate) {
      plannedIssueDate = formatEventDate(matchingAllocation.plannedIssueDate);
    }

    const summary = matchingAllocation.summary;
    if (summary) {
      progressPercent = summary.allocationProgress ?? 0;
      progressText = `${summary.readyLines ?? 0}/${summary.requirementLines ?? 0} lines ready`;
      shortageCount = summary.shortageLines ?? 0;
      shortageText = shortageCount > 0 ? `${shortageCount} items` : "None";
    } else if (Array.isArray(matchingAllocation.items) && matchingAllocation.items.length > 0) {
      const totalItems = matchingAllocation.items.length;
      progressText = `${totalItems} item${totalItems === 1 ? "" : "s"} allocated`;
      progressPercent = 100;
      shortageText = "None";
    }
  }

  return {
    id: String(booking._id),
    rawBooking: booking,
    allocationId,
    allocationCode,
    eventName: booking.eventName || booking.eventType || "Unnamed Event",
    familyName: booking.customer?.name || "—",
    bookingId: deriveBookingCode(booking),
    eventVenue: booking.venue || "—",
    eventCity: booking.city || "",
    eventDate: formatEventDate(booking.eventDate),
    bookingStatus: booking.bookingStatus,
    progressText,
    progressPercent,
    shortageText,
    shortageCount,
    plannedIssueDate,
    allocationStatus,
    actionLabel: "View",
  };
};

// ─── Data fetching ────────────────────────────────────────────────────────────
// Fetch active booked events from the Events & Bookings module.
// We do not restrict exclusively to "Confirmed" so that all active events in planning
// or proposal stages requiring inventory allocation are returned.
const fetchBookedEvents = async ({ page, limit, search }) => {
  const response = await AdminService.getEventBookings({
    page,
    limit,
    search: search ? search.trim() : undefined,
  });
  return response.data;
};


// ─── Allocation Detail Route ──────────────────────────────────────────────────
// Rendered after a successful Create Allocation, showing the newly-created
// allocation fetched by its real _id from the backend.
const ALLOCATION_SOURCE_LOCATIONS = ["main_store", "central_store", "admin_office", "warehouse_a", "warehouse_b"];
const allocationLabel = (value) => value
  ? value.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
  : "—";
const allocationReferenceId = (value) => String(value?._id || value || "");
const allocationReadiness = (line) => {
  if (typeof line.netShortage !== "number" || typeof line.willReserve !== "number") return null;
  if (line.netShortage === 0) return "Ready";
  return line.willReserve > 0 ? "Partially Ready" : "Shortage";
};
const allocationPrepareIssueError = (allocation) => {
  if (!allocation || allocation.status !== "Draft") return "Only a Draft allocation can be prepared.";
  const lines = allocation.items;
  if (!Array.isArray(lines) || !lines.length) return "Add requirement lines before preparing the issue.";
  const blocked = lines.filter(line => line.status !== "Draft"
    || !Number.isSafeInteger(line.requiredQuantity) || line.requiredQuantity < 1
    || line.canFulfill !== true || allocationReadiness(line) !== "Ready"
    || line.willReserve !== line.requiredQuantity);
  if (blocked.length) return `Prepare Issue cannot proceed: ${blocked.length} of ${lines.length} requirement lines are not ready. Resolve all shortages or partially ready items and ensure every line is Draft and Ready before preparing the issue.`;
  if (!allocation.updatedAt || !Number.isFinite(new Date(allocation.updatedAt).getTime())) return "Refresh the allocation before preparing the issue.";
  return null;
};
const ALLOCATION_TONES = {
  neutral: "border-border bg-muted text-muted-foreground",
  blue: "border-blue-200/70 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-300",
  green: "border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  amber: "border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300",
  red: "border-rose-200/70 bg-rose-50 text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-300",
};
const allocationStatusTone = (status) => ({
  Ready: "green", Confirmed: "green", Returned: "green",
  "Partially Ready": "amber", Dispatched: "amber",
  Shortage: "red", Cancelled: "red", Reserved: "blue", Planning: "blue",
}[status] || "neutral");

// ─── Per-category badge colors (consistent hash, never random) ────────────────
const CATEGORY_PALETTE = [
  "border-purple-200/70 bg-purple-50 text-purple-700 dark:border-purple-800/50 dark:bg-purple-950/40 dark:text-purple-300",
  "border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  "border-sky-200/70 bg-sky-50 text-sky-700 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-300",
  "border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300",
  "border-indigo-200/70 bg-indigo-50 text-indigo-700 dark:border-indigo-800/50 dark:bg-indigo-950/40 dark:text-indigo-300",
  "border-teal-200/70 bg-teal-50 text-teal-700 dark:border-teal-800/50 dark:bg-teal-950/40 dark:text-teal-300",
  "border-orange-200/70 bg-orange-50 text-orange-700 dark:border-orange-800/50 dark:bg-orange-950/40 dark:text-orange-300",
  "border-pink-200/70 bg-pink-50 text-pink-700 dark:border-pink-800/50 dark:bg-pink-950/40 dark:text-pink-300",
];
const categoryBadgeColor = (category) => {
  if (!category) return CATEGORY_PALETTE[0];
  let h = 0;
  for (let i = 0; i < category.length; i++) { h = (h << 5) - h + category.charCodeAt(i); h |= 0; }
  return CATEGORY_PALETTE[Math.abs(h) % CATEGORY_PALETTE.length];
};
const stockColorClass = (available, required) => {
  if (available == null) return "";
  if (available <= 0) return "text-rose-600 dark:text-rose-400";
  if (available >= required) return "text-emerald-600 dark:text-emerald-400";
  return "text-amber-600 dark:text-amber-400";
};

// Only send editable line fields; preserve workflow status and notes on every existing line.
const allocationRequirementPayload = (items, editor) => {
  const quantity = Number(editor.requiredQuantity);
  if (!editor.item || !ALLOCATION_SOURCE_LOCATIONS.includes(editor.sourceLocation)
    || !Number.isSafeInteger(quantity) || quantity < 1) {
    throw new Error("Choose an item, a source location and a positive whole quantity.");
  }
  if ((editor.notes || "").trim().length > 300) throw new Error("Line notes must be 300 characters or fewer.");
  if (editor.lineId && !items.some((line) => line._id === editor.lineId)) {
    throw new Error("This requirement has changed. Refresh the allocation and reopen it.");
  }
  const lines = items.map((line) => ({
    item: allocationReferenceId(line.item),
    sourceLocation: line.sourceLocation,
    requiredQuantity: line._id === editor.lineId ? quantity : line.requiredQuantity,
    status: line.status,
    notes: line._id === editor.lineId ? editor.notes.trim() || null : line.notes || null,
    ...(line._id === editor.lineId ? { sourceLocation: editor.sourceLocation } : {}),
  }));
  if (!editor.lineId) lines.push({
    item: editor.item, sourceLocation: editor.sourceLocation,
    requiredQuantity: quantity, status: "Draft", notes: editor.notes.trim() || null,
  });
  return { items: lines };
};

// Apply the existing per-line validation/serialization to each selection, then save once.
const allocationSelectedRequirementsPayload = (items, selections) => {
  if (!selections.length) throw new Error("Choose at least one inventory item.");
  return selections.reduce((payload, selection) => allocationRequirementPayload(payload.items, selection), { items });
};

const renderStatus = (status) => (
  <Badge variant="outline" className={`gap-1.5 whitespace-nowrap rounded-full text-[11px] font-medium ${ALLOCATION_TONES[allocationStatusTone(status)]}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
    {status || "—"}
  </Badge>
);
const renderImage = (image, name) => (
  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/80 bg-muted/30">
    {image ? <img key={image} src={image} alt={name || "Inventory item"} className="h-full w-full object-cover" onError={(event) => {
      event.target.style.display = "none";
      event.target.nextElementSibling?.classList.remove("hidden");
    }} /> : null}
    <Package className={`h-6 w-6 text-muted-foreground ${image ? "hidden" : ""}`} aria-hidden="true" />
  </div>
);


export function AllocationRequirementWorkspace({
  allocation, booking, onCancel, onSubmit, onActiveChange,
  initialSelections = [], isPending = false, error = "", showLineNotes = true, defaultSourceLocation = "",
}) {
  const [requirementCategory, setRequirementCategory] = useState(null);
  const [selectedRequirements, setSelectedRequirements] = useState(() => initialSelections);
  const requirementSummaryRef = React.useRef(null);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogPage, setCatalogPage] = useState(1);
  const [validationError, setValidationError] = useState("");
  const debouncedCatalogSearch = useDebouncedValue(catalogSearch, 300);
  const eventImage = booking?.coverImage?.small || booking?.coverImage?.medium || booking?.coverImage?.original;
  React.useEffect(() => {
    onActiveChange?.(true);
    return () => onActiveChange?.(false);
  }, [onActiveChange]);
  const catalogQuery = useQuery({
    queryKey: ["allocation-requirement-catalog", booking?._id, catalogPage, debouncedCatalogSearch],
    queryFn: async () => {
      const response = await AdminService.getCompanyInventoryItems({
        eventId: String(booking?._id || allocation?.event?._id || allocation?.event || ""),
        page: catalogPage, limit: 10, search: debouncedCatalogSearch.trim() || undefined, status: "active",
      });
      return response.data?.data;
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
  const catalogItems = Array.isArray(catalogQuery.data?.items) ? catalogQuery.data.items : [];

  const categoryGroups = [...catalogItems.reduce((groups, item) => {
    const category = item.category || "";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(item);
    return groups;
  }, new Map())];
  const activeCategory = categoryGroups.some(([category]) => category === requirementCategory)
    ? requirementCategory : null;
  const displayedGroups = categoryGroups.filter(([category]) => activeCategory === null || category === activeCategory);
  const selectedItemIds = new Set(selectedRequirements.map(selection => selection.item));
  const stockTone = (status) => ALLOCATION_TONES[({ "In Stock": "green", "Low Stock": "amber", "Out of Stock": "red" })[status] || "neutral"];
  const selectRequirementItems = (entries, checked) => {
    const entryIds = new Set(entries.map(item => item._id));
    setSelectedRequirements(current => {
      if (!checked) return current.filter(selection => !entryIds.has(selection.item));
      const existingIds = new Set(current.map(selection => selection.item));
      return [...current, ...entries.filter(item => !existingIds.has(item._id)).map(item => ({
        item: item._id, itemName: item.name, lineId: null,
        sourceLocation: item.defaultLocation || defaultSourceLocation,
        requiredQuantity: 1, notes: "",
        // Display metadata stays with the selection across catalog searches/pages.
        preview: item,
      }))];
    });
  };
  const updateSelectedRequirement = (itemId, change) => setSelectedRequirements(current => current.map(selection => selection.item === itemId ? { ...selection, ...change } : selection));
  const removeSelectedRequirement = (itemId) => setSelectedRequirements(current => current.filter(selection => selection.item !== itemId));

  return (
    <section aria-label="Add Requirement" className="min-w-0 space-y-4 text-foreground">
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={onCancel} className="h-8 gap-1.5 px-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Allocation
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Close Add Requirement" disabled={isPending} onClick={onCancel} className="h-8 w-8 text-muted-foreground"><X className="h-4 w-4" /></Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary"><Boxes className="h-6 w-6" /></div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Add Requirement</h1>
          <p className="mt-1 text-xs text-muted-foreground">Select items by category and define the quantity and source location for each requirement.</p>
        </div>
      </div>

      <Card className="border-border/80 bg-card shadow-none">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-4 p-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/20 bg-primary/5 text-primary">
              {eventImage ? <img src={eventImage} alt={allocation?.eventName || "Event"} className="h-full w-full object-cover" onError={event => { event.target.style.display = "none"; event.target.nextElementSibling?.classList.remove("hidden"); }} /> : null}
              <Calendar className={`h-6 w-6 ${eventImage ? "hidden" : ""}`} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold">{allocation?.eventName || "—"}</p>
              <p className="mt-1 text-xs font-medium text-primary">{allocation?.allocationCode || "—"}</p>
              {allocation?.eventCode && <p className="mt-1 text-[11px] text-muted-foreground">{allocation.eventCode}</p>}
            </div>
          </div>
          <dl className="grid w-full grid-cols-2 gap-x-6 gap-y-3 text-xs sm:w-auto sm:flex-1 xl:grid-cols-3">
            {booking?.customer?.name && <div><dt className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground"><User className="h-3.5 w-3.5" />Customer</dt><dd className="break-words font-medium">{booking.customer.name}</dd></div>}
            {allocation?.eventDate && <div><dt className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Calendar className="h-3.5 w-3.5" />Event Date</dt><dd className="font-medium">{formatEventDate(allocation.eventDate)}</dd></div>}
            {(allocation?.venue || allocation?.city) && <div><dt className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground"><MapPin className="h-3.5 w-3.5" />Venue / City</dt><dd className="break-words font-medium">{[allocation.venue, allocation.city].filter(Boolean).join(", ")}</dd></div>}
          </dl>
          <div><p className="mb-1 text-[11px] text-muted-foreground">Allocation Status</p>{renderStatus(allocation?.status)}</div>
        </CardContent>
      </Card>

      <form onSubmit={event => {
          event.preventDefault();
          if (isPending) return;
          try {
            allocationSelectedRequirementsPayload([], selectedRequirements);
            setValidationError("");
            onSubmit(selectedRequirements);
          } catch (failure) {
            setValidationError(failure.message);
          }
        }} className="space-y-4">
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 2xl:grid-cols-12">
          <nav aria-label="Inventory categories" className="min-w-0 lg:col-span-3 2xl:col-span-2">
            <Card className="overflow-hidden border-border/80 bg-card shadow-none">
              <div className="border-b border-border/70 px-4 py-3">
                <h2 className="text-sm font-semibold">Categories</h2>
                <p className="mt-1 text-[11px] text-muted-foreground">Items on this catalog page</p>
              </div>
              <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-1">
                <button type="button" aria-pressed={activeCategory === null} onClick={() => setRequirementCategory(null)} className={`flex items-center justify-between gap-2 rounded-md border p-3 text-left text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeCategory === null ? "border-primary/30 bg-primary/10 text-primary" : "border-transparent hover:bg-muted/50"}`}>
                  <span className="flex items-center gap-2"><Boxes className="h-4 w-4 shrink-0" />All Categories</span>
                  <span className="tabular-nums">{catalogQuery.isFetching || catalogQuery.isError ? "—" : catalogItems.length}</span>
                </button>
                {!catalogQuery.isFetching && !catalogQuery.isError && categoryGroups.map(([category, entries]) => (
                  <button key={category} type="button" aria-pressed={activeCategory === category} onClick={() => setRequirementCategory(category)} className={`flex items-center gap-2.5 rounded-md border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeCategory === category ? "border-primary/30 bg-primary/10 text-primary" : "border-transparent hover:bg-muted/50"}`}>
                    <Package className="h-4 w-4 shrink-0" />
                    <span className="min-w-0"><span className="block break-words text-xs font-medium">{allocationLabel(category)}</span><span className="mt-1 block text-[11px] text-muted-foreground">{entries.length} {entries.length === 1 ? "item" : "items"}{entries.some(item => selectedItemIds.has(item._id)) ? ` · ${entries.filter(item => selectedItemIds.has(item._id)).length} selected` : ""}</span></span>
                  </button>
                ))}
              </div>
            </Card>
          </nav>

          <div className="min-w-0 space-y-3 lg:col-span-2 2xl:col-span-7">
            <Card className="border-border/80 bg-card shadow-none">
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">Choose Inventory Items</h2><span className="text-[11px] text-muted-foreground">Select across categories</span></div>
                <div className="relative">
                  <Label htmlFor="requirement-catalog-search" className="sr-only">Search inventory by name</Label>
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input id="requirement-catalog-search" autoFocus placeholder="Search inventory by name..." value={catalogSearch} onChange={e => { setCatalogSearch(e.target.value); setCatalogPage(1); }} className="h-9 pl-9 text-xs" />
                </div>
                {selectedRequirements.length > 0 && <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-0 text-xs text-primary lg:hidden" onClick={() => { requirementSummaryRef.current?.scrollIntoView({ block: "start" }); requirementSummaryRef.current?.focus({ preventScroll: true }); }}>{selectedRequirements.length} selected · Review requirements<ChevronRight className="h-3.5 w-3.5" /></Button>}
              </CardContent>
            </Card>

            {catalogQuery.isFetching ? (
              <Card className="border-border/80 shadow-none"><CardContent role="status" className="flex items-center justify-center gap-2 py-12 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading inventory…</CardContent></Card>
            ) : catalogQuery.isError ? (
              <Card className="border-border/80 shadow-none"><CardContent role="alert" className="space-y-3 py-10 text-center"><AlertTriangle className="mx-auto h-6 w-6 text-destructive" /><p className="text-sm font-medium">Unable to load inventory.</p><Button type="button" variant="outline" size="sm" onClick={() => catalogQuery.refetch()}>Try again</Button></CardContent></Card>
            ) : catalogItems.length === 0 ? (
              <Card className="border-border/80 shadow-none"><CardContent className="space-y-2 py-12 text-center"><Package className="mx-auto h-7 w-7 text-muted-foreground" /><p className="text-sm font-medium">No active inventory items found.</p><p className="text-xs text-muted-foreground">{catalogSearch ? "Try another item name. Your selected requirements are kept." : "Active inventory items will appear here."}</p></CardContent></Card>
            ) : displayedGroups.map(([category, entries]) => (
              <Card key={category} className="overflow-hidden border-border/80 bg-card shadow-none">
                <section aria-label={`${allocationLabel(category)} inventory`}>
                  <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-muted/30 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${categoryBadgeColor(category)}`}><Package className="h-4 w-4" /></div>
                      <h3 className="break-words text-sm font-semibold">{allocationLabel(category)}</h3>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Checkbox id={`requirement-category-${category}`} aria-label={`Select shown ${allocationLabel(category)} items`} checked={entries.every(item => selectedItemIds.has(item._id)) ? true : entries.some(item => selectedItemIds.has(item._id)) ? "indeterminate" : false} onCheckedChange={value => selectRequirementItems(entries, value === true)} />
                      <Label htmlFor={`requirement-category-${category}`} className="cursor-pointer text-[11px] font-medium">Select shown ({entries.length})</Label>
                    </div>
                  </div>
                  <div className="hidden grid-cols-[minmax(0,1fr)_72px_128px] gap-3 border-b border-border/70 bg-muted/20 py-2 pl-10 pr-3 text-[11px] text-muted-foreground sm:grid"><span>Item</span><span className="text-right">Current Stock</span><span>Default Location</span></div>
                  <div className="divide-y divide-border/70">
                    {entries.map(item => {
                      const checked = selectedItemIds.has(item._id);
                      return (
                        <div key={item._id} className={`flex items-start gap-3 border-l-2 p-3 sm:items-center ${checked ? "border-l-primary bg-primary/5" : "border-l-transparent hover:bg-muted/30"}`}>
                          <Checkbox id={`requirement-item-${item._id}`} checked={checked} onCheckedChange={value => selectRequirementItems([item], value === true)} className="mt-5 sm:mt-0" />
                          <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_72px_128px] sm:items-center">
                            <div className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
                              {renderImage(item.image, item.name)}
                              <div className="min-w-0">
                                <Label htmlFor={`requirement-item-${item._id}`} className="cursor-pointer break-words text-xs font-semibold">{item.name || "—"}</Label>
                                <p className="mt-1 text-[11px] text-muted-foreground">{[item.itemId, item.unit].filter(Boolean).join(" · ") || "—"}</p>
                                {checked && <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary"><CheckCircle2 className="h-3 w-3" />Selected</span>}
                              </div>
                            </div>
                            <div className="sm:text-right"><p className="text-[10px] text-muted-foreground sm:sr-only">Current Stock</p><p className={`mt-1 text-sm font-semibold tabular-nums sm:mt-0 ${item.stockStatus === "In Stock" ? "text-emerald-600 dark:text-emerald-400" : item.stockStatus === "Low Stock" ? "text-amber-600 dark:text-amber-400" : item.stockStatus === "Out of Stock" ? "text-rose-600 dark:text-rose-400" : ""}`}>{item.currentQuantity ?? "—"}</p></div>
                            <div><p className="text-[10px] text-muted-foreground sm:sr-only">Default Location</p><p className="mt-1 flex items-center gap-1 text-[11px] sm:mt-0"><MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />{allocationLabel(item.defaultLocation)}</p></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </Card>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
              <span>{catalogQuery.data?.pagination?.total ?? "—"} active items</span>
              <div className="flex items-center gap-2">
                <Button type="button" aria-label="Previous inventory page" variant="outline" size="icon" className="h-8 w-8" disabled={catalogPage <= 1 || catalogQuery.isFetching} onClick={() => setCatalogPage(page => page - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                <span>Page {catalogPage}</span>
                <Button type="button" aria-label="Next inventory page" variant="outline" size="icon" className="h-8 w-8" disabled={!catalogQuery.data?.pagination?.hasNextPage || catalogQuery.isFetching} onClick={() => setCatalogPage(page => page + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </div>

          <aside ref={requirementSummaryRef} tabIndex={-1} aria-label="Selected requirements" className="min-w-0 scroll-mt-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:sticky lg:top-4 lg:col-span-1 2xl:col-span-3">
            <Card className="overflow-hidden border-border/80 bg-card shadow-none">
              <div className="flex items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-4 py-3">
                <h2 className="text-sm font-semibold">Selected Requirements</h2>
                <Badge variant="outline" className={`shrink-0 text-[10px] ${selectedRequirements.length ? ALLOCATION_TONES.green : ALLOCATION_TONES.neutral}`}>{selectedRequirements.length} selected</Badge>
              </div>
              <div className="divide-y divide-border/70 lg:max-h-[calc(100vh-22rem)] lg:overflow-y-auto">
                {selectedRequirements.length ? selectedRequirements.map(selection => (
                  <article key={selection.item} aria-label={`${selection.preview.itemId || selection.itemName} requirement`} className="space-y-3 p-4">
                    <div className="flex items-start gap-2.5">
                      {renderImage(selection.preview.image, selection.itemName)}
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-xs font-semibold">{selection.itemName}</h3>
                        <p className="mt-1 text-[11px] text-muted-foreground">{[selection.preview.itemId, selection.preview.unit].filter(Boolean).join(" · ")}</p>
                        {selection.preview.category && <p className="mt-1 text-[11px] text-muted-foreground">{allocationLabel(selection.preview.category)}</p>}
                      </div>
                      <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${selection.preview.itemId || selection.itemName}`} className="h-7 w-7 shrink-0 text-muted-foreground" onClick={() => removeSelectedRequirement(selection.item)}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="text-muted-foreground">Current stock: <span className="font-semibold text-foreground">{selection.preview.currentQuantity ?? "—"}</span></span>
                      {selection.preview.stockStatus && <Badge variant="outline" className={`text-[10px] font-medium ${stockTone(selection.preview.stockStatus)}`}>{selection.preview.stockStatus}</Badge>}
                    </div>
                    <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-3">
                      <div className="space-y-1.5"><Label htmlFor={`requirement-quantity-${selection.item}`} className="text-[11px]">Required Qty</Label><Input id={`requirement-quantity-${selection.item}`} type="number" min={1} step={1} required value={selection.requiredQuantity} onChange={e => updateSelectedRequirement(selection.item, { requiredQuantity: e.target.value })} className="h-9 text-xs tabular-nums" /></div>
                      <div className="min-w-0 space-y-1.5"><Label htmlFor={`requirement-source-${selection.item}`} className="text-[11px]">Source Location</Label><Select value={selection.sourceLocation} onValueChange={value => updateSelectedRequirement(selection.item, { sourceLocation: value })}><SelectTrigger id={`requirement-source-${selection.item}`} className="h-9 text-xs"><SelectValue placeholder="Select location" /></SelectTrigger><SelectContent>{ALLOCATION_SOURCE_LOCATIONS.map(value => <SelectItem key={value} value={value}>{allocationLabel(value)}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    {showLineNotes && <details className="text-[11px]">
                      <summary className="cursor-pointer rounded-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Line Notes (optional)</summary>
                      <Label htmlFor={`requirement-notes-${selection.item}`} className="sr-only">Notes for {selection.itemName}</Label>
                      <Textarea id={`requirement-notes-${selection.item}`} maxLength={300} value={selection.notes} onChange={e => updateSelectedRequirement(selection.item, { notes: e.target.value })} placeholder="Add handling or setup instructions..." className="mt-2 min-h-20 text-xs" />
                    </details>}
                  </article>
                )) : (
                  <div className="space-y-2 px-4 py-10 text-center"><Package className="mx-auto h-8 w-8 text-muted-foreground" /><p className="text-xs font-medium">No items selected</p><p className="text-[11px] text-muted-foreground">Tick inventory items to set their quantities and source locations here.</p></div>
                )}
              </div>
            </Card>
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-primary/15 bg-primary/5 p-3 text-[11px] text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Requirements are for planning. Adding an item does not reserve or issue physical stock.</p>
          </aside>
        </div>

        {(error || validationError) && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">{error || validationError}</p>}
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-card p-4">
          <Button type="button" variant="outline" disabled={isPending} onClick={onCancel} className="h-9 text-xs">Cancel</Button>
          <div className="flex items-center gap-3"><span className="hidden text-xs text-muted-foreground sm:inline">{selectedRequirements.length} {selectedRequirements.length === 1 ? "item" : "items"} selected</span><Button type="submit" disabled={isPending || !selectedRequirements.length || selectedRequirements.some(selection => !selection.item || !selection.sourceLocation)} className="h-9 gap-1.5 text-xs">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{isPending ? "Saving…" : selectedRequirements.length ? `Add ${selectedRequirements.length} Selected ${selectedRequirements.length === 1 ? "Item" : "Items"}` : "Add Requirements"}</Button></div>
        </div>
      </form>
    </section>
  );

}
AllocationRequirementWorkspace.propTypes = {
  allocation: PropTypes.object,
  booking: PropTypes.object,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onActiveChange: PropTypes.func,
  initialSelections: PropTypes.arrayOf(PropTypes.object),
  isPending: PropTypes.bool,
  error: PropTypes.string,
  showLineNotes: PropTypes.bool,
  defaultSourceLocation: PropTypes.string,
};

// The review route only reads on entry. Writes are confined to its final action.
function PrepareIssueReviewRoute({ allocationId, onBack, onRequirementWorkspaceChange }) {
  const queryClient = useQueryClient();
  const preparing = useRef(false);
  const savedAllocation = useRef(null);
  const [prepareError, setPrepareError] = useState("");
  const detail = useQuery({
    queryKey: ["inventoryv2-allocations", allocationId, "prepare-review"],
    queryFn: () => AdminV2Service.getInventoryV2AllocationById(allocationId),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
  // Keep the reviewed version stable while editing, even if another screen
  // invalidates this query. Final submission checks it against a fresh GET.
  const [allocation, setAllocation] = useState(null);
  useEffect(() => {
    if (detail.isFetchedAfterMount && !detail.isError) {
      setAllocation(current => current || detail.data?.data?.data || null);
    }
  }, [detail.isFetchedAfterMount, detail.isError, detail.data]);
  const booking = queryClient.getQueriesData({ queryKey: ["event-allocation-events"] })
    .flatMap(([, response]) => extractEvents(response))
    .find(entry => allocation?.event
      ? allocationReferenceId(entry._id) === allocationReferenceId(allocation.event)
      : allocation?.crmCustomerId && allocationReferenceId(entry.crmCustomerId) === allocationReferenceId(allocation.crmCustomerId));
  const prepareMutation = useMutation({
    mutationFn: async ({ lines, plannedIssueDate, allocationNote }) => {
      // Reuse the requirement editor's validation and serialize every line,
      // including distinct lines for the same item and their original notes.
      if (!lines.length) throw new Error("Choose at least one inventory item.");
      const items = lines.map(line => allocationRequirementPayload([], {
        item: line.itemId, sourceLocation: line.sourceLocation,
        requiredQuantity: line.requiredQty, notes: line.notes || "",
      }).items[0]);
      if (allocationNote.length > 500) throw new Error("Allocation note must be 500 characters or fewer.");
      const plannedDate = plannedIssueDate ? new Date(plannedIssueDate) : null;
      if (plannedDate && !Number.isFinite(plannedDate.getTime())) throw new Error("Enter a valid planned issue date.");
      const baseline = savedAllocation.current || allocation;
      let response = await AdminV2Service.getInventoryV2AllocationById(allocationId);
      let current = response.data?.data;
      if (!current || current.updatedAt !== baseline.updatedAt) {
        throw new Error("The allocation has changed. Go back and reopen Prepare Issue to review the latest requirements.");
      }
      if (current.status !== "Draft" || current.items.some(line => line.status !== "Draft")) {
        throw new Error("Only a Draft allocation with Draft requirements can be prepared.");
      }
      const payload = {};
      const originalItems = current.items.map(line => ({
        item: allocationReferenceId(line.item), sourceLocation: line.sourceLocation,
        requiredQuantity: line.requiredQuantity, status: line.status, notes: line.notes || null,
      }));
      if (JSON.stringify(items) !== JSON.stringify(originalItems)) payload.items = items;
      const originalDate = current.plannedIssueDate ? format(new Date(current.plannedIssueDate), "yyyy-MM-dd") : "";
      if (plannedIssueDate !== originalDate) payload.plannedIssueDate = plannedDate?.toISOString() || null;
      if (allocationNote !== (current.allocationNote || "")) payload.allocationNote = allocationNote.trim() || null;
      if (Object.keys(payload).length) {
        response = await AdminV2Service.updateInventoryV2Allocation(allocationId, payload);
        current = response.data?.data;
        // If preparation fails after a successful edit, retry against the saved
        // version instead of overwriting the form or repeating a stale update.
        savedAllocation.current = current;
        queryClient.setQueryData(["inventoryv2-allocations", allocationId], response);
      }
      const invalid = allocationPrepareIssueError(current);
      if (invalid) throw new Error(invalid);
      return AdminV2Service.prepareInventoryV2AllocationIssue(allocationId, { expectedUpdatedAt: current.updatedAt });
    },
    retry: false,
    onSuccess: async response => {
      queryClient.setQueryData(["inventoryv2-allocations", allocationId], response);
      await queryClient.invalidateQueries({ queryKey: ["inventoryv2-allocations"], predicate: query => query.queryKey[2] !== "prepare-review" });
      toast.success("Issue prepared. Allocation confirmed and requirement lines reserved.");
      onBack();
    },
    onError: failure => {
      const message = failure?.response?.data?.message || failure.message || "Unable to prepare the issue.";
      setPrepareError(message);
      toast.error(message);
      queryClient.invalidateQueries({ queryKey: ["inventoryv2-allocations"], predicate: query => query.queryKey[2] !== "prepare-review" });
    },
    onSettled: () => { preparing.current = false; },
  });
  const handlePrepare = form => {
    if (preparing.current || prepareMutation.isPending) return;
    preparing.current = true;
    setPrepareError("");
    prepareMutation.mutate(form);
  };
  if (detail.isPending || (!detail.isFetchedAfterMount && !detail.isError) || (!allocation && detail.data?.data?.data && !detail.isError)) {
    return <Card><CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" />Loading allocation…</CardContent></Card>;
  }
  if (detail.isError || !allocation || !Array.isArray(allocation.items) || allocation.status !== "Draft" || allocation.items.some(line => line.status !== "Draft")) {
    return <Card><CardContent className="space-y-3 py-12 text-center" role="alert">
      <p className="text-sm">{detail.error?.response?.data?.message || detail.error?.message || "Only a Draft allocation with Draft requirements can be reviewed for preparation."}</p>
      <Button variant="outline" size="sm" onClick={onBack}>Back to Allocation</Button>
      {detail.isError && <Button variant="outline" size="sm" onClick={() => detail.refetch()}>Try again</Button>}
    </CardContent></Card>;
  }
  const event = {
    ...booking,
    _id: allocationReferenceId(allocation.event || allocation.crmCustomerId),
    eventName: allocation.eventName, eventCode: allocation.eventCode,
    eventDate: allocation.eventDate, venue: allocation.venue, city: allocation.city,
  };
  return <CreateEventAllocationPage
    key={allocationId}
    initialEvent={event}
    reviewAllocation={allocation}
    RequirementWorkspace={AllocationRequirementWorkspace}
    onRequirementWorkspaceChange={onRequirementWorkspaceChange}
    onBack={onBack}
    onPrepare={handlePrepare}
    preparePending={prepareMutation.isPending}
    prepareError={prepareError}
  />;
}

PrepareIssueReviewRoute.propTypes = {
  allocationId: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
  onRequirementWorkspaceChange: PropTypes.func,
};

AllocationDetailRoute.propTypes = { allocationId: PropTypes.string.isRequired, onBack: PropTypes.func.isRequired, onPrepare: PropTypes.func.isRequired, onCancelled: PropTypes.func };

function AllocationDetailRoute({ allocationId, onBack, onPrepare, onCancelled }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: "", category: "all", status: "all", location: "all", readiness: "all" });
  const [itemPage, setItemPage] = useState(1);
  const [itemPageSize, setItemPageSize] = useState(10);
  const [viewedItemId, setViewedItemId] = useState(null);
  const [editor, setEditor] = useState(null);
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["inventoryv2-allocations", allocationId],
    queryFn: () => AdminV2Service.getInventoryV2AllocationById(allocationId),
    enabled: Boolean(allocationId),
    retry: 1,
  });

  const allocation = data?.data?.data || null;
  useEffect(() => {
    if (allocation?.status === "Cancelled") {
      if (onCancelled) onCancelled(allocation);
      else onBack();
    }
  }, [allocation, onCancelled, onBack]);
  const items = Array.isArray(allocation?.items) ? allocation.items.filter(line => line.status !== "Cancelled") : [];
  // The parent already observes these booking queries, including on a direct URL refresh.
  // Reading their data adds header context without another event request or changing the list.
  const booking = queryClient.getQueriesData({ queryKey: ["event-allocation-events"] })
    .flatMap(([, response]) => extractEvents(response))
    .find((entry) => allocation?.event
      ? allocationReferenceId(entry._id) === allocationReferenceId(allocation.event)
      : allocation?.crmCustomerId && allocationReferenceId(entry.crmCustomerId) === allocationReferenceId(allocation.crmCustomerId));
  const eventImage = booking?.coverImage?.small || booking?.coverImage?.medium || booking?.coverImage?.original;
  const summary = allocation?.summary;
  const filteredItems = items.filter((line) => {
    const query = filters.search.trim().toLowerCase();
    return (!query || [line.itemName, line.itemId].some((value) => value?.toLowerCase().includes(query)))
      && (filters.category === "all" || line.category === filters.category)
      && (filters.status === "all" || line.status === filters.status)
      && (filters.location === "all" || line.sourceLocation === filters.location)
      && (filters.readiness === "all" || allocationReadiness(line) === filters.readiness);
  });
  const totalItemPages = Math.max(1, Math.ceil(filteredItems.length / itemPageSize));
  const currentItemPage = Math.min(itemPage, totalItemPages);
  const visibleItems = filteredItems.slice((currentItemPage - 1) * itemPageSize, currentItemPage * itemPageSize);
  // Only load images for the visible page (plus an open item). Query keys deduplicate repeat lines.
  const itemIds = [...new Set([...visibleItems.map((line) => allocationReferenceId(line.item)), viewedItemId].filter(Boolean))];
  const itemQueries = useQueries({
    queries: itemIds.map((itemId) => ({
      queryKey: ["inventoryv2-allocation-item-image", itemId],
      queryFn: async () => {
        const response = await AdminV2Service.getInventoryV2ItemById(itemId);
        return response.data?.data?.item || null;
      },
      staleTime: 5 * 60 * 1000,
      retry: 1,
    })),
  });
  const itemRecords = new Map(itemIds.map((itemId, index) => [itemId, itemQueries[index]]));
  const viewedItemQuery = itemRecords.get(viewedItemId);
  const viewedItem = viewedItemQuery?.data;
  const canEdit = allocation && allocation.status !== "Cancelled";
  const canEditRequirements = canEdit && allocation.status === "Draft" && !items.some(line => line.status === "Reserved");
  const saveMutation = useMutation({
    mutationFn: async (selections) => {
      if (!editor || !canEdit) throw new Error("This allocation cannot be edited.");
      const response = await AdminV2Service.getInventoryV2AllocationById(allocationId);
      const current = response.data?.data;
      if (!current || current.updatedAt !== editor.updatedAt || current.status === "Cancelled") {
        throw new Error("The allocation has changed. Close this form, refresh and reopen it before saving.");
      }
      if (editor.mode !== "metadata" && (current.status !== "Draft" || current.items.some(line => line.status === "Reserved"))) {
        throw new Error("This allocation is committed. Only its date and note can be edited.");
      }
      let payload;
      if (editor.mode === "metadata") {
        payload = { plannedIssueDate: editor.plannedIssueDate ? new Date(editor.plannedIssueDate).toISOString() : null, allocationNote: editor.allocationNote.trim() || null };
      } else if (editor.mode === "add") {
        payload = allocationSelectedRequirementsPayload(current.items, selections);
      } else {
        payload = allocationRequirementPayload(current.items, editor);
      }
      return AdminV2Service.updateInventoryV2Allocation(allocationId, payload);
    },
    onSuccess: async () => {
      setEditor(null);
      toast.success("Allocation updated successfully");
      await queryClient.invalidateQueries({ queryKey: ["inventoryv2-allocations"] });
    },
    onError: (failure) => toast.error(failure?.response?.data?.message || failure.message || "Unable to update allocation"),
  });
  const openEditor = (mode, line = null) => {
    saveMutation.reset();
    setEditor({
      mode,
      lineId: line?._id || null,
      line: line || null,
      item: allocationReferenceId(line?.item),
      itemName: line?.itemName || "",
      sourceLocation: line?.sourceLocation || "",
      requiredQuantity: line?.requiredQuantity ?? 1,
      notes: line?.notes || "",
      plannedIssueDate: allocation?.plannedIssueDate?.slice(0, 10) || "",
      allocationNote: allocation?.allocationNote || "",
      updatedAt: allocation?.updatedAt,
    });
  };
  const setFilter = (field, value) => { setFilters((current) => ({ ...current, [field]: value })); setItemPage(1); };
  const resetFilters = () => { setFilters({ search: "", category: "all", status: "all", location: "all", readiness: "all" }); setItemPage(1); };
  const renderItemIdentity = (line) => (
    <div className="flex min-w-0 items-center gap-3">
      {renderImage(itemRecords.get(allocationReferenceId(line.item))?.data?.image, line.itemName)}
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-foreground">
          {line.itemName || "—"}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{[line.itemId, line.unit].filter(Boolean).join(" · ") || "—"}</p>
        {line.notes && <p className="mt-0.5 max-w-xs truncate text-[11px] text-muted-foreground/80">{line.notes}</p>}
      </div>
    </div>
  );
  const renderRowActions = (line) => (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="outline"
        size="sm"
        className="h-7 border-primary/20 bg-background px-3 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary"
        disabled={!canEditRequirements || line.status !== "Draft"}
        onClick={() => openEditor("edit", line)}
      >
        Edit Allocation
      </Button>
      <AllocationDeleteAction allocationId={allocationId} allocationLineId={String(line._id)} disabled={saveMutation.isPending} />
    </div>
  );

  const formatSummaryShortage = () => {
    if (summary?.shortageLines != null) return summary.shortageLines;
    return items.filter(l => (l.netShortage || 0) > 0).length;
  };

  const formatSummaryReady = () => {
    if (summary?.readyLines != null) return summary.readyLines;
    return items.filter(l => (l.netShortage || 0) === 0 && (l.requiredQuantity || 0) > 0).length;
  };

  const allocationOwner = allocation?.createdBy?.fullName || allocation?.createdBy?.email || "Ayush Gupta";
  const allocationOwnerRole = allocation?.createdBy?.role || "Operations Team";

  if (allocation?.status === "Cancelled") return null;

  if (editor?.mode === "add") {
    return <AllocationRequirementWorkspace
      allocation={allocation}
      booking={booking}
      onCancel={() => setEditor(null)}
      onSubmit={selections => saveMutation.mutate(selections)}
      isPending={saveMutation.isPending}
      error={saveMutation.error?.response?.data?.message || saveMutation.error?.message || ""}
    />;
  }

  return (
    <section aria-label="Allocation detail" className="min-w-0 space-y-4 text-foreground">
      {/* Top Navigation & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 gap-1.5 px-0 text-xs font-medium text-primary hover:bg-transparent hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Event Allocation
        </Button>
        {allocation && !isError && (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" className="h-8 gap-1.5 text-xs font-medium" disabled={!canEditRequirements} onClick={() => openEditor("add")}>
              <Plus className="h-3.5 w-3.5" /> Create Allocation
            </Button>
            <Button size="sm" className="h-8 gap-1.5 text-xs font-medium" disabled={allocation.status !== "Draft"} onClick={onPrepare}>
              <Truck className="h-3.5 w-3.5" />
              Prepare Issue
            </Button>
            <TooltipProvider>
              {[
                { label: "Reserve Stock", icon: ShieldCheck, explanation: "Use Prepare Issue to reserve all ready requirement lines together." },
              ].map(({ label, icon: Icon, explanation }) => (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} aria-label={`${label}: ${explanation}`}>
                      <Button variant="outline" size="sm" disabled className="h-8 gap-1.5 text-xs font-medium">
                        <Icon className="h-3.5 w-3.5" />{label}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">{explanation}</TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium">
                  <MoreHorizontal className="h-3.5 w-3.5" /> More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled={!canEdit} onSelect={() => openEditor("metadata")}>
                  <Pencil className="mr-2 h-3.5 w-3.5" /> Edit date &amp; note
                </DropdownMenuItem>
                <DropdownMenuItem disabled={isFetching} onSelect={() => refetch()}>
                  <RotateCcw className="mr-2 h-3.5 w-3.5" /> Refresh availability
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {isLoading ? (
        <Card className="border-border/80 shadow-none"><CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" />Loading allocation…</CardContent></Card>
      ) : isError ? (
        <Card className="border-border/80 shadow-none"><CardContent className="space-y-3 py-12 text-center" role="alert">
          <AlertTriangle className="mx-auto h-6 w-6 text-destructive" /><h1 className="text-base font-semibold">Failed to load allocation</h1>
          <p className="text-xs text-muted-foreground">{error?.response?.data?.message || error?.message || "Unable to load this allocation."}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 text-xs"><RotateCcw className="h-3.5 w-3.5" /> Try again</Button>
        </CardContent></Card>
      ) : !allocation ? (
        <Card className="border-border/80 shadow-none"><CardContent className="space-y-2 py-12 text-center"><Boxes className="mx-auto h-8 w-8 text-muted-foreground" /><h1 className="text-base font-semibold">Allocation not found</h1><p className="text-xs text-muted-foreground">Return to Event Allocation to select an existing record.</p></CardContent></Card>
      ) : (
        <>
          {/* Main Event Header Card */}
          <Card className="border-border/80 bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                {/* Event Cover & Basic Info */}
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/5 text-primary sm:h-22 sm:w-28">
                    {eventImage ? (
                      <img src={eventImage} alt={allocation.eventName || "Event"} className="h-full w-full object-cover" onError={(e) => { e.target.style.display = "none"; e.target.nextElementSibling?.classList.remove("hidden"); }} />
                    ) : null}
                    <Calendar className={`h-8 w-8 ${eventImage ? "hidden" : ""}`} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="truncate text-lg font-bold text-foreground sm:text-xl">
                        {allocation.eventName || "Allocation Details"}
                      </h1>
                      {booking?.bookingStatus ? (
                        <Badge variant="outline" className={`gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${ALLOCATION_TONES[allocationStatusTone(booking.bookingStatus)]}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                          Event {booking.bookingStatus}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      {(allocation.eventCode || booking?.eventCode) && (
                        <span className="font-semibold text-primary">{allocation.eventCode || booking.eventCode}</span>
                      )}
                      {(allocation.eventCode || booking?.eventCode) && booking?.customer?.name && (
                        <span className="text-muted-foreground/60">|</span>
                      )}
                      {booking?.customer?.name && (
                        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                          <User className="h-3.5 w-3.5 text-primary" /> {booking.customer.name}
                        </span>
                      )}
                    </div>
                    {booking?.eventType && (
                      <p className="text-xs text-muted-foreground">{booking.eventType}</p>
                    )}
                  </div>
                </div>

                {/* Event Details and Allocation Status */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border/60 pt-3 text-xs xl:border-t-0 xl:pt-0">
                  {allocation?.eventDate && (
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Event Date</p>
                        <p className="font-semibold text-foreground">{formatEventDate(allocation.eventDate)}</p>
                      </div>
                    </div>
                  )}

                  {(allocation?.venue || allocation?.city) && (
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Venue</p>
                        <p className="font-semibold text-foreground">{allocation.venue || "—"}</p>
                        {allocation.city && <p className="text-[10px] text-muted-foreground">{allocation.city}</p>}
                      </div>
                    </div>
                  )}

                  {allocation?.plannedIssueDate && (
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Planned Issue Date</p>
                        <p className="font-semibold text-foreground">{formatEventDate(allocation.plannedIssueDate)}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-1 text-[10px] text-muted-foreground">Allocation Status</p>
                    <Badge variant="outline" className={`gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${ALLOCATION_TONES[allocationStatusTone(allocation.status)]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                      {allocation.status === "Confirmed" ? "Reserved" : allocation.status || "—"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2.5 pl-2 border-l border-border/60">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {allocationOwner.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Allocation Owner</p>
                      <p className="font-semibold text-foreground leading-tight">{allocationOwner}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{allocationOwnerRole}</p>
                    </div>
                  </div>
                </div>
              </div>

              {allocation.allocationNote && (
                <div className="mt-3 border-t border-border/70 pt-2.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Allocation Note: </span>
                  {allocation.allocationNote}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4 Summary Cards matching Reference */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Requirement Lines */}
            <Card className="border-border/80 bg-card shadow-sm">
              <CardContent className="flex items-center gap-3.5 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-200/70 bg-blue-50 text-blue-600 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-400">
                  <Boxes className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Requirement Lines</p>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{items.length}</p>
                  <p className="text-[11px] text-muted-foreground">Total item types required</p>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Ready Lines */}
            <Card className="border-border/80 bg-card shadow-sm">
              <CardContent className="flex items-center gap-3.5 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-200/70 bg-emerald-50 text-emerald-600 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Ready Lines</p>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{formatSummaryReady()}</p>
                  <p className="text-[11px] text-muted-foreground">Fully reserved and ready</p>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Shortage Lines */}
            <Card className="border-border/80 bg-card shadow-sm">
              <CardContent className="flex items-center gap-3.5 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rose-200/70 bg-rose-50 text-rose-600 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-400">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Shortage Lines</p>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{formatSummaryShortage()}</p>
                  <p className="text-[11px] text-muted-foreground">Items with remaining shortage</p>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Allocation Progress */}
            <Card className="border-border/80 bg-card shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-purple-200/70 bg-purple-50 text-purple-600 dark:border-purple-800/50 dark:bg-purple-950/40 dark:text-purple-400">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Allocation Progress</p>
                      <p className="text-xl font-bold tracking-tight text-foreground">
                        {summary?.allocationProgress ?? (items.length ? Math.round((formatSummaryReady() / items.length) * 100) : 0)}%
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {formatSummaryReady()} / {items.length} Ready
                  </span>
                </div>
                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${summary?.allocationProgress ?? (items.length ? Math.round((formatSummaryReady() / items.length) * 100) : 0)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Allocation Items Table Container */}
          <Card className="min-w-0 overflow-hidden border-border/80 bg-card shadow-sm">
            {/* Filter / Search Bar */}
            <div className="flex flex-wrap items-center gap-2.5 border-b border-border/70 p-3">
              <div className="min-w-[200px] flex-1">
                <Label htmlFor="allocation-item-search" className="sr-only">Search item name or item ID</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="allocation-item-search"
                    value={filters.search}
                    onChange={(e) => setFilter("search", e.target.value)}
                    placeholder="Search item name or item ID..."
                    className="h-9 pl-9 text-xs"
                  />
                </div>
              </div>

              {[
                { field: "category", label: "All Categories", values: [...new Set(items.map(l => l.category).filter(Boolean))] },
                { field: "readiness", label: "All Allocation Status", values: ["Ready", "Partially Ready", "Shortage"] },
                { field: "location", label: "All Source Locations", values: [...new Set(items.map(l => l.sourceLocation).filter(Boolean))] },
              ].map(({ field, label, values }) => (
                <Select key={field} value={filters[field]} onValueChange={(value) => setFilter(field, value)}>
                  <SelectTrigger aria-label={label} className="h-9 w-auto min-w-[150px] flex-1 text-xs sm:flex-none">
                    <SelectValue placeholder={label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{label}</SelectItem>
                    {values.map(value => <SelectItem key={value} value={value}>{allocationLabel(value)}</SelectItem>)}
                  </SelectContent>
                </Select>
              ))}

              <Button variant="outline" size="sm" onClick={resetFilters} className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
            </div>

            {filteredItems.length === 0 ? (
              <div className="space-y-2 px-4 py-12 text-center">
                <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">{items.length ? "No matching requirements" : "No allocation items"}</p>
                <p className="text-xs text-muted-foreground">
                  {items.length ? "Adjust your search or filters to see requirement lines." : "Add a requirement to begin planning this allocation."}
                </p>
                {items.length > 0 && (
                  <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2 text-xs">
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table className="min-w-[1050px] text-xs">
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-border/70 hover:bg-transparent">
                        <TableHead className="w-56 px-4 text-xs font-semibold text-foreground">Item</TableHead>
                        <TableHead className="text-xs font-semibold text-foreground">Category</TableHead>
                        <TableHead className="text-xs font-semibold text-foreground">Source Location</TableHead>
                        <TableHead className="text-center text-xs font-semibold text-foreground">Required Qty</TableHead>
                        <TableHead className="text-center text-xs font-semibold text-foreground">Reserved Qty</TableHead>
                        <TableHead className="text-center text-xs font-semibold text-foreground">Available Stock</TableHead>
                        <TableHead className="text-center text-xs font-semibold text-foreground">Remaining / Shortage</TableHead>
                        <TableHead className="text-center text-xs font-semibold text-foreground">Allocation Status</TableHead>
                        <TableHead className="px-4 text-center text-xs font-semibold text-foreground">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleItems.map((line) => {
                        const readiness = allocationReadiness(line) || (line.netShortage > 0 ? "Shortage" : "Ready");
                        return (
                          <TableRow key={line._id} className="border-border/70 hover:bg-muted/30 transition-colors">
                            <TableCell className="px-4 py-3">{renderItemIdentity(line)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`whitespace-nowrap rounded-md px-2.5 py-0.5 text-[11px] font-medium ${categoryBadgeColor(line.category)}`}>
                                {allocationLabel(line.category)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                                <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/80" />
                                {allocationLabel(line.sourceLocation)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-semibold tabular-nums text-foreground">
                              {line.requiredQuantity ?? "—"}
                            </TableCell>
                            <TableCell className="text-center font-medium tabular-nums text-muted-foreground">
                              {line.willReserve ?? 0}
                            </TableCell>
                            <TableCell className={`text-center font-semibold tabular-nums ${stockColorClass(line.availableQuantity, line.requiredQuantity)}`}>
                              {line.availableQuantity ?? "—"}
                            </TableCell>
                            <TableCell className={`text-center font-semibold tabular-nums ${line.netShortage > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}>
                              {line.netShortage ?? 0}
                            </TableCell>
                            <TableCell className="text-center">
                              {line.status === "Reserved" && <div className="mb-1">{renderStatus(line.status)}</div>}
                              <Badge variant="outline" className={`inline-flex gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ALLOCATION_TONES[allocationStatusTone(readiness)]}`}>
                                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                                {readiness}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 text-center">
                              {renderRowActions(line)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile / Tablet Cards View */}
                <div className="divide-y divide-border/70 lg:hidden">
                  {visibleItems.map(line => {
                    const readiness = allocationReadiness(line) || (line.netShortage > 0 ? "Shortage" : "Ready");
                    return (
                      <article key={line._id} className="space-y-3 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {renderItemIdentity(line)}
                          {line.status === "Reserved" && renderStatus(line.status)}
                          <Badge variant="outline" className={`gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ALLOCATION_TONES[allocationStatusTone(readiness)]}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                            {readiness}
                          </Badge>
                        </div>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg bg-muted/20 p-3 text-xs sm:grid-cols-3">
                          <div>
                            <dt className="text-[10px] text-muted-foreground">Category</dt>
                            <dd className="mt-0.5">
                              <Badge variant="outline" className={`text-[10px] font-medium ${categoryBadgeColor(line.category)}`}>
                                {allocationLabel(line.category)}
                              </Badge>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[10px] text-muted-foreground">Source Location</dt>
                            <dd className="mt-0.5 font-medium text-foreground">{allocationLabel(line.sourceLocation)}</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] text-muted-foreground">Required Qty</dt>
                            <dd className="mt-0.5 font-bold tabular-nums text-foreground">{line.requiredQuantity ?? "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] text-muted-foreground">Reserved Qty</dt>
                            <dd className="mt-0.5 font-medium tabular-nums text-muted-foreground">{line.willReserve ?? 0}</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] text-muted-foreground">Available Stock</dt>
                            <dd className={`mt-0.5 font-bold tabular-nums ${stockColorClass(line.availableQuantity, line.requiredQuantity)}`}>
                              {line.availableQuantity ?? "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[10px] text-muted-foreground">Remaining / Shortage</dt>
                            <dd className={`mt-0.5 font-bold tabular-nums ${line.netShortage > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}>
                              {line.netShortage ?? 0}
                            </dd>
                          </div>
                        </dl>
                        {renderRowActions(line)}
                      </article>
                    );
                  })}
                </div>
              </>
            )}

            {/* Pagination / Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {filteredItems.length ? (currentItemPage - 1) * itemPageSize + 1 : 0} to {Math.min(currentItemPage * itemPageSize, filteredItems.length)} of {filteredItems.length} requirement lines
              </p>
              <div className="flex items-center gap-2">
                <Select value={String(itemPageSize)} onValueChange={value => { setItemPageSize(Number(value)); setItemPage(1); }}>
                  <SelectTrigger aria-label="Requirements per page" className="h-8 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50].map(value => <SelectItem key={value} value={String(value)}>{value} per page</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button aria-label="Previous requirements page" variant="outline" size="icon" className="h-8 w-8" disabled={currentItemPage <= 1} onClick={() => setItemPage(currentItemPage - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs font-medium text-foreground">{currentItemPage} / {totalItemPages}</span>
                <Button aria-label="Next requirements page" variant="outline" size="icon" className="h-8 w-8" disabled={currentItemPage >= totalItemPages} onClick={() => setItemPage(currentItemPage + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}

      <Dialog open={Boolean(viewedItemId)} onOpenChange={open => { if (!open) setViewedItemId(null); }}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto border-border text-foreground">
          <DialogHeader><DialogTitle className="text-base">Inventory Item</DialogTitle><DialogDescription>Current inventory information for this requirement.</DialogDescription></DialogHeader>
          {viewedItemQuery?.isPending ? <p role="status" className="py-6 text-center text-xs text-muted-foreground">Loading item…</p> : viewedItemQuery?.isError ? <div role="alert" className="space-y-2 text-xs"><p className="text-destructive">Unable to load this item.</p><Button variant="outline" size="sm" onClick={() => viewedItemQuery.refetch()}>Try again</Button></div> : viewedItem ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">{renderImage(viewedItem.image, viewedItem.name)}<div><p className="text-sm font-semibold">{viewedItem.name}</p><p className="mt-1 text-xs text-muted-foreground">{viewedItem.itemId}</p></div></div>
              <dl className="grid grid-cols-2 gap-4 text-xs">{[["Category", allocationLabel(viewedItem.category)], ["Default Location", allocationLabel(viewedItem.defaultLocation)], ["Unit", allocationLabel(viewedItem.unit)], ["Current Stock", viewedItem.currentQuantity], ["Minimum Stock", viewedItem.minimumStockLevel], ["Stock Status", viewedItem.stockStatus], ["Item Status", allocationLabel(viewedItem.status)], ["Tracking", allocationLabel(viewedItem.trackingMethod)]].map(([label,value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value ?? "—"}</dd></div>)}</dl>
              {viewedItem.description && <p className="text-xs text-muted-foreground">{viewedItem.description}</p>}
            </div>
          ) : <p className="text-xs text-muted-foreground">Item not found.</p>}
          <DialogFooter><Button variant="outline" size="sm" onClick={() => setViewedItemId(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Item Allocation Modal (Redesigned from Reference UI) ───────────── */}
      <Dialog open={Boolean(editor)} onOpenChange={open => { if (!open && !saveMutation.isPending) setEditor(null); }}>
        <DialogContent
          className="max-h-[92vh] max-w-3xl overflow-y-auto border-border text-foreground p-0 sm:rounded-2xl"
          onEscapeKeyDown={event => { if (saveMutation.isPending) event.preventDefault(); }}
          onPointerDownOutside={event => { if (saveMutation.isPending) event.preventDefault(); }}
        >
          {editor && (() => {
            const line = editor.line || {};
            const itemRecord = itemRecords.get(editor.item)?.data;
            const itemImage = itemRecord?.image || null;
            const itemName = line.itemName || itemRecord?.name || editor.itemName || "Item";
            const itemCode = line.itemId || itemRecord?.itemId || "—";
            const itemUnit = line.unit || itemRecord?.unit || "Piece";
            const itemCategory = line.category || itemRecord?.category || "";
            const currentRequired = line.requiredQuantity ?? 0;
            const currentReserved = line.willReserve ?? 0;
            const availableStock = line.availableQuantity ?? 0;
            const currentShortage = line.netShortage ?? 0;
            const currentReadiness = allocationReadiness(line) || (currentShortage > 0 ? "Shortage" : "Ready");

            // Live calculations for "After Update" preview based on input quantity
            const newRequired = Math.max(0, parseInt(editor.requiredQuantity, 10) || 0);
            const newReserved = Math.min(newRequired, availableStock);
            const newShortage = Math.max(0, newRequired - availableStock);
            const newReadiness = newShortage === 0 ? "Ready" : newReserved > 0 ? "Partially Ready" : "Shortage";

            return (
              <div className="flex flex-col">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-border/70 p-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                      <Boxes className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-foreground">
                        {editor.mode === "metadata" ? "Edit Allocation Details" : "Edit Item Allocation"}
                      </DialogTitle>
                      <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                        {editor.mode === "metadata"
                          ? "Update planned issue date and notes for this event allocation."
                          : "Update requirement and allocation for this event."}
                      </DialogDescription>
                    </div>
                  </div>
                </div>

                {editor.mode === "metadata" ? (
                  <form onSubmit={event => { event.preventDefault(); saveMutation.mutate(); }} className="space-y-4 p-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="allocation-planned-date" className="text-xs font-semibold">Planned Issue Date</Label>
                      <Input
                        id="allocation-planned-date"
                        type="date"
                        value={editor.plannedIssueDate}
                        onChange={e => setEditor(current => ({ ...current, plannedIssueDate: e.target.value }))}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="allocation-note" className="text-xs font-semibold">Allocation Note</Label>
                      <Textarea
                        id="allocation-note"
                        maxLength={500}
                        value={editor.allocationNote}
                        onChange={e => setEditor(current => ({ ...current, allocationNote: e.target.value }))}
                        placeholder="Add handling or dispatch instructions..."
                        className="min-h-24 text-xs"
                      />
                    </div>
                    {saveMutation.isError && (
                      <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                        {saveMutation.error?.response?.data?.message || saveMutation.error?.message}
                      </p>
                    )}
                    <div className="flex justify-end gap-2 pt-2 border-t border-border/70">
                      <Button type="button" variant="outline" size="sm" disabled={saveMutation.isPending} onClick={() => setEditor(null)} className="h-9 text-xs">
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" disabled={saveMutation.isPending} className="h-9 text-xs">
                        {saveMutation.isPending ? "Saving…" : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={event => { event.preventDefault(); saveMutation.mutate(); }} className="space-y-5 p-5">
                    {/* Item Identity Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-3.5">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-background shadow-xs">
                          {itemImage ? (
                            <img
                              src={itemImage}
                              alt={itemName}
                              className="h-full w-full object-cover"
                              onError={e => { e.target.style.display = "none"; e.target.nextElementSibling?.classList.remove("hidden"); }}
                            />
                          ) : null}
                          <Package className={`h-7 w-7 text-muted-foreground ${itemImage ? "hidden" : ""}`} aria-hidden="true" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <h2 className="truncate text-base font-bold text-foreground sm:text-lg">
                            {itemName}
                          </h2>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-primary">{itemCode}</span>
                            <span className="text-muted-foreground/60">•</span>
                            <span className="text-muted-foreground">{itemUnit}</span>
                          </div>
                          {itemCategory && (
                            <Badge variant="outline" className={`mt-0.5 text-[10px] font-medium ${categoryBadgeColor(itemCategory)}`}>
                              {allocationLabel(itemCategory)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge variant="outline" className={`gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${ALLOCATION_TONES[allocationStatusTone(currentReadiness)]}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                          {currentReadiness}
                        </Badge>
                        <p className="mt-1 text-[10px] text-muted-foreground">This item is allocated for this event.</p>
                      </div>
                    </div>

                    {/* Section 1: CURRENT POSITION (Live Data) */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                            1
                          </span>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Current Position (Live Data)
                          </h3>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          As of {formatEventDate(new Date())}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {/* KPI 1: Required */}
                        <div className="rounded-xl border border-blue-200/70 bg-blue-50/50 p-3 text-center dark:border-blue-900/40 dark:bg-blue-950/20">
                          <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <p className="text-[10px] font-medium text-muted-foreground">Required Quantity</p>
                          <p className="mt-0.5 text-xl font-bold tracking-tight text-foreground">{currentRequired}</p>
                          <p className="text-[10px] text-muted-foreground">{itemUnit}</p>
                        </div>

                        {/* KPI 2: Reserved */}
                        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-3 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
                          <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                          <p className="text-[10px] font-medium text-muted-foreground">Reserved Quantity</p>
                          <p className="mt-0.5 text-xl font-bold tracking-tight text-foreground">{currentReserved}</p>
                          <p className="text-[10px] text-muted-foreground">{itemUnit}</p>
                        </div>

                        {/* KPI 3: Available Stock */}
                        <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-3 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
                          <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                            <Boxes className="h-4 w-4" />
                          </div>
                          <p className="text-[10px] font-medium text-muted-foreground">
                            Available Stock <span className="text-[9px]">({allocationLabel(editor.sourceLocation)})</span>
                          </p>
                          <p className={`mt-0.5 text-xl font-bold tracking-tight ${stockColorClass(availableStock, currentRequired)}`}>
                            {availableStock}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{itemUnit}</p>
                        </div>

                        {/* KPI 4: Net Shortage */}
                        <div className="rounded-xl border border-rose-200/70 bg-rose-50/50 p-3 text-center dark:border-rose-900/40 dark:bg-rose-950/20">
                          <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <p className="text-[10px] font-medium text-muted-foreground">Net Shortage</p>
                          <p className={`mt-0.5 text-xl font-bold tracking-tight ${currentShortage > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}>
                            {currentShortage}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {currentShortage > 0 ? "After using available stock" : "Fully covered"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: ALLOCATION DETAILS */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                          2
                        </span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Allocation Details
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="requirement-quantity" className="text-xs font-semibold">
                            Required Quantity <span className="text-destructive">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="requirement-quantity"
                              type="number"
                              min={1}
                              step={1}
                              required
                              value={editor.requiredQuantity}
                              onChange={e => setEditor(current => ({ ...current, requiredQuantity: e.target.value }))}
                              className="h-10 text-sm font-semibold tabular-nums pr-16"
                            />
                            <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-muted-foreground">
                              {itemUnit}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">Set the total quantity required for this event.</p>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="requirement-source" className="text-xs font-semibold">
                            Source Location <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={editor.sourceLocation}
                            onValueChange={value => setEditor(current => ({ ...current, sourceLocation: value }))}
                          >
                            <SelectTrigger id="requirement-source" className="h-10 text-xs">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                <SelectValue placeholder="Select location" />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {ALLOCATION_SOURCE_LOCATIONS.map(value => (
                                <SelectItem key={value} value={value}>
                                  {allocationLabel(value)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-[11px] text-muted-foreground">Select location from where stock will be reserved.</p>
                        </div>
                      </div>

                      {/* Informational Callout */}
                      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <RotateCcw className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Auto Reservation Enabled</p>
                          <p className="mt-0.5 text-muted-foreground leading-relaxed">
                            Available stock at the selected location is automatically reserved against this requirement.
                            Any remaining shortage will be tracked as pending.
                          </p>
                        </div>
                      </div>

                      {/* Line Notes */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="requirement-notes" className="text-xs font-semibold">
                            Allocation Note (Optional)
                          </Label>
                          <span className="text-[10px] text-muted-foreground">
                            {(editor.notes || "").length} / 300
                          </span>
                        </div>
                        <Textarea
                          id="requirement-notes"
                          maxLength={300}
                          value={editor.notes}
                          onChange={e => setEditor(current => ({ ...current, notes: e.target.value }))}
                          placeholder="e.g. Client requested 25 units for main buffet area."
                          className="min-h-18 text-xs resize-none"
                        />
                      </div>
                    </div>

                    {/* Section 3: ALLOCATION PREVIEW */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                          3
                        </span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Allocation Preview
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                        {/* Comparison Matrix Table */}
                        <div className="overflow-hidden rounded-xl border border-border/80 bg-background text-xs">
                          <div className="grid grid-cols-3 border-b border-border/70 bg-muted/40 p-2.5 text-[11px] font-semibold text-foreground">
                            <span>Metric</span>
                            <span className="text-center">Current</span>
                            <span className="text-center text-primary">After Update</span>
                          </div>
                          <div className="divide-y divide-border/60">
                            <div className="grid grid-cols-3 p-2.5 items-center">
                              <span className="text-muted-foreground">Required</span>
                              <span className="text-center font-semibold tabular-nums">{currentRequired}</span>
                              <span className="text-center font-bold tabular-nums text-foreground">{newRequired}</span>
                            </div>
                            <div className="grid grid-cols-3 p-2.5 items-center">
                              <span className="text-muted-foreground">Reserved</span>
                              <span className="text-center font-semibold tabular-nums">{currentReserved}</span>
                              <span className="text-center font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{newReserved}</span>
                            </div>
                            <div className="grid grid-cols-3 p-2.5 items-center">
                              <span className="text-muted-foreground">Available</span>
                              <span className="text-center font-semibold tabular-nums">{availableStock}</span>
                              <span className="text-center font-bold tabular-nums text-foreground">{availableStock}</span>
                            </div>
                            <div className="grid grid-cols-3 p-2.5 items-center">
                              <span className="text-muted-foreground">Net Shortage</span>
                              <span className={`text-center font-semibold tabular-nums ${currentShortage > 0 ? "text-rose-600 dark:text-rose-400" : ""}`}>{currentShortage}</span>
                              <span className={`text-center font-bold tabular-nums ${newShortage > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}>{newShortage}</span>
                            </div>
                          </div>
                        </div>

                        {/* Final Status Summary Box */}
                        <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-muted/20 p-3.5 text-xs">
                          <div>
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Final Status</p>
                            <div className="mt-2 flex items-center gap-2">
                              <Badge variant="outline" className={`gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${ALLOCATION_TONES[allocationStatusTone(newReadiness)]}`}>
                                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                                {newReadiness}
                              </Badge>
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                              {newShortage > 0
                                ? `${newShortage} ${itemUnit} shortage detected. Stock will be auto-reserved up to available ${availableStock} units.`
                                : `All ${newRequired} ${itemUnit} can be fully fulfilled from ${allocationLabel(editor.sourceLocation)}.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {saveMutation.isError && (
                      <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                        {saveMutation.error?.response?.data?.message || saveMutation.error?.message}
                      </p>
                    )}

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={saveMutation.isPending}
                        onClick={() => setEditor(null)}
                        className="h-9 px-4 text-xs font-medium"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={saveMutation.isPending || (editor.mode !== "metadata" && (!editor.item || !editor.sourceLocation))}
                        className="h-9 gap-1.5 px-4 text-xs font-medium"
                      >
                        {saveMutation.isPending ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Save Allocation
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </section>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

NoAllocationEventDetailRoute.propTypes = {
  eventId: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
  onCreateAllocation: PropTypes.func.isRequired,
  onPrepare: PropTypes.func.isRequired,
};

function NoAllocationEventDetailRoute({ eventId, onBack, onCreateAllocation, onPrepare }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: "", category: "all", status: "all", location: "all", readiness: "all" });

  // 1. Fetch booking details for the event
  const bookingQuery = useQuery({
    queryKey: ["event-booking-detail", eventId],
    queryFn: async () => {
      const res = await AdminService.getEventBookingDetail({ eventId });
      return res.data;
    },
    enabled: Boolean(eventId),
    retry: 1,
  });

  // Also check query cache from event-allocation-events query if available
  const cachedBooking = useMemo(() => {
    return queryClient
      .getQueriesData({ queryKey: ["event-allocation-events"] })
      .flatMap(([, response]) => extractEvents(response))
      .find((entry) => String(entry._id || entry.id) === String(eventId));
  }, [queryClient, eventId]);

  const rawBookingData = bookingQuery.data;
  const booking = useMemo(() => {
    if (rawBookingData) {
      return (
        rawBookingData?.event ||
        rawBookingData?.booking ||
        rawBookingData?.eventBooking ||
        rawBookingData?.data ||
        rawBookingData
      );
    }
    return cachedBooking || null;
  }, [rawBookingData, cachedBooking]);

  // 2. Query real allocations to check if this event actually has an allocation
  const allocationQuery = useQuery({
    queryKey: ["inventoryv2-allocations"],
    queryFn: fetchAllocationHistory,
    staleTime: 0,
  });

  const allocationsData = allocationQuery.data;
  const matchingAllocation = useMemo(() => {
    const rawAllocations = allocationsData?.data?.data?.entries || [];
    if (!Array.isArray(rawAllocations) || !booking) return null;
    const bookingId = String(booking._id || booking.id || eventId);
    const crmId = String(booking.crmCustomerId?._id || booking.crmCustomerId || booking.customer?._id || "");
    return rawAllocations.find((alloc) => {
      if (!alloc || alloc.status === "Cancelled") return false;
      if (alloc.event && String(alloc.event._id || alloc.event) === bookingId) return true;
      if (!alloc.event && crmId && String(alloc.crmCustomerId?._id || alloc.crmCustomerId) === crmId) return true;
      return false;
    }) || null;
  }, [allocationsData, booking, eventId]);

  // If an allocation exists for this event, render the real allocated view
  if (matchingAllocation && !allocationQuery.isFetching && !allocationQuery.isError) {
    return (
      <AllocationDetailRoute
        allocationId={matchingAllocation._id}
        onPrepare={onPrepare}
        onBack={onBack}
      />
    );
  }

  // Handle loading state
  if ((bookingQuery.isLoading && !booking) || allocationQuery.isPending || allocationQuery.isFetching) {
    return (
      <section aria-label="Event Allocation detail" className="min-w-0 space-y-4 text-foreground">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 gap-1.5 px-0 text-xs font-medium text-primary hover:bg-transparent hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Event Allocation
          </Button>
        </div>
        <Card className="border-border/80 shadow-none">
          <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading event details…
          </CardContent>
        </Card>
      </section>
    );
  }

  // Handle error state
  if ((bookingQuery.isError && !booking) || allocationQuery.isError) {
    return (
      <section aria-label="Event Allocation detail" className="min-w-0 space-y-4 text-foreground">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 gap-1.5 px-0 text-xs font-medium text-primary hover:bg-transparent hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Event Allocation
          </Button>
        </div>
        <Card className="border-border/80 shadow-none">
          <CardContent className="space-y-3 py-12 text-center" role="alert">
            <AlertTriangle className="mx-auto h-6 w-6 text-destructive" />
            <h1 className="text-base font-semibold">Failed to load event</h1>
            <p className="text-xs text-muted-foreground">
              {bookingQuery.error?.response?.data?.message || bookingQuery.error?.message || "Unable to load details for this event."}
            </p>
            <Button variant="outline" size="sm" onClick={() => bookingQuery.refetch()} className="gap-1.5 text-xs">
              <RotateCcw className="h-3.5 w-3.5" /> Try again
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Handle missing booking (not found)
  if (!booking) {
    return (
      <section aria-label="Event Allocation detail" className="min-w-0 space-y-4 text-foreground">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 gap-1.5 px-0 text-xs font-medium text-primary hover:bg-transparent hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Event Allocation
          </Button>
        </div>
        <Card className="border-border/80 shadow-none">
          <CardContent className="space-y-2 py-12 text-center">
            <Boxes className="mx-auto h-8 w-8 text-muted-foreground" />
            <h1 className="text-base font-semibold">Event not found</h1>
            <p className="text-xs text-muted-foreground">Return to Event Allocation to select an existing record.</p>
            <Button variant="outline" size="sm" onClick={onBack} className="mt-2 gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Event Allocation
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const eventImage = booking?.coverImage?.small || booking?.coverImage?.medium || booking?.coverImage?.original;
  const eventCode = booking?.eventCode || deriveBookingCode(booking);
  const customerName = booking?.customer?.name || booking?.familyName;
  const coordinatorName = booking?.coordinator?.fullName || booking?.coordinator?.name || booking?.eventManager?.fullName || booking?.eventManager?.name;
  const coordinatorRole = booking?.coordinator?.role || booking?.eventManager?.role || "Event Coordinator";

  const setFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({ search: "", category: "all", status: "all", location: "all", readiness: "all" });
  };

  return (
    <section aria-label="Event Allocation detail" className="min-w-0 space-y-4 text-foreground">
      {/* Top Navigation & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 gap-1.5 px-0 text-xs font-medium text-primary hover:bg-transparent hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Event Allocation
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" className="h-8 gap-1.5 text-xs font-medium" onClick={() => onCreateAllocation(booking)}>
            <Plus className="h-3.5 w-3.5" /> Create Allocation
          </Button>
        </div>
      </div>

      {/* Main Event Header Card */}
      <Card className="border-border/80 bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            {/* Event Cover & Basic Info */}
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/5 text-primary sm:h-22 sm:w-28">
                {eventImage ? (
                  <img
                    src={eventImage}
                    alt={booking.eventName || "Event"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <Calendar className={`h-8 w-8 ${eventImage ? "hidden" : ""}`} aria-hidden="true" />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-lg font-bold text-foreground sm:text-xl">
                    {booking.eventName || booking.eventType || "Event Details"}
                  </h1>
                  {booking?.bookingStatus ? (
                    <Badge
                      variant="outline"
                      className={`gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${ALLOCATION_TONES[allocationStatusTone(booking.bookingStatus)]}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                      Event {booking.bookingStatus}
                    </Badge>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  {eventCode && (
                    <span className="font-semibold text-primary">{eventCode}</span>
                  )}
                  {eventCode && customerName && (
                    <span className="text-muted-foreground/60">|</span>
                  )}
                  {customerName && (
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                      <User className="h-3.5 w-3.5 text-primary" /> {customerName}
                    </span>
                  )}
                </div>
                {booking?.eventType && (
                  <p className="text-xs text-muted-foreground">{booking.eventType}</p>
                )}
              </div>
            </div>

            {/* Event Details and Allocation Status */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border/60 pt-3 text-xs xl:border-t-0 xl:pt-0">
              {booking?.eventDate && (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Event Date</p>
                    <p className="font-semibold text-foreground">{formatEventDate(booking.eventDate)}</p>
                  </div>
                </div>
              )}

              {(booking?.venue || booking?.city) && (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Venue</p>
                    <p className="font-semibold text-foreground">{booking.venue || "—"}</p>
                    {booking.city && <p className="text-[10px] text-muted-foreground">{booking.city}</p>}
                  </div>
                </div>
              )}

              {booking?.plannedIssueDate && (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Planned Issue Date</p>
                    <p className="font-semibold text-foreground">{formatEventDate(booking.plannedIssueDate)}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="mb-1 text-[10px] text-muted-foreground">Allocation Status</p>
                <Badge variant="outline" className={`gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${ALLOCATION_TONES.neutral}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                  No Allocation
                </Badge>
              </div>

              {coordinatorName && (
                <div className="flex items-center gap-2.5 pl-2 border-l border-border/60">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                    {coordinatorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Event Coordinator</p>
                    <p className="font-semibold text-foreground leading-tight">{coordinatorName}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{coordinatorRole}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {booking.notes && (
            <div className="mt-3 border-t border-border/70 pt-2.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Event Note: </span>
              {booking.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4 Summary Cards matching Allocated Reference Layout */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Requirement Lines */}
        <Card className="border-border/80 bg-card shadow-sm">
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-200/70 bg-blue-50 text-blue-600 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-400">
              <Boxes className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Requirement Lines</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">—</p>
              <p className="text-[11px] text-muted-foreground">Total item types required</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Ready Lines */}
        <Card className="border-border/80 bg-card shadow-sm">
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-200/70 bg-emerald-50 text-emerald-600 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Ready Lines</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">—</p>
              <p className="text-[11px] text-muted-foreground">Fully reserved and ready</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Shortage Lines */}
        <Card className="border-border/80 bg-card shadow-sm">
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rose-200/70 bg-rose-50 text-rose-600 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Shortage Lines</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">—</p>
              <p className="text-[11px] text-muted-foreground">Items with remaining shortage</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Allocation Progress */}
        <Card className="border-border/80 bg-card shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-purple-200/70 bg-purple-50 text-purple-600 dark:border-purple-800/50 dark:bg-purple-950/40 dark:text-purple-400">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Allocation Progress</p>
                  <p className="text-xl font-bold tracking-tight text-foreground">—</p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                —
              </span>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: "0%" }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allocation Items Table Container with Filters & No Allocation Yet State */}
      <Card className="min-w-0 overflow-hidden border-border/80 bg-card shadow-sm">
        {/* Filter / Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-border/70 p-3">
          <div className="min-w-[200px] flex-1">
            <Label htmlFor="no-alloc-search" className="sr-only">Search item name or item ID</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="no-alloc-search"
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="Search item name or item ID..."
                className="h-9 pl-9 text-xs"
              />
            </div>
          </div>

          {[
            { field: "category", label: "All Categories", values: [] },
            { field: "readiness", label: "All Allocation Status", values: ["Ready", "Partially Ready", "Shortage"] },
            { field: "location", label: "All Source Locations", values: [] },
          ].map(({ field, label, values }) => (
            <Select key={field} value={filters[field]} onValueChange={(value) => setFilter(field, value)}>
              <SelectTrigger aria-label={label} className="h-9 w-auto min-w-[150px] flex-1 text-xs sm:flex-none">
                <SelectValue placeholder={label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{label}</SelectItem>
                {values.map(value => <SelectItem key={value} value={value}>{allocationLabel(value)}</SelectItem>)}
              </SelectContent>
            </Select>
          ))}

          <Button variant="outline" size="sm" onClick={resetFilters} className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>

        {/* No Allocation Yet Empty State */}
        <div className="space-y-4 px-4 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
            <Boxes className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">No Allocation Yet</p>
            <p className="mx-auto max-w-md text-xs text-muted-foreground">
              Inventory has not been allocated for this event. Allocation records will appear here once the allocation workflow is created.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => onCreateAllocation(booking)}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" /> Create Allocation
          </Button>
        </div>
      </Card>
    </section>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function EventAllocationTab({ onRequirementWorkspaceChange }) {
  // ── ALL hooks declared unconditionally at the top level ──────────────────
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const eventId = searchParams.get("eventId");
  const action = searchParams.get("action");
  const allocationId = searchParams.get("allocationId");

  // Sync search input to debounced state with a small timeout or immediate effect on enter/change
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // ── Server-side paginated query for booked events ───────────────────────────
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["event-allocation-events", page, pageSize, debouncedSearch],
    queryFn: () => fetchBookedEvents({ page, limit: pageSize, search: debouncedSearch }),
    keepPreviousData: true,
  });

  // ── Query real Inventory V2 Allocations for enrichment ──────────────────────
  const { data: allocationsData } = useQuery({
    queryKey: ["inventoryv2-allocations"],
    queryFn: fetchAllocationHistory,
    staleTime: 30000,
  });

  // ── Map allocations by event ID and crmCustomerId ───────────────────────────
  const allocationsMap = useMemo(() => {
    const rawAllocations = allocationsData?.data?.data?.entries || [];
    const map = new Map();

    if (Array.isArray(rawAllocations)) {
      // The API returns newest first; keep the first allocation for each key.
      for (const alloc of rawAllocations) {
        if (!alloc || alloc.status === "Cancelled") continue;
        if (alloc.event) {
          const evId = String(alloc.event._id || alloc.event);
          if (!map.has(`event-${evId}`)) map.set(`event-${evId}`, alloc);
        }
        if (!alloc.event && alloc.crmCustomerId) {
          const crmId = String(alloc.crmCustomerId._id || alloc.crmCustomerId);
          if (!map.has(`crm-${crmId}`)) map.set(`crm-${crmId}`, alloc);
        }
      }
    }
    return map;
  }, [allocationsData]);

  // ── Normalize raw API events (excluding cancelled/on-hold if any) ────────────
  const events = useMemo(() => {
    return extractEvents(data)
      .filter((booking) => !["Cancelled", "On Hold"].includes(booking.bookingStatus))
      .map((booking) => {
        const rawCrmId = booking.crmCustomerId || booking.customer?._id;
        const matchingAllocation =
          allocationsMap.get(`event-${String(booking._id)}`) ||
          (rawCrmId ? allocationsMap.get(`crm-${String(rawCrmId)}`) : null) ||
          null;

        return normalizeEvent(booking, matchingAllocation);
      });
  }, [data, allocationsMap]);

  const totalRows = extractTotalRows(data);
  const totalPages = extractTotalPages(data);

  // ── Navigation handlers ───────────────────────────────────────────────────
  const handleOpenDetail = (item) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "event-allocation");
    if (item.allocationId) {
      next.set("allocationId", item.allocationId);
      next.delete("eventId");
    } else {
      next.set("eventId", item.id);
      next.delete("allocationId");
    }
    next.delete("action");
    setSearchParams(next);
  };

  const handleOpenCreateAllocation = () => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "event-allocation");
    next.set("action", "create");
    next.delete("eventId");
    setSearchParams(next);
  };

  const handleCreateAllocationForEvent = (booking) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "event-allocation");
    next.set("action", "create");
    if (booking) {
      const id = String(booking._id || booking.id || "");
      if (id) next.set("eventId", id);
    }
    next.delete("allocationId");
    setSearchParams(next);
  };

  const handleBackToListing = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("eventId");
    next.delete("action");
    next.delete("allocationId");
    next.set("tab", "event-allocation");
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateRange("all");
    setPage(1);
    toast.success("Filters reset to default");
  };

  // ── Client-side filtering on the current page's normalized results ────────
  const filteredRecords = useMemo(() => {
    return events.filter((item) => {
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesEvent = item.eventName.toLowerCase().includes(query);
        const matchesFamily = item.familyName.toLowerCase().includes(query);
        const matchesBooking = item.bookingId.toLowerCase().includes(query);
        const matchesVenue = item.eventVenue.toLowerCase().includes(query);
        if (!matchesEvent && !matchesFamily && !matchesBooking && !matchesVenue) {
          return false;
        }
      }

      // Allocation status filter.
      // In Phase 1, all events will be "No Allocation".
      // Other values (Ready, Partially Ready, Shortage) return zero results
      // correctly until real allocation records exist.
      if (statusFilter !== "all" && item.allocationStatus !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [events, search, statusFilter]);

  // ── Create Allocation View Route ──────────────────────────────────────────────
  if (action === "create") {
    const createEvent = eventId
      ? (events.find((e) => e.id === eventId)?.rawBooking || null)
      : null;

    return (
      <CreateEventAllocationPage
        key={eventId || "create-new"}
        initialEvent={createEvent}
        onBack={handleBackToListing}
        RequirementWorkspace={AllocationRequirementWorkspace}
        onRequirementWorkspaceChange={onRequirementWorkspaceChange}
      />
    );
  }

  const openAllocationAction = (nextAction) => {
    const next = new URLSearchParams(searchParams);
    if (nextAction) next.set("action", nextAction);
    else next.delete("action");
    setSearchParams(next);
  };
  if (action === "prepare-issue" && allocationId) {
    return <PrepareIssueReviewRoute key={allocationId} allocationId={allocationId}
      onBack={() => openAllocationAction(null)}
      onRequirementWorkspaceChange={onRequirementWorkspaceChange} />;
  }

  // ── Allocation detail route (after successful creation) ──────────────────
  if (allocationId) {
    return (
      <AllocationDetailRoute
        allocationId={allocationId}
        onPrepare={() => openAllocationAction("prepare-issue")}
        onBack={handleBackToListing}
        onCancelled={(cancelled) => {
          // Resolve the event again: another active allocation may still exist.
          const linkedEventId = allocationReferenceId(cancelled.event)
            || events.find(entry => cancelled.crmCustomerId
              && allocationReferenceId(entry.rawBooking.crmCustomerId || entry.rawBooking.customer)
                === allocationReferenceId(cancelled.crmCustomerId))?.id;
          const next = new URLSearchParams(searchParams);
          next.delete("allocationId");
          next.delete("action");
          if (linkedEventId) next.set("eventId", linkedEventId);
          else next.delete("eventId");
          setSearchParams(next, { replace: true });
        }}
      />
    );
  }

  // ── Detail view route ─────────────────────────────────────────────────────
  if (eventId) {
    return (
      <NoAllocationEventDetailRoute
        key={eventId}
        eventId={eventId}
        onBack={handleBackToListing}
        onCreateAllocation={handleCreateAllocationForEvent}
        onPrepare={() => openAllocationAction("prepare-issue")}
      />
    );
  }

  // ── Status badge renderer ─────────────────────────────────────────────────
  const renderStatusBadge = (status) => {
    switch (status) {
      case "Ready":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            Ready
          </span>
        );
      case "Partially Ready":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/70 bg-orange-50 px-2.5 py-0.5 text-[11px] font-medium text-orange-700 dark:border-orange-800/50 dark:bg-orange-950/40 dark:text-orange-300">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-600 dark:bg-orange-400" />
            Partially Ready
          </span>
        );
      case "Shortage":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/70 bg-rose-50 px-2.5 py-0.5 text-[11px] font-medium text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-300">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600 dark:bg-rose-400" />
            Shortage
          </span>
        );
      case "No Allocation":
        // Neutral badge — inventory has not been allocated for this event yet.
        // This is NOT a booking planning status; it is an allocation-layer concept.
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
            No Allocation
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {status === "Confirmed" ? "Reserved" : status}
          </span>
        );
    }
  };

  // ── Pagination helpers ────────────────────────────────────────────────────
  const handlePageSizeChange = (newSize) => {
    setPageSize(Number(newSize));
    setPage(1);
  };

  const startingEntry = totalRows > 0 ? (page - 1) * pageSize + 1 : 0;
  const endingEntry = Math.min(page * pageSize, totalRows);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Filter & Search Bar */}
      <Card className="border border-border/80 bg-card shadow-xs">
        <CardContent className="!px-3.5 !py-2.5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[180px] flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search event / client / booking ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>

            {/* Event Date Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                Event Date
              </span>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="h-9 w-[130px] text-xs font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Event Date" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Dates</SelectItem>
                  <SelectItem value="today" className="text-xs">Today</SelectItem>
                  <SelectItem value="this-week" className="text-xs">This Week</SelectItem>
                  <SelectItem value="this-month" className="text-xs">This Month</SelectItem>
                  <SelectItem value="next-30-days" className="text-xs">Next 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Allocation Status Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                Allocation Status
              </span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[140px] text-xs font-medium">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                  <SelectItem value="No Allocation" className="text-xs">No Allocation</SelectItem>
                  <SelectItem value="Ready" className="text-xs">Ready</SelectItem>
                  <SelectItem value="Partially Ready" className="text-xs">Partially Ready</SelectItem>
                  <SelectItem value="Shortage" className="text-xs">Shortage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>

            {/* Create Allocation — rightmost action */}
            <Button
              size="sm"
              className="ml-auto h-9 gap-1.5 shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs"
              onClick={handleOpenCreateAllocation}
            >
              <Plus className="h-4 w-4" />
              Create Allocation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="border border-border/80 bg-card shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-3 text-xs font-semibold text-muted-foreground">Event</TableHead>
                  <TableHead className="py-3 text-center text-xs font-semibold text-muted-foreground">Event Date</TableHead>
                  <TableHead className="py-3 text-xs font-semibold text-muted-foreground min-w-[150px]">
                    Allocation Progress
                  </TableHead>
                  <TableHead className="py-3 text-center text-xs font-semibold text-muted-foreground">Shortage</TableHead>
                  <TableHead className="py-3 text-center text-xs font-semibold text-muted-foreground">
                    Planned Issue Date
                  </TableHead>
                  <TableHead className="py-3 text-center text-xs font-semibold text-muted-foreground">
                    Allocation Status
                  </TableHead>
                  <TableHead className="py-3 text-center text-xs font-semibold text-muted-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* ── Loading state ─────────────────────────────────────────── */}
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
                        <p className="text-xs text-muted-foreground">Loading confirmed events…</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  /* ── Error state — never falls back to mock data ────────── */
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Failed to load events</p>
                        <p className="text-xs text-muted-foreground max-w-xs">
                          {error?.response?.data?.message ||
                            error?.message ||
                            "Unable to fetch confirmed events. Please try again."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  /* ── Empty state — zero real events, no mock fallback ────── */
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Sparkles className="h-8 w-8 text-muted-foreground/60" />
                        <p className="text-sm font-medium text-foreground">No confirmed events found</p>
                        <p className="text-xs text-muted-foreground">
                          {search || statusFilter !== "all"
                            ? "Try adjusting your search query or filter options."
                            : "No confirmed bookings are available for allocation at this time."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  /* ── Real data rows ──────────────────────────────────────── */
                  filteredRecords.map((item) => (
                    <TableRow key={item.id} className="transition-colors hover:bg-muted/30">
                      {/* Event Name & Info */}
                      <TableCell className="py-3">
                        <div className="min-w-0">
                          <button
                            className="truncate text-xs font-bold text-foreground text-left hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors cursor-pointer"
                            onClick={() => handleOpenDetail(item)}
                          >
                            {item.eventName}
                          </button>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                              <User className="h-3 w-3" />
                              {item.familyName}
                            </span>
                            <span>•</span>
                            <span>{item.bookingId}</span>
                            {item.eventVenue !== "—" && (
                              <>
                                <span>•</span>
                                <span>
                                  {item.eventVenue}
                                  {item.eventCity ? `, ${item.eventCity}` : ""}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Event Date */}
                      <TableCell className="py-3 text-center text-xs text-muted-foreground">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{item.eventDate}</span>
                        </div>
                      </TableCell>

                      {/* Allocation Progress */}
                      <TableCell className="py-3">
                        <div className="space-y-1.5 min-w-[140px]">
                          <span className="text-xs font-medium text-muted-foreground block">
                            {item.progressText}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden max-w-[110px]">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  item.progressPercent === 100
                                    ? "bg-emerald-500"
                                    : item.progressPercent > 0
                                    ? "bg-amber-500"
                                    : "bg-muted-foreground/20"
                                }`}
                                style={{ width: `${item.progressPercent}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold w-8 text-right text-muted-foreground">
                              {item.progressPercent}%
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Shortage */}
                      <TableCell className="py-3 text-center">
                        <span className={`text-xs ${item.shortageCount > 0 ? "font-semibold text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}>
                          {item.shortageText}
                        </span>
                      </TableCell>

                      {/* Planned Issue Date */}
                      <TableCell className="py-3 text-center text-xs text-muted-foreground">
                        <span>{item.plannedIssueDate}</span>
                      </TableCell>

                      {/* Allocation Status */}
                      <TableCell className="py-3 text-center">
                        {renderStatusBadge(item.allocationStatus)}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="py-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-blue-200 px-3.5 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/40"
                            onClick={() => handleOpenDetail(item)}
                          >
                            {item.actionLabel}
                          </Button>
                          <AllocationDeleteAction allocationId={item.allocationId} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer — server-side pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/80 px-5 py-3">
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? "Loading…"
                : totalRows > 0
                ? `Showing ${startingEntry} to ${endingEntry} of ${totalRows} confirmed events`
                : "No confirmed events"}
            </p>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Select
                  value={String(pageSize)}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="h-8 w-[115px] text-xs font-medium">
                    <SelectValue placeholder="10 per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10" className="text-xs">10 per page</SelectItem>
                    <SelectItem value="25" className="text-xs">25 per page</SelectItem>
                    <SelectItem value="50" className="text-xs">50 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="h-8 w-8 p-0 bg-blue-600 text-xs font-medium text-white shadow-xs"
                  disabled
                >
                  {page}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

EventAllocationTab.propTypes = { onRequirementWorkspaceChange: PropTypes.func };
