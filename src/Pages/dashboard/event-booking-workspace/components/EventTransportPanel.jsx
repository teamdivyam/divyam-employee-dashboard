/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { BusFront, CarFront, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, Eye, MapPin, MapPinCheck, MapPinned, Plus, Search } from 'lucide-react';
import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { Input } from '@components/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './EventTable';
import EventGuestsNav from './EventGuestsNav';
import EventSummaryCards from './EventSummaryCards';
import EventDeleteMenu from './EventDeleteMenu';

const idOf = (value) => String(value?._id || value || '');
const routeKey = (item) => JSON.stringify([item.origin || '', item.destination || '']);
const statusOf = (item) => item.status || (item.vehicle ? 'Assigned' : 'Pending Assignment');
const statuses = ['Pending Assignment', 'Assigned', 'Scheduled', 'Confirmed', 'Completed', 'Cancelled'];
const statusTone = (status) => ['Assigned', 'Scheduled', 'Confirmed', 'Completed'].includes(status)
  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
  : status === 'Cancelled' ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
    : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300';
const movementTone = (movement) => /pickup/i.test(movement)
  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
  : /drop/i.test(movement) ? 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
const scheduleLabel = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return { date: '-', time: '' };
  return {
    date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date),
    time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(date),
  };
};

export default function EventTransportPanel({ assignments, guests, vehicles, onGuestTab, onAddTransport, onEditTransport, onAddVehicle, onDeleteTransport }) {
  const [search, setSearch] = useState('');
  const [routeFilter, setRouteFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const guestMap = useMemo(() => new Map(guests.map((item) => [idOf(item), item])), [guests]);
  const vehicleMap = useMemo(() => new Map(vehicles.map((item) => [idOf(item), item])), [vehicles]);
  const routes = useMemo(() => Array.from(new Map(assignments.filter((item) => item.origin || item.destination).map((item) => [routeKey(item), { key: routeKey(item), label: [item.origin, item.destination].filter(Boolean).join(' -> ') }])).values()), [assignments]);
  const filtered = useMemo(() => assignments.filter((item) => {
    const guest = guestMap.get(idOf(item.guest));
    const vehicle = vehicleMap.get(idOf(item.vehicle));
    const term = search.trim().toLowerCase();
    const searchable = [guest?.name, item.origin, item.destination, vehicle?.vehicleName ?? vehicle?.name, vehicle?.registrationNo ?? vehicle?.registrationNumber, vehicle?.driverName, vehicle?.driverContactNo, vehicle?.driverAlternateContactNo].filter(Boolean).join(' ').toLowerCase();
    return (!term || searchable.includes(term)) && (routeFilter === 'all' || routeKey(item) === routeFilter) && (statusFilter === 'all' || statusOf(item) === statusFilter);
  }), [assignments, guestMap, vehicleMap, search, routeFilter, statusFilter]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [routeFilter, search, statusFilter]);
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);
  const required = guests.filter((item) => item.transportRequired || (item.hospitalityNeeds || []).some((need) => /pickup|drop|transport|transfer/i.test(need))).reduce((total, item) => total + Number(item.memberCount || 1), 0);
  const assigned = assignments.filter((item) => !['Pending Assignment', 'Cancelled'].includes(statusOf(item))).reduce((total, item) => total + Number(item.guestCount || 1), 0);
  const summaries = [
    { label: 'Transport Required', value: required, icon: CarFront, tone: 'blue' },
    { label: 'Assigned', value: assigned, icon: CheckCircle2, tone: 'emerald' },
    { label: 'Pending Assignment', value: Math.max(0, required - assigned), icon: Clock3, tone: 'amber' },
    { label: 'Vehicles', value: vehicles.length, icon: BusFront, tone: 'blue' },
    { label: 'Routes', value: routes.length, icon: MapPinned, tone: 'blue' },
  ];
  const download = () => {
    const rows = [['#', 'Guest / Family', 'Movement', 'Pickup Location', 'Drop Location', 'Vehicle', 'Registration No.', 'Driver', 'Driver Mobile', 'Alternate Mobile', 'Date', 'Time', 'Guests', 'Status'], ...filtered.map((item, index) => {
      const guest = guestMap.get(idOf(item.guest));
      const vehicle = vehicleMap.get(idOf(item.vehicle));
      const schedule = scheduleLabel(item.scheduledAt);
      return [index + 1, guest?.name, item.transferType, item.origin, item.destination, vehicle?.vehicleName ?? vehicle?.name, vehicle?.registrationNo ?? vehicle?.registrationNumber, vehicle?.driverName, vehicle?.driverContactNo ?? vehicle?.driverContact, vehicle?.driverAlternateContactNo, schedule.date, schedule.time, item.guestCount || guest?.memberCount || 1, statusOf(item)];
    })];
    const csv = rows.map((row) => row.map((value) => {
      const text = String(value ?? '');
      return '"' + (/^\s*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""') + '"';
    }).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = 'transport.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <Card id="transport-plan" className="crm-card min-w-0 overflow-hidden">
    <EventSummaryCards metricItems={summaries.map((item) => ({ ...item, value: item.value.toLocaleString('en-IN') }))} />
    <EventGuestsNav active="transport" onSelect={onGuestTab} />
    <CardContent className="space-y-4 p-4">
      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Transport filters and actions">
        <div className="relative min-w-56 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input aria-label="Search guest, family, route or driver" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search guest / family, route or driver..." className="h-9 pl-9 text-xs" /></div>
        <Select value={routeFilter} onValueChange={setRouteFilter}><SelectTrigger aria-label="Filter by route" className="h-9 w-40 shrink-0 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Routes</SelectItem>{routes.map((route) => <SelectItem key={route.key} value={route.key}>{route.label}</SelectItem>)}</SelectContent></Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger aria-label="Filter by status" className="h-9 w-40 shrink-0 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{[...new Set([...statuses, ...assignments.map(statusOf)])].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={download} disabled={!filtered.length}><Download />Download</Button>
        <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={onAddVehicle}><CarFront />Manage Vehicle</Button>
        <Button variant="custom" size="sm" className="h-9 shrink-0" onClick={onAddTransport}><Plus />Add Transport</Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border"><Table className="min-w-[1150px] text-xs"><TableHeader><TableRow>{['#', 'Guest / Family', 'Movement', 'Route', 'Vehicle & Driver', 'Schedule', 'Guests', 'Status', 'Action'].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>
        {pageRows.length ? pageRows.map((item, index) => {
          const guest = guestMap.get(idOf(item.guest));
          const vehicle = vehicleMap.get(idOf(item.vehicle));
          const schedule = scheduleLabel(item.scheduledAt);
          return <TableRow key={item._id || `pending-${idOf(item.guest)}`}>
            <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
            <TableCell className="font-semibold">{guest?.name || 'Guest record'}</TableCell>
            <TableCell>{item.transferType ? <Badge variant="secondary" className={`whitespace-nowrap rounded px-2 py-1 text-[11px] ${movementTone(item.transferType)}`}>{item.transferType}</Badge> : '-'}</TableCell>
            <TableCell className="min-w-44 max-w-60">{item.origin || item.destination ? <div className="space-y-1"><p className="flex items-start gap-1.5"><MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" /><span><span className="sr-only">Pickup: </span>{item.origin || '-'}</span></p><p className="flex items-start gap-1.5"><MapPinCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" /><span><span className="sr-only">Drop: </span>{item.destination || '-'}</span></p></div> : <span className="text-muted-foreground">Route pending</span>}</TableCell>
            <TableCell className="min-w-56">{vehicle ? <><p className="font-medium">{vehicle.vehicleName ?? vehicle.name} &middot; {vehicle.registrationNo ?? vehicle.registrationNumber ?? '-'}</p><p className="mt-0.5 text-muted-foreground">{vehicle.driverName || 'No driver assigned'}{(vehicle.driverContactNo || vehicle.driverContact) && ` \u00B7 ${vehicle.driverContactNo || vehicle.driverContact}`}</p></> : <span className="font-semibold text-destructive">Not Assigned</span>}</TableCell>
            <TableCell className="whitespace-nowrap font-medium"><p>{schedule.date}</p><p className="mt-0.5 text-[10px] font-normal text-muted-foreground">{schedule.time}</p></TableCell>
            <TableCell className="font-semibold">{item.guestCount || guest?.memberCount || 1}</TableCell>
            <TableCell><Badge variant="outline" className={`gap-1.5 whitespace-nowrap rounded px-2 py-1 text-[10px] ${statusTone(statusOf(item))}`}><span className="h-2 w-2 rounded-full bg-current" />{statusOf(item)}</Badge></TableCell>
            <TableCell><div className="flex items-center gap-1"><Button variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-primary" onClick={() => onEditTransport(item)}><Eye className="h-4 w-4" />View</Button><EventDeleteMenu label="transport assignment" onDelete={item._id && onDeleteTransport ? () => onDeleteTransport(item) : undefined} /></div></TableCell>
          </TableRow>;
        }) : <TableRow><TableCell colSpan={9} className="h-36 text-center"><BusFront className="mx-auto mb-2 h-8 w-8 text-muted-foreground" /><p className="font-semibold">No transport records found</p><p className="mt-1 text-[11px] text-muted-foreground">Add an assignment or adjust your filters.</p></TableCell></TableRow>}
      </TableBody></Table>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs"><span className="text-muted-foreground">Showing {filtered.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} transport records</span><div className="flex items-center gap-2"><Button variant="outline" size="icon" className="h-8 w-8" aria-label="Previous page" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft /></Button><span className="grid h-8 min-w-8 place-items-center rounded-md bg-primary/10 px-2 font-semibold text-primary">{page}</span><Button variant="outline" size="icon" className="h-8 w-8" aria-label="Next page" disabled={page === pages} onClick={() => setPage((value) => value + 1)}><ChevronRight /></Button></div></div></div>
    </CardContent>
  </Card>;
}
