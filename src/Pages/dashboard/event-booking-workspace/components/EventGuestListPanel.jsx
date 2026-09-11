/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Filter, Plus, Search, UserRound, UsersRound } from 'lucide-react';

import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { Input } from '@components/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './EventTable';
import EventGuestsNav from './EventGuestsNav';

const idOf = (value) => String(value?._id || value || '');
const functionTones = ['border-rose-200 bg-rose-50 text-rose-700', 'border-violet-200 bg-violet-50 text-violet-700', 'border-emerald-200 bg-emerald-50 text-emerald-700'];
const needTones = ['border-amber-200 bg-amber-50 text-amber-700', 'border-blue-200 bg-blue-50 text-blue-700', 'border-cyan-200 bg-cyan-50 text-cyan-700'];
const rsvpTone = (status) => status === 'Confirmed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : status === 'Declined' ? 'border-red-200 bg-red-50 text-red-700' : status === 'Maybe' ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-amber-200 bg-amber-50 text-amber-700';

export default function EventGuestListPanel({ guests, functions, onGuestTab, onAdd, onEdit, onImport }) {
  const [search, setSearch] = useState('');
  const [functionFilter, setFunctionFilter] = useState('all');
  const [rsvpFilter, setRsvpFilter] = useState('all');
  const [needsOnly, setNeedsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const functionMap = useMemo(() => new Map(functions.map((item) => [idOf(item), item])), [functions]);
  const filtered = useMemo(() => guests.filter((item) => {
    const term = search.trim().toLowerCase();
    if (term && !`${item.name || ''} ${item.contact || ''} ${item.email || ''}`.toLowerCase().includes(term)) return false;
    if (functionFilter !== 'all' && !(item.functions || []).map(idOf).includes(functionFilter)) return false;
    if (rsvpFilter !== 'all' && item.rsvpStatus !== rsvpFilter) return false;
    if (needsOnly && !(item.hospitalityNeeds || []).length) return false;
    return true;
  }), [functionFilter, guests, needsOnly, rsvpFilter, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [functionFilter, needsOnly, rsvpFilter, search]);
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);
  const totals = useMemo(() => guests.reduce((summary, item) => {
    const members = Number(item.memberCount || 1);
    summary.total += members;
    if (item.rsvpStatus === 'Confirmed') summary.confirmed += members;
    if (item.rsvpStatus === 'Pending') summary.pending += members;
    if (item.isVip || (item.hospitalityNeeds || []).includes('VIP')) summary.vip += members;
    if (item.stayRequired || (item.hospitalityNeeds || []).includes('Stay')) summary.stay += members;
    return summary;
  }, { total: 0, confirmed: 0, pending: 0, vip: 0, stay: 0 }), [guests]);
  const summaryItems = [{ label: 'Total Guests', value: totals.total, tone: 'text-foreground' }, { label: 'Confirmed', value: totals.confirmed, tone: 'text-emerald-600' }, { label: 'Pending RSVP', value: totals.pending, tone: 'text-amber-600' }, { label: 'VIP Guests', value: totals.vip, tone: 'text-violet-600' }, { label: 'Stay Required', value: totals.stay, tone: 'text-blue-600' }];

  return (
    <Card id="guest-list" className="crm-card overflow-hidden">
      <EventGuestsNav active="list" onSelect={onGuestTab} actions={<div className="flex max-w-full shrink-0 flex-nowrap gap-2 overflow-x-auto pb-0.5"><div className="relative w-44 shrink-0"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search guest / family" className="h-9 pl-9 text-xs" /></div><Select value={functionFilter} onValueChange={setFunctionFilter}><SelectTrigger className="h-9 w-32 shrink-0 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Functions</SelectItem>{functions.map((item) => <SelectItem key={idOf(item)} value={idOf(item)}>{item.name}</SelectItem>)}</SelectContent></Select><Select value={rsvpFilter} onValueChange={setRsvpFilter}><SelectTrigger className="h-9 w-36 shrink-0 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All RSVP Status</SelectItem>{['Pending', 'Confirmed', 'Declined', 'Maybe'].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select><Button variant={needsOnly ? 'default' : 'outline'} size="sm" className="h-9 shrink-0 gap-2" onClick={() => setNeedsOnly((value) => !value)}><Filter className="h-4 w-4" />More Filters</Button></div>} />

      <CardContent className="p-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="grid flex-1 grid-cols-2 gap-2 rounded-lg border border-border p-3 sm:grid-cols-5">{summaryItems.map((item, index) => <div key={item.label} className={`px-2 ${index ? 'sm:border-l sm:border-border' : ''}`}><p className="text-[10px] font-semibold text-muted-foreground">{item.label}</p><p className={`mt-1 text-xl font-bold ${item.tone}`}>{item.value.toLocaleString('en-IN')}</p></div>)}</div><div className="flex shrink-0 gap-2"><Button variant="outline" className="gap-2" onClick={onImport}><Download className="h-4 w-4" />Import Guest List</Button><Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={onAdd}><Plus className="h-4 w-4" />Add Guest</Button></div></div>
        <div className="overflow-hidden rounded-lg border border-border"><div className="overflow-x-auto"><Table className="min-w-[950px] table-fixed text-xs"><TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30"><TableHead className="w-[20%] pl-6">Guest / Family</TableHead><TableHead className="w-[13%]">Contact</TableHead><TableHead className="w-[17%] text-center">Members</TableHead><TableHead className="w-[17%]">Functions</TableHead><TableHead className="w-[12%]">RSVP Status</TableHead><TableHead className="w-[20%]">Hospitality Needs</TableHead><TableHead className="w-[8%] pr-6 text-right">Action</TableHead></TableRow></TableHeader><TableBody>{pageRows.length ? pageRows.map((item, index) => <TableRow key={idOf(item)}><TableCell className="pl-6"><div className="flex items-center gap-2"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${functionTones[index % functionTones.length]}`}><UsersRound className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate font-semibold text-foreground">{item.name}</p>{item.email ? <p className="truncate text-[10px] text-muted-foreground">{item.email}</p> : null}</div></div></TableCell><TableCell>{item.contact || '-'}</TableCell><TableCell className="text-center font-semibold">{item.memberCount || 1}</TableCell><TableCell><div className="flex flex-wrap gap-1">{(item.functions || []).length ? item.functions.map(idOf).map((id) => functionMap.get(id)).filter(Boolean).map((fn, badgeIndex) => <Badge key={idOf(fn)} variant="outline" className={`rounded px-2 py-0.5 text-[9px] ${functionTones[badgeIndex % functionTones.length]}`}>{fn.name}</Badge>) : <span className="text-muted-foreground">All functions</span>}</div></TableCell><TableCell><Badge variant="outline" className={`whitespace-nowrap rounded px-2 py-0.5 text-[9px] ${rsvpTone(item.rsvpStatus)}`}>{item.rsvpStatus || 'Pending'}</Badge></TableCell><TableCell><div className="flex flex-wrap gap-1">{(item.hospitalityNeeds || []).length ? item.hospitalityNeeds.map((need, needIndex) => <Badge key={need} variant="outline" className={`rounded px-2 py-0.5 text-[9px] ${needTones[needIndex % needTones.length]}`}>{need}</Badge>) : <span className="text-muted-foreground">-</span>}</div></TableCell><TableCell className="pr-6 text-right"><Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-blue-600" onClick={() => onEdit(item)}>View<ChevronRight className="h-3.5 w-3.5" /></Button></TableCell></TableRow>) : <TableRow><TableCell colSpan={7} className="h-40 text-center"><UserRound className="mx-auto mb-2 h-8 w-8 text-muted-foreground" /><p className="font-semibold text-foreground">No guest records found</p><p className="mt-1 text-[11px] text-muted-foreground">Add guests or adjust the current filters.</p></TableCell></TableRow>}</TableBody></Table></div><div className="flex flex-col gap-3 border-t border-border px-6 py-3 text-xs sm:flex-row sm:items-center sm:justify-between"><span className="text-muted-foreground">Showing {filtered.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} guest records</span><div className="flex items-center gap-2"><Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="h-4 w-4" /></Button><span className="grid h-8 min-w-8 place-items-center rounded-md bg-emerald-50 px-2 font-semibold text-emerald-700">{page}</span><Button variant="outline" size="icon" className="h-8 w-8" disabled={page === pages} onClick={() => setPage((value) => value + 1)}><ChevronRight className="h-4 w-4" /></Button></div></div></div>
      </CardContent>
    </Card>
  );
}
