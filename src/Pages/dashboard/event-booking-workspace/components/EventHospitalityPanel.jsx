/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import {
  BedDouble,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ConciergeBell,
  Crown,
  Eye,
  Filter,
  Plane,
  Plus,
  Search,
  UsersRound,
} from 'lucide-react';

import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { Input } from '@components/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './EventTable';
import EventGuestsNav from './EventGuestsNav';
import { normalizeEventHospitalityRequirement } from '../eventRecordAdapters';

const PAGE_SIZE = 10;
const statuses = ['Pending', 'In Planning', 'Finalised', 'Completed', 'Cancelled'];
const requirementIcons = [ConciergeBell, Crown, UsersRound, BedDouble, Plane];
const requirementTones = [
  'bg-cyan-50 text-cyan-600',
  'bg-violet-50 text-violet-600',
  'bg-blue-50 text-blue-600',
  'bg-rose-50 text-rose-600',
  'bg-amber-50 text-amber-600',
];

const idOf = (value) => String(value?._id || value || '');

const statusTone = (status) => {
  if (['Finalised', 'Completed'].includes(status)) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'In Planning') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'Cancelled') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-rose-200 bg-rose-50 text-rose-700';
};

const serviceDateLabel = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const coverageLabel = (item, functionMap) => {
  const names = (item.appliesToFunctions || [])
    .map((functionId) => functionMap.get(idOf(functionId))?.name)
    .filter(Boolean);
  return names.length ? names.join(', ') : item.appliesToLabel || 'All Functions';
};

const ownerInitials = (name) => String(name || 'TA')
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase();

export default function EventHospitalityPanel({
  requirements: sourceRequirements,
  functions,
  onGuestTab,
  onAdd,
  onEdit,
}) {
  const requirements = useMemo(
    () => sourceRequirements.map(normalizeEventHospitalityRequirement),
    [sourceRequirements],
  );
  const [search, setSearch] = useState('');
  const [functionFilter, setFunctionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pendingOnly, setPendingOnly] = useState(false);
  const [page, setPage] = useState(1);

  const functionMap = useMemo(
    () => new Map(functions.map((item) => [idOf(item), item])),
    [functions],
  );

  const filtered = useMemo(() => requirements.filter((item) => {
    const term = search.trim().toLowerCase();
    const ownerName = item.owner?.name || '';
    const coverage = coverageLabel(item, functionMap);
    const searchable = `${item.requirement || ''} ${item.details || ''} ${item.guestSegment || ''} ${ownerName} ${coverage}`.toLowerCase();
    const functionIds = (item.appliesToFunctions || []).map(idOf);

    if (term && !searchable.includes(term)) return false;
    if (functionFilter !== 'all' && functionIds.length && !functionIds.includes(functionFilter)) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (pendingOnly && !['Pending', 'In Planning'].includes(item.status)) return false;
    return true;
  }), [functionFilter, functionMap, pendingOnly, requirements, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [functionFilter, pendingOnly, search, statusFilter]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const filterActions = (
    <div className="flex max-w-full shrink-0 flex-nowrap gap-2 overflow-x-auto pb-0.5">
      <div className="relative w-44 shrink-0">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search requirement"
          className="h-9 pl-9 text-xs"
        />
      </div>
      <Select value={functionFilter} onValueChange={setFunctionFilter}>
        <SelectTrigger className="h-9 w-32 shrink-0 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Functions</SelectItem>
          {functions.map((item) => <SelectItem key={idOf(item)} value={idOf(item)}>{item.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="h-9 w-32 shrink-0 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Status</SelectItem>
          {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant={pendingOnly ? 'default' : 'outline'}
        size="sm"
        className="h-9 shrink-0 gap-2"
        onClick={() => setPendingOnly((current) => !current)}
      >
        <Filter className="h-4 w-4" />
        More Filters
      </Button>
    </div>
  );

  return (
    <Card id="hospitality-plan" className="crm-card overflow-hidden">
      <EventGuestsNav active="hospitality" onSelect={onGuestTab} actions={filterActions} />
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-bold text-foreground">Hospitality Plan</h2>
          <Button type="button" size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Add Requirement
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[1050px] text-xs">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="pl-6">Requirement</TableHead>
                <TableHead>Applies To</TableHead>
                <TableHead>Guest Segment</TableHead>
                <TableHead>Service Window</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length ? pageRows.map((item, index) => {
                const Icon = requirementIcons[index % requirementIcons.length];
                const serviceDate = serviceDateLabel(item.serviceStartAt);
                const ownerName = item.owner?.name || 'Team Assigned';
                return (
                  <TableRow key={idOf(item)}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${requirementTones[index % requirementTones.length]}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{item.requirement}</p>
                          {item.details ? <p className="mt-0.5 max-w-56 truncate text-[10px] text-muted-foreground">{item.details}</p> : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-48 font-medium text-blue-700">{coverageLabel(item, functionMap)}</TableCell>
                    <TableCell>{item.guestSegment || item.appliesToLabel || 'All Guests'}</TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{serviceDate || item.serviceWindow || 'As per function hours'}</p>
                          {serviceDate && item.serviceWindow ? <p className="mt-0.5 text-[10px] text-muted-foreground">{item.serviceWindow}</p> : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-violet-50 text-[10px] font-bold text-violet-700">{ownerInitials(ownerName)}</span>
                        <span className="font-medium text-foreground">{ownerName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`rounded px-2 py-0.5 text-[9px] ${statusTone(item.status)}`}>
                        {item.status || 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-blue-700" onClick={() => onEdit(item)}>
                        <Eye className="h-4 w-4" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <ConciergeBell className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="font-semibold text-foreground">No hospitality requirements found</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Add a requirement or adjust the current filters.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center gap-2 border-t border-blue-100 bg-blue-50/50 px-4 py-3 text-xs text-blue-700">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white">i</span>
          Hospitality requirements are planned here. Staff allocation and execution tasks are managed in Operations.
        </div>
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground">
            Showing {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} hospitality requirements
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="grid h-8 min-w-8 place-items-center rounded-md bg-emerald-50 px-2 font-semibold text-emerald-700">{page}</span>
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
