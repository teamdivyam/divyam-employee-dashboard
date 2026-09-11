/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Loader2, Plus, Store } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { serviceAreas, vendorCategories } from './EventVendorOptions';

const emptyForm = { companyName: '', contactPerson: '', mobileNumber: '', email: '', category: '', city: '', address: '' };

function Field({ label, required, children, className = '' }) {
  return <div className={`space-y-1.5 ${className}`}><Label className="text-xs font-semibold">{label}{required ? <span className="ml-1 text-red-500">*</span> : null}</Label>{children}</div>;
}

export default function EventVendorCreateDialog({ open, onOpenChange, saving, onSave }) {
  const [form, setForm] = useState(emptyForm);
  useEffect(() => { if (open) setForm(emptyForm); }, [open]);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = (event) => {
    event.preventDefault();
    onSave(Object.fromEntries(
      Object.entries(form)
        .map(([key, value]) => [key, value.trim()])
        .filter(([, value]) => value),
    ));
  };

  const complete = form.companyName.trim() && form.contactPerson.trim() && form.mobileNumber.length === 10
    && form.category && form.city && form.address.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-blue-100 bg-blue-50/70 px-5 py-4 pr-12 text-left dark:bg-blue-400/5">
          <DialogTitle className="flex items-center gap-3 text-lg"><span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-100 text-blue-700"><Store className="h-4 w-4" /></span>Add New Vendor</DialogTitle>
          <DialogDescription className="text-xs">Create the vendor profile first, then complete its event assignment.</DialogDescription>
        </DialogHeader>

        <form id="event-vendor-create-form" onSubmit={submit} className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vendor / Company Name" required className="sm:col-span-2"><Input value={form.companyName} onChange={(event) => update('companyName', event.target.value)} placeholder="Enter vendor or company name" /></Field>
            <Field label="Contact Person" required><Input value={form.contactPerson} onChange={(event) => update('contactPerson', event.target.value)} placeholder="Contact person" /></Field>
            <Field label="Mobile Number" required><Input type="tel" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" value={form.mobileNumber} onChange={(event) => update('mobileNumber', event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" /></Field>
            <Field label="Category" required><Select value={form.category} onValueChange={(value) => update('category', value)}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{vendorCategories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="City" required><Select value={form.city} onValueChange={(value) => update('city', value)}><SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger><SelectContent>{serviceAreas.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="Optional email" /></Field>
            <Field label="Address" required><Input value={form.address} onChange={(event) => update('address', event.target.value)} placeholder="Business address" /></Field>
          </div>
        </form>

        <DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:space-x-0">
          <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="event-vendor-create-form" size="sm" disabled={saving || !complete} className="min-w-32 bg-blue-600 hover:bg-blue-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Create Vendor</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
