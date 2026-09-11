/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye, FileImage, FileText, Plus, RotateCcw, Search, Star } from 'lucide-react';

import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { Input } from '@components/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './EventTable';
import { approvalStatuses, approvalStatusTone, approvalTypes } from '../eventApproval.utils';

const idOf = (value) => String(value?._id || value || '');
const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const formatFileSize = (value) => {
  const bytes = Number(value || 0);
  if (!bytes) return '';
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
};
const typeTone = (type) => ({
  Decor: 'border-violet-200 bg-violet-50 text-violet-700',
  Catering: 'border-orange-200 bg-orange-50 text-orange-700',
  'Visual Preference': 'border-pink-200 bg-pink-50 text-pink-700',
  'Guest Planning': 'border-cyan-200 bg-cyan-50 text-cyan-700',
  'Event Plan': 'border-blue-200 bg-blue-50 text-blue-700',
  Logistics: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  Hospitality: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}[type] || 'border-slate-200 bg-slate-50 text-slate-700');

function ApprovalReference({ reference }) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const isImage = reference.fileType?.startsWith('image/')
    || /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(reference.fileName || reference.fileUrl || '');
  const showThumbnail = isImage && !thumbnailFailed;

  return (
    <a
      href={reference.fileUrl}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-2 rounded-md border border-border p-1.5 transition-colors hover:border-blue-200 hover:bg-blue-50/40"
      title="Open attachment"
    >
      {showThumbnail ? (
        <img
          src={reference.fileUrl}
          alt={reference.fileName || 'Approval reference'}
          loading="lazy"
          className="h-10 w-14 shrink-0 rounded object-cover ring-1 ring-border"
          onError={() => setThumbnailFailed(true)}
        />
      ) : (
        <span className={`grid h-10 w-14 shrink-0 place-items-center rounded ${isImage ? 'bg-pink-50 text-pink-600' : 'bg-red-50 text-red-600'}`}>
          {isImage ? <FileImage className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[10px] font-semibold">{reference.fileName || 'Attachment'}</span>
        <span className="text-[9px] text-muted-foreground">
          {[isImage ? 'Image' : 'Document', formatFileSize(reference.fileSize)].filter(Boolean).join(' · ')}
        </span>
      </span>
      <Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-blue-600" />
    </a>
  );
}

export default function EventApprovalsPanel({ approvals = [], functions = [], onAdd, onView }) {
  const [search, setSearch] = useState('');
  const [functionFilter, setFunctionFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const functionMap = useMemo(() => new Map(functions.map((item) => [idOf(item), item.name])), [functions]);
  const filtered = useMemo(() => approvals.filter((item) => {
    const term = search.trim().toLowerCase();
    if (term && !`${item.title || ''} ${item.approvalType || ''} ${item.reference?.fileName || ''}`.toLowerCase().includes(term)) return false;
    if (functionFilter !== 'all' && !(item.appliesToFunctions || []).map(idOf).includes(functionFilter)) return false;
    if (typeFilter !== 'all' && item.approvalType !== typeFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    return true;
  }), [approvals, functionFilter, search, statusFilter, typeFilter]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [functionFilter, search, statusFilter, typeFilter]);
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);
  const counts = useMemo(() => ({
    total: approvals.length,
    approved: approvals.filter((item) => item.status === 'Approved').length,
    pending: approvals.filter((item) => item.status === 'Pending').length,
    change: approvals.filter((item) => item.status === 'Change Requested').length,
    ready: approvals.filter((item) => item.status === 'Ready to Finalise').length,
  }), [approvals]);
  const stats = [
    { label: 'Total', value: counts.total, icon: CalendarDays, tone: 'text-violet-600 bg-violet-50' },
    { label: 'Approved', value: counts.approved, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Pending', value: counts.pending, icon: Clock3, tone: 'text-orange-600 bg-orange-50' },
    { label: 'Change Requested', value: counts.change, icon: RotateCcw, tone: 'text-rose-600 bg-rose-50' },
    { label: 'Ready to Finalise', value: counts.ready, icon: Star, tone: 'text-blue-600 bg-blue-50' },
  ];

  return (
    <Card id="client-approvals" className="crm-card overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 2xl:flex-row 2xl:flex-wrap 2xl:items-center 2xl:gap-2">
          <div className="flex min-w-0 shrink-0 items-center overflow-x-auto py-0.5">
            {stats.map(({ label, value, icon: Icon, tone }, index) => (
              <div
                key={label}
                className={`flex min-w-[100px] shrink-0 items-center gap-2 px-3 ${
                  index ? 'border-l border-border' : 'pl-0'
                }`}
              >
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-bold leading-4 text-foreground">{value}</p>
                  <p className="mt-1 whitespace-nowrap text-[10px] font-medium leading-3 text-muted-foreground">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(128px,1fr)_100px_88px_100px_auto] 2xl:min-w-[540px]">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9 w-full pl-9 text-xs"
                placeholder="Search approval"
              />
            </div>

            <Select value={functionFilter} onValueChange={setFunctionFilter}>
              <SelectTrigger className="h-9 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Functions</SelectItem>
                {functions.map((item) => (
                  <SelectItem key={idOf(item)} value={idOf(item)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {approvalTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {approvalStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={onAdd}
              className="h-9 w-full gap-1.5 whitespace-nowrap bg-blue-600 px-4 text-xs hover:bg-blue-700 lg:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Approval
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto"><Table className="min-w-[1120px] table-fixed text-xs"><TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30"><TableHead className="w-[16%] pl-6">Approval Item</TableHead><TableHead className="w-[12%]">Applies To</TableHead><TableHead className="w-[20%]">Reference / File</TableHead><TableHead className="w-[14%]">Shared On</TableHead><TableHead className="w-[12%]">Status</TableHead><TableHead className="w-[14%]">Last Update</TableHead><TableHead className="w-[12%] pr-6 text-right">Action</TableHead></TableRow></TableHeader><TableBody>{pageRows.length ? pageRows.map((item, index) => {
          const appliesTo = (item.appliesToFunctions || []).map(idOf).map((id) => functionMap.get(id)).filter(Boolean).join(', ') || item.appliesToLabel || 'All Functions';
          const actor = item.lastUpdatedByName || item.sharedByName || 'Admin';
          const initials = actor.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
          return (
            <TableRow key={idOf(item)}>
              <TableCell className="pl-6"><div className="flex items-center gap-2"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${typeTone(item.approvalType)}`}>{index + 1}</span><div className="min-w-0"><p className="truncate font-semibold">{item.title}</p><Badge variant="outline" className={`mt-1 rounded px-1.5 py-0 text-[8px] ${typeTone(item.approvalType)}`}>{item.approvalType || 'Other'}</Badge></div></div></TableCell>
              <TableCell><p className="line-clamp-2">{appliesTo}</p></TableCell>
              <TableCell>{item.reference?.fileUrl ? <ApprovalReference reference={item.reference} /> : <span className="text-muted-foreground">No file attached</span>}</TableCell>
              <TableCell><p className="font-medium">{formatDate(item.sharedAt || item.createdAt)}</p><p className="mt-1 text-[9px] text-muted-foreground">Shared by {item.sharedByName || 'Admin'}</p></TableCell>
              <TableCell><Badge variant="outline" className={`whitespace-nowrap rounded px-2 py-0.5 text-[9px] ${approvalStatusTone(item.status)}`}>{item.status || 'Pending'}</Badge></TableCell>
              <TableCell><div className="flex items-center gap-2"><span>{formatDate(item.lastUpdatedAt || item.updatedAt)}</span><span className="grid h-7 w-7 place-items-center rounded-full bg-violet-50 text-[9px] font-bold text-violet-700">{initials || 'AD'}</span></div></TableCell>
              <TableCell className="pr-6 text-right"><Button variant="outline" size="sm" className="h-8 gap-1.5 border-blue-300 bg-transparent px-3 text-blue-700 hover:bg-blue-50 hover:text-blue-800" onClick={() => onView(item)}><Eye className="h-4 w-4" />View</Button></TableCell>
            </TableRow>
          );
        }) : <TableRow><TableCell colSpan={7} className="h-44 text-center"><CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground" /><p className="font-semibold">No approval requests found</p><p className="mt-1 text-[11px] text-muted-foreground">Add an approval request or adjust the current filters.</p></TableCell></TableRow>}</TableBody></Table></div>
        <div className="flex flex-col gap-3 border-t border-border px-6 py-3 text-xs sm:flex-row sm:items-center sm:justify-between"><span className="text-muted-foreground">Showing {filtered.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} approvals</span><div className="flex items-center gap-2"><Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="h-4 w-4" /></Button><span className="grid h-8 min-w-8 place-items-center rounded-md bg-orange-50 px-2 font-semibold text-orange-700">{page}</span><Button variant="outline" size="icon" className="h-8 w-8" disabled={page === pages} onClick={() => setPage((value) => value + 1)}><ChevronRight className="h-4 w-4" /></Button></div></div>
      </CardContent>
    </Card>
  );
}
