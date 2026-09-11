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
import EventGuestDialog from './components/EventGuestDialog';
import EventGuestImportDialog from './components/EventGuestImportDialog';
import EventGuestListPanel from './components/EventGuestListPanel';

export default function EventGuestListPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [guestDialog, setGuestDialog] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [editBookingOpen, setEditBookingOpen] = useState(false);

  const bookingQuery = useQuery({ queryKey: ['event-booking-detail', eventId], queryFn: async () => (await AdminService.getEventBookingDetail({ eventId })).data, enabled: Boolean(eventId) });
  const managersQuery = useQuery({ queryKey: ['event-booking-managers'], queryFn: async () => (await AdminService.getEventBookingManagers({ limit: 100 })).data });
  const refresh = () => bookingQuery.refetch();
  const createMutation = useMutation({ mutationFn: (payload) => AdminService.addEventGuest({ eventId, ...payload }), onSuccess: () => { toast.success('Guest added'); setGuestDialog(null); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to add guest') });
  const updateGuestMutation = useMutation({ mutationFn: ({ guestId, ...payload }) => AdminService.updateEventGuest({ eventId, guestId, ...payload }), onSuccess: () => { toast.success('Guest updated'); setGuestDialog(null); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to update guest') });
  const importMutation = useMutation({ mutationFn: (records) => Promise.all(records.map((payload) => AdminService.addEventGuest({ eventId, ...payload }))), onSuccess: (_, records) => { toast.success(`${records.length} guest record${records.length === 1 ? '' : 's'} imported`); setImportOpen(false); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to import guest list') });
  const updateBookingMutation = useMutation({ mutationFn: (payload) => AdminService.updateEventBooking({ eventId, ...payload }), onSuccess: () => { toast.success('Booking updated'); setEditBookingOpen(false); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to update booking') });
  const readyMutation = useMutation({ mutationFn: () => AdminService.markEventExecutionReady({ eventId }), onSuccess: () => { toast.success('Event marked execution ready'); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to mark event ready') });

  const booking = getBookingDetail(bookingQuery.data);
  const employees = getEmployees(managersQuery.data);
  const functions = useMemo(() => booking?.functions || [], [booking]);
  const guests = useMemo(() => booking?.guestList || [], [booking]);
  const services = useMemo(() => Array.from(new Set([...(booking?.servicesRequired || []), ...(booking?.servicesSelected || []).map((item) => item.service).filter(Boolean)])), [booking]);
  const peakGuests = Math.max(Number(booking?.guestCount || 0), ...functions.map((item) => Number(item.guestCount || 0)));
  const metrics = useMemo(() => ({ functions: functions.length, services: services.length, peakGuests, preferences: getFinalPreferenceCount(booking), approvals: (booking?.approvals || []).filter((item) => item.status === 'Pending').length + (booking?.finance?.approvalStatus === 'Pending' ? 1 : 0) }), [booking, functions, peakGuests, services]);

  if (bookingQuery.isLoading) return <div className="crm-page grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!booking) return <div className="crm-page p-5"><Card className="crm-card"><CardContent className="p-8 text-center"><p className="font-semibold">Event booking not found</p><Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/assigned-events')}>Back to bookings</Button></CardContent></Card></div>;

  const saveGuest = (payload) => guestDialog?._id ? updateGuestMutation.mutate({ guestId: guestDialog._id, ...payload }) : createMutation.mutate(payload);
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
    else if (key === 'accommodation') navigate(`/dashboard/assigned-events/${eventId}/plan/guests/accommodation`);
    else if (key === 'transport') navigate(`/dashboard/assigned-events/${eventId}/plan/guests/transport`);
    else if (key === 'hospitality') navigate(`/dashboard/assigned-events/${eventId}/plan/guests/hospitality`);
    else if (key !== 'list') toast.info(`${label} will be available here.`);
  };

  return (
    <div className="crm-page min-h-screen space-y-4 p-3 sm:p-4 lg:p-5">
      <EventFunctionsHeader booking={booking} metrics={metrics} onBack={() => navigate('/dashboard/assigned-events')} onEdit={() => setEditBookingOpen(true)} onMarkReady={() => readyMutation.mutate()} onOpenPlanning={() => document.getElementById('guest-list')?.scrollIntoView({ behavior: 'smooth' })} />
      <EventDetailTabs activePrimary="plan" activePlan="guests" showPlanTabs onSelect={selectEventTab} />
      <EventGuestListPanel guests={guests} functions={functions} onGuestTab={selectGuestTab} onAdd={() => setGuestDialog({})} onEdit={setGuestDialog} onImport={() => setImportOpen(true)} />

      <EventGuestDialog open={Boolean(guestDialog)} onOpenChange={(open) => !open && setGuestDialog(null)} item={guestDialog} functions={functions} saving={createMutation.isPending || updateGuestMutation.isPending} onSave={saveGuest} />
      <EventGuestImportDialog open={importOpen} onOpenChange={setImportOpen} functions={functions} saving={importMutation.isPending} onImport={(records) => records.length ? importMutation.mutate(records) : toast.error('No valid guest rows found in the CSV file')} />
      <EditBookingDialog open={editBookingOpen} onOpenChange={setEditBookingOpen} booking={booking} employees={employees} saving={updateBookingMutation.isPending} onSave={(payload) => updateBookingMutation.mutate(payload)} />
    </div>
  );
}
