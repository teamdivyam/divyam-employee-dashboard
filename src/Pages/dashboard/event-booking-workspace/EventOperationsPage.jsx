import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import AdminService from '../../../services/event-booking-workspace.service';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { EditBookingDialog, getBookingDetail, getEmployees } from './components/EventBookingComponents';
import EventDetailTabs from './components/EventDetailTabs';
import EventFunctionsHeader from './components/EventFunctionsHeader';
import EventOperationsPanel from './components/EventOperationsPanel';
import EventTeamDialog from './components/EventTeamDialog';
import { getFinalPreferenceCount } from './eventBookingDashboard.utils';

const idOf = (value) => String(value?._id || value || '');

export default function EventOperationsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [teamOpen, setTeamOpen] = useState(false);
  const [editBookingOpen, setEditBookingOpen] = useState(false);

  const bookingQuery = useQuery({ queryKey: ['event-booking-detail', eventId], queryFn: async () => (await AdminService.getEventBookingDetail({ eventId })).data, enabled: Boolean(eventId) });
  const managersQuery = useQuery({ queryKey: ['event-booking-managers'], queryFn: async () => (await AdminService.getEventBookingManagers({ limit: 100 })).data });
  const refresh = () => bookingQuery.refetch();
  const teamMutation = useMutation({ mutationFn: (payload) => AdminService.addEventTeamMember({ eventId, ...payload }), onSuccess: () => { toast.success('Team member added'); setTeamOpen(false); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to add team member') });
  const updateBookingMutation = useMutation({ mutationFn: (payload) => AdminService.updateEventBooking({ eventId, ...payload }), onSuccess: () => { toast.success('Booking updated'); setEditBookingOpen(false); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to update booking') });
  const readyMutation = useMutation({ mutationFn: () => AdminService.markEventExecutionReady({ eventId }), onSuccess: () => { toast.success('Event marked execution ready'); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to mark event ready') });

  const booking = getBookingDetail(bookingQuery.data);
  const employees = getEmployees(managersQuery.data);
  const functions = useMemo(() => booking?.functions || [], [booking]);
  const services = useMemo(() => Array.from(new Set([...(booking?.servicesRequired || []), ...(booking?.servicesSelected || []).map((item) => item.service).filter(Boolean)])), [booking]);
  const team = useMemo(() => {
    if (!booking) return [];
    const members = [...(booking.assignedTeam || [])];
    const managerId = idOf(booking.assignedManager);
    if (managerId && !members.some((member) => idOf(member.employee) === managerId)) members.unshift({ _id: `manager-${managerId}`, employee: booking.assignedManager, role: 'Event Manager', isPrimary: true });
    return members;
  }, [booking]);
  const assignedIds = useMemo(() => team.map((member) => idOf(member.employee)).filter(Boolean), [team]);
  const metrics = useMemo(() => ({
    functions: functions.length,
    services: services.length,
    peakGuests: Math.max(Number(booking?.guestCount || 0), ...functions.map((item) => Number(item.guestCount || 0))),
    preferences: getFinalPreferenceCount(booking),
    approvals: (booking?.approvals || []).filter((item) => item.status === 'Pending').length,
  }), [booking, functions, services]);

  if (bookingQuery.isLoading) return <div className="crm-page grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!booking) return <div className="crm-page p-5"><Card className="crm-card"><CardContent className="p-8 text-center"><p className="font-semibold">Event booking not found</p><Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/assigned-events')}>Back to bookings</Button></CardContent></Card></div>;

  const selectTab = (key) => {
    if (key === 'overview') navigate(`/dashboard/assigned-events/${eventId}`);
    else if (key === 'plan') navigate(`/dashboard/assigned-events/${eventId}/plan/functions`);
    else if (key === 'activity') toast.info('Event activity will be available here.');
    else if (key === 'finance') toast.info('Finance & Files will be available here.');
  };

  return (
    <div className="crm-page min-h-screen space-y-3 p-3 sm:p-4 lg:p-5">
      <EventFunctionsHeader booking={booking} metrics={metrics} onBack={() => navigate('/dashboard/assigned-events')} onEdit={() => setEditBookingOpen(true)} onMarkReady={() => readyMutation.mutate()} onOpenPlanning={() => document.getElementById('event-operations')?.scrollIntoView({ behavior: 'smooth' })} primaryActionLabel="Open Operations Plan" />
      <EventDetailTabs activePrimary="operations" onSelect={selectTab} />
      <div id="event-operations"><EventOperationsPanel booking={booking} team={team} onManageTeam={() => setTeamOpen(true)} /></div>

      <EventTeamDialog open={teamOpen} onOpenChange={setTeamOpen} employees={employees} assignedIds={assignedIds} saving={teamMutation.isPending} onSave={(payload) => teamMutation.mutate(payload)} />
      <EditBookingDialog open={editBookingOpen} onOpenChange={setEditBookingOpen} booking={booking} employees={employees} saving={updateBookingMutation.isPending} onSave={(payload) => updateBookingMutation.mutate(payload)} />
    </div>
  );
}
