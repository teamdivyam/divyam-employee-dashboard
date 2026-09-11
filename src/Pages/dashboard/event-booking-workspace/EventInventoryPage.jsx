/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Boxes, CalendarDays, Eye, Loader2, Plus, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import AdminService from '../../../services/event-booking-workspace.service';
import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/EventTable';
import { EditBookingDialog, getBookingDetail, getEmployees } from './components/EventBookingComponents';
import EventDetailTabs from './components/EventDetailTabs';
import EventFunctionsHeader from './components/EventFunctionsHeader';
import EventOperationsNav from './components/EventOperationsNav';
import { getFinalPreferenceCount } from './eventBookingDashboard.utils';

const PAGE_SIZE = 10;
const companyStatuses = ['Pending', 'Reserved', 'Partially Reserved', 'Shortage', 'Dispatched', 'Returned', 'Cancelled'];
const vendorStatuses = ['Pending', 'Confirmed', 'Partial', 'Shortage', 'Delivered', 'Returned', 'Cancelled'];
const emptyForm = {
  source: 'Company', itemName: '', sku: '', category: '', unitLabel: 'pcs', requiredQuantity: '1',
  reservedQuantity: '0', vendor: 'none', functionId: 'all', dispatchAt: '', returnAt: '', coordinator: 'none', status: 'Pending', notes: '',
};
const idOf = (value) => String(value?._id || value || '');

const formatDateTime = (value) => {
  if (!value) return { date: '-', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '-', time: '' };
  return {
    date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date),
    time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(date),
  };
};

const statusTone = (status) => {
  if (['Reserved', 'Returned', 'Confirmed', 'Delivered'].includes(status)) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (['Partially Reserved', 'Partial', 'Pending'].includes(status)) return 'border-orange-200 bg-orange-50 text-orange-700';
  if (status === 'Shortage' || status === 'Cancelled') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
};

function InventoryRequirementDialog({ open, onOpenChange, requirement, functions, employees, vendors, source, saving, onSave }) {
  const [form, setForm] = useState(emptyForm);

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
  const submit = (event) => {
    event.preventDefault();
    const selectedFunction = functions.find((item) => idOf(item) === form.functionId);
    const employee = employees.find((item) => idOf(item) === form.coordinator);
    const vendor = vendors.find((item) => idOf(item) === form.vendor);
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{requirement ? 'Update' : 'Add'} {form.source} Inventory Requirement</DialogTitle></DialogHeader>
        <form id="event-inventory-form" onSubmit={submit} className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Source</Label><Select value={form.source} onValueChange={(value) => setForm((current) => ({ ...current, source: value, vendor: 'none', status: 'Pending' }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Company">Company</SelectItem><SelectItem value="Vendor">Vendor</SelectItem></SelectContent></Select></div>
          {form.source === 'Vendor' && <div className="space-y-1.5"><Label>Vendor</Label><Select value={form.vendor} onValueChange={(value) => setValue('vendor', value)}><SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger><SelectContent><SelectItem value="none">Select vendor</SelectItem>{vendors.map((item) => <SelectItem key={idOf(item)} value={idOf(item)}>{item.companyName || item.name}</SelectItem>)}</SelectContent></Select></div>}
          <div className="space-y-1.5"><Label>Item name</Label><Input value={form.itemName} onChange={(event) => setValue('itemName', event.target.value)} placeholder="Banquet Chairs" required /></div>
          <div className="space-y-1.5"><Label>Category</Label><Input value={form.category} onChange={(event) => setValue('category', event.target.value)} placeholder="Furniture" required /></div>
          <div className="space-y-1.5"><Label>SKU (optional)</Label><Input value={form.sku} onChange={(event) => setValue('sku', event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Required quantity</Label><Input type="number" min="1" value={form.requiredQuantity} onChange={(event) => setValue('requiredQuantity', event.target.value)} required /></div>
          <div className="space-y-1.5"><Label>Reserved quantity</Label><Input type="number" min="0" value={form.reservedQuantity} onChange={(event) => setValue('reservedQuantity', event.target.value)} required /></div>
          <div className="space-y-1.5"><Label>Unit</Label><Input value={form.unitLabel} onChange={(event) => setValue('unitLabel', event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Applies to</Label><Select value={form.functionId} onValueChange={(value) => setValue('functionId', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Functions</SelectItem>{functions.map((item) => <SelectItem key={idOf(item)} value={idOf(item)}>{item.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Dispatch date & time</Label><Input type="datetime-local" value={form.dispatchAt} onChange={(event) => setValue('dispatchAt', event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Return date & time</Label><Input type="datetime-local" value={form.returnAt} onChange={(event) => setValue('returnAt', event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Coordinator</Label><Select value={form.coordinator} onValueChange={(value) => setValue('coordinator', value)}><SelectTrigger><SelectValue placeholder="Select coordinator" /></SelectTrigger><SelectContent><SelectItem value="none">Not assigned</SelectItem>{employees.map((item) => <SelectItem key={idOf(item)} value={idOf(item)}>{item.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(value) => setValue('status', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(form.source === 'Vendor' ? vendorStatuses : companyStatuses).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={(event) => setValue('notes', event.target.value)} placeholder="Optional notes" /></div>
        </form>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="event-inventory-form" disabled={saving || !form.itemName.trim() || !form.category.trim() || (form.source === 'Vendor' && form.vendor === 'none')}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{requirement ? 'Save Changes' : 'Add Requirement'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EventInventoryPanel({ data, onAdd, onView }) {
  const requirements = useMemo(() => data?.inventory || [], [data]);
  const [source, setSource] = useState('Company');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const categories = data?.filters?.categories || [];
  const summary = data?.summary || {};
  const activeStatuses = source === 'Vendor' ? vendorStatuses : companyStatuses;

  const filtered = useMemo(() => requirements.filter((item) => {
    const query = search.trim().toLowerCase();
    return item.source === source
      && (category === 'all' || item.category === category)
      && (status === 'all' || item.status === status)
      && (!query || [item.itemName, item.sku, item.category, item.coordinatorName, item.coordinator?.name].some((value) => String(value || '').toLowerCase().includes(query)));
  }), [requirements, source, category, status, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectSource = (value) => { setSource(value); setStatus('all'); };

  useEffect(() => setPage(1), [source, search, category, status]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <EventOperationsNav active="inventory" />
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <div className="relative min-w-44 flex-1 sm:max-w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search inventory item..."
              className="h-8 pl-9 text-xs"
            />
          </div>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Inventory Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Inventory Status</SelectItem>
              {activeStatuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button type="button" variant={source === 'Company' ? 'default' : 'outline'} size="sm" onClick={() => selectSource('Company')} className="min-w-32">Company ({summary.company || 0})</Button>
          <Button type="button" variant={source === 'Vendor' ? 'default' : 'outline'} size="sm" onClick={() => selectSource('Vendor')} className="min-w-32">Vendor ({summary.vendor || 0})</Button>
        </div>
        <Button size="sm" onClick={() => onAdd(source)} className="h-9 gap-1.5 bg-blue-600 text-xs hover:bg-blue-700"><Plus className="h-4 w-4" />Add {source} Requirement</Button>
      </div>

      <Card className="overflow-hidden border-border shadow-sm"><CardContent className="p-0">
        <div className="overflow-x-auto"><Table className="min-w-[1120px]">
          <TableHeader><TableRow className="bg-muted/35"><TableHead>Item / Category</TableHead>{source === 'Vendor' && <TableHead>Vendor</TableHead>}<TableHead>Applies To</TableHead><TableHead className="w-56">{source === 'Vendor' ? 'Fulfilment' : 'Allocation'}</TableHead><TableHead>{source === 'Vendor' ? 'Delivery' : 'Dispatch'}</TableHead><TableHead>{source === 'Vendor' ? 'Return / Pickup' : 'Return'}</TableHead><TableHead>Coordinator</TableHead><TableHead>Inventory Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
          <TableBody>{rows.length ? rows.map((item) => {
            const dispatch = formatDateTime(item.dispatchAt);
            const returned = formatDateTime(item.returnAt);
            const required = Number(item.requiredQuantity || 0);
            const reserved = Number(item.reservedQuantity || 0);
            const percent = required ? Math.min(100, Math.round((reserved / required) * 100)) : 0;
            const appliesTo = item.appliesTo?.map((entry) => entry.name).join(', ') || item.appliesToLabel || 'All Functions';
            return <TableRow key={item._id}>
              <TableCell><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-50 text-cyan-700"><Boxes className="h-5 w-5" /></span><div><p className="font-semibold text-foreground">{item.itemName}</p><p className="text-xs text-muted-foreground">{item.category}{item.sku ? ` · ${item.sku}` : ''}</p></div></div></TableCell>
              {source === 'Vendor' && <TableCell className="text-xs font-medium">{item.vendor?.companyName || 'Not assigned'}</TableCell>}
              <TableCell><span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">{appliesTo}</span></TableCell>
              <TableCell><div className="space-y-1"><div className="flex justify-between text-xs"><span className="font-medium">{reserved} / {required} {source === 'Vendor' ? 'confirmed' : `${item.unitLabel || 'pcs'} reserved`}</span>{Number(item.shortageQuantity || 0) > 0 && <span className="font-semibold text-red-600">{item.shortageQuantity} {source === 'Vendor' ? 'pending' : 'short'}</span>}</div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${percent === 100 ? 'bg-emerald-600' : 'bg-orange-500'}`} style={{ width: `${percent}%` }} /></div></div></TableCell>
              <TableCell><div className="flex gap-2 text-xs"><CalendarDays className="mt-0.5 h-4 w-4 text-blue-700" /><div><p>{dispatch.date}</p><p className="text-muted-foreground">{dispatch.time}</p></div></div></TableCell>
              <TableCell><div className="flex gap-2 text-xs"><CalendarDays className="mt-0.5 h-4 w-4 text-blue-700" /><div><p>{returned.date}</p><p className="text-muted-foreground">{returned.time}</p></div></div></TableCell>
              <TableCell className="text-xs">{item.coordinator?.name || item.coordinatorName || '-'}</TableCell>
              <TableCell><Badge variant="outline" className={statusTone(item.status)}>{item.status}</Badge></TableCell>
              <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => onView(item)} className="gap-1.5 text-blue-700"><Eye className="h-4 w-4" />View</Button></TableCell>
            </TableRow>;
          }) : <TableRow><TableCell colSpan={source === 'Vendor' ? 9 : 8} className="h-32 text-center text-muted-foreground">No {source.toLowerCase()} inventory requirements found.</TableCell></TableRow>}</TableBody>
        </Table></div>
        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground"><span>Showing {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} items</span><div className="flex items-center gap-2"><Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>‹</Button><span className="grid h-8 min-w-8 place-items-center rounded-md bg-emerald-50 px-2 font-semibold text-emerald-700">{page}</span><Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>›</Button></div></div>
      </CardContent></Card>
    </div>
  );
}

export default function EventInventoryPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [dialogSource, setDialogSource] = useState('Company');
  const [editBookingOpen, setEditBookingOpen] = useState(false);

  const bookingQuery = useQuery({ queryKey: ['event-booking-detail', eventId], queryFn: async () => (await AdminService.getEventBookingDetail({ eventId })).data, enabled: Boolean(eventId) });
  const inventoryQuery = useQuery({ queryKey: ['event-booking-inventory', eventId], queryFn: async () => (await AdminService.getEventInventory({ eventId, limit: 100 })).data, enabled: Boolean(eventId) });
  const managersQuery = useQuery({ queryKey: ['event-booking-managers'], queryFn: async () => (await AdminService.getEventBookingManagers({ limit: 100 })).data });
  const booking = getBookingDetail(bookingQuery.data);
  const employees = getEmployees(managersQuery.data);
  const functions = useMemo(() => booking?.functions || [], [booking]);
  const vendors = useMemo(() => {
    const byId = new Map();
    (booking?.vendorAssignments || []).forEach((assignment) => {
      const vendor = assignment.vendor;
      if (vendor && idOf(vendor)) byId.set(idOf(vendor), vendor);
    });
    return [...byId.values()];
  }, [booking]);
  const services = useMemo(() => Array.from(new Set([...(booking?.servicesRequired || []), ...(booking?.servicesSelected || []).map((item) => item.service).filter(Boolean)])), [booking]);
  const metrics = useMemo(() => ({ functions: functions.length, services: services.length, peakGuests: Math.max(Number(booking?.guestCount || 0), ...functions.map((item) => Number(item.guestCount || 0))), preferences: getFinalPreferenceCount(booking), approvals: (booking?.approvals || []).filter((item) => item.status === 'Pending').length }), [booking, functions, services]);

  const inventoryMutation = useMutation({
    mutationFn: (payload) => selectedRequirement?._id
      ? AdminService.updateEventInventoryRequirement({ eventId, requirementId: selectedRequirement._id, ...payload })
      : AdminService.addEventInventoryRequirement({ eventId, ...payload }),
    onSuccess: () => { toast.success(selectedRequirement ? 'Inventory requirement updated' : 'Inventory requirement added'); setDialogOpen(false); setSelectedRequirement(null); inventoryQuery.refetch(); bookingQuery.refetch(); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to save inventory requirement'),
  });
  const updateBookingMutation = useMutation({ mutationFn: (payload) => AdminService.updateEventBooking({ eventId, ...payload }), onSuccess: () => { toast.success('Booking updated'); setEditBookingOpen(false); bookingQuery.refetch(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to update booking') });
  const readyMutation = useMutation({ mutationFn: () => AdminService.markEventExecutionReady({ eventId }), onSuccess: () => { toast.success('Event marked execution ready'); bookingQuery.refetch(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to mark event ready') });

  if (bookingQuery.isLoading || inventoryQuery.isLoading) return <div className="crm-page grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!booking) return <div className="crm-page p-5"><Card className="crm-card"><CardContent className="p-8 text-center"><p className="font-semibold">Event booking not found</p><Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/assigned-events')}>Back to bookings</Button></CardContent></Card></div>;

  const selectTab = (key) => {
    if (key === 'overview') navigate(`/dashboard/assigned-events/${eventId}`);
    else if (key === 'plan') navigate(`/dashboard/assigned-events/${eventId}/plan/functions`);
    else if (key === 'operations') navigate(`/dashboard/assigned-events/${eventId}/operations`);
    else if (key === 'activity') toast.info('Event activity will be available here.');
    else if (key === 'finance') toast.info('Finance & Files will be available here.');
  };
  const openAdd = (source) => { setSelectedRequirement(null); setDialogSource(source); setDialogOpen(true); };
  const openView = (item) => { setSelectedRequirement(item); setDialogSource(item.source || 'Company'); setDialogOpen(true); };

  return <div className="crm-page min-h-screen space-y-3 p-3 sm:p-4 lg:p-5">
    <EventFunctionsHeader booking={booking} metrics={metrics} onBack={() => navigate('/dashboard/assigned-events')} onEdit={() => setEditBookingOpen(true)} onMarkReady={() => readyMutation.mutate()} onOpenPlanning={() => document.getElementById('event-inventory')?.scrollIntoView({ behavior: 'smooth' })} primaryActionLabel="Open Operations Plan" />
    <EventDetailTabs activePrimary="operations" onSelect={selectTab} />
    <div id="event-inventory"><EventInventoryPanel data={inventoryQuery.data} onAdd={openAdd} onView={openView} /></div>
    <InventoryRequirementDialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setSelectedRequirement(null); }} requirement={selectedRequirement} functions={functions} employees={employees} vendors={vendors} source={dialogSource} saving={inventoryMutation.isPending} onSave={(payload) => inventoryMutation.mutate(payload)} />
    <EditBookingDialog open={editBookingOpen} onOpenChange={setEditBookingOpen} booking={booking} employees={employees} saving={updateBookingMutation.isPending} onSave={(payload) => updateBookingMutation.mutate(payload)} />
  </div>;
}
