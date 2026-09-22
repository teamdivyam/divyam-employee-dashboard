import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import AdminService from '../../../services/event-booking-workspace.service';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { EditBookingDialog, getBookingDetail, getEmployees } from './components/EventBookingComponents';
import EventApprovalDetailDialog from './components/EventApprovalDetailDialog';
import EventApprovalDialog from './components/EventApprovalDialog';
import EventApprovalsPanel from './components/EventApprovalsPanel';
import EventDetailTabs from './components/EventDetailTabs';
import EventFunctionsHeader from './components/EventFunctionsHeader';
import { getFinalPreferenceCount } from './eventBookingDashboard.utils';

export default function EventClientApprovalsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('Pending');
  const [editBookingOpen, setEditBookingOpen] = useState(false);

  const bookingQuery = useQuery({ queryKey: ['event-booking-detail', eventId], queryFn: async () => (await AdminService.getEventBookingDetail({ eventId })).data, enabled: Boolean(eventId) });
  const managersQuery = useQuery({ queryKey: ['event-booking-managers'], queryFn: async () => (await AdminService.getEventBookingManagers({ limit: 100 })).data });
  const refresh = () => bookingQuery.refetch();
  const createMutation = useMutation({
    mutationFn: (formData) => AdminService.addEventClientApproval({ eventId, formData }),
    onSuccess: () => { toast.success('Approval request added'); setCreateOpen(false); refresh(); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to add approval request'),
  });
  const updateApprovalMutation = useMutation({
    mutationFn: ({ approvalId, ...payload }) => AdminService.updateEventClientApproval({ eventId, approvalId, ...payload }),
    onSuccess: () => { toast.success('Approval status updated'); setSelectedApproval(null); refresh(); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update approval request'),
  });
  const updateBookingMutation = useMutation({ mutationFn: (payload) => AdminService.updateEventBooking({ eventId, ...payload }), onSuccess: () => { toast.success('Booking updated'); setEditBookingOpen(false); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to update booking') });
  const readyMutation = useMutation({ mutationFn: () => AdminService.markEventExecutionReady({ eventId }), onSuccess: () => { toast.success('Event marked execution ready'); refresh(); }, onError: (error) => toast.error(error.response?.data?.message || 'Unable to mark event ready') });

  const booking = getBookingDetail(bookingQuery.data);
  const employees = getEmployees(managersQuery.data);
  const functions = useMemo(() => booking?.functions || [], [booking]);
  const services = useMemo(() => Array.from(new Set([...(booking?.servicesRequired || []), ...(booking?.servicesSelected || []).map((item) => item.name || item.service).filter(Boolean)])), [booking]);
  const approvals = useMemo(() => booking?.approvals || [], [booking]);
  const metrics = useMemo(() => ({
    functions: functions.length,
    services: services.length,
    peakGuests: Math.max(Number(booking?.guestCount || 0), ...functions.map((item) => Number(item.guestCount || 0))),
    preferences: getFinalPreferenceCount(booking),
    approvals: approvals.filter((item) => item.status === 'Pending').length,
  }), [approvals, booking, functions, services]);

  if (bookingQuery.isLoading) return <div className="crm-page grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!booking) return <div className="crm-page p-5"><Card className="crm-card"><CardContent className="p-8 text-center"><p className="font-semibold">Event booking not found</p><Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/assigned-events')}>Back to bookings</Button></CardContent></Card></div>;

  const selectTab = (key) => {
    if (key === 'overview') navigate(`/dashboard/assigned-events/${eventId}`);
    else if (key === 'functions') navigate(`/dashboard/assigned-events/${eventId}/plan/functions`);
    else if (key === 'services') navigate(`/dashboard/assigned-events/${eventId}/plan/services`);
    else if (key === 'guests') navigate(`/dashboard/assigned-events/${eventId}/plan/guests`);
    else if (key === 'preferences') navigate(`/dashboard/assigned-events/${eventId}/plan/preferences`);
    else if (key === 'operations') navigate(`/dashboard/assigned-events/${eventId}/operations`);
    else if (!['plan', 'approvals'].includes(key)) toast.info(`${key === 'finance' ? 'Finance & Files' : key[0].toUpperCase() + key.slice(1)} section will be available here.`);
  };
  const viewApproval = (item) => { setSelectedApproval(item); setSelectedStatus(item.status || 'Pending'); };
  const changeApprovalStatus = (status, save = false) => {
    setSelectedStatus(status);
    if (save && selectedApproval?._id) updateApprovalMutation.mutate({ approvalId: selectedApproval._id, status });
  };

  return (
    <div className="crm-page min-h-screen space-y-4 p-3 sm:p-4 lg:p-5">
      <EventFunctionsHeader booking={booking} metrics={metrics} onBack={() => navigate('/dashboard/assigned-events')} onEdit={() => setEditBookingOpen(true)} onMarkReady={() => readyMutation.mutate()} onOpenPlanning={() => document.getElementById('client-approvals')?.scrollIntoView({ behavior: 'smooth' })} />
      <EventDetailTabs activePrimary="plan" activePlan="approvals" showPlanTabs onSelect={selectTab} />
      <EventApprovalsPanel approvals={approvals} functions={functions} onAdd={() => setCreateOpen(true)} onView={viewApproval} />

      <EventApprovalDialog open={createOpen} onOpenChange={setCreateOpen} functions={functions} saving={createMutation.isPending} onSave={(formData) => createMutation.mutate(formData)} />
      <EventApprovalDetailDialog open={Boolean(selectedApproval)} onOpenChange={(open) => !open && setSelectedApproval(null)} item={selectedApproval} status={selectedStatus} onStatusChange={changeApprovalStatus} saving={updateApprovalMutation.isPending} />
      <EditBookingDialog open={editBookingOpen} onOpenChange={setEditBookingOpen} booking={booking} employees={employees} saving={updateBookingMutation.isPending} onSave={(payload) => updateBookingMutation.mutate(payload)} />
    </div>
  );
}
