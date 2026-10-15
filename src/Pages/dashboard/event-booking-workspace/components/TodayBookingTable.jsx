/* eslint-disable react/prop-types */
import { CalendarDays, Clock3 } from 'lucide-react';

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
  functionTimeLabel,
  getLiveDetails,
  getNextMilestone,
  initials,
  liveToneClass,
} from '../eventBookingDashboard.utils';
import { PaymentProgress } from './EventBookingProgress';
import { BookingActionsMenu, BookingClientCell } from './BookingTable';
import { StatusBadge } from './EventBookingComponents';

export default function TodayBookingTable({
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
      <Table className="w-full max-w-full table-fixed text-[11px] [&_thead_th]:!px-2 [&_tbody_td]:!px-2 [&_thead_th:first-child]:!pl-4 [&_tbody_td:first-child]:!pl-4 [&_thead_th:last-child]:!pr-4 [&_tbody_td:last-child]:!pr-4">
        <colgroup>
          <col style={{ width: '14.5%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '11.5%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '11.5%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '7.5%' }} />
        </colgroup>
        <TableHeader className="bg-muted/60">
          <TableRow className="h-11 border-b border-border bg-muted/60 hover:bg-muted/60">
            {['Booking / Client', 'Today’s Function(s)', 'Event Manager', 'Venue', 'Planning Stage', 'Live Status', 'Next Milestone', 'Payment', 'Action'].map((heading) => (
              <TableHead
                key={heading}
                scope="col"
                className={`h-11 whitespace-nowrap px-2 text-[11px] font-bold leading-none tracking-[0.01em] text-foreground first:pl-4 last:pr-4 ${
                  heading === 'Planning Stage' || heading === 'Live Status' || heading === 'Payment' || heading === 'Action'
                    ? 'text-center'
                    : 'text-left'
                }`}
              >
                {heading === 'Booking / Client' ? (
                  <span className="pl-[46px]">Booking / Client</span>
                ) : heading === 'Event Manager' ? (
                  <span className="pl-10">Event Manager</span>
                ) : heading === 'Payment' ? (
                  <span className="inline-block -translate-x-3.5">Payment</span>
                ) : (
                  heading
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length ? bookings.map((booking) => {
            const manager = booking.assignedManager;
            const liveDetails = getLiveDetails(booking);
            const currentFunction = liveDetails.currentFunction;
            const nextMilestone = getNextMilestone(booking, liveDetails);
            const teamCount = booking.assignedTeam?.length || 0;
            const requiresSetup = booking.isCrmOnly || booking.onboardingStatus === 'Pending';
            const primaryAction = requiresSetup
              ? 'Continue Setup'
              : booking.bookingStatus === 'Completed'
                ? 'View Booking'
                : 'View';

            return (
              <TableRow key={booking._id} className="text-[11px]">
                <BookingClientCell booking={booking} onOpen={openEventOverview} />
                <TableCell className="min-w-0 p-2">
                  <p className="truncate font-semibold">{currentFunction?.name || booking.eventType || 'Event'}</p>
                  <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                    <Clock3 className="h-3 w-3 shrink-0" /> {functionTimeLabel(currentFunction)}
                  </p>
                  {liveDetails.functions.length > 1 ? (
                    <p className="mt-1 truncate text-[9px] text-blue-600 dark:text-blue-400">
                      {liveDetails.functions.length} functions scheduled today
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={avatarUrl(manager)} />
                      <AvatarFallback className="bg-slate-900 text-[10px] text-white">{initials(manager?.name || 'Unassigned')}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight line-clamp-2 break-words">{manager?.name || 'Unassigned'}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{manager?.designation || 'Event Manager'}</p>
                    </div>
                    {teamCount ? <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full border text-[9px]">+{teamCount}</span> : null}
                  </div>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <p className="font-semibold leading-tight line-clamp-2 break-words">{currentFunction?.venue || booking.venue || 'Venue pending'}</p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">{currentFunction?.area || booking.city || ''}</p>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <div className="flex justify-center">
                    <StatusBadge status={booking.bookingStatus} />
                  </div>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <div className="flex flex-col items-center justify-center">
                    <Badge className={`h-5 border-0 px-2 text-[9px] shadow-none ${liveToneClass(liveDetails.tone)}`}>{liveDetails.label}</Badge>
                    {liveDetails.detail ? (
                      <p className="mt-1 truncate text-[9px] text-muted-foreground">{liveDetails.detail}</p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <p className="truncate font-semibold">{nextMilestone.label}</p>
                  {nextMilestone.time ? <p className="mt-1 truncate text-[10px] text-blue-600 dark:text-blue-400">{nextMilestone.time}</p> : null}
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <div className="flex justify-center pr-4">
                    <div className="w-full max-w-[124px]">
                      <PaymentProgress booking={booking} />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <div className="flex items-center justify-center">
                    <Button variant="outline" className={`h-7 ${primaryAction === 'View' ? 'min-w-11 px-2.5' : 'min-w-[92px] px-2'} whitespace-nowrap rounded-r-none border-border bg-transparent text-[10px] font-semibold text-blue-700 hover:bg-muted/50 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200`} onClick={() => requiresSetup ? openBookingSetup(booking) : openBooking(booking)}>
                      {primaryAction}
                    </Button>
                    <BookingActionsMenu booking={booking} openBooking={openBooking} openBookingEdit={openBookingEdit} openManagerAssignment={openManagerAssignment} openDocuments={openDocuments} openPayments={openPayments} openBookingSetup={openBookingSetup} onUpdateStatus={onUpdateStatus} />
                  </div>
                </TableCell>
              </TableRow>
            );
          }) : (
            <TableRow>
              <TableCell colSpan={9} className="h-40 text-center">
                <CalendarDays className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
                <p className="text-sm font-medium">No live events found</p>
                <p className="mt-1 text-xs text-muted-foreground">There are no events matching today’s live filters.</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
