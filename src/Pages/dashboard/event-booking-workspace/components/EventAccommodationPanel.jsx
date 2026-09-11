/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import {
  BedDouble,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreVertical,
  Plus,
  Search,
  UsersRound,
} from 'lucide-react';

import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/components/ui/dropdown-menu';
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
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (status === 'Checked In') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === 'Checked Out') return 'border-violet-200 bg-violet-50 text-violet-700';
  if (status === 'Cancelled') return 'border-red-200 bg-red-50 text-red-700';

  return 'border-amber-200 bg-amber-50 text-amber-700';
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

const nights = (start, end) => {
  const from = new Date(start);
  const to = new Date(end);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;

  return Math.max(0, Math.ceil((to - from) / 86400000));
};

export default function EventAccommodationPanel({
  allocations,
  guests,
  properties,
  onGuestTab,
  onAllocate,
  onEditAllocation,
  onAddProperty,
  onEditProperty,
}) {
  const [search, setSearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pendingOnly, setPendingOnly] = useState(false);
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
        if (pendingOnly && item.status !== 'Pending Allocation') return false;

        return true;
      }),
    [allocations, guestMap, pendingOnly, propertyFilter, propertyMap, search, statusFilter],
  );

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [pendingOnly, propertyFilter, search, statusFilter]);
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const stayRequired = guests
    .filter(
      (item) => item.stayRequired || (item.hospitalityNeeds || []).includes('Stay'),
    )
    .reduce((total, item) => total + Number(item.memberCount || 1), 0);
  const allocated = allocations
    .filter((item) => !['Pending Allocation', 'Cancelled'].includes(item.status))
    .reduce((total, item) => total + Number(item.guestCount || 1), 0);
  const roomsReserved = new Set(
    allocations.flatMap((item) => item.roomNumbers || []).filter(Boolean),
  ).size;

  const summaries = [
    {
      label: 'Stay Required',
      value: stayRequired,
      icon: BedDouble,
      tone: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Allocated',
      value: allocated,
      icon: Building2,
      tone: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Pending',
      value: Math.max(0, stayRequired - allocated),
      icon: CalendarDays,
      tone: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Rooms Reserved',
      value: roomsReserved,
      icon: BedDouble,
      tone: 'text-violet-600 bg-violet-50',
    },
    {
      label: 'Properties',
      value: properties.length,
      icon: Building2,
      tone: 'text-cyan-600 bg-cyan-50',
    },
  ];

  const actions = (
    <div className="flex max-w-full shrink-0 flex-nowrap gap-2 overflow-x-auto pb-0.5">
      <div className="relative w-44 shrink-0">
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

      <Button
        variant={pendingOnly ? 'default' : 'outline'}
        size="sm"
        className="h-9 shrink-0 gap-2"
        onClick={() => setPendingOnly((value) => !value)}
      >
        <Filter className="h-4 w-4" />
        More Filters
      </Button>
    </div>
  );

  return (
    <Card id="accommodation-plan" className="crm-card overflow-hidden">
      <EventGuestsNav active="accommodation" onSelect={onGuestTab} actions={actions} />

      <CardContent className="p-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 grid-cols-2 gap-2 rounded-lg border border-border p-3 sm:grid-cols-5">
            {summaries.map(({ label, value, icon: Icon, tone }, index) => (
              <div
                key={label}
                className={`flex items-center gap-2 px-2 ${
                  index ? 'sm:border-l sm:border-border' : ''
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${tone}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold text-foreground">
                    {value.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex shrink-0 gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Manage Properties
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Event Properties</DropdownMenuLabel>
                <DropdownMenuItem onSelect={onAddProperty}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add property
                </DropdownMenuItem>
                {properties.length ? <DropdownMenuSeparator /> : null}
                {properties.map((property) => (
                  <DropdownMenuItem
                    key={idOf(property)}
                    onSelect={() => onEditProperty(property)}
                  >
                    Edit {property.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={onAllocate}>
              <Plus className="h-4 w-4" />
              Allocate Stay
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-bold text-foreground">Accommodation Plan</h2>
          </div>

          <div className="overflow-x-auto">
            <Table className="min-w-[1050px] table-fixed text-xs">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[15%]" />
                <col className="w-[10%]" />
                <col className="w-[20%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[10%]" />
              </colgroup>

              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="pl-6">Guest / Family</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Room(s)</TableHead>
                  <TableHead>Stay Dates</TableHead>
                  <TableHead className="text-center">Guests</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pageRows.length ? (
                  pageRows.map((item, index) => {
                    const guest = guestMap.get(idOf(item.guest));
                    const property = propertyMap.get(idOf(item.property));
                    const nightCount = nights(item.checkInDate, item.checkOutDate);

                    return (
                      <TableRow key={item._id || `pending-${idOf(item.guest)}`}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-2">
                            <span
                              className={`grid h-8 w-8 place-items-center rounded-full ${
                                index % 2
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-emerald-50 text-emerald-600'
                              }`}
                            >
                              <UsersRound className="h-4 w-4" />
                            </span>
                            <span className="font-semibold text-foreground">
                              {guest?.name || 'Guest record'}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          {property ? (
                            <div>
                              <p className="font-semibold text-foreground">{property.name}</p>
                              <p className="mt-0.5 max-w-44 truncate text-[10px] text-muted-foreground">
                                {property.address || '-'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not allocated</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <p className="font-medium text-foreground">
                            {(item.roomNumbers || []).join(', ') || 'Not Allocated'}
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {item.roomType || ''}
                          </p>
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          <p className="flex items-center gap-2 font-medium">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(item.checkInDate)}
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(item.checkOutDate)}
                          </p>
                          {nightCount ? (
                            <p className="mt-0.5 pl-5 text-[10px] text-muted-foreground">
                              {nightCount} Night{nightCount === 1 ? '' : 's'}
                            </p>
                          ) : null}
                        </TableCell>

                        <TableCell className="text-center font-semibold">
                          {item.guestCount || guest?.memberCount || 1}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`rounded px-2 py-0.5 text-[9px] ${statusTone(item.status)}`}
                          >
                            {item.status || 'Pending Allocation'}
                          </Badge>
                        </TableCell>

                        <TableCell className="pr-6 text-right">
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 px-2 text-blue-600"
                              onClick={() => onEditAllocation(item)}
                            >
                              View
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>

                            {item._id ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onSelect={() => onEditAllocation(item)}
                                  >
                                    Edit allocation
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : null}
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

        <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3 text-xs text-blue-700">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
            i
          </span>
          Guests marked Stay Required in the Guest List are managed here for room allocation
          and check-in coordination.
        </div>
      </CardContent>
    </Card>
  );
}
