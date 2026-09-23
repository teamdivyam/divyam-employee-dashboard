/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { CarFront, Loader2, Plus } from 'lucide-react';
import { Button } from '@components/components/ui/button';
import BadgeStatus from '@components/components/BadgeStatus';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@components/components/ui/alert-dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './EventTable';
import EventDeleteMenu from './EventDeleteMenu';

const vehicleTypes = ['SUV', 'Tempo Traveller', 'MUV', 'Bus', 'Sedan'];
const sources = ['Company', 'Vendor'];
const initialForm = (item = {}) => ({
  vehicleType: item.vehicleType || '',
  vehicleName: item.vehicleName ?? item.name ?? '',
  registrationNo: item.registrationNo ?? item.registrationNumber ?? '',
  seatingCapacity: item.seatingCapacity ?? item.capacity ?? '',
  sourceOwnership: item.sourceOwnership || '',
  status: item.status ?? 'Active',
  driverName: item.driverName || '',
  driverContactNo: item.driverContactNo ?? item.driverContact ?? '',
  driverAlternateContactNo: item.driverAlternateContactNo || '',
});

export default function EventVehicleDialog({ open, onOpenChange, item, vehicles = [], saving, deleting, onSave, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const busy = saving || deleting;
  useEffect(() => {
    if (open) { setEditing(item?._id ? item : null); setForm(initialForm(item || {})); setError(''); setDeleteTarget(null); }
  }, [open, item]);
  const begin = (vehicle = {}) => { setEditing(vehicle); setForm(initialForm(vehicle)); setError(''); };
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]));
      if (!vehicleTypes.includes(payload.vehicleType) || !sources.includes(payload.sourceOwnership) || !payload.vehicleName || !payload.registrationNo) throw new Error('Complete all required vehicle details.');
      payload.seatingCapacity = Number(payload.seatingCapacity);
      if (!Number.isInteger(payload.seatingCapacity) || payload.seatingCapacity < 1) throw new Error('Seating capacity must be a positive integer.');
      if (!payload.status) throw new Error('Enter a status or use Active.');
      payload.registrationNo = payload.registrationNo.toUpperCase();
      await onSave(payload, editing?._id);
      setEditing(null); setError('');
    } catch (failure) { setError(failure.response?.data?.message || failure.message || 'Unable to save vehicle.'); }
  };
  const remove = async () => {
    if (busy) return;
    try {
      await onDelete(deleteTarget._id);
      if (editing?._id === deleteTarget._id) setEditing(null);
      setDeleteTarget(null); setError('');
    } catch (failure) { setError(failure.response?.data?.message || 'Unable to delete vehicle.'); setDeleteTarget(null); }
  };

  return <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
    <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-1.5rem)] max-w-6xl flex-col gap-0 overflow-hidden rounded-lg p-0">
      <DialogHeader className="px-4 pb-3 pt-4 pr-12 text-left"><DialogTitle className="text-xl font-bold">Manage Vehicle</DialogTitle><DialogDescription className="text-xs">Add, edit or manage vehicles for transport assignments.</DialogDescription></DialogHeader>
      <div className="min-h-0 space-y-3 overflow-y-auto px-4 pb-3">
        <section className="overflow-hidden rounded-md border border-border">
          <div className="flex items-center justify-between gap-3 bg-primary/[0.04] px-3 py-2"><div><h3 className="text-sm font-semibold">Existing Vehicles ({vehicles.length})</h3><p className="text-[11px] text-muted-foreground">Vehicles available for transport assignments.</p></div><Button size="sm" disabled={busy} onClick={() => begin()}><Plus className="h-4 w-4" />Add Vehicle</Button></div>
          <div className="overflow-x-auto"><Table headerVariant="section" className="min-w-[1000px] text-xs"><TableHeader><TableRow>{['#', 'Vehicle Name', 'Registration No.', 'Type', 'Seats', 'Default Driver', 'Mobile', 'Source', 'Status', 'Action'].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>
            {vehicles.length ? vehicles.map((vehicle, index) => <TableRow key={vehicle._id}>
              <TableCell className="text-center">{index + 1}</TableCell><TableCell className="font-semibold">{vehicle.vehicleName ?? vehicle.name}</TableCell><TableCell>{vehicle.registrationNo ?? vehicle.registrationNumber ?? '-'}</TableCell><TableCell>{vehicle.vehicleType || '-'}</TableCell><TableCell>{vehicle.seatingCapacity ?? vehicle.capacity ?? '-'}</TableCell><TableCell>{vehicle.driverName || '-'}</TableCell><TableCell>{vehicle.driverContactNo || vehicle.driverContact || '-'}</TableCell><TableCell>{vehicle.sourceOwnership || '-'}</TableCell><TableCell><BadgeStatus status={['Active', 'Inactive'].includes(vehicle.status || 'Active') ? (vehicle.status || 'Active').toLowerCase() : vehicle.status} /></TableCell>
              <TableCell><div className="flex items-center justify-center gap-1"><Button size="sm" variant="outline" disabled={busy} onClick={() => begin(vehicle)}>View</Button><EventDeleteMenu label={vehicle.vehicleName ?? vehicle.name} disabled={busy} onDelete={onDelete ? () => setDeleteTarget(vehicle) : undefined} /></div></TableCell>
            </TableRow>) : <TableRow><TableCell colSpan={10} className="py-6 text-center text-muted-foreground">No vehicles added yet. Add a vehicle to get started.</TableCell></TableRow>}
          </TableBody></Table></div>
        </section>
        {editing && <form id="event-vehicle-form" onSubmit={submit} className="rounded-md border border-border p-2">
          <h3 className="text-base font-bold">{editing._id ? 'Edit Vehicle' : 'Add New Vehicle'}</h3><p className="mt-1 text-[11px] text-muted-foreground">Enter vehicle and driver details. Fields marked * are required.</p>
          <fieldset disabled={busy} className="mt-3 space-y-3 [&_input]:h-8 [&_input]:text-xs">
            <section className="rounded-md border border-border bg-primary/[0.02] p-3"><SectionHeading number="1" title="Vehicle Details" description="Enter basic information about the vehicle." /><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field id="vehicle-type" label="Vehicle Type" required><Choice id="vehicle-type" value={form.vehicleType} options={vehicleTypes} placeholder="Select vehicle type" disabled={busy} onChange={(value) => update('vehicleType', value)} /></Field>
              <Field id="vehicle-name" label="Vehicle Name / Model" required><Input id="vehicle-name" required value={form.vehicleName} placeholder="e.g. Innova Crysta" onChange={(event) => update('vehicleName', event.target.value)} /></Field>
              <Field id="vehicle-registration" label="Registration Number" required><Input id="vehicle-registration" required value={form.registrationNo} placeholder="e.g. UP70AB1234" onChange={(event) => update('registrationNo', event.target.value.toUpperCase())} /></Field>
              <Field id="vehicle-seats" label="Seating Capacity" required><Input id="vehicle-seats" type="number" min="1" step="1" required value={form.seatingCapacity} placeholder="e.g. 6" onChange={(event) => update('seatingCapacity', event.target.value)} /></Field>
              <Field id="vehicle-source" label="Source / Ownership" required><Choice id="vehicle-source" value={form.sourceOwnership} options={sources} placeholder="Select source" disabled={busy} onChange={(value) => update('sourceOwnership', value)} /></Field>
              <Field id="vehicle-status" label="Status"><Choice id="vehicle-status" value={form.status} options={[...new Set(['Active', 'Inactive', form.status].filter(Boolean))]} disabled={busy} onChange={(value) => update('status', value)} /></Field>
            </div></section>
            <section className="rounded-md border border-border bg-primary/[0.02] p-3"><SectionHeading number="2" title="Driver Details" description="Assign a default driver for this vehicle (optional)." /><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field id="vehicle-driver" label="Default Driver"><Input id="vehicle-driver" value={form.driverName} placeholder="Driver name" onChange={(event) => update('driverName', event.target.value)} /></Field>
              <Field id="vehicle-mobile" label="Driver Mobile"><Input id="vehicle-mobile" type="tel" value={form.driverContactNo} onChange={(event) => update('driverContactNo', event.target.value)} /></Field>
              <Field id="vehicle-alternate" label="Driver Alternate Mobile"><Input id="vehicle-alternate" type="tel" value={form.driverAlternateContactNo} onChange={(event) => update('driverAlternateContactNo', event.target.value)} /></Field>
            </div></section>
          </fieldset>
        </form>}
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      </div>
      <DialogFooter className="shrink-0 flex-row justify-between border-t border-border p-3 sm:justify-between"><Button variant="outline" disabled={busy} onClick={() => editing ? setEditing(null) : onOpenChange(false)}>{editing ? 'Cancel' : 'Close'}</Button>{editing && <Button type="submit" form="event-vehicle-form" disabled={busy}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CarFront className="h-4 w-4" />}Save Vehicle</Button>}</DialogFooter>
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(next) => !next && !busy && setDeleteTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete vehicle?</AlertDialogTitle><AlertDialogDescription>Remove {deleteTarget?.vehicleName ?? deleteTarget?.name} from this event? Existing transport assignments may need to be removed first.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel><Button variant="destructive" disabled={busy} onClick={remove}>{deleting ? 'Deleting...' : 'Delete Vehicle'}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </DialogContent>
  </Dialog>;
}

function Field({ id, label, required, children }) { return <div className="space-y-1"><Label htmlFor={id} className="text-[11px] font-semibold">{label}{required && <span className="text-destructive"> *</span>}</Label>{children}</div>; }
function Choice({ id, value, options, placeholder, onChange, disabled }) { return <Select value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger id={id} className="h-8 text-xs"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>; }
function SectionHeading({ number, title, description }) { return <div className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{number}</span><div><h4 className="text-sm font-semibold">{title}</h4><p className="text-[11px] text-muted-foreground">{description}</p></div></div>; }

