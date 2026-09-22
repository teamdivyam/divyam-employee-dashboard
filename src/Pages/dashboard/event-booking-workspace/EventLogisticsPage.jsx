/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, Eye, Loader2, Plus, Search } from 'lucide-react';
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
const statuses = ['Planned', 'Dispatched', 'Reached', 'Returned', 'Cancelled'];
const emptyForm = { title: '', functionId: 'all', origin: '', destination: '', materials: '', vehicleName: '', vehicleRegistrationNumber: '', driverName: '', driverContact: '', dispatchAt: '', returnAt: '', coordinator: 'none', status: 'Planned', notes: '' };
const idOf = (value) => String(value?._id || value || '');

const dateParts = (value) => {
  if (!value) return { date: '-', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '-', time: '' };
  return {
    date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date),
    time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(date),
  };
};

const statusTone = (status) => {
  if (['Reached', 'Returned'].includes(status)) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'Dispatched') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === 'Cancelled') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
};

function LogisticsMovementDialog({ open, onOpenChange, movement, functions, employees, saving, onSave }) {
  const [form, setForm] = useState(emptyForm);
  useEffect(() => {
    if (!open) return;
    setForm(movement ? {
      title: movement.title || '', functionId: idOf(movement.appliesToFunctions?.[0]) || 'all', origin: movement.origin || '', destination: movement.destination || '',
      materials: movement.materials?.join(', ') || movement.materialSummary || '', vehicleName: movement.vehicleName || '', vehicleRegistrationNumber: movement.vehicleRegistrationNumber || '',
      driverName: movement.driverName || '', driverContact: movement.driverContact || '', dispatchAt: movement.dispatchAt ? new Date(movement.dispatchAt).toISOString().slice(0, 16) : '',
      returnAt: movement.returnAt ? new Date(movement.returnAt).toISOString().slice(0, 16) : '', coordinator: idOf(movement.coordinator) || 'none', status: movement.status || 'Planned', notes: movement.notes || '',
    } : emptyForm);
  }, [open, movement]);
  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    const eventFunction = functions.find((item) => idOf(item) === form.functionId);
    const coordinator = employees.find((item) => idOf(item) === form.coordinator);
    const materials = form.materials.split(',').map((item) => item.trim()).filter(Boolean);
    onSave({
      title: form.title.trim(), appliesToFunctions: eventFunction ? [eventFunction._id] : [], appliesToLabel: eventFunction?.name || 'All Functions',
      origin: form.origin.trim(), destination: form.destination.trim(), materials, materialSummary: materials.join(', '), vehicleName: form.vehicleName.trim(),
      vehicleRegistrationNumber: form.vehicleRegistrationNumber.trim(), driverName: form.driverName.trim(), driverContact: form.driverContact.trim(), dispatchAt: form.dispatchAt,
      returnAt: form.returnAt || null, coordinator: coordinator?._id || null, coordinatorName: coordinator?.name || '', status: form.status, notes: form.notes.trim(),
    });
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{movement ? 'Update' : 'Add'} Logistics Movement</DialogTitle></DialogHeader>
    <form id="event-logistics-form" onSubmit={submit} className="grid gap-4 py-2 sm:grid-cols-2">
      <div className="space-y-1.5"><Label>Movement / Trip</Label><Input value={form.title} onChange={(event) => setValue('title', event.target.value)} placeholder="Stage Setup Dispatch" required /></div>
      <div className="space-y-1.5"><Label>Applies to</Label><Select value={form.functionId} onValueChange={(value) => setValue('functionId', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Functions</SelectItem>{functions.map((item) => <SelectItem key={idOf(item)} value={idOf(item)}>{item.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><Label>Origin</Label><Input value={form.origin} onChange={(event) => setValue('origin', event.target.value)} placeholder="Warehouse" required /></div>
      <div className="space-y-1.5"><Label>Destination</Label><Input value={form.destination} onChange={(event) => setValue('destination', event.target.value)} placeholder="Main Venue" required /></div>
      <div className="space-y-1.5 sm:col-span-2"><Label>Material summary</Label><Input value={form.materials} onChange={(event) => setValue('materials', event.target.value)} placeholder="Stage panels, truss, ladders" /></div>
      <div className="space-y-1.5"><Label>Vehicle</Label><Input value={form.vehicleName} onChange={(event) => setValue('vehicleName', event.target.value)} placeholder="Eicher Pickup" /></div>
      <div className="space-y-1.5"><Label>Registration number</Label><Input value={form.vehicleRegistrationNumber} onChange={(event) => setValue('vehicleRegistrationNumber', event.target.value)} placeholder="UP70 CD5678" /></div>
      <div className="space-y-1.5"><Label>Driver</Label><Input value={form.driverName} onChange={(event) => setValue('driverName', event.target.value)} /></div>
      <div className="space-y-1.5"><Label>Driver contact</Label><Input value={form.driverContact} onChange={(event) => setValue('driverContact', event.target.value)} /></div>
      <div className="space-y-1.5"><Label>Dispatch date & time</Label><Input type="datetime-local" value={form.dispatchAt} onChange={(event) => setValue('dispatchAt', event.target.value)} required /></div>
      <div className="space-y-1.5"><Label>Return date & time</Label><Input type="datetime-local" value={form.returnAt} onChange={(event) => setValue('returnAt', event.target.value)} /></div>
      <div className="space-y-1.5"><Label>Coordinator</Label><Select value={form.coordinator} onValueChange={(value) => setValue('coordinator', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not assigned</SelectItem>{employees.map((item) => <SelectItem key={idOf(item)} value={idOf(item)}>{item.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(value) => setValue('status', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5 sm:col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={(event) => setValue('notes', event.target.value)} /></div>
    </form><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="event-logistics-form" disabled={saving || !form.title.trim() || !form.origin.trim() || !form.destination.trim() || !form.dispatchAt}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{movement ? 'Save Changes' : 'Add Movement'}</Button></DialogFooter>
  </DialogContent></Dialog>;
}

function LogisticsPanel({ data, functions, onAdd, onView }) {
  const movements = useMemo(() => data?.logistics || [], [data]);
  const [search, setSearch] = useState('');
  const [functionFilter, setFunctionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => movements.filter((item) => {
    const query = search.trim().toLowerCase();
    const ids = (item.appliesToFunctions || []).map(idOf);
    const sameDate = !dateFilter || (item.dispatchAt && new Date(item.dispatchAt).toISOString().slice(0, 10) === dateFilter);
    return (!query || [item.title, item.origin, item.destination, item.materialSummary, item.vehicleName, item.vehicleRegistrationNumber, item.driverName].some((value) => String(value || '').toLowerCase().includes(query)))
      && (functionFilter === 'all' || ids.includes(functionFilter)) && (status === 'all' || item.status === status) && sameDate;
  }), [movements, search, functionFilter, status, dateFilter]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [search, functionFilter, status, dateFilter]);

  return <div className="space-y-3">
    <div className="flex w-full min-w-0 flex-col gap-2 pb-0.5 2xl:flex-row 2xl:items-center">
      <EventOperationsNav active="logistics" />

      <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5 sm:grid-cols-[minmax(104px,1fr)_88px_108px_76px_auto] 2xl:w-[33rem] 2xl:flex-none">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search movement..."
            className="h-8 w-full pl-8 text-[11px]"
          />
        </div>

        <Select value={functionFilter} onValueChange={setFunctionFilter}>
          <SelectTrigger className="h-8 w-full text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Function</SelectItem>
            {functions.map((item) => <SelectItem key={idOf(item)} value={idOf(item)}>{item.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="h-8 w-full px-2 text-[11px]"
        />

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-full text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Status</SelectItem>
            {statuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          onClick={onAdd}
          className="col-span-2 h-8 w-full gap-1 whitespace-nowrap bg-blue-600 px-2.5 text-[11px] hover:bg-blue-700 sm:col-span-1"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Movement
        </Button>
      </div>
    </div>
    <Card className="overflow-hidden border-border shadow-sm"><CardContent className="p-0"><div className="overflow-x-auto"><Table className="min-w-[1250px]">
      <TableHeader><TableRow className="bg-muted/35"><TableHead className="w-12">#</TableHead><TableHead>Movement / Trip</TableHead><TableHead>Applies To</TableHead><TableHead>Route</TableHead><TableHead>Material Summary</TableHead><TableHead>Vehicle</TableHead><TableHead>Driver</TableHead><TableHead>Dispatch</TableHead><TableHead>Return</TableHead><TableHead>Coordinator</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
      <TableBody>{rows.length ? rows.map((item, index) => {
        const dispatch = dateParts(item.dispatchAt); const returned = dateParts(item.returnAt); const appliesTo = item.appliesTo?.map((entry) => entry.name).join(', ') || item.appliesToLabel || 'All Functions';
        return <TableRow key={item._id}><TableCell className="text-xs">{String((page - 1) * PAGE_SIZE + index + 1).padStart(2, '0')}</TableCell><TableCell className="font-semibold">{item.title}</TableCell><TableCell><span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">{appliesTo}</span></TableCell>
          <TableCell><div className="flex items-center gap-2 text-xs"><span>{item.origin}</span><ArrowRight className="h-3.5 w-3.5" /><span>{item.destination}</span></div></TableCell><TableCell className="max-w-48 text-xs">{item.materialSummary || item.materials?.join(', ') || '-'}</TableCell><TableCell className="text-xs"><p>{item.vehicleName || '-'}</p><p className="text-muted-foreground">{item.vehicleRegistrationNumber}</p></TableCell><TableCell className="text-xs"><p>{item.driverName || '-'}</p><p className="text-muted-foreground">{item.driverContact}</p></TableCell>
          <TableCell><div className="flex gap-2 text-xs"><CalendarDays className="mt-0.5 h-4 w-4 text-blue-700" /><div><p>{dispatch.date}</p><p className="text-muted-foreground">{dispatch.time}</p></div></div></TableCell><TableCell><div className="flex gap-2 text-xs"><CalendarDays className="mt-0.5 h-4 w-4 text-blue-700" /><div><p>{returned.date}</p><p className="text-muted-foreground">{returned.time}</p></div></div></TableCell><TableCell className="text-xs">{item.coordinator?.name || item.coordinatorName || '-'}</TableCell><TableCell><Badge variant="outline" className={statusTone(item.status)}>{item.status}</Badge></TableCell><TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => onView(item)} className="gap-1.5 text-blue-700"><Eye className="h-4 w-4" />View</Button></TableCell></TableRow>;
      }) : <TableRow><TableCell colSpan={12} className="h-32 text-center text-muted-foreground">No logistics movements found.</TableCell></TableRow>}</TableBody>
    </Table></div><div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground"><span>Showing {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} movements</span><div className="flex items-center gap-2"><Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>‹</Button><span className="grid h-8 min-w-8 place-items-center rounded-md bg-emerald-50 px-2 font-semibold text-emerald-700">{page}</span><Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>›</Button></div></div>
    </CardContent></Card>
  </div>;
}

export default function EventLogisticsPage() {
  const { eventId } = useParams(); const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false); const [selectedMovement, setSelectedMovement] = useState(null); const [editBookingOpen, setEditBookingOpen] = useState(false);
  const bookingQuery = useQuery({ queryKey: ['event-booking-detail', eventId], queryFn: async () => (await AdminService.getEventBookingDetail({ eventId })).data, enabled: Boolean(eventId) });
  const logisticsQuery = useQuery({ queryKey: ['event-booking-logistics', eventId], queryFn: async () => (await AdminService.getEventLogistics({ eventId, limit: 100 })).data, enabled: Boolean(eventId) });
  const managersQuery = useQuery({ queryKey: ['event-booking-managers'], queryFn: async () => (await AdminService.getEventBookingManagers({ limit: 100 })).data });
  const booking = getBookingDetail(bookingQuery.data); const employees = getEmployees(managersQuery.data); const functions = useMemo(() => booking?.functions || [], [booking]);
  const services = useMemo(() => Array.from(new Set([...(booking?.servicesRequired || []), ...(booking?.servicesSelected || []).map((item) => item.name || item.service).filter(Boolean)])), [booking]);
  const metrics = useMemo(() => ({ functions: functions.length, services: services.length, peakGuests: Math.max(Number(booking?.guestCount || 0), ...functions.map((item) => Number(item.guestCount || 0))), preferences: getFinalPreferenceCount(booking), approvals: (booking?.approvals || []).filter((item) => item.status === 'Pending').length }), [booking, functions, services]);
  const movementMutation = useMutation({ mutationFn: (payload) => selectedMovement?._id ? AdminService.updateEventLogisticsMovement({ eventId, movementId: selectedMovement._id, ...payload }) : AdminService.addEventLogisticsMovement({ eventId, ...payload }), onSuccess: () => { toast.success(selectedMovement ? 'Logistics movement updated' : 'Logistics movement added'); setDialogOpen(false); setSelectedMovement(null); logisticsQuery.refetch(); bookingQuery.refetch(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to save logistics movement') });
  const updateBookingMutation = useMutation({ mutationFn: (payload) => AdminService.updateEventBooking({ eventId, ...payload }), onSuccess: () => { toast.success('Booking updated'); setEditBookingOpen(false); bookingQuery.refetch(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to update booking') });
  const readyMutation = useMutation({ mutationFn: () => AdminService.markEventExecutionReady({ eventId }), onSuccess: () => { toast.success('Event marked execution ready'); bookingQuery.refetch(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to mark event ready') });
  if (bookingQuery.isLoading || logisticsQuery.isLoading) return <div className="crm-page grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!booking) return <div className="crm-page p-5"><Card className="crm-card"><CardContent className="p-8 text-center"><p className="font-semibold">Event booking not found</p><Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/assigned-events')}>Back to bookings</Button></CardContent></Card></div>;
  const selectTab = (key) => { if (key === 'overview') navigate(`/dashboard/assigned-events/${eventId}`); else if (key === 'plan') navigate(`/dashboard/assigned-events/${eventId}/plan/functions`); else if (key === 'operations') navigate(`/dashboard/assigned-events/${eventId}/operations`); else if (key === 'activity') toast.info('Event activity will be available here.'); else if (key === 'finance') toast.info('Finance & Files will be available here.'); };
  return <div className="crm-page min-h-screen space-y-3 p-3 sm:p-4 lg:p-5"><EventFunctionsHeader booking={booking} metrics={metrics} onBack={() => navigate('/dashboard/assigned-events')} onEdit={() => setEditBookingOpen(true)} onMarkReady={() => readyMutation.mutate()} onOpenPlanning={() => document.getElementById('event-logistics')?.scrollIntoView({ behavior: 'smooth' })} primaryActionLabel="Open Operations Plan" /><EventDetailTabs activePrimary="operations" onSelect={selectTab} /><div id="event-logistics"><LogisticsPanel data={logisticsQuery.data} functions={functions} onAdd={() => { setSelectedMovement(null); setDialogOpen(true); }} onView={(item) => { setSelectedMovement(item); setDialogOpen(true); }} /></div><LogisticsMovementDialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setSelectedMovement(null); }} movement={selectedMovement} functions={functions} employees={employees} saving={movementMutation.isPending} onSave={(payload) => movementMutation.mutate(payload)} /><EditBookingDialog open={editBookingOpen} onOpenChange={setEditBookingOpen} booking={booking} employees={employees} saving={updateBookingMutation.isPending} onSave={(payload) => updateBookingMutation.mutate(payload)} /></div>;
}
