/* eslint-disable react/prop-types */
import { CalendarDays, CheckCircle2, UsersRound } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@components/components/ui/avatar';
import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './EventTable';
import {
  avatarUrl,
  customerPhone,
  closureDetails,
  eventDateLabel,
  initials,
} from '../eventBookingDashboard.utils';
import { PaymentProgress } from './EventBookingProgress';
import { BookingActionsMenu } from './BookingTable';

export default function CompletedBookingTable({
  bookings,
  openBooking,
  openBookingEdit,
  openManagerAssignment,
  openDocuments,
  openPayments,
  openBookingSetup,
  openEventOverview,
  onUpdateStatus,
}) {
  return (
    <div className="event-booking-table-fit w-full min-w-0 max-w-full overflow-x-auto">
      <Table className="w-full table-fixed text-xs">
        <colgroup>
          <col className="w-[13%]" />
          <col className="w-[16%]" />
          <col className="w-[14%]" />
          <col className="w-[11%]" />
          <col className="w-[13%]" />
          <col className="w-[11%]" />
          <col className="w-[11%]" />
          <col className="w-[11%]" />
        </colgroup>
        <TableHeader className="bg-muted/60">
          <TableRow className="h-11 border-b border-border bg-muted/60 hover:bg-muted/60">
            {['Booking / Client', 'Event Details', 'Event Manager', 'Event Date', 'Closure Progress', 'Key Pending', 'Payment Progress', 'Action'].map((heading) => (
              <TableHead key={heading} scope="col" className={`${heading === 'Action' ? 'text-center' : 'text-left'} h-11 whitespace-nowrap px-3 text-[11px] font-bold leading-none tracking-[0.01em] text-foreground first:pl-4 last:pr-4`}>
                {heading}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length ? bookings.map((booking) => {
            const manager = booking.assignedManager;
            const closure = closureDetails(booking);
            const teamCount = booking.assignedTeam?.length || 0;
            const progressTone = closure.percentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400';
            const progressBarTone = closure.percentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500';

            return (
              <TableRow key={booking._id} className="text-xs">
                <TableCell className="min-w-0 p-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar className="h-9 w-9 shrink-0 border border-orange-100">
                      <AvatarImage src={avatarUrl(booking.customer)} />
                      <AvatarFallback className="bg-orange-50 text-xs font-semibold text-orange-700">{initials(booking.customer?.name || booking.eventName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <button type="button" onClick={() => openEventOverview(booking)} className="block w-full truncate text-left font-semibold hover:text-blue-600">
                        {booking.customer?.name || booking.eventName || 'Unknown client'}
                      </button>
                      <p className="truncate text-[10px] text-muted-foreground">{customerPhone(booking)}</p>
                      <Badge variant="outline" className="mt-1 h-4 rounded border-emerald-200 bg-emerald-50 px-1.5 text-[9px] text-emerald-700">Completed</Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <p className="truncate font-semibold">{booking.eventType || booking.eventName || 'Event'}</p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">{booking.venue || 'Venue pending'}{booking.city ? `, ${booking.city}` : ''}</p>
                  <p className="mt-1 flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    <span className="truncate">{eventDateLabel(booking)} · {booking.functions?.length || booking.noOfFunctions || 0} Function{(booking.functions?.length || booking.noOfFunctions) === 1 ? '' : 's'}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><UsersRound className="h-3 w-3 shrink-0" /> {booking.guestCount || 0} Guests</p>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={avatarUrl(manager)} />
                      <AvatarFallback className="bg-slate-900 text-[10px] text-white">{initials(manager?.name || 'Unassigned')}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{manager?.name || 'Unassigned'}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{manager?.designation || 'Event Manager'}</p>
                    </div>
                    {teamCount ? <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full border text-[9px]">+{teamCount}</span> : null}
                  </div>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <p className="flex items-center gap-1 truncate font-semibold"><CalendarDays className="h-3.5 w-3.5 shrink-0" /> {eventDateLabel(booking)}</p>
                  <p className="mt-1 truncate text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Event Completed</p>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <p className={`text-[11px] font-semibold ${progressTone}`}>{closure.completed} / {closure.total} Complete</p>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`Closure ${closure.percentage}% complete`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={closure.percentage}>
                    <div className={`h-full rounded-full ${progressBarTone}`} style={{ width: `${closure.percentage}%` }} />
                  </div>
                  <p className="mt-1.5 truncate text-[9px] text-muted-foreground">
                    {closure.pending.length ? `${closure.pending.length} closure item${closure.pending.length === 1 ? '' : 's'} pending` : 'All closure items completed'}
                  </p>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  {closure.pending.length ? (
                    <ul className="space-y-1 text-[10px] text-foreground">
                      {closure.pending.slice(0, 3).map((item) => (
                        <li key={item.label} className="flex min-w-0 items-start gap-1.5">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-500" />
                          <span className="line-clamp-1">{item.label}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> All complete</p>
                  )}
                </TableCell>
                <TableCell className="min-w-0 align-top p-2"><PaymentProgress booking={booking} /></TableCell>
                <TableCell className="min-w-0 p-2">
                  <div className="flex justify-end">
                    <Button variant="outline" className="h-8 min-w-[92px] whitespace-nowrap rounded-r-none border-border bg-transparent px-2 text-[10px] font-semibold text-blue-700 hover:bg-muted/50 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200" onClick={() => openEventOverview(booking)}>
                      {closure.pending.length ? 'Open Closure' : 'View Booking'}
                    </Button>
                    <BookingActionsMenu booking={booking} openBooking={openBooking} openBookingEdit={openBookingEdit} openManagerAssignment={openManagerAssignment} openDocuments={openDocuments} openPayments={openPayments} openBookingSetup={openBookingSetup} onUpdateStatus={onUpdateStatus} />
                  </div>
                </TableCell>
              </TableRow>
            );
          }) : (
            <TableRow>
              <TableCell colSpan={8} className="h-40 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
                <p className="text-sm font-medium">No completed bookings found</p>
                <p className="mt-1 text-xs text-muted-foreground">Try another reporting period or closure filter.</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
