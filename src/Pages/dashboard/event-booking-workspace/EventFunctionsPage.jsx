import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import AdminService from '../../../services/event-booking-workspace.service';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import {
  buildBookingRequirementsUpdate,
  EditBookingDialog,
  getBookingDetail,
  getBookingRequirementsCustomer,
  getEmployees,
} from './components/EventBookingComponents';
import { getFinalPreferenceCount } from './eventBookingDashboard.utils';
import ClientRequirementsDialog from './components/ClientRequirementsDialog';
import EventDetailTabs from './components/EventDetailTabs';
import EventFunctionsHeader from './components/EventFunctionsHeader';
import EventFunctionsTable from './components/EventFunctionsTable';
import useCurrentEmployee from '../../../hooks/useCurrentEmployee';

export default function EventFunctionsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [functionDialog, setFunctionDialog] = useState(null);
  const [editBookingOpen, setEditBookingOpen] = useState(false);
  const { data: currentEmployee } = useCurrentEmployee();

  const bookingQuery = useQuery({
    queryKey: ['event-booking-detail', eventId],
    queryFn: async () => (await AdminService.getEventBookingDetail({ eventId })).data,
    enabled: Boolean(eventId),
  });
  const managersQuery = useQuery({
    queryKey: ['event-booking-managers'],
    queryFn: async () => (await AdminService.getEventBookingManagers({ limit: 100 })).data,
  });

  const refresh = () => bookingQuery.refetch();
  const requirementsMutation = useMutation({
    mutationFn: (payload) => AdminService.updateEventBooking({
      eventId,
      ...buildBookingRequirementsUpdate(booking, payload),
    }),
    onSuccess: () => { toast.success('Event requirements updated'); setFunctionDialog(null); refresh(); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update event requirements'),
  });
  const updateBookingMutation = useMutation({
    mutationFn: (payload) => AdminService.updateEventBooking({ eventId, ...payload }),
    onSuccess: () => { toast.success('Booking updated'); setEditBookingOpen(false); refresh(); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update booking'),
  });
  const readyMutation = useMutation({
    mutationFn: () => AdminService.markEventExecutionReady({ eventId }),
    onSuccess: () => { toast.success('Event marked execution ready'); refresh(); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to mark event ready'),
  });

  const booking = getBookingDetail(bookingQuery.data);
  const employees = getEmployees(managersQuery.data);
  const services = useMemo(() => Array.from(new Set([
    ...(booking?.servicesRequired || []),
    ...(booking?.servicesSelected || []).map((item) => item.name || item.service).filter(Boolean),
  ])), [booking]);
  const functions = useMemo(() => booking?.functions || [], [booking]);
  const metrics = useMemo(() => ({
    functions: functions.length,
    services: services.length,
    peakGuests: Math.max(Number(booking?.guestCount || 0), ...functions.map((item) => Number(item.guestCount || 0))),
    preferences: getFinalPreferenceCount(booking),
    approvals: (booking?.approvals || []).filter((item) => item.status === 'Pending').length + (booking?.finance?.approvalStatus === 'Pending' ? 1 : 0),
  }), [booking, functions, services]);

  if (bookingQuery.isLoading) return <div className="crm-page grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!booking) return <div className="crm-page p-5"><Card className="crm-card"><CardContent className="p-8 text-center"><p className="font-semibold">Event booking not found</p><Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/assigned-events')}>Back to bookings</Button></CardContent></Card></div>;

  const selectTab = (key) => {
    if (key === 'overview') navigate(`/dashboard/assigned-events/${eventId}`);
    else if (key === 'services') navigate(`/dashboard/assigned-events/${eventId}/plan/services`);
    else if (key === 'guests') navigate(`/dashboard/assigned-events/${eventId}/plan/guests`);
    else if (key === 'preferences') navigate(`/dashboard/assigned-events/${eventId}/plan/preferences`);
    else if (key === 'approvals') navigate(`/dashboard/assigned-events/${eventId}/plan/approvals`);
    else if (key === 'operations') navigate(`/dashboard/assigned-events/${eventId}/operations`);
    else if (!['plan', 'functions'].includes(key)) toast.info(`${key === 'finance' ? 'Finance & Files' : key[0].toUpperCase() + key.slice(1)} section will be available here.`);
  };

  return (
    <div className="crm-page min-h-screen space-y-4 p-3 sm:p-4 lg:p-5">
      <EventFunctionsHeader booking={booking} metrics={metrics} onBack={() => navigate('/dashboard/assigned-events')} onEdit={() => setEditBookingOpen(true)} onMarkReady={() => readyMutation.mutate()} onOpenPlanning={() => document.getElementById('functions-overview')?.scrollIntoView({ behavior: 'smooth' })} />

      <EventDetailTabs activePrimary="plan" activePlan="functions" showPlanTabs onSelect={selectTab} />

      <EventFunctionsTable functions={functions} defaultServices={services} onAdd={() => setFunctionDialog({})} onEdit={setFunctionDialog} onTimeline={() => toast.info('Event timeline will be available in the Activity section.')} />

      <ClientRequirementsDialog
        open={Boolean(functionDialog)}
        onOpenChange={(open) => !open && setFunctionDialog(null)}
        customer={getBookingRequirementsCustomer(booking)}
        initialSection="functions"
        functionsAndServicesOnly
        canDeleteExisting={['Super Admin', 'Admin'].includes(currentEmployee?.accessRole)}
        startAddingFunction={!functionDialog?._id}
        initialFunctionId={functionDialog?._id}
        initialFunctionName={functionDialog?.name}
        isSaving={requirementsMutation.isPending}
        onSubmit={(payload) => requirementsMutation.mutate(payload)}
      />
      <EditBookingDialog open={editBookingOpen} onOpenChange={setEditBookingOpen} booking={booking} employees={employees} saving={updateBookingMutation.isPending} onSave={(payload) => updateBookingMutation.mutate(payload)} />
    </div>
  );
}
