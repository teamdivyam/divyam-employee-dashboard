/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CalendarDays,
  Camera,
  CheckSquare2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Eye,
  Loader2,
  MapPin,
  Plus,
  Search,
  UserRound,
} from 'lucide-react';
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

const statuses = ['Not Started', 'Pending', 'In Progress', 'Completed', 'Skipped', 'Cancelled'];
const checklistStatuses = ['Pending', 'In Verification', 'Verified', 'Not Applicable'];
const defaultCategories = ['Decor & Technical', 'Safety & Backup', 'Venue & Setup', 'Catering', 'Team & Vendors', 'Guest & Hospitality'];
const emptyForm = {
  itemType: 'Run Sheet',
  functionId: 'none',
  scheduledAt: '',
  activity: '',
  category: '',
  isCritical: false,
  location: '',
  owner: 'none',
  notesDependency: '',
  status: 'Not Started',
  isUpNext: false,
  proofUrls: '',
  proofRequired: false,
  notes: '',
};
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
  if (['Completed', 'Verified'].includes(status)) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (['In Progress', 'In Verification'].includes(status)) return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === 'Pending') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (['Cancelled', 'Skipped'].includes(status)) return 'border-red-200 bg-red-50 text-red-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
};

function RunSheetItemDialog({ open, onOpenChange, item, defaultItemType, functions, employees, saving, onSave }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(item ? {
      itemType: item.itemType || 'Run Sheet',
      functionId: idOf(item.function) || 'none',
      scheduledAt: item.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : '',
      activity: item.activity || '',
      category: item.category || '',
      isCritical: Boolean(item.isCritical),
      location: item.location || '',
      owner: idOf(item.owner) || 'none',
      notesDependency: item.notesDependency || '',
      status: item.status || 'Not Started',
      isUpNext: Boolean(item.isUpNext),
      proofUrls: (item.proofUrls || []).join('\n'),
      proofRequired: Boolean(item.proofRequired),
      notes: item.notes || '',
    } : { ...emptyForm, itemType: defaultItemType || 'Run Sheet', status: defaultItemType === 'Checklist' ? 'Pending' : 'Not Started' });
  }, [defaultItemType, item, open]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    const eventFunction = functions.find((entry) => idOf(entry) === form.functionId);
    const owner = employees.find((entry) => idOf(entry) === form.owner);
    onSave({
      itemType: form.itemType,
      function: eventFunction?._id || null,
      functionName: eventFunction?.name || 'General',
      scheduledAt: form.scheduledAt,
      activity: form.activity.trim(),
      category: form.itemType === 'Checklist' ? form.category.trim() : '',
      isCritical: form.itemType === 'Checklist' && form.isCritical,
      location: form.location.trim(),
      owner: owner?._id || null,
      ownerName: owner?.name || '',
      notesDependency: form.notesDependency.trim(),
      status: form.status,
      isUpNext: form.isUpNext,
      proofUrls: form.itemType === 'Checklist' ? form.proofUrls.split(/[\n,]/).map((value) => value.trim()).filter(Boolean) : [],
      proofRequired: form.itemType === 'Checklist' && form.proofRequired,
      notes: form.notes.trim(),
    });
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader><DialogTitle>{item ? 'Update' : 'Add'} {form.itemType} Item</DialogTitle></DialogHeader>
      <form id="event-run-sheet-form" onSubmit={submit} className="grid gap-4 py-2 sm:grid-cols-2">
        <div className="space-y-1.5"><Label>Item type</Label><Select value={form.itemType} onValueChange={(value) => setForm((current) => ({ ...current, itemType: value, status: value === 'Checklist' ? 'Pending' : 'Not Started' }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Run Sheet">Run Sheet</SelectItem><SelectItem value="Checklist">Checklist</SelectItem></SelectContent></Select></div>
        <div className="space-y-1.5"><Label>Function</Label><Select value={form.functionId} onValueChange={(value) => update('functionId', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">General / All Functions</SelectItem>{functions.map((entry) => <SelectItem key={idOf(entry)} value={idOf(entry)}>{entry.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>{form.itemType === 'Checklist' ? 'Checklist item' : 'Activity / Milestone'}</Label><Input value={form.activity} onChange={(event) => update('activity', event.target.value)} placeholder={form.itemType === 'Checklist' ? 'e.g. Main stage decor installation completed' : 'e.g. Final decor check'} required /></div>
        {form.itemType === 'Checklist' && <div className="space-y-1.5"><Label>Category</Label><Input list="checklist-categories" value={form.category} onChange={(event) => update('category', event.target.value)} placeholder="Venue & Setup" /><datalist id="checklist-categories">{defaultCategories.map((category) => <option key={category} value={category} />)}</datalist></div>}
        <div className="space-y-1.5"><Label>{form.itemType === 'Checklist' ? 'Verify by' : 'Date & time'}</Label><Input type="datetime-local" value={form.scheduledAt} onChange={(event) => update('scheduledAt', event.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="Main stage" /></div>
        <div className="space-y-1.5"><Label>Owner</Label><Select value={form.owner} onValueChange={(value) => update('owner', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not assigned</SelectItem>{employees.map((entry) => <SelectItem key={idOf(entry)} value={idOf(entry)}>{entry.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(value) => update('status', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(form.itemType === 'Checklist' ? checklistStatuses : statuses).map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Notes / Dependency</Label><Textarea value={form.notesDependency} onChange={(event) => update('notesDependency', event.target.value)} placeholder="Coordination or prerequisite details" className="min-h-20" /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Additional notes</Label><Textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} className="min-h-16" /></div>
        {form.itemType === 'Checklist' ? <>
          <div className="space-y-1.5 sm:col-span-2"><Label>Proof image URLs</Label><Textarea value={form.proofUrls} onChange={(event) => update('proofUrls', event.target.value)} placeholder="One image URL per line" className="min-h-20" /></div>
          <label className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={form.isCritical} onCheckedChange={(checked) => update('isCritical', checked === true)} />Critical item</label>
          <label className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={form.proofRequired} onCheckedChange={(checked) => update('proofRequired', checked === true)} />Photo proof required</label>
        </> : <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2"><Checkbox checked={form.isUpNext} onCheckedChange={(checked) => update('isUpNext', checked === true)} />Mark as up next</label>}
      </form>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="event-run-sheet-form" disabled={saving || !form.activity.trim() || !form.scheduledAt}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{item ? 'Save Changes' : 'Add Item'}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

function FunctionGroup({ group, onView }) {
  const [expanded, setExpanded] = useState(true);
  const detail = group.functionDetail;
  const functionDate = detail?.date ? dateParts(detail.date).date : '';
  const venue = [detail?.area, detail?.venue].filter(Boolean).join(' · ');

  return <section className="overflow-hidden rounded-lg border border-border">
    <button type="button" onClick={() => setExpanded((value) => !value)} className="flex w-full items-center gap-3 bg-pink-50/70 px-4 py-3 text-left hover:bg-pink-50">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-pink-100 text-pink-600"><UserRound className="h-4 w-4" /></span>
      <span className="font-semibold text-slate-900">{group.name}</span>
      {functionDate && <span className="border-l pl-3 text-xs text-muted-foreground">{functionDate}</span>}
      {venue && <span className="text-xs text-muted-foreground">{venue}</span>}
      <span className="ml-auto rounded-full bg-pink-100 px-3 py-1 text-[11px] font-semibold text-pink-700">{group.items.length} {group.items.length === 1 ? 'Activity' : 'Activities'}</span>
      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
    {expanded && <div className="overflow-x-auto"><Table className="min-w-[1000px]">
      <TableHeader><TableRow className="bg-muted/25"><TableHead className="w-56 min-w-56">Date & Time</TableHead><TableHead>Activity / Milestone</TableHead><TableHead>Location</TableHead><TableHead>Owner</TableHead><TableHead>Notes / Dependency</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
      <TableBody>{group.items.map((item) => {
        const schedule = dateParts(item.scheduledAt);
        return <TableRow key={item._id} className={item.isUpNext ? 'border-l-4 border-l-blue-500 bg-muted/20' : ''}>
          <TableCell><div className="flex items-start gap-2 text-xs"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" /><div><p>{schedule.date}</p><p className="text-muted-foreground">{schedule.time}</p></div>{item.isUpNext && <Badge className="ml-1 border-0 bg-blue-50 text-[10px] text-blue-700 hover:bg-blue-50">Up Next</Badge>}</div></TableCell>
          <TableCell className="font-medium">{item.activity}</TableCell>
          <TableCell><div className="flex items-center gap-1.5 text-xs"><MapPin className="h-3.5 w-3.5 text-blue-700" />{item.location || '-'}</div></TableCell>
          <TableCell><div className="flex items-center gap-1.5 text-xs"><UserRound className="h-3.5 w-3.5 text-blue-700" />{item.owner?.name || item.ownerName || '-'}</div></TableCell>
          <TableCell className="max-w-64 text-xs">{item.notesDependency || '-'}</TableCell>
          <TableCell><Badge variant="outline" className={statusTone(item.status)}>{item.status}</Badge></TableCell>
          <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => onView(item)} className="gap-1.5 text-blue-700"><Eye className="h-4 w-4" />View</Button></TableCell>
        </TableRow>;
      })}</TableBody>
    </Table></div>}
  </section>;
}

function ChecklistTable({ items, scopeItems, functionName, onView, onVerify, onUpload }) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const rows = items.slice((page - 1) * pageSize, page * pageSize);
  const verified = scopeItems.filter((item) => item.status === 'Verified').length;
  const applicable = scopeItems.filter((item) => item.status !== 'Not Applicable').length;
  const percentage = applicable ? Math.round((verified / applicable) * 100) : 0;
  const criticalPending = scopeItems.filter((item) => item.isCritical && !['Verified', 'Not Applicable'].includes(item.status)).length;
  const lastUpdatedValue = scopeItems.reduce((latest, item) => Math.max(latest, new Date(item.updatedAt || item.createdAt || 0).getTime() || 0), 0);
  const lastUpdated = lastUpdatedValue ? dateParts(lastUpdatedValue) : null;

  useEffect(() => setPage(1), [items]);

  return <div className="overflow-hidden rounded-lg border border-border">
    <div className="flex flex-wrap items-center gap-4 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2"><CheckSquare2 className="h-5 w-5 text-blue-700" /><h3 className="font-semibold">{functionName} Checklist</h3></div>
      <span className="text-sm font-semibold text-blue-900">{verified} / {applicable} Verified</span>
      <div className="h-2 min-w-32 flex-1 overflow-hidden rounded-full bg-slate-200 sm:max-w-72"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percentage}%` }} /></div>
      <span className="font-semibold text-emerald-600">{percentage}% Ready</span>
      {criticalPending > 0 && <Badge variant="outline" className="gap-1.5 border-red-200 bg-red-50 text-red-600"><AlertCircle className="h-3.5 w-3.5" />{criticalPending} Critical Pending</Badge>}
      {lastUpdated && <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />Last Updated: {lastUpdated.date}, {lastUpdated.time}</span>}
    </div>
    <div className="overflow-x-auto"><Table className="min-w-[1080px]">
      <TableHeader><TableRow className="bg-muted/25"><TableHead className="w-12"><Checkbox disabled aria-label="Select all checklist items" /></TableHead><TableHead>Checklist Item</TableHead><TableHead>Category</TableHead><TableHead>Owner</TableHead><TableHead className="w-40">Verify By</TableHead><TableHead className="w-44">Proof</TableHead><TableHead className="w-24">Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
      <TableBody>{rows.length ? rows.map((item) => {
        const verifyBy = dateParts(item.scheduledAt);
        const proofUrls = item.proofUrls || [];
        return <TableRow key={item._id}>
          <TableCell><Checkbox checked={item.status === 'Verified'} disabled={item.status === 'Not Applicable'} onCheckedChange={(checked) => onVerify(item, checked === true)} aria-label={`Verify ${item.activity}`} /></TableCell>
          <TableCell><div className="flex items-center gap-2"><span className="font-medium">{item.activity}</span>{item.isCritical && <Badge className="border-0 bg-red-50 text-[10px] text-red-600 hover:bg-red-50">Critical</Badge>}</div></TableCell>
          <TableCell className="text-xs">{item.category || '-'}</TableCell>
          <TableCell><div className="flex items-center gap-1.5 text-xs"><UserRound className="h-3.5 w-3.5 text-blue-700" />{item.owner?.name || item.ownerName || '-'}</div></TableCell>
          <TableCell><div className="text-xs"><p>{verifyBy.date}</p><p className="text-muted-foreground">{verifyBy.time}</p></div></TableCell>
          <TableCell>{item.proofRequired ? <div className="flex items-center gap-1">{proofUrls.slice(0, 2).map((url, index) => <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="block h-8 w-8 shrink-0 overflow-hidden rounded border bg-muted"><img src={url} alt="Checklist proof" className="h-full w-full object-cover" /></a>)}{proofUrls.length > 2 && <span className="rounded bg-blue-50 px-1.5 py-1 text-[10px] text-blue-700">+{proofUrls.length - 2}</span>}<label title={proofUrls.length ? 'Add more photos' : 'Add photos'} className={`inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-md border border-input bg-background text-[11px] font-medium text-blue-700 hover:bg-accent ${proofUrls.length ? 'w-8 px-0' : 'px-2.5'}`}><Camera className="h-3.5 w-3.5" />{!proofUrls.length && 'Add Photo'}<input type="file" accept="image/*" multiple className="hidden" onChange={(event) => { const files = Array.from(event.target.files || []); event.target.value = ''; onUpload(item, files); }} /></label></div> : <span className="text-[11px] text-muted-foreground">No Proof Required</span>}</TableCell>
          <TableCell><Badge variant="outline" className={`min-w-20 justify-center px-2 text-[11px] ${statusTone(item.status)}`}>{item.status}</Badge></TableCell>
          <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => onView(item)} className="gap-1.5 text-blue-700"><Eye className="h-4 w-4" />View</Button></TableCell>
        </TableRow>;
      }) : <TableRow><TableCell colSpan={8} className="h-36 text-center text-sm text-muted-foreground">No checklist items match the selected filters.</TableCell></TableRow>}</TableBody>
    </Table></div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground"><span>Showing {items.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, items.length)} of {items.length} items</span><div className="flex items-center gap-2"><span>{pageSize} per page</span><Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>‹</Button><span className="grid h-8 min-w-8 place-items-center rounded-md bg-emerald-50 px-2 font-semibold text-emerald-700">{page}</span><Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>›</Button></div></div>
  </div>;
}

function RunSheetPanel({ data, functions, onAdd, onView, onVerify, onUpload }) {
  const items = useMemo(() => data?.runSheet || [], [data]);
  const [itemType, setItemType] = useState('Run Sheet');
  const [functionFilter, setFunctionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [timelineOpen, setTimelineOpen] = useState(false);

  const typeItems = useMemo(() => items.filter((item) => item.itemType === itemType), [itemType, items]);
  const availableCategories = useMemo(() => Array.from(new Set(typeItems.map((item) => item.category).filter(Boolean))), [typeItems]);
  const countFor = (functionId) => typeItems.filter((item) => idOf(item.function) === functionId).length;
  const scopeItems = useMemo(() => typeItems.filter((item) => functionFilter === 'all' || idOf(item.function) === functionFilter), [functionFilter, typeItems]);
  const filtered = useMemo(() => typeItems.filter((item) => {
    const query = search.trim().toLowerCase();
    return (!query || [item.activity, item.location, item.owner?.name, item.ownerName, item.notesDependency].some((value) => String(value || '').toLowerCase().includes(query)))
      && (status === 'all' || item.status === status)
      && (category === 'all' || item.category === category)
      && (functionFilter === 'all' || idOf(item.function) === functionFilter);
  }), [category, functionFilter, search, status, typeItems]);
  const selectedFunction = functions.find((entry) => idOf(entry) === functionFilter);

  const groups = useMemo(() => {
    const result = [];
    filtered.forEach((item) => {
      const key = idOf(item.function) || 'general';
      let group = result.find((entry) => entry.key === key);
      if (!group) {
        group = { key, name: item.functionDetail?.name || item.functionName || 'General', functionDetail: item.functionDetail, items: [] };
        result.push(group);
      }
      group.items.push(item);
    });
    return result;
  }, [filtered]);

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3 xl:flex-nowrap">
      <EventOperationsNav active="run-sheet" />
      <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 lg:flex-nowrap xl:w-auto xl:flex-1">
        <div className={`relative ${itemType === 'Checklist' ? 'w-full min-w-0 sm:w-44 sm:flex-none' : 'min-w-48 flex-1 xl:max-w-64'}`}><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={itemType === 'Checklist' ? 'Search checklist item...' : 'Search activity, owner or location...'} className="h-9 pl-9 text-xs" /></div>
        {itemType === 'Checklist' && <Select value={category} onValueChange={setCategory}><SelectTrigger className="h-9 w-36 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{availableCategories.map((entry) => <SelectItem key={entry} value={entry}>{entry}</SelectItem>)}</SelectContent></Select>}
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 w-32 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{(itemType === 'Checklist' ? checklistStatuses : statuses).map((entry) => <SelectItem key={entry} value={entry}>{entry}</SelectItem>)}</SelectContent></Select>
        <Button size="sm" onClick={() => onAdd(itemType)} className="h-9 shrink-0 gap-1.5 bg-blue-600 text-xs hover:bg-blue-700"><Plus className="h-4 w-4" />Add {itemType} Item</Button>
      </div>
    </div>
    <Card className="border-border shadow-sm"><CardContent className="space-y-3 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2"><Button size="sm" variant={itemType === 'Run Sheet' ? 'default' : 'outline'} onClick={() => { setItemType('Run Sheet'); setFunctionFilter('all'); setCategory('all'); setStatus('all'); }} className="gap-2"><ClipboardList className="h-4 w-4" />Run Sheet ({data?.summary?.runSheet || 0})</Button><Button size="sm" variant={itemType === 'Checklist' ? 'default' : 'outline'} onClick={() => { setItemType('Checklist'); setFunctionFilter('all'); setCategory('all'); setStatus('all'); }} className="gap-2"><CheckSquare2 className="h-4 w-4" />Checklist ({data?.summary?.checklist || 0})</Button></div>
        {itemType === 'Run Sheet' && <Button variant="outline" size="sm" onClick={() => setTimelineOpen(true)} className="gap-2 text-blue-700"><CalendarDays className="h-4 w-4" />View Event Timeline</Button>}
      </div>
      <div className="flex flex-wrap gap-2 border-b pb-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setFunctionFilter('all')}
          className={`h-8 border-slate-200 bg-slate-100 text-xs text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 ${functionFilter === 'all' ? 'border-current shadow-sm' : ''}`}
        >
          All Functions ({typeItems.length})
        </Button>
        {functions.map((entry, index) => {
          const functionId = idOf(entry);
          const isActive = functionFilter === functionId;

          return (
            <Button
              key={functionId}
              size="sm"
              variant="outline"
              onClick={() => setFunctionFilter(functionId)}
              className={`h-8 text-xs ${getFunctionThemeTone(entry.name, index)} ${isActive ? 'border-current shadow-sm' : ''}`}
            >
              {entry.name} ({countFor(functionId)})
            </Button>
          );
        })}
      </div>
      {itemType === 'Checklist' ? <ChecklistTable items={filtered} scopeItems={scopeItems} functionName={selectedFunction?.name || 'All Functions'} onView={onView} onVerify={onVerify} onUpload={onUpload} /> : groups.length ? <div className="space-y-3">{groups.map((group) => <FunctionGroup key={group.key} group={group} onView={onView} />)}</div> : <div className="grid min-h-48 place-items-center rounded-lg border border-dashed text-center text-sm text-muted-foreground"><div><ClipboardList className="mx-auto mb-2 h-8 w-8 opacity-40" /><p>No run sheet items found.</p><Button variant="link" size="sm" onClick={() => onAdd('Run Sheet')}>Add the first item</Button></div></div>}
    </CardContent></Card>
    <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader><DialogTitle>Event Timeline</DialogTitle></DialogHeader>
        <div className="space-y-1 py-2">{items.length ? items.map((item, index) => {
          const schedule = dateParts(item.scheduledAt);
          return <div key={item._id} className="relative flex gap-3 pb-5 last:pb-0">
            {index < items.length - 1 && <span className="absolute left-[7px] top-5 h-[calc(100%-12px)] w-px bg-border" />}
            <span className={`mt-1.5 h-4 w-4 shrink-0 rounded-full border-4 border-white ${item.status === 'Completed' ? 'bg-emerald-500' : item.isUpNext ? 'bg-pink-500' : 'bg-blue-500'}`} />
            <div className="min-w-0 flex-1 rounded-lg border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{item.activity}</p><Badge variant="outline" className={statusTone(item.status)}>{item.status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{schedule.date} · {schedule.time} · {item.functionDetail?.name || item.functionName || 'General'}</p>{item.location && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{item.location}</p>}</div>
          </div>;
        }) : <p className="py-10 text-center text-sm text-muted-foreground">No timeline items have been added yet.</p>}</div>
      </DialogContent>
    </Dialog>
  </div>;
}

export default function EventRunSheetPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newItemType, setNewItemType] = useState('Run Sheet');
  const [editBookingOpen, setEditBookingOpen] = useState(false);
  const bookingQuery = useQuery({ queryKey: ['event-booking-detail', eventId], queryFn: async () => (await AdminService.getEventBookingDetail({ eventId })).data, enabled: Boolean(eventId) });
  const runSheetQuery = useQuery({ queryKey: ['event-booking-run-sheet', eventId], queryFn: async () => (await AdminService.getEventRunSheet({ eventId, limit: 200 })).data, enabled: Boolean(eventId) });
  const managersQuery = useQuery({ queryKey: ['event-booking-managers'], queryFn: async () => (await AdminService.getEventBookingManagers({ limit: 100 })).data });
  const booking = getBookingDetail(bookingQuery.data);
  const employees = getEmployees(managersQuery.data);
  const functions = useMemo(() => booking?.functions || [], [booking]);
  const services = useMemo(() => Array.from(new Set([...(booking?.servicesRequired || []), ...(booking?.servicesSelected || []).map((item) => item.service).filter(Boolean)])), [booking]);
  const metrics = useMemo(() => ({ functions: functions.length, services: services.length, peakGuests: Math.max(Number(booking?.guestCount || 0), ...functions.map((item) => Number(item.guestCount || 0))), preferences: getFinalPreferenceCount(booking), approvals: (booking?.approvals || []).filter((item) => item.status === 'Pending').length }), [booking, functions, services]);
  const itemMutation = useMutation({ mutationFn: (payload) => selectedItem?._id ? AdminService.updateEventRunSheetItem({ eventId, itemId: selectedItem._id, ...payload }) : AdminService.addEventRunSheetItem({ eventId, ...payload }), onSuccess: () => { toast.success(selectedItem ? 'Run sheet item updated' : 'Run sheet item added'); setDialogOpen(false); setSelectedItem(null); runSheetQuery.refetch(); bookingQuery.refetch(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to save run sheet item') });
  const verifyMutation = useMutation({ mutationFn: ({ item, verified }) => AdminService.updateEventRunSheetItem({ eventId, itemId: item._id, status: verified ? 'Verified' : 'Pending' }), onSuccess: () => { toast.success('Checklist status updated'); runSheetQuery.refetch(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to update checklist status') });
  const proofMutation = useMutation({ mutationFn: ({ item, files }) => AdminService.uploadEventChecklistProofs({ eventId, itemId: item._id, files }), onSuccess: () => { toast.success('Checklist proof uploaded'); runSheetQuery.refetch(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to upload checklist proof') });
  const updateBookingMutation = useMutation({ mutationFn: (payload) => AdminService.updateEventBooking({ eventId, ...payload }), onSuccess: () => { toast.success('Booking updated'); setEditBookingOpen(false); bookingQuery.refetch(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to update booking') });
  const readyMutation = useMutation({ mutationFn: () => AdminService.markEventExecutionReady({ eventId }), onSuccess: () => { toast.success('Event marked execution ready'); bookingQuery.refetch(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to mark event ready') });

  if (bookingQuery.isLoading || runSheetQuery.isLoading) return <div className="crm-page grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!booking) return <div className="crm-page p-5"><Card className="crm-card"><CardContent className="p-8 text-center"><p className="font-semibold">Event booking not found</p><Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/assigned-events')}>Back to bookings</Button></CardContent></Card></div>;

  const selectTab = (key) => { if (key === 'overview') navigate(`/dashboard/assigned-events/${eventId}`); else if (key === 'plan') navigate(`/dashboard/assigned-events/${eventId}/plan/functions`); else if (key === 'operations') navigate(`/dashboard/assigned-events/${eventId}/operations`); else if (key === 'activity') toast.info('Event activity will be available here.'); else if (key === 'finance') toast.info('Finance & Files will be available here.'); };

  return <div className="crm-page min-h-screen space-y-3 p-3 sm:p-4 lg:p-5">
    <EventFunctionsHeader booking={booking} metrics={metrics} onBack={() => navigate('/dashboard/assigned-events')} onEdit={() => setEditBookingOpen(true)} onMarkReady={() => readyMutation.mutate()} onOpenPlanning={() => document.getElementById('event-run-sheet')?.scrollIntoView({ behavior: 'smooth' })} primaryActionLabel="Open Operations Plan" />
    <EventDetailTabs activePrimary="operations" onSelect={selectTab} />
    <div id="event-run-sheet"><RunSheetPanel data={runSheetQuery.data} functions={functions} onAdd={(type) => { setSelectedItem(null); setNewItemType(type); setDialogOpen(true); }} onView={(item) => { setSelectedItem(item); setNewItemType(item.itemType || 'Run Sheet'); setDialogOpen(true); }} onVerify={(item, verified) => verifyMutation.mutate({ item, verified })} onUpload={(item, files) => { if (files?.length) proofMutation.mutate({ item, files }); }} /></div>
    <RunSheetItemDialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setSelectedItem(null); }} item={selectedItem} defaultItemType={newItemType} functions={functions} employees={employees} saving={itemMutation.isPending} onSave={(payload) => itemMutation.mutate(payload)} />
    <EditBookingDialog open={editBookingOpen} onOpenChange={setEditBookingOpen} booking={booking} employees={employees} saving={updateBookingMutation.isPending} onSave={(payload) => updateBookingMutation.mutate(payload)} />
  </div>;
}
