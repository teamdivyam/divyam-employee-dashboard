/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import {
  BedDouble,
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Plus,
  Search,
} from 'lucide-react';

import { initials } from '../eventBookingDashboard.utils';
import { Avatar, AvatarFallback } from '@components/components/ui/avatar';
import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { Input } from '@components/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './EventTable';
import EventGuestsNav from './EventGuestsNav';

const idOf = (value) => String(value?._id || value || '');

const statusOptions = [
  'Pending Allocation',
  'Allocated',
  'Confirmed',
  'Checked In',
  'Checked Out',
  'Cancelled',
];

const statusTone = (status) => {
  if (['Allocated', 'Confirmed'].includes(status)) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300';
  }
  if (status === 'Checked In') return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300';
  if (status === 'Checked Out') return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-300';
  if (status === 'Cancelled') return 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300';

  return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300';
};

const formatDate = (value) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const stayDateTime = (date, time) => {
  const label = formatDate(date);
  if (label === '-' || !time) return label;
  const match = String(time).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return label;
  const hour = Number(match[1]);
  return label + ', ' + String(hour % 12 || 12).padStart(2, '0') + ':' + match[2] + (hour >= 12 ? ' PM' : ' AM');
};

const avatarTones = [
  'bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-300',
  'bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300',
];

export default function EventAccommodationPanel({
  allocations,
  guests,
  properties,
  onGuestTab,
  onAllocate,
  onEditAllocation,
  onAddProperty,
}) {
  const [search, setSearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const guestMap = useMemo(
    () => new Map(guests.map((item) => [idOf(item), item])),
    [guests],
  );
  const propertyMap = useMemo(
    () => new Map(properties.map((item) => [idOf(item), item])),
    [properties],
  );

  const filtered = useMemo(
    () =>
      allocations.filter((item) => {
        const guest = guestMap.get(idOf(item.guest));
        const property = propertyMap.get(idOf(item.property));
        const term = search.trim().toLowerCase();
        const searchableContent = `${guest?.name || ''} ${property?.name || ''} ${(
          item.roomNumbers || []
        ).join(' ')}`.toLowerCase();

        if (term && !searchableContent.includes(term)) return false;
        if (propertyFilter !== 'all' && idOf(item.property) !== propertyFilter) return false;
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;
        return true;
      }),
    [allocations, guestMap, propertyFilter, propertyMap, search, statusFilter],
  );

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [propertyFilter, search, statusFilter]);
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const download = () => {
    const rows = [['Guest / Family', 'Total Members', 'Property / Hotel', 'Location', 'Room Numbers', 'Room Type', 'No. of Rooms', 'Check-in', 'Check-out', 'Guests Staying', 'Status'], ...filtered.map((item) => {
      const guest = guestMap.get(idOf(item.guest)); const property = propertyMap.get(idOf(item.property));
      return [guest?.name || '', guest?.memberCount || 1, property?.name || '', property?.city || property?.address || '', (item.roomNumbers || []).join(', '), item.roomType || '', item.numberOfRooms || item.roomNumbers?.length || '', stayDateTime(item.checkInDate, item.checkInTime), stayDateTime(item.checkOutDate, item.checkOutTime), item.guestCount || 1, item.status || 'Pending Allocation'];
    })];
    const csv = rows.map((row) => row.map((value) => { const text = String(value); return '"' + (/^[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""') + '"'; }).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = 'accommodation.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const filters = (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <div className="relative min-w-44 flex-1 basis-44">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search guest / family"
          className="h-9 pl-9 text-xs"
        />
      </div>

      <Select value={propertyFilter} onValueChange={setPropertyFilter}>
        <SelectTrigger className="h-9 w-32 shrink-0 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Properties</SelectItem>
          {properties.map((property) => (
            <SelectItem key={idOf(property)} value={idOf(property)}>
              {property.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="h-9 w-36 shrink-0 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Stay Status</SelectItem>
          {statusOptions.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

    </div>
  );

  return (
    <Card id="accommodation-plan" className="crm-card overflow-hidden">
      <EventGuestsNav active="accommodation" onSelect={onGuestTab} />

      <CardContent className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">{filters}<div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={onAddProperty}><Building2 className="h-4 w-4" />Manage Properties</Button><Button variant="outline" size="sm" onClick={download} disabled={!filtered.length}><Download className="h-4 w-4" />Download</Button><Button size="sm" onClick={onAllocate}><Plus className="h-4 w-4" />Allocate Stay</Button></div></div>
        <div className="overflow-hidden rounded-md border border-border">
          <div className="overflow-x-auto">
            <Table headerVariant="section" className="min-w-[1050px] table-fixed text-xs">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
                <col className="w-[20%]" />
                <col className="w-[10%]" />
                <col className="w-[13%]" />
                <col className="w-[10%]" />
              </colgroup>

              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="pl-6">Guest / Family</TableHead>
                  <TableHead>Property / Hotel</TableHead>
                  <TableHead>Rooms</TableHead>
                  <TableHead>Stay Window</TableHead>
                  <TableHead className="text-center">Guests Staying</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pageRows.length ? (
                  pageRows.map((item, index) => {
                    const guest = guestMap.get(idOf(item.guest));
                    const property = propertyMap.get(idOf(item.property));

                    return (
                      <TableRow key={item._id || `pending-${idOf(item.guest)}`}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarFallback className={'text-xs font-semibold ' + avatarTones[index % avatarTones.length]}>
                                {initials(guest?.name || 'Guest')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-foreground">{guest?.name || 'Guest record'}</p>
                              <p className="mt-0.5 text-[10px] text-muted-foreground">{guest?.memberCount || 1} Members</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {property ? (
                            <div>
                              <p className="font-semibold text-foreground">{property.name}</p>
                              <p className="mt-0.5 max-w-44 truncate text-[10px] text-muted-foreground">
                                {property.city || property.address || '-'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not allocated</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(item.roomNumbers || []).length
                              ? item.roomNumbers.map((number) => <Badge key={number} variant="secondary" className="rounded border-0 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{number}</Badge>)
                              : <span className="text-[10px] text-muted-foreground">Not assigned</span>}
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground">{item.roomType ? (item.numberOfRooms || item.roomNumbers?.length || 1) + ' ' + item.roomType : ''}</p>
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-[10px] text-muted-foreground">
                          <p>{stayDateTime(item.checkInDate, item.checkInTime)}</p>
                          <p className="mt-0.5">{stayDateTime(item.checkOutDate, item.checkOutTime)}</p>
                        </TableCell>

                        <TableCell className="text-center font-semibold">
                          {item.guestCount || guest?.memberCount || 1}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`gap-1.5 rounded border-0 px-2 py-1 text-[10px] ${statusTone(item.status)}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {!item.status || item.status === 'Pending Allocation' ? 'Pending' : item.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="pr-6 text-right">
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 px-3 text-blue-700"
                              onClick={() => onEditAllocation(item)}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>

                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <BedDouble className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="font-semibold text-foreground">No stay records found</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Mark guests as Stay Required or allocate their rooms.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">
              Showing {filtered.length ? (page - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(page * pageSize, filtered.length)} of {filtered.length} stay records
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === 1}
                onClick={() => setPage((value) => value - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="grid h-8 min-w-8 place-items-center rounded-md bg-emerald-50 px-2 font-semibold text-emerald-700">
                {page}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === pages}
                onClick={() => setPage((value) => value + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
