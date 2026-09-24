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
      <Table className="w-full table-fixed text-xs">
        <colgroup>
          <col className="w-[19%]" />
          <col className="w-[15%]" />
          <col className="w-[12%]" />
          <col className="w-[11%]" />
          <col className="w-[11%]" />
          <col className="w-[11%]" />
          <col className="w-[12%]" />
          <col className="w-[9%]" />
        </colgroup>
        <TableHeader className="bg-muted/60">
          <TableRow className="h-11 border-b border-border bg-muted/60 hover:bg-muted/60">
            {['Booking / Client', 'Today’s Function(s)', 'Event Manager', 'Venue', 'Live Status', 'Next Milestone', 'Payment', 'Action'].map((heading) => (
              <TableHead key={heading} scope="col" className={`${heading === 'Action' || heading === 'Booking / Client' ? 'text-center' : 'text-left'} h-11 whitespace-nowrap px-3 text-[11px] font-bold leading-none tracking-[0.01em] text-foreground first:pl-4 last:pr-4`}>
                {heading}
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
              <TableRow key={booking._id} className="text-xs">
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
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{manager?.name || 'Unassigned'}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{teamCount ? `+${teamCount} Team` : manager?.designation || 'Event Manager'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <p className="truncate font-semibold">{currentFunction?.venue || booking.venue || 'Venue pending'}</p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">{currentFunction?.area || booking.city || ''}</p>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <Badge className={`h-5 border-0 px-2 text-[9px] shadow-none ${liveToneClass(liveDetails.tone)}`}>{liveDetails.label}</Badge>
                  <p className="mt-1 truncate text-[9px] text-muted-foreground">{liveDetails.detail}</p>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <p className="truncate font-semibold">{nextMilestone.label}</p>
                  {nextMilestone.time ? <p className="mt-1 truncate text-[10px] text-blue-600 dark:text-blue-400">{nextMilestone.time}</p> : null}
                </TableCell>
                <TableCell className="min-w-0 align-top p-2"><PaymentProgress booking={booking} /></TableCell>
                <TableCell className="min-w-0 p-2">
                  <div className="flex justify-end">
                    <Button variant="outline" className={`h-8 ${primaryAction === 'View' ? 'min-w-12' : 'min-w-[92px]'} whitespace-nowrap rounded-r-none border-border bg-transparent px-2 text-[10px] font-semibold text-blue-700 hover:bg-muted/50 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200`} onClick={() => requiresSetup ? openBookingSetup(booking) : openBooking(booking)}>
                      {primaryAction}
                    </Button>
                    <BookingActionsMenu booking={booking} openBooking={openBooking} openBookingEdit={openBookingEdit} openManagerAssignment={openManagerAssignment} openDocuments={openDocuments} openPayments={openPayments} openBookingSetup={openBookingSetup} onUpdateStatus={onUpdateStatus} />
                  </div>
                </TableCell>
              </TableRow>
            );
          }) : (
            <TableRow>
              <TableCell colSpan={8} className="h-40 text-center">
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
