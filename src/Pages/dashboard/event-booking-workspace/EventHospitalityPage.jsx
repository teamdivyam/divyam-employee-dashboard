import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ClipboardCheck, ClipboardList, ConciergeBell, Crown, Hourglass, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import AdminService from '../../../services/event-booking-workspace.service';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { EditBookingDialog, getBookingDetail, getEmployees } from './components/EventBookingComponents';
import EventDetailTabs from './components/EventDetailTabs';
import EventFunctionsHeader from './components/EventFunctionsHeader';
import EventHospitalityDialog from './components/EventHospitalityDialog';
import EventHospitalityPanel from './components/EventHospitalityPanel';

const guestCount = (guest) => Number(guest.memberCount || 1);

export default function EventHospitalityPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [requirementDialog, setRequirementDialog] = useState(null);
  const [editBookingOpen, setEditBookingOpen] = useState(false);

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
  const createRequirementMutation = useMutation({
    mutationFn: (payload) => AdminService.addEventHospitalityRequirement({ eventId, ...payload }),
    onSuccess: () => {
      toast.success('Hospitality requirement added');
      setRequirementDialog(null);
      refresh();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to add requirement'),
  });
  const updateRequirementMutation = useMutation({
    mutationFn: ({ requirementId, ...payload }) => AdminService.updateEventHospitalityRequirement({ eventId, requirementId, ...payload }),
    onSuccess: () => {
      toast.success('Hospitality requirement updated');
      setRequirementDialog(null);
      refresh();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update requirement'),
  });
  const updateBookingMutation = useMutation({
    mutationFn: (payload) => AdminService.updateEventBooking({ eventId, ...payload }),
    onSuccess: () => {
      toast.success('Booking updated');
      setEditBookingOpen(false);
      refresh();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update booking'),
  });
  const readyMutation = useMutation({
    mutationFn: () => AdminService.markEventExecutionReady({ eventId }),
    onSuccess: () => {
      toast.success('Event marked execution ready');
      refresh();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to mark event ready'),
  });

  const booking = getBookingDetail(bookingQuery.data);
  const employees = getEmployees(managersQuery.data);
  const functions = useMemo(() => booking?.functions || [], [booking]);
  const requirements = useMemo(() => booking?.hospitalityRequirements || [], [booking]);
  const guests = useMemo(() => booking?.guestList || [], [booking]);

  const vipGuests = Math.max(
    guests.filter((guest) => guest.isVip || (guest.hospitalityNeeds || []).includes('VIP')).reduce((total, guest) => total + guestCount(guest), 0),
    0,
    ...functions.map((item) => Number(item.vipGuestCount || 0)),
  );
  const summaryItems = useMemo(() => [
    { label: 'Requirements', value: requirements.length, caption: 'Total', icon: ConciergeBell, tone: 'violet' },
    { label: 'Finalised', value: requirements.filter((item) => ['Finalised', 'Completed'].includes(item.planningStatus || item.status)).length, caption: 'Ready to deliver', icon: ClipboardCheck, tone: 'emerald' },
    { label: 'In Planning', value: requirements.filter((item) => (item.planningStatus || item.status) === 'In Planning').length, caption: 'Being prepared', icon: ClipboardList, tone: 'orange' },
    { label: 'Pending', value: requirements.filter((item) => !(item.planningStatus || item.status) || (item.planningStatus || item.status) === 'Pending').length, caption: 'Awaiting details', icon: Hourglass, tone: 'rose' },
    { label: 'VIP Guests', value: vipGuests, caption: 'Special attention', icon: Crown, tone: 'blue' },
  ], [requirements, vipGuests]);

  if (bookingQuery.isLoading) {
    return <div className="crm-page grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!booking) {
    return (
      <div className="crm-page p-5">
        <Card className="crm-card">
          <CardContent className="p-8 text-center">
            <p className="font-semibold">Event booking not found</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/assigned-events')}>Back to bookings</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const saveRequirement = (payload) => {
    if (requirementDialog?._id) {
      updateRequirementMutation.mutate({ requirementId: requirementDialog._id, ...payload });
    } else {
      createRequirementMutation.mutate(payload);
    }
  };

  const selectEventTab = (key) => {
    if (key === 'overview') navigate(`/dashboard/assigned-events/${eventId}`);
    else if (key === 'functions') navigate(`/dashboard/assigned-events/${eventId}/plan/functions`);
    else if (key === 'services') navigate(`/dashboard/assigned-events/${eventId}/plan/services`);
    else if (key === 'preferences') navigate(`/dashboard/assigned-events/${eventId}/plan/preferences`);
    else if (key === 'approvals') navigate(`/dashboard/assigned-events/${eventId}/plan/approvals`);
    else if (key === 'operations') navigate(`/dashboard/assigned-events/${eventId}/operations`);
    else if (!['plan', 'guests'].includes(key)) toast.info(`${key === 'finance' ? 'Finance & Files' : key[0].toUpperCase() + key.slice(1)} section will be available here.`);
  };

  const selectGuestTab = (key) => {
    const basePath = `/dashboard/assigned-events/${eventId}/plan/guests`;
    if (key === 'counts') navigate(basePath);
    else if (key === 'list') navigate(`${basePath}/list`);
    else if (key === 'accommodation') navigate(`${basePath}/accommodation`);
    else if (key === 'transport') navigate(`${basePath}/transport`);
  };

  return (
    <div className="crm-page min-h-screen space-y-4 p-3 sm:p-4 lg:p-5">
      <EventFunctionsHeader
        booking={booking}
        metrics={{}}
        metricItems={summaryItems}
        onBack={() => navigate('/dashboard/assigned-events')}
        onEdit={() => setEditBookingOpen(true)}
        onMarkReady={() => readyMutation.mutate()}
        onOpenPlanning={() => document.getElementById('hospitality-plan')?.scrollIntoView({ behavior: 'smooth' })}
      />
      <EventDetailTabs activePrimary="plan" activePlan="guests" showPlanTabs onSelect={selectEventTab} />
      <EventHospitalityPanel
        requirements={requirements}
        functions={functions}
        onGuestTab={selectGuestTab}
        onAdd={() => setRequirementDialog({})}
        onEdit={setRequirementDialog}
      />

      <EventHospitalityDialog
        open={Boolean(requirementDialog)}
        onOpenChange={(open) => !open && setRequirementDialog(null)}
        item={requirementDialog}
        functions={functions}
        employees={employees}
        saving={createRequirementMutation.isPending || updateRequirementMutation.isPending}
        onSave={saveRequirement}
      />
      <EditBookingDialog
        open={editBookingOpen}
        onOpenChange={setEditBookingOpen}
        booking={booking}
        employees={employees}
        saving={updateBookingMutation.isPending}
        onSave={(payload) => updateBookingMutation.mutate(payload)}
      />
    </div>
  );
}
