/* eslint-disable react/prop-types */
import { CalendarDays, ChevronDown, Loader2, UsersRound } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@components/components/ui/avatar';
import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/components/ui/dropdown-menu';
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
  bookingCode,
  daysRemaining,
  eventDateLabel,
  getKeyPendingItems,
  getOnboardingProgress,
  initials,
  planningStage,
  planningStageStep,
  planningViewStage,
  readinessPercentage,
  stageClass,
} from '../eventBookingDashboard.utils';
import {
  ExecutionReadinessProgress,
  FinalPending,
  KeyPending,
  OnboardingProgress,
  PaymentProgress,
  PlanningProgress,
  Readiness,
} from './EventBookingProgress';

export default function BookingTable({
  bookings,
  isNewBookingView,
  isPlanningView,
  isExecutionReadyView,
  openBooking,
  openEventOverview,
  openPlanning,
  openBookingSetup,
  markingReadyId,
  onMarkReady,
  onUpdateStatus,
}) {
  const headings = isNewBookingView
    ? ['Booking / Client', 'Event Details', 'Event Manager', 'Event Date', 'Onboarding', 'Payment Progress', 'Action']
    : isPlanningView
      ? ['Booking / Client', 'Event Details', 'Event Manager', 'Event Date', 'Planning Stage', 'Progress', 'Key Pending', 'Payment Progress', 'Action']
      : isExecutionReadyView
        ? ['Booking / Client', 'Event Details', 'Event Manager', 'Event Date', 'Readiness', 'Final Pending', 'Payment', 'Action']
        : ['Booking / Client', 'Event Details', 'Event Manager', 'Event Date', 'Planning Stage', 'Readiness', 'Payment Progress', 'Action'];

  return (
    <div className="event-booking-table-fit w-full min-w-0 max-w-full overflow-x-auto rounded-lg border border-border">
      <Table className={`w-full table-fixed text-xs ${(isPlanningView || isExecutionReadyView) ? 'min-w-[1180px]' : ''}`}>
        {isNewBookingView ? (
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[16%]" />
            <col className="w-[14%]" />
            <col className="w-[12%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[13%]" />
          </colgroup>
        ) : isPlanningView ? (
          <colgroup>
            <col className="w-[11%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[11%]" />
            <col className="w-[12%]" />
            <col className="w-[9%]" />
            <col className="w-[11%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
          </colgroup>
        ) : isExecutionReadyView ? (
          <colgroup>
            <col className="w-[13%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[14%]" />
            <col className="w-[11%]" />
            <col className="w-[12%]" />
          </colgroup>
        ) : (
          <colgroup>
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[15%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[12%]" />
            <col className="w-[11%]" />
            <col className="w-[12%]" />
          </colgroup>
        )}
        <TableHeader className="bg-muted/60">
          <TableRow className="h-11 border-b border-border bg-muted/60 hover:bg-muted/60">
            {headings.map((heading) => (
              <TableHead key={heading} scope="col" className={`${heading === 'Action' ? 'text-center' : 'text-left'} h-11 whitespace-nowrap px-3 text-[11px] font-bold leading-none tracking-[0.01em] text-foreground first:pl-4 last:pr-4`}>{heading}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length ? bookings.map((booking) => {
            const manager = booking.assignedManager;
            const stage = isPlanningView ? planningViewStage(booking) : planningStage(booking);
            const stageStep = planningStageStep(stage);
            const onboarding = getOnboardingProgress(booking);
            const requiresSetup = booking.isCrmOnly || booking.onboardingStatus === 'Pending';
            const executionPercentage = readinessPercentage(booking);
            const canMarkReady = isExecutionReadyView
              && !booking.executionReadiness?.isReady
              && executionPercentage === 100
              && getKeyPendingItems(booking).length === 0
              && !booking.isCrmOnly;
            const teamCount = Math.max(0, (booking.assignedTeam?.length || 0) - (manager ? 1 : 0));
            const primaryActionLabel = isNewBookingView
              ? !onboarding.hasManager
                ? 'Assign Manager'
                : onboarding.completed === onboarding.total
                  ? 'Move to Planning'
                  : 'Continue Setup'
              : isPlanningView
                ? 'Open Planning'
              : isExecutionReadyView
                ? canMarkReady ? 'Mark Ready' : 'Open Readiness'
              : requiresSetup
                ? 'Continue Setup'
              : booking.bookingStatus === 'Completed'
                ? 'View Booking'
                : 'Open Booking';
            const handlePrimaryAction = () => {
              if (canMarkReady) {
                onMarkReady(booking);
                return;
              }
              if (isPlanningView) {
                openPlanning(booking);
                return;
              }
              if (requiresSetup) openBookingSetup(booking);
              else openBooking(booking);
            };
            const remainingLabel = daysRemaining(booking);
            return (
              <TableRow key={booking._id} className="text-xs">
                <TableCell className="min-w-0 p-2">
                  <button type="button" onClick={() => openEventOverview(booking)} className="flex w-full min-w-0 items-center gap-2.5 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                    <Avatar className="h-9 w-9 shrink-0 border border-violet-100"><AvatarImage src={avatarUrl(booking.customer)} /><AvatarFallback className="bg-violet-50 text-xs text-violet-700">{initials(booking.customer?.name || booking.eventName)}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold hover:text-blue-600">{booking.customer?.name || booking.eventName || 'Unknown client'}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{bookingCode(booking)}</p>
                      <Badge variant="outline" className={`mt-1 h-4 rounded px-1.5 text-[9px] ${booking.bookingStatus === 'Cancelled' ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                        {booking.bookingStatus === 'Cancelled'
                          ? 'On Hold'
                          : booking.bookingStatus === 'Completed'
                            ? 'Completed'
                            : (isPlanningView || isExecutionReadyView) ? 'Confirmed' : 'Active'}
                      </Badge>
                    </div>
                  </button>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <p className="truncate font-semibold">{booking.eventType || booking.eventName || '-'}</p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">{booking.venue || 'Venue pending'}{booking.city ? `, ${booking.city}` : ''}</p>
                  <p className="mt-1 flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground"><CalendarDays className="h-3 w-3 shrink-0" /><span className="truncate">{eventDateLabel(booking)} <span aria-hidden="true">·</span> {booking.noOfFunctions || booking.functions?.length || 0} Functions</span></p>
                  <p className="mt-1 flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground"><UsersRound className="h-3 w-3 shrink-0" /><span className="truncate">{booking.guestCount || 0} Guests</span></p>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="h-8 w-8 shrink-0"><AvatarImage src={avatarUrl(manager)} /><AvatarFallback className="bg-slate-900 text-[10px] text-white">{initials(manager?.name || 'Unassigned')}</AvatarFallback></Avatar>
                    <div className="min-w-0"><p className="truncate font-semibold">{manager?.name || 'Unassigned'}</p><p className="truncate text-[10px] text-muted-foreground">{manager?.designation || 'Event Manager'}</p></div>
                    {teamCount ? <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full border text-[9px]">+{teamCount}</span> : null}
                  </div>
                </TableCell>
                <TableCell className="min-w-0 p-2">
                  <p className="truncate font-semibold">{eventDateLabel(booking)}</p>
                  {remainingLabel ? <p className={`mt-1 truncate text-[10px] ${booking.bookingStatus === 'Completed' ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>{remainingLabel}</p> : null}
                </TableCell>
                {isNewBookingView ? (
                  <TableCell className="min-w-0 align-top px-3 py-2"><OnboardingProgress booking={booking} /></TableCell>
                ) : isPlanningView ? (
                  <>
                    <TableCell className="min-w-0 p-2">
                      <Badge variant="outline" title={stage} className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] ${stageClass(stage)}`}>{stage}</Badge>
                      <p className="mt-1 truncate text-[9px] text-muted-foreground">Stage {stageStep} of 5</p>
                    </TableCell>
                    <TableCell className="min-w-0 align-top p-2"><PlanningProgress booking={booking} /></TableCell>
                    <TableCell className="min-w-0 align-top p-2"><KeyPending booking={booking} /></TableCell>
                  </>
                ) : isExecutionReadyView ? (
                  <>
                    <TableCell className="min-w-0 align-top p-2"><ExecutionReadinessProgress booking={booking} /></TableCell>
                    <TableCell className="min-w-0 align-top p-2"><FinalPending booking={booking} /></TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="min-w-0 p-2"><Badge variant="outline" title={stage} className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] ${stageClass(stage)}`}>{stage}</Badge></TableCell>
                    <TableCell className="min-w-0 p-2"><Readiness booking={booking} /></TableCell>
                  </>
                )}
                <TableCell className={`min-w-0 align-top py-2 ${isNewBookingView ? 'px-3' : 'px-2'}`}><PaymentProgress booking={booking} /></TableCell>
                <TableCell className="min-w-0 p-2">
                  {canMarkReady ? (
                    <div className="flex justify-end">
                      <Button variant="outline" className="h-8 min-w-[92px] whitespace-nowrap rounded-r-none border-border bg-transparent px-2 text-[10px] font-semibold text-blue-700 hover:bg-muted/50 hover:text-blue-800 disabled:bg-transparent dark:text-blue-300 dark:hover:text-blue-200" disabled={String(markingReadyId || '') === String(booking._id)} onClick={handlePrimaryAction}>
                        {String(markingReadyId || '') === String(booking._id) ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                        {primaryActionLabel}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 rounded-l-none border-l-0 border-border bg-transparent text-blue-700 hover:bg-muted/50 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200" aria-label="More booking actions"><ChevronDown className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openBooking(booking)}>Open booking</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onUpdateStatus(booking)}>Update event stage</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <Button variant="outline" className="h-8 min-w-[92px] whitespace-nowrap rounded-r-none border-border bg-transparent px-2 text-[10px] font-semibold text-blue-700 hover:bg-muted/50 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200" onClick={handlePrimaryAction}>{primaryActionLabel}</Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 rounded-l-none border-l-0 border-border bg-transparent text-blue-700 hover:bg-muted/50 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200" aria-label="More booking actions"><ChevronDown className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {requiresSetup ? (
                          <>
                            <DropdownMenuItem onSelect={() => openBookingSetup(booking)}>Continue booking setup</DropdownMenuItem>
                            {booking.isCrmOnly ? <DropdownMenuItem onSelect={() => openBooking(booking)}>Open client details</DropdownMenuItem> : null}
                          </>
                        ) : <DropdownMenuItem onSelect={() => openBooking(booking)}>Open booking</DropdownMenuItem>}
                        {!booking.isCrmOnly ? <DropdownMenuItem onSelect={() => onUpdateStatus(booking)}>Update event stage</DropdownMenuItem> : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          }) : (
            <TableRow><TableCell colSpan={headings.length} className="h-40 text-center"><CalendarDays className="mx-auto mb-2 h-7 w-7 text-muted-foreground" /><p className="text-sm font-medium">No bookings found</p><p className="mt-1 text-xs text-muted-foreground">Try another month, tab or filter.</p></TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
