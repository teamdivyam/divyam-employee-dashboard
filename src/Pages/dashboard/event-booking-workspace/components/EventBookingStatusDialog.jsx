/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { CalendarClock, Loader2, LockKeyhole } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/components/ui/select';
import { Textarea } from '@components/components/ui/textarea';
import { bookingStatuses } from './EventBookingComponents';

const executionReadyStage = 'Execution Ready';
const activeStages = bookingStatuses.slice(0, 4);
const isExecutionReady = (booking) => Boolean(
  booking?.executionReadiness?.isReady && booking?.executionReadiness?.readyMarkedAt,
);

const initialValue = (booking, requestedStatus) => ({
  bookingStatus: requestedStatus && stageOptionsFor(booking).includes(requestedStatus)
    ? requestedStatus
    : isExecutionReady(booking)
      ? executionReadyStage
      : booking?.bookingStatus || 'Planning',
  reason: booking?.bookingStatus === 'On Hold'
    ? booking?.holdDetails?.reason || ''
    : booking?.cancellationDetails?.reason || '',
  expectedResumeDate: booking?.holdDetails?.expectedResumeDate?.slice?.(0, 10) || '',
  cancelledByType: booking?.cancellationDetails?.cancelledByType || 'Admin',
});

const stageOptionsFor = (booking) => {
  if (booking?.bookingStatus === 'Completed') return ['Completed'];
  if (booking?.bookingStatus === 'Cancelled') return ['Cancelled'];
  if (booking?.bookingStatus === 'On Hold') return ['On Hold', 'Cancelled'];
  if (isExecutionReady(booking)) {
    return [...activeStages, executionReadyStage, 'Completed', 'On Hold', 'Cancelled'];
  }
  return [...activeStages, executionReadyStage, 'On Hold', 'Cancelled'];
};

export default function EventBookingStatusDialog({
  booking,
  open,
  onOpenChange,
  onSubmit,
  onMarkExecutionReady,
  onRevokeExecutionReady,
  initialStatus,
  saving,
}) {
  const [value, setValue] = useState(() => initialValue(booking, initialStatus));

  useEffect(() => {
    if (open) setValue(initialValue(booking, initialStatus));
  }, [booking, initialStatus, open]);

  if (!booking) return null;

  const currentStage = initialValue(booking).bookingStatus;
  const blockers = booking.executionReadiness?.blockers || [];
  const setField = (field, nextValue) => setValue((current) => ({ ...current, [field]: nextValue }));
  const reasonRequired = ['On Hold', 'Cancelled'].includes(value.bookingStatus)
    && value.bookingStatus !== booking.bookingStatus;
  const submitDisabled = saving
    || value.bookingStatus === currentStage
    || (reasonRequired && !value.reason.trim());

  const handleSubmit = (event) => {
    event.preventDefault();
    if (value.bookingStatus === executionReadyStage) {
      onMarkExecutionReady(booking._id);
      return;
    }
    if (isExecutionReady(booking) && activeStages.includes(value.bookingStatus)) {
      onRevokeExecutionReady({
        eventId: booking._id,
        bookingStatus: value.bookingStatus,
        note: 'Returned to planning from the Update Stage dialog.',
      });
      return;
    }

    const payload = { bookingStatus: value.bookingStatus };
    if (value.bookingStatus === 'On Hold') {
      payload.holdDetails = {
        reason: value.reason.trim(),
        expectedResumeDate: value.expectedResumeDate || null,
      };
    }
    if (value.bookingStatus === 'Cancelled') {
      payload.cancellationDetails = {
        reason: value.reason.trim(),
        cancelledByType: value.cancelledByType,
      };
    }

    onSubmit({ eventId: booking._id, ...payload });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" /> Update Event Stage</DialogTitle>
          <DialogDescription>
            Move {booking.customer?.name || booking.eventName || 'this event'} through the controlled booking workflow. Payment progress is managed in Finance.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="event-booking-status">Event Stage</Label>
            <Select value={value.bookingStatus} onValueChange={(next) => setField('bookingStatus', next)}>
              <SelectTrigger id="event-booking-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                {stageOptionsFor(booking).map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    disabled={status === executionReadyStage && !isExecutionReady(booking) && blockers.length > 0}
                  >
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {blockers.length && !isExecutionReady(booking) ? (
              <div className="flex gap-2 rounded-md border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
                <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <p><span className="font-medium text-foreground">Execution Ready is locked.</span> {blockers.join(', ')}.</p>
              </div>
            ) : null}
            {value.bookingStatus === executionReadyStage ? (
              <p className="text-xs leading-5 text-muted-foreground">
                Final clearance is complete. Selecting a planning stage will revoke this clearance and record it in the timeline.
              </p>
            ) : null}
          </div>

          {reasonRequired ? (
            <div className="space-y-2">
              <Label htmlFor="event-status-reason">{value.bookingStatus === 'On Hold' ? 'Hold Reason' : 'Cancellation Reason'} *</Label>
              <Textarea id="event-status-reason" rows={3} maxLength={500} value={value.reason} onChange={(event) => setField('reason', event.target.value)} placeholder="Enter the reason for this stage change" />
            </div>
          ) : null}

          {value.bookingStatus === 'On Hold' && value.bookingStatus !== booking.bookingStatus ? (
            <div className="space-y-2">
              <Label htmlFor="event-resume-date">Expected Resume Date</Label>
              <Input id="event-resume-date" type="date" value={value.expectedResumeDate} onChange={(event) => setField('expectedResumeDate', event.target.value)} />
            </div>
          ) : null}

          {value.bookingStatus === 'Cancelled' && value.bookingStatus !== booking.bookingStatus ? (
            <div className="space-y-2">
              <Label htmlFor="event-cancelled-by">Cancelled By</Label>
              <Select value={value.cancelledByType} onValueChange={(next) => setField('cancelledByType', next)}>
                <SelectTrigger id="event-cancelled-by"><SelectValue /></SelectTrigger>
                <SelectContent>{['Client', 'Admin', 'System'].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={submitDisabled}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {value.bookingStatus === executionReadyStage
                ? 'Mark Execution Ready'
                : isExecutionReady(booking) && activeStages.includes(value.bookingStatus)
                  ? 'Return to Planning'
                  : 'Update Stage'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
