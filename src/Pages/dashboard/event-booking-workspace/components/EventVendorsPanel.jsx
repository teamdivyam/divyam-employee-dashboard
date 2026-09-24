/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import {
  AudioWaveform,
  Building2,
  BusFront,
  CalendarDays,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  FileText,
  Flower2,
  Phone,
  Plus,
  Search,
  Store,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@components/components/ui/avatar';
import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@components/components/ui/dropdown-menu';
import { Input } from '@components/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './EventTable';
import { avatarUrl } from '../eventBookingDashboard.utils';
import EventOperationsNav from './EventOperationsNav';

const PAGE_SIZE = 10;
const idOf = (value) => String(value?._id || value || '');
const numberOf = (value) => Number(value?.$numberDecimal ?? value ?? 0) || 0;

const categoryMeta = (category = '') => {
  const value = category.toLowerCase();
  if (value.includes('cater')) return { icon: ChefHat, tone: 'bg-orange-50 text-orange-600' };
  if (value.includes('decor') || value.includes('floral')) return { icon: Flower2, tone: 'bg-pink-50 text-pink-600' };
  if (value.includes('transport') || value.includes('logistic')) return { icon: BusFront, tone: 'bg-blue-50 text-blue-600' };
  if (value.includes('sound') || value.includes('dj')) return { icon: AudioWaveform, tone: 'bg-violet-50 text-violet-600' };
  if (value.includes('hotel') || value.includes('accommodation')) return { icon: Building2, tone: 'bg-emerald-50 text-emerald-600' };
  return { icon: Store, tone: 'bg-cyan-50 text-cyan-600' };
};

const badgeTone = (status = '') => {
  if (['Confirmed', 'Completed'].includes(status)) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'Assigned' || status === 'In Progress') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === 'Cancelled') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-orange-200 bg-orange-50 text-orange-700';
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(date);
};

const money = (value) => `\u20B9${numberOf(value).toLocaleString('en-IN')}`;

export default function EventVendorsPanel({ booking, onAdd, onEdit }) {
  const assignments = useMemo(() => booking.vendorAssignments || [], [booking.vendorAssignments]);
  const functions = useMemo(() => booking.functions || [], [booking.functions]);
  const functionMap = useMemo(() => new Map(functions.map((item) => [idOf(item), item.name])), [functions]);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [functionFilter, setFunctionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const services = useMemo(() => Array.from(new Set(assignments.map((item) => item.service || item.category).filter(Boolean))), [assignments]);
  const statuses = useMemo(() => Array.from(new Set(assignments.map((item) => item.status).filter(Boolean))), [assignments]);
  const filtered = useMemo(() => assignments.filter((assignment) => {
    const vendor = assignment.vendor || {};
    const term = search.trim().toLowerCase();
    const searchable = [vendor.companyName, vendor.contactPerson, vendor.mobileNumber, assignment.service, assignment.scope].filter(Boolean).join(' ').toLowerCase();
    const assignedFunctionIds = (assignment.assignedFunctions || []).map(idOf);
    return (!term || searchable.includes(term))
      && (serviceFilter === 'all' || (assignment.service || assignment.category) === serviceFilter)
      && (functionFilter === 'all' || !assignedFunctionIds.length || assignedFunctionIds.includes(functionFilter))
      && (statusFilter === 'all' || assignment.status === statusFilter);
  }), [assignments, functionFilter, search, serviceFilter, statusFilter]);

  useEffect(() => setPage(1), [search, serviceFilter, functionFilter, statusFilter]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="flex w-full items-center justify-between gap-2 overflow-x-auto pb-0.5">
        <EventOperationsNav active="vendors" />
        <div className="flex shrink-0 items-center justify-end gap-1.5">
          <div className="relative w-32 shrink-0"><Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search vendor..." className="h-9 w-full pl-8 text-[11px]" /></div>
          <Select value={serviceFilter} onValueChange={setServiceFilter}><SelectTrigger className="h-9 w-20 shrink-0 px-2 text-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Services</SelectItem>{services.map((service) => <SelectItem key={service} value={service}>{service}</SelectItem>)}</SelectContent></Select>
          <Select value={functionFilter} onValueChange={setFunctionFilter}><SelectTrigger className="h-9 w-20 shrink-0 px-2 text-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Functions</SelectItem>{functions.map((item) => <SelectItem key={idOf(item)} value={idOf(item)}>{item.name}</SelectItem>)}</SelectContent></Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-9 w-24 shrink-0 px-2 text-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Status</SelectItem>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select>
          <Button variant="custom" size="sm" onClick={onAdd} className="h-9 shrink-0 gap-1 px-2.5 text-[10px]"><Plus className="h-3.5 w-3.5" />Assign Vendor</Button>
        </div>
      </div>

      <Card className="crm-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[1100px] table-fixed text-xs">
              <colgroup>
                <col className="w-[16%]" />
                <col className="w-[13%]" />
                <col className="w-[8%]" />
                <col className="w-[11%]" />
                <col className="w-[13%]" />
                <col className="w-[8%]" />
                <col className="w-[14%]" />
                <col className="w-[7%]" />
                <col className="w-[10%]" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="h-11 px-3">Vendor</TableHead>
                  <TableHead className="h-11 px-3">Service & Scope</TableHead>
                  <TableHead className="h-11 px-3">Applies To</TableHead>
                  <TableHead className="h-11 px-3">Vendor Contact</TableHead>
                  <TableHead className="h-11 px-3">Reporting Date & Time</TableHead>
                  <TableHead className="h-11 px-3">Work Status</TableHead>
                  <TableHead className="h-11 px-3">Payment Summary</TableHead>
                  <TableHead className="h-11 px-3">Documents</TableHead>
                  <TableHead className="h-11 px-3 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length ? pageRows.map((assignment) => {
                  const vendor = assignment.vendor || {};
                  const service = assignment.service || assignment.category || vendor.category || 'Other';
                  const { icon: VendorIcon, tone } = categoryMeta(service);
                  const assignedFunctions = (assignment.assignedFunctions || []).map((value) => functionMap.get(idOf(value))).filter(Boolean);
                  const agreed = numberOf(assignment.agreedAmount || assignment.quotationAmount);
                  const paid = Math.min(numberOf(assignment.paidAmount) || (assignment.paymentStatus === 'Paid' ? agreed : 0), agreed || Number.MAX_SAFE_INTEGER);
                  const percent = agreed ? Math.min(100, Math.round((paid / agreed) * 100)) : assignment.paymentStatus === 'Paid' ? 100 : 0;
                  const due = Math.max(0, agreed - paid);
                  const documents = vendor.documents || [];
                  const documentCount = documents.length || vendor.documentStatus?.total || 0;
                  return (
                    <TableRow key={assignment._id}>
                      <TableCell className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-9 w-9"><AvatarImage src={avatarUrl(vendor)} /><AvatarFallback className={tone}><VendorIcon className="h-4 w-4" /></AvatarFallback></Avatar>
                          <div className="min-w-0"><p className="max-w-48 truncate font-semibold text-foreground">{vendor.companyName || 'Vendor'}</p>{vendor.category ? <p className="mt-0.5 text-[10px] text-muted-foreground">{vendor.category}</p> : null}</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-3"><div className="flex items-start gap-2"><Badge variant="outline" className="shrink-0 border-violet-100 bg-violet-50 text-[9px] text-violet-700">{service}</Badge><p className="max-w-48 text-[10px] leading-4 text-muted-foreground">{assignment.scope || assignment.notes || 'Scope not added'}</p></div></TableCell>
                      <TableCell className="px-3 py-3"><p className="max-w-28 break-words leading-4 text-foreground">{assignedFunctions.length ? assignedFunctions.join(', ') : 'All Functions'}</p></TableCell>
                      <TableCell className="px-3 py-3"><p className="font-semibold text-foreground">{vendor.contactPerson || '-'}</p><p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><Phone className="h-3 w-3" />{vendor.mobileNumber || '-'}</p></TableCell>
                      <TableCell className="px-3 py-3"><p className="flex items-center gap-1.5 font-medium text-foreground"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />{formatDate(assignment.reportingTime)}</p>{formatTime(assignment.reportingTime) ? <p className="mt-1 pl-5 text-[10px] text-muted-foreground">{formatTime(assignment.reportingTime)}</p> : null}</TableCell>
                      <TableCell className="px-3 py-3"><Badge variant="outline" className={`rounded px-2 py-0.5 text-[9px] ${badgeTone(assignment.status)}`}>{assignment.status || 'Upcoming'}</Badge></TableCell>
                      <TableCell className="px-3 py-3">
                        <p className={`text-[10px] font-semibold ${percent === 100 ? 'text-emerald-700' : percent ? 'text-orange-600' : 'text-muted-foreground'}`}>{percent}% Paid</p>
                        <div className="my-1.5 h-1.5 w-32 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${percent === 100 ? 'bg-emerald-600' : 'bg-orange-500'}`} style={{ width: `${percent}%` }} /></div>
                        <p className="text-[10px] font-medium text-foreground">{money(paid)} Paid <span className="px-1 text-muted-foreground">•</span> {money(due)} Due</p>
                        {due > 0 && assignment.nextPaymentDueDate ? <p className="mt-1 text-[9px] text-muted-foreground">Next due: {formatDate(assignment.nextPaymentDueDate)}</p> : null}
                      </TableCell>
                      <TableCell className="px-3 py-3">
                        {documents.length ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><button type="button" className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-blue-600 hover:underline"><FileText className="h-3.5 w-3.5" />{documentCount} {documentCount === 1 ? 'Doc' : 'Docs'}</button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                              {documents.map((document) => (
                                <DropdownMenuItem key={document._id || `${document.documentType}-${document.fileUrl}`} asChild disabled={!document.fileUrl}>
                                  {document.fileUrl ? <a href={document.fileUrl} target="_blank" rel="noreferrer" className="flex cursor-pointer items-center justify-between gap-3"><span className="min-w-0"><span className="block truncate text-xs font-semibold">{document.documentType || 'Vendor document'}</span>{document.documentNumber ? <span className="block truncate text-[10px] text-muted-foreground">{document.documentNumber}</span> : null}</span><ExternalLink className="h-3.5 w-3.5 shrink-0 text-blue-600" /></a> : <span className="truncate text-xs">{document.documentType || 'Vendor document'}</span>}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted-foreground"><FileText className="h-3.5 w-3.5" />0 Docs</span>}
                      </TableCell>
                      <TableCell className="px-2 py-3 text-right"><div className="flex justify-end"><Button variant="outline" size="sm" className="h-8 gap-1 border-blue-300 bg-transparent px-2.5 text-blue-700 hover:bg-blue-50 hover:text-blue-800" onClick={() => onEdit(assignment)}><Eye className="h-4 w-4" />View</Button></div></TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow><TableCell colSpan={9} className="h-40 text-center"><Store className="mx-auto mb-2 h-8 w-8 text-muted-foreground" /><p className="font-semibold text-foreground">No vendors found</p><p className="mt-1 text-[11px] text-muted-foreground">Assign a vendor or adjust the current filters.</p></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">Showing {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} vendor{filtered.length === 1 ? '' : 's'}</span>
            <div className="flex items-center gap-2"><Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="h-4 w-4" /></Button><span className="grid h-8 min-w-8 place-items-center rounded-md bg-emerald-50 px-2 font-semibold text-emerald-700">{page}</span><Button variant="outline" size="icon" className="h-8 w-8" disabled={page === pages} onClick={() => setPage((value) => value + 1)}><ChevronRight className="h-4 w-4" /></Button></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
