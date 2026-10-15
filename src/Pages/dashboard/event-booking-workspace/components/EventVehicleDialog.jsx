/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { CarFront, Loader2, Plus } from 'lucide-react';
import { Button } from '@components/components/ui/button';
import { Badge } from '@components/components/ui/badge';
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
  const [editing, setEditing] = useState({});
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const busy = saving || deleting;

  useEffect(() => {
    if (open) {
      setEditing(item?._id ? item : {});
      setForm(initialForm(item || {}));
      setError('');
      setDeleteTarget(null);
    }
  }, [open, item]);

  const begin = (vehicle = {}) => {
    setEditing(vehicle?._id ? vehicle : {});
    setForm(initialForm(vehicle));
    setError('');
  };

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
      );
      if (!vehicleTypes.includes(payload.vehicleType) || !sources.includes(payload.sourceOwnership) || !payload.vehicleName || !payload.registrationNo) {
        throw new Error('Complete all required vehicle details.');
      }
      payload.seatingCapacity = Number(payload.seatingCapacity);
      if (!Number.isInteger(payload.seatingCapacity) || payload.seatingCapacity < 1) {
        throw new Error('Seating capacity must be a positive integer.');
      }
      if (!payload.status) throw new Error('Enter a status or use Active.');
      payload.registrationNo = payload.registrationNo.toUpperCase();
      await onSave(payload, editing?._id);
      setEditing({});
      setForm(initialForm({}));
      setError('');
    } catch (failure) {
      setError(failure.response?.data?.message || failure.message || 'Unable to save vehicle.');
    }
  };

  const remove = async () => {
    if (busy) return;
    try {
      await onDelete(deleteTarget._id);
      if (editing?._id === deleteTarget._id) {
        setEditing({});
        setForm(initialForm({}));
      }
      setDeleteTarget(null);
      setError('');
    } catch (failure) {
      setError(failure.response?.data?.message || 'Unable to delete vehicle.');
      setDeleteTarget(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-1.5rem)] max-w-6xl flex-col gap-0 overflow-hidden rounded-lg p-0">
        <DialogHeader className="px-4 pb-3 pt-4 pr-12 text-left">
          <DialogTitle className="text-xl font-bold">Manage Vehicle</DialogTitle>
          <DialogDescription className="text-xs">Add, edit or manage vehicles for transport assignments.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-4 overflow-y-auto px-4 pb-4">
          <section className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-center justify-between gap-3 bg-[#f0edfd]/80 border-b border-purple-100 px-4 py-3 dark:bg-purple-950/20 dark:border-purple-900/30">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Existing Vehicles ({vehicles.length})</h3>
                <p className="text-[11px] text-muted-foreground">Vehicles available for transport assignments.</p>
              </div>
              <Button
                size="sm"
                disabled={busy}
                onClick={() => begin({})}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm hover:from-purple-700 hover:to-blue-700 font-medium"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Vehicle
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table headerVariant="section" className="min-w-[1000px] text-xs">
                <TableHeader>
                  <TableRow>
                    {['#', 'Vehicle Name', 'Registration No.', 'Type', 'Seats', 'Default Driver', 'Mobile', 'Source', 'Status', 'Action'].map((label) => (
                      <TableHead key={label} className={['#', 'Status', 'Action'].includes(label) ? 'text-center' : ''}>
                        {label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.length ? (
                    vehicles.map((vehicle, index) => (
                      <TableRow key={vehicle._id}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell className="font-semibold">{vehicle.vehicleName ?? vehicle.name}</TableCell>
                        <TableCell>{vehicle.registrationNo ?? vehicle.registrationNumber ?? '-'}</TableCell>
                        <TableCell>{vehicle.vehicleType || '-'}</TableCell>
                        <TableCell>{vehicle.seatingCapacity ?? vehicle.capacity ?? '-'}</TableCell>
                        <TableCell>{vehicle.driverName || '-'}</TableCell>
                        <TableCell>{vehicle.driverContactNo || vehicle.driverContact || '-'}</TableCell>
                        <TableCell>{vehicle.sourceOwnership || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`inline-flex h-6 min-w-16 items-center justify-center whitespace-nowrap rounded px-2.5 py-0.5 text-xs font-medium ${
                              vehicle.status === 'Inactive'
                                ? 'border-0 bg-muted text-muted-foreground'
                                : 'border-0 bg-[#dcf8eb] text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                            }`}
                          >
                            {vehicle.status || 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1.5">
                            <Button size="sm" variant="outline" className="h-8 px-3 text-xs" disabled={busy} onClick={() => begin(vehicle)}>
                              View
                            </Button>
                            <EventDeleteMenu label={vehicle.vehicleName ?? vehicle.name} disabled={busy} onDelete={onDelete ? () => setDeleteTarget(vehicle) : undefined} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="py-6 text-center text-muted-foreground">
                        No vehicles added yet. Add a vehicle to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <form id="event-vehicle-form" onSubmit={submit} className="rounded-lg border border-border p-4 space-y-3.5">
            <div>
              <h3 className="text-sm font-bold text-foreground">{editing?._id ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Enter vehicle and driver details. Fields marked * are required.</p>
            </div>

            <fieldset disabled={busy} className="space-y-3.5 [&_input]:h-9 [&_input]:text-xs [&_input]:bg-white dark:[&_input]:bg-background">
              {/* Section 1: Vehicle Details */}
              <section className="overflow-hidden rounded-lg border border-blue-200/80 bg-white dark:border-blue-900/40 dark:bg-background">
                <div className="flex items-center gap-3 bg-[#e3eefe]/80 border-b border-blue-200/70 px-4 py-2.5 dark:bg-blue-950/40 dark:border-blue-900/40">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
                    1
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Vehicle Details</h4>
                    <p className="text-[11px] text-muted-foreground">Enter basic information about the vehicle.</p>
                  </div>
                </div>
                <div className="p-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                  <Field id="vehicle-type" label="Vehicle Type" required>
                    <Choice id="vehicle-type" value={form.vehicleType} options={vehicleTypes} placeholder="Select vehicle type" disabled={busy} onChange={(value) => update('vehicleType', value)} />
                  </Field>
                  <Field id="vehicle-name" label="Vehicle Name / Model" required>
                    <Input id="vehicle-name" required value={form.vehicleName} placeholder="e.g. Innova Crysta" onChange={(event) => update('vehicleName', event.target.value)} />
                  </Field>
                  <Field id="vehicle-registration" label="Registration Number" required>
                    <Input id="vehicle-registration" required value={form.registrationNo} placeholder="e.g. UP70AB1234" onChange={(event) => update('registrationNo', event.target.value.toUpperCase())} />
                  </Field>
                  <Field id="vehicle-seats" label="Seating Capacity" required>
                    <Input id="vehicle-seats" type="number" min="1" step="1" required value={form.seatingCapacity} placeholder="e.g. 6" onChange={(event) => update('seatingCapacity', event.target.value)} />
                  </Field>
                  <Field id="vehicle-source" label="Source / Ownership" required>
                    <Choice id="vehicle-source" value={form.sourceOwnership} options={sources} placeholder="Select source" disabled={busy} onChange={(value) => update('sourceOwnership', value)} />
                  </Field>
                  <Field id="vehicle-status" label="Status">
                    <Choice id="vehicle-status" value={form.status} options={[...new Set(['Active', 'Inactive', form.status].filter(Boolean))]} disabled={busy} onChange={(value) => update('status', value)} />
                  </Field>
                </div>
              </section>

              {/* Section 2: Driver Details */}
              <section className="overflow-hidden rounded-lg border border-emerald-200/80 bg-white dark:border-emerald-900/40 dark:bg-background">
                <div className="flex items-center gap-3 bg-[#dcf8eb]/80 border-b border-emerald-200/70 px-4 py-2.5 dark:bg-emerald-950/40 dark:border-emerald-900/40">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
                    2
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Driver Details</h4>
                    <p className="text-[11px] text-muted-foreground">Assign a default driver for this vehicle (optional).</p>
                  </div>
                </div>
                <div className="p-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  <Field id="vehicle-driver" label="Default Driver">
                    <Input id="vehicle-driver" value={form.driverName} placeholder="Driver name" onChange={(event) => update('driverName', event.target.value)} />
                  </Field>
                  <Field id="vehicle-mobile" label="Driver Mobile">
                    <Input id="vehicle-mobile" type="tel" value={form.driverContactNo} onChange={(event) => update('driverContactNo', event.target.value)} />
                  </Field>
                  <Field id="vehicle-alternate" label="Driver Alternate Mobile">
                    <Input id="vehicle-alternate" type="tel" value={form.driverAlternateContactNo} onChange={(event) => update('driverAlternateContactNo', event.target.value)} />
                  </Field>
                </div>
              </section>
            </fieldset>
          </form>

          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter className="shrink-0 flex-row justify-between border-t border-border p-3 sm:justify-between">
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="event-vehicle-form"
            disabled={busy}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm hover:from-purple-700 hover:to-blue-700 font-medium"
          >
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CarFront className="mr-1.5 h-4 w-4" />}
            Save Vehicle
          </Button>
        </DialogFooter>

        <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(next) => !next && !busy && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete vehicle?</AlertDialogTitle>
              <AlertDialogDescription>Remove {deleteTarget?.vehicleName ?? deleteTarget?.name} from this event? Existing transport assignments may need to be removed first.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <Button variant="destructive" disabled={busy} onClick={remove}>{deleting ? 'Deleting...' : 'Delete Vehicle'}</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

function Field({ id, label, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}{required && <span className="text-destructive font-semibold"> *</span>}
      </Label>
      {children}
    </div>
  );
}

function Choice({ id, value, options, placeholder, onChange, disabled }) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className="h-9 text-xs bg-white dark:bg-background">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>{option}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
