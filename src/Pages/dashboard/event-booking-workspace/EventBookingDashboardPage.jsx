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

import AdminService from '../../../services/event-booking-workspace.service';
import TabComp from '@components/components/tab-comp';
import MonthFilterControl from '@components/components/MonthFilterControl';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/components/ui/dialog';
import {
  BookingForm,
  EditBookingDialog,
  buildInitialForm,
  buildBookingPayload,
  getBookings,
  getCustomers,
  getEmployees,
  getTotalPages,
  getTotalRows,
  initialBookingForm,
} from './components/EventBookingComponents';
import BookingCalendar from './components/EventBookingCalendar';
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
  const [month, setMonth] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [pagination, dispatch] = useReducer(paginationReducer, { page: 1, totalRows: 0, totalPages: 1 });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [form, setForm] = useState(initialBookingForm);
  const [formOpen, setFormOpen] = useState(false);
  const [setupBooking, setSetupBooking] = useState(null);
  const [editBooking, setEditBooking] = useState(null);
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
      leadStatus: 'Booked',
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
  const createMutation = useMutation({
    mutationFn: async (payload) => (await AdminService.createEventBooking(payload)).data,
    onSuccess: async (response) => {
      toast.success(response?.message || 'Booking created');
      setForm(initialBookingForm);
      setFormOpen(false);
      setSetupBooking(null);
      await refreshDashboard(response?.event);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Unable to create booking'),
  });
  const completeSetupMutation = useMutation({
    mutationFn: async ({ eventId, ...payload }) => (await AdminService.updateEventBooking({
      eventId,
      ...payload,
      onboardingStatus: 'Completed',
    })).data,
    onSuccess: async (response) => {
      toast.success(response?.message || 'Booking setup completed');
      setForm(initialBookingForm);
      setFormOpen(false);
      setSetupBooking(null);
      await refreshDashboard(response?.event);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Unable to complete booking setup'),
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
  const updateMutation = useMutation({
    mutationFn: (payload) => AdminService.updateEventBooking({ eventId: editBooking._id, ...payload }),
    onSuccess: async (response) => {
      toast.success(response?.data?.message || 'Booking updated');
      setEditBooking(null);
      await refreshDashboard(response?.data?.event);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Unable to update booking'),
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
    setEditBooking(booking);
  };
  const openBookingSetup = (booking = null) => {
    setSetupBooking(booking);
    setForm(booking ? buildInitialForm(booking) : initialBookingForm);
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
    <div className="crm-page min-h-screen w-full min-w-0 max-w-full overflow-x-hidden p-3 sm:p-4 lg:p-5">
      <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Events &amp; Bookings</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {activeTab === 'completed'
              ? 'View completed events and manage post-event closure, payments, and final documentation.'
              : activeTab === 'closed'
                ? 'View on-hold and cancelled bookings, reasons, last planning status and financial settlement.'
                : 'Manage confirmed bookings, planning readiness, execution and completion.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'today' ? (
            <Button variant="outline" className="h-9 gap-2 px-3 text-xs">
              <CalendarDays className="h-4 w-4" /> {todayLabel} <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          ) : <MonthFilterControl filters={month} onFilterChange={setMonth} className="h-9" />}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 gap-2 px-3 text-xs">More Actions <ChevronDown className="h-3.5 w-3.5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => openBookingSetup()}><Plus className="mr-2 h-4 w-4" /> Add Booking</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => { setFilters(EMPTY_FILTERS); dispatch({ type: 'reset' }); }}>
                <RefreshCw className="mr-2 h-4 w-4" /> Reset Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <section className="w-full min-w-0 max-w-full" aria-label="Booking overview metrics">
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
        className="admin-task-tabs mt-4 w-full min-w-0 max-w-full overflow-hidden"
        listClassName="admin-task-tab-list"
        ariaLabel="Booking workflow sections"
      />

      <Card className="crm-card mt-3 w-full min-w-0 max-w-full overflow-hidden">
        <CardContent className="w-full min-w-0 max-w-full overflow-hidden p-3">
          <EventBookingDashboardFilters
            activeTab={activeTab}
            cities={cities}
            employees={employees}
            filters={filters}
            setFilter={setFilter}
          />

          {bookingsQuery.isFetching ? (
            <div className="grid h-80 place-items-center rounded-lg border border-border"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : bookingsQuery.isError ? (
            <div className="grid h-52 place-items-center rounded-lg border border-dashed border-border text-center">
              <div><AlertTriangle className="mx-auto mb-2 h-6 w-6 text-destructive" /><p className="text-sm font-medium">Unable to load bookings</p><Button variant="link" className="h-auto p-0 text-xs" onClick={refresh}>Try again</Button></div>
            </div>
          ) : layout === 'calendar' ? (
            <BookingCalendar bookings={bookings} month={month} onOpen={openBooking} />
          ) : (
            activeTab === 'today' ? (
              <TodayBookingTable bookings={visibleBookings} openBooking={openBooking} openEventOverview={openEventOverview} onUpdateStatus={setStatusBooking} />
            ) : activeTab === 'completed' ? (
              <CompletedBookingTable bookings={visibleBookings}  openEventOverview={openEventOverview} />
            ) : activeTab === 'closed' ? (
              <InactiveBookingTable
                bookings={visibleBookings}
                openEventOverview={openEventOverview}
                onResume={(booking) => resumeMutation.mutate(booking._id)}
                onUpdateStatus={setStatusBooking}
                resumingId={resumeMutation.isPending ? resumeMutation.variables : null}
              />
            ) : <BookingTable
              bookings={visibleBookings}
              isNewBookingView={activeTab === 'new'}
              isPlanningView={activeTab === 'planning'}
              isExecutionReadyView={activeTab === 'execution_ready'}
              openBooking={openBooking}
              openEventOverview={openEventOverview}
              openPlanning={(booking) => navigate(`/dashboard/assigned-events/${booking._id}/plan/functions`)}
              openBookingSetup={openBookingSetup}
              markingReadyId={markReadyMutation.isPending ? markReadyMutation.variables : null}
              onMarkReady={(booking) => markReadyMutation.mutate(booking._id)}
              onUpdateStatus={setStatusBooking}
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

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setForm(initialBookingForm);
            setSetupBooking(null);
          }
        }}
      >
        <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
          <DialogHeader className="border-b border-border bg-blue-50/40 px-4 py-3 pr-12 text-left dark:bg-blue-400/5">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300"><Plus className="h-4 w-4" /></span>
              {setupBooking ? 'Continue Booking Setup' : 'Add New Booking'}
            </DialogTitle>
            <DialogDescription className="text-left text-xs">
              {setupBooking
                ? `Complete the booking details for ${setupBooking.customer?.name || setupBooking.eventName}.`
                : 'Create a booking from a converted Clients & CRM enquiry.'}
            </DialogDescription>
          </DialogHeader>
          <BookingForm
            formId="create-event-booking-form"
            showSubmitButton={false}
            className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
            customers={customers}
            employees={employees}
            value={form}
            setValue={setForm}
            saving={createMutation.isPending || completeSetupMutation.isPending}
            onSubmit={(event) => {
              event.preventDefault();
              const payload = buildBookingPayload(form);
              if (setupBooking && !setupBooking.isCrmOnly && setupBooking.onboardingStatus === 'Pending') {
                completeSetupMutation.mutate({ eventId: setupBooking._id, ...payload });
                return;
              }
              createMutation.mutate(payload);
            }}
          />

          <DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-4 py-2.5 sm:space-x-0">
            <Button type="button" variant="outline" size="sm" disabled={createMutation.isPending || completeSetupMutation.isPending} onClick={() => { setFormOpen(false); setForm(initialBookingForm); setSetupBooking(null); }}>Cancel</Button>
            <Button type="submit" form="create-event-booking-form" size="sm" disabled={createMutation.isPending || completeSetupMutation.isPending || !form.customer || !form.eventName?.trim() || !form.eventDate} className="min-w-32 gap-2">
              {(createMutation.isPending || completeSetupMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
              {(createMutation.isPending || completeSetupMutation.isPending) ? 'Saving...' : setupBooking ? 'Complete Booking' : 'Create Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditBookingDialog
        booking={editBooking}
        open={Boolean(editBooking)}
        onOpenChange={(open) => !open && setEditBooking(null)}
        employees={employees}
        saving={updateMutation.isPending}
        onSave={(payload) => updateMutation.mutate(payload)}
      />

      <EventBookingStatusDialog
        booking={statusBooking}
        open={Boolean(statusBooking)}
        onOpenChange={(open) => !open && setStatusBooking(null)}
        onSubmit={(payload) => statusMutation.mutate(payload)}
        onMarkExecutionReady={(eventId) => markReadyMutation.mutate(eventId)}
        onRevokeExecutionReady={(payload) => revokeReadyMutation.mutate(payload)}
        saving={statusMutation.isPending || markReadyMutation.isPending || revokeReadyMutation.isPending}
      />
    </div>
  );
}
