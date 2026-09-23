/* eslint-disable react/prop-types */
import { CalendarDays, ChevronRight, Clock3, Eye, Hand, Heart, PartyPopper, Plus, UsersRound } from 'lucide-react';
import { dateRangeLabel, sortFunctionsByFromDate } from '../eventFunction.utils';

import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './EventTable';

const icons = [PartyPopper, Hand, Heart, CalendarDays];
const iconTones = ['bg-amber-50 text-amber-600', 'bg-emerald-50 text-emerald-600', 'bg-rose-50 text-rose-600', 'bg-violet-50 text-violet-600'];
const serviceTones = ['border-emerald-200 bg-emerald-50 text-emerald-700', 'border-violet-200 bg-violet-50 text-violet-700', 'border-blue-200 bg-blue-50 text-blue-700', 'border-rose-200 bg-rose-50 text-rose-700'];

const timeLabel = (start, end) => {
  const format = (value) => {
    if (!value) return '';
    const [hour, minute] = value.split(':').map(Number);
    if (!Number.isFinite(hour)) return value;
    const suffix = hour >= 12 ? 'PM' : 'AM';
    return `${String(hour % 12 || 12).padStart(2, '0')}:${String(minute || 0).padStart(2, '0')} ${suffix}`;
  };
  if (!start) return 'Time pending';
  return end ? `${format(start)} – ${format(end)}` : `${format(start)} onwards`;
};

const statusTone = (status) => status === 'Completed'
  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
  : status === 'Cancelled'
    ? 'border-red-200 bg-red-50 text-red-700'
    : status === 'In Progress'
      ? 'border-blue-200 bg-blue-50 text-blue-700'
      : 'border-green-200 bg-green-50 text-green-700';

export default function EventFunctionsTable({ functions, defaultServices, onAdd, onEdit, onTimeline }) {
  return (
    <Card id="functions-overview" className="crm-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h2 className="text-base font-semibold text-foreground">Functions Overview</h2>
        <Button size="sm" className="h-9 gap-2" variant="custom" onClick={onAdd}><Plus className="h-4 w-4" />Add Function</Button>
      </div>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table headerVariant="section" className="min-w-[1050px] table-fixed text-xs">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[13%] text-center">Function</TableHead>
                <TableHead className="w-[16%]">Date &amp; Time</TableHead>
                <TableHead className="w-[17%]">Venue</TableHead>
                <TableHead className="w-[7%]">Guests</TableHead>
                <TableHead className="w-[26%]">Linked Services</TableHead>
                <TableHead className="w-[10%]">Status</TableHead>
                <TableHead className="w-[11%] text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {functions.length ? sortFunctionsByFromDate(functions).map((item, index) => {
                const Icon = icons[index % icons.length];
                const linkedServices = item.linkedServices ?? defaultServices;
                return (
                  <TableRow key={item._id || `${item.name}-${index}`}>
                    <TableCell className="pl-6"><div className="flex items-center gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${iconTones[index % iconTones.length]}`}><Icon className="h-4 w-4" /></span><span className="font-semibold text-foreground">{item.name}</span></div></TableCell>
                    <TableCell><p className="flex items-center gap-2 font-medium"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /><span>{dateRangeLabel(item.fromDate ?? item.date, item.toDate)}</span></p><p className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />{timeLabel(item.startTime, item.endTime)}</p></TableCell>
                    <TableCell><p className="font-medium text-foreground">{item.venue || 'Venue pending'}</p></TableCell>
                    <TableCell><span className="flex items-center gap-2 font-semibold"><UsersRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />{item.guestCount || 0}</span></TableCell>
                    <TableCell><div className="flex flex-wrap gap-1.5">{linkedServices.length ? linkedServices.map((service, serviceIndex) => <Badge key={service} variant="outline" className={`rounded px-2 py-0.5 text-[9px] ${serviceTones[serviceIndex % serviceTones.length]}`}>{service}</Badge>) : <span className="text-muted-foreground">No services linked</span>}</div></TableCell>
                    <TableCell><Badge variant="outline" className={`whitespace-nowrap rounded px-2 py-0.5 text-[10px] ${statusTone(item.status)}`}>{item.status || 'Planned'}</Badge></TableCell>
                    <TableCell className="pr-6 text-right"><div className="flex items-center justify-end"><Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-blue-700" onClick={() => onEdit(item)}><Eye className="h-4 w-4" />View</Button></div></TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow><TableCell colSpan={7} className="h-48 text-center"><CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-semibold text-foreground">No functions added yet</p><p className="mt-1 text-xs text-muted-foreground">Add the first function to start building the event plan.</p><Button size="sm" className="mt-4 gap-2" onClick={onAdd}><Plus className="h-4 w-4" />Add Function</Button></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-3 border-t border-border bg-blue-50/50 px-4 py-3 text-xs text-blue-700 sm:flex-row sm:items-center sm:justify-between dark:bg-blue-400/5 dark:text-blue-300"><span className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white">i</span>All functions are linked with services, hospitality planning and client approvals.</span><button type="button" onClick={onTimeline} className="flex items-center gap-2 font-semibold">View Event Timeline<ChevronRight className="h-4 w-4" /></button></div>
      </CardContent>
    </Card>
  );
}
