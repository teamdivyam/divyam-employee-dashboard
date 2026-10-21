import { useState, useRef } from "react";
import PropTypes from "prop-types";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/components/ui/dialog";
import { Button } from "@components/components/ui/button";
import useEventInventoryService from "../useEventInventoryService";
import { allocationLinePayload, allocationVersion } from "../allocationAmendment";
import { linePlanningPayload, planningPayload } from "../allocationPlanning";
import { FulfilmentFields } from "./AllocationPlanning";

// The existing planning controls and PATCH serializer own the contract.
export default function RequirementPlanEditor({ line, allocationId, planning, onClose, onSaved }) {
  const AdminV2Service = useEventInventoryService();
  const [draft, setDraft] = useState(line.planning);
  const [quantity, setQuantity] = useState(line.requiredQty);
  const [period, setPeriod] = useState(line.allocationPlanning || planning || {});
  const form = useRef(null);
  const inFlight = useRef(false);
  const snapshot = useRef(null);
  const detail = useQuery({ queryKey: ["requirement-plan-edit", allocationId, line.id], staleTime: 0, gcTime: 0, refetchOnWindowFocus: false, refetchOnReconnect: false,
    queryFn: async () => {
      const item = (await AdminV2Service.getInventoryV2ItemById(line.itemId)).data.data.item;
      if (!allocationId) return { item };
      const allocation = (await AdminV2Service.getInventoryV2AllocationById(allocationId)).data.data;
      if (line.expectedUpdatedAt && allocation.updatedAt !== line.expectedUpdatedAt) throw new Error("Allocation changed. Close and refresh before editing.");
      const saved = allocation.items.find(entry => entry._id === line.id && entry.status !== "Cancelled");
      if (!saved || allocation.status === "Cancelled" || allocation.verifiedAt || allocation.coverage?.requirementsLocked || allocation.items.some(entry => entry.dispatchedQuantity > 0)) throw new Error("This requirement is locked or unavailable for editing.");
      snapshot.current = allocation;
      return { item, allocation };
    }, retry: false });
  const save = useMutation({ mutationFn: async () => {
    const next = linePlanningPayload(draft);
    if (!next) throw new Error("Select a fulfilment plan.");
    if (!allocationId) return { local: true, planning: next, requiredQty: Number(quantity), allocationPlanning: period };
    const allocation = snapshot.current;
    const payload = { ...allocationVersion(allocation), planning: planningPayload(period), items: allocation.items.filter(entry => entry.status !== "Cancelled").map(entry => ({ ...allocationLinePayload(entry), ...(entry._id === line.id ? { planning: next, requiredQuantity: Number(quantity) } : {}) })) };
    return (await AdminV2Service.updateInventoryV2Allocation(allocationId, payload)).data.data;
  }, onSuccess: async result => { await onSaved(result); onClose(); }, onSettled: () => { inFlight.current = false; }, retry: false });
  return <Dialog open onOpenChange={open => { if (!open && !save.isPending) onClose(); }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Edit Plan — {line.itemName}</DialogTitle></DialogHeader>
    {detail.isPending ? <p role="status">Loading saved plan…</p> : detail.isError ? <p role="alert" className="text-destructive">{detail.error.message}</p> : <form ref={form} className="space-y-4" onSubmit={event => { event.preventDefault(); if (inFlight.current || form.current.querySelector('[data-planning-error="true"]')) return; inFlight.current = true; save.mutate(); }}>
      <FulfilmentFields value={draft} onChange={setDraft} requiredQuantity={quantity} onRequiredQuantityChange={value => { setQuantity(value); setDraft(current => current?.fulfilmentPlan === "MAIN_STORE" ? { ...current, mainStoreQuantity: Number(value) } : current); }} item={detail.data.item} allocationPlanning={period} destinationEventId={String(detail.data.allocation?.event || line.eventId || "")} editingAllocationId={allocationId} onSourceAllocationChange={id => setPeriod(current => ({ ...current, designatedSourceAllocation: id }))} disabled={save.isPending} />
      {save.isError && <p role="alert" className="text-sm text-destructive">{save.error?.response?.data?.message || save.error.message}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>Cancel</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save Plan"}</Button></div>
    </form>}
  </DialogContent></Dialog>;
}
RequirementPlanEditor.propTypes = { line: PropTypes.object.isRequired, allocationId: PropTypes.string, planning: PropTypes.object, onClose: PropTypes.func.isRequired, onSaved: PropTypes.func.isRequired };
