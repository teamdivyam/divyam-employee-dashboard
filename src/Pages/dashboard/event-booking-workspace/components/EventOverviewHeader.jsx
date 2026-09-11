/* eslint-disable react/prop-types */
import {
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  Flag,
  ListChecks,
  MoreVertical,
  SlidersHorizontal,
  WalletCards,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@components/components/ui/avatar';
import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@components/components/ui/dropdown-menu';
import { avatarUrl, bookingCode, currencyAmount, eventDateLabel, initials } from '../eventBookingDashboard.utils';

const metricTones = {
  violet: 'bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300',
  green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
};

const metricCardTones = {
  violet: 'bg-violet-50/40 dark:bg-violet-400/5',
  blue: 'bg-blue-50/40 dark:bg-blue-400/5',
  orange: 'bg-orange-50/40 dark:bg-orange-400/5',
  green: 'bg-emerald-50/40 dark:bg-emerald-400/5',
};

export default function EventOverviewHeader({ booking, summary, onBack, onOpenPlanning, onEdit, onMarkReady, onViewTasks }) {
  const clientName = booking.customer?.name || booking.eventName || 'Event Booking';
  const cards = [
    {
      label: 'Event Manager',
      value: booking.assignedManager?.name || 'Unassigned',
      caption: booking.assignedManager?.designation || 'Event Manager',
      icon: CircleUserRound,
      tone: 'violet',
    },
    {
      label: 'Planning Stage',
      value: summary.stage,
      caption: `Stage ${summary.stageStep} of 5`,
      icon: SlidersHorizontal,
      tone: 'blue',
    },
    {
      label: 'Next Milestone',
      value: summary.nextMilestone.label,
      caption: summary.nextMilestone.date,
      icon: Flag,
      tone: 'orange',
    },
    {
      label: 'Payment Progress',
      value: `${summary.payment.clampedPercentage}% Paid`,
      caption: `${currencyAmount(summary.payment.pending)} Pending`,
      icon: WalletCards,
      tone: 'green',
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-4 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="h-16 w-16 rounded-lg border border-violet-100"><AvatarImage src={avatarUrl(booking.customer)} /><AvatarFallback className="rounded-lg bg-violet-50 text-xl font-semibold text-violet-700">{initials(clientName)}</AvatarFallback></Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3"><h1 className="truncate text-2xl font-bold text-foreground">{clientName}</h1><Badge className="border-0 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Booking Confirmed</Badge></div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"><span>{bookingCode(booking)}</span><span>•</span><span>{booking.eventType || '-'}</span><span>•</span><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{eventDateLabel(booking, { includeWeekday: true })}</span><span>•</span><span>{[booking.venue, booking.city].filter(Boolean).join(', ') || '-'}</span></div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button className="h-10 gap-2 bg-blue-600 px-5 hover:bg-blue-700" onClick={onOpenPlanning}><SlidersHorizontal className="h-4 w-4" />Open Planning<ChevronRight className="h-4 w-4" /></Button>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="h-10 gap-2">More Actions<MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={onEdit}>Edit booking</DropdownMenuItem><DropdownMenuItem onSelect={onMarkReady}>Mark execution ready</DropdownMenuItem><DropdownMenuItem onSelect={onBack}>Back to bookings</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, caption, icon: Icon, tone }) => (
          <Card key={label} className={`crm-card ${metricCardTones[tone]}`}><CardContent className="flex min-h-24 items-center gap-3 p-4"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${metricTones[tone]}`}><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-bold text-foreground">{value}</p><p className="mt-1 truncate text-[10px] text-muted-foreground">{caption}</p></div></CardContent></Card>
        ))}
        <Card className={`crm-card ${metricCardTones.violet}`}><CardContent className="flex min-h-24 items-center gap-3 p-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300"><ListChecks className="h-5 w-5" /></span><div><p className="text-[10px] text-muted-foreground">Open Tasks</p><p className="mt-1 text-lg font-bold text-foreground">{summary.openTasks}</p><button type="button" onClick={onViewTasks} className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-blue-600">View Tasks<ChevronRight className="h-3.5 w-3.5" /></button></div></CardContent></Card>
      </div>
    </>
  );
}
