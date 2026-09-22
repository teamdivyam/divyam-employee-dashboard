import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import AdminService from '../../../services/event-booking-workspace.service';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { AssignManagerDialog, getBookingDetail, getEmployees } from './components/EventBookingComponents';
import AddBookingDialog from './components/AddBookingDialog';
import EventDetailTabs from './components/EventDetailTabs';
import EventOverviewHeader from './components/EventOverviewHeader';
import { ApprovalsPanel, BookingSnapshot, ReadinessPayment, RecentActivity } from './components/EventOverviewPanels';
import {
  getKeyPendingItems,
  getPaymentMetrics,
  numericAmount,
  planningStageStep,
  planningViewStage,
  readinessPercentage,
} from './eventBookingDashboard.utils';

const formatActivityDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const milestoneFromBooking = (booking) => {
  const openTasks = (booking.eventTasks || [])
    .filter((task) => task && !['Completed', 'Cancelled'].includes(task.status))
    .sort((left, right) => new Date(left.dueDate || '9999-12-31') - new Date(right.dueDate || '9999-12-31'));
  if (openTasks.length) {
    return {
      label: openTasks[0].taskTitle || 'Planning task',
      date: openTasks[0].dueDate ? formatActivityDate(openTasks[0].dueDate).split(',')[0] : 'Due date pending',
    };
  }

  const nextFunction = (booking.functions || [])
    .filter((item) => item.date && new Date(item.date) >= new Date())
    .sort((left, right) => new Date(left.date) - new Date(right.date))[0];
  return nextFunction
    ? { label: nextFunction.name, date: formatActivityDate(nextFunction.date).split(',')[0] }
    : { label: 'No milestone pending', date: 'Planning is up to date' };
};

const buildOverview = (booking) => {
  const functions = booking.functions || [];
  const services = Array.from(new Set([
    ...(booking.servicesRequired || []),
    ...(booking.servicesSelected || []).map((item) => item.name || item.service).filter(Boolean),
  ]));
  const tasks = booking.eventTasks || [];
  const openTasks = tasks.filter((task) => task && !['Completed', 'Cancelled'].includes(task.status));
  const detailedStage = planningViewStage(booking);
  const stage = booking.executionReadiness?.isReady ? 'Execution Ready' : 'In Planning';
  const readiness = readinessPercentage(booking);
  const payment = getPaymentMetrics(booking);
  const proposal = [...(booking.documents || [])].reverse().find((item) => item.documentType === 'Proposal');
  const guestCounts = functions.map((item) => Number(item.guestCount || 0)).filter(Boolean);
  const minGuests = guestCounts.length ? Math.min(...guestCounts) : Number(booking.guestCount || 0);
  const maxGuests = Math.max(Number(booking.guestCount || 0), ...guestCounts);
  const vendorPending = (booking.vendorAssignments || []).filter((item) => !['Confirmed', 'Accepted'].includes(item.confirmationStatus)).length;
  const menuPending = (booking.servicesSelected || []).filter((item) => /cater|menu/i.test(item.name || item.service || item.category || '') && !['Confirmed', 'Completed'].includes(item.status)).length;
  const inventoryPending = openTasks.filter((task) => /inventory|equipment|material/i.test(`${task.taskTitle || ''} ${task.description || ''}`)).length;
  const clientPending = (booking.issues || []).filter((item) => item.status !== 'Resolved' && /client|approval/i.test(`${item.issueType || ''} ${item.description || ''}`)).length
    + (['Proposal Pending', 'Proposal Sent'].includes(booking.bookingStatus) ? 1 : 0);
  const activity = [...(booking.timeline || [])]
    .sort((left, right) => new Date(right.activityDate || right.createdAt || 0) - new Date(left.activityDate || left.createdAt || 0))
    .slice(0, 5)
    .map((item) => ({ ...item, formattedDate: formatActivityDate(item.activityDate || item.createdAt) }));

  return {
    stage,
    stageStep: booking.executionReadiness?.isReady ? 5 : planningStageStep(detailedStage),
    nextMilestone: milestoneFromBooking(booking),
    payment,
    readiness,
    pendingItems: getKeyPendingItems(booking).length,
    openTasks: openTasks.length,
    services,
    finalProposal: proposal?.documentName || 'Not uploaded',
    bookingValue: numericAmount(booking.paymentSummary?.totalAmount || booking.finance?.bookingValue),
    guestRange: minGuests && maxGuests && minGuests !== maxGuests ? `${minGuests.toLocaleString('en-IN')} – ${maxGuests.toLocaleString('en-IN')}` : (maxGuests || 0).toLocaleString('en-IN'),
    approvals: [
      { label: 'Client Approvals', count: clientPending, detail: clientPending ? 'Client decisions pending' : 'No client approvals pending' },
      { label: 'Menu Approval', count: menuPending, detail: menuPending ? 'Final menu pending' : 'Menu requirements cleared' },
      { label: 'Vendor Contracts', count: vendorPending, detail: vendorPending ? `${vendorPending} confirmation${vendorPending === 1 ? '' : 's'} pending` : 'All vendors confirmed' },
      { label: 'Inventory Confirmation', count: inventoryPending, detail: inventoryPending ? 'Inventory tasks pending' : 'Inventory planning clear' },
    ],
    activity,
  };
};

export default function EventOverviewPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const requestedAction = searchParams.get('action');
  const clearRequestedAction = () => {
    if (requestedAction) {
      const next = new URLSearchParams(searchParams);
      next.delete('action');
      setSearchParams(next, { replace: true });
    }
  };
  const setBookingDialogOpen = (open) => {
    setBookingFormOpen(open);
    if (!open) clearRequestedAction();
  };
  const setManagerDialogOpen = (open) => {
    setManagerOpen(open);
    if (!open) clearRequestedAction();
  };

  useEffect(() => {
    if (requestedAction === 'edit-booking') setBookingFormOpen(true);
    if (requestedAction === 'assign-manager') setManagerOpen(true);
  }, [requestedAction]);

  const bookingQuery = useQuery({
    queryKey: ['event-booking-detail', eventId],
    queryFn: async () => (await AdminService.getEventBookingDetail({ eventId })).data,
    enabled: Boolean(eventId),
  });
  const managersQuery = useQuery({
    queryKey: ['event-booking-managers'],
    queryFn: async () => (await AdminService.getEventBookingManagers({ limit: 100 })).data,
  });
  const updateMutation = useMutation({
    mutationFn: (payload) => AdminService.updateEventBooking({ eventId, ...payload }),
    onSuccess: () => { toast.success('Event manager updated'); setManagerDialogOpen(false); bookingQuery.refetch(); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update booking'),
  });
  const bookingFormMutation = useMutation({
    mutationFn: (formData) => AdminService.updateEventBookingForm({ eventId, formData }),
    onSuccess: (response) => {
      toast.success(response?.data?.message || 'Booking updated');
      setBookingDialogOpen(false);
      bookingQuery.refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update booking'),
  });
  const readyMutation = useMutation({
    mutationFn: () => AdminService.markEventExecutionReady({ eventId }),
    onSuccess: () => { toast.success('Event marked execution ready'); bookingQuery.refetch(); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to mark event ready'),
  });

  const booking = getBookingDetail(bookingQuery.data);
  const employees = getEmployees(managersQuery.data);
  const summary = useMemo(() => booking ? buildOverview(booking) : null, [booking]);

  if (bookingQuery.isLoading) return <div className="crm-page grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!booking) return <div className="crm-page p-5"><Card className="crm-card"><CardContent className="p-8 text-center"><p className="font-semibold">Event booking not found</p><Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/assigned-events')}>Back to bookings</Button></CardContent></Card></div>;

  const openPlanning = () => navigate(`/dashboard/assigned-events/${eventId}/plan/functions`);
  const selectTab = (key) => {
    if (key === 'plan') openPlanning();
    else if (key === 'operations') navigate(`/dashboard/assigned-events/${eventId}/operations`);
    else if (key === 'activity') document.getElementById('event-recent-activity')?.scrollIntoView({ behavior: 'smooth' });
    else if (key !== 'overview') toast.info(`${key === 'finance' ? 'Finance & Files' : key[0].toUpperCase() + key.slice(1)} section will be available here.`);
  };

  return (
    <div className="crm-page min-h-screen space-y-4 p-3 sm:p-4 lg:p-5">
      <EventOverviewHeader booking={booking} summary={summary} onBack={() => navigate('/dashboard/assigned-events')} onOpenPlanning={openPlanning} onEdit={() => setBookingFormOpen(true)} onMarkReady={() => readyMutation.mutate()} onViewTasks={() => navigate(`/dashboard/assigned-events/${eventId}/operations`)} />

      <EventDetailTabs activePrimary="overview" onSelect={selectTab} />

      <div className="grid gap-4 xl:grid-cols-2"><BookingSnapshot booking={booking} summary={summary} /><ReadinessPayment summary={summary} /></div>
      <ApprovalsPanel approvals={summary.approvals} />
      <RecentActivity activity={summary.activity} />

      <AddBookingDialog open={bookingFormOpen} onOpenChange={setBookingDialogOpen} booking={booking} customers={booking.customer ? [booking.customer] : []} employees={employees} mode="edit" saving={bookingFormMutation.isPending} onSubmit={(payload) => bookingFormMutation.mutate(payload)} />
      <AssignManagerDialog open={managerOpen} onOpenChange={setManagerDialogOpen} booking={booking} employees={employees} saving={updateMutation.isPending} onSave={(payload) => updateMutation.mutate(payload)} />
    </div>
  );
}
