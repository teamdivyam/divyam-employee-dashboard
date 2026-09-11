/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { FileUp, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@components/components/ui/button';
import { Checkbox } from '@components/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Textarea } from '@components/components/ui/textarea';
import { approvalStatuses, approvalTypes } from '../eventApproval.utils';

const emptyForm = { title: '', approvalType: 'Other', appliesToFunctions: [], appliesToLabel: '', status: 'Pending', notes: '' };
const idOf = (value) => String(value?._id || value || '');

function Field({ label, required, children, className = '' }) {
  return <div className={`space-y-1.5 ${className}`}><Label className="text-xs font-semibold">{label}{required ? <span className="ml-1 text-red-500">*</span> : null}</Label>{children}</div>;
}

export default function EventApprovalDialog({ open, onOpenChange, functions = [], saving, onSave }) {
  const inputRef = useRef(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setFile(null);
  }, [open]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleFunction = (functionId, checked) => update('appliesToFunctions', checked
    ? [...new Set([...form.appliesToFunctions, functionId])]
    : form.appliesToFunctions.filter((value) => value !== functionId));
  const chooseFile = (nextFile) => {
    if (!nextFile) return;
    if (nextFile.size > 10 * 1024 * 1024) return toast.error('Reference file cannot exceed 10 MB.');
    setFile(nextFile);
  };
  const submit = (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('approvalType', form.approvalType);
    formData.append('appliesToFunctions', JSON.stringify(form.appliesToFunctions));
    formData.append('appliesToLabel', form.appliesToLabel.trim());
    formData.append('status', form.status);
    formData.append('notes', form.notes.trim());
    if (file) formData.append('file', file);
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-orange-100 bg-orange-50/70 px-5 py-4 pr-12 text-left dark:bg-orange-400/5">
          <DialogTitle className="flex items-center gap-3 text-lg"><span className="grid h-9 w-9 place-items-center rounded-lg bg-orange-100 text-orange-700"><Send className="h-4 w-4" /></span>Add Approval Request</DialogTitle>
          <DialogDescription className="text-xs">Share an event item or reference with the client for approval.</DialogDescription>
        </DialogHeader>
        <form id="event-approval-form" onSubmit={submit} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Approval Item" required className="sm:col-span-2"><Input value={form.title} onChange={(event) => update('title', event.target.value)} maxLength={200} placeholder="e.g. Final Menu or Decor Concept" required /></Field>
            <Field label="Approval Type"><Select value={form.approvalType} onValueChange={(value) => update('approvalType', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{approvalTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Initial Status"><Select value={form.status} onValueChange={(value) => update('status', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{approvalStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Custom Coverage" className="sm:col-span-2"><Input value={form.appliesToLabel} onChange={(event) => update('appliesToLabel', event.target.value)} maxLength={200} placeholder="e.g. All Functions or Outstation Guests" /></Field>
          </div>
          <Field label="Applies To Functions"><div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">{functions.length ? functions.map((item) => { const functionId = idOf(item); return <label key={functionId} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-xs hover:bg-muted/60"><Checkbox checked={form.appliesToFunctions.includes(functionId)} onCheckedChange={(checked) => toggleFunction(functionId, checked === true)} />{item.name}</label>; }) : <p className="text-xs text-muted-foreground">No event functions are available.</p>}</div></Field>
          <Field label="Reference / File"><input ref={inputRef} type="file" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} /><button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-20 w-full items-center justify-center gap-3 rounded-lg border border-dashed border-orange-300 bg-orange-50/40 px-4 text-left hover:bg-orange-50 dark:bg-orange-400/5"><FileUp className="h-6 w-6 text-orange-600" /><span><span className="block text-xs font-semibold text-foreground">{file?.name || 'Choose reference file'}</span><span className="mt-1 block text-[10px] text-muted-foreground">Image, PDF, or document up to 10 MB</span></span></button></Field>
          <Field label="Notes"><Textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} maxLength={1000} className="min-h-20 resize-none" placeholder="What decision or feedback is required from the client?" /></Field>
        </form>
        <DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:space-x-0"><Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="event-approval-form" size="sm" disabled={saving || !form.title.trim()} className="min-w-36 bg-orange-600 hover:bg-orange-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Add Request</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
