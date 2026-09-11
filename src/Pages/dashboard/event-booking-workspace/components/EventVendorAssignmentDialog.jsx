/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { FileUp, Loader2, Plus, Store } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import { Checkbox } from '@components/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Textarea } from '@components/components/ui/textarea';

const assignmentStatuses = ['Assigned', 'Upcoming', 'In Progress', 'Confirmed', 'Completed', 'Cancelled'];
const paymentStatuses = ['Pending', 'Partial Paid', 'Advance Received', 'Paid', 'Overdue'];
const documentTypes = ['Agreement', 'GST Certificate', 'PAN / ID Proof', 'Quotation', 'Bank Details', 'Work Sample', 'Other'];
const idOf = (value) => String(value?._id || value || '');

const emptyForm = {
  vendor: '',
  service: '',
  scope: '',
  assignedFunctions: [],
  reportingTime: '',
  status: 'Assigned',
  paymentStatus: 'Pending',
  agreedAmount: '',
  paidAmount: '',
  nextPaymentDueDate: '',
  notes: '',
};

const toLocalDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

function Field({ label, required, children, className = '' }) {
  return <div className={`space-y-1.5 ${className}`}><Label className="text-xs font-semibold">{label}{required ? <span className="ml-1 text-red-500">*</span> : null}</Label>{children}</div>;
}

export default function EventVendorAssignmentDialog({ open, onOpenChange, assignment, preferredVendorId = '', vendors = [], functions = [], services = [], assignedVendorIds = [], saving, onAddVendor, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [documentForm, setDocumentForm] = useState({ documentType: 'Agreement', documentNumber: '', expiryDate: '' });
  const [documentFile, setDocumentFile] = useState(null);
  const editing = Boolean(assignment?._id);

  useEffect(() => {
    if (!open) return;
    setForm(assignment ? {
      vendor: idOf(assignment.vendor),
      service: assignment.service || assignment.category || '',
      scope: assignment.scope || '',
      assignedFunctions: (assignment.assignedFunctions || []).map(idOf),
      reportingTime: toLocalDateTime(assignment.reportingTime),
      status: assignment.status || 'Assigned',
      paymentStatus: assignment.paymentStatus || 'Pending',
      agreedAmount: assignment.agreedAmount ?? '',
      paidAmount: assignment.paidAmount ?? '',
      nextPaymentDueDate: toDateInput(assignment.nextPaymentDueDate),
      notes: assignment.notes || '',
    } : { ...emptyForm, vendor: preferredVendorId });
    setDocumentForm({ documentType: 'Agreement', documentNumber: '', expiryDate: '' });
    setDocumentFile(null);
  }, [assignment, open, preferredVendorId]);

  const availableVendors = useMemo(() => vendors.filter((vendor) => (
    idOf(vendor) === form.vendor || !assignedVendorIds.includes(idOf(vendor))
  )), [assignedVendorIds, form.vendor, vendors]);
  const serviceOptions = useMemo(() => Array.from(new Set([
    ...services,
    ...vendors.map((vendor) => vendor.category).filter(Boolean),
  ])), [services, vendors]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const selectVendor = (vendorId) => {
    const vendor = vendors.find((item) => idOf(item) === vendorId);
    setForm((current) => ({ ...current, vendor: vendorId, service: current.service || vendor?.category || '' }));
  };
  const toggleFunction = (functionId, checked) => update('assignedFunctions', checked
    ? [...new Set([...form.assignedFunctions, functionId])]
    : form.assignedFunctions.filter((value) => value !== functionId));

  const submit = (event) => {
    event.preventDefault();
    if (!form.vendor || !form.service.trim()) return;
    const vendor = vendors.find((item) => idOf(item) === form.vendor);
    const assignmentPayload = {
      ...form,
      category: vendor?.category || form.service,
      scope: form.scope.trim(),
      notes: form.notes.trim(),
      reportingTime: form.reportingTime ? new Date(form.reportingTime).toISOString() : null,
      nextPaymentDueDate: form.nextPaymentDueDate || null,
      agreedAmount: Number(form.agreedAmount || 0),
      paidAmount: Number(form.paidAmount || 0),
    };
    let documentData = null;
    if (documentFile) {
      documentData = new FormData();
      documentData.append('documentType', documentForm.documentType);
      documentData.append('documentNumber', documentForm.documentNumber.trim());
      documentData.append('expiryDate', documentForm.expiryDate);
      documentData.append('status', 'Pending');
      documentData.append('file', documentFile);
    }
    onSave({ assignmentPayload, documentData });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-violet-100 bg-violet-50/70 px-5 py-4 pr-12 text-left dark:bg-violet-400/5">
          <DialogTitle className="flex items-center gap-3 text-lg"><span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-100 text-violet-700"><Store className="h-4 w-4" /></span>{editing ? 'Update Vendor Assignment' : 'Assign Vendor'}</DialogTitle>
          <DialogDescription className="text-xs">Set the vendor scope, event coverage, reporting time, work status, and payment position.</DialogDescription>
        </DialogHeader>

        <form id="event-vendor-form" onSubmit={submit} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vendor" required>
              <Select value={form.vendor} onValueChange={selectVendor} disabled={editing}>
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>{availableVendors.length ? availableVendors.map((vendor) => <SelectItem key={idOf(vendor)} value={idOf(vendor)}>{vendor.companyName} ({vendor.category})</SelectItem>) : <SelectItem value="none" disabled>No available vendors</SelectItem>}</SelectContent>
              </Select>
              {!editing && onAddVendor ? <button type="button" onClick={onAddVendor} className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:underline"><Plus className="h-3 w-3" />Add a new vendor</button> : null}
            </Field>
            <Field label="Service" required>
              <Select value={form.service} onValueChange={(value) => update('service', value)}><SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger><SelectContent>{serviceOptions.map((service) => <SelectItem key={service} value={service}>{service}</SelectItem>)}</SelectContent></Select>
            </Field>
            <Field label="Scope / Deliverables" className="sm:col-span-2"><Input value={form.scope} onChange={(event) => update('scope', event.target.value)} placeholder="e.g. Full catering, live counters, service staff" /></Field>
          </div>

          <Field label="Applies To Functions">
            <div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
              {functions.length ? functions.map((item) => { const functionId = idOf(item); return <label key={functionId} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-xs hover:bg-muted/60"><Checkbox checked={form.assignedFunctions.includes(functionId)} onCheckedChange={(checked) => toggleFunction(functionId, checked === true)} />{item.name}</label>; }) : <p className="text-xs text-muted-foreground">No event functions are available.</p>}
            </div>
            <p className="text-[10px] text-muted-foreground">Leave all unchecked to apply this vendor to all functions.</p>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Reporting Date & Time"><Input type="datetime-local" value={form.reportingTime} onChange={(event) => update('reportingTime', event.target.value)} /></Field>
            <Field label="Work Status"><Select value={form.status} onValueChange={(value) => update('status', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{assignmentStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Agreed Amount"><Input type="number" min="0" value={form.agreedAmount} onChange={(event) => update('agreedAmount', event.target.value)} placeholder="0" /></Field>
            <Field label="Paid Amount"><Input type="number" min="0" value={form.paidAmount} onChange={(event) => update('paidAmount', event.target.value)} placeholder="0" /></Field>
            <Field label="Payment Status"><Select value={form.paymentStatus} onValueChange={(value) => update('paymentStatus', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{paymentStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Next Payment Due"><Input type="date" value={form.nextPaymentDueDate} onChange={(event) => update('nextPaymentDueDate', event.target.value)} /></Field>
            <Field label="Internal Notes" className="sm:col-span-2"><Textarea rows={2} value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Optional assignment notes" /></Field>
          </div>

          <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/30 p-3 dark:bg-blue-400/5">
            <div><p className="text-xs font-semibold text-foreground">Vendor Document <span className="font-normal text-muted-foreground">(Optional)</span></p><p className="mt-0.5 text-[10px] text-muted-foreground">Attach an agreement, quotation, compliance document, or work sample.</p></div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Document Type"><Select value={documentForm.documentType} onValueChange={(value) => setDocumentForm((current) => ({ ...current, documentType: value }))}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent>{documentTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Document Number"><Input className="bg-background" value={documentForm.documentNumber} onChange={(event) => setDocumentForm((current) => ({ ...current, documentNumber: event.target.value }))} placeholder="Optional" /></Field>
              <Field label="Expiry Date"><Input className="bg-background" type="date" value={documentForm.expiryDate} onChange={(event) => setDocumentForm((current) => ({ ...current, expiryDate: event.target.value }))} /></Field>
            </div>
            <label className="flex min-h-16 cursor-pointer items-center justify-center gap-3 rounded-md border border-dashed border-blue-300 bg-background px-3 hover:bg-blue-50/60">
              <FileUp className="h-5 w-5 text-blue-600" />
              <span><span className="block max-w-80 truncate text-xs font-semibold text-foreground">{documentFile?.name || 'Choose document'}</span><span className="mt-0.5 block text-[9px] text-muted-foreground">PDF, image, or document up to 10 MB</span></span>
              <input type="file" className="sr-only" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} />
            </label>
          </div>
        </form>

        <DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:space-x-0">
          <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="event-vendor-form" size="sm" disabled={saving || !form.vendor || !form.service.trim()} className="min-w-32 bg-violet-600 hover:bg-violet-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Store className="mr-2 h-4 w-4" />}{editing ? 'Save Changes' : 'Assign Vendor'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
