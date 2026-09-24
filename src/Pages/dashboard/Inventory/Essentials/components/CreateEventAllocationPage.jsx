import { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import { Textarea } from "@components/components/ui/textarea";
import {
  Calendar,
  User,
  MapPin,
  ArrowLeft,
  Plus,
  Trash2,
  Boxes,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import AdminService from "../../../../../services/event-booking-workspace.service";
import { getBookings } from "../../../event-booking-workspace/components/EventBookingComponents";

// ─── Canonical Locations from Inventory V2 ─────────────────────────────────────
const SOURCE_LOCATIONS = [
  { value: "main_store", label: "Main Store" },
  { value: "central_store", label: "Central Store" },
  { value: "admin_office", label: "Admin Office" },
  { value: "warehouse_a", label: "Warehouse A" },
  { value: "warehouse_b", label: "Warehouse B" },
];

// ─── Color Palette & Helper Functions ──────────────────────────────────────────
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
  for (let i = 0; i < category.length; i++) {
    h = (h << 5) - h + category.charCodeAt(i);
    h |= 0;
  }
  return CATEGORY_PALETTE[Math.abs(h) % CATEGORY_PALETTE.length];
};

const formatCategoryLabel = (val) => {
  if (!val) return "Essentials";
  return val
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

export default function CreateEventAllocationPage({ onBack, RequirementWorkspace, onRequirementWorkspaceChange, initialEvent = null, onCreated, hideCloseButton = false, hideBackButton = false, reviewAllocation = null, onPrepare, preparePending = false, prepareError = "" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const isReview = Boolean(reviewAllocation);
  const pageTitle = isReview ? "Prepare Issue" : "Create Allocation";

  // Form State
  const [selectedEventId, setSelectedEventId] = useState(
    initialEvent?._id
      ? String(initialEvent._id)
      : initialEvent?.id
      ? String(initialEvent.id)
      : searchParams.get("eventId") || ""
  );
  const [allocationOwner, setAllocationOwner] = useState(reviewAllocation ? reviewAllocation.createdBy?.fullName || "—" : "Saurabh Dwivedi");
  const [plannedIssueDate, setPlannedIssueDate] = useState(reviewAllocation?.plannedIssueDate ? format(new Date(reviewAllocation.plannedIssueDate), "yyyy-MM-dd") : "");
  const [allocationNote, setAllocationNote] = useState(reviewAllocation?.allocationNote || "");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Sync selectedEventId if initialEvent prop changes
  useEffect(() => {
    if (initialEvent?._id || initialEvent?.id) {
      setSelectedEventId(String(initialEvent._id || initialEvent.id));
    }
  }, [initialEvent]);

  // Requirement items array
  const [requirementLines, setRequirementLines] = useState(() => (reviewAllocation?.items || []).map(line => ({
    ...line,
    id: line._id,
    itemId: String(line.item?._id || line.item),
    sku: line.itemId,
    requiredQty: line.requiredQuantity,
  })));

  // Shared requirement workspace
  const [isRequirementWorkspaceOpen, setIsRequirementWorkspaceOpen] = useState(false);

  // ─── Query 1: Real Booked Events ─────────────────────────────────────────────
  const { data: eventsData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["create-allocation-events"],
    enabled: !isReview,
    queryFn: async () => {
      const res = await AdminService.getEventBookings({ page: 1, limit: 100 });
      return res.data;
    },
  });
  const bookedEvents = useMemo(() => {
    if (isReview) return initialEvent ? [initialEvent] : [];
    const list = [...getBookings(eventsData)];
    const initialId = initialEvent?._id || initialEvent?.id;
    if (initialId && !list.some((event) => String(event._id || event.id) === String(initialId))) {
      list.unshift(initialEvent._id ? initialEvent : { ...initialEvent, _id: initialId });
    }
    return list.filter((e) => {
      if (!e || (!e._id && !e.id)) return false;
      // Filter out cancelled or on-hold events
      if (["Cancelled", "On Hold"].includes(e.bookingStatus)) return false;
      return true;
    });
  }, [eventsData, initialEvent, isReview]);

  // Currently selected event object
  const selectedEvent = useMemo(() => {
    if (isReview) return initialEvent;
    return bookedEvents.find((e) => String(e._id || e.id) === String(selectedEventId)) || null;
  }, [bookedEvents, selectedEventId, isReview, initialEvent]);

  const selectedCrmId = String(selectedEvent?.crmCustomerId?._id || selectedEvent?.crmCustomerId || selectedEvent?.customer?._id || "");
  const existingRequirements = useQuery({
    queryKey: ["inventoryv2-allocations", "create-requirements", selectedEventId, selectedCrmId],
    enabled: !isReview && Boolean(selectedEvent),
    queryFn: async () => {
      // Reuse the listing's Event/CRM relationships and load every page: taking
      // only the newest allocation would silently discard older saved lines.
      const allocations = [];
      let page = 1;
      let hasNextPage;
      do {
        const response = await AdminService.listCompanyInventoryAllocations({ eventId: selectedEventId, page, limit: 100 });
        const data = response.data?.data;
        if (!Array.isArray(data?.entries) || !data.pagination) throw new Error("Unable to load existing allocation requirements.");
        allocations.push(...data.entries);
        hasNextPage = data.pagination.hasNextPage;
        page += 1;
      } while (hasNextPage);
      return allocations.filter(allocation =>
        String(allocation.event?._id || allocation.event || "") === selectedEventId
        || (!allocation.event && selectedCrmId && String(allocation.crmCustomerId?._id || allocation.crmCustomerId || "") === selectedCrmId)
      ).flatMap(allocation => {
        if (!Array.isArray(allocation.items)) throw new Error("Existing allocation requirements are unavailable.");
        return allocation.items.map(line => {
          const itemId = String(line.item?._id || line.item || "");
          if (!line._id || !itemId) throw new Error("An existing requirement is missing its item or line identity.");
          return {
            ...line,
            id: line._id,
            allocationId: allocation._id,
            saved: true,
            itemId,
            sku: line.itemId,
            requiredQty: line.requiredQuantity,
            // Keep server stock values and persisted status; do not rebuild a
            // saved requirement from the active-item catalog.
            availableToReserve: line.availableQuantity,
          };
        });
      });
    },
    retry: 1,
  });
  const savedRequirementLines = useMemo(
    () => !isReview && selectedEvent ? existingRequirements.data || [] : [],
    [selectedEvent, existingRequirements.data, isReview]
  );
  const requirementsLoading = !isReview && Boolean(selectedEventId) && (isLoadingEvents || existingRequirements.isPending);
  const requirementsUnavailable = !isReview && Boolean(selectedEventId) && (requirementsLoading || existingRequirements.isError);
  const savedItemIds = new Set(savedRequirementLines.map(line => line.itemId));
  const pendingRequirementLines = requirementLines.filter(line => !savedItemIds.has(line.itemId));

  const handleEventChange = (eventId) => {
    setRequirementLines([]);
    setCategoryFilter("all");
    setIsRequirementWorkspaceOpen(false);
    setSelectedEventId(eventId);
  };

  // Auto-set planned issue date when event is selected
  useEffect(() => {
    if (!isReview && selectedEvent?.eventDate && !plannedIssueDate) {
      try {
        const d = new Date(selectedEvent.eventDate);
        d.setDate(d.getDate() - 1);
        setPlannedIssueDate(format(d, "yyyy-MM-dd"));
      } catch {
        // ignore
      }
    }
  }, [selectedEvent, plannedIssueDate, isReview]);

  // ─── Query 2: Real Inventory Items ───────────────────────────────────────────
  const { data: inventoryData } = useQuery({
    queryKey: ["create-allocation-inventory-items"],
    queryFn: async () => {
      const res = await AdminService.getCompanyInventoryItems({ eventId: selectedEventId, limit: 100, status: "active" });
      return res.data;
    },
  });

  const inventoryItems = useMemo(() => {
    const data = inventoryData?.data || inventoryData || {};
    return Array.isArray(data.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : [];
  }, [inventoryData]);

  // ─── Dynamic Stock Calculations for Requirement Lines ────────────────────────
  const enrichedRequirementLines = useMemo(() => {
    const allocatedByItem = new Map();

    const savedItems = new Set(savedRequirementLines.map(line => line.itemId));
    const pendingLines = requirementLines.filter(line => !savedItems.has(line.itemId)).map((line) => {
      const item = inventoryItems.find((i) => i._id === line.itemId) || {};
      // Review starts from this allocation's server availability, including other
      // reservations. Reuse the same sequential calculation for edited/new lines.
      const reviewStock = reviewAllocation?.items.find(existing => String(existing.item?._id || existing.item) === line.itemId)?.availableQuantity;
      const totalAvailable = Number(isReview
        ? reviewStock ?? line.availableQuantity ?? item.availableQuantity ?? item.currentQuantity ?? 0
        : item.currentQuantity ?? item.availableQuantity ?? 0);
      const previouslyClaimed = allocatedByItem.get(line.itemId) || 0;
      const remainingAvailable = Math.max(0, totalAvailable - previouslyClaimed);

      const required = Number(line.requiredQty || 0);
      const willReserve = Math.min(required, remainingAvailable);
      const netShortage = Math.max(0, required - willReserve);

      allocatedByItem.set(line.itemId, previouslyClaimed + willReserve);

      let status = "Ready";
      if (netShortage > 0 && willReserve > 0) {
        status = "Partially Ready";
      } else if (netShortage > 0 && willReserve === 0 && required > 0) {
        status = "Shortage";
      }

      return {
        ...line,
        itemName: (isReview && line.itemName) || item.name || line.itemName || "Item",
        category: (isReview && line.category) || item.category || line.category || "essentials",
        sku: (isReview && line.sku) || item.sku || item.itemId || line.sku || "—",
        unit: (isReview && line.unit) || item.unit || "Piece",
        image: (isReview && line.image) || item.image || null,
        availableToReserve: remainingAvailable,
        totalItemStock: totalAvailable,
        willReserve,
        netShortage,
        status,
      };
    });
    return [...savedRequirementLines, ...pendingLines];
  }, [requirementLines, inventoryItems, savedRequirementLines, isReview, reviewAllocation]);

  // ─── Allocation Summary Metrics ──────────────────────────────────────────────
  const summary = useMemo(() => {
    const totalLines = enrichedRequirementLines.length;
    const readiness = (line) => line.saved
      ? line.netShortage === 0 ? "Ready" : line.willReserve > 0 ? "Partially Ready" : "Shortage"
      : line.status;
    const readyLines = enrichedRequirementLines.filter((l) => readiness(l) === "Ready").length;
    const partiallyReadyLines = enrichedRequirementLines.filter(
      (l) => readiness(l) === "Partially Ready"
    ).length;
    const shortageLines = enrichedRequirementLines.filter((l) => readiness(l) === "Shortage").length;

    const totalRequired = enrichedRequirementLines.reduce(
      (acc, l) => acc + Number(l.requiredQty || 0),
      0
    );
    const totalReserved = enrichedRequirementLines.reduce(
      (acc, l) => acc + Number(l.willReserve || 0),
      0
    );
    const progressPercent =
      totalRequired > 0 ? Math.round((totalReserved / totalRequired) * 100) : 0;

    return {
      totalLines,
      readyLines,
      partiallyReadyLines,
      shortageLines,
      progressPercent,
    };
  }, [enrichedRequirementLines]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleApplyRequirements = (selections) => {
    const additions = selections.filter(selection => !savedItemIds.has(selection.item)
      && (!isReview || !requirementLines.some(line => line.itemId === selection.item)));
    setRequirementLines(current => {
      const merged = [...current];
      for (const selection of additions) {
        // Existing rows (including separate persisted lines for one item) stay
        // intact. Reopening Add Items must not append the same selection twice.
        if (isReview && merged.some(line => line.itemId === selection.item)) continue;
        const existingIndex = isReview ? -1 : merged.findIndex(line => line.itemId === selection.item);
        const existing = merged[existingIndex];
        const line = {
          ...existing,
          id: existing?.id || `line-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          itemId: selection.item,
          itemName: selection.itemName,
          category: selection.preview?.category,
          sku: selection.preview?.sku || selection.preview?.itemId,
          requiredQty: Number(selection.requiredQuantity),
          sourceLocation: selection.sourceLocation,
          ...(isReview ? { notes: selection.notes || null, availableQuantity: selection.preview?.availableQuantity ?? selection.preview?.currentQuantity, image: selection.preview?.image, unit: selection.preview?.unit } : {}),
        };
        if (existingIndex === -1) merged.push(line);
        else merged[existingIndex] = line;
      }
      return merged;
    });
    setIsRequirementWorkspaceOpen(false);
    toast.success(additions.length < selections.length
      ? "Existing allocated items preserved; new requirements added to draft"
      : "Requirements updated in allocation draft");
  };

  const handleUpdateLine = (id, field, value) => {
    setRequirementLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    );
  };

  const handleRemoveLine = (id) => {
    setRequirementLines((prev) => prev.filter((line) => line.id !== id));
  };

  // ─── Filtered Categories for Table View ──────────────────────────────────────
  const distinctCategories = useMemo(() => {
    const cats = new Set(enrichedRequirementLines.map((l) => l.category));
    return Array.from(cats);
  }, [enrichedRequirementLines]);

  const displayedLines = useMemo(() => {
    if (categoryFilter === "all") return enrichedRequirementLines;
    return enrichedRequirementLines.filter((l) => l.category === categoryFilter);
  }, [enrichedRequirementLines, categoryFilter]);

  // Group displayed lines by category
  const groupedLines = useMemo(() => {
    const groups = {};
    displayedLines.forEach((line) => {
      const cat = line.category || "essentials";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(line);
    });
    return groups;
  }, [displayedLines]);

  // ─── Submit Mutation ─────────────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEventId) {
        throw new Error("Please select an event for this allocation.");
      }
      if (requirementsUnavailable) throw new Error("Wait for existing requirements to load before creating an allocation.");
      if (pendingRequirementLines.length === 0) {
        throw new Error("Please add at least one new requirement item.");
      }

      const isCrm = Boolean(
        selectedEvent?.isCrmOnly ||
        selectedEvent?.crmCustomerId ||
        (typeof selectedEventId === "string" && selectedEventId.startsWith("crm-"))
      );
      const rawCrmCustomerId = selectedEvent?.crmCustomerId || selectedEvent?.customer?._id;

      const payload = {
        ...(isCrm && rawCrmCustomerId ? { crmCustomerId: rawCrmCustomerId } : { event: selectedEventId }),
        plannedIssueDate: plannedIssueDate ? new Date(plannedIssueDate).toISOString() : null,
        allocationNote: allocationNote.trim() || null,
        status: "Draft",
        // POST creates a new allocation. Saved lines already belong to their
        // original allocations and must never be submitted again as new rows.
        items: pendingRequirementLines.map((line) => ({
          item: line.itemId,
          sourceLocation: line.sourceLocation || "main_store",
          requiredQuantity: Number(line.requiredQty),
        })),
      };

      const res = await AdminService.createCompanyInventoryAllocation({ eventId: selectedEventId, payload });
      return res.data;
    },
    onSuccess: (responseData) => {
      toast.success("Event Allocation created successfully!");
      queryClient.invalidateQueries({ queryKey: ["inventoryv2-allocations"] });

      const allocationId =
        responseData?.allocation?._id ||
        responseData?.data?._id ||
        responseData?._id ||
        null;

      if (onCreated) {
        onCreated(responseData);
        return;
      }

      if (allocationId) {
        const next = new URLSearchParams(searchParams);
        next.set("tab", "event-allocation");
        next.set("allocationId", allocationId);
        next.delete("action");
        next.delete("eventId");
        setSearchParams(next);
      } else {
        onBack();
      }
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err.message ||
          "Failed to create allocation"
      );
    },
  });

  const submissionPending = isReview ? preparePending : submitMutation.isPending;

  if (isRequirementWorkspaceOpen) {
    return <RequirementWorkspace
      allocation={reviewAllocation || { ...selectedEvent, status: "Draft" }}
      booking={selectedEvent}
      initialSelections={isReview ? [] : pendingRequirementLines.map(line => ({
        item: line.itemId,
        itemName: line.itemName,
        lineId: null,
        requiredQuantity: line.requiredQty,
        sourceLocation: line.sourceLocation,
        notes: "",
        preview: inventoryItems.find(item => item._id === line.itemId) || {
          name: line.itemName, itemId: line.sku, category: line.category,
        },
      }))}
      defaultSourceLocation="main_store"
      showLineNotes={false}
      onCancel={() => setIsRequirementWorkspaceOpen(false)}
      onSubmit={handleApplyRequirements}
      onActiveChange={onRequirementWorkspaceChange}
    />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header matching Reference ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>Inventory & Essentials</span>
            <span>&gt;</span>
            <span className="text-foreground font-medium">{pageTitle}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground sm:text-xl">{pageTitle}</h1>
              <p className="text-xs text-muted-foreground">
                {isReview ? `Review allocation ${reviewAllocation.allocationCode || ""} and verify requirements before preparing the issue.` : "Create a new inventory allocation for an event and reserve required stock."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!hideBackButton && <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            disabled={isReview && preparePending}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Inventory
          </Button>}
          {!hideCloseButton && <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            disabled={isReview && preparePending}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>}
        </div>
      </div>

      {isReview && prepareError && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-semibold">Unable to prepare issue</p>
          <p className="text-xs">{prepareError}</p>
        </div>
      )}

      {/* ── Section 1: Event Details ── */}
      <Card className="border border-border/80 bg-card shadow-xs">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                1
              </span>
              <h2 className="text-sm font-semibold text-foreground">Event Details</h2>
            </div>
            <span className="text-[11px] text-muted-foreground italic">
              Event date, venue and client details are auto-filled from the selected event.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event Selector */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Select Event <span className="text-rose-500">*</span>
              </label>
              <Select value={selectedEventId} onValueChange={handleEventChange} disabled={isReview || isLoadingEvents}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Search or select a booked event..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {bookedEvents.map((evt) => {
                    const code = evt.eventCode || (evt._id ? `BK-${String(evt._id).slice(-6).toUpperCase()}` : "No Code");
                    return (
                      <SelectItem key={evt._id} value={evt._id} className="text-xs">
                        {evt.eventName || evt.eventType || "Event"} ({code}) — {evt.customer?.name || "Client"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Event Card Banner */}
            {selectedEvent && (
              <div className="md:col-span-2 rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm overflow-hidden border border-blue-300/50">
                      {selectedEvent.coverImage?.small || selectedEvent.coverImage?.medium ? (
                        <img
                          src={selectedEvent.coverImage?.small || selectedEvent.coverImage?.medium}
                          alt={selectedEvent.eventName || "Event"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Calendar className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {selectedEvent.eventName || selectedEvent.eventType || "Event"}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <span>Booking ID:</span>
                        <span className="font-semibold text-foreground">
                          {selectedEvent.eventCode || (selectedEvent._id ? `BK-${String(selectedEvent._id).slice(-6).toUpperCase()}` : "—")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-muted-foreground/70">Client / Family</div>
                        <div className="font-semibold text-foreground">{selectedEvent.customer?.name || "—"}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        <Calendar className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-muted-foreground/70">Event Date</div>
                        <div className="font-semibold text-foreground">
                          {selectedEvent.eventDate ? format(new Date(selectedEvent.eventDate), "dd MMM yyyy") : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-muted-foreground/70">Venue</div>
                        <div className="font-semibold text-foreground">{selectedEvent.venue || selectedEvent.city || "—"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Allocation Owner */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Allocation Owner <span className="text-rose-500">*</span>
              </label>
              <Input
                value={allocationOwner}
                readOnly={isReview}
                onChange={(e) => setAllocationOwner(e.target.value)}
                placeholder={isReview ? "—" : "e.g. Saurabh Dwivedi"}
                className="h-10 text-xs"
              />
            </div>

            {/* Planned Issue Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Planned Issue Date <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={plannedIssueDate}
                disabled={isReview && preparePending}
                onChange={(e) => setPlannedIssueDate(e.target.value)}
                className="h-10 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Requirement Lines ── */}
      <Card className="border border-border/80 bg-card shadow-xs">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                2
              </span>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Requirement Lines</h2>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Category</span>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 w-[160px] text-xs">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All Categories ({enrichedRequirementLines.length})
                    </SelectItem>
                    {distinctCategories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {formatCategoryLabel(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                size="sm"
                onClick={() => setIsRequirementWorkspaceOpen(true)}
                disabled={requirementsUnavailable || (isReview && preparePending)}
                className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Requirement Items
              </Button>
            </div>
          </div>

          {/* Table */}
          {requirementsLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-xs text-muted-foreground" role="status">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading requirement lines...
            </div>
          ) : !isReview && existingRequirements.isError && selectedEventId ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-xs text-destructive">Unable to load existing requirement lines.</p>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => existingRequirements.refetch()}>Retry</Button>
            </div>
          ) : enrichedRequirementLines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">No requirement items added yet</p>
                <p className="text-[11px] text-muted-foreground">
                  Click &ldquo;+ Add Requirement Items&rdquo; to select items and calculate stock allocation.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsRequirementWorkspaceOpen(true)}
                disabled={requirementsUnavailable || (isReview && preparePending)}
                className="gap-1.5 text-xs font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Items Now
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedLines).map(([category, lines]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs font-bold text-foreground">
                      {formatCategoryLabel(category)}
                    </span>
                    <span className="text-[10px] rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                      {lines.length} {lines.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-border/70 overflow-hidden">
                    <Table className="text-xs">
                      <TableHeader className="bg-muted/30">
                        <TableRow className="border-border/70 hover:bg-transparent">
                          <TableHead className="w-56 px-4 text-xs font-semibold text-foreground">Item</TableHead>
                          <TableHead className="w-36 text-xs font-semibold text-foreground">Category</TableHead>
                          <TableHead className="w-28 text-center text-xs font-semibold text-foreground">Required Qty</TableHead>
                          <TableHead className="w-40 text-xs font-semibold text-foreground">Source Location</TableHead>
                          <TableHead className="w-32 text-center text-xs font-semibold text-foreground">Available to Reserve</TableHead>
                          <TableHead className="w-28 text-center text-xs font-semibold text-foreground">Will Reserve</TableHead>
                          <TableHead className="w-28 text-center text-xs font-semibold text-foreground">Net Shortage</TableHead>
                          <TableHead className="w-32 text-center text-xs font-semibold text-foreground">Status</TableHead>
                          <TableHead className="w-16 px-4 text-center text-xs font-semibold text-foreground">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lines.map((line) => (
                          <TableRow key={line.id} className="border-border/70 hover:bg-muted/20 transition-colors">
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/80 bg-muted/30">
                                  {line.image ? (
                                    <img
                                      src={line.image}
                                      alt={line.itemName}
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                        e.target.nextElementSibling?.classList.remove("hidden");
                                      }}
                                    />
                                  ) : null}
                                  <Package className={`h-5 w-5 text-muted-foreground ${line.image ? "hidden" : ""}`} />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-foreground truncate">{line.itemName}</div>
                                  <div className="text-[10px] text-muted-foreground">{line.sku}</div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline" className={`whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-medium ${categoryBadgeColor(line.category)}`}>
                                {formatCategoryLabel(line.category)}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="1"
                                value={line.requiredQty}
                                disabled={line.saved || (isReview && preparePending)}
                                onChange={(e) =>
                                  handleUpdateLine(line.id, "requiredQty", Math.max(1, parseInt(e.target.value, 10) || 1))
                                }
                                className="h-8 w-20 text-center text-xs mx-auto font-semibold tabular-nums"
                              />
                            </TableCell>

                            <TableCell>
                              <Select
                                value={line.sourceLocation}
                                disabled={line.saved || (isReview && preparePending)}
                                onValueChange={(val) => handleUpdateLine(line.id, "sourceLocation", val)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SOURCE_LOCATIONS.map((loc) => (
                                    <SelectItem key={loc.value} value={loc.value} className="text-xs">
                                      {loc.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>

                            <TableCell className="text-center font-semibold tabular-nums">
                              <span
                                className={
                                  line.availableToReserve >= line.requiredQty
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }
                              >
                                {line.availableToReserve}
                              </span>
                            </TableCell>

                            <TableCell className="text-center font-semibold tabular-nums text-foreground">
                              {line.willReserve}
                            </TableCell>

                            <TableCell className="text-center font-semibold tabular-nums">
                              <span
                                className={
                                  line.netShortage > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
                                }
                              >
                                {line.netShortage}
                              </span>
                            </TableCell>

                            <TableCell className="text-center">
                              {line.saved && !["Ready", "Partially Ready", "Shortage"].includes(line.status) && (
                                <Badge variant="outline" className="gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium">
                                  {line.status || "—"}
                                </Badge>
                              )}
                              {line.status === "Ready" && (
                                <Badge variant="outline" className="gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                  Ready
                                </Badge>
                              )}
                              {line.status === "Partially Ready" && (
                                <Badge variant="outline" className="gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                                  <span className="h-1.5 w-1.5 rounded-full bg-orange-600" />
                                  Partially Ready
                                </Badge>
                              )}
                              {line.status === "Shortage" && (
                                <Badge variant="outline" className="gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                                  Shortage
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="px-4 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveLine(line.id)}
                                disabled={line.saved || (isReview && preparePending)}
                                className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                                aria-label="Remove item"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 3: Allocation Summary ── */}
      <Card className="border border-border/80 bg-card shadow-xs">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                3
              </span>
              <h2 className="text-sm font-semibold text-foreground">Allocation Summary</h2>
            </div>
            <span className="text-[11px] text-muted-foreground italic">
              Summary based on current requirement lines.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-xl border border-border/70 bg-card p-3.5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">Requirement Lines</div>
                <div className="text-xl font-bold tracking-tight text-foreground">{summary.totalLines}</div>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-3.5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">Ready Lines</div>
                <div className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{summary.readyLines}</div>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-3.5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">Partially Ready</div>
                <div className="text-xl font-bold tracking-tight text-orange-600 dark:text-orange-400">{summary.partiallyReadyLines}</div>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-3.5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">Shortage Lines</div>
                <div className="text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400">{summary.shortageLines}</div>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-xl border border-border/70 bg-card p-3.5 flex flex-col justify-center">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-semibold text-muted-foreground">Allocation Progress</span>
                <span className="font-bold text-foreground">{summary.progressPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${summary.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 4: Notes & Settings ── */}
      <Card className="border border-border/80 bg-card shadow-xs">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              4
            </span>
            <h2 className="text-sm font-semibold text-foreground">Notes & Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Allocation Note (Optional)
                </label>
                <span className="text-[10px] text-muted-foreground">{allocationNote.length}/500</span>
              </div>
              <Textarea
                maxLength={500}
                value={allocationNote}
                disabled={isReview && preparePending}
                onChange={(e) => setAllocationNote(e.target.value)}
                placeholder="Add any special instructions, notes or remarks for this allocation..."
                className="text-xs min-h-[90px] resize-none"
              />
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-blue-200/70 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20 text-xs">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                <Info className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-foreground">Auto Reservation Enabled</div>
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  {isReview ? "Requirements are saved and stock is reserved only when you click Prepare Issue. All lines must be ready before preparation." : "On saving, available stock will be reserved for this event. Remaining requirements will be fulfilled in subsequent actions."}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Footer Actions ── */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          disabled={submissionPending}
          className="text-xs h-9 px-4 font-medium"
        >
          Cancel
        </Button>

        <Button
          size="sm"
          onClick={() => isReview ? onPrepare({ lines: requirementLines, plannedIssueDate, allocationNote }) : submitMutation.mutate()}
          disabled={submissionPending || !selectedEventId || requirementsUnavailable || pendingRequirementLines.length === 0}
          className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-6 shadow-xs"
        >
          {submissionPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isReview ? "Preparing Issue..." : "Creating Allocation..."}
            </>
          ) : (
            <>
              <Boxes className="h-4 w-4" />
              {pageTitle}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

CreateEventAllocationPage.propTypes = {
  onBack: PropTypes.func.isRequired,
  RequirementWorkspace: PropTypes.elementType.isRequired,
  onRequirementWorkspaceChange: PropTypes.func,
  initialEvent: PropTypes.object,
  onCreated: PropTypes.func,
  hideCloseButton: PropTypes.bool,
  hideBackButton: PropTypes.bool,
  reviewAllocation: PropTypes.object,
  onPrepare: PropTypes.func,
  preparePending: PropTypes.bool,
  prepareError: PropTypes.string,
};
