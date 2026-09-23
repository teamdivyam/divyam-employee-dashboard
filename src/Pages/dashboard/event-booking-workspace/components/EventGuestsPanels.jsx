/* eslint-disable react/prop-types */
import { BedDouble, CarFront, ConciergeBell, Crown, Hand, MoreVertical, Pencil, Settings2, UserRound, UsersRound } from 'lucide-react';

import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@components/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './EventTable';
import EventGuestsNav from './EventGuestsNav';
const functionIcons = [Crown, Hand, UsersRound, ConciergeBell];
const functionTones = ['bg-amber-50 text-amber-600', 'bg-emerald-50 text-emerald-600', 'bg-rose-50 text-rose-600', 'bg-violet-50 text-violet-600'];
const requirementIcons = [ConciergeBell, Crown, BedDouble, CarFront, UserRound];
const idOf = (value) => String(value?._id || value || '');
const statusTone = (status) => ['Finalised', 'Completed'].includes(status)
  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
  : status === 'Cancelled' ? 'border-red-200 bg-red-50 text-red-700'
    : status === 'Pending' ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-blue-200 bg-blue-50 text-blue-700';

const coverageLabel = (item, functions) => {
  const ids = new Set((item.appliesToFunctions || []).map(idOf));
  const names = functions.filter((fn) => ids.has(idOf(fn))).map((fn) => fn.name);
  return names.length ? names.join(', ') : item.appliesToLabel || 'All functions';
};

export default function EventGuestsPanels({ functions, requirements, peakGuests, onUpdateCounts, onAddRequirement, onEditRequirement, onUnavailable }) {
  return (
    <Card id="guests-overview" className="crm-card overflow-hidden">
      <EventGuestsNav active="counts" onSelect={(key, label) => key !== 'counts' && onUnavailable(key, label)} actions={<Button variant="custom" size="sm" className="h-9 gap-2" onClick={onUpdateCounts}><UserRound className="h-4 w-4" />Manage Guests</Button>} />

      <CardContent className="grid gap-4 p-4 xl:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-border">
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3"><div><h2 className="flex items-center gap-2 text-sm font-bold text-foreground"><UsersRound className="h-4 w-4 text-emerald-600" />Function-wise Guest Count</h2><p className="mt-1 text-[11px] text-muted-foreground">Peak guests is the highest expected attendance on any single function.</p></div><Button variant="outline" size="sm" className="h-8 gap-2 text-xs" onClick={onUpdateCounts}><Pencil className="h-3.5 w-3.5" />Update Counts</Button></div>
          <div className="overflow-x-auto"><Table className="min-w-[520px] text-xs"><TableHeader><TableRow className="hover:bg-transparent"><TableHead>Function</TableHead><TableHead className="text-center">Estimated</TableHead><TableHead className="text-center">Confirmed</TableHead><TableHead className="text-center">VIP</TableHead></TableRow></TableHeader><TableBody>{functions.length ? functions.map((item, index) => { const Icon = functionIcons[index % functionIcons.length]; return <TableRow key={idOf(item)}><TableCell><div className="flex items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-full ${functionTones[index % functionTones.length]}`}><Icon className="h-3.5 w-3.5" /></span><span className="font-semibold text-foreground">{item.name}</span></div></TableCell><TableCell className="text-center font-semibold">{Number(item.guestCount || 0).toLocaleString('en-IN')}</TableCell><TableCell className="text-center font-semibold">{Number(item.confirmedGuestCount || 0).toLocaleString('en-IN')}</TableCell><TableCell className="text-center font-semibold">{Number(item.vipGuestCount || 0).toLocaleString('en-IN')}</TableCell></TableRow>; }) : <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No functions available.</TableCell></TableRow>}</TableBody></Table></div>
          <div className="m-3 flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><span>Peak Guests (Max on any function)</span><strong className="text-2xl">{Number(peakGuests || 0).toLocaleString('en-IN')}</strong></div>
        </section>

        <section className="overflow-hidden rounded-lg border border-border">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3"><h2 className="flex items-center gap-2 text-sm font-bold text-foreground"><ConciergeBell className="h-4 w-4 text-emerald-600" />Hospitality Requirements</h2><Button variant="outline" size="sm" className="h-8 gap-2 text-xs" onClick={onAddRequirement}><Settings2 className="h-3.5 w-3.5" />Manage Requirements</Button></div>
          <div className="overflow-x-auto"><Table className="min-w-[650px] text-xs"><TableHeader><TableRow className="hover:bg-transparent"><TableHead>Requirement</TableHead><TableHead>Applies To</TableHead><TableHead>Owner</TableHead><TableHead>Status</TableHead><TableHead className="w-12 text-right">Action</TableHead></TableRow></TableHeader><TableBody>{requirements.length ? requirements.map((item, index) => { const Icon = requirementIcons[index % requirementIcons.length]; return <TableRow key={idOf(item)}><TableCell><div className="flex items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-full ${functionTones[index % functionTones.length]}`}><Icon className="h-3.5 w-3.5" /></span><div><p className="font-semibold text-foreground">{item.requirement}</p>{item.details ? <p className="mt-0.5 max-w-40 truncate text-[10px] text-muted-foreground">{item.details}</p> : null}</div></div></TableCell><TableCell className="max-w-40 text-blue-700">{coverageLabel(item, functions)}</TableCell><TableCell>{item.owner?.name || 'Team Assigned'}</TableCell><TableCell><Badge variant="outline" className={`rounded px-2 py-0.5 text-[9px] ${statusTone(item.status)}`}>{item.status || 'Pending'}</Badge></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => onEditRequirement(item)}>Edit requirement</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>; }) : <TableRow><TableCell colSpan={5} className="h-32 text-center"><p className="font-semibold text-foreground">No hospitality requirements</p><p className="mt-1 text-[11px] text-muted-foreground">Add the first requirement for this event.</p><Button variant="outline" size="sm" className="mt-3" onClick={onAddRequirement}>Add Requirement</Button></TableCell></TableRow>}</TableBody></Table></div>
        </section>
      </CardContent>
    </Card>
  );
}
