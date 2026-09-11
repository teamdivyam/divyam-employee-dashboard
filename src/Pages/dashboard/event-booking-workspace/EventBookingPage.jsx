import { useEffect, useReducer, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Edit,
  Eye,
  Loader2,
  Plus,
  ReceiptText,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

import AdminService from '../../../services/event-booking-workspace.service';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { Input } from '@components/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@components/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './components/EventTable';
import {
  BookingForm,
  MetricCard,
  PaymentBadge,
  StatusBadge,
  StatusOverviewChart,
  WidgetCard,
  bookingStatuses,
  buildBookingPayload,
  cities,
  formatDate,
  getBookings,
  getCustomers,
  getEmployees,
  getTotalPages,
  getTotalRows,
  initialBookingForm,
  money,
  paymentStatuses,
} from './components/EventBookingComponents';

const initialPagination = {
  page: 1,
  rowsPerPage: 8,
  totalRows: 0,
  totalPages: 1,
};

const paginationReducer = (state, action) => {
  switch (action.type) {
    case 'reset':
      return { ...state, page: 1 };
    case 'previous':
      return { ...state, page: Math.max(1, state.page - 1) };
    case 'next':
      return { ...state, page: Math.min(state.totalPages || 1, state.page + 1) };
    case 'setTotal':
      return {
        ...state,
        totalRows: action.payload.totalRows,
        totalPages: Math.max(1, action.payload.totalPages || Math.ceil(action.payload.totalRows / state.rowsPerPage)),
      };
    case 'customPage':
      return { ...state, page: action.payload };
    default:
      return state;
  }
};

const fetchAnalytics = async () => {
  const response = await AdminService.getEventBookingAnalytics();
  return response.data;
};

const fetchBookings = async ({ page, limit, status, city, managerId, paymentStatus, search }) => {
  const response = await AdminService.getEventBookings({
    page,
    limit,
    status,
    city,
    managerId,
    paymentStatus,
    search,
  });
  return response.data;
};

const fetchCustomers = async () => {
  const response = await AdminService.adminGetEmployee({ page: 1, limit: 100, search: '' });
  return response.data;
};

const fetchEmployees = async () => {
  return (await AdminService.getEventBookingManagers({ limit: 100 })).data;
};

const createBooking = async (payload) => {
  const response = await AdminService.createEventBooking(payload);
  return response.data;
};

export default function EventBookingPage() {
  const navigate = useNavigate();
  const [pagination, dispatch] = useReducer(paginationReducer, initialPagination);
  const [filters, setFilters] = useState({
    status: 'all',
    city: 'all',
    managerId: 'all',
    paymentStatus: 'all',
    search: '',
  });
  const [form, setForm] = useState(initialBookingForm);
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);

  const analyticsQuery = useQuery({
    queryKey: ['event-booking-analytics'],
    queryFn: fetchAnalytics,
  });

  const bookingsQuery = useQuery({
    queryKey: ['event-bookings', pagination.page, pagination.rowsPerPage, filters],
    queryFn: () =>
      fetchBookings({
        page: pagination.page,
        limit: pagination.rowsPerPage,
        status: filters.status === 'all' ? undefined : filters.status,
        city: filters.city === 'all' ? undefined : filters.city,
        managerId: filters.managerId === 'all' ? undefined : filters.managerId,
        paymentStatus: filters.paymentStatus === 'all' ? undefined : filters.paymentStatus,
        search: filters.search || undefined,
      }),
  });

  const customersQuery = useQuery({ queryKey: ['event-booking-customers'], queryFn: fetchCustomers });
  const employeesQuery = useQuery({ queryKey: ['event-booking-managers'], queryFn: fetchEmployees });

  const createMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (response) => {
      toast.success(response?.message || 'Event created!');
      setForm(initialBookingForm);
      setBookingSheetOpen(false);
      bookingsQuery.refetch();
      analyticsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Unable to create booking');
    },
  });

  const analytics = analyticsQuery.data?.analytics || {};
  const cards = analytics.cards || {};
  const bookings = getBookings(bookingsQuery.data);
  const customers = getCustomers(customersQuery.data);
  const employees = getEmployees(employeesQuery.data);
  const totalRows = getTotalRows(bookingsQuery.data);
  const totalPages = getTotalPages(bookingsQuery.data);

  useEffect(() => {
    dispatch({
      type: 'setTotal',
      payload: {
        totalRows,
        totalPages,
      },
    });
  }, [totalRows, totalPages]);

  const metricCards = [
    { label: 'Total Bookings', value: cards.totalBookings, caption: 'All Time', icon: CalendarDays, tone: 'purple' },
    { label: 'Upcoming Events', value: cards.upcomingEvents, caption: 'Next 30 Days', icon: CalendarDays, tone: 'blue' },
    { label: 'Active Planning', value: cards.activePlanning, caption: 'In Planning', icon: ClipboardList, tone: 'amber' },
    { label: 'Proposal Stage', value: cards.proposalStage, caption: 'Proposal Sent', icon: ReceiptText, tone: 'green' },
    { label: 'Confirmed Bookings', value: cards.confirmedBookings, caption: 'Confirmed', icon: CheckSquare, tone: 'red' },
    { label: 'Completed Events', value: cards.completedEvents, caption: 'This Year', icon: CreditCard, tone: 'cyan' },
  ];

  const maxCityEvents = Math.max(1, ...(analytics.topCities || []).map((item) => item.events || item.count || 0));

  const handleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    dispatch({ type: 'reset' });
  };

  const handleCreate = (event) => {
    event.preventDefault();
    createMutation.mutate(buildBookingPayload(form));
  };

  const startingEntry = bookings.length ? (pagination.page - 1) * pagination.rowsPerPage + 1 : 0;
  const endingEntry = Math.min(pagination.page * pagination.rowsPerPage, totalRows);

  return (
    <div className="crm-page min-h-screen p-4 md:p-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {metricCards.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </div>

      <div className="mt-4">
        <Card className="crm-card min-w-0">
          <CardContent className="p-4">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h1 className="text-lg font-semibold text-foreground">All Events & Bookings</h1>
              <Button
                className="crm-primary-button h-9 px-5 text-xs font-semibold"
                onClick={() => setBookingSheetOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Booking
              </Button>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-[150px_150px_180px_180px_1fr_86px]">
              <Select value={filters.status} onValueChange={(value) => handleFilter('status', value)}>
                <SelectTrigger className="crm-input h-9 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {bookingStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.city} onValueChange={(value) => handleFilter('city', value)}>
                <SelectTrigger className="crm-input h-9 text-xs"><SelectValue placeholder="All Cities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.managerId} onValueChange={(value) => handleFilter('managerId', value)}>
                <SelectTrigger className="crm-input h-9 text-xs"><SelectValue placeholder="All Managers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Managers</SelectItem>
                  {employees.map((employee) => <SelectItem key={employee._id} value={employee._id}>{employee.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.paymentStatus} onValueChange={(value) => handleFilter('paymentStatus', value)}>
                <SelectTrigger className="crm-input h-9 text-xs"><SelectValue placeholder="Payment Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Payment Status</SelectItem>
                  {paymentStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input className="crm-input h-9 text-xs" value={filters.search} onChange={(event) => handleFilter('search', event.target.value)} placeholder="Search booking..." />
              <Button
                variant="outline"
                className="crm-outline-button h-9 text-xs"
                onClick={() => {
                  setFilters({ status: 'all', city: 'all', managerId: 'all', paymentStatus: 'all', search: '' });
                  dispatch({ type: 'reset' });
                }}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reset
              </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              {bookingsQuery.isFetching ? (
                <div className="flex h-[360px] items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60 hover:bg-muted/60">
                      <TableHead className="w-10 text-xs">#</TableHead>
                      <TableHead className="text-xs">Event / Booking Name</TableHead>
                      <TableHead className="text-xs">Client Name</TableHead>
                      <TableHead className="text-xs">Event Date</TableHead>
                      <TableHead className="text-xs">City / Venue</TableHead>
                      <TableHead className="text-xs">Guests</TableHead>
                      <TableHead className="text-xs">Functions</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Manager</TableHead>
                      <TableHead className="text-xs">Payment Status</TableHead>
                      <TableHead className="text-right text-xs">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="h-36 text-center text-sm text-muted-foreground">
                          No bookings found.
                        </TableCell>
                      </TableRow>
                    ) : bookings.map((booking, index) => (
                      <TableRow key={booking._id} className="text-xs">
                        <TableCell>{(pagination.page - 1) * pagination.rowsPerPage + index + 1}</TableCell>
                        <TableCell className="font-semibold text-foreground">{booking.eventName || '-'}</TableCell>
                        <TableCell>{booking.customer?.name || '-'}</TableCell>
                        <TableCell>{formatDate(booking.eventDate)}</TableCell>
                        <TableCell>
                          <p className="font-semibold">{booking.city || '-'}</p>
                          <p className="text-muted-foreground">{booking.venue || '-'}</p>
                        </TableCell>
                        <TableCell>{booking.guestCount ?? '-'}</TableCell>
                        <TableCell>{booking.noOfFunctions ?? '-'}</TableCell>
                        <TableCell><StatusBadge status={booking.bookingStatus} /></TableCell>
                        <TableCell>{booking.assignedManager?.name || '-'}</TableCell>
                        <TableCell><PaymentBadge status={booking.paymentStatus} /></TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" className="crm-outline-button h-7 w-7" onClick={() => navigate(`/dashboard/assigned-events/${booking._id}`)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="outline" size="icon" className="crm-outline-button h-7 w-7" onClick={() => navigate(`/dashboard/assigned-events/${booking._id}`)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>Showing {startingEntry} to {endingEntry} of {totalRows} entries</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="crm-outline-button h-8 w-8" disabled={pagination.page <= 1} onClick={() => dispatch({ type: 'previous' })}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(4, pagination.totalPages) }, (_, item) => item + 1).map((page) => (
                  <Button key={page} variant="outline" className={page === pagination.page ? 'h-8 w-8 bg-primary p-0 text-primary-foreground' : 'crm-outline-button h-8 w-8 p-0'} onClick={() => dispatch({ type: 'customPage', payload: page })}>
                    {page}
                  </Button>
                ))}
                <Button variant="outline" size="icon" className="crm-outline-button h-8 w-8" disabled={pagination.page >= pagination.totalPages} onClick={() => dispatch({ type: 'next' })}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={bookingSheetOpen} onOpenChange={setBookingSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto border-l border-border bg-card text-card-foreground sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold text-foreground">Add New Booking</SheetTitle>
          </SheetHeader>

          <div className="mt-5">
            <BookingForm
              customers={customers}
              employees={employees}
              value={form}
              setValue={setForm}
              saving={createMutation.isPending || createMutation.isLoading}
              onSubmit={handleCreate}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <WidgetCard title="Booking Status Overview">
          <StatusOverviewChart data={analytics.bookingStatusOverview || []} />
        </WidgetCard>

        <WidgetCard title="Upcoming Events" action={<Button variant="ghost" className="h-7 px-2 text-xs">View All <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>}>
          <div className="space-y-3">
            {(analytics.upcomingEventList || []).slice(0, 3).map((event) => (
              <div key={event._id} className="flex items-start justify-between gap-3 text-xs">
                <div className="flex gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-[hsl(var(--chart-2))]" />
                  <div>
                    <p className="font-semibold text-foreground">{event.eventName}</p>
                    <p className="text-muted-foreground">{formatDate(event.eventDate)} - {event.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </WidgetCard>

        <WidgetCard title="Top Cities" action={<Button variant="ghost" className="h-7 px-2 text-xs">View All <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>}>
          <div className="space-y-3">
            {(analytics.topCities || []).slice(0, 5).map((city) => {
              const cityCount = city.events || city.count || 0;
              return (
                <div key={city._id || city.city} className="grid grid-cols-[80px_minmax(0,1fr)_52px] items-center gap-2 text-xs">
                  <span className="font-medium text-foreground">{city._id || city.city}</span>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(10, (cityCount / maxCityEvents) * 100)}%` }} />
                  </div>
                  <span className="text-right text-muted-foreground">{cityCount} Events</span>
                </div>
              );
            })}
          </div>
        </WidgetCard>

        <WidgetCard title="Payment Summary" action={<Button variant="ghost" className="h-7 px-2 text-xs">View All <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>}>
          <div className="space-y-3 text-xs">
            {[
              ['Total Booking Value', analytics.paymentSummary?.totalBookingValue],
              ['Total Received', analytics.paymentSummary?.totalReceived],
              ['Total Pending', analytics.paymentSummary?.totalPending],
              ['Advance Received', analytics.paymentSummary?.advanceReceived],
            ].map(([label, value], index) => (
              <div key={label} className="flex justify-between gap-3">
                <span className="font-medium text-foreground">{label}</span>
                <span className={index === 2 ? 'font-semibold text-destructive' : 'font-semibold text-[hsl(var(--chart-2))]'}>
                  {money(value)}
                </span>
              </div>
            ))}
          </div>
        </WidgetCard>
      </div>
    </div>
  );
}
