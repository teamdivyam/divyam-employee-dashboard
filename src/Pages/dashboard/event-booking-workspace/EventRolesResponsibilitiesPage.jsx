/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Boxes, Eye, Loader2, Plus, Search, Truck, UsersRound } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import AdminService from '../../../services/event-booking-workspace.service';
import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { Checkbox } from '@components/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/EventTable';
import { Textarea } from '@components/components/ui/textarea';
import { EditBookingDialog, getBookingDetail, getEmployees } from './components/EventBookingComponents';
import EventDetailTabs from './components/EventDetailTabs';
import EventFunctionsHeader from './components/EventFunctionsHeader';
import EventOperationsNav from './components/EventOperationsNav';
import { getFunctionThemeTone } from './components/eventFunctionTheme';
import { getFinalPreferenceCount } from './eventBookingDashboard.utils';

const PAGE_SIZE = 10;
const idOf = (value) => String(value?._id || value || '');
const emptyForm = { teamMember: 'none', eventRole: '', appliesToFunctions: [], responsibilities: '', resourceRequirements: '', status: 'Active', notes: '' };
const initials = (name) => String(name || 'TM').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

const parseLines = (value) => String(value || '').split('\n').map((line) => line.trim()).filter(Boolean);
const parseResources = (value) => parseLines(value).map((line) => {
  const separator = line.indexOf(':');
  return separator < 0 ? { name: line, value: '' } : { name: line.slice(0, separator).trim(), value: line.slice(separator + 1).trim() };
}).filter((item) => item.name);

function ResponsibilitySheetDialog({ open, onOpenChange, sheet, functions, employees, saving, onSave }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(sheet ? {
      teamMember: idOf(sheet.teamMember) || 'none',
      eventRole: sheet.eventRole || '',
      appliesToFunctions: (sheet.appliesToFunctions || []).map(idOf),
      responsibilities: (sheet.responsibilities || []).join('\n'),
      resourceRequirements: (sheet.resourceRequirements || []).map((item) => `${item.name}${item.value ? `: ${item.value}` : ''}`).join('\n'),
      status: sheet.status || 'Active',
      notes: sheet.notes || '',
    } : emptyForm);
  }, [open, sheet]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleFunction = (functionId, checked) => update('appliesToFunctions', checked ? [...form.appliesToFunctions, functionId] : form.appliesToFunctions.filter((id) => id !== functionId));
  const submit = (event) => {
    event.preventDefault();
    const member = employees.find((item) => idOf(item) === form.teamMember);
    const selectedFunctions = functions.filter((item) => form.appliesToFunctions.includes(idOf(item)));
    onSave({
      teamMember: member?._id || null,
      teamMemberName: member?.name || '',
      eventRole: form.eventRole.trim(),
      appliesToFunctions: selectedFunctions.map((item) => item._id),
      appliesToLabel: selectedFunctions.length ? selectedFunctions.map((item) => item.name).join(', ') : 'All Functions',
      responsibilities: parseLines(form.responsibilities),
      resourceRequirements: parseResources(form.resourceRequirements),
      status: form.status,
      notes: form.notes.trim(),
    });
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader><DialogTitle>{sheet ? 'Responsibility Sheet' : 'Create Responsibility Sheet'}</DialogTitle></DialogHeader>
      <form id="responsibility-sheet-form" onSubmit={submit} className="grid gap-4 py-2 sm:grid-cols-2">
        <div className="space-y-1.5"><Label>Team member</Label><Select value={form.teamMember} onValueChange={(value) => update('teamMember', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Select team member</SelectItem>{employees.map((item) => <SelectItem key={idOf(item)} value={idOf(item)}>{item.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label>Event role</Label><Input value={form.eventRole} onChange={(event) => update('eventRole', event.target.value)} placeholder="Event Manager (Overall)" required /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Applies to</Label><div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">{functions.length ? functions.map((item) => { const functionId = idOf(item); return <label key={functionId} className="flex cursor-pointer items-center gap-2 text-xs"><Checkbox checked={form.appliesToFunctions.includes(functionId)} onCheckedChange={(checked) => toggleFunction(functionId, checked === true)} />{item.name}</label>; }) : <span className="text-xs text-muted-foreground">No functions added. The sheet will apply to all functions.</span>}</div><p className="text-[11px] text-muted-foreground">Leave all unchecked to apply this role to every function.</p></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Responsibilities</Label><Textarea value={form.responsibilities} onChange={(event) => update('responsibilities', event.target.value)} placeholder={'Enter one responsibility per line\nOverall event execution and coordination\nClient coordination and on-ground decisions'} className="min-h-32" required /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Resource requirements</Label><Textarea value={form.resourceRequirements} onChange={(event) => update('resourceRequirements', event.target.value)} placeholder={'Enter one resource per line using Name: Value\nManpower: 4\nVehicle: 1\nWalkie-Talkies: 6'} className="min-h-28" /></div>
        <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(value) => update('status', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent></Select></div>
        <div className="space-y-1.5"><Label>Notes</Label><Input value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Optional coordination notes" /></div>
      </form>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="responsibility-sheet-form" disabled={saving || !form.eventRole.trim() || !parseLines(form.responsibilities).length}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{sheet ? 'Save Changes' : 'Create Sheet'}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

function AppliesTo({ sheet, functions }) {
  const selected = functions.filter((item) => (sheet.appliesToFunctions || []).map(idOf).includes(idOf(item)));
  if (!selected.length) return <Badge className="border-0 bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/40">All Functions</Badge>;
  return (
    <div className="flex max-w-48 flex-wrap gap-1">
      {selected.map((item, selectedIndex) => {
        const functionIndex = functions.findIndex((entry) => idOf(entry) === idOf(item));
        const toneIndex = functionIndex >= 0 ? functionIndex : selectedIndex;

        return (
          <Badge
            key={idOf(item)}
            variant="outline"
            className={`rounded px-2 py-0.5 text-[10px] ${getFunctionThemeTone(item.name, toneIndex)}`}
          >
            {item.name}
          </Badge>
        );
      })}
    </div>
  );
}

function ResourceList({ resources }) {
  if (!resources?.length) return <span className="text-xs text-muted-foreground">No special resources</span>;
  return <ul className="space-y-1">{resources.slice(0, 4).map((item, index) => { const Icon = /vehicle|van|driver|truck/i.test(item.name) ? Truck : /equipment|tool|material/i.test(item.name) ? Boxes : UsersRound; return <li key={`${item.name}-${index}`} className="flex items-center gap-2 text-xs"><Icon className="h-3.5 w-3.5 text-blue-800" /><span>{item.name}{item.value ? `: ${item.value}` : ''}</span></li>; })}</ul>;
}

function ResponsibilitiesPanel({ data, functions, onAdd, onView }) {
  const sheets = useMemo(() => data?.roleResponsibilities || [], [data]);
  const [functionFilter, setFunctionFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const roles = useMemo(() => Array.from(new Set(sheets.map((item) => item.eventRole).filter(Boolean))), [sheets]);
  const countFor = (functionId) => sheets.filter((sheet) => (sheet.appliesToFunctions || []).map(idOf).includes(functionId)).length;
  const filtered = useMemo(() => sheets.filter((sheet) => {
    const query = search.trim().toLowerCase();
    return (!query || [sheet.teamMember?.name, sheet.teamMemberName, sheet.eventRole, ...(sheet.responsibilities || [])].some((value) => String(value || '').toLowerCase().includes(query)))
      && (roleFilter === 'all' || sheet.eventRole === roleFilter)
      && (functionFilter === 'all' || (sheet.appliesToFunctions || []).map(idOf).includes(functionFilter));
  }), [functionFilter, roleFilter, search, sheets]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [functionFilter, roleFilter, search]);

  return <div className="space-y-3">
    <EventOperationsNav active="roles" />
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2"><Button size="sm" variant={functionFilter === 'all' ? 'secondary' : 'ghost'} onClick={() => setFunctionFilter('all')} className="h-8 text-xs">All Functions ({sheets.length})</Button>{functions.map((item) => <Button key={idOf(item)} size="sm" variant={functionFilter === idOf(item) ? 'secondary' : 'ghost'} onClick={() => setFunctionFilter(idOf(item))} className="h-8 text-xs">{item.name} ({countFor(idOf(item))})</Button>)}</div>
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
        <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger className="h-9 w-36 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Roles</SelectItem>{roles.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select>
        <div className="relative min-w-48 flex-1 sm:max-w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search team member or role..." className="h-9 pl-9 text-xs" /></div>
        <Button size="sm" onClick={onAdd} className="h-9 shrink-0 gap-1.5 bg-blue-600 text-xs hover:bg-blue-700"><Plus className="h-4 w-4" />Create Responsibility Sheet</Button>
      </div>
    </div>
    <Card className="overflow-hidden border-border shadow-sm"><CardContent className="p-0"><div className="overflow-x-auto"><Table className="min-w-[1050px]">
      <TableHeader><TableRow className="bg-muted/30"><TableHead>Team Member</TableHead><TableHead>Event Role</TableHead><TableHead>Applies To</TableHead><TableHead className="w-[25%]">Responsibility Summary</TableHead><TableHead className="w-[22%]">Resource Requirements</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
      <TableBody>{rows.length ? rows.map((sheet, rowIndex) => { const memberName = sheet.teamMember?.name || sheet.teamMemberName || 'Unassigned'; const responsibilities = sheet.responsibilities || []; return <TableRow key={sheet._id}>
        <TableCell><div className="flex items-center gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${['bg-blue-50 text-blue-800', 'bg-teal-50 text-teal-800', 'bg-violet-50 text-violet-800', 'bg-orange-50 text-orange-800'][rowIndex % 4]}`}>{initials(memberName)}</span><span className="font-semibold">{memberName}</span></div></TableCell>
        <TableCell><p className="max-w-44 font-semibold">{sheet.eventRole}</p>{sheet.status === 'Inactive' && <Badge variant="outline" className="mt-1 text-[10px]">Inactive</Badge>}</TableCell>
        <TableCell><AppliesTo sheet={sheet} functions={functions} /></TableCell>
        <TableCell><ul className="list-disc space-y-0.5 pl-4 text-xs">{responsibilities.slice(0, 4).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>{responsibilities.length > 4 && <button type="button" onClick={() => onView(sheet)} className="mt-1 text-xs font-semibold text-blue-700">+ {responsibilities.length - 4} more responsibilities</button>}</TableCell>
        <TableCell><ResourceList resources={sheet.resourceRequirements} /></TableCell>
        <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => onView(sheet)} className="gap-1.5 text-blue-700"><Eye className="h-4 w-4" />View Sheet</Button></TableCell>
      </TableRow>; }) : <TableRow><TableCell colSpan={6} className="h-40 text-center text-sm text-muted-foreground">No responsibility sheets found.</TableCell></TableRow>}</TableBody>
    </Table></div><div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground"><span>Showing {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} sheets</span><div className="flex items-center gap-2"><Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>‹</Button><span className="grid h-8 min-w-8 place-items-center rounded-md bg-emerald-50 px-2 font-semibold text-emerald-700">{page}</span><Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>›</Button></div></div></CardContent></Card>
  </div>;
}

export default function EventRolesResponsibilitiesPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [editBookingOpen, setEditBookingOpen] = useState(false);
  const bookingQuery = useQuery({ queryKey: ['event-booking-detail', eventId], queryFn: async () => (await AdminService.getEventBookingDetail({ eventId })).data, enabled: Boolean(eventId) });
  const rolesQuery = useQuery({ queryKey: ['event-booking-roles-responsibilities', eventId], queryFn: async () => (await AdminService.getEventRoleResponsibilities({ eventId, limit: 200 })).data, enabled: Boolean(eventId) });
  const managersQuery = useQuery({ queryKey: ['event-booking-managers'], queryFn: async () => (await AdminService.getEventBookingManagers({ limit: 200 })).data });
  const booking = getBookingDetail(bookingQuery.data);
  const functions = useMemo(() => booking?.functions || [], [booking]);
  const employees = useMemo(() => { const values = [...getEmployees(managersQuery.data), ...(booking?.assignedTeam || []).map((item) => item.employee).filter(Boolean)]; return Array.from(new Map(values.map((item) => [idOf(item), item])).values()); }, [booking?.assignedTeam, managersQuery.data]);
  const services = useMemo(() => Array.from(new Set([...(booking?.servicesRequired || []), ...(booking?.servicesSelected || []).map((item) => item.service).filter(Boolean)])), [booking]);
  const metrics = useMemo(() => ({ functions: functions.length, services: services.length, peakGuests: Math.max(Number(booking?.guestCount || 0), ...functions.map((item) => Number(item.guestCount || 0))), preferences: getFinalPreferenceCount(booking), approvals: (booking?.approvals || []).filter((item) => item.status === 'Pending').length }), [booking, functions, services]);
  const sheetMutation = useMutation({ mutationFn: (payload) => selectedSheet?._id ? AdminService.updateEventRoleResponsibility({ eventId, sheetId: selectedSheet._id, ...payload }) : AdminService.addEventRoleResponsibility({ eventId, ...payload }), onSuccess: () => { toast.success(selectedSheet ? 'Responsibility sheet updated' : 'Responsibility sheet created'); setDialogOpen(false); setSelectedSheet(null); rolesQuery.refetch(); bookingQuery.refetch(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to save responsibility sheet') });
  const updateBookingMutation = useMutation({ mutationFn: (payload) => AdminService.updateEventBooking({ eventId, ...payload }), onSuccess: () => { toast.success('Booking updated'); setEditBookingOpen(false); bookingQuery.refetch(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to update booking') });
  const readyMutation = useMutation({ mutationFn: () => AdminService.markEventExecutionReady({ eventId }), onSuccess: () => { toast.success('Event marked execution ready'); bookingQuery.refetch(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to mark event ready') });

  if (bookingQuery.isLoading || rolesQuery.isLoading) return <div className="crm-page grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!booking) return <div className="crm-page p-5"><Card><CardContent className="p-8 text-center"><p className="font-semibold">Event booking not found</p><Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/assigned-events')}>Back to bookings</Button></CardContent></Card></div>;
  const selectTab = (key) => { if (key === 'overview') navigate(`/dashboard/assigned-events/${eventId}`); else if (key === 'plan') navigate(`/dashboard/assigned-events/${eventId}/plan/functions`); else if (key === 'operations') navigate(`/dashboard/assigned-events/${eventId}/operations`); else if (key === 'activity') toast.info('Event activity will be available here.'); else if (key === 'finance') toast.info('Finance & Files will be available here.'); };

  return <div className="crm-page min-h-screen space-y-3 p-3 sm:p-4 lg:p-5"><EventFunctionsHeader booking={booking} metrics={metrics} onBack={() => navigate('/dashboard/assigned-events')} onEdit={() => setEditBookingOpen(true)} onMarkReady={() => readyMutation.mutate()} onOpenPlanning={() => document.getElementById('event-roles')?.scrollIntoView({ behavior: 'smooth' })} primaryActionLabel="Open Operations Plan" /><EventDetailTabs activePrimary="operations" onSelect={selectTab} /><div id="event-roles"><ResponsibilitiesPanel data={rolesQuery.data} functions={functions} onAdd={() => { setSelectedSheet(null); setDialogOpen(true); }} onView={(sheet) => { setSelectedSheet(sheet); setDialogOpen(true); }} /></div><ResponsibilitySheetDialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setSelectedSheet(null); }} sheet={selectedSheet} functions={functions} employees={employees} saving={sheetMutation.isPending} onSave={(payload) => sheetMutation.mutate(payload)} /><EditBookingDialog open={editBookingOpen} onOpenChange={setEditBookingOpen} booking={booking} employees={employees} saving={updateBookingMutation.isPending} onSave={(payload) => updateBookingMutation.mutate(payload)} /></div>;
}
