import { useOutletContext } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import AdminService from '../../../services/event-booking-workspace.service';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { getEmployees } from "./components/EventBookingComponents";
import { getFinalPreferenceCount } from './eventBookingDashboard.utils';
import EventServiceDialog from './components/EventServiceDialog';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@components/components/ui/alert-dialog';
import EventPlanTabs from './components/EventPlanTabs';
import EventSummaryCards from './components/EventSummaryCards';
import EventServicesTable from './components/EventServicesTable';

export default function EventServicesPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [serviceDialog, setServiceDialog] = useState(null);

  const { booking, bookingQuery, canDeleteEventData } = useOutletContext();

  const leadsQuery = useQuery({
    queryKey: ['event-booking-managers'],
    queryFn: async () => (await AdminService.getEventBookingManagers({ limit: 100 })).data,
    enabled: Boolean(serviceDialog),
  });
  const syncResponse = async (response) => {
    if (response.data?.event) {
      queryClient.setQueryData(['event-booking-detail', eventId], (current) => {
        const key = ['event', 'booking', 'eventBooking', 'data'].find((name) => current?.[name]);
        return key ? { ...current, [key]: response.data.event } : { event: response.data.event };
      });
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['event-booking-detail', eventId] }),
      queryClient.invalidateQueries({ queryKey: ['event-bookings'] }),
      queryClient.invalidateQueries({ queryKey: ['event-booking-analytics'] }),
    ]);
  };
  const serviceMutation = useMutation({
    mutationFn: async ({ payload, serviceId }) => {
      if (!/^[a-f\d]{24}$/i.test(eventId || '') || (serviceId && !/^[a-f\d]{24}$/i.test(serviceId))) throw new Error('Invalid event or service ID');
      return serviceId ? AdminService.updateEventService({ eventId, serviceId, ...payload }) : AdminService.addEventService({ eventId, ...payload });
    },
    onSuccess: async (response) => {
      toast.success(response.data?.message || 'Service saved');
      setServiceDialog(null);
      await syncResponse(response);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Unable to save service'),
  });
  const deleteMutation = useMutation({
    mutationFn: async (serviceId) => {
      if (!/^[a-f\d]{24}$/i.test(eventId || '') || !/^[a-f\d]{24}$/i.test(serviceId || '')) throw new Error('Invalid event or service ID');
      return AdminService.deleteEventService({ eventId, serviceId });
    },
    onSuccess: async (response) => {
      toast.success(response.data?.message || 'Service deleted!');
      setDeleteTarget(null);
      await syncResponse(response);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Unable to delete service'),
  });
  const functions = useMemo(() => booking?.functions || [], [booking]);
  const services = useMemo(() => booking?.servicesSelected || [], [booking]);
  const metrics = useMemo(() => ({
    functions: functions.length,
    functionsCaption: 'Confirmed',
    services: services.length,
    servicesCaption: 'Active',
    peakGuests: Math.max(Number(booking?.guestCount || 0), ...functions.map((item) => Number(item.guestCount || 0))),
    preferences: getFinalPreferenceCount(booking),
    approvals: (booking?.approvals || []).filter((item) => item.status === 'Pending').length + (booking?.finance?.approvalStatus === 'Pending' ? 1 : 0),
  }), [booking, functions, services]);

  if (bookingQuery.isLoading) return <div className="crm-page grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!booking) return <div className="crm-page p-5"><Card className="crm-card"><CardContent className="p-8 text-center"><p className="font-semibold">Event booking not found</p><Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/assigned-events')}>Back to bookings</Button></CardContent></Card></div>;

  const selectTab = (key) => {
    if (key === 'overview') navigate(`/dashboard/assigned-events/${eventId}`);
    else if (key === 'functions') navigate(`/dashboard/assigned-events/${eventId}/plan/functions`);
    else if (key === 'guests') navigate(`/dashboard/assigned-events/${eventId}/plan/guests`);
    else if (key === 'preferences') navigate(`/dashboard/assigned-events/${eventId}/plan/preferences`);
    else if (key === 'approvals') navigate(`/dashboard/assigned-events/${eventId}/plan/approvals`);
    else if (key === 'operations') navigate(`/dashboard/assigned-events/${eventId}/operations`);
    else if (!['plan', 'services'].includes(key)) toast.info(`${key === 'finance' ? 'Finance & Files' : key[0].toUpperCase() + key.slice(1)} section will be available here.`);
  };

  return (
    <div className="min-w-0 space-y-4">
      <EventSummaryCards metrics={metrics} />
      <EventPlanTabs activePlan="services" onSelect={selectTab} />
      <EventServicesTable services={services} functions={functions}  onAdd={() => setServiceDialog({})} onEdit={setServiceDialog} onDelete={canDeleteEventData ? setDeleteTarget : undefined} />

      <EventServiceDialog booking={booking} item={serviceDialog} functions={functions} leads={getEmployees(leadsQuery.data)} leadsLoading={leadsQuery.isLoading} leadsError={leadsQuery.isError} retryLeads={() => leadsQuery.refetch()} saving={serviceMutation.isPending} onClose={() => setServiceDialog(null)} onSave={(payload) => serviceMutation.mutate({ payload, serviceId: serviceDialog?._id })} />
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !deleteMutation.isPending && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete service?</AlertDialogTitle><AlertDialogDescription>This will remove {deleteTarget?.name || deleteTarget?.service || 'this service'} from the event. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={deleteMutation.isPending || !deleteTarget?._id} onClick={() => deleteMutation.mutate(deleteTarget._id)}>{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

