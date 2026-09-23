/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import AdminService from '../../../../services/event-booking-workspace.service';
import useEventQuotations from '../useEventQuotations';
import QuotationDialog from './QuotationDialog';
import FinancePaginationFooter from './FinancePaginationFooter';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@components/components/ui/alert-dialog';
import { CalendarDays, Eye, FileText, MoreVertical, Plus, Search } from 'lucide-react';
import { differenceInCalendarDays, startOfDay, subDays } from 'date-fns';
import { Button } from '@components/components/ui/button';
import { Input } from '@components/components/ui/input';
import { Badge } from '@components/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@components/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './EventTable';
import { currency, shortDate } from '../eventFinance.utils';

const tones = {
  'Main Booking': 'bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
  'Revised Quotation': 'bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300',
  'Additional Service': 'bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
  Accepted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  Superseded: 'bg-muted text-muted-foreground',
  Generated: 'bg-muted text-foreground',
  Rejected: 'bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300',
};
const headers = [['quotationNo', 'Quotations / Title'], ['type', 'Type'], ['version', 'Version'], ['issuedOn', 'Issued On'], ['validUntil', 'Valid Until'], ['quotedValue', 'Quoted Value'], ['status', 'Status']];
const safeFileUrl = (value) => /^https?:\/\//i.test(value || '') ? value : undefined;

export default function EventQuotationsPanel({ tabs, readOnly = false }) {
  const { booking, canDeleteEventData } = useOutletContext();
  const eventId = booking?._id;
  const queryClient = useQueryClient();
  const query = useEventQuotations(eventId);
  const quotations = useMemo(() => (query.data || []).map((row) => ({ ...row, title: row.quotationTitle, type: row.quotationType, issuedOn: row.issueDate, quotedValue: row.priceSummary?.finalQuotationValue })), [query.data]);
  const [editing, setEditing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['event-quotations', eventId] });
  const saveMutation = useMutation({
    mutationFn: (payload) => selected ? AdminService.updateEventQuotation({ eventId, quotationId: selected._id, ...payload }) : AdminService.createEventQuotation({ eventId, ...payload }),
    onSuccess: async () => { toast.success(selected ? 'Quotation updated' : 'Quotation created'); await refresh(); },
  });
  const deleteMutation = useMutation({
    mutationFn: () => AdminService.deleteEventQuotation({ eventId, quotationId: deleting._id }),
    onSuccess: async () => { setDeleting(null); toast.success('Quotation deleted'); await refresh(); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to delete quotation'),
  });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sort, setSort] = useState({ key: 'issuedOn', direction: -1 });
  const [selected, setSelected] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const detailQuery = useQuery({ queryKey: ['event-quotation', eventId, selected?._id], enabled: Boolean(selected?._id), staleTime: 0, refetchOnWindowFocus: false, refetchOnReconnect: false,
    queryFn: async () => (await AdminService.getEventQuotation({ eventId, quotationId: selected._id })).data.quotation,
  });
  const rows = useMemo(() => {
    const today = startOfDay(new Date());
    return quotations.filter((row) => {
      if (!`${row.quotationNo || ''} ${row.title || ''}`.toLowerCase().includes(search.trim().toLowerCase())) return false;
      if (status !== 'all' && row.status !== status) return false;
      if (dateRange === 'all') return true;
      const issued = new Date(row.issuedOn);
      const from = dateRange === 'this-year' ? new Date(today.getFullYear(), 0, 1) : subDays(today, Number(dateRange));
      return issued >= from && issued <= new Date();
    }).sort((a, b) => {
      const left = a[sort.key] ?? '';
      const right = b[sort.key] ?? '';
      return (typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), undefined, { numeric: true })) * sort.direction;
    });
  }, [quotations, search, status, dateRange, sort]);
  const page = Math.min(pagination.page, Math.max(1, Math.ceil(rows.length / pagination.limit)));
  const visibleRows = rows.slice((page - 1) * pagination.limit, page * pagination.limit);
  return <>
    <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
      {tabs}
      <div className="relative min-w-44 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search quotations" placeholder="Search quotation number or title..." value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 pl-9 text-xs" /></div>
      <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Quotation Status" className="h-9 w-full text-xs sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Quotation Status</SelectItem>{Array.from(new Set(quotations.map((row) => row.status).filter(Boolean))).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
      <Select value={dateRange} onValueChange={setDateRange}><SelectTrigger aria-label="Quotation date range" className="h-9 w-full text-xs sm:w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Date Range</SelectItem><SelectItem value="30">Last 30 days</SelectItem><SelectItem value="90">Last 90 days</SelectItem><SelectItem value="this-year">This year</SelectItem></SelectContent></Select>
      {!readOnly && <Button variant="custom" className="h-9 gap-2 text-xs" onClick={() => { setSelected(null); setEditing(false); setCreateOpen(true); }}><Plus className="h-4 w-4" />Create Quotation</Button>}
    </div>
    {query.isError && <div role="alert" className="flex items-center gap-2 p-4 text-sm text-destructive">Unable to load quotations.<Button variant="outline" onClick={() => query.refetch()}>Retry</Button></div>}
    {query.isFetching && <p role="status" className="p-3 text-xs text-muted-foreground">Loading quotations...</p>}
    <div className="overflow-x-auto"><Table headerVariant="section" className="min-w-[1200px] table-fixed text-xs">
      <colgroup>{[20, 12, 6, 10, 10, 10, 10, 10, 12].map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup><TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30">{headers.map(([key, label]) => <TableHead key={key} aria-sort={sort.key === key ? sort.direction === 1 ? 'ascending' : 'descending' : 'none'}><button className={`flex items-center gap-1.5 text-left ${key === 'quotationNo' ? 'mx-auto' : ''}`} onClick={() => setSort({ key, direction: sort.key === key ? -sort.direction : 1 })}>{label}</button></TableHead>)}<TableHead>File</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
      <TableBody>{visibleRows.length ? visibleRows.map((row, index) => {
        const days = row.validUntil ? differenceInCalendarDays(new Date(row.validUntil), new Date()) : NaN;
        const file = row.file || {};
        const url = safeFileUrl(file.fileUrl || file.url);
        return <TableRow key={row._id || `${row.quotationNo}-${row.version}-${index}`}>
          <TableCell className="pl-6"><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300"><FileText className="h-4 w-4" aria-hidden="true" /></span><div className="min-w-0"><p className="font-semibold text-foreground">{row.quotationNo || '\u2014'}</p><p className="mt-1 break-words text-[11px] text-muted-foreground">{row.title}</p></div></div></TableCell>
          <TableCell><Badge variant="outline" className={`rounded px-2 py-0.5 text-[10px] ${tones[row.type] || tones.Generated}`}>{row.type || '—'}</Badge></TableCell>
          <TableCell>{row.version ? `v${String(row.version).replace(/^v/, '')}` : '—'}</TableCell>
          <TableCell><p className="flex items-center gap-2 font-medium"><CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />{shortDate(row.issuedOn)}</p></TableCell>
          <TableCell><p className="flex items-center gap-2 font-medium"><CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />{shortDate(row.validUntil)}</p>{Number.isFinite(days) && <p className={`mt-1 text-[10px] ${days < 0 ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-300'}`}>{days < 0 ? 'Expired' : days === 0 ? 'Expires today' : `${days} days left`}</p>}</TableCell>
          <TableCell className="font-semibold">{row.quotedValue == null ? '—' : currency(row.quotedValue)}</TableCell>
          <TableCell><Badge variant="outline" className={`gap-1 rounded px-2 py-0.5 text-[10px] ${tones[row.status] || tones.Generated}`}><FileText className="h-3 w-3" />{row.status || '\u2014'}</Badge><p className="mt-1 max-w-32 text-[10px] text-muted-foreground">{row.statusNote || (row.status === 'Generated' ? 'Not yet sent to client' : row.acceptedOn ? `Accepted on ${shortDate(row.acceptedOn)}` : '')}</p></TableCell>
          <TableCell><Button type="button" size="sm" variant="outline" className="h-8 gap-1.5 px-3 text-primary" aria-label={`View PDF for ${row.quotationNo}`} onClick={() => { setPreviewOpen(true); setEditing(false); setSelected(row); }}><Eye className="h-4 w-4" />View</Button></TableCell>
          <TableCell className="pr-6 text-right"><div className="flex items-center justify-end gap-1"><Button size="sm" variant="outline" className="h-8 gap-1.5 px-3 text-blue-700 dark:text-blue-300" onClick={() => { setPreviewOpen(false); setEditing(false); setSelected(row); }}><Eye className="h-4 w-4" />View</Button>{!readOnly && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${row.quotationNo}`}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => { setPreviewOpen(false); setEditing(false); setSelected(row); }}>View quotation</DropdownMenuItem><DropdownMenuItem onSelect={() => { setPreviewOpen(false); setEditing(true); setSelected(row); }}>Edit quotation</DropdownMenuItem>{canDeleteEventData && <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(row)}>Delete quotation</DropdownMenuItem>}{url && <DropdownMenuItem asChild><a href={url} target="_blank" rel="noreferrer">Open PDF</a></DropdownMenuItem>}</DropdownMenuContent></DropdownMenu>}</div></TableCell>
        </TableRow>;
      }) : <TableRow><TableCell colSpan={9} className="h-48 text-center text-muted-foreground"><FileText className="mx-auto mb-2 h-7 w-7" />{query.isPending ? 'Loading quotations...' : query.isError ? 'Quotations unavailable.' : quotations.length ? 'No quotations match the current filters.' : 'No quotations available.'}</TableCell></TableRow>}</TableBody>
    </Table></div>
    <FinancePaginationFooter totalKey="total" pagination={{ page, limit: pagination.limit, total: rows.length, totalPages: Math.ceil(rows.length / pagination.limit) }} onChange={(values) => setPagination((current) => ({ ...current, ...values }))} />
    {createOpen && <QuotationDialog booking={booking} onClose={() => setCreateOpen(false)} saving={saveMutation.isPending} onSave={saveMutation.mutateAsync} />}
    {selected && detailQuery.isFetching && <p role="status" className="p-3 text-xs">Loading quotation details...</p>}
    {selected && detailQuery.isError && <div role="alert" className="p-3 text-sm text-destructive">Unable to load quotation details. <Button variant="outline" onClick={() => detailQuery.refetch()}>Retry</Button><Button variant="ghost" onClick={() => setSelected(null)}>Close</Button></div>}
    {selected && detailQuery.data && !detailQuery.isFetching && !detailQuery.isError && <QuotationDialog key={detailQuery.data._id + '-' + detailQuery.data.version + '-' + editing + '-' + previewOpen} initialPreview={previewOpen} booking={booking} record={detailQuery.data} readOnly={!editing} onClose={() => setSelected(null)} saving={saveMutation.isPending} onSave={saveMutation.mutateAsync} />}
    <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && !deleteMutation.isPending && setDeleting(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete quotation?</AlertDialogTitle><AlertDialogDescription>This permanently deletes {deleting?.quotationNo}. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel><Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>{deleteMutation.isPending ? 'Deleting...' : 'Delete Quotation'}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}
