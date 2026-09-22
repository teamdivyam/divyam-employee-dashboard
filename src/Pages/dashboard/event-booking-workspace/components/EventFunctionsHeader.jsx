/* eslint-disable react/prop-types */
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  Hourglass,
  ImageIcon,
  MapPin,
  MoreVertical,
  UsersRound,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@components/components/ui/avatar';
import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@components/components/ui/dropdown-menu';
import { avatarUrl, bookingCode, initials } from '../eventBookingDashboard.utils';
import { getBookingStatus } from '../eventRecordAdapters';

const compactDate = (date) => {
  if (!date) return '-';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(parsed);
};

const eventDateRange = (booking) => {
  const dates = (booking.functions || []).map((item) => new Date(item.fromDate || item.date)).filter((date) => !Number.isNaN(date.getTime())).sort((a, b) => a - b);
  if (!dates.length) return compactDate(booking.eventDate);
  if (dates.length === 1 || dates[0].toDateString() === dates.at(-1).toDateString()) return compactDate(dates[0]);
  return `${compactDate(dates[0])} – ${compactDate(dates.at(-1))}`;
};

const metricTones = {
  violet: 'bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300',
  cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-300',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-400/10 dark:text-purple-300',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300',
  rose: 'bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300',
};

export default function EventFunctionsHeader({ booking, metrics = {}, metricItems: suppliedMetricItems, onBack, onEdit, onMarkReady, onOpenPlanning, primaryActionLabel = 'Open Planning', showMetrics = true, compactMetrics = false }) {
  const clientName = booking.customer?.name || booking.eventName || 'Event Booking';
  const defaultMetricItems = [
    { label: 'Functions', value: metrics.functions, caption: metrics.functionsCaption || 'Confirmed', icon: CalendarDays, tone: 'violet' },
    { label: 'Services', value: metrics.services, caption: metrics.servicesCaption || 'Planned', icon: ClipboardList, tone: 'blue' },
    { label: 'Peak Guests', value: metrics.peakGuests, caption: 'Max on any day', icon: UsersRound, tone: 'cyan' },
    { label: 'Final Preferences', value: metrics.preferences, caption: 'Finalised', icon: ImageIcon, tone: 'purple' },
    { label: 'Approvals Pending', value: metrics.approvals, caption: 'Awaiting client', icon: Hourglass, tone: 'amber' },
  ];
  const metricItems = suppliedMetricItems || defaultMetricItems;

  return (
    <>
      <div className="flex flex-col gap-3 pb-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-14 w-14 rounded-lg border border-violet-100"><AvatarImage src={avatarUrl(booking.customer)} /><AvatarFallback className="rounded-lg bg-violet-50 text-lg font-semibold text-violet-700">{initials(clientName)}</AvatarFallback></Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5"><h1 className="truncate text-xl font-bold text-foreground">{clientName}</h1><Badge className="border-0 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">{getBookingStatus(booking)}</Badge></div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
              <span>{bookingCode(booking)}</span><span>•</span><span>{booking.eventType || '-'}</span><span>•</span><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{eventDateRange(booking)}</span><span>•</span><span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{[booking.venue, booking.city].filter(Boolean).join(', ') || '-'}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button className="h-9 gap-2 px-4" variant="custom" onClick={onOpenPlanning}><FileCheck2 className="h-4 w-4" />{primaryActionLabel}<ChevronRight className="h-4 w-4" /></Button>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="h-9 gap-2">More Actions<MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={onEdit}>Edit booking</DropdownMenuItem><DropdownMenuItem onSelect={onMarkReady}>Mark execution ready</DropdownMenuItem><DropdownMenuItem onSelect={onBack}>Back to bookings</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
      </div>

      {showMetrics ? <div className={`grid sm:grid-cols-2 xl:grid-cols-5 ${compactMetrics ? 'gap-2' : 'gap-3'}`}>
        {metricItems.map(({ label, value, caption, icon: Icon, tone }) => (
          <Card key={label} className="crm-card">
            <CardContent className={`flex items-center ${compactMetrics ? 'min-h-20 gap-2.5 p-3' : 'min-h-24 gap-3 p-4'}`}>
              <span className={`grid shrink-0 place-items-center rounded-full ${compactMetrics ? 'h-10 w-10' : 'h-11 w-11'} ${metricTones[tone] || metricTones.blue}`}>
                <Icon className={compactMetrics ? 'h-4.5 w-4.5' : 'h-5 w-5'} />
              </span>
              <div>
                <p className={`${compactMetrics ? 'text-lg' : 'text-xl'} font-bold text-foreground`}>{value}</p>
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className={`${compactMetrics ? 'mt-0.5' : 'mt-1'} text-[10px] text-muted-foreground`}>{caption}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div> : null}
    </>
  );
}
