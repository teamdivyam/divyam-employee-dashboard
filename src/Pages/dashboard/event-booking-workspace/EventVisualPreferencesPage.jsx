import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import AdminService from '../../../services/event-booking-workspace.service';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import AddVisualPreferenceDialog from './components/AddVisualPreferenceDialog';
import {
  EditBookingDialog,
  getBookingDetail,
  getEmployees,
} from './components/EventBookingComponents';
import { getEventVisualPreferences, getFinalPreferenceCount } from './eventBookingDashboard.utils';
import { getEventServiceNames, normalizeEventVisualPreference } from './eventRecordAdapters';
import EventDetailTabs from './components/EventDetailTabs';
import EventFunctionsHeader from './components/EventFunctionsHeader';
import EventVisualPreferencesPanel from './components/EventVisualPreferencesPanel';

export default function EventVisualPreferencesPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [preferenceOpen, setPreferenceOpen] = useState(false);
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
  const preferenceMutation = useMutation({
    mutationFn: ({ customerId, formData }) => AdminService.adminAddCustomerPreference({ eventId, customerId, formData }),
    onSuccess: (_, { customerId }) => {
      toast.success('Visual preference added');
      setPreferenceOpen(false);
      queryClient.invalidateQueries({ queryKey: ['client-detail', customerId] });
      queryClient.invalidateQueries({ queryKey: ['event-activities', eventId] });
      refresh();
    },
    onError: (error) => toast.error(error.response?.data?.validationError?.[0]?.message || error.response?.data?.message || 'Unable to add visual preference'),
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
  const preferences = useMemo(() => getEventVisualPreferences(booking).map((item) => normalizeEventVisualPreference(item, functions)), [booking, functions]);
  const services = useMemo(() => getEventServiceNames(booking), [booking]);
  const metrics = useMemo(() => ({
    functions: functions.length,
    services: services.length,
    peakGuests: Math.max(Number(booking?.guestCount || 0), ...functions.map((item) => Number(item.guestCount || 0))),
    preferences: getFinalPreferenceCount(booking),
    approvals: (booking?.approvals || []).filter((item) => item.status === 'Pending').length + (booking?.finance?.approvalStatus === 'Pending' ? 1 : 0),
  }), [booking, functions, services]);

  if (bookingQuery.isLoading) return <div className="crm-page grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!booking) return <div className="crm-page p-5"><Card className="crm-card"><CardContent className="p-8 text-center"><p className="font-semibold">Event booking not found</p><Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/assigned-events')}>Back to bookings</Button></CardContent></Card></div>;

  const linkedCustomer = booking.customer && typeof booking.customer === 'object' ? booking.customer : {};
  const customerId = linkedCustomer._id || (typeof booking.customer === 'string' ? booking.customer : '');
  const preferenceCustomer = {
    ...linkedCustomer,
    eventType: booking.eventType,
    eventTitle: booking.eventName,
    eventDate: booking.eventDate,
    functionDetails: functions,
    serviceDetails: booking.servicesSelected || [],
    assignedEmployee: booking.assignedManager,
    leadStatus: 'Booked',
  };
  const selectTab = (key) => {
    if (key === 'overview') navigate(`/dashboard/assigned-events/${eventId}`);
    else if (key === 'functions') navigate(`/dashboard/assigned-events/${eventId}/plan/functions`);
    else if (key === 'services') navigate(`/dashboard/assigned-events/${eventId}/plan/services`);
    else if (key === 'guests') navigate(`/dashboard/assigned-events/${eventId}/plan/guests`);
    else if (key === 'approvals') navigate(`/dashboard/assigned-events/${eventId}/plan/approvals`);
    else if (key === 'operations') navigate(`/dashboard/assigned-events/${eventId}/operations`);
    else if (!['plan', 'preferences'].includes(key)) toast.info(`${key === 'finance' ? 'Finance & Files' : key[0].toUpperCase() + key.slice(1)} section will be available here.`);
  };
  const openPreferenceDialog = () => {
    if (!customerId) return toast.error('This booking is not linked to a CRM client.');
    setPreferenceOpen(true);
  };

  return (
    <div className="crm-page min-h-screen space-y-4 p-3 sm:p-4 lg:p-5">
      <EventFunctionsHeader booking={booking} metrics={metrics} onBack={() => navigate('/dashboard/assigned-events')} onEdit={() => setEditBookingOpen(true)} onMarkReady={() => readyMutation.mutate()} onOpenPlanning={() => document.getElementById('visual-preferences')?.scrollIntoView({ behavior: 'smooth' })} />
      <EventDetailTabs activePrimary="plan" activePlan="preferences" showPlanTabs onSelect={selectTab} />
      <EventVisualPreferencesPanel preferences={preferences} functions={functions} onAdd={openPreferenceDialog} />

      <AddVisualPreferenceDialog open={preferenceOpen} onOpenChange={setPreferenceOpen} customer={preferenceCustomer} isSaving={preferenceMutation.isPending} onSubmit={(formData) => preferenceMutation.mutate({ customerId, formData })} />
      <EditBookingDialog open={editBookingOpen} onOpenChange={setEditBookingOpen} booking={booking} employees={employees} saving={updateBookingMutation.isPending} onSave={(payload) => updateBookingMutation.mutate(payload)} />
    </div>
  );
}
