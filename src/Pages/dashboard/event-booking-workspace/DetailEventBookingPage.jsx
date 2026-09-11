import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Edit, Loader2, Plus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import AdminService from '../../../services/event-booking-workspace.service';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import {
  EditBookingDialog,
  PaymentBadge,
  StatusBadge,
  formatDate,
  getBookingDetail,
  getEmployees,
} from './components/EventBookingComponents';
import {
  DetailCard,
  MiniTable,
  QuickActionDialog,
  ReadinessRing,
  SummaryStrip,
  detailIcons,
  fallbackDocuments,
  fallbackFunctions,
  fallbackServices,
  fallbackTasks,
  fallbackTeam,
  fallbackTimeline,
  fallbackVendors,
  formatCurrency,
  getName,
  getText,
  quickActionConfigs,
  safeList,
  shortDate,
} from './components/EventDetailComponents';

const fetchBooking = async ({ queryKey }) => {
  const [, eventId] = queryKey;
  const response = await AdminService.getEventBookingDetail({ eventId });
  return response.data;
};

const fetchEmployees = async () => {
  return (await AdminService.getEventBookingManagers({ limit: 100 })).data;
};

const updateBooking = async ({ eventId, ...payload }) => {
  const response = await AdminService.updateEventBooking({ eventId, ...payload });
  return response.data;
};

const actionMutations = {
  function: AdminService.addEventFunction,
  team: AdminService.addEventTeamMember,
  vendor: AdminService.addEventVendor,
  task: AdminService.addEventTask,
  document: AdminService.addEventDocument,
  payment: AdminService.addEventPayment,
  ready: AdminService.markEventExecutionReady,
};

export default function DetailEventBookingPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [quickAction, setQuickAction] = useState(null);

  const bookingQuery = useQuery({
    queryKey: ['event-booking-detail', eventId],
    queryFn: fetchBooking,
    enabled: Boolean(eventId),
  });

  const employeeQuery = useQuery({
    queryKey: ['event-booking-managers'],
    queryFn: fetchEmployees,
  });

  const updateMutation = useMutation({
    mutationFn: updateBooking,
    onSuccess: (response) => {
      toast.success(response?.message || 'Event updated!');
      setEditOpen(false);
      bookingQuery.refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Unable to update event'),
  });

  const quickMutation = useMutation({
    mutationFn: ({ actionKey, payload }) => actionMutations[actionKey]({ eventId, ...payload }),
    onSuccess: (response) => {
      toast.success(response?.message || 'Event updated!');
      setQuickAction(null);
      bookingQuery.refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Unable to save action'),
  });

  const booking = getBookingDetail(bookingQuery.data);
  const employees = getEmployees(employeeQuery.data);

  const data = useMemo(() => {
    if (!booking) return {};
    const functions = safeList(booking.functions, fallbackFunctions);
    const services = safeList(
      booking.servicesSelected,
      booking.servicesRequired?.map((service) => ({ service, status: booking.bookingStatus })) || fallbackServices,
    );
    const team = safeList(booking.assignedTeam, booking.assignedManager ? [{ employee: booking.assignedManager, role: 'Event Manager' }, ...fallbackTeam.slice(1)] : fallbackTeam);
    const vendors = safeList(booking.vendorAssignments, fallbackVendors);
    const tasks = safeList(booking.eventTasks, fallbackTasks);
    const documents = safeList(booking.documents, fallbackDocuments);
    const timeline = safeList(booking.timeline, fallbackTimeline);
    const total = Number(booking.paymentSummary?.totalAmount || 0);
    const received = Number(booking.paymentSummary?.receivedAmount || 0);
    const paidPercent = total ? Math.round((received / total) * 100) : 0;
    return { functions, services, team, vendors, tasks, documents, timeline, paidPercent, readiness: booking.executionReadiness || {} };
  }, [booking]);

  if (bookingQuery.isLoading) {
    return <div className="crm-page flex h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!booking) {
    return <div className="crm-page min-h-screen p-5"><Card className="crm-card"><CardContent className="p-6 text-sm font-medium">Event booking not found.</CardContent></Card></div>;
  }

  const openAction = (action) => {
    if (action.key === 'edit') {
      setEditOpen(true);
      return;
    }
    setQuickAction(action);
  };

  return (
    <div className="crm-page min-h-screen p-4 md:p-5">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
            <button type="button" onClick={() => navigate('/dashboard/event-&-booking')} className="hover:text-primary">Events & Bookings</button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{booking.eventName}</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-foreground">{booking.eventName}</h1>
          <p className="mt-1 text-xs text-muted-foreground">Event detail, planning status, team coordination and execution overview.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="crm-outline-button h-9 px-5 text-xs font-medium" onClick={() => setEditOpen(true)}><Edit className="mr-2 h-4 w-4" />Edit Event</Button>
          <Button variant="outline" className="crm-outline-button h-9 px-5 text-xs font-medium" onClick={() => setQuickAction({ key: 'function', label: 'Add Function' })}><Plus className="mr-2 h-4 w-4" />Add Function</Button>
          <Button className="crm-primary-button h-9 px-5 text-xs font-medium" onClick={() => setQuickAction({ key: 'ready', label: 'Mark Execution Ready' })}><ShieldCheck className="mr-2 h-4 w-4" />Mark Execution Ready</Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <main className="space-y-4">
          <SummaryStrip booking={booking} functionsCount={data.functions?.length} />

          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.1fr_0.95fr]">
            <DetailCard number="1" icon={detailIcons.User} title="Event Information" tone="blue">
              <div className="grid gap-2 text-[11px]">
                {[
                  ['Client Name', booking.customer?.name],
                  ['Event Name', booking.eventName],
                  ['Event Type', booking.eventType],
                  ['Event Date', formatDate(booking.eventDate)],
                  ['City', booking.city],
                  ['Venue', booking.venue],
                  ['Guest Count', booking.guestCount],
                  ['Number of Functions', booking.noOfFunctions],
                ].map(([label, value]) => <div key={label} className="grid grid-cols-[130px_1fr] gap-3"><span className="font-medium text-muted-foreground">{label}</span><span className="font-medium text-foreground">{value || '-'}</span></div>)}
                <div className="grid grid-cols-[130px_1fr] gap-3"><span className="font-medium text-muted-foreground">Booking Status</span><StatusBadge status={booking.bookingStatus} /></div>
                <div className="grid grid-cols-[130px_1fr] gap-3"><span className="font-medium text-muted-foreground">Payment Status</span><PaymentBadge status={booking.paymentStatus} /></div>
              </div>
            </DetailCard>

            <DetailCard number="2" icon={detailIcons.CalendarDays} title="Functions List" tone="violet">
              <MiniTable columns={['Function', 'Date', 'Time', 'Venue / Area', 'Guests', 'Status']} rows={data.functions} renderRow={(item) => (
                <tr key={item._id || item.name}><td className="py-2.5 font-medium">{item.name}</td><td>{shortDate(item.date)}</td><td>{item.startTime || '-'}</td><td>{item.venue || item.area || '-'}</td><td>{item.guestCount || '-'}</td><td><StatusBadge status={item.status} /></td></tr>
              )} />
              <Button variant="outline" className="crm-outline-button mx-auto mt-4 flex h-8 px-8 text-xs font-medium">View All Functions</Button>
            </DetailCard>

            <DetailCard number="3" icon={detailIcons.ClipboardCheck} title="Services Selected" tone="emerald">
              <div className="divide-y divide-border">
                {data.services.slice(0, 6).map((item, index) => {
                  const Icon = item.icon || fallbackServices[index % fallbackServices.length].icon;
                  const colors = ['text-emerald-600', 'text-amber-600', 'text-blue-600', 'text-violet-600', 'text-cyan-600', 'text-rose-600'];
                  return <div key={item._id || getText(item.service) || index} className="flex items-center justify-between gap-3 py-2 text-[11px]"><span className="flex items-center gap-3 font-medium text-foreground"><Icon className={`h-4 w-4 ${colors[index % colors.length]}`} />{getText(item.service || item.name)}</span><StatusBadge status={item.status || booking.bookingStatus} /></div>;
                })}
              </div>
            </DetailCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <DetailCard number="4" icon={detailIcons.Users} title="Assigned Team" tone="rose" action={<Button variant="outline" className="crm-outline-button h-7 px-3 text-xs font-medium" onClick={() => setQuickAction({ key: 'team', label: 'Assign Team' })}>Assign Team</Button>}>
              <div className="divide-y divide-border">
                {data.team.slice(0, 5).map((item, index) => (
                  <div key={item._id || index} className="flex items-center justify-between gap-3 py-2 text-[11px]">
                    <div className="flex min-w-0 items-center gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-600">{getName(item.employee).slice(0, 2).toUpperCase()}</div><div className="min-w-0"><p className="truncate font-semibold text-foreground">{getName(item.employee)}</p><p className="truncate text-[10px] text-muted-foreground">{item.role || item.responsibility}</p></div></div>
                    <div className="flex gap-3 text-muted-foreground"><detailIcons.Phone className="h-3.5 w-3.5" /><detailIcons.Mail className="h-3.5 w-3.5" /></div>
                  </div>
                ))}
              </div>
            </DetailCard>

            <DetailCard number="5" icon={detailIcons.Handshake} title="Assigned Vendors" tone="cyan">
              <MiniTable columns={['Vendor', 'Category', 'Status', 'Payment']} rows={data.vendors.slice(0, 4)} minWidth={360} renderRow={(item, index) => (
                <tr key={item._id || index}><td className="max-w-[130px] truncate py-2.5 font-medium">{getName(item.vendor)}</td><td className="max-w-[90px] truncate">{getText(item.category || item.service)}</td><td><StatusBadge status={item.status} /></td><td><PaymentBadge status={item.paymentStatus} /></td></tr>
              )} />
              <button type="button" className="mx-auto mt-3 flex items-center gap-2 text-xs font-semibold text-primary">View All Vendors <detailIcons.ArrowRight className="h-3.5 w-3.5" /></button>
            </DetailCard>

            <DetailCard number="6" icon={detailIcons.IndianRupee} title="Payment Summary" tone="amber">
              <div className="space-y-3 text-xs">
                <div className="flex justify-between gap-3"><span>Total Booking Value</span><b className="font-semibold">{formatCurrency(booking.paymentSummary?.totalAmount)}</b></div>
                <div className="flex justify-between gap-3 text-emerald-600"><span>Advance Received</span><b className="font-semibold">{formatCurrency(booking.paymentSummary?.receivedAmount)}</b></div>
                <div className="flex justify-between gap-3 text-destructive"><span>Pending Amount</span><b className="font-semibold">{formatCurrency(booking.paymentSummary?.pendingAmount)}</b></div>
                <div className="flex justify-between gap-3"><span>Next Payment Due</span><b className="font-semibold">{formatDate(booking.paymentSummary?.nextPaymentDueDate)}</b></div>
                <div className="flex justify-between"><span>Payment Status</span><PaymentBadge status={booking.paymentStatus} /></div>
                <div className="pt-2"><div className="mb-2 flex justify-between text-xs font-semibold"><span>{data.paidPercent}% Paid</span></div><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-violet-500" style={{ width: `${data.paidPercent}%` }} /></div></div>
              </div>
            </DetailCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <DetailCard number="7" icon={detailIcons.ClipboardList} title="Event Tasks" tone="blue">
              <MiniTable columns={['Task', 'Assigned To', 'Due Date', 'Status']} rows={data.tasks.slice(0, 5)} renderRow={(item, index) => (
                <tr key={item._id || index}><td className="py-2.5 font-medium">{getText(item.taskTitle || item.title)}</td><td>{item.assignedToName || getName(item.assignedTo)}</td><td>{shortDate(item.dueDate)}</td><td><StatusBadge status={item.status} /></td></tr>
              )} />
              <button type="button" className="mx-auto mt-3 flex items-center gap-2 text-xs font-semibold text-primary">View All Tasks <detailIcons.ArrowRight className="h-3.5 w-3.5" /></button>
            </DetailCard>

            <DetailCard number="8" icon={detailIcons.FileText} title="Documents" tone="violet">
              <MiniTable columns={['Document Name', 'Type', 'Uploaded On', 'Action']} rows={data.documents.slice(0, 7)} renderRow={(item, index) => (
                <tr key={item._id || index}><td className="py-2 font-medium">{item.documentName}</td><td>{item.documentType}</td><td>{shortDate(item.uploadedOn || item.createdAt)}</td><td><div className="flex gap-2"><detailIcons.Eye className="h-3.5 w-3.5 text-blue-500" /><detailIcons.Download className="h-3.5 w-3.5 text-muted-foreground" /></div></td></tr>
              )} />
              <button type="button" className="mx-auto mt-3 flex items-center gap-2 text-xs font-semibold text-primary">View All Documents <detailIcons.ArrowRight className="h-3.5 w-3.5" /></button>
            </DetailCard>

            <DetailCard number="9" icon={detailIcons.Clock3} title="Notes / Activity Timeline" tone="amber">
              <div className="space-y-3">
                {data.timeline.slice(0, 5).map((item, index) => (
                  <div key={item._id || index} className="flex gap-3 text-xs">
                    <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-medium text-blue-600">{index + 1}</span>
                    <div><p className="font-medium text-foreground">{item.title}</p><p className="text-[11px] text-muted-foreground">{formatDate(item.activityDate)} {item.description ? `, ${item.description}` : ''}</p></div>
                  </div>
                ))}
              </div>
              <button type="button" className="mx-auto mt-4 flex items-center gap-2 text-xs font-semibold text-primary">View Full Timeline <detailIcons.ArrowRight className="h-3.5 w-3.5" /></button>
            </DetailCard>
          </div>
        </main>

        <aside className="space-y-4">
          <Card className="crm-card rounded-lg"><CardContent className="p-4"><h2 className="mb-3 text-sm font-semibold text-foreground">Quick Actions</h2><div className="space-y-2">
            {quickActionConfigs.map((action) => <button key={action.key} type="button" onClick={() => openAction(action)} className="flex h-9 w-full items-center justify-between rounded-md border border-border px-3 text-xs font-medium text-foreground hover:bg-accent"><span className="flex items-center gap-3"><action.icon className="h-4 w-4 text-blue-600" />{action.label}</span><ChevronRight className="h-4 w-4" /></button>)}
            <button type="button" onClick={() => setQuickAction({ key: 'ready', label: 'Mark Execution Ready' })} className="flex h-10 w-full items-center gap-3 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground"><ShieldCheck className="h-4 w-4" />Mark Execution Ready</button>
            <button type="button" className="flex h-10 w-full items-center gap-3 rounded-md border border-emerald-300 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700"><detailIcons.CheckCircle2 className="h-4 w-4" />Mark Completed</button>
          </div></CardContent></Card>

          <Card className="crm-card rounded-lg"><CardContent className="flex items-center justify-between p-4"><div><h2 className="text-sm font-semibold text-foreground">Event Countdown</h2><div className="mt-5 flex items-end gap-2"><span className="text-5xl font-semibold text-violet-500">{Math.max(0, Math.ceil((new Date(booking.eventDate) - new Date()) / 86400000))}</span><span className="pb-2 text-xs text-muted-foreground">days to event</span></div><p className="mt-2 text-xs font-medium text-foreground">{formatDate(booking.eventDate)}</p></div><detailIcons.CalendarDays className="h-16 w-16 text-emerald-500" /></CardContent></Card>

          <Card className="crm-card rounded-lg"><CardContent className="flex items-center justify-between p-4"><div><h2 className="text-sm font-semibold text-foreground">Execution Readiness</h2><p className="mt-5 text-xs font-semibold text-emerald-600">{data.readiness?.isReady ? 'Ready' : 'Good Progress'}</p><p className="mt-1 text-xs text-muted-foreground">{data.readiness?.completedTasks || 26} of {data.readiness?.totalTasks || 36} tasks completed</p><button type="button" className="mt-5 flex items-center gap-2 text-xs font-semibold text-primary">View Details <detailIcons.ArrowRight className="h-3.5 w-3.5" /></button></div><ReadinessRing value={data.readiness?.percentage || 72} /></CardContent></Card>
        </aside>
      </div>

      <EditBookingDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        booking={booking}
        employees={employees}
        saving={updateMutation.isPending || updateMutation.isLoading}
        onSave={(payload) => updateMutation.mutate({ eventId: booking._id, ...payload })}
      />

      <QuickActionDialog
        open={Boolean(quickAction)}
        onOpenChange={(open) => !open && setQuickAction(null)}
        action={quickAction}
        employees={employees}
        saving={quickMutation.isPending || quickMutation.isLoading}
        onSubmit={(actionKey, payload) => quickMutation.mutate({ actionKey, payload })}
      />
    </div>
  );
}
