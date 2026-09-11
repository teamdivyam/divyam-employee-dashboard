/* eslint-disable react/prop-types */
import { ChefHat, ClipboardList, Eye, MoreVertical, Plus, UserRound } from 'lucide-react';

import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@components/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './EventTable';
import { avatarUrl, initials } from '../eventBookingDashboard.utils';
import { Avatar, AvatarFallback, AvatarImage } from '@components/components/ui/avatar';

const functionTones = ['border-amber-200 bg-amber-50 text-amber-700', 'border-emerald-200 bg-emerald-50 text-emerald-700', 'border-rose-200 bg-rose-50 text-rose-700', 'border-violet-200 bg-violet-50 text-violet-700'];
const idOf = (value) => String(value?._id || value || '');
const statusTone = (status) => ['Completed', 'Confirmed'].includes(status)
  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
  : status === 'Cancelled' ? 'border-red-200 bg-red-50 text-red-700'
    : status === 'Pending' ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-blue-200 bg-blue-50 text-blue-700';

const linkedFunctionsFor = (service, functions) => {
  const ids = new Set((service.linkedFunctions || []).map(idOf));
  return functions.filter((item) => ids.has(idOf(item)) || (!ids.size && (item.linkedServices || []).includes(service.service)));
};

export default function EventServicesTable({ services, functions, manager, onAdd, onEdit }) {
  return (
    <Card id="services-overview" className="crm-card overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-base font-bold text-foreground">Service Plan</h2><p className="mt-0.5 text-[11px] text-muted-foreground">Manage confirmed services, function coverage and final delivery scope.</p></div>
        <Button size="sm" className="h-9 gap-2 bg-blue-600 px-4 hover:bg-blue-700" onClick={onAdd}><Plus className="h-4 w-4" />Add Service</Button>
      </div>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[1050px] text-xs">
            <TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30"><TableHead className="w-[14%]">Service</TableHead><TableHead className="w-[22%]">Applies To (Functions)</TableHead><TableHead className="w-[27%]">Final Scope / Key Deliverables</TableHead><TableHead className="w-[17%]">Service Lead</TableHead><TableHead className="w-[12%]">Planning Status</TableHead><TableHead className="w-[8%] text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {services.length ? services.map((item, index) => {
                const linkedFunctions = linkedFunctionsFor(item, functions);
                const lead = item.assignedLead || manager;
                const deliverables = item.deliverables?.length ? item.deliverables : (item.details ? [item.details] : []);
                return <TableRow key={item._id || `${item.service}-${index}`}>
                  <TableCell><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"><ChefHat className="h-4 w-4" /></span><div><p className="font-semibold text-foreground">{item.service}</p>{item.category ? <p className="mt-1 text-[10px] text-muted-foreground">{item.category}</p> : null}</div></div></TableCell>
                  <TableCell><div className="flex flex-wrap gap-1.5">{linkedFunctions.length ? linkedFunctions.map((fn, fnIndex) => <Badge key={idOf(fn)} variant="outline" className={`rounded px-2 py-0.5 text-[9px] ${functionTones[fnIndex % functionTones.length]}`}>{fn.name}</Badge>) : <span className="text-muted-foreground">No functions linked</span>}</div></TableCell>
                  <TableCell>{deliverables.length ? <div className="flex flex-wrap gap-x-2 gap-y-1">{deliverables.slice(0, 5).map((value) => <span key={value} className="text-[11px] text-foreground">{value}</span>)}</div> : <span className="text-muted-foreground">Scope pending</span>}</TableCell>
                  <TableCell>{lead ? <div className="flex items-center gap-2"><Avatar className="h-8 w-8"><AvatarImage src={avatarUrl(lead)} /><AvatarFallback className="bg-blue-50 text-[10px] text-blue-700">{initials(lead.name)}</AvatarFallback></Avatar><div><p className="font-semibold text-foreground">{lead.name}</p><p className="text-[10px] text-muted-foreground">{lead.designation || (item.assignedLead ? 'Service Lead' : 'Event Manager')}</p></div></div> : <span className="flex items-center gap-2 text-muted-foreground"><UserRound className="h-3.5 w-3.5" />Not assigned</span>}</TableCell>
                  <TableCell><Badge variant="outline" className={`rounded px-2 py-0.5 text-[10px] ${statusTone(item.status)}`}>{item.status || 'Pending'}</Badge></TableCell>
                  <TableCell><div className="flex items-center justify-end gap-1"><Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-blue-700" onClick={() => onEdit(item)}><Eye className="h-4 w-4" />View</Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => onEdit(item)}>Edit service</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></TableCell>
                </TableRow>;
              }) : <TableRow><TableCell colSpan={6} className="h-48 text-center"><ClipboardList className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-semibold text-foreground">No services added yet</p><p className="mt-1 text-xs text-muted-foreground">Add the first service to build the delivery plan.</p><Button size="sm" className="mt-4 gap-2" onClick={onAdd}><Plus className="h-4 w-4" />Add Service</Button></TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center gap-2 border-t border-border bg-blue-50/50 px-4 py-3 text-xs text-blue-700 dark:bg-blue-400/5 dark:text-blue-300"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white">i</span>Services stay linked with functions, preferences, hospitality planning and client approvals.</div>
      </CardContent>
    </Card>
  );
}
