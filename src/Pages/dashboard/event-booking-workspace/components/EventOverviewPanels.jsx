/* eslint-disable react/prop-types */
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardCheck, Clock3, ExternalLink, Handshake, PackageCheck, FileText, IndianRupee, MapPin, Pencil, UsersRound, UserRound } from 'lucide-react';
import { dateRangeLabel, sortFunctionsByFromDate } from '../eventFunction.utils';
import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './EventTable';
import { currencyAmount, eventDateLabel } from '../eventBookingDashboard.utils';
import { linkedServiceFunctions, overviewDate, overviewTime } from '../eventOverview.utils';

const successTone = 'border-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300';
const pendingTone = 'border-0 bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300';
const readinessIcons = {
  'Client Approvals': { icon: UsersRound, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300' },
  'Vendor Readiness': { icon: Handshake, tone: 'bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300' },
  'Inventory Readiness': { icon: PackageCheck, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300' },
  'Checklist Readiness': { icon: ClipboardCheck, tone: 'bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300' },
};

function OverviewStatus({ status }) {
  const complete = ['Confirmed', 'Approved', 'Finalised', 'Finalized', 'Completed', 'Paid', 'Received'].includes(status);
  return <Badge variant="outline" className={`whitespace-nowrap rounded px-2 py-0.5 text-[10px] ${complete ? successTone : status ? pendingTone : 'text-muted-foreground'}`}>{status || 'Not set'}</Badge>;
}

function OverviewCard({ title, action, onAction, children }) {
  return <Card className="min-w-0 overflow-hidden rounded-lg border-border bg-card shadow-sm"><CardContent className="p-3"><div className="mb-2 flex min-h-7 items-center justify-between gap-2 border-b border-border pb-2"><h2 className="text-sm font-semibold text-foreground">{title}</h2>{action && <Button variant="ghost" size="sm" className="h-6 gap-1 px-1 text-[11px] text-primary" onClick={onAction}>{action}{action === 'Edit' ? <Pencil className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}</Button>}</div>{children}</CardContent></Card>;
}

const SnapshotRow = ({ icon: Icon, label, children }) => <div className="grid grid-cols-[14px_92px_minmax(0,1fr)] items-start gap-2 text-[11px]"><Icon className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">{label}</span><div className="min-w-0 break-words font-medium text-foreground">{children ?? '-'}</div></div>;

function OverviewTable({ headings, rows, renderRow, empty }) {
  return <Table className="text-[11px] [&_th]:h-8 [&_th]:whitespace-nowrap [&_th]:px-2 [&_td]:px-2 [&_td]:py-2"><TableHeader><TableRow className="bg-muted/60 hover:bg-muted/60">{headings.map((heading) => <TableHead key={heading}>{heading}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.length ? rows.map(renderRow) : <TableRow><TableCell colSpan={headings.length} className="h-24 text-center text-muted-foreground">{empty}</TableCell></TableRow>}</TableBody></Table>;
}

function ProgressBar({ value }) {
  return <div role="progressbar" aria-label="Readiness" aria-valuenow={value ?? 0} aria-valuemin={0} aria-valuemax={100} className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${value === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${value ?? 0}%` }} /></div>;
}

export function BookingSnapshot({ booking, details, onEdit }) {
  return <OverviewCard title="Booking Snapshot" action="Edit" onAction={onEdit}><div className="grid gap-4 md:grid-cols-2 md:divide-x md:divide-border"><div className="space-y-2.5">
    <SnapshotRow icon={CalendarDays} label="Event Type">{booking.eventType}</SnapshotRow>
    <SnapshotRow icon={CalendarDays} label="Event Dates">{eventDateLabel(booking, { includeWeekday: true })}</SnapshotRow>
    <SnapshotRow icon={MapPin} label="Venue">{[booking.venue, booking.city].filter(Boolean).join(', ') || '-'}</SnapshotRow>
    <SnapshotRow icon={UsersRound} label="Estimated Guests">{booking.guestCount ?? '-'}</SnapshotRow>
    <SnapshotRow icon={UsersRound} label="Peak Guests">{details.peakGuests}</SnapshotRow>
    <SnapshotRow icon={ClipboardCheck} label="Booking Status"><OverviewStatus status={booking.bookingStatus} /></SnapshotRow>
  </div><div className="space-y-2.5 md:pl-4">
    <SnapshotRow icon={ClipboardCheck} label="Functions">{booking.functions?.length ?? booking.noOfFunctions ?? 0}</SnapshotRow>
    <SnapshotRow icon={FileText} label="Final Proposal">{details.proposal?.fileUrl ? <a href={details.proposal.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 text-primary underline">View Proposal<ExternalLink className="h-3 w-3 shrink-0" /></a> : 'Not available'}</SnapshotRow>
    <SnapshotRow icon={IndianRupee} label="Booking Value">{currencyAmount(details.total)}</SnapshotRow>
    <SnapshotRow icon={Clock3} label="Created On">{overviewDate(booking.createdAt, true)}</SnapshotRow>
    <SnapshotRow icon={UserRound} label="Created By">{booking.createdBy?.name || booking.createdByName || '-'}</SnapshotRow>
  </div></div></OverviewCard>;
}

export function ReadinessPlanning({ booking, summary, details, onView }) {
  const readiness = Math.max(0, Math.min(100, Number(summary.readiness) || 0));
  return <OverviewCard title="Readiness & Planning" action="View All" onAction={onView}>
    <div className="mb-3 flex items-center gap-3 border-b border-border pb-3"><div className="relative h-16 w-16 shrink-0"><svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden="true"><circle cx="32" cy="32" r="27" fill="none" strokeWidth="6" className="stroke-muted" /><circle cx="32" cy="32" r="27" fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-primary" strokeDasharray={`${readiness * 1.696} 169.6`} /></svg><span className="absolute inset-0 grid place-items-center text-sm font-semibold">{readiness}%</span></div><div className="min-w-0 flex-1"><p className="text-xs font-semibold">Overall Planning Readiness</p><p className="my-1 text-[10px] text-primary">{readiness === 100 ? 'Ready' : readiness >= 80 ? 'Mostly on track' : 'Needs attention'}</p><ProgressBar value={readiness} /></div></div>
    <div className="space-y-2.5">{details.readinessRows.map((item) => { const { icon: Icon, tone } = readinessIcons[item.label] || { icon: ClipboardCheck, tone: 'bg-muted text-muted-foreground' }; return <div key={item.label} className="grid grid-cols-[minmax(120px,1.1fr)_30px_minmax(25px,1fr)_auto] items-center gap-2 text-[10px]"><span className="flex min-w-0 items-center gap-2 text-muted-foreground"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded ${tone}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" /></span><span>{item.label}</span></span><span className="font-semibold">{item.percentage == null ? '-' : `${item.percentage}%`}</span><ProgressBar value={item.percentage} /><Badge variant="outline" className={`rounded px-1.5 text-[9px] ${!item.total ? 'text-muted-foreground' : item.pending ? pendingTone : successTone}`}>{!item.total ? 'Not started' : item.pending ? `${item.pending} pending` : 'Complete'}</Badge></div>; })}</div>
    {booking.executionReadiness?.remarks && <p className="mt-3 text-[10px] text-muted-foreground">{booking.executionReadiness.remarks}</p>}
  </OverviewCard>;
}

export function FunctionsOverview({ details, onView }) {
  return <OverviewCard title="Functions Overview" action="View Event Plan" onAction={onView}><OverviewTable headings={['#', 'Function', 'Date', 'Start Time', 'End Time', 'Est. Guests', 'Status']} rows={sortFunctionsByFromDate(details.functions)} empty="No functions added yet." renderRow={(item, index) => <TableRow key={item._id || index}><TableCell>{index + 1}</TableCell><TableCell className="font-semibold">{item.name || '-'}</TableCell><TableCell className="whitespace-nowrap">{dateRangeLabel(item.fromDate ?? item.date, item.toDate)}</TableCell><TableCell className="whitespace-nowrap">{overviewTime(item.startTime)}</TableCell><TableCell className="whitespace-nowrap">{overviewTime(item.endTime)}</TableCell><TableCell>{item.guestCount ?? '-'}</TableCell><TableCell><OverviewStatus status={item.status} /></TableCell></TableRow>} /></OverviewCard>;
}

export function ServicesOverview({ details, onView }) {
  return <OverviewCard title="Services Overview" action="View Services" onAction={onView}><OverviewTable headings={['#', 'Service', 'Required For (Function)', 'Service Date(s)', 'Planning Status']} rows={details.services} empty="No services selected yet." renderRow={(item, index) => { const functions = linkedServiceFunctions(item, details.functions); const dates = [...new Set(functions.flatMap((fn) => [fn.fromDate || fn.date, fn.toDate]).filter(Boolean))].sort(); const dateLabel = dates.length > 1 ? `${overviewDate(dates[0])} – ${overviewDate(dates.at(-1))}` : overviewDate(dates[0]); return <TableRow key={item._id || index}><TableCell>{index + 1}</TableCell><TableCell className="font-semibold">{item.name || item.service || '-'}</TableCell><TableCell>{functions.map((fn) => fn.name).join(', ') || 'Not linked'}</TableCell><TableCell>{dateLabel}</TableCell><TableCell><OverviewStatus status={item.status} /></TableCell></TableRow>; }} /></OverviewCard>;
}

export function PaymentSummary({ details }) {
  return <OverviewCard title="Payment Summary"><div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-4">{[['Total Booking Value', details.total, 'text-foreground'], ['Amount Received', details.received, 'text-emerald-600 dark:text-emerald-400'], ['Outstanding', details.pending, 'text-destructive']].map(([label, amount, tone]) => <div key={label}><p className="mb-1 text-[10px] text-muted-foreground">{label}</p><p className={`text-sm font-semibold ${tone}`}>{currencyAmount(amount)}</p></div>)}<div className={`flex items-center justify-center gap-1.5 rounded-md p-2 text-xs font-semibold ${details.percentage === 100 ? successTone : pendingTone}`}><CheckCircle2 className="h-4 w-4 shrink-0" />{details.percentage}% Paid</div></div></OverviewCard>;
}

export function PaymentHistory({ details, onView }) {
  return <OverviewCard title="Payment History" action="View All" onAction={onView}><OverviewTable headings={['#', 'Payment Date', 'Amount', 'Payment Mode', 'Status', 'Reference']} rows={details.history.slice(0, 5)} empty="No payments recorded yet." renderRow={(item, index) => <TableRow key={item._id || index}><TableCell>{index + 1}</TableCell><TableCell className="whitespace-nowrap">{overviewDate(item.transactionDate || item.paymentDate || item.paidOn || item.createdAt)}</TableCell><TableCell className="font-semibold">{currencyAmount(item.amount)}</TableCell><TableCell>{item.paymentMode || '-'}</TableCell><TableCell><OverviewStatus status={item.status} /></TableCell><TableCell>{item.transactionId || item.reference || item.receiptNumber || '-'}</TableCell></TableRow>} /></OverviewCard>;
}
