import { useOutletContext } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import AdminService from '../../../services/event-booking-workspace.service';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@components/components/ui/alert-dialog';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { getFinalPreferenceCount } from './eventBookingDashboard.utils';
import EventFunctionDialog from './components/EventFunctionDialog';
import EventPlanTabs from './components/EventPlanTabs';
import EventSummaryCards from './components/EventSummaryCards';
import EventFunctionsTable from './components/EventFunctionsTable';

export default function EventFunctionsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [functionDialog, setFunctionDialog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { booking, bookingQuery, canDeleteEventData } = useOutletContext();

  const syncFunctionResponse = async (response) => {
    const updatedEvent = response.data?.event;
    if (updatedEvent) {
      queryClient.setQueryData(['event-booking-detail', eventId], (current) => {
        const key = ['event', 'booking', 'eventBooking', 'data'].find((name) => current?.[name]);
        return key ? { ...current, [key]: updatedEvent } : { event: updatedEvent };
      });
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['event-booking-detail', eventId] }),
      queryClient.invalidateQueries({ queryKey: ['event-bookings'] }),
      queryClient.invalidateQueries({ queryKey: ['event-booking-analytics'] }),
    ]);
  };
  const deleteMutation = useMutation({
    mutationFn: async (functionId) => {
      if (!/^[a-f\d]{24}$/i.test(eventId || '') || !/^[a-f\d]{24}$/i.test(functionId || '')) {
        throw new Error('A valid event and function ID are required.');
      }
      return AdminService.deleteEventFunction({ eventId, functionId });
    },
    onSuccess: async (response) => {
      toast.success(response.data?.message || 'Function deleted!');
      setDeleteTarget(null);
      await syncFunctionResponse(response);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Unable to delete function'),
  });
  const functionMutation = useMutation({
    mutationFn: async ({ payload, functionId }) => {
      if (!/^[a-f\d]{24}$/i.test(eventId) || (functionId && !/^[a-f\d]{24}$/i.test(functionId))) {
        throw new Error('A valid event and function ID are required.');
      }
      return functionId
        ? AdminService.updateEventFunction({ eventId, functionId, ...payload })
        : AdminService.addEventFunction({ eventId, ...payload });
    },
    onSuccess: async (response) => {
      toast.success(response.data?.message || 'Function saved');
      setFunctionDialog(null);
      await syncFunctionResponse(response);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Unable to save function'),
  });
  const services = useMemo(() => Array.from(new Set([
    ...(booking?.servicesRequired || []),
    ...(booking?.servicesSelected || []).map((item) => item.service).filter(Boolean),
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
    <div className="min-w-0 space-y-4">
      <EventSummaryCards metrics={metrics} />

      <EventPlanTabs activePlan="functions" onSelect={selectTab} />

      <EventFunctionsTable functions={functions} defaultServices={services} onAdd={() => setFunctionDialog({})} onEdit={setFunctionDialog} onDelete={canDeleteEventData ? setDeleteTarget : undefined} onTimeline={() => toast.info('Event timeline will be available in the Activity section.')} />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && !deleteMutation.isPending && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete function?</AlertDialogTitle>
            <AlertDialogDescription>This will remove {deleteTarget?.name || 'this function'} from the event. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={deleteMutation.isPending || !deleteTarget?._id} onClick={() => deleteMutation.mutate(deleteTarget._id)}>{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <EventFunctionDialog
        item={functionDialog}
        booking={booking}
        services={services}
        saving={functionMutation.isPending}
        onClose={() => setFunctionDialog(null)}
        onSave={(payload) => functionMutation.mutate({ payload, functionId: functionDialog?._id })}
      />

    </div>
  );
}

