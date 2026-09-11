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
import EventAccommodationPanel from './components/EventAccommodationPanel';
import EventDetailTabs from './components/EventDetailTabs';
import EventFunctionsHeader from './components/EventFunctionsHeader';
import EventPropertyDialog from './components/EventPropertyDialog';
import EventStayDialog from './components/EventStayDialog';

const idOf = (value) => String(value?._id || value || '');

export default function EventAccommodationPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [propertyDialog, setPropertyDialog] = useState(null);
  const [stayDialog, setStayDialog] = useState(null);
  const [editBookingOpen, setEditBookingOpen] = useState(false);

  const bookingQuery = useQuery({ queryKey: ['event-booking-detail', eventId], queryFn: async () => (await AdminService.getEventBookingDetail({ eventId })).data, enabled: Boolean(eventId) });
  const managersQuery = useQuery({ queryKey: ['event-booking-managers'], queryFn: async () => (await AdminService.getEventBookingManagers({ limit: 100 })).data });
  const refresh = () => bookingQuery.refetch();
  const createPropertyMutation = useMutation({ mutationFn: (payload) => AdminService.addEventAccommodationProperty({ eventId, ...payload }), onSuccess: () => { toast.success('Property added'); setPropertyDialog(null); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to add property') });
  const updatePropertyMutation = useMutation({ mutationFn: ({ propertyId, ...payload }) => AdminService.updateEventAccommodationProperty({ eventId, propertyId, ...payload }), onSuccess: () => { toast.success('Property updated'); setPropertyDialog(null); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to update property') });
  const createStayMutation = useMutation({ mutationFn: (payload) => AdminService.addEventStayAllocation({ eventId, ...payload }), onSuccess: () => { toast.success('Stay allocated'); setStayDialog(null); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to allocate stay') });
  const updateStayMutation = useMutation({ mutationFn: ({ allocationId, ...payload }) => AdminService.updateEventStayAllocation({ eventId, allocationId, ...payload }), onSuccess: () => { toast.success('Stay allocation updated'); setStayDialog(null); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to update stay') });
  const updateBookingMutation = useMutation({ mutationFn: (payload) => AdminService.updateEventBooking({ eventId, ...payload }), onSuccess: () => { toast.success('Booking updated'); setEditBookingOpen(false); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to update booking') });
  const readyMutation = useMutation({ mutationFn: () => AdminService.markEventExecutionReady({ eventId }), onSuccess: () => { toast.success('Event marked execution ready'); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to mark event ready') });

  const booking = getBookingDetail(bookingQuery.data);
  const employees = getEmployees(managersQuery.data);
  const functions = useMemo(() => booking?.functions || [], [booking]);
  const guests = useMemo(() => booking?.guestList || [], [booking]);
  const properties = useMemo(() => booking?.accommodationProperties || [], [booking]);
  const storedAllocations = useMemo(() => booking?.stayAllocations || [], [booking]);
  const stayGuests = useMemo(() => guests.filter((item) => item.stayRequired || (item.hospitalityNeeds || []).includes('Stay')), [guests]);
  const allocations = useMemo(() => {
    const allocatedGuestIds = new Set(storedAllocations.map((item) => idOf(item.guest)));
    const pending = stayGuests.filter((guest) => !allocatedGuestIds.has(idOf(guest))).map((guest) => ({ guest: guest._id, guestCount: guest.memberCount || 1, status: 'Pending Allocation', roomNumbers: [], isPendingProjection: true }));
    return [...storedAllocations, ...pending];
  }, [stayGuests, storedAllocations]);
  const services = useMemo(() => Array.from(new Set([...(booking?.servicesRequired || []), ...(booking?.servicesSelected || []).map((item) => item.service).filter(Boolean)])), [booking]);
  const peakGuests = Math.max(Number(booking?.guestCount || 0), ...functions.map((item) => Number(item.guestCount || 0)));
  const metrics = useMemo(() => ({ functions: functions.length, services: services.length, peakGuests, preferences: getFinalPreferenceCount(booking), approvals: (booking?.approvals || []).filter((item) => item.status === 'Pending').length + (booking?.finance?.approvalStatus === 'Pending' ? 1 : 0) }), [booking, functions, peakGuests, services]);

  if (bookingQuery.isLoading) return <div className="crm-page grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!booking) return <div className="crm-page p-5"><Card className="crm-card"><CardContent className="p-8 text-center"><p className="font-semibold">Event booking not found</p><Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/assigned-events')}>Back to bookings</Button></CardContent></Card></div>;

  const saveProperty = (payload) => propertyDialog?._id ? updatePropertyMutation.mutate({ propertyId: propertyDialog._id, ...payload }) : createPropertyMutation.mutate(payload);
  const saveStay = (payload) => stayDialog?._id ? updateStayMutation.mutate({ allocationId: stayDialog._id, ...payload }) : createStayMutation.mutate(payload);
  const selectEventTab = (key) => {
    if (key === 'overview') navigate(`/dashboard/assigned-events/${eventId}`);
    else if (key === 'functions') navigate(`/dashboard/assigned-events/${eventId}/plan/functions`);
    else if (key === 'services') navigate(`/dashboard/assigned-events/${eventId}/plan/services`);
    else if (key === 'preferences') navigate(`/dashboard/assigned-events/${eventId}/plan/preferences`);
    else if (key === 'approvals') navigate(`/dashboard/assigned-events/${eventId}/plan/approvals`);
    else if (key === 'operations') navigate(`/dashboard/assigned-events/${eventId}/operations`);
    else if (!['plan', 'guests'].includes(key)) toast.info(`${key === 'finance' ? 'Finance & Files' : key[0].toUpperCase() + key.slice(1)} section will be available here.`);
  };
  const selectGuestTab = (key, label) => {
    if (key === 'counts') navigate(`/dashboard/assigned-events/${eventId}/plan/guests`);
    else if (key === 'list') navigate(`/dashboard/assigned-events/${eventId}/plan/guests/list`);
    else if (key === 'transport') navigate(`/dashboard/assigned-events/${eventId}/plan/guests/transport`);
    else if (key === 'hospitality') navigate(`/dashboard/assigned-events/${eventId}/plan/guests/hospitality`);
    else if (key !== 'accommodation') toast.info(`${label} will be available here.`);
  };

  return <div className="crm-page min-h-screen space-y-4 p-3 sm:p-4 lg:p-5"><EventFunctionsHeader booking={booking} metrics={metrics} onBack={() => navigate('/dashboard/assigned-events')} onEdit={() => setEditBookingOpen(true)} onMarkReady={() => readyMutation.mutate()} onOpenPlanning={() => document.getElementById('accommodation-plan')?.scrollIntoView({ behavior: 'smooth' })} /><EventDetailTabs activePrimary="plan" activePlan="guests" showPlanTabs onSelect={selectEventTab} /><EventAccommodationPanel allocations={allocations} guests={guests} properties={properties} onGuestTab={selectGuestTab} onAllocate={() => setStayDialog({})} onEditAllocation={setStayDialog} onAddProperty={() => setPropertyDialog({})} onEditProperty={setPropertyDialog} /><EventPropertyDialog open={Boolean(propertyDialog)} onOpenChange={(open) => !open && setPropertyDialog(null)} item={propertyDialog} saving={createPropertyMutation.isPending || updatePropertyMutation.isPending} onSave={saveProperty} /><EventStayDialog open={Boolean(stayDialog)} onOpenChange={(open) => !open && setStayDialog(null)} item={stayDialog} guests={stayGuests.length ? stayGuests : guests} properties={properties} saving={createStayMutation.isPending || updateStayMutation.isPending} onSave={saveStay} /><EditBookingDialog open={editBookingOpen} onOpenChange={setEditBookingOpen} booking={booking} employees={employees} saving={updateBookingMutation.isPending} onSave={(payload) => updateBookingMutation.mutate(payload)} /></div>;
}
