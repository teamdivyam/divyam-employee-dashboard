import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import AdminService from '../../../services/event-booking-workspace.service';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { EditBookingDialog, getBookingDetail, getEmployees } from './components/EventBookingComponents';
import { getFinalPreferenceCount } from './eventBookingDashboard.utils';
import EventDetailTabs from './components/EventDetailTabs';
import EventFunctionsHeader from './components/EventFunctionsHeader';
import EventGuestCountsDialog from './components/EventGuestCountsDialog';
import EventGuestsPanels from './components/EventGuestsPanels';
import EventHospitalityDialog from './components/EventHospitalityDialog';

export default function EventGuestsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [countsOpen, setCountsOpen] = useState(false);
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
  const guestCountsMutation = useMutation({
    mutationFn: (rows) => Promise.all(rows.map(({ functionId, ...payload }) => AdminService.updateEventFunction({ eventId, functionId, ...payload }))),
    onSuccess: () => { toast.success('Guest counts updated'); setCountsOpen(false); refresh(); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update guest counts'),
  });
  const createRequirementMutation = useMutation({
    mutationFn: (payload) => AdminService.addEventHospitalityRequirement({ eventId, ...payload }),
    onSuccess: () => { toast.success('Hospitality requirement added'); setRequirementDialog(null); refresh(); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to add requirement'),
  });
  const updateRequirementMutation = useMutation({
    mutationFn: ({ requirementId, ...payload }) => AdminService.updateEventHospitalityRequirement({ eventId, requirementId, ...payload }),
    onSuccess: () => { toast.success('Hospitality requirement updated'); setRequirementDialog(null); refresh(); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update requirement'),
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
  const functions = useMemo(() => booking?.functions || [], [booking]);
  const requirements = useMemo(() => booking?.hospitalityRequirements || [], [booking]);
  const services = useMemo(() => Array.from(new Set([...(booking?.servicesRequired || []), ...(booking?.servicesSelected || []).map((item) => item.service).filter(Boolean)])), [booking]);
  const peakGuests = Math.max(Number(booking?.guestCount || 0), ...functions.map((item) => Number(item.guestCount || 0)));
  const metrics = useMemo(() => ({
    functions: functions.length,
    services: services.length,
    peakGuests,
    preferences: getFinalPreferenceCount(booking),
    approvals: (booking?.approvals || []).filter((item) => item.status === 'Pending').length + (booking?.finance?.approvalStatus === 'Pending' ? 1 : 0),
  }), [booking, functions, peakGuests, services]);

  if (bookingQuery.isLoading) return <div className="crm-page grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!booking) return <div className="crm-page p-5"><Card className="crm-card"><CardContent className="p-8 text-center"><p className="font-semibold">Event booking not found</p><Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/assigned-events')}>Back to bookings</Button></CardContent></Card></div>;

  const saveRequirement = (payload) => {
    if (requirementDialog?._id) updateRequirementMutation.mutate({ requirementId: requirementDialog._id, ...payload });
    else createRequirementMutation.mutate(payload);
  };
  const selectTab = (key) => {
    if (key === 'overview') navigate(`/dashboard/assigned-events/${eventId}`);
    else if (key === 'functions') navigate(`/dashboard/assigned-events/${eventId}/plan/functions`);
    else if (key === 'services') navigate(`/dashboard/assigned-events/${eventId}/plan/services`);
    else if (key === 'preferences') navigate(`/dashboard/assigned-events/${eventId}/plan/preferences`);
    else if (key === 'approvals') navigate(`/dashboard/assigned-events/${eventId}/plan/approvals`);
    else if (key === 'operations') navigate(`/dashboard/assigned-events/${eventId}/operations`);
    else if (!['plan', 'guests'].includes(key)) toast.info(`${key === 'finance' ? 'Finance & Files' : key[0].toUpperCase() + key.slice(1)} section will be available here.`);
  };

  return (
    <div className="crm-page min-h-screen space-y-4 p-3 sm:p-4 lg:p-5">
      <EventFunctionsHeader booking={booking} metrics={metrics} onBack={() => navigate('/dashboard/assigned-events')} onEdit={() => setEditBookingOpen(true)} onMarkReady={() => readyMutation.mutate()} onOpenPlanning={() => document.getElementById('guests-overview')?.scrollIntoView({ behavior: 'smooth' })} />
      <EventDetailTabs activePrimary="plan" activePlan="guests" showPlanTabs onSelect={selectTab} />
      <EventGuestsPanels functions={functions} requirements={requirements} peakGuests={peakGuests} onUpdateCounts={() => setCountsOpen(true)} onAddRequirement={() => setRequirementDialog({})} onEditRequirement={setRequirementDialog} onUnavailable={(key, label) => key === 'list' ? navigate(`/dashboard/assigned-events/${eventId}/plan/guests/list`) : key === 'accommodation' ? navigate(`/dashboard/assigned-events/${eventId}/plan/guests/accommodation`) : key === 'transport' ? navigate(`/dashboard/assigned-events/${eventId}/plan/guests/transport`) : key === 'hospitality' ? navigate(`/dashboard/assigned-events/${eventId}/plan/guests/hospitality`) : toast.info(`${label} will be available here.`)} />

      <EventGuestCountsDialog open={countsOpen} onOpenChange={setCountsOpen} functions={functions} saving={guestCountsMutation.isPending} onSave={(rows) => guestCountsMutation.mutate(rows)} />
      <EventHospitalityDialog open={Boolean(requirementDialog)} onOpenChange={(open) => !open && setRequirementDialog(null)} item={requirementDialog} functions={functions} employees={employees} saving={createRequirementMutation.isPending || updateRequirementMutation.isPending} onSave={saveRequirement} />
      <EditBookingDialog open={editBookingOpen} onOpenChange={setEditBookingOpen} booking={booking} employees={employees} saving={updateBookingMutation.isPending} onSave={(payload) => updateBookingMutation.mutate(payload)} />
    </div>
  );
}
