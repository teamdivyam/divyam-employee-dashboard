/* eslint-disable react/prop-types */
import { BedDouble, CalendarDays, CarFront, ConciergeBell, Crown, Hand, Heart, MoreVertical, PartyPopper, Pencil, Settings2, UserRound, UsersRound } from 'lucide-react';

import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@components/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './EventTable';
import EventGuestsNav from './EventGuestsNav';
const functionIcons = [PartyPopper, Hand, Heart, CalendarDays];
const functionTones = ['bg-amber-50 text-amber-600', 'bg-emerald-50 text-emerald-600', 'bg-rose-50 text-rose-600', 'bg-violet-50 text-violet-600'];
const requirementIcons = [ConciergeBell, Crown, BedDouble, CarFront, UserRound];
const idOf = (value) => String(value?._id || value || '');
const statusTone = (status) => ['Finalised', 'Completed'].includes(status)
  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
  : status === 'Cancelled' ? 'border-red-200 bg-red-50 text-red-700'
    : status === 'Pending' ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-blue-200 bg-blue-50 text-blue-700';

const coverageLabel = (item, functions) => {
  const ids = new Set((item.functionAppliesTo || item.appliesToFunctions || []).map(idOf));
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
          <div className="overflow-x-auto"><Table className="min-w-[520px] table-fixed text-xs"><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="w-[46%] !pl-16 text-left">Function</TableHead><TableHead className="w-[18%] text-center">Estimated</TableHead><TableHead className="w-[18%] text-center">Confirmed</TableHead><TableHead className="w-[18%] text-center !px-4">VIP</TableHead></TableRow></TableHeader><TableBody>{functions.length ? functions.map((item, index) => { const Icon = functionIcons[index % functionIcons.length]; return <TableRow key={idOf(item)}><TableCell><div className="flex items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-full ${functionTones[index % functionTones.length]}`}><Icon className="h-3.5 w-3.5" /></span><span className="font-semibold text-foreground">{item.name}</span></div></TableCell><TableCell className="text-center font-semibold">{Number(item.guestCount || 0).toLocaleString('en-IN')}</TableCell><TableCell className="text-center font-semibold">{Number(item.confirmedGuestCount || 0).toLocaleString('en-IN')}</TableCell><TableCell className="text-center font-semibold !px-4">{Number(item.vipGuestCount || 0).toLocaleString('en-IN')}</TableCell></TableRow>; }) : <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No functions available.</TableCell></TableRow>}</TableBody></Table></div>
          <div className="m-3 flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><span>Peak Guests (Max on any function)</span><strong className="text-2xl">{Number(peakGuests || 0).toLocaleString('en-IN')}</strong></div>
        </section>

        <section className="overflow-hidden rounded-lg border border-border">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3"><h2 className="flex items-center gap-2 text-sm font-bold text-foreground"><ConciergeBell className="h-4 w-4 text-emerald-600" />Hospitality Requirements</h2><Button variant="outline" size="sm" className="h-8 gap-2 text-xs" onClick={onAddRequirement}><Settings2 className="h-3.5 w-3.5" />Manage Requirements</Button></div>
          <div className="overflow-x-auto"><Table className="w-full text-xs"><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="!pl-14 text-left">Requirement</TableHead><TableHead className="text-left px-2"><span className="relative -left-2.5 inline-block whitespace-nowrap">Applies To</span></TableHead><TableHead className="text-left px-2">Owner</TableHead><TableHead className="text-center px-2">Status</TableHead><TableHead className="w-10 text-right !pr-3">Action</TableHead></TableRow></TableHeader><TableBody>{requirements.length ? requirements.map((item, index) => {
            const Icon = requirementIcons[index % requirementIcons.length];
            const title = item.requirementName || item.requirement;
            const subtitle = item.specification || item.details;
            const status = item.planningStatus || item.status || 'Pending';
            const owner = item.planningOwner?.name || item.owner?.name || 'Team Assigned';
            return <TableRow key={idOf(item)}><TableCell className="!pl-3 py-2"><div className="flex items-center gap-2 pr-1"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${functionTones[index % functionTones.length]}`}><Icon className="h-3.5 w-3.5" /></span><div className="min-w-0"><p className="font-semibold text-foreground truncate max-w-36">{title}</p>{subtitle ? <p className="mt-0.5 max-w-36 truncate text-[10px] text-muted-foreground">{subtitle}</p> : null}</div></div></TableCell><TableCell className="px-2 py-2 truncate max-w-28 text-blue-700">{coverageLabel(item, functions)}</TableCell><TableCell className="px-2 py-2 truncate max-w-28">{owner}</TableCell><TableCell className="text-center px-2 py-2"><Badge variant="outline" className={`inline-flex h-6 min-w-20 items-center justify-center text-center whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-medium ${statusTone(status)}`}>{status}</Badge></TableCell><TableCell className="text-right py-2 !pr-3"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => onEditRequirement(item)}>Edit requirement</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>;
          }) : <TableRow><TableCell colSpan={5} className="h-32 text-center"><p className="font-semibold text-foreground">No hospitality requirements</p><p className="mt-1 text-[11px] text-muted-foreground">Add the first requirement for this event.</p><Button variant="outline" size="sm" className="mt-3" onClick={onAddRequirement}>Add Requirement</Button></TableCell></TableRow>}</TableBody></Table></div>
        </section>
      </CardContent>
    </Card>
  );
}
