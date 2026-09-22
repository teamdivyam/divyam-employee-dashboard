/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { CarFront, Loader2 } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';

const vehicleTypes = ['SUV', 'Tempo Traveller', 'MUV', 'Bus', 'Sedan'];
const emptyForm = { vehicleName: '', vehicleType: '', registrationNo: '', seatingCapacity: 1, sourceOwnership: '', status: 'Active', driverName: '', driverContactNo: '', driverAlternateContactNo: '' };
const fromItem = (item) => item ? {
  vehicleName: item.vehicleName ?? item.name ?? '',
  vehicleType: item.vehicleType || '',
  registrationNo: item.registrationNo ?? item.registrationNumber ?? '',
  seatingCapacity: item.seatingCapacity ?? item.capacity ?? 1,
  sourceOwnership: item.sourceOwnership || '',
  status: item.status || 'Active',
  driverName: item.driverName || '',
  driverContactNo: item.driverContactNo ?? item.driverContact ?? '',
  driverAlternateContactNo: item.driverAlternateContactNo || '',
} : emptyForm;

export default function EventVehicleDialog({ open, onOpenChange, item, saving, onSave }) {
  const [form, setForm] = useState(emptyForm);
  useEffect(() => { if (open) setForm(fromItem(item)); }, [item, open]);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event) => { event.preventDefault(); onSave({ vehicleName: form.vehicleName.trim(), vehicleType: form.vehicleType, registrationNo: form.registrationNo.trim().toUpperCase(), seatingCapacity: Math.max(1, Number(form.seatingCapacity || 1)), sourceOwnership: form.sourceOwnership, status: form.status, driverName: form.driverName.trim() || undefined, driverContactNo: form.driverContactNo.trim() || undefined, driverAlternateContactNo: form.driverAlternateContactNo.trim() || undefined }); };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg gap-0 overflow-hidden p-0 sm:rounded-xl"><DialogHeader className="border-b border-border bg-blue-50/70 px-5 py-4 pr-12 text-left"><DialogTitle className="flex items-center gap-3 text-lg"><span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-100 text-blue-700"><CarFront className="h-4 w-4" /></span>{item?._id ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle><DialogDescription className="text-xs">Maintain vehicle, capacity and driver details for this event.</DialogDescription></DialogHeader><form id="event-vehicle-form" onSubmit={submit} className="space-y-4 p-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="Vehicle Name" required><Input value={form.vehicleName} onChange={(event) => update('vehicleName', event.target.value)} placeholder="e.g. Innova Crysta" required /></Field><Field label="Vehicle Type" required><Select value={form.vehicleType} onValueChange={(value) => update('vehicleType', value)}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{vehicleTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></Field><Field label="Registration Number" required><Input value={form.registrationNo} onChange={(event) => update('registrationNo', event.target.value.toUpperCase())} placeholder="UP70AB1234" required /></Field><Field label="Capacity" required><Input type="number" min="1" value={form.seatingCapacity} onChange={(event) => update('seatingCapacity', event.target.value)} required /></Field><Field label="Ownership" required><Select value={form.sourceOwnership} onValueChange={(value) => update('sourceOwnership', value)}><SelectTrigger><SelectValue placeholder="Select ownership" /></SelectTrigger><SelectContent><SelectItem value="Company">Company</SelectItem><SelectItem value="Vendor">Vendor</SelectItem></SelectContent></Select></Field><Field label="Status"><Select value={form.status} onValueChange={(value) => update('status', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent></Select></Field><Field label="Driver Name"><Input value={form.driverName} onChange={(event) => update('driverName', event.target.value)} /></Field><Field label="Driver Contact"><Input value={form.driverContactNo} onChange={(event) => update('driverContactNo', event.target.value)} /></Field><Field label="Alternate Contact"><Input value={form.driverAlternateContactNo} onChange={(event) => update('driverAlternateContactNo', event.target.value)} /></Field></div></form><DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:space-x-0"><Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="event-vehicle-form" size="sm" disabled={saving || !form.vehicleName.trim() || !form.vehicleType || !form.registrationNo.trim() || !form.sourceOwnership} className="min-w-28 bg-blue-600 hover:bg-blue-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{item?._id ? 'Save Changes' : 'Add Vehicle'}</Button></DialogFooter></DialogContent></Dialog>;
}

function Field({ label, required, children }) { return <div className="space-y-1.5"><Label className="text-xs font-semibold">{label}{required ? <span className="ml-1 text-red-500">*</span> : null}</Label>{children}</div>; }
