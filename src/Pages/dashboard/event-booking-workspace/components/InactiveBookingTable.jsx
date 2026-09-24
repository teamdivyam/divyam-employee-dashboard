/* eslint-disable react/prop-types */
import { CalendarDays, Loader2, UsersRound } from 'lucide-react';

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
import { formatDate } from './EventBookingComponents';
import {
  avatarUrl,
  customerPhone,
  currencyAmount,
  eventDateLabel,
  inactiveBookingDetails,
  initials,
  settlementDetails,
} from '../eventBookingDashboard.utils';
import { BookingActionsMenu } from './BookingTable';

const statusClass = (isOnHold) => isOnHold
  ? 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300'
  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300';

const settlementTone = (status) => ({
  Complete: 'text-emerald-600 dark:text-emerald-400',
  'Refund Pending': 'text-amber-600 dark:text-amber-400',
  Outstanding: 'text-destructive',
  Pending: 'text-amber-600 dark:text-amber-400',
}[status] || 'text-muted-foreground');

export default function InactiveBookingTable({
  bookings,
  openBooking,
  openBookingEdit,
  openManagerAssignment,
  openDocuments,
  openPayments,
  openBookingSetup,
  openEventOverview,
  onResume,
  onUpdateStatus,
  resumingId,
}) {
  return (
    <div className="event-booking-table-fit w-full min-w-0 max-w-full overflow-x-auto">
      <Table className="w-full table-fixed text-xs">
        <colgroup>
          <col className="w-[11%]" />
          <col className="w-[12%]" />
          <col className="w-[13%]" />
          <col className="w-[10%]" />
          <col className="w-[7%]" />
          <col className="w-[11%]" />
          <col className="w-[14%]" />
          <col className="w-[10%]" />
          <col className="w-[12%]" />
        </colgroup>
        <TableHeader className="bg-muted/60">
          <TableRow className="h-11 border-b border-border bg-muted/60 hover:bg-muted/60">
            {['Booking / Client', 'Event Details', 'Event Manager', 'Event Date', 'Status', 'Last Planning State', 'Hold / Cancellation Details', 'Payment / Settlement', 'Action'].map((heading) => (
              <TableHead key={heading} scope="col" className={`${heading === 'Action' ? 'text-center' : 'text-left'} h-11 whitespace-nowrap px-3 text-[11px] font-bold leading-none tracking-[0.01em] text-foreground first:pl-4 last:pr-4`}>{heading}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length ? bookings.map((booking) => {
            const manager = booking.assignedManager;
            const inactive = inactiveBookingDetails(booking);
            const settlement = settlementDetails(booking);
            const teamCount = booking.assignedTeam?.length || 0;
            const primaryAction = inactive.isOnHold
              ? 'Resume Booking'
              : settlement.status === 'Complete' ? 'View Booking' : 'Open Settlement';
            const isResuming = String(resumingId || '') === String(booking._id);

            return (
              <TableRow key={booking._id} className="text-xs">
                <TableCell className="min-w-0 p-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar className="h-9 w-9 shrink-0 border border-orange-100">
                      <AvatarImage src={avatarUrl(booking.customer)} />
                      <AvatarFallback className="bg-orange-50 text-xs font-semibold text-orange-700">{initials(booking.customer?.name || booking.eventName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <button type="button" onClick={() => openEventOverview(booking)} className="block w-full truncate text-left font-semibold hover:text-blue-600">{booking.customer?.name || booking.eventName || 'Unknown client'}</button>
                      <p className="truncate text-[10px] text-muted-foreground">{customerPhone(booking)}</p>
                      <Badge variant="outline" className={`mt-1 h-4 rounded px-1.5 text-[9px] ${statusClass(inactive.isOnHold)}`}>{booking.bookingStatus}</Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <p className="truncate font-semibold">{booking.eventType || booking.eventName || 'Event'}</p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">{booking.venue || 'Venue pending'}{booking.city ? `, ${booking.city}` : ''}</p>
                  <p className="mt-1 flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground"><CalendarDays className="h-3 w-3 shrink-0" /><span className="truncate">{eventDateLabel(booking)} · {booking.functions?.length || booking.noOfFunctions || 0} Functions</span></p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><UsersRound className="h-3 w-3 shrink-0" /> {booking.guestCount || 0} Guests</p>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="h-8 w-8 shrink-0"><AvatarImage src={avatarUrl(manager)} /><AvatarFallback className="bg-slate-900 text-[10px] text-white">{initials(manager?.name || 'Unassigned')}</AvatarFallback></Avatar>
                    <div className="min-w-0"><p className="truncate font-semibold">{manager?.name || 'Unassigned'}</p><p className="truncate text-[10px] text-muted-foreground">{manager?.designation || 'Event Manager'}</p></div>
                    {teamCount ? <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full border text-[9px]">+{teamCount}</span> : null}
                  </div>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <p className="flex items-center gap-1 truncate font-semibold"><CalendarDays className="h-3.5 w-3.5 shrink-0" /> {eventDateLabel(booking)}</p>
                  <p className={`mt-1 truncate text-[10px] font-medium ${inactive.isOnHold ? 'text-blue-600 dark:text-blue-400' : 'text-destructive'}`}>{inactive.isOnHold ? 'Planning paused' : 'Cancelled'}</p>
                </TableCell>
                <TableCell className="p-2"><Badge variant="outline" className={`rounded-full px-2 py-1 text-[9px] ${statusClass(inactive.isOnHold)}`}>{booking.bookingStatus}</Badge></TableCell>
                <TableCell className="min-w-0 p-2">
                  <p className="truncate font-semibold">{inactive.planningStage}</p>
                  <p className="mt-1 text-[10px] font-medium">{inactive.readiness}% {inactive.isOnHold ? 'Ready' : 'at cancellation'}</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-orange-500" style={{ width: `${inactive.readiness}%` }} /></div>
                  <p className="mt-1 truncate text-[9px] text-muted-foreground">{inactive.pendingCount} critical pending</p>
                </TableCell>
                <TableCell className="min-w-0 p-2 text-[10px]">
                  <p><span className="font-semibold">{inactive.isOnHold ? 'Held On' : 'Cancelled On'}:</span> {formatDate(inactive.changedAt)}</p>
                  <p className="mt-1 flex gap-1"><span className="shrink-0 font-semibold">Reason:</span><span className="line-clamp-2">{inactive.reason}</span></p>
                  {inactive.isOnHold && inactive.expectedResumeDate ? <p className="mt-1 truncate"><span className="font-semibold">Expected Resume:</span> <span className="text-blue-600">{formatDate(inactive.expectedResumeDate)}</span></p> : null}
                  {!inactive.isOnHold ? <p className="mt-1 truncate"><span className="font-semibold">Cancelled By:</span> {inactive.changedBy}</p> : null}
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <p className={`truncate text-[11px] font-semibold ${settlementTone(settlement.status)}`}>{inactive.isOnHold ? `${settlement.clampedPercentage}% Paid` : settlement.status}</p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${settlement.status === 'Complete' ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${settlement.clampedPercentage}%` }} /></div>
                  <p className="mt-1 truncate text-[10px] font-semibold">{currencyAmount(settlement.pending)} Balance</p>
                  <p className="mt-1 truncate text-[9px] text-muted-foreground">{settlement.status === 'Complete' ? 'All financials settled' : settlement.dueLabel}</p>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <div className="flex w-full min-w-0 justify-end">
                    <Button variant="outline" className="h-8 min-w-[92px] whitespace-nowrap rounded-r-none border-border bg-transparent px-2 text-[10px] font-semibold text-blue-700 hover:bg-muted/50 hover:text-blue-800 disabled:bg-transparent dark:text-blue-300 dark:hover:text-blue-200" disabled={isResuming} onClick={() => inactive.isOnHold ? onResume(booking) : openEventOverview(booking)}>
                      {isResuming ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}{primaryAction}
                    </Button>
                    <BookingActionsMenu booking={booking} openBooking={openBooking} openBookingEdit={openBookingEdit} openManagerAssignment={openManagerAssignment} openDocuments={openDocuments} openPayments={openPayments} openBookingSetup={openBookingSetup} onUpdateStatus={onUpdateStatus} />
                  </div>
                </TableCell>
              </TableRow>
            );
          }) : (
            <TableRow><TableCell colSpan={9} className="h-40 text-center"><CalendarDays className="mx-auto mb-2 h-7 w-7 text-muted-foreground" /><p className="text-sm font-medium">No on-hold or cancelled bookings found</p><p className="mt-1 text-xs text-muted-foreground">Try another date range or status filter.</p></TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
