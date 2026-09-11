/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { CarFront, Loader2 } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Textarea } from '@components/components/ui/textarea';

const emptyForm = { name: '', vehicleType: '', registrationNumber: '', capacity: 1, driverName: '', driverContact: '', notes: '' };
const fromItem = (item) => item ? { name: item.name || '', vehicleType: item.vehicleType || '', registrationNumber: item.registrationNumber || '', capacity: item.capacity || 1, driverName: item.driverName || '', driverContact: item.driverContact || '', notes: item.notes || '' } : emptyForm;

export default function EventVehicleDialog({ open, onOpenChange, item, saving, onSave }) {
  const [form, setForm] = useState(emptyForm);
  useEffect(() => { if (open) setForm(fromItem(item)); }, [item, open]);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event) => { event.preventDefault(); onSave({ name: form.name.trim(), vehicleType: form.vehicleType.trim() || undefined, registrationNumber: form.registrationNumber.trim() || undefined, capacity: Math.max(1, Number(form.capacity || 1)), driverName: form.driverName.trim() || undefined, driverContact: form.driverContact.trim() || undefined, notes: form.notes.trim() || undefined }); };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg gap-0 overflow-hidden p-0 sm:rounded-xl"><DialogHeader className="border-b border-border bg-blue-50/70 px-5 py-4 pr-12 text-left"><DialogTitle className="flex items-center gap-3 text-lg"><span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-100 text-blue-700"><CarFront className="h-4 w-4" /></span>{item?._id ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle><DialogDescription className="text-xs">Maintain vehicle, capacity and driver details for this event.</DialogDescription></DialogHeader><form id="event-vehicle-form" onSubmit={submit} className="space-y-4 p-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="Vehicle Name" required><Input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Innova Crysta" required /></Field><Field label="Vehicle Type"><Input value={form.vehicleType} onChange={(event) => update('vehicleType', event.target.value)} placeholder="Car, Bus, Tempo" /></Field><Field label="Registration Number"><Input value={form.registrationNumber} onChange={(event) => update('registrationNumber', event.target.value)} placeholder="UP70 AB1234" /></Field><Field label="Capacity"><Input type="number" min="1" value={form.capacity} onChange={(event) => update('capacity', event.target.value)} /></Field><Field label="Driver Name"><Input value={form.driverName} onChange={(event) => update('driverName', event.target.value)} /></Field><Field label="Driver Contact"><Input value={form.driverContact} onChange={(event) => update('driverContact', event.target.value)} /></Field></div><Field label="Notes"><Textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} className="min-h-20" /></Field></form><DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:space-x-0"><Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="event-vehicle-form" size="sm" disabled={saving || !form.name.trim()} className="min-w-28 bg-blue-600 hover:bg-blue-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{item?._id ? 'Save Changes' : 'Add Vehicle'}</Button></DialogFooter></DialogContent></Dialog>;
}

function Field({ label, required, children }) { return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}{required ? <span className="ml-1 text-red-500">*</span> : null}</Label>{children}</div>; }
