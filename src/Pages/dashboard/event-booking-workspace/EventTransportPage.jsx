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
import { getEventServiceNames, normalizeEventTransportAssignment, normalizeEventVehicle } from './eventRecordAdapters';
import EventDetailTabs from './components/EventDetailTabs';
import EventFunctionsHeader from './components/EventFunctionsHeader';
import EventTransportDialog from './components/EventTransportDialog';
import EventTransportPanel from './components/EventTransportPanel';
import EventVehicleDialog from './components/EventVehicleDialog';

const idOf = (value) => String(value?._id || value || '');

export default function EventTransportPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [vehicleDialog, setVehicleDialog] = useState(null);
  const [transportDialog, setTransportDialog] = useState(null);
  const [editBookingOpen, setEditBookingOpen] = useState(false);

  const bookingQuery = useQuery({ queryKey: ['event-booking-detail', eventId], queryFn: async () => (await AdminService.getEventBookingDetail({ eventId })).data, enabled: Boolean(eventId) });
  const managersQuery = useQuery({ queryKey: ['event-booking-managers'], queryFn: async () => (await AdminService.getEventBookingManagers({ limit: 100 })).data });
  const refresh = () => bookingQuery.refetch();
  const createVehicleMutation = useMutation({ mutationFn: (payload) => AdminService.addEventTransportVehicle({ eventId, ...payload }), onSuccess: () => { toast.success('Vehicle added'); setVehicleDialog(null); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to add vehicle') });
  const updateVehicleMutation = useMutation({ mutationFn: ({ vehicleId, ...payload }) => AdminService.updateEventTransportVehicle({ eventId, vehicleId, ...payload }), onSuccess: () => { toast.success('Vehicle updated'); setVehicleDialog(null); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to update vehicle') });
  const createTransportMutation = useMutation({ mutationFn: (payload) => AdminService.addEventTransportAssignment({ eventId, ...payload }), onSuccess: () => { toast.success('Transport assignment added'); setTransportDialog(null); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to add transport') });
  const updateTransportMutation = useMutation({ mutationFn: ({ assignmentId, ...payload }) => AdminService.updateEventTransportAssignment({ eventId, assignmentId, ...payload }), onSuccess: () => { toast.success('Transport assignment updated'); setTransportDialog(null); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to update transport') });
  const updateBookingMutation = useMutation({ mutationFn: (payload) => AdminService.updateEventBooking({ eventId, ...payload }), onSuccess: () => { toast.success('Booking updated'); setEditBookingOpen(false); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to update booking') });
  const readyMutation = useMutation({ mutationFn: () => AdminService.markEventExecutionReady({ eventId }), onSuccess: () => { toast.success('Event marked execution ready'); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to mark event ready') });

  const booking = getBookingDetail(bookingQuery.data);
  const employees = getEmployees(managersQuery.data);
  const functions = useMemo(() => booking?.functions || [], [booking]);
  const guests = useMemo(() => booking?.guestList || [], [booking]);
  const vehicles = useMemo(() => (booking?.transportVehicles || []).map(normalizeEventVehicle), [booking]);
  const storedAssignments = useMemo(() => (booking?.transportAssignments || []).map(normalizeEventTransportAssignment), [booking]);
  const transportGuests = useMemo(() => guests.filter((item) => item.transportRequired || (item.hospitalityNeeds || []).some((need) => /pickup|drop|transport|transfer/i.test(need))), [guests]);
  const assignments = useMemo(() => {
    const assignedGuestIds = new Set(storedAssignments.map((item) => idOf(item.guest)));
    const pending = transportGuests.filter((guest) => !assignedGuestIds.has(idOf(guest))).map((guest) => ({ guest: guest._id, guestCount: guest.memberCount || 1, status: 'Pending Assignment', isPendingProjection: true }));
    return [...storedAssignments, ...pending];
  }, [storedAssignments, transportGuests]);
  const services = useMemo(() => getEventServiceNames(booking), [booking]);
  const peakGuests = Math.max(Number(booking?.guestCount || 0), ...functions.map((item) => Number(item.guestCount || 0)));
  const metrics = useMemo(() => ({ functions: functions.length, services: services.length, peakGuests, preferences: getFinalPreferenceCount(booking), approvals: (booking?.approvals || []).filter((item) => item.status === 'Pending').length + (booking?.finance?.approvalStatus === 'Pending' ? 1 : 0) }), [booking, functions, peakGuests, services]);

  if (bookingQuery.isLoading) return <div className="crm-page grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!booking) return <div className="crm-page p-5"><Card className="crm-card"><CardContent className="p-8 text-center"><p className="font-semibold">Event booking not found</p><Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/assigned-events')}>Back to bookings</Button></CardContent></Card></div>;

  const saveVehicle = (payload) => vehicleDialog?._id ? updateVehicleMutation.mutate({ vehicleId: vehicleDialog._id, ...payload }) : createVehicleMutation.mutate(payload);
  const saveTransport = (payload) => transportDialog?._id ? updateTransportMutation.mutate({ assignmentId: transportDialog._id, ...payload }) : createTransportMutation.mutate(payload);
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
    else if (key === 'accommodation') navigate(`/dashboard/assigned-events/${eventId}/plan/guests/accommodation`);
    else if (key === 'hospitality') navigate(`/dashboard/assigned-events/${eventId}/plan/guests/hospitality`);
    else if (key !== 'transport') toast.info(`${label} will be available here.`);
  };

  return <div className="crm-page min-h-screen space-y-4 p-3 sm:p-4 lg:p-5"><EventFunctionsHeader booking={booking} metrics={metrics} onBack={() => navigate('/dashboard/assigned-events')} onEdit={() => setEditBookingOpen(true)} onMarkReady={() => readyMutation.mutate()} onOpenPlanning={() => document.getElementById('transport-plan')?.scrollIntoView({ behavior: 'smooth' })} /><EventDetailTabs activePrimary="plan" activePlan="guests" showPlanTabs onSelect={selectEventTab} /><EventTransportPanel assignments={assignments} guests={guests} vehicles={vehicles} onGuestTab={selectGuestTab} onAddTransport={() => setTransportDialog({})} onEditTransport={setTransportDialog} onAddVehicle={() => setVehicleDialog({})} onEditVehicle={setVehicleDialog} /><EventVehicleDialog open={Boolean(vehicleDialog)} onOpenChange={(open) => !open && setVehicleDialog(null)} item={vehicleDialog} saving={createVehicleMutation.isPending || updateVehicleMutation.isPending} onSave={saveVehicle} /><EventTransportDialog open={Boolean(transportDialog)} onOpenChange={(open) => !open && setTransportDialog(null)} item={transportDialog} guests={guests} vehicles={vehicles} saving={createTransportMutation.isPending || updateTransportMutation.isPending} onSave={saveTransport} /><EditBookingDialog open={editBookingOpen} onOpenChange={setEditBookingOpen} booking={booking} employees={employees} saving={updateBookingMutation.isPending} onSave={(payload) => updateBookingMutation.mutate(payload)} /></div>;
}
