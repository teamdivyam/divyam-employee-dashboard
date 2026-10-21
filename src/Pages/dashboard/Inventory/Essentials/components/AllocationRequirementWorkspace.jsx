import { linePlanningPayload } from "../allocationPlanning";
import { AllocationPlanningFields, FulfilmentFields } from "./AllocationPlanning";

import { ItemPreviewImage } from "@components/components/InventoryItemImagePreview";

import { allocationLinePayload } from "../allocationAmendment";
import { loadActiveRequirementCatalog, requirementCatalogGroups } from "../requirementCatalog";
import { categoryOptions } from "../data/requirementCategories";

import { useParams } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { Card, CardContent } from "@components/components/ui/card";

import { Input } from "@components/components/ui/input";
import { Button } from "@components/components/ui/button";
import { Badge } from "@components/components/ui/badge";

import { Label } from "@components/components/ui/label";
import { Textarea } from "@components/components/ui/textarea";
import { Checkbox } from "@components/components/ui/checkbox";

import useDebouncedValue from "@/hooks/useDebouncedValue";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import { Search, Calendar, User, ChevronRight, ArrowLeft, AlertTriangle, Plus, Loader2, Boxes, Package, Store, Flower2, CookingPot, UtensilsCrossed, ChefHat, HandPlatter, Container, MapPin, CheckCircle2, X, Info } from "lucide-react";

import useEventInventoryService from "../useEventInventoryService";

const formatEventDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd MMM yyyy");
  } catch {
    return "—";
  }
};

const ALLOCATION_SOURCE_LOCATIONS = ["main_store", "central_store", "admin_office", "warehouse_a", "warehouse_b"];
const allocationLabel = (value) => value
  ? value.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
  : "—";
const allocationReferenceId = (value) => String(value?._id || value || "");
const ALLOCATION_TONES = {
  neutral: "border-border bg-muted text-muted-foreground",
  blue: "event-allocation-tone-1",
  green: "event-allocation-tone-2",
  amber: "event-allocation-tone-3",
  red: "event-allocation-tone-4",
};
const allocationStatusTone = (status) => ({
  Ready: "green", Confirmed: "green", Returned: "green",
  "Partially Ready": "amber", Dispatched: "amber",
  "Partially Dispatched": "amber", "Partially Returned": "amber",
  Shortage: "red", Cancelled: "red", Reserved: "blue", Planning: "blue",
}[status] || "neutral");

// ─── Per-category badge colors (consistent hash, never random) ────────────────
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
  for (let i = 0; i < category.length; i++) { h = (h << 5) - h + category.charCodeAt(i); h |= 0; }
  return CATEGORY_PALETTE[Math.abs(h) % CATEGORY_PALETTE.length];
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
  const lines = items.filter(line => line.status !== "Cancelled").map((line) => ({
    ...allocationLinePayload(line),
    ...(line._id === editor.lineId ? {
      requiredQuantity: quantity, sourceLocation: editor.sourceLocation, notes: editor.notes.trim() || null,
    } : {}),
  }));
  if (!editor.lineId) lines.push({
    item: editor.item, sourceLocation: editor.sourceLocation,
    requiredQuantity: quantity, notes: editor.notes.trim() || null,
    ...(editor.planning ? { planning: linePlanningPayload(editor.planning) } : {}),
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
const renderImage = (image, name, preview = true) => (
  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/80 bg-muted/30">
    {image ? <ItemPreviewImage preview={preview} key={image} src={image} alt={name || "Inventory item"} className="h-full w-full object-cover" onError={(event) => {
      event.target.style.display = "none";
      event.target.nextElementSibling?.classList.remove("hidden");
    }} /> : null}
    <Package className={`h-6 w-6 text-muted-foreground ${image ? "hidden" : ""}`} aria-hidden="true" />
  </div>
);

export function AllocationRequirementWorkspace({
  allocation, booking, onCancel, onSubmit, onActiveChange, onSourceAllocationChange,
  initialSelections = [], persistedSelections = null, enableSourcePlanning = true, isPending = false, error = "", showLineNotes = true, defaultSourceLocation = "", highlightCategoryHeaders = false,
}) {
  const AdminV2Service = useEventInventoryService();
  const { eventId } = useParams();
  const savedSelections = persistedSelections || (allocation?.items || []).filter(line => line.status !== "Cancelled").map(line => ({ item: allocationReferenceId(line.item), requiredQuantity: line.requiredQuantity, planning: line.planning, allocationPlanning: allocation?.planning, sourceLocation: line.sourceLocation }));
  const [localPlanning, setLocalPlanning] = useState(allocation?.planning || {});
  const effectivePlanning = onSourceAllocationChange ? allocation?.planning : localPlanning;
  const selectSourceAllocation = onSourceAllocationChange || (id => setLocalPlanning(current => ({ ...current, designatedSourceAllocation: id })));
  const [requirementCategory, setRequirementCategory] = useState(null);
  const [selectedRequirements, setSelectedRequirements] = useState(() => initialSelections);
  const requirementSummaryRef = React.useRef(null);
  const submittingRequirements = useRef(false);
  useEffect(() => { if (!isPending) submittingRequirements.current = false; }, [isPending]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [validationError, setValidationError] = useState("");
  const debouncedCatalogSearch = useDebouncedValue(catalogSearch, 300);
  // Reuse configured category identity and the existing sidebar palette in this workspace.
  const categoryVisual = category => {
    const index = categoryOptions.findIndex(option => option.value === category);
    const icons = { Store, Flower2, CookingPot, UtensilsCrossed, ChefHat, HandPlatter, Container, Package };
    return { Icon: icons[categoryOptions[index]?.icon] || Package, tone: CATEGORY_PALETTE[index] || categoryBadgeColor(category) };
  };
  const eventImage = booking?.coverImage?.small || booking?.coverImage?.medium || booking?.coverImage?.original;
  React.useEffect(() => {
    onActiveChange?.(true);
    return () => onActiveChange?.(false);
  }, [onActiveChange]);
  const catalogQuery = useQuery({
    queryKey: ["allocation-requirement-catalog", eventId, "complete"],
    queryFn: () => loadActiveRequirementCatalog(AdminV2Service.getInventoryV2Items),
    staleTime: 60 * 1000,
    retry: 1,
  });
  const catalogItems = Array.isArray(catalogQuery.data?.items) ? catalogQuery.data.items : [];

  const categoryGroups = requirementCatalogGroups(catalogItems, debouncedCatalogSearch);
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
        sourceLocation: enableSourcePlanning ? "main_store" : item.defaultLocation || defaultSourceLocation,
        requiredQuantity: 1, notes: "",
        // Display metadata stays with the selection across catalog searches/pages.
        preview: item,
        ...(enableSourcePlanning && savedSelections.find(line => line.item === item._id) ? { ...savedSelections.find(line => line.item === item._id), persisted: true } : {}),
      }))];
    });
  };
  const updateSelectedRequirement = (itemId, change) => setSelectedRequirements(current => current.map(selection => selection.item === itemId ? { ...selection, ...change } : selection));
  const removeSelectedRequirement = (itemId) => setSelectedRequirements(current => current.filter(selection => selection.item !== itemId));

  return (
    <section aria-label="Add Requirement" className="flex h-[calc(100dvh-7rem)] min-h-0 min-w-0 flex-col gap-3 text-foreground">
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary"><Boxes className="h-6 w-6" /></div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-semibold tracking-tight">Add Requirement</h1>
          <p className="mt-1 text-xs text-muted-foreground">Select items by category and define the quantity and source location for each requirement.</p>
        </div>
        <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={onCancel} className="ml-auto h-8 shrink-0 gap-1.5 px-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Allocation
        </Button>
      </div>

      <Card className="border-primary/15 bg-primary/[0.03] shadow-none shrink-0">
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-3 p-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/20 bg-primary/5 text-primary">
              {eventImage ? <img src={eventImage} alt={allocation?.eventName || "Event"} className="h-full w-full object-cover" onError={event => { event.target.style.display = "none"; event.target.nextElementSibling?.classList.remove("hidden"); }} /> : null}
              <Calendar className={`h-6 w-6 ${eventImage ? "hidden" : ""}`} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="break-words text-base font-semibold tracking-tight sm:text-sm">{allocation?.eventName || "—"}</p>
              <p className="mt-1 text-xs font-medium text-primary">{allocation?.allocationCode || "—"}</p>
              {allocation?.eventCode && <p className="mt-1 text-[11px] text-muted-foreground">{allocation.eventCode}</p>}
            </div>
          </div>
          <dl className="grid w-full grid-cols-2 gap-y-2 text-xs sm:w-auto sm:flex-1 sm:border-l sm:border-primary/15 xl:grid-cols-3 [&>div]:border-l [&>div]:border-primary/15 [&>div]:px-3 [&>div]:py-1 sm:[&>div:first-child]:border-l-0 [&_svg]:text-primary">
            {booking?.customer?.name && <div><dt className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground"><User className="h-3.5 w-3.5" />Customer</dt><dd className="break-words text-sm font-semibold text-primary">{booking.customer.name}</dd></div>}
            {allocation?.eventDate && <div><dt className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Calendar className="h-3.5 w-3.5" />Event Date</dt><dd className="text-sm font-semibold">{formatEventDate(allocation.eventDate)}</dd></div>}
            {(allocation?.venue || allocation?.city) && <div><dt className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground"><MapPin className="h-3.5 w-3.5" />Venue / City</dt><dd className="break-words text-sm font-semibold">{[allocation.venue, allocation.city].filter(Boolean).join(", ")}</dd></div>}
          </dl>
          <div className="border-l border-primary/15 pl-3"><p className="mb-1 text-[11px] text-muted-foreground">Allocation Status</p>{renderStatus(allocation?.status)}</div>
        </CardContent>
      </Card>

      {enableSourcePlanning && !onSourceAllocationChange && <AllocationPlanningFields value={localPlanning} onChange={setLocalPlanning} allocationId={allocationReferenceId(allocation?._id)} eventId={allocationReferenceId(allocation?.event)} disabled={isPending} />}

      <form onSubmit={event => {
          event.preventDefault();
            if (enableSourcePlanning && event.currentTarget.querySelector('[data-planning-error="true"]')) {
              setValidationError("Check the source quantities and eligible Event planning capacity before adding requirements.");
              return;
            }

          if (isPending || submittingRequirements.current) return;
          try {
            const additions = selectedRequirements.filter(selection => !selection.persisted);
            allocationSelectedRequirementsPayload([], additions);
            setValidationError("");
            submittingRequirements.current = true;
            onSubmit(additions, effectivePlanning);
          } catch (failure) {
            submittingRequirements.current = false;
            setValidationError(failure.message);
          }
        }} className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)] gap-3 lg:grid-cols-3 lg:grid-rows-[auto_minmax(0,1fr)] 2xl:grid-cols-12 2xl:grid-rows-[minmax(0,1fr)]">
          <nav aria-label="Inventory categories" className="min-h-0 min-w-0 max-h-[35dvh] overflow-y-auto overscroll-contain lg:col-span-3 2xl:col-span-2 2xl:max-h-full col-start-1 row-start-1">
            <Card className="overflow-hidden border-border/80 bg-card shadow-none">
              <div className="border-b border-primary/15 bg-primary/5 px-4 py-3">
                <h2 className="text-sm font-semibold">Categories</h2>
                <p className="mt-1 text-[11px] text-muted-foreground">All active inventory items</p>
              </div>
              <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-1">
                <button type="button" aria-pressed={activeCategory === null} onClick={() => setRequirementCategory(null)} className={`flex items-center justify-between gap-2 rounded-md border p-3 text-left text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeCategory === null ? "border-primary/30 bg-primary/10 text-primary" : "border-primary/15 bg-primary/5 text-primary hover:bg-primary/10"}`}>
                  <span className="flex items-center gap-2"><Boxes className="h-4 w-4 shrink-0" />All Categories</span>
                  <span className="tabular-nums">{catalogQuery.isFetching || catalogQuery.isError ? "—" : categoryGroups.reduce((count, [, entries]) => count + entries.length, 0)}</span>
                </button>
                {!catalogQuery.isFetching && !catalogQuery.isError && categoryGroups.map(([category, entries]) => {
                  const { Icon, tone } = categoryVisual(category);
                  return (
                  <button key={category} type="button" aria-pressed={activeCategory === category} onClick={() => setRequirementCategory(category)} className={`flex items-center gap-2.5 rounded-md border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tone} ${activeCategory === category ? "ring-1 ring-inset ring-current" : "hover:brightness-95 dark:hover:brightness-110"}`}>
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0"><span className="block break-words text-xs font-medium">{allocationLabel(category)}</span><span className="mt-1 block text-[11px] text-muted-foreground">{entries.length} {entries.length === 1 ? "item" : "items"}{entries.some(item => selectedItemIds.has(item._id)) ? ` · ${entries.filter(item => selectedItemIds.has(item._id)).length} selected` : ""}</span></span>
                  </button>
                ); })}
              </div>
            </Card>
          </nav>

          <div className="row-start-3 flex min-h-0 min-w-0 flex-col gap-3 lg:col-span-2 lg:col-start-1 lg:row-start-2 2xl:col-span-7 2xl:col-start-3 2xl:row-start-1">
            <Card className="border-border/80 bg-card shadow-none shrink-0">
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">Choose Inventory Items</h2><span className="text-[11px] text-muted-foreground">Select across categories</span></div>
                <div className="relative">
                  <Label htmlFor="requirement-catalog-search" className="sr-only">Search inventory by name</Label>
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input id="requirement-catalog-search" autoFocus placeholder="Search inventory by name..." value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} className="h-9 pl-9 text-xs" />
                </div>
                {selectedRequirements.length > 0 && <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-0 text-xs text-primary lg:hidden" onClick={() => { requirementSummaryRef.current?.scrollIntoView({ block: "start" }); requirementSummaryRef.current?.focus({ preventScroll: true }); }}>{selectedRequirements.length} selected · Review requirements<ChevronRight className="h-3.5 w-3.5" /></Button>}
              </CardContent>
            </Card>

            <div role="region" aria-label="Inventory item results" tabIndex={0} className="relative min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {catalogQuery.isFetching ? (
              <Card className="border-border/80 shadow-none"><CardContent role="status" className="flex items-center justify-center gap-2 py-12 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading inventory…</CardContent></Card>
            ) : catalogQuery.isError ? (
              <Card className="border-border/80 shadow-none"><CardContent role="alert" className="space-y-3 py-10 text-center"><AlertTriangle className="mx-auto h-6 w-6 text-destructive" /><p className="text-sm font-medium">Unable to load inventory.</p><Button type="button" variant="outline" size="sm" onClick={() => catalogQuery.refetch()}>Try again</Button></CardContent></Card>
            ) : (activeCategory === null && categoryGroups.every(([, entries]) => entries.length === 0)) ? (
              <Card className="border-border/80 shadow-none"><CardContent className="space-y-2 py-12 text-center"><Package className="mx-auto h-7 w-7 text-muted-foreground" /><p className="text-sm font-medium">No active inventory items found.</p><p className="text-xs text-muted-foreground">{catalogSearch ? "Try another item name. Your selected requirements are kept." : "Active inventory items will appear here."}</p></CardContent></Card>
            ) : displayedGroups.map(([category, entries]) => {
              const { Icon, tone } = categoryVisual(category);
              return (
              <Card key={category} className="overflow-hidden border-border/80 bg-card shadow-none">
                <section aria-label={`${allocationLabel(category)} inventory`}>
                  <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${tone} ${highlightCategoryHeaders ? "font-medium" : ""}`}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${tone}`}><Icon className="h-5 w-5" aria-hidden="true" /></div>
                      <h3 className="break-words text-sm font-semibold">{allocationLabel(category)}</h3>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 rounded-md border border-primary/15 bg-background/80 px-2 py-1.5 text-primary">
                      <Checkbox id={`requirement-category-${category}`} className="border-primary/60 data-[state=checked]:bg-primary data-[state=indeterminate]:text-primary" aria-label={`Select shown ${allocationLabel(category)} items`} disabled={entries.length === 0} checked={entries.length > 0 && entries.every(item => selectedItemIds.has(item._id)) ? true : entries.some(item => selectedItemIds.has(item._id)) ? "indeterminate" : false} onCheckedChange={value => selectRequirementItems(entries, value === true)} />
                      <Label htmlFor={`requirement-category-${category}`} className="cursor-pointer text-[11px] font-semibold text-primary">Select shown ({entries.length})</Label>
                    </div>
                  </div>
                  <div className="hidden grid-cols-[minmax(0,1fr)_88px_128px] border-b border-border/70 bg-muted pl-[42px] text-[11px] font-semibold text-foreground sm:grid [&>span]:border-l [&>span]:border-border/70 [&>span]:px-3 [&>span]:py-2"><span>Item</span><span className="text-center">Available Qty</span><span>Default Location</span></div>
                  <div className="divide-y divide-border/70">
                    {entries.length === 0 && <p className="p-4 text-xs text-muted-foreground">No matching active items in this category.</p>}
                    {entries.map(item => {
                      const checked = selectedItemIds.has(item._id);
                      return (
                        <div key={item._id} className={`flex items-start border-l-2 sm:items-center ${checked ? "border-l-primary bg-primary/5" : "border-l-transparent hover:bg-muted/30"}`}>
                          <Checkbox id={`requirement-item-${item._id}`} checked={checked} onCheckedChange={value => selectRequirementItems([item], value === true)} className="mx-3 mt-5 shrink-0 sm:mt-0" />
                          <div className="grid min-w-0 flex-1 grid-cols-2 sm:grid-cols-[minmax(0,1fr)_88px_128px] sm:items-stretch [&>div]:border-l [&>div]:border-border/70 [&>div]:px-3 [&>div]:py-2">
                            <div className="col-span-2 flex min-w-0 items-center gap-2.5 sm:col-span-1">
                              {renderImage(item.image, item.name)}
                              <div className="min-w-0">
                                <Label htmlFor={`requirement-item-${item._id}`} className="cursor-pointer break-words text-xs font-semibold">{item.name || "—"}</Label>
                                <p className="mt-1 text-[11px] text-muted-foreground">{[item.itemId, item.unit].filter(Boolean).join(" · ") || "—"}</p>
                                {checked && <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary"><CheckCircle2 className="h-3 w-3" />Selected</span>}
                              </div>
                            </div>
                            <div className="flex flex-col justify-center text-center"><p className="text-[10px] text-muted-foreground sm:sr-only">Available Qty</p><p className={`mt-1 text-sm font-semibold tabular-nums sm:mt-0 ${item.stockStatus === "In Stock" ? "text-emerald-600 dark:text-emerald-400" : item.stockStatus === "Low Stock" ? "text-amber-600 dark:text-amber-400" : item.stockStatus === "Out of Stock" ? "text-rose-600 dark:text-rose-400" : ""}`}>{item.currentQuantity ?? "—"}</p></div>
                            <div className="flex flex-col justify-center"><p className="text-[10px] text-muted-foreground sm:sr-only">Default Location</p><p className="mt-1 flex items-center gap-1 text-[11px] sm:mt-0"><MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />{allocationLabel(item.defaultLocation)}</p></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </Card>
            ); })}

            </div>
          </div>

          <aside ref={requirementSummaryRef} tabIndex={-1} aria-label="Selected requirements" className="row-start-2 flex min-h-0 min-w-0 flex-col scroll-mt-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:col-start-3 lg:row-start-2 2xl:col-span-3 2xl:col-start-10 2xl:row-start-1">
            <Card className="overflow-hidden border-border/80 bg-card shadow-none flex min-h-0 flex-col">
              <div className="flex items-center justify-between gap-2 border-b border-primary/15 bg-primary/5 px-4 py-3 shrink-0">
                <h2 className="text-sm font-semibold">Selected Requirements</h2>
                <Badge variant="outline" className={`shrink-0 text-[10px] ${selectedRequirements.length ? ALLOCATION_TONES.green : ALLOCATION_TONES.neutral}`}>{selectedRequirements.length} selected</Badge>
              </div>
              <div className="relative min-h-0 divide-y divide-border/70 lg:overflow-y-auto">
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
                    {!enableSourcePlanning && <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-3">
                      <div className="space-y-1.5"><Label htmlFor={`requirement-quantity-${selection.item}`} className="text-[11px]">Required Qty</Label><Input id={`requirement-quantity-${selection.item}`} type="number" min={1} step={1} required value={selection.requiredQuantity} onChange={e => updateSelectedRequirement(selection.item, { requiredQuantity: e.target.value })} className="h-9 text-xs tabular-nums" /></div>
                      <div className="min-w-0 space-y-1.5"><Label htmlFor={`requirement-source-${selection.item}`} className="text-[11px]">Source Location</Label><Select value={selection.sourceLocation} onValueChange={value => updateSelectedRequirement(selection.item, { sourceLocation: value })}><SelectTrigger id={`requirement-source-${selection.item}`} className="h-9 text-xs"><SelectValue placeholder="Select location" /></SelectTrigger><SelectContent>{ALLOCATION_SOURCE_LOCATIONS.map(value => <SelectItem key={value} value={value}>{allocationLabel(value)}</SelectItem>)}</SelectContent></Select></div>
                    </div>}
                    {enableSourcePlanning && <FulfilmentFields value={selection.planning} onChange={value => updateSelectedRequirement(selection.item, { planning: value })} requiredQuantity={selection.requiredQuantity} onRequiredQuantityChange={quantity => updateSelectedRequirement(selection.item, { requiredQuantity: quantity, ...(selection.planning?.fulfilmentPlan === "MAIN_STORE" ? { planning: { ...selection.planning, mainStoreQuantity: Number(quantity) } } : {}) })} item={catalogItems.find(item => item._id === selection.item) || { ...selection.preview, _id: selection.item }} allocationPlanning={selection.allocationPlanning || effectivePlanning} persisted={selection.persisted} destinationEventId={allocationReferenceId(allocation?.event || allocation?._id)} onSourceAllocationChange={selectSourceAllocation} disabled={isPending || selection.persisted} />}
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
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-primary/15 bg-primary/5 p-3 text-[11px] text-muted-foreground shrink-0"><Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Requirements are for planning. Adding an item does not reserve or issue physical stock.</p>
          </aside>
        </div>

        {(error || validationError) && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">{error || validationError}</p>}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-card p-4">
          <Button type="button" variant="outline" disabled={isPending} onClick={onCancel} className="h-9 text-xs">Cancel</Button>
          <div className="flex items-center gap-3"><span className="hidden text-xs text-muted-foreground sm:inline">{selectedRequirements.length} {selectedRequirements.length === 1 ? "item" : "items"} selected</span><Button type="submit" disabled={isPending || !selectedRequirements.some(selection => !selection.persisted) || selectedRequirements.some(selection => !selection.item || !selection.sourceLocation)} className="h-9 gap-1.5 text-xs">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{isPending ? "Saving…" : selectedRequirements.length ? `Add ${selectedRequirements.length} Selected ${selectedRequirements.length === 1 ? "Item" : "Items"}` : "Add Requirements"}</Button></div>
        </div>
      </form>
    </section>
  );

}
AllocationRequirementWorkspace.propTypes = {
  enableSourcePlanning: PropTypes.bool,
  onSourceAllocationChange: PropTypes.func,
  persistedSelections: PropTypes.array,
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
  highlightCategoryHeaders: PropTypes.bool,
};

