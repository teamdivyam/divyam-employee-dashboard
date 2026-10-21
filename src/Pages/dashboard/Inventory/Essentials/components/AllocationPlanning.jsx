import { CalendarDays, Store, CheckCircle2 } from "lucide-react";
import { useEffect, useId } from "react";
import PropTypes from "prop-types";
import { usePlanningSources } from "../usePlanningSources";
import { Input } from "@components/components/ui/input";
import { Label } from "@components/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";

import { planningId } from "../allocationPlanning";

export function AllocationPlanningFields({ value, onChange, allocationId, eventId, disabled = false, hideSource = false, hideHelperText = false, inline = false }) {
  const id = useId();
  const p = value || {};
  const sources = usePlanningSources(!disabled && !hideSource);
  const options = (sources.data || []).filter(a => a.status !== "Cancelled" && a.event && a.sourceEventEndDate && p.requiredFrom && a.sourceEventEndDate <= p.requiredFrom && planningId(a._id) !== planningId(allocationId) && planningId(a.event) !== planningId(eventId));
  const set = (key, next) => onChange({ ...p, [key]: next });
  return <div className={inline ? "contents" : "space-y-2 border-t border-border/70 pt-3"}>
    <div className={inline ? "contents" : "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"}>
      <div className="min-w-0 space-y-1.5"><Label htmlFor={`${id}-from`} className="flex items-center gap-1 text-xs font-semibold text-foreground">Required From</Label><Input id={`${id}-from`} type="date" value={p.requiredFrom || ""} disabled={disabled} onChange={e => set("requiredFrom", e.target.value)} className="h-9 text-xs" /></div>
      <div className="min-w-0 space-y-1.5"><Label htmlFor={`${id}-by`} className="flex items-center gap-1 text-xs font-semibold text-foreground">Release By</Label><Input id={`${id}-by`} type="date" min={p.requiredFrom || undefined} value={p.releaseBy || ""} disabled={disabled} onChange={e => set("releaseBy", e.target.value)} className="h-9 text-xs" /></div>
      {!hideSource && <div className="space-y-1.5"><Label htmlFor={`${id}-source`} className="text-xs">Designated Source Event</Label><Select value={planningId(p.designatedSourceAllocation) || "none"} disabled={disabled} onValueChange={v => set("designatedSourceAllocation", v === "none" ? null : v)}><SelectTrigger id={`${id}-source`} className="h-9 text-xs"><SelectValue placeholder="Select source allocation" /></SelectTrigger><SelectContent><SelectItem value="none">No Event source</SelectItem>{options.map(a => <SelectItem key={a._id} value={a._id}>{a.eventName} · {a.allocationCode}</SelectItem>)}</SelectContent></Select></div>}
    </div>
    {sources.isError && <p role="alert" className="text-xs text-destructive">Unable to load source allocations. Reopen to retry.</p>}
    {!hideHelperText && <p className="text-[11px] text-muted-foreground">Source planning does not reserve or move stock. Reservation remains at Prepare Issue.</p>}
  </div>;
}
AllocationPlanningFields.propTypes = { value: PropTypes.object, onChange: PropTypes.func.isRequired, allocationId: PropTypes.string, eventId: PropTypes.string, disabled: PropTypes.bool, hideSource: PropTypes.bool, hideHelperText: PropTypes.bool, inline: PropTypes.bool };

export function FulfilmentFields({ value, onChange, requiredQuantity, onRequiredQuantityChange, onSourceAllocationChange, destinationEventId, item, allocationPlanning, persisted = false, disabled = false, editingAllocationId }) {
  const id = useId();
  const sourceId = planningId(allocationPlanning?.designatedSourceAllocation);
  const sources = usePlanningSources(true, editingAllocationId);
  const available = line => editingAllocationId ? line.editableEligibleEventSourceQuantity : line.eligibleEventSourceQuantity;
  const candidates = (sources.data || []).filter(a => (persisted && planningId(a._id) === sourceId) || a.status !== "Cancelled" && planningId(a.event) !== planningId(destinationEventId) && a.sourceEventEndDate && allocationPlanning?.requiredFrom && a.sourceEventEndDate <= allocationPlanning.requiredFrom && (!sourceId || planningId(a._id) === sourceId));
  const lines = candidates.flatMap(a => (a.items || []).filter(line => ((persisted && planningId(line._id) === planningId(value?.sourceAllocationLine)) || line.status !== "Cancelled") && planningId(line.item) === planningId(item?._id) && !(line.planning?.eventQuantity > 0) && (available(line) > 0 || (persisted && planningId(line._id) === planningId(value?.sourceAllocationLine)))).map(line => ({ ...line, source: a })));
  const selectedLine = lines.find(line => planningId(line._id) === planningId(value?.sourceAllocationLine));
  const source = selectedLine?.source;
  // Restored item selections must retain their allocation relationship too.
  // Resolve it from the authoritative source line, never from its display name.
  useEffect(() => {
    if (!persisted && !sourceId && source?._id) onSourceAllocationChange(source._id);
  }, [sourceId, source?._id, onSourceAllocationChange, persisted]);
  const capacity = selectedLine ? available(selectedLine) : 0;
  const eligible = item?.returnRequired !== false && !["consumable", "stationery"].includes(item?.itemType);
  const p = value || { fulfilmentPlan: "MAIN_STORE", mainStoreQuantity: Number(requiredQuantity), eventQuantity: 0, sourceAllocationLine: null };
  const set = (key, next) => onChange({ ...p, [key]: next });
  const choose = mode => onChange(mode === "legacy" ? undefined : { fulfilmentPlan: mode, mainStoreQuantity: mode === "MAIN_STORE" ? Number(requiredQuantity) : 0, eventQuantity: 0, sourceAllocationLine: null });
  const validSum = !p || Number(p.mainStoreQuantity) + Number(p.eventQuantity) === Number(requiredQuantity);
  const invalidEvent = !persisted && p?.fulfilmentPlan !== "MAIN_STORE" && p && (!selectedLine || Number(p.eventQuantity) > capacity || Number(p.eventQuantity) <= 0);
  const invalidQuantity = p && (![p.mainStoreQuantity, p.eventQuantity].every(q => q !== "" && Number.isSafeInteger(Number(q)) && Number(q) >= 0) || (p.fulfilmentPlan === "SPLIT_SOURCE" && Number(p.mainStoreQuantity) <= 0));
  const total = Number(p.mainStoreQuantity) + Number(p.eventQuantity);
  return <div data-planning-error={Boolean(!persisted && (!validSum || invalidEvent || invalidQuantity))} className="space-y-2">
    <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-3">
      <div className="space-y-1.5"><Label htmlFor={`${id}-required`} className="text-[11px]">Required Qty</Label><Input id={`${id}-required`} type="number" min={1} step={1} required value={requiredQuantity} disabled={disabled} onChange={e => onRequiredQuantityChange(e.target.value)} className="h-9 text-xs tabular-nums" /></div>
      <div className="min-w-0 space-y-1.5"><Label htmlFor={`${id}-mode`} className="text-[11px]">Fulfilment Plan</Label>
        <Select value={p.fulfilmentPlan} disabled={disabled} onValueChange={choose}><SelectTrigger id={`${id}-mode`} className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MAIN_STORE">Main Store</SelectItem>{eligible && <><SelectItem value="EVENT_SOURCE">Another Event</SelectItem><SelectItem value="SPLIT_SOURCE">Split Sources</SelectItem></>}</SelectContent></Select>
      </div>
    </div>
    {p.fulfilmentPlan === "SPLIT_SOURCE" && <div className="flex items-center gap-2 rounded-md border border-border bg-primary/5 p-2">
      <Store className="h-4 w-4 shrink-0 text-primary" /><Label htmlFor={`${id}-store`} className="flex-1 text-[11px]">Main Store Qty</Label><Input id={`${id}-store`} type="number" min={0} step={1} disabled={disabled} value={p.mainStoreQuantity} onChange={e => set("mainStoreQuantity", e.target.value)} className="h-8 w-20 text-xs" />
    </div>}
    {p.fulfilmentPlan !== "MAIN_STORE" && <div className="space-y-2 rounded-md border border-border p-2">
      <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-primary" /><Label htmlFor={`${id}-line`} className="text-[11px]">Source Event</Label></div>
      <Select value={planningId(p.sourceAllocationLine) || "none"} disabled={disabled || sources.isLoading} onValueChange={v => {
        const line = lines.find(entry => planningId(entry._id) === v);
        if (line) onSourceAllocationChange(line.source._id);
        onChange({ ...p, sourceAllocationLine: line?._id || null, eventQuantity: line ? Math.min(Number(requiredQuantity), available(line)) : 0 });
      }}><SelectTrigger id={`${id}-line`} className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Select source Event</SelectItem>{lines.map(line => <SelectItem key={line._id} value={line._id}>{line.source.eventName} · {line.source.allocationCode} · Ends {line.source.sourceEventEndDate} · {persisted && planningId(line._id) === planningId(p.sourceAllocationLine) ? `${p.eventQuantity} planned` : `${available(line)} available`}</SelectItem>)}</SelectContent></Select>
      <div className="flex items-center gap-2"><Label htmlFor={`${id}-event`} className="flex-1 text-[11px]">Event Qty</Label><Input id={`${id}-event`} type="number" min={1} max={persisted ? undefined : capacity} step={1} disabled={disabled || !selectedLine} value={p.eventQuantity} onChange={e => set("eventQuantity", e.target.value)} className="h-8 w-20 text-xs" /></div>
      {selectedLine && <p className="text-[11px] text-muted-foreground">Event ends: {source.sourceEventEndDate} · {persisted ? `Planned Qty: ${p.eventQuantity}` : `Eligible Qty: ${capacity}`}</p>}
      {!lines.length && !sources.isLoading && <p className="text-[11px] text-muted-foreground">{allocationPlanning?.requiredFrom ? "No source Events available." : "Set Required From in allocation details to choose a source Event."}</p>}
      {invalidEvent && selectedLine && <p role="alert" className="text-[11px] text-destructive">Event Qty must be between 1 and {capacity}.</p>}
    </div>}
    {sources.isError && <p role="alert" className="text-xs text-destructive">Unable to load source planning capacity.</p>}
    <div className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] ${validSum && !invalidEvent && !invalidQuantity ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"}`}>
      {validSum && !invalidEvent && !invalidQuantity && <CheckCircle2 className="h-3.5 w-3.5" />}{total} / {requiredQuantity} planned
    </div>
    {!validSum && <p role="alert" className="text-[11px] text-destructive">Source quantities must total {requiredQuantity}.</p>}
  </div>;
}
FulfilmentFields.propTypes = { value: PropTypes.object, onChange: PropTypes.func.isRequired, onRequiredQuantityChange: PropTypes.func.isRequired, onSourceAllocationChange: PropTypes.func.isRequired, destinationEventId: PropTypes.string, requiredQuantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), item: PropTypes.object, persisted: PropTypes.bool, allocationPlanning: PropTypes.object, disabled: PropTypes.bool, editingAllocationId: PropTypes.string };
