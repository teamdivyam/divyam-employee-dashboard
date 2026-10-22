import EventInventoryScrollTable from './EventInventoryScrollTable';
import { allocatedItemsByCategory } from "../../Inventory/Essentials/allocatedItemCategories";
import { canEditAllocationRequirements } from "../../Inventory/Essentials/allocationEditAccess";
import useAllocationReport from "../../Inventory/Essentials/useAllocationReport";
import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertTriangle,
  Boxes,
  Calendar,
  CheckCircle2,
  Download,
  Loader2,
  MapPin,
  Package,
  Pencil,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import useEventInventoryService from "../../Inventory/Essentials/useEventInventoryService";
import { Badge } from "@components/components/ui/badge";
import { Button } from "@components/components/ui/button";
import { Card } from "@components/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@components/components/ui/dialog";
import { Input } from "@components/components/ui/input";
import { Label } from "@components/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "./EventTable";
import { Textarea } from "@components/components/ui/textarea";

import { ItemImagePreview, ItemPreviewImage } from "@components/components/InventoryItemImagePreview";
import FulfilmentPlanDisplay from "../../Inventory/Essentials/components/FulfilmentPlanDisplay";
import AllocationDeleteAction from "../../Inventory/Essentials/components/AllocationDeleteAction";
import {
  eventAllocationDetailKey,
  allocationDisplayRows,
  loadEventAllocationDetail,
  lineItemReadinessStatus,
} from "../../Inventory/Essentials/eventAllocationRows";
import {
  allocationLinePayload,
  allocationVersion,
} from "../../Inventory/Essentials/allocationAmendment";
import { linePlanningPayload } from "../../Inventory/Essentials/allocationPlanning";

const ALLOCATION_SOURCE_LOCATIONS = ["main_store", "central_store", "admin_office", "warehouse_a", "warehouse_b"];

const allocationLabel = (value) =>
  value
    ? value
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "—";

const allocationReferenceId = (value) => String(value?._id || value || "");

const allocationReadiness = (line) => {
  if (typeof line.netShortage !== "number" || typeof line.willReserve !== "number") return null;
  if (line.netShortage === 0) return "Ready";
  return line.willReserve > 0 ? "Partially Ready" : "Shortage";
};

const ALLOCATION_TONES = {
  neutral: "border-border bg-muted text-muted-foreground",
  blue: "event-allocation-tone-1",
  green: "event-allocation-tone-2",
  amber: "event-allocation-tone-3",
  red: "event-allocation-tone-4",
};

const allocationStatusTone = (status) =>
  ({
    Ready: "green",
    Confirmed: "green",
    Returned: "green",
    "Partially Ready": "amber",
    Dispatched: "amber",
    "Partially Dispatched": "amber",
    "Partially Returned": "amber",
    Shortage: "red",
    Cancelled: "red",
    Reserved: "blue",
    Planning: "blue",
  }[status] || "neutral");

const CATEGORY_PALETTE = [
  "event-allocation-tone-5",
  "event-allocation-tone-2",
  "event-allocation-tone-6",
  "event-allocation-tone-3",
  "event-allocation-tone-7",
  "event-allocation-tone-8",
  "event-allocation-tone-9",
  "event-allocation-tone-10",
];

const categoryBadgeColor = (category) => {
  if (!category) return CATEGORY_PALETTE[0];
  let h = 0;
  for (let i = 0; i < category.length; i++) {
    h = (h << 5) - h + category.charCodeAt(i);
    h |= 0;
  }
  return CATEGORY_PALETTE[Math.abs(h) % CATEGORY_PALETTE.length];
};

const stockColorClass = (available, required) => {
  if (available == null) return "";
  if (available <= 0) return "text-rose-600 dark:text-rose-400";
  if (available >= required) return "text-emerald-600 dark:text-emerald-400";
  return "text-amber-600 dark:text-amber-400";
};

const formatEventDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd MMM yyyy");
  } catch {
    return "—";
  }
};

const renderStatus = (status) => (
  <Badge
    variant="outline"
    className={`gap-1.5 whitespace-nowrap rounded-full text-[11px] font-medium ${ALLOCATION_TONES[allocationStatusTone(status)]}`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
    {status || "—"}
  </Badge>
);

const renderImage = (image, name, preview = true) => (
  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/80 bg-muted/30">
    {image ? (
      <ItemPreviewImage
        preview={preview}
        key={image}
        src={image}
        alt={name || "Inventory item"}
        className="h-full w-full object-cover"
        onError={(event) => {
          event.target.style.display = "none";
          event.target.nextElementSibling?.classList.remove("hidden");
        }}
      />
    ) : null}
    <Package className={`h-6 w-6 text-muted-foreground ${image ? "hidden" : ""}`} aria-hidden="true" />
  </div>
);

const allocationRequirementPayload = (items, editor) => {
  const quantity = Number(editor.requiredQuantity);
  if (
    !editor.item ||
    !ALLOCATION_SOURCE_LOCATIONS.includes(editor.sourceLocation) ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1
  ) {
    throw new Error("Choose an item, a source location and a positive whole quantity.");
  }
  if ((editor.notes || "").trim().length > 300) throw new Error("Line notes must be 300 characters or fewer.");
  if (editor.lineId && !items.some((line) => line._id === editor.lineId)) {
    throw new Error("This requirement has changed. Refresh the allocation and reopen it.");
  }
  const lines = items
    .filter((line) => line.status !== "Cancelled")
    .map((line) => ({
      ...allocationLinePayload(line),
      ...(line._id === editor.lineId
        ? {
            requiredQuantity: quantity,
            sourceLocation: editor.sourceLocation,
            notes: editor.notes?.trim() || null,
          }
        : {}),
    }));
  if (!editor.lineId) {
    lines.push({
      item: editor.item,
      sourceLocation: editor.sourceLocation,
      requiredQuantity: quantity,
      notes: editor.notes?.trim() || null,
      ...(editor.planning ? { planning: linePlanningPayload(editor.planning) } : {}),
    });
  }
  return { items: lines };
};

export default function EventAllocationRequirementsSection({ eventId, booking, onCountChange }) {
  const AdminV2Service = useEventInventoryService();
  const allocationReport = useAllocationReport(AdminV2Service, null, booking, [], eventId, `event-${eventId}-allocation.pdf`);
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    status: "all",
    location: "all",
    readiness: "all",
  });
  const [viewedItemId, setViewedItemId] = useState(null);
  const [previewLineId, setPreviewLineId] = useState(null);
  const [editor, setEditor] = useState(null);
  const saving = useRef(false);

  // 1. Fetch active allocations belonging to this event
  const allocationsQuery = useQuery({
    queryKey: ["inventoryv2-allocations", "event-allocations-list", eventId],
    queryFn: async () => {
      let entries = [];
      const res = await AdminV2Service.listInventoryV2Allocations({ event: eventId, limit: 100 });
      entries = res.data?.data?.entries || [];
      if (!entries.length && booking) {
        const crmId = String(booking.crmCustomerId || booking.customer?._id || booking.customer || "");
        if (crmId) {
          const allRes = await AdminV2Service.listInventoryV2Allocations({ limit: 100 });
          entries = (allRes.data?.data?.entries || []).filter(
            (a) => !a.event && String(a.crmCustomerId?._id || a.crmCustomerId || "") === crmId
          );
        }
      }
      return entries;
    },
    enabled: Boolean(eventId),
  });

  const activeAllocations = useMemo(
    () => (allocationsQuery.data || []).filter((a) => a.status !== "Cancelled"),
    [allocationsQuery.data]
  );

  const primaryAllocationId = activeAllocations[0]?._id;

  // 2. Fetch full detail for the linked allocation
  const detailQuery = useQuery({
    queryKey: eventAllocationDetailKey(primaryAllocationId),
    queryFn: () => loadEventAllocationDetail(AdminV2Service, primaryAllocationId),
    enabled: Boolean(primaryAllocationId),
    retry: 1,
  });

  // 3. Fetch source allocations for fulfilment plan
  const sourceAllocationsQuery = useQuery({
    queryKey: ["inventoryv2-allocations", "sources-list", eventId],
    queryFn: async () => (await AdminV2Service.listInventoryV2Allocations({ limit: 100 })).data?.data?.entries || [],
    staleTime: 60000,
  });
  const sourceAllocations = sourceAllocationsQuery.data || [];

  const documents = useMemo(() => detailQuery.data?.eventAllocations || [], [detailQuery.data]);
  const items = useMemo(() => {
    if (!documents.length) return [];
    try {
      return allocatedItemsByCategory(allocationDisplayRows(documents));
    } catch {
      return [];
    }
  }, [documents]);

  // Report count to parent
  useEffect(() => {
    if (onCountChange) {
      onCountChange(items.length);
    }
  }, [items.length, onCountChange]);

  useEffect(() => {
    setPreviewLineId(null);
  }, [primaryAllocationId, filters]);

  // Filtering
  const filteredItems = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return items.filter((line) => {
      return (
        (!query || [line.itemName, line.itemId].some((value) => value?.toLowerCase().includes(query))) &&
        (filters.category === "all" || line.category === filters.category) &&
        (filters.status === "all" || line.status === filters.status) &&
        (filters.location === "all" || line.sourceLocation === filters.location) &&
        (filters.readiness === "all" || allocationReadiness(line) === filters.readiness)
      );
    });
  }, [items, filters]);

  const visibleItems = filteredItems;

  // Queries for item records (images, minimum stock, tracking)
  const itemIds = useMemo(
    () => [
      ...new Set(
        [...visibleItems.map((line) => allocationReferenceId(line.item)), viewedItemId].filter(Boolean)
      ),
    ],
    [visibleItems, viewedItemId]
  );

  const itemQueries = useQueries({
    queries: itemIds.map((itemId) => ({
      queryKey: ["inventoryv2-item-detail", eventId, itemId],
      queryFn: async () => (await AdminV2Service.getInventoryV2ItemById(itemId)).data?.data?.item,
      enabled: Boolean(itemId),
      staleTime: 60000,
    })),
  });

  const itemRecords = useMemo(
    () => new Map(itemIds.map((itemId, index) => [itemId, itemQueries[index]])),
    [itemIds, itemQueries]
  );

  const viewedItemQuery = itemRecords.get(viewedItemId);
  const viewedItem = viewedItemQuery?.data;

  const setFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({ search: "", category: "all", status: "all", location: "all", readiness: "all" });
  };

  const canEditRow = (line) => {
    const owner = line.owningAllocation;
    return AdminV2Service.canUpdateAllocations && canEditAllocationRequirements(owner, AdminV2Service.accessRole);
  };

  // Edit Allocation mutation
  const saveMutation = useMutation({
    retry: false,
    mutationFn: async () => {
      if (!AdminV2Service.canUpdateAllocations) throw new Error("You do not have permission to edit allocations.");
      if (!editor) throw new Error("This allocation cannot be edited.");
      const response = await AdminV2Service.getInventoryV2AllocationById(editor.allocationId);
      const current = response.data?.data;
      if (
        !current ||
        current._id !== editor.allocationId ||
        current.updatedAt !== editor.updatedAt ||
        current.status === "Cancelled"
      ) {
        throw new Error("The allocation has changed. Close this form, refresh and reopen it before saving.");
      }
      if (
        editor.mode !== "metadata" &&
        !canEditAllocationRequirements(current, AdminV2Service.accessRole)
      ) {
        throw new Error("This allocation is committed. Only its date and note can be edited.");
      }
      let payload;
      if (editor.mode === "metadata") {
        payload = {
          plannedIssueDate: editor.plannedIssueDate ? new Date(editor.plannedIssueDate).toISOString() : null,
          allocationNote: editor.allocationNote.trim() || null,
        };
      } else {
        payload = allocationRequirementPayload(current.items, editor);
      }
      return AdminV2Service.updateInventoryV2Allocation(editor.allocationId, {
        ...payload,
        ...allocationVersion(current),
      });
    },
    onSettled: () => {
      saving.current = false;
    },
    onSuccess: async () => {
      setEditor(null);
      toast.success("Allocation updated successfully");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventoryv2-allocations"] }),
        queryClient.invalidateQueries({ queryKey: ["event-booking-inventory", eventId] }),
        queryClient.invalidateQueries({ queryKey: eventAllocationDetailKey(editor?.allocationId) }),
      ]);
    },
    onError: (failure) =>
      toast.error(failure?.response?.data?.message || failure.message || "Unable to update allocation"),
  });

  const submitAllocationEdit = () => {
    if (saving.current) return;
    saving.current = true;
    saveMutation.mutate();
  };

  const openEditor = (mode, line = null) => {
    const owner = line ? line.owningAllocation : detailQuery.data?.data?.data;
    saveMutation.reset();
    setEditor({
      mode,
      allocationId: owner?._id,
      lineId: line?._id || null,
      line: line || null,
      item: allocationReferenceId(line?.item),
      itemName: line?.itemName || "",
      sourceLocation: line?.sourceLocation || "",
      requiredQuantity: line?.requiredQuantity ?? 1,
      notes: line?.notes || "",
      plannedIssueDate: owner?.plannedIssueDate?.slice(0, 10) || "",
      allocationNote: owner?.allocationNote || "",
      updatedAt: owner?.updatedAt,
    });
  };

  const renderItemIdentity = (line, layout = "table") => {
    const image = itemRecords.get(allocationReferenceId(line.item))?.data?.image;
    const previewId = `${layout}-${line.rowKey}`;
    return (
      <div className="flex min-w-0 items-center gap-3">
        <ItemImagePreview
          src={image}
          alt={line.itemName}
          open={previewLineId === previewId}
          onOpenChange={(open) =>
            setPreviewLineId((current) => (open ? previewId : current === previewId ? null : current))
          }
        >
          <button
            type="button"
            disabled={!image}
            aria-label={`Enlarge image of ${line.itemName}`}
            onClick={(event) => event.stopPropagation()}
            className="shrink-0 rounded-lg enabled:cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {renderImage(image, line.itemName, false)}
          </button>
        </ItemImagePreview>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground">{line.itemName || "—"}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {[line.itemId, line.unit].filter(Boolean).join(" · ") || "—"}
          </p>
          {line.notes && <p className="mt-0.5 max-w-xs truncate text-[11px] text-muted-foreground/80">{line.notes}</p>}
        </div>
      </div>
    );
  };

  const renderRowActions = (line) => (
    <div className="flex flex-nowrap items-center justify-center gap-1 [&>button]:shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="Edit Allocation"
        title={!AdminV2Service.canUpdateAllocations ? "You do not have permission to edit allocations" : canEditRow(line) ? "Edit allocation" : "This allocation is locked for your role"}
        disabled={!canEditRow(line)}
        onClick={() => openEditor("edit", line)}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </Button>
      <AllocationDeleteAction
        allocationId={line.ownership.allocationId}
        allocationLineId={line.ownership.allocationLineId}
        disabled={saveMutation.isPending}
        onDeleted={async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["inventoryv2-allocations"] }),
            queryClient.invalidateQueries({ queryKey: ["event-booking-inventory", eventId] }),
            queryClient.invalidateQueries({ queryKey: eventAllocationDetailKey(primaryAllocationId) }),
          ]);
        }}
      />
    </div>
  );


  const isInitialLoading = allocationsQuery.isLoading || (Boolean(primaryAllocationId) && detailQuery.isLoading);

  if (isInitialLoading) {
    return (
      <Card className="min-w-0 overflow-hidden border-border/80 bg-card shadow-sm p-12 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        <p className="mt-2 text-xs text-muted-foreground">Loading event allocations…</p>
      </Card>
    );
  }

  if (allocationsQuery.isError || detailQuery.isError) {
    return <Card className="p-6 text-center">
      <p role="alert" className="text-xs text-destructive">Unable to load event allocations.</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={() => { allocationsQuery.refetch(); if (primaryAllocationId) detailQuery.refetch(); }}>Try again</Button>
    </Card>;
  }

  return (
    <div className="space-y-3">
      {/* Allocation Items Table Container */}
      <Card className="min-w-0 overflow-visible border-border/80 bg-card shadow-sm">
        {/* Filter / Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-border/70 p-3">
          <div className="w-full min-w-[200px] sm:w-64 sm:flex-none">
            <Label htmlFor="allocation-item-search" className="sr-only">
              Search item name or item ID
            </Label>
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
            {
              field: "category",
              label: "All Categories",
              values: [...new Set(items.map((l) => l.category).filter(Boolean))],
            },
            {
              field: "readiness",
              label: "All Allocation Status",
              values: ["Ready", "Partially Ready", "Shortage"],
            },
            {
              field: "location",
              label: "All Source Locations",
              values: [...new Set(items.map((l) => l.sourceLocation).filter(Boolean))],
            },
          ].map(({ field, label, values }) => (
            <Select key={field} value={filters[field]} onValueChange={(value) => setFilter(field, value)}>
              <SelectTrigger aria-label={label} className="h-9 w-auto min-w-[150px] flex-1 text-xs">
                <SelectValue placeholder={label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{label}</SelectItem>
                {values.map((value) => (
                  <SelectItem key={value} value={value}>
                    {allocationLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          <div className="flex shrink-0 items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={allocationReport.download}
              aria-busy={allocationReport.generating}
              disabled={allocationReport.generating || !eventId}
              className="h-9 gap-1.5 whitespace-nowrap text-xs text-primary"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download Allocation
            </Button>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="space-y-2 px-4 py-12 text-center">
            <Package className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">{items.length ? "No matching requirements" : "No allocation items"}</p>
            <p className="text-xs text-muted-foreground">
              {items.length
                ? "Adjust your search or filters to see requirement lines."
                : "Add a requirement to begin planning this allocation."}
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
            <div role="region" aria-label="Allocation items" tabIndex={0} className="hidden min-w-0 max-w-full lg:block">
              <EventInventoryScrollTable className="min-w-[1540px] table-fixed border-separate border-spacing-0 text-xs [&_thead_th]:border-b [&_tbody_td]:border-b [&_tbody_td]:border-border/70">
                <colgroup>
                  {[240, 240, 200, 160, 90, 90, 90, 90, 220, 120].map((width, index) => <col key={index} style={{ width }} />)}
                </colgroup>
                <TableHeader className="!bg-muted [&_th]:whitespace-nowrap">
                  <TableRow className="border-border/70 hover:bg-transparent [&>th]:border-r [&>th]:border-border/60 [&>th:last-child]:border-r-0">
                    <TableHead className="px-4 text-xs font-semibold text-foreground">Item</TableHead>
                    <TableHead className="text-xs font-semibold text-foreground">Category</TableHead>
                    <TableHead className="text-xs font-semibold text-foreground">Fulfilment Plan</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-foreground">Source Location</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-foreground">Required</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-foreground">Reserved</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-foreground">Available</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-foreground">
                      Shortage
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold text-foreground">
                      Status
                    </TableHead>
                    <TableHead className="px-4 text-center text-xs font-semibold text-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleItems.map((line, index) => {
                    const allocationDoc = detailQuery.data?.data?.data;
                    const returnLines = allocationDoc?.returnLines || line.owningAllocation?.returnLines || [];
                    const lineStatus = lineItemReadinessStatus(line, returnLines);
                    return (
                      <React.Fragment key={line.rowKey}>
                        {(index === 0 || visibleItems[index - 1].category !== line.category) && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={10} className={`px-4 py-1.5 ${categoryBadgeColor(line.category)}`}>
                              <div className="flex items-center gap-2 text-xs font-medium">
                                <Package className="h-3.5 w-3.5" />
                                {allocationLabel(line.category)}
                                <span className="font-normal">
                                  {filteredItems.filter((entry) => entry.category === line.category).length} items
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow className="border-border/70 hover:bg-muted/30 transition-colors [&>td]:border-r [&>td]:border-border/60 [&>td:last-child]:border-r-0">
                          <TableCell className="px-4 py-3">{renderItemIdentity(line)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`max-w-full whitespace-normal break-words rounded-md px-2.5 py-0.5 text-[11px] font-medium ${categoryBadgeColor(line.category)}`}
                            >
                              {allocationLabel(line.category)}
                            </Badge>
                          </TableCell>
                          <TableCell className="break-words [&_span]:min-w-0 [&_span]:break-words">
                            <FulfilmentPlanDisplay
                              plan={line.planning}
                              allocationPlanning={line.owningAllocation?.planning}
                              sources={sourceAllocations}
                            />
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
                          <TableCell
                            className={`text-center font-semibold tabular-nums ${stockColorClass(line.availableQuantity, line.requiredQuantity)}`}
                          >
                            {line.availableQuantity ?? "—"}
                          </TableCell>
                          <TableCell
                            className={`text-center font-semibold tabular-nums ${line.netShortage > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}
                          >
                            {line.netShortage ?? 0}
                          </TableCell>
                          <TableCell className="text-center">
                            {line.status === "Reserved" && (line.dispatchedQuantity ?? 0) === 0 && (
                              <div className="mb-1">{renderStatus(line.status)}</div>
                            )}
                            <Badge
                              variant="outline"
                              className={`inline-flex gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ALLOCATION_TONES[allocationStatusTone(lineStatus)]}`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                              {lineStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 text-center">{renderRowActions(line)}</TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </EventInventoryScrollTable>
            </div>

            {/* Mobile / Tablet Cards View */}
            <div className="overflow-hidden divide-y divide-border/70 lg:hidden">
              {visibleItems.map((line) => {
                const allocationDoc = detailQuery.data?.data?.data;
                const returnLines = allocationDoc?.returnLines || line.owningAllocation?.returnLines || [];
                const lineStatus = lineItemReadinessStatus(line, returnLines);
                return (
                  <article key={line.rowKey} className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {renderItemIdentity(line, "card")}
                      {line.status === "Reserved" && (line.dispatchedQuantity ?? 0) === 0 && renderStatus(line.status)}
                      <Badge
                        variant="outline"
                        className={`gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ALLOCATION_TONES[allocationStatusTone(lineStatus)]}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                        {lineStatus}
                      </Badge>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg bg-muted/20 p-3 text-xs sm:grid-cols-3">
                      <div>
                        <dt className="text-[10px] text-muted-foreground">Category</dt>
                        <dd className="mt-0.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-medium ${categoryBadgeColor(line.category)}`}
                          >
                            {allocationLabel(line.category)}
                          </Badge>
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-[10px] text-muted-foreground">Fulfilment Plan</dt>
                        <dd className="mt-1">
                          <FulfilmentPlanDisplay
                            plan={line.planning}
                            allocationPlanning={line.owningAllocation?.planning}
                            sources={sourceAllocations}
                          />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-muted-foreground">Source Location</dt>
                        <dd className="mt-0.5 font-medium text-foreground">{allocationLabel(line.sourceLocation)}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-muted-foreground">Required Qty</dt>
                        <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                          {line.requiredQuantity ?? "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-muted-foreground">Reserved Qty</dt>
                        <dd className="mt-0.5 font-medium tabular-nums text-muted-foreground">
                          {line.willReserve ?? 0}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-muted-foreground">Available Stock</dt>
                        <dd
                          className={`mt-0.5 font-medium tabular-nums ${stockColorClass(line.availableQuantity, line.requiredQuantity)}`}
                        >
                          {line.availableQuantity ?? "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-muted-foreground">Remaining / Shortage</dt>
                        <dd
                          className={`mt-0.5 font-medium tabular-nums ${line.netShortage > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}
                        >
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

      </Card>

      {/* Item Detail Dialog */}
      <Dialog
        open={Boolean(viewedItemId)}
        onOpenChange={(open) => {
          if (!open) setViewedItemId(null);
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base">Inventory Item</DialogTitle>
            <DialogDescription>Current inventory information for this requirement.</DialogDescription>
          </DialogHeader>
          {viewedItemQuery?.isPending ? (
            <p role="status" className="py-6 text-center text-xs text-muted-foreground">
              Loading item…
            </p>
          ) : viewedItemQuery?.isError ? (
            <div role="alert" className="space-y-2 text-xs">
              <p className="text-destructive">Unable to load this item.</p>
              <Button variant="outline" size="sm" onClick={() => viewedItemQuery.refetch()}>
                Try again
              </Button>
            </div>
          ) : viewedItem ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {renderImage(viewedItem.image, viewedItem.name)}
                <div>
                  <p className="text-sm font-semibold">{viewedItem.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{viewedItem.itemId}</p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-4 text-xs">
                {[
                  ["Category", allocationLabel(viewedItem.category)],
                  ["Default Location", allocationLabel(viewedItem.defaultLocation)],
                  ["Unit", allocationLabel(viewedItem.unit)],
                  ["Current Stock", viewedItem.currentQuantity],
                  ["Minimum Stock", viewedItem.minimumStockLevel],
                  ["Stock Status", viewedItem.stockStatus],
                  ["Item Status", allocationLabel(viewedItem.status)],
                  ["Tracking", allocationLabel(viewedItem.trackingMethod)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-medium">{value ?? "—"}</dd>
                  </div>
                ))}
              </dl>
              {viewedItem.description && <p className="text-xs text-muted-foreground">{viewedItem.description}</p>}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Item not found.</p>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewedItemId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Allocation Modal (Parity with Source UI) */}
      <Dialog
        open={Boolean(editor)}
        onOpenChange={(open) => {
          if (!open && !saveMutation.isPending) setEditor(null);
        }}
      >
        <DialogContent
          className="max-h-[92vh] max-w-3xl overflow-y-auto border-border text-foreground p-0 sm:rounded-2xl"
          onEscapeKeyDown={(event) => {
            if (saveMutation.isPending) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (saveMutation.isPending) event.preventDefault();
          }}
        >
          {editor &&
            (() => {
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
              const currentReadiness =
                allocationReadiness(line) || (currentShortage > 0 ? "Shortage" : "Ready");

              const newRequired = Math.max(0, parseInt(editor.requiredQuantity, 10) || 0);
              const newReserved = Math.min(newRequired, availableStock);
              const newShortage = Math.max(0, newRequired - availableStock);
              const newReadiness = newShortage === 0 ? "Ready" : newReserved > 0 ? "Partially Ready" : "Shortage";

              return (
                <div className="flex flex-col">
                  {/* Modal Header */}
                  <div
                    className={`flex items-start justify-between border-b border-border/70 ${editor.mode === "metadata" ? "p-5 pb-4" : "px-4 py-3"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                        <Boxes className="h-5 w-5" />
                      </div>
                      <div>
                        <DialogTitle className="text-base font-medium text-foreground">
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
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        submitAllocationEdit();
                      }}
                      className="space-y-4 p-5"
                    >
                      <div className="space-y-1.5">
                        <Label htmlFor="allocation-planned-date" className="text-xs font-semibold">
                          Planned Issue Date
                        </Label>
                        <Input
                          id="allocation-planned-date"
                          type="date"
                          value={editor.plannedIssueDate}
                          onChange={(e) =>
                            setEditor((current) => ({ ...current, plannedIssueDate: e.target.value }))
                          }
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="allocation-note" className="text-xs font-semibold">
                          Allocation Note
                        </Label>
                        <Textarea
                          id="allocation-note"
                          maxLength={500}
                          value={editor.allocationNote}
                          onChange={(e) =>
                            setEditor((current) => ({ ...current, allocationNote: e.target.value }))
                          }
                          placeholder="Add handling or dispatch instructions..."
                          className="min-h-24 text-xs"
                        />
                      </div>
                      {saveMutation.isError && (
                        <p
                          role="alert"
                          className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive"
                        >
                          {saveMutation.error?.response?.data?.message || saveMutation.error?.message}
                        </p>
                      )}
                      <div className="flex justify-end gap-2 pt-2 border-t border-border/70">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={saveMutation.isPending}
                          onClick={() => setEditor(null)}
                          className="h-9 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={saveMutation.isPending} className="h-9 text-xs">
                          {saveMutation.isPending ? "Saving…" : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        submitAllocationEdit();
                      }}
                      className="space-y-3 p-4"
                    >
                      {/* Item Identity Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-2.5">
                        <div className="flex min-w-0 items-center gap-3.5">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-background shadow-xs">
                            {itemImage ? (
                              <ItemPreviewImage
                                src={itemImage}
                                alt={itemName}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextElementSibling?.classList.remove("hidden");
                                }}
                              />
                            ) : null}
                            <Package
                              className={`h-7 w-7 text-muted-foreground ${itemImage ? "hidden" : ""}`}
                              aria-hidden="true"
                            />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <h2 className="truncate text-base font-medium text-foreground sm:text-sm">{itemName}</h2>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-semibold text-primary">{itemCode}</span>
                              <span className="text-muted-foreground/60">•</span>
                              <span className="text-muted-foreground">{itemUnit}</span>
                            </div>
                            {itemCategory && (
                              <Badge
                                variant="outline"
                                className={`mt-0.5 text-[10px] font-medium ${categoryBadgeColor(itemCategory)}`}
                              >
                                {allocationLabel(itemCategory)}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <Badge
                            variant="outline"
                            className={`gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${ALLOCATION_TONES[allocationStatusTone(currentReadiness)]}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                            {currentReadiness}
                          </Badge>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            This item is allocated for this event.
                          </p>
                        </div>
                      </div>

                      {/* Section 1: CURRENT POSITION (Live Data) */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-blue-100 bg-blue-50 px-2 py-1 dark:border-blue-900/50 dark:bg-blue-950/40">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-medium text-white">
                              1
                            </span>
                            <h3 className="text-xs font-medium uppercase tracking-wider text-blue-700 dark:text-blue-300">
                              Current Position (Live Data)
                            </h3>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            As of {formatEventDate(new Date())}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <div className="grid grid-cols-[auto_minmax(0,1fr)] content-start gap-x-2 rounded-xl border border-blue-200/70 bg-blue-50/70 px-2.5 py-2 dark:border-blue-900/40 dark:bg-blue-950/30">
                            <div className="row-span-3 mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <p className="text-[10px] font-medium text-muted-foreground">Required Quantity</p>
                            <p className="mt-0.5 text-sm font-medium tracking-tight text-foreground">
                              {currentRequired}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{itemUnit}</p>
                          </div>

                          <div className="grid grid-cols-[auto_minmax(0,1fr)] content-start gap-x-2 rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-2.5 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                            <div className="row-span-3 mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                              <ShieldCheck className="h-4 w-4" />
                            </div>
                            <p className="text-[10px] font-medium text-muted-foreground">Reserved Quantity</p>
                            <p className="mt-0.5 text-sm font-medium tracking-tight text-foreground">
                              {currentReserved}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{itemUnit}</p>
                          </div>

                          <div className="grid grid-cols-[auto_minmax(0,1fr)] content-start gap-x-2 rounded-xl border border-amber-200/70 bg-amber-50/70 px-2.5 py-2 dark:border-amber-900/40 dark:bg-amber-950/30">
                            <div className="row-span-3 mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                              <Boxes className="h-4 w-4" />
                            </div>
                            <p className="text-[10px] font-medium text-muted-foreground">
                              Available Stock{" "}
                              <span className="text-[9px]">({allocationLabel(editor.sourceLocation)})</span>
                            </p>
                            <p
                              className={`mt-0.5 text-sm font-medium tracking-tight ${stockColorClass(availableStock, currentRequired)}`}
                            >
                              {availableStock}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{itemUnit}</p>
                          </div>

                          <div className="grid grid-cols-[auto_minmax(0,1fr)] content-start gap-x-2 rounded-xl border border-rose-200/70 bg-rose-50/70 px-2.5 py-2 dark:border-rose-900/40 dark:bg-rose-950/30">
                            <div className="row-span-3 mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <p className="text-[10px] font-medium text-muted-foreground">Net Shortage</p>
                            <p
                              className={`mt-0.5 text-sm font-medium tracking-tight ${currentShortage > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}
                            >
                              {currentShortage}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {currentShortage > 0 ? "After using available stock" : "Fully covered"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: ALLOCATION DETAILS */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 dark:border-emerald-900/50 dark:bg-emerald-950/40">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-medium text-white">
                            2
                          </span>
                          <h3 className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                            Allocation Details
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
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
                                onChange={(e) =>
                                  setEditor((current) => ({ ...current, requiredQuantity: e.target.value }))
                                }
                                className="h-9 text-sm font-semibold tabular-nums pr-16"
                              />
                              <span className="pointer-events-none absolute right-3 top-2 text-xs text-muted-foreground">
                                {itemUnit}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Set the total quantity required for this event.
                            </p>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="requirement-source" className="text-xs font-semibold">
                              Source Location <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={editor.sourceLocation}
                              onValueChange={(value) =>
                                setEditor((current) => ({ ...current, sourceLocation: value }))
                              }
                            >
                              <SelectTrigger id="requirement-source" className="h-9 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                  <SelectValue placeholder="Select location" />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                {ALLOCATION_SOURCE_LOCATIONS.map((value) => (
                                  <SelectItem key={value} value={value}>
                                    {allocationLabel(value)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-[11px] text-muted-foreground">
                              Select location from where stock will be reserved.
                            </p>
                          </div>
                        </div>

                        {/* Informational Callout */}
                        <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
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
                        <div className="space-y-1">
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
                            onChange={(e) => setEditor((current) => ({ ...current, notes: e.target.value }))}
                            placeholder="e.g. Client requested 25 units for main buffet area."
                            className="min-h-14 text-xs resize-none"
                          />
                        </div>
                      </div>

                      {/* Section 3: ALLOCATION PREVIEW */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 rounded-md border border-purple-100 bg-purple-50 px-2 py-1 dark:border-purple-900/50 dark:bg-purple-950/40">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[11px] font-medium text-white">
                            3
                          </span>
                          <h3 className="text-xs font-medium uppercase tracking-wider text-purple-700 dark:text-purple-300">
                            Allocation Preview
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                          {/* Comparison Matrix Table */}
                          <div className="overflow-hidden rounded-xl border border-border/80 bg-background text-xs">
                            <div className="grid grid-cols-3 border-b border-border/70 bg-muted/40 [&>span]:px-2 [&>span]:py-1.5 [&>span:last-child]:bg-emerald-50 dark:[&>span:last-child]:bg-emerald-950/40 text-[11px] font-semibold text-foreground">
                              <span>Metric</span>
                              <span className="text-center">Current</span>
                              <span className="text-center text-emerald-700 dark:text-emerald-300">After Update</span>
                            </div>
                            <div className="divide-y divide-border/60">
                              <div className="grid grid-cols-3 items-stretch [&>span]:px-2 [&>span]:py-1.5 [&>span:nth-child(2)]:bg-muted/20 [&>span:last-child]:bg-emerald-50/70 dark:[&>span:last-child]:bg-emerald-950/30">
                                <span className="text-muted-foreground">Required</span>
                                <span className="text-center font-semibold tabular-nums">{currentRequired}</span>
                                <span className="text-center font-medium tabular-nums text-foreground">{newRequired}</span>
                              </div>
                              <div className="grid grid-cols-3 items-stretch [&>span]:px-2 [&>span]:py-1.5 [&>span:nth-child(2)]:bg-muted/20 [&>span:last-child]:bg-emerald-50/70 dark:[&>span:last-child]:bg-emerald-950/30">
                                <span className="text-muted-foreground">Reserved</span>
                                <span className="text-center font-semibold tabular-nums">{currentReserved}</span>
                                <span className="text-center font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                                  {newReserved}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 items-stretch [&>span]:px-2 [&>span]:py-1.5 [&>span:nth-child(2)]:bg-muted/20 [&>span:last-child]:bg-emerald-50/70 dark:[&>span:last-child]:bg-emerald-950/30">
                                <span className="text-muted-foreground">Available</span>
                                <span className="text-center font-semibold tabular-nums">{availableStock}</span>
                                <span className="text-center font-medium tabular-nums text-foreground">
                                  {availableStock}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 items-stretch [&>span]:px-2 [&>span]:py-1.5 [&>span:nth-child(2)]:bg-muted/20 [&>span:last-child]:bg-emerald-50/70 dark:[&>span:last-child]:bg-emerald-950/30">
                                <span className="text-muted-foreground">Net Shortage</span>
                                <span
                                  className={`text-center font-semibold tabular-nums ${currentShortage > 0 ? "text-rose-600 dark:text-rose-400" : ""}`}
                                >
                                  {currentShortage}
                                </span>
                                <span
                                  className={`text-center font-medium tabular-nums ${newShortage > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}
                                >
                                  {newShortage}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Final Status Summary Box */}
                          <div
                            className={`flex flex-col justify-between rounded-xl border p-3 text-xs ${ALLOCATION_TONES[allocationStatusTone(newReadiness)]}`}
                          >
                            <div>
                              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Final Status
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-base font-medium ${ALLOCATION_TONES[allocationStatusTone(newReadiness)]}`}
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                                  {newReadiness}
                                </Badge>
                              </div>
                              <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                                {newShortage > 0
                                  ? `${newShortage} ${itemUnit} shortage detected. Stock will be auto-reserved up to available ${availableStock} units.`
                                  : `All ${newRequired} ${itemUnit} can be fully fulfilled from ${allocationLabel(editor.sourceLocation)}.`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {saveMutation.isError && (
                        <p
                          role="alert"
                          className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive"
                        >
                          {saveMutation.error?.response?.data?.message || saveMutation.error?.message}
                        </p>
                      )}

                      {/* Modal Footer */}
                      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/70">
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
                          disabled={
                            saveMutation.isPending ||
                            (editor.mode !== "metadata" && (!editor.item || !editor.sourceLocation))
                          }
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
    </div>
  );
}

EventAllocationRequirementsSection.propTypes = {
  eventId: PropTypes.string.isRequired,
  booking: PropTypes.object,
  onCountChange: PropTypes.func,
};
