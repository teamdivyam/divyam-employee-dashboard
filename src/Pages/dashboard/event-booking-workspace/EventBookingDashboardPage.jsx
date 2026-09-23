import { useEffect, useMemo, useReducer, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeIndianRupee,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  List,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import styles from './EventBookingDashboardPage.module.css';

import AdminService from '../../../services/event-booking-workspace.service';
import TabComp from '@components/components/tab-comp';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import {
  getBookings,
  getCustomers,
  getEmployees,
  getTotalPages,
  getTotalRows,
} from './components/EventBookingComponents';
import BookingCalendar from './components/EventBookingCalendar';
import AddBookingDialog from './components/AddBookingDialog';
import { EventBookingDashboardFilters } from './components/EventBookingDashboardFilters';
import EventBookingMetricCard from './components/EventBookingMetricCard';
import EventBookingStatusDialog from './components/EventBookingStatusDialog';
import InactiveBookingTable from './components/InactiveBookingTable';
import BookingTable from './components/BookingTable';
import CompletedBookingTable from './components/CompletedBookingTable';
import TodayBookingTable from './components/TodayBookingTable';
import {
  EMPTY_FILTERS,
  PAGE_SIZE,
  VALID_TABS,
} from './eventBookingDashboard.constants';
import {
  closureDetails,
  dateParam,
  getLiveDetails,
  monthRange,
} from './eventBookingDashboard.utils';

const paginationReducer = (state, action) => {
  if (action.type === 'reset') return { ...state, page: 1 };
  if (action.type === 'previous') return { ...state, page: Math.max(1, state.page - 1) };
  if (action.type === 'next') return { ...state, page: Math.min(state.totalPages, state.page + 1) };
  if (action.type === 'setPage') return { ...state, page: action.page };
  if (action.type === 'setTotal') {
    return { ...state, totalRows: action.totalRows, totalPages: Math.max(1, action.totalPages) };
  }
  return state;
};

const mergeUpdatedBooking = (result, updatedBooking) => {
  if (!result || !updatedBooking?._id) return result;
  const collectionKey = ['events', 'bookings', 'eventBookings']
    .find((key) => Array.isArray(result[key]));
  if (!collectionKey) return result;

  const updatedId = String(updatedBooking._id);
  return {
    ...result,
    [collectionKey]: result[collectionKey].map((booking) => (
      String(booking._id) === updatedId ? { ...booking, ...updatedBooking } : booking
    )),
  };
};


export default function EventBookingDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const now = new Date();
  const requestedTab = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(requestedTab) ? requestedTab : 'all';
  const [layout, setLayout] = useState(searchParams.get('layout') === 'calendar' ? 'calendar' : 'list');
  const [month] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [pagination, dispatch] = useReducer(paginationReducer, { page: 1, totalRows: 0, totalPages: 1 });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [setupBooking, setSetupBooking] = useState(null);
  const [statusBooking, setStatusBooking] = useState(null);
  const range = useMemo(() => {
    const selectedRange = monthRange(month);
    if (filters.dateRange === 'all') return selectedRange;
    if (filters.dateRange === 'first_half') {
      return { ...selectedRange, endDate: dateParam(month.year, month.month, 15) };
    }
    return { ...selectedRange, startDate: dateParam(month.year, month.month, 16) };
  }, [filters.dateRange, month]);

  useEffect(() => {
    if (requestedTab && !VALID_TABS.includes(requestedTab)) {
      const next = new URLSearchParams(searchParams);
      next.delete('tab');
      setSearchParams(next, { replace: true });
    }
  }, [requestedTab, searchParams, setSearchParams]);

  const analyticsQuery = useQuery({
    queryKey: ['event-booking-analytics', range],
    queryFn: async () => (await AdminService.getEventBookingAnalytics(range)).data,
    refetchOnMount: 'always',
  });
  const bookingsQuery = useQuery({
    queryKey: ['event-bookings', activeTab, layout, pagination.page, filters, range],
    queryFn: async () => (await AdminService.getEventBookings({
      page: layout === 'calendar' ? 1 : pagination.page,
      limit: layout === 'calendar' ? 250 : PAGE_SIZE,
      view: activeTab,
      eventType: filters.eventType === 'all' ? undefined : filters.eventType,
      city: filters.city === 'all' ? undefined : filters.city,
      managerId: filters.managerId === 'all' ? undefined : filters.managerId,
      paymentStatus: filters.paymentStatus === 'all' ? undefined : filters.paymentStatus,
      readinessStatus: filters.readinessStatus === 'all' ? undefined : filters.readinessStatus,
      closureStatus: filters.closureStatus === 'all' ? undefined : filters.closureStatus,
      settlementStatus: filters.settlementStatus === 'all' ? undefined : filters.settlementStatus,
      status: filters.status === 'all' ? undefined : filters.status,
      eventDateRange: filters.dateRange === 'all' ? undefined : filters.dateRange,
      search: filters.search.trim() || undefined,
      ...range,
    })).data,
    refetchOnMount: 'always',
  });
  const customersQuery = useQuery({
    queryKey: ['event-booking-customers'],
    queryFn: async () => (await AdminService.adminGetEmployee({
      page: 1,
      limit: 100,
      search: '',
    })).data,
  });
  const employeesQuery = useQuery({
    queryKey: ['event-booking-managers'],
    queryFn: async () => (await AdminService.getEventBookingManagers({ limit: 100 })).data,
  });
  const refreshDashboard = async (updatedBooking) => {
    if (updatedBooking?._id) {
      queryClient.setQueriesData(
        { queryKey: ['event-bookings'] },
        (result) => mergeUpdatedBooking(result, updatedBooking),
      );
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['event-bookings'] }),
      queryClient.invalidateQueries({ queryKey: ['event-booking-analytics'] }),
    ]);
  };
  const bookingFormMutation = useMutation({
    mutationFn: async ({ payload, booking }) => (
      booking && !booking.isCrmOnly
        ? (await AdminService.updateEventBookingForm({ eventId: booking._id, formData: payload })).data
        : (await AdminService.createEventBooking(payload)).data
    ),
    onSuccess: async (response) => {
      toast.success(response?.message || 'Booking created');
      setFormOpen(false);
      setSetupBooking(null);
      await refreshDashboard(response?.event);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Unable to create booking'),
  });
  const markReadyMutation = useMutation({
    mutationFn: async (eventId) => (await AdminService.markEventExecutionReady({
      eventId,
      remarks: 'All final checks completed from the Execution Ready dashboard.',
    })).data,
    onSuccess: async (response) => {
      toast.success(response?.message || 'Event marked execution ready');
      setStatusBooking(null);
      await refreshDashboard(response?.event);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Unable to mark event ready'),
  });
  const revokeReadyMutation = useMutation({
    mutationFn: async (payload) => (await AdminService.revokeEventExecutionReady(payload)).data,
    onSuccess: async (response) => {
      toast.success(response?.message || 'Execution readiness revoked');
      setStatusBooking(null);
      await refreshDashboard(response?.event);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Unable to return event to planning'),
  });
  const resumeMutation = useMutation({
    mutationFn: async (eventId) => (await AdminService.resumeEventBooking({ eventId })).data,
    onSuccess: async (response) => {
      toast.success(response?.message || 'Booking resumed');
      await refreshDashboard(response?.event);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Unable to resume booking'),
  });
  const statusMutation = useMutation({
    mutationFn: async (payload) => (await AdminService.updateEventBooking(payload)).data,
    onSuccess: async (response) => {
      toast.success(response?.message || 'Event status updated');
      setStatusBooking(null);
      await refreshDashboard(response?.event);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Unable to update event status'),
  });
  const analytics = analyticsQuery.data?.analytics || {};
  const cards = analytics.cards || {};
  const counts = analytics.tabs || {};
  const bookings = getBookings(bookingsQuery.data);
  const employees = getEmployees(employeesQuery.data);
  const customers = getCustomers(customersQuery.data);
  const totalRows = getTotalRows(bookingsQuery.data);
  const totalPages = getTotalPages(bookingsQuery.data);
  const cities = useMemo(() => Array.from(new Set([
    'Lucknow', 'Prayagraj', 'Varanasi', 'Kanpur', ...bookings.map((item) => item.city).filter(Boolean),
  ])).sort(), [bookings]);
  const visibleBookings = bookings.filter((booking) => {
    if (activeTab === 'today' && filters.liveStatus !== 'all') {
      return getLiveDetails(booking).key === filters.liveStatus;
    }
    if (activeTab === 'completed' && filters.closureStatus !== 'all') {
      const closure = closureDetails(booking);
      if (filters.closureStatus === 'payment_pending') return closure.paymentPending;
      return closure.key === filters.closureStatus;
    }
    return true;
  });

  useEffect(() => {
    dispatch({ type: 'setTotal', totalRows, totalPages });
  }, [totalRows, totalPages]);

  const setTab = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') next.delete('tab'); else next.set('tab', value);
    setSearchParams(next);
    setFilters(EMPTY_FILTERS);
    dispatch({ type: 'reset' });
  };
  const setPageLayout = (value) => {
    setLayout(value);
    const next = new URLSearchParams(searchParams);
    if (value === 'list') next.delete('layout'); else next.set('layout', value);
    setSearchParams(next);
  };
  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    dispatch({ type: 'reset' });
  };
  const refresh = () => {
    bookingsQuery.refetch();
    analyticsQuery.refetch();
  };
  const openBooking = (booking) => {
    if (booking.isCrmOnly && booking.crmCustomerId) {
      navigate(`/dashboard/assigned-clients/${booking.crmCustomerId}`);
      return;
    }
    openEventOverview(booking);
  };
  const openBookingSetup = (booking = null) => {
    setSetupBooking(booking);
    setFormOpen(true);
  };
  const openEventOverview = (booking) => {
    if (booking?.isCrmOnly) {
      toast.info('Complete this existing CRM booking setup to generate its Event page.');
      openBookingSetup(booking);
      return;
    }
    const eventId = booking?._id;

    if (!eventId) {
      toast.error('Unable to open event overview. Event ID not found.');
      return;
    }

    navigate(`/dashboard/assigned-events/${eventId}`);
  };
  const openWorkspaceAction = (booking, action) => {
    if (booking?.isCrmOnly) {
      openBookingSetup(booking);
      return;
    }
    if (!booking?._id) {
      toast.error('Unable to open booking. Event ID not found.');
      return;
    }
    navigate(`/dashboard/assigned-events/${booking._id}?action=${action}`);
  };
  const openFinanceSection = (booking, section) => {
    if (!booking?._id || booking.isCrmOnly) {
      toast.info('Complete booking setup before opening Finance & Files.');
      return;
    }
    navigate(`/dashboard/assigned-events/${booking._id}/finance?tab=${section}`);
  };
  const openStatusDialog = (booking, initialStatus) => {
    setStatusBooking({ booking, initialStatus });
  };
  const bookingActionProps = {
    openBooking,
    openBookingEdit: (booking) => openWorkspaceAction(booking, 'edit-booking'),
    openManagerAssignment: (booking) => openWorkspaceAction(booking, 'assign-manager'),
    openDocuments: (booking) => openFinanceSection(booking, 'documents'),
    openPayments: (booking) => openFinanceSection(booking, 'payments'),
    openBookingSetup,
    onUpdateStatus: openStatusDialog,
  };

  const metricItems = [
    { label: 'Active Bookings', value: cards.activeBookings ?? cards.totalBookings, icon: CalendarDays, tone: 'blue', tab: 'all' },
    { label: 'Upcoming 30 Days', value: cards.upcoming30Days ?? cards.upcomingEvents, icon: CalendarCheck2, tone: 'green', tab: 'all' },
    { label: 'Planning Attention', value: cards.planningAttention, icon: AlertTriangle, tone: 'amber', tab: 'planning' },
    { label: 'Approvals Pending', value: cards.approvalsPending, icon: ClipboardCheck, tone: 'violet', tab: 'planning' },
    {
      label: 'Payment Attention',
      value: cards.paymentAttention,
      icon: BadgeIndianRupee,
      tone: 'red',
      tab: 'all',
    },
    { label: 'Completed This Month', value: cards.completedThisMonth ?? cards.completedEvents, icon: CheckCircle2, tone: 'green', tab: 'completed' },
  ];
  const tabs = [
    { value: 'all', label: 'All Bookings' },
    { value: 'new', label: 'New Bookings', notificationCount: counts.new },
    { value: 'planning', label: 'In Planning', notificationCount: counts.planning },
    { value: 'execution_ready', label: 'Execution Ready', notificationCount: counts.executionReady },
    { value: 'today', label: 'Live / Today', notificationCount: counts.today },
    { value: 'completed', label: 'Completed', notificationCount: counts.completed },
    { value: 'closed', label: 'On Hold / Cancelled', notificationCount: counts.closed },
  ];
  const startEntry = totalRows ? (pagination.page - 1) * PAGE_SIZE + 1 : 0;
  const endEntry = Math.min(pagination.page * PAGE_SIZE, totalRows);
  const firstVisiblePage = Math.min(Math.max(1, pagination.page - 1), Math.max(1, pagination.totalPages - 2));
  const pages = Array.from({ length: Math.min(3, pagination.totalPages) }, (_, index) => firstVisiblePage + index)
    .filter((page) => page <= pagination.totalPages);
  const todayLabel = `Today, ${new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(now)}`;
  return (
    <div className={`crm-page w-full min-w-0 max-w-full p-3 sm:p-4 lg:p-5 ${layout === 'list' ? styles.listPage : 'min-h-screen overflow-x-hidden'}`}>
      <header className="mb-2 flex shrink-0 justify-end bg-background">
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'today' && (
            <Button variant="outline" className="h-9 gap-2 px-3 text-xs">
              <CalendarDays className="h-4 w-4" /> {todayLabel} <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          )}
          <div className="flex h-9 overflow-hidden rounded-md border border-border bg-card">
            <Button variant="ghost" className={`h-9 rounded-none px-3 text-xs ${layout === 'list' ? 'bg-blue-50 text-blue-700' : ''}`} onClick={() => setPageLayout('list')}>
              <List className="mr-1.5 h-4 w-4" /> List View
            </Button>
            <Button variant="ghost" className={`h-9 rounded-none border-l border-border px-3 text-xs ${layout === 'calendar' ? 'bg-blue-50 text-blue-700' : ''}`} onClick={() => setPageLayout('calendar')}>
              <CalendarDays className="mr-1.5 h-4 w-4" /> Calendar View
            </Button>
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={refresh} aria-label="Refresh bookings">
            <RefreshCw className={`h-4 w-4 ${(analyticsQuery.isFetching || bookingsQuery.isFetching) ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="custom" className="h-9 gap-2 px-3 text-xs" onClick={() => openBookingSetup()}>
            <Plus className="h-4 w-4" />
            Add Booking
          </Button>
        </div>
      </header>

      <section className="w-full min-w-0 max-w-full shrink-0 bg-background" aria-label="Booking overview metrics">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metricItems.map((item) => (
            <EventBookingMetricCard key={item.label} {...item} onOpen={() => setTab(item.tab)} />
          ))}
        </div>
      </section>

      <TabComp
        tabs={tabs}
        value={activeTab}
        onValueChange={setTab}
        className="admin-task-tabs mt-4 w-full min-w-0 max-w-full shrink-0 overflow-hidden bg-background"
        listClassName="admin-task-tab-list"
        ariaLabel="Booking workflow sections"
      />

      <Card className={`crm-card mt-3 w-full min-w-0 max-w-full overflow-hidden ${layout === 'list' ? 'flex min-h-96 flex-1 flex-col' : ''}`}>
        <CardContent className={`w-full min-w-0 max-w-full overflow-hidden p-3 ${layout === 'list' ? styles.listContent : ''}`}>
          <EventBookingDashboardFilters
            activeTab={activeTab}
            cities={cities}
            employees={employees}
            filters={filters}
            setFilter={setFilter}
          />

          {bookingsQuery.isLoading ? (
            <div className="grid h-80 place-items-center rounded-lg border border-border"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : bookingsQuery.isError ? (
            <div className="grid h-52 place-items-center rounded-lg border border-dashed border-border text-center">
              <div><AlertTriangle className="mx-auto mb-2 h-6 w-6 text-destructive" /><p className="text-sm font-medium">Unable to load bookings</p><Button variant="link" className="h-auto p-0 text-xs" onClick={refresh}>Try again</Button></div>
            </div>
          ) : layout === 'calendar' ? (
            <BookingCalendar bookings={bookings} month={month} onOpen={openBooking} />
          ) : (
            activeTab === 'today' ? (
              <TodayBookingTable bookings={visibleBookings} openEventOverview={openEventOverview} {...bookingActionProps} />
            ) : activeTab === 'completed' ? (
              <CompletedBookingTable bookings={visibleBookings} openEventOverview={openEventOverview} {...bookingActionProps} />
            ) : activeTab === 'closed' ? (
              <InactiveBookingTable
                bookings={visibleBookings}
                openEventOverview={openEventOverview}
                onResume={(booking) => resumeMutation.mutate(booking._id)}
                resumingId={resumeMutation.isPending ? resumeMutation.variables : null}
                {...bookingActionProps}
              />
            ) : <BookingTable
              bookings={visibleBookings}
              isNewBookingView={activeTab === 'new'}
              isPlanningView={activeTab === 'planning'}
              isExecutionReadyView={activeTab === 'execution_ready'}
              openEventOverview={openEventOverview}
              openPlanning={(booking) => navigate(`/dashboard/assigned-events/${booking._id}/plan/functions`)}
              markingReadyId={markReadyMutation.isPending ? markReadyMutation.variables : null}
              onMarkReady={(booking) => markReadyMutation.mutate(booking._id)}
              {...bookingActionProps}
            />
          )}

          {layout === 'list' ? (
            <div className="mt-3 flex flex-col gap-2 border-t border-border p-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">Showing {startEntry} to {endEntry} of {totalRows} {activeTab === 'completed' ? 'completed ' : ''}bookings</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => dispatch({ type: 'previous' })}>Previous</Button>
                {pages.map((page) => (
                  <Button
                    key={page}
                    variant="outline"
                    size="sm"
                    className={page === pagination.page ? 'border-primary text-primary' : ''}
                    aria-current={page === pagination.page ? 'page' : undefined}
                    onClick={() => dispatch({ type: 'setPage', page })}
                  >
                    {page}
                  </Button>
                ))}
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => dispatch({ type: 'next' })}>Next</Button>
              </div>
            </div>
          ) : null}
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2 text-[11px] text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
            <Clock3 className="h-4 w-4 shrink-0" />
            {activeTab === 'planning'
              ? 'Bookings in planning are tracked here until all critical approvals, vendors and execution details are complete.'
              : activeTab === 'execution_ready'
                ? 'Execution-ready bookings have completed planning and are awaiting final pre-event clearance before going live.'
                : activeTab === 'today'
                  ? 'Live events are monitored in real time. Track functions, milestones, payments and execution status here.'
                  : activeTab === 'completed'
                    ? 'Completed events remain here until all post-event closure requirements are complete.'
                    : activeTab === 'closed'
                      ? 'On-hold bookings retain their planning progress and can be resumed. Cancelled bookings remain until financial settlement is complete.'
                    : 'Bookings are linked to Clients & CRM enquiries and synced across all modules for real-time updates.'}
          </div>
        </CardContent>
      </Card>

      <AddBookingDialog
        key={setupBooking?._id || 'new-booking'}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setSetupBooking(null);
          }
        }}
        employees={employees}
        customers={customers}
        booking={setupBooking}
        saving={bookingFormMutation.isPending}
        onSubmit={(payload) => bookingFormMutation.mutate({ payload, booking: setupBooking })}
      />

      <EventBookingStatusDialog
        booking={statusBooking?.booking}
        open={Boolean(statusBooking)}
        onOpenChange={(open) => !open && setStatusBooking(null)}
        initialStatus={statusBooking?.initialStatus}
        onSubmit={(payload) => statusMutation.mutate(payload)}
        onMarkExecutionReady={(eventId) => markReadyMutation.mutate(eventId)}
        onRevokeExecutionReady={(payload) => revokeReadyMutation.mutate(payload)}
        saving={statusMutation.isPending || markReadyMutation.isPending || revokeReadyMutation.isPending}
      />
    </div>
  );
}
