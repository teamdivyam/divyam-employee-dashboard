/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Building2, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@components/components/ui/button';
import { Badge } from '@components/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@components/components/ui/alert-dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Textarea } from '@components/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './EventTable';
import EventDeleteMenu from './EventDeleteMenu';

const idOf = (value) => String(value?._id || value || '');
const room = () => ({ roomType: 'Deluxe Room', roomsBlocked: 1, maxGuestsPerRoom: 2, numbers: '' });
const initialForm = (item = {}) => ({ name: item.name || '', propertyType: item.propertyType || 'Hotel', city: item.city || '', address: item.address || '', contactPerson: item.contactPerson || '', contact: item.contact || '', roomInventory: item.roomInventory?.length ? item.roomInventory.map((row) => ({ ...row, numbers: (row.roomNumbers || []).join(', ') })) : [{ ...room(), roomType: item.roomTypes?.[0] || 'Deluxe Room', roomsBlocked: item.totalRooms || 1 }] });
const propertyTypes = ['Hotel', 'Resort', 'Guest House', 'Apartment', 'Homestay', 'Other'];
const roomTypes = ['Deluxe Room', 'Premium Room', 'Standard Room', 'Suite', 'Family Room', 'Other'];

function parseNumbers(text, limit) {
  if (!text.trim()) return [];
  const result = [];
  for (const token of text.split(',')) {
    const match = token.trim().match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/);
    if (!match) throw new Error('Use room numbers separated by commas, or a range such as 101-110.');
    const start = Number(match[1]), end = Number(match[2] ?? match[1]);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end < start || end - start + 1 > limit - result.length) throw new Error('Room numbers cannot exceed rooms blocked.');
    for (let value = start; value <= end; value += 1) result.push(value);
  }
  return result;
}

export default function EventPropertyDialog({ open, onOpenChange, properties = [], allocations = [], saving, deleting, onSave, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  useEffect(() => { if (open) { setEditing(null); setError(''); setDeleteTarget(null); } }, [open]);
  const begin = (item = {}) => { setEditing(item); setForm(initialForm(item)); setError(''); };
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateRoom = (index, key, value) => update('roomInventory', form.roomInventory.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    try {
      if (!form.name.trim() || !form.city.trim()) throw new Error('Property name and city / location are required.');
      const inventory = form.roomInventory.map((row) => {
        const roomsBlocked = Number(row.roomsBlocked), maxGuestsPerRoom = Number(row.maxGuestsPerRoom);
        if (!Number.isInteger(roomsBlocked) || roomsBlocked < 1 || !Number.isInteger(maxGuestsPerRoom) || maxGuestsPerRoom < 1) throw new Error('Room counts and guest capacity must be positive integers.');
        return { roomType: row.roomType.trim(), roomsBlocked, maxGuestsPerRoom, roomNumbers: parseNumbers(row.numbers, roomsBlocked) };
      });
      const numbers = inventory.flatMap((row) => row.roomNumbers);
      if (new Set(numbers).size !== numbers.length) throw new Error('Room numbers must be unique within the property.');
      const payload = { ...form, roomInventory: inventory };
      Object.keys(payload).forEach((key) => { if (typeof payload[key] === 'string') payload[key] = payload[key].trim(); });
      await onSave(payload, editing?._id);
      setEditing(null); setError('');
    } catch (failure) { setError(failure.response?.data?.message || failure.message || 'Unable to save property.'); }
  };
  const remove = async () => { try { await onDelete(deleteTarget._id); if (editing?._id === deleteTarget._id) setEditing(null); setDeleteTarget(null); } catch { /* The page displays the server error. */ } };
  return <Dialog open={open} onOpenChange={(next) => !saving && !deleting && onOpenChange(next)}>
    <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-1.5rem)] max-w-6xl flex-col gap-0 overflow-hidden rounded-lg p-0">
      <DialogHeader className="px-4 pb-3 pt-4 pr-12 text-left"><DialogTitle className="text-xl font-bold">Manage Properties</DialogTitle><DialogDescription className="text-xs">Add, edit or manage hotels/properties for this event.</DialogDescription></DialogHeader>
      <div className="min-h-0 space-y-3 overflow-y-auto px-4 pb-3">
        <section className="overflow-hidden rounded-md border border-border">
          <div className="flex items-center justify-between gap-3 bg-primary/[0.04] px-3 py-2"><div><h3 className="text-sm font-semibold">Existing Properties ({properties.length})</h3><p className="text-[11px] text-muted-foreground">Properties added for this event.</p></div><Button size="sm" disabled={saving || deleting} onClick={() => begin()}><Plus className="h-4 w-4" />Add Property</Button></div>
          <div className="overflow-x-auto"><Table headerVariant="section" className="min-w-[1000px] text-xs"><TableHeader><TableRow>{['#', 'Property / Hotel', 'Type', 'Location', 'Rooms Blocked', 'Rooms Allocated', 'Rooms Available', 'Contact Person', 'Status', 'Action'].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{properties.length ? properties.map((property, index) => {
            const blocked = property.roomInventory?.length ? property.roomInventory.reduce((sum, row) => sum + Number(row.roomsBlocked || 0), 0) : Number(property.totalRooms || 0);
            const assigned = allocations.filter((allocation) => idOf(allocation.property) === idOf(property) && allocation.status !== 'Cancelled');
            const allocated = new Set(assigned.flatMap((allocation) => allocation.roomNumbers || []).map(String)).size;
              return <TableRow key={idOf(property)}><TableCell className="text-center">{index + 1}</TableCell><TableCell><span className="flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />{property.name}</span></TableCell><TableCell>{property.propertyType || '-'}</TableCell><TableCell>{property.city || property.address || '-'}</TableCell><TableCell>{blocked}</TableCell><TableCell>{allocated}</TableCell><TableCell>{Math.max(0, blocked - allocated)}</TableCell><TableCell><p>{property.contactPerson || '-'}</p><p className="text-[10px] text-muted-foreground">{property.contact}</p></TableCell><TableCell><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300">{property.status || 'Active'}</Badge></TableCell><TableCell><div className="flex justify-center gap-1"><Button variant="outline" size="icon" className="h-8 w-8" aria-label={'Edit ' + property.name} disabled={saving || deleting} onClick={() => begin(property)}><Pencil className="h-4 w-4" /></Button><EventDeleteMenu label={property.name} disabled={saving || deleting} onDelete={onDelete ? () => setDeleteTarget(property) : undefined} /></div></TableCell></TableRow>;
          }) : <TableRow><TableCell colSpan={10} className="h-24 text-center text-muted-foreground">No properties added yet. Add a property to manage room inventory.</TableCell></TableRow>}</TableBody></Table></div>
        </section>
        {editing && <form id="event-property-form" onSubmit={submit} className="rounded-md border border-border p-3"><h3 className="text-sm font-semibold">{editing._id ? 'Edit Property' : 'Add New Property'}</h3><p className="mt-1 text-[11px] text-muted-foreground">Enter property details and room inventory for this event.</p><fieldset disabled={saving || deleting} className="mt-3 space-y-4 [&_input]:h-8 [&_input]:text-xs">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Field id="property-name" label="Property / Hotel Name" required><Input id="property-name" value={form.name} onChange={(event) => update('name', event.target.value)} required /></Field><Field id="property-type" label="Property Type" required><Choice id="property-type" value={form.propertyType} options={propertyTypes} disabled={saving} onChange={(value) => update('propertyType', value)} /></Field><Field id="property-city" label="City / Location" required><Input id="property-city" value={form.city} onChange={(event) => update('city', event.target.value)} required /></Field><Field id="property-address" label="Full Address"><Textarea id="property-address" rows={1} className="min-h-8 text-xs md:text-xs" value={form.address} onChange={(event) => update('address', event.target.value)} /></Field><Field id="property-person" label="Contact Person"><Input id="property-person" value={form.contactPerson} onChange={(event) => update('contactPerson', event.target.value)} /></Field><Field id="property-contact" label="Mobile Number"><Input id="property-contact" type="tel" value={form.contact} onChange={(event) => update('contact', event.target.value)} pattern="[+0-9\s()\-]+" /></Field></div>
          <div><h4 className="text-sm font-semibold">Room Inventory</h4><p className="mt-1 text-[11px] text-muted-foreground">Add room types and total rooms blocked for this event.</p><div className="mt-2 overflow-x-auto rounded-md border border-border"><Table headerVariant="section" className="min-w-[720px] text-xs"><TableHeader><TableRow>{['#', 'Room Type *', 'Rooms Blocked *', 'Max Guests per Room *', 'Room Numbers (Optional)', 'Action'].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{form.roomInventory.map((row, index) => <TableRow key={index}><TableCell>{index + 1}</TableCell><TableCell><Choice id={'room-type-' + index} label={'Room type ' + (index + 1)} value={row.roomType} options={roomTypes} disabled={saving} onChange={(value) => updateRoom(index, 'roomType', value)} /></TableCell><TableCell><Input aria-label={'Rooms blocked ' + (index + 1)} type="number" min="1" step="1" required value={row.roomsBlocked} onChange={(event) => updateRoom(index, 'roomsBlocked', event.target.value)} /></TableCell><TableCell><Input aria-label={'Max guests per room ' + (index + 1)} type="number" min="1" step="1" required value={row.maxGuestsPerRoom} onChange={(event) => updateRoom(index, 'maxGuestsPerRoom', event.target.value)} /></TableCell><TableCell><Input aria-label={'Room numbers ' + (index + 1)} placeholder="101-110 or 101, 102" value={row.numbers} onChange={(event) => updateRoom(index, 'numbers', event.target.value)} /></TableCell><TableCell><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={form.roomInventory.length === 1} aria-label={'Remove room type ' + (index + 1)} onClick={() => update('roomInventory', form.roomInventory.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>)}</TableBody></Table><Button type="button" size="sm" variant="secondary" className="m-2 text-primary" onClick={() => update('roomInventory', [...form.roomInventory, room()])}><Plus className="h-4 w-4" />Add Room Type</Button></div></div>
        </fieldset>{error && <p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}</form>}
      </div>
      <DialogFooter className="shrink-0 flex-row justify-between border-t border-border p-3 sm:justify-between"><Button variant="outline" disabled={saving || deleting} onClick={() => editing ? setEditing(null) : onOpenChange(false)}>{editing ? 'Cancel' : 'Close'}</Button>{editing && <Button type="submit" form="event-property-form" disabled={saving || deleting}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}Save Property</Button>}</DialogFooter>
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(next) => !next && !deleting && setDeleteTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete property?</AlertDialogTitle><AlertDialogDescription>Remove {deleteTarget?.name} from this event? Existing stay allocations may need to be removed first.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel><Button variant="destructive" disabled={deleting} onClick={remove}>{deleting ? 'Deleting...' : 'Delete Property'}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </DialogContent>
  </Dialog>;
}
function Field({ id, label, required, children }) { return <div className="space-y-1"><Label htmlFor={id} className="text-[11px] font-semibold">{label}{required && <span className="text-destructive"> *</span>}</Label>{children}</div>; }
function Choice({ id, label, value, options, onChange, disabled }) { return <Select value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger id={id} aria-label={label} className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{[...new Set([...options, value].filter(Boolean))].map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>; }

