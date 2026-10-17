/* eslint-disable react/prop-types */
import { CalendarDays, ClipboardList, Download, Mail, MessageCircle, PackagePlus, Phone, WalletCards } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@components/components/ui/avatar';
import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { avatarUrl, bookingCode, eventDateLabel, initials } from '../eventBookingDashboard.utils';

const phoneDetails = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return null;
  const localDigits = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return { digits: `91${localDigits}`, label: `+91 ${localDigits}` };
};

export default function EventBookingClientHeader({ booking, onAssignTask, onAllocateItem, onDownloadEvent, onRecordPayment }) {
  const clientName = booking.customer?.name || booking.eventName || 'Event Booking';
  const phone = phoneDetails(booking.customer?.phone ?? booking.customerPhone ?? booking.primaryMobile);
  const alternatePhone = phoneDetails(
    booking.customer?.alternatePhone ?? booking.alternateMobile ?? booking.alternatePhone,
  );
  const showAlternatePhone = alternatePhone && alternatePhone.digits !== phone?.digits;
  const gstIn = booking.gstIn?.trim() || booking.customer?.gstIn?.trim();
  return (
    <Card className="w-full shrink-0 rounded-lg border-border bg-card text-card-foreground shadow-sm">
      <CardContent className="flex flex-col gap-4 p-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="h-16 w-16 rounded-lg border border-violet-100"><AvatarImage src={avatarUrl(booking.customer)} /><AvatarFallback className="rounded-lg bg-violet-50 text-xl font-semibold text-violet-700">{initials(clientName)}</AvatarFallback></Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3"><h1 className="truncate text-xl font-bold text-foreground">{clientName}</h1><Badge className="border-0 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">{booking.bookingStatus || 'Status not set'}</Badge></div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"><span>{bookingCode(booking)}</span><span>•</span><span>{booking.eventType || '-'}</span><span>•</span><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{eventDateLabel(booking, { includeWeekday: true })}</span><span>•</span><span>{[booking.venue, booking.city].filter(Boolean).join(', ') || '-'}</span></div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              {phone && <>
                <a href={`tel:+${phone.digits}`} className="inline-flex items-center gap-1.5 rounded border border-border bg-card px-2 py-1 font-medium"><Phone className="h-3.5 w-3.5" />{phone.label}</a>
                {showAlternatePhone && <a href={`tel:+${alternatePhone.digits}`} aria-label={`Call alternate number ${alternatePhone.label}`} className="inline-flex items-center gap-1.5 rounded border border-border bg-card px-2 py-1 font-medium text-muted-foreground"><Phone className="h-3.5 w-3.5" /><span className="font-semibold text-foreground">Alt:</span>{alternatePhone.label}</a>}
                <Button asChild variant="outline" className="h-7 gap-1.5 px-2 text-[11px] text-primary"><a href={`tel:+${phone.digits}`}><Phone className="h-3.5 w-3.5" />Call</a></Button>
                <a href={`https://wa.me/${phone.digits}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2 py-1.5 font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>
              </>}
              {booking.customer?.email && <a href={`mailto:${booking.customer.email}`} className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="break-all">{booking.customer.email}</span></a>}
              {gstIn && <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-muted-foreground"><span className="font-medium">GSTIN:</span><span>{gstIn}</span></span>}
            </div>
          </div>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 border-border xl:border-l xl:pl-2">
          <Button type="button" variant="outline" className="h-9 gap-2 px-3 text-xs font-medium" onClick={onAssignTask}><ClipboardList size={14} aria-hidden="true" />Assign Task</Button>
          <Button type="button" variant="custom" className="h-9 gap-2 px-3 text-xs font-medium" onClick={onAllocateItem}><PackagePlus size={14} aria-hidden="true" />Allocate Item</Button>
          <Button type="button" variant="outline" className="h-9 gap-2 px-3 text-xs font-medium" onClick={onDownloadEvent}><Download size={14} aria-hidden="true" />Download Event</Button>
          <Button type="button" variant="custom" className="h-9 gap-2 px-3 text-xs font-medium" onClick={onRecordPayment}><WalletCards size={14} aria-hidden="true" />Record Payment</Button>
        </div>
      </CardContent>
    </Card>
  );
}
