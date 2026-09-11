/* eslint-disable react/prop-types */
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Flag,
  IndianRupee,
  MapPin,
  PackageCheck,
  UsersRound,
  Utensils,
} from 'lucide-react';

import { Badge } from '@components/components/ui/badge';
import { Card, CardContent } from '@components/components/ui/card';
import { currencyAmount, eventDateLabel } from '../eventBookingDashboard.utils';

const Ring = ({ value, tone = '#2563eb' }) => {
  const percentage = Math.max(0, Math.min(100, Number(value || 0)));
  return <div className="relative h-14 w-14 shrink-0"><div className="h-full w-full rounded-full" style={{ background: `conic-gradient(${tone} ${percentage * 3.6}deg, #e5e7eb 0deg)` }} /><div className="absolute inset-[5px] grid place-items-center rounded-full bg-card text-xs font-bold">{percentage}%</div></div>;
};

const SnapshotRow = ({ icon: Icon, label, value }) => <div className="grid grid-cols-[18px_105px_minmax(0,1fr)] items-start gap-2 text-xs"><Icon className="mt-0.5 h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">{label}</span><span className="font-medium text-foreground">{value || '-'}</span></div>;

export function BookingSnapshot({ booking, summary }) {
  return (
    <Card className="crm-card"><CardContent className="p-4"><h2 className="mb-4 text-sm font-bold">Booking Snapshot</h2><div className="grid gap-5 md:grid-cols-2 md:divide-x md:divide-border"><div className="space-y-4"><SnapshotRow icon={CalendarDays} label="Event Type" value={booking.eventType} /><SnapshotRow icon={CalendarDays} label="Event Dates" value={eventDateLabel(booking)} /><SnapshotRow icon={MapPin} label="Venue" value={[booking.venue, booking.city].filter(Boolean).join(', ')} /><SnapshotRow icon={UsersRound} label="Est. Guests" value={summary.guestRange} /></div><div className="space-y-4 md:pl-5"><SnapshotRow icon={ClipboardCheck} label="Functions" value={booking.functions?.length || booking.noOfFunctions || 0} /><SnapshotRow icon={Utensils} label="Services" value={summary.services.join(', ') || 'Not selected'} /><SnapshotRow icon={FileText} label="Final Proposal" value={summary.finalProposal} /><SnapshotRow icon={IndianRupee} label="Booking Value" value={currencyAmount(summary.bookingValue)} /></div></div></CardContent></Card>
  );
}

export function ReadinessPayment({ summary }) {
  const items = [
    { label: 'Planning Readiness', value: summary.readiness, title: `${summary.readiness}% Ready`, detail: `${summary.pendingItems} key items pending`, status: summary.readiness >= 80 ? 'On Track' : 'Needs Attention', tone: '#2563eb', bar: 'bg-blue-600' },
    { label: 'Payment Status', value: summary.payment.clampedPercentage, title: `${summary.payment.clampedPercentage}% Paid`, detail: `${currencyAmount(summary.payment.pending)} Pending${summary.payment.dueLabel ? ` • ${summary.payment.dueLabel}` : ''}`, status: summary.payment.clampedPercentage === 100 ? 'Paid' : 'Partially Paid', tone: '#16a34a', bar: 'bg-emerald-600' },
  ];
  return (
    <Card className="crm-card"><CardContent className="p-4"><h2 className="mb-2 text-sm font-bold">Readiness &amp; Payment</h2><div className="divide-y divide-border">{items.map((item) => <div key={item.label} className="grid gap-3 py-3 sm:grid-cols-[58px_150px_minmax(120px,1fr)_auto] sm:items-center"><Ring value={item.value} tone={item.tone} /><div><p className="text-xs font-medium">{item.label}</p><p className="mt-1 text-base font-bold">{item.title}</p></div><div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${item.bar}`} style={{ width: `${item.value}%` }} /></div><p className="mt-2 text-[10px] text-muted-foreground">{item.detail}</p></div><Badge className={item.value >= 80 ? 'border-0 bg-emerald-50 text-emerald-700 hover:bg-emerald-50' : 'border-0 bg-amber-50 text-amber-700 hover:bg-amber-50'}>{item.status}</Badge></div>)}</div></CardContent></Card>
  );
}

const approvalTones = [
  'border-orange-100 bg-orange-50/50 text-orange-600',
  'border-emerald-100 bg-emerald-50/50 text-emerald-600',
  'border-violet-100 bg-violet-50/50 text-violet-600',
  'border-blue-100 bg-blue-50/50 text-blue-600',
];

export function ApprovalsPanel({ approvals }) {
  const icons = [Flag, Utensils, FileCheck2, PackageCheck];
  return <Card className="crm-card"><CardContent className="p-4"><h2 className="mb-3 text-sm font-bold">Approvals &amp; Pending Items</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{approvals.map((item, index) => { const Icon = icons[index]; return <div key={item.label} className={`flex min-h-16 items-center gap-3 rounded-lg border p-3 ${approvalTones[index]}`}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/70"><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-semibold text-foreground">{item.label}</p><Badge variant="outline" className={item.count ? 'border-red-100 bg-red-50 text-[9px] text-red-600' : 'border-emerald-100 bg-emerald-50 text-[9px] text-emerald-700'}>{item.count ? `${item.count} pending` : 'Complete'}</Badge></div><p className="mt-1 truncate text-[10px] text-muted-foreground">{item.detail}</p></div></div>; })}</div></CardContent></Card>;
}

const activityTones = ['bg-emerald-50 text-emerald-600', 'bg-blue-50 text-blue-600', 'bg-violet-50 text-violet-600', 'bg-amber-50 text-amber-600'];

export function RecentActivity({ activity }) {
  return (
    <Card id="event-recent-activity" className="crm-card">
      <CardContent className="p-4">
        <h2 className="mb-2 text-sm font-bold">Recent Activity</h2>
        {activity.length ? (
          <div className="divide-y divide-border">
            {activity.map((item, index) => {
              const tone = activityTones[index % activityTones.length];
              return (
                <div key={item._id || index} className="grid gap-3 py-2.5 text-xs sm:grid-cols-[26px_220px_minmax(0,1fr)_180px_auto] sm:items-center">
                  <span className={`grid h-6 w-6 place-items-center rounded-full ${tone}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <p className="font-semibold text-foreground">{item.title || 'Event updated'}</p>
                  <p className="text-muted-foreground">{item.description || item.note || '-'}</p>
                  <p className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {item.formattedDate}
                  </p>
                  <Badge variant="outline" className={`justify-self-start border-transparent text-[9px] ${tone}`}>
                    {item.type || 'Activity'}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid min-h-24 place-items-center text-xs text-muted-foreground">No event activity recorded yet.</div>
        )}
      </CardContent>
    </Card>
  );
}
