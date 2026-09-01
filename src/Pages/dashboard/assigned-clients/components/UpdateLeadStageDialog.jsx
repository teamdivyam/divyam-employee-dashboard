/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/components/ui/select';
import { Textarea } from '@components/components/ui/textarea';
import { clientBookingPendingReasons } from '../../../../validator/client.validator';

export default function UpdateLeadStageDialog({
  open,
  customer,
  saving,
  onOpenChange,
  onSubmit,
}) {
  const [bookingPendingReason, setBookingPendingReason] = useState('');
  const [bookingPendingNote, setBookingPendingNote] = useState('');

  useEffect(() => {
    if (open) {
      setBookingPendingReason(customer?.bookingPendingReason || '');
      setBookingPendingNote(customer?.bookingPendingNote || '');
    }
  }, [customer, open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!saving) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[440px]">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12 text-left">
          <DialogTitle className="text-base font-semibold">
            Mark as Booking Pending
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs leading-5">
            Record what must be completed before {customer?.name || 'this enquiry'} can be booked.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-5 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Pending For <span className="text-destructive">*</span>
            </label>
            <Select
              value={bookingPendingReason}
              onValueChange={setBookingPendingReason}
              disabled={saving}
            >
              <SelectTrigger className="h-10 text-xs">
                <SelectValue placeholder="Select pending reason" />
              </SelectTrigger>
              <SelectContent>
                {clientBookingPendingReasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Note (Optional)
            </label>
            <Textarea
              value={bookingPendingNote}
              onChange={(event) => setBookingPendingNote(event.target.value)}
              maxLength={500}
              disabled={saving}
              placeholder="Add the pending confirmation or action details"
              className="min-h-20 resize-none text-xs"
            />
          </div>

          <p className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] leading-5 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
            This is a manual stage and does not create the final booking.
          </p>
        </div>

        <DialogFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-4 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            disabled={!bookingPendingReason || saving}
            onClick={() =>
              onSubmit({
                status: 'Booking Pending',
                bookingPendingReason,
                bookingPendingNote: bookingPendingNote.trim(),
              })
            }
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {saving ? 'Updating...' : 'Mark Booking Pending'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
