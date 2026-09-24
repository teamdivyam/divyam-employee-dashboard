/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { Boxes, Loader2 } from 'lucide-react';

import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';

const companyStatuses = ['Pending', 'Reserved', 'Partially Reserved', 'Shortage', 'Dispatched', 'Returned', 'Cancelled'];
const vendorStatuses = ['Pending', 'Confirmed', 'Partial', 'Shortage', 'Delivered', 'Returned', 'Cancelled'];
const emptyForm = {
  source: 'Company', itemName: '', sku: '', category: '', unitLabel: 'pcs', requiredQuantity: '1',
  reservedQuantity: '0', vendor: 'none', functionId: 'all', dispatchAt: '', returnAt: '', coordinator: 'none', status: 'Pending', notes: '',
};
const idOf = (value) => String(value?._id || value || '');

const statusTone = (status) => {
  if (['Reserved', 'Returned', 'Confirmed', 'Delivered'].includes(status)) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (['Partially Reserved', 'Partial', 'Pending'].includes(status)) return 'border-orange-200 bg-orange-50 text-orange-700';
  if (status === 'Shortage' || status === 'Cancelled') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
};

function InventoryRequirementDialog({ open, onOpenChange, requirement, functions, employees, vendors, source, saving, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const vendorOptions = useMemo(() => {
    const currentVendor = requirement?.vendor && typeof requirement.vendor === 'object' ? requirement.vendor : null;
    return currentVendor && !vendors.some((item) => idOf(item) === idOf(currentVendor))
      ? [currentVendor, ...vendors]
      : vendors;
  }, [requirement, vendors]);

  useEffect(() => {
    if (!open) return;
    const functionId = idOf(requirement?.appliesToFunctions?.[0]);
    setForm(requirement ? {
      source: requirement.source || source,
      itemName: requirement.itemName || '',
      sku: requirement.sku || '',
      category: requirement.category || '',
      unitLabel: requirement.unitLabel || 'pcs',
      requiredQuantity: String(requirement.requiredQuantity || 1),
      reservedQuantity: String(requirement.reservedQuantity || 0),
      vendor: idOf(requirement.vendor) || 'none',
      functionId: functionId || 'all',
      dispatchAt: requirement.dispatchAt ? new Date(requirement.dispatchAt).toISOString().slice(0, 16) : '',
      returnAt: requirement.returnAt ? new Date(requirement.returnAt).toISOString().slice(0, 16) : '',
      coordinator: idOf(requirement.coordinator) || 'none',
      status: requirement.status || 'Pending',
      notes: requirement.notes || '',
    } : { ...emptyForm, source });
  }, [open, requirement, source]);

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const currentRequired = Number(requirement?.requiredQuantity || 0);
  const currentReserved = Number(requirement?.reservedQuantity || 0);
  const currentShortage = Math.max(0, currentRequired - currentReserved);
  const nextRequired = Math.max(0, Number(form.requiredQuantity || 0));
  const nextReserved = Math.min(nextRequired, Math.max(0, Number(form.reservedQuantity || 0)));
  const nextShortage = Math.max(0, nextRequired - nextReserved);
  const nextReadiness = nextShortage === 0 ? (form.source === 'Vendor' ? 'Confirmed' : 'Reserved') : nextReserved > 0 ? (form.source === 'Vendor' ? 'Partial' : 'Partially Reserved') : 'Shortage';
  const submit = (event) => {
    event.preventDefault();
    const selectedFunction = functions.find((item) => idOf(item) === form.functionId);
    const employee = employees.find((item) => idOf(item) === form.coordinator);
    const vendor = vendorOptions.find((item) => idOf(item) === form.vendor);
    onSave({
      source: form.source,
      itemName: form.itemName.trim(),
      sku: form.sku.trim() || undefined,
      category: form.category.trim(),
      unitLabel: form.unitLabel.trim() || 'pcs',
      requiredQuantity: Number(form.requiredQuantity),
      reservedQuantity: Number(form.reservedQuantity),
      vendor: form.source === 'Vendor' ? vendor?._id || null : null,
      appliesToFunctions: selectedFunction ? [selectedFunction._id] : [],
      appliesToLabel: selectedFunction?.name || 'All Functions',
      dispatchAt: form.dispatchAt || null,
      returnAt: form.returnAt || null,
      coordinator: employee?._id || null,
      coordinatorName: employee?.name || '',
      status: form.status,
      notes: form.notes.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border/80 px-6 py-4 text-left">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-card shadow-xs"><Boxes className="h-6 w-6" /></div>
            <div><DialogTitle className="text-xl font-bold tracking-tight">{requirement ? 'Edit Item Allocation' : `Add ${form.source} Requirement`}</DialogTitle><p className="mt-0.5 text-xs text-muted-foreground">{requirement ? 'Update requirement and allocation for this event.' : 'Configure the inventory item and its event fulfilment.'}</p></div>
          </div>
        </DialogHeader>
        <form id="event-inventory-form" onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {requirement && <Card className="overflow-hidden border border-border/80 bg-card shadow-xs">
              <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50/50 px-5 py-2.5 dark:border-blue-900/30 dark:bg-blue-950/20"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">1</span><span className="text-xs font-bold tracking-wider text-blue-600 dark:text-blue-400">CURRENT POSITION</span></div>
              <CardContent className="grid gap-3 p-5 sm:grid-cols-4">
                <div className="rounded-lg border bg-muted/20 p-3"><p className="text-[10px] text-muted-foreground">Item</p><p className="mt-1 truncate text-sm font-semibold">{requirement.itemName}</p><p className="text-[10px] text-muted-foreground">{requirement.category}</p></div>
                <div className="rounded-lg border bg-muted/20 p-3"><p className="text-[10px] text-muted-foreground">Required</p><p className="mt-1 text-lg font-bold tabular-nums">{currentRequired}</p></div>
                <div className="rounded-lg border bg-muted/20 p-3"><p className="text-[10px] text-muted-foreground">Confirmed</p><p className="mt-1 text-lg font-bold tabular-nums text-emerald-700">{currentReserved}</p></div>
                <div className="rounded-lg border bg-muted/20 p-3"><p className="text-[10px] text-muted-foreground">Remaining</p><p className={`mt-1 text-lg font-bold tabular-nums ${currentShortage ? 'text-rose-600' : 'text-emerald-700'}`}>{currentShortage}</p><Badge variant="outline" className={`mt-1 ${statusTone(requirement.status)}`}>{requirement.status}</Badge></div>
              </CardContent>
            </Card>}
            <Card className="overflow-hidden border border-border/80 bg-card shadow-xs">
              <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50/50 px-5 py-2.5 dark:border-blue-900/30 dark:bg-blue-950/20"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">{requirement ? '2' : '1'}</span><span className="text-xs font-bold tracking-wider text-blue-600 dark:text-blue-400">UPDATE ITEM & SOURCE</span></div>
              <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                {form.source === 'Vendor' && <div className="space-y-1.5"><Label className="text-xs font-semibold">Vendor <span className="text-rose-500">*</span></Label><Select value={form.vendor} onValueChange={(value) => setValue('vendor', value)}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select vendor" /></SelectTrigger><SelectContent><SelectItem value="none">Select vendor</SelectItem>{vendorOptions.map((item) => <SelectItem key={idOf(item)} value={idOf(item)}>{item.companyName || item.name}</SelectItem>)}</SelectContent></Select></div>}
                <div className="space-y-1.5"><Label className="text-xs font-semibold">Item Name <span className="text-rose-500">*</span></Label><Input className="h-9 text-xs" value={form.itemName} onChange={(event) => setValue('itemName', event.target.value)} placeholder="Enter item name" required /></div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold">Category <span className="text-rose-500">*</span></Label><Input className="h-9 text-xs" value={form.category} onChange={(event) => setValue('category', event.target.value)} placeholder="Enter category" required /></div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold">SKU (Optional)</Label><Input className="h-9 text-xs" value={form.sku} onChange={(event) => setValue('sku', event.target.value)} placeholder="Enter SKU" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold">Unit</Label><Input className="h-9 text-xs" value={form.unitLabel} onChange={(event) => setValue('unitLabel', event.target.value)} placeholder="pcs" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold">Status</Label><Select value={form.status} onValueChange={(value) => setValue('status', value)}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{(form.source === 'Vendor' ? vendorStatuses : companyStatuses).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-border/80 bg-card shadow-xs">
              <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50/50 px-5 py-2.5 dark:border-blue-900/30 dark:bg-blue-950/20"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">{requirement ? '3' : '2'}</span><span className="text-xs font-bold tracking-wider text-blue-600 dark:text-blue-400">QUANTITY & EVENT FULFILMENT</span></div>
              <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                <div className="space-y-1.5"><Label className="text-xs font-semibold">Required Quantity <span className="text-rose-500">*</span></Label><Input className="h-9 text-xs" type="number" min="1" value={form.requiredQuantity} onChange={(event) => setValue('requiredQuantity', event.target.value)} required /></div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold">Confirmed Quantity</Label><Input className="h-9 text-xs" type="number" min="0" value={form.reservedQuantity} onChange={(event) => setValue('reservedQuantity', event.target.value)} required /></div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold">Applies To</Label><Select value={form.functionId} onValueChange={(value) => setValue('functionId', value)}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Functions</SelectItem>{functions.map((item) => <SelectItem key={idOf(item)} value={idOf(item)}>{item.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold">Delivery Date & Time</Label><Input className="h-9 text-xs" type="datetime-local" value={form.dispatchAt} onChange={(event) => setValue('dispatchAt', event.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold">Return / Pickup</Label><Input className="h-9 text-xs" type="datetime-local" value={form.returnAt} onChange={(event) => setValue('returnAt', event.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold">Coordinator</Label><Select value={form.coordinator} onValueChange={(value) => setValue('coordinator', value)}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select coordinator" /></SelectTrigger><SelectContent><SelectItem value="none">Not assigned</SelectItem>{employees.map((item) => <SelectItem key={idOf(item)} value={idOf(item)}>{item.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5 md:col-span-3"><Label className="text-xs font-semibold">Notes (Optional)</Label><Input className="h-9 text-xs" value={form.notes} onChange={(event) => setValue('notes', event.target.value)} placeholder="Add handling, delivery, or pickup notes" /></div>
              </CardContent>
            </Card>
            {requirement && <Card className="overflow-hidden border border-emerald-200 bg-emerald-50/30 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/10">
              <div className="border-b border-emerald-200 px-5 py-2.5 text-xs font-bold tracking-wider text-emerald-700 dark:border-emerald-900/40 dark:text-emerald-400">AFTER UPDATE</div>
              <CardContent className="grid gap-3 p-5 sm:grid-cols-4">
                <div><p className="text-[10px] text-muted-foreground">Required</p><p className="mt-1 text-base font-bold tabular-nums">{nextRequired}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Confirmed</p><p className="mt-1 text-base font-bold tabular-nums text-emerald-700">{nextReserved}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Remaining</p><p className={`mt-1 text-base font-bold tabular-nums ${nextShortage ? 'text-rose-600' : 'text-emerald-700'}`}>{nextShortage}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Expected Status</p><Badge variant="outline" className={`mt-1 ${statusTone(nextReadiness)}`}>{nextReadiness}</Badge></div>
              </CardContent>
            </Card>}
          </div>
          <DialogFooter className="shrink-0 border-t border-border/80 bg-card px-6 py-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={saving || !form.itemName.trim() || !form.category.trim() || (form.source === 'Vendor' && form.vendor === 'none')}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{requirement ? 'Save Changes' : `Add ${form.source} Requirement`}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default InventoryRequirementDialog;

