/* eslint-disable react/prop-types */
import { useEffect, useMemo, useReducer, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { toast } from 'sonner';
import {
  BookOpen,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Info,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Send,
  UserCheck,
  Users,
  UserRoundPlus,
  X,
} from 'lucide-react';

import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/components/ui/dropdown-menu';
import { Input } from '@components/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/components/ui/table';

import { CustomerSchema, clientLeadStatuses } from '../../../validator/client.validator';
import ClientLeadSheet from './components/ClientLeadSheet';
import { useNavigate } from 'react-router-dom';
import EmployeeService from '../../../services/employee.service';

const fetchCustomer = async ({ page, limit, search, isGST, leadStatus, proposalStatus, employeeId }) => {
  const response = await EmployeeService.getAssignedClient({
    page,
    limit,
    search,
    isGST,
    leadStatus,
    proposalStatus,
    employeeId
  });
  return response.data;
};

const fetchCreateCustomer = async (formData) => {
  const response = await EmployeeService.createCustomer(formData);
  return response.data;
};

const fetchEmployee = async () => {
  const response = await EmployeeService.getEmployee({ page: 1, limit: 100, search: '' });
  return response.data;
};

const PaginationReducer = (state, action) => {
  switch (action.type) {
    case 'reset':
      return { ...state, page: 1 };
    case 'previous':
      return { ...state, page: Math.max(1, state.page - 1) };
    case 'next':
      return { ...state, page: Math.min(state.totalPages || 1, state.page + 1) };
    case 'setTotalRow':
      return {
        ...state,
        totalRows: action.payload,
        totalPages: Math.max(1, Math.ceil(action.payload / state.rowsPerPage)),
      };
    case 'customPage':
      return { ...state, page: action.payload };
    default:
      return state;
  }
};

const formatDate = (value) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const formatLabel = (value) => value || '-';

const getCustomersFromResponse = (data) =>
  data?.customer || data?.customers || data?.client || data?.clients || [];

const getTotalFromResponse = (data, fallback) =>
  data?.totalCustomer ||
  data?.totalCustomers ||
  data?.totalClient ||
  data?.totalClients ||
  data?.total ||
  data?.pagination?.total ||
  fallback;

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Follow-up Due':
      return 'crm-status-follow-up';
    case 'Proposal Sent':
      return 'crm-status-proposal-sent';
    case 'Booked':
      return 'crm-status-booked';
    case 'Lost':
      return 'crm-status-lost';
    default:
      return 'crm-status-default';
  }
};

function StatCard({ icon: Icon, label, value, caption, tone }) {
  const tones = {
    blue: {
      ring: 'bg-primary/10',
      icon: 'text-primary',
      caption: 'text-muted-foreground',
    },
    green: {
      ring: 'bg-[hsl(var(--chart-2)/0.12)]',
      icon: 'text-[hsl(var(--chart-2))]',
      caption: 'text-[hsl(var(--chart-2))]',
    },
    orange: {
      ring: 'bg-[hsl(var(--chart-3)/0.12)]',
      icon: 'text-[hsl(var(--chart-3))]',
      caption: 'text-[hsl(var(--chart-3))]',
    },
    purple: {
      ring: 'bg-[hsl(var(--chart-4)/0.12)]',
      icon: 'text-[hsl(var(--chart-4))]',
      caption: 'text-[hsl(var(--chart-4))]',
    },
  };

  const activeTone = tones[tone] || tones.blue;

  return (
    <Card className="h-[126px] rounded-lg border-border bg-card text-card-foreground shadow-sm">
      <CardContent className="flex h-full items-center gap-4 p-5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${activeTone.ring}`}>
          <Icon className={`h-[23px] w-[23px] ${activeTone.icon}`} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold leading-none text-foreground">
            {value}
          </p>
          <p className={`mt-2 text-xs ${activeTone.caption}`}>{caption}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ClientPagination({ state, dispatch }) {
  const totalPages = Math.max(1, state.totalPages || Math.ceil(state.totalRows / state.rowsPerPage));

  const pages = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

    if (state.page <= 3) return [1, 2, 3, 'ellipsis', totalPages];

    if (state.page >= totalPages - 2) {
      return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, 'ellipsis-left', state.page, 'ellipsis-right', totalPages];
  }, [state.page, totalPages]);

  const buttonCls =
    'h-9 min-w-9 rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground shadow-none hover:bg-accent';

  return (
    <div className="flex max-w-full flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={state.page <= 1}
        className={buttonCls}
        onClick={() => dispatch({ type: 'previous' })}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((page) =>
        typeof page === 'string' ? (
          <Button
            key={page}
            type="button"
            variant="outline"
            disabled
            className={buttonCls}
          >
            ...
          </Button>
        ) : (
          <Button
            key={page}
            type="button"
            variant="outline"
            className={
              page === state.page
                ? 'h-9 min-w-9 rounded-md border border-primary bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-none hover:bg-primary'
                : buttonCls
            }
            onClick={() => dispatch({ type: 'customPage', payload: page })}
          >
            {page}
          </Button>
        )
      )}

      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={state.page >= totalPages}
        className={buttonCls}
        onClick={() => dispatch({ type: 'next' })}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function CRMFlowCard() {
  const flow = [
    {
      title: 'Lead Created',
      desc: 'Enquiry captured from source',
      Icon: CalendarClock,
    },
    {
      title: 'Advisor Assigned',
      desc: 'Lead assigned to available advisor',
      Icon: UserCheck,
    },
    {
      title: 'Follow-up',
      desc: 'Regular follow-ups and client meetings',
      Icon: CalendarClock,
    },
    {
      title: 'Proposal Sent',
      desc: 'Custom proposal shared with client',
      Icon: UserRoundPlus,
    },
    {
      title: 'Booked',
      desc: 'Client confirms & booking created',
      Icon: Users,
    },
  ];

  return (
    <Card className="rounded-lg border-border bg-card text-card-foreground shadow-sm">
      <CardContent className="p-5">
        <h3 className="text-base font-semibold text-foreground">CRM Flow</h3>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          {flow.map(({ title, desc, Icon }, index) => (
            <div key={title} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="crm-icon-soft flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="w-[108px]">
                  <p className="text-xs font-semibold leading-tight text-foreground">{title}</p>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">{desc}</p>
                </div>
              </div>

              {index < flow.length - 1 && (
                <ChevronRight className="hidden h-5 w-5 shrink-0 text-primary xl:block" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClientCRMPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [leadStatus, setLeadStatus] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [advisorFilter, setAdvisorFilter] = useState('all');
  const navigate = useNavigate();

  const [paginationState, paginationDispatch] = useReducer(PaginationReducer, {
    page: 1,
    totalRows: 0,
    totalPages: 1,
    rowsPerPage: 8,
  });

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['fetch-customer', paginationState.page, paginationState.rowsPerPage, search, leadStatus, advisorFilter],
    queryFn: () =>
      fetchCustomer({
        page: paginationState.page,
        limit: paginationState.rowsPerPage,
        search,
        leadStatus,
        employeeId: advisorFilter
      }),
  });

  const { data: employeeData } = useQuery({
    queryKey: ['crm-advisors'],
    queryFn: fetchEmployee,
  });

  const debouncedSearch = useMemo(() => debounce(() => refetch(), 500), [refetch]);

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  const customers = getCustomersFromResponse(data);
  const totalCustomers = getTotalFromResponse(data, customers.length);
  const employees = employeeData?.employee || [];

  useEffect(() => {
    paginationDispatch({ type: 'setTotalRow', payload: totalCustomers });
  }, [totalCustomers]);

  const createCustomerMutation = useMutation({
    mutationFn: fetchCreateCustomer,
    onSuccess: (response) => {
      toast.success(response?.message || 'Client saved successfully');
      setIsFormOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to save client');
    },
  });

  const handleSearchValueChange = (value) => {
    setSearch(value);
    paginationDispatch({ type: 'reset' });
    debouncedSearch();
  };

  const handleCreateClient = async (formData) => {
    try {
      const validatedFormData = await CustomerSchema.validate(formData, {
        abortEarly: false,
        stripUnknown: true,
      });

      createCustomerMutation.mutate(validatedFormData);
    } catch (error) {
      const firstError = error.inner?.[0]?.message || error.message || 'Invalid client details';
      toast.error(firstError);
    }
  };

  const newLeads = customers.filter((client) => client.leadStatus === 'New').length;
  const followupDue = customers.filter((client) => client.leadStatus === 'Follow-up Due').length;
  const proposalSent = customers.filter((client) => client.leadStatus === 'Proposal Sent').length;
  const booked = customers.filter((client) => client.leadStatus === 'Booked').length;

  const statCards = [
    {
      label: 'Total Leads',
      value: totalCustomers,
      caption: 'All Time',
      icon: Users,
      tone: 'blue',
    },
    {
      label: 'New Leads',
      value: newLeads,
      caption: 'This Week',
      icon: UserRoundPlus,
      tone: 'green',
    },
    {
      label: 'Follow-up Due',
      value: followupDue,
      caption: 'Due in Next 7 Days',
      icon: Clock3,
      tone: 'orange',
    },
    {
      label: 'Proposal Sent',
      value: proposalSent,
      caption: 'This Month',
      icon: Send,
      tone: 'purple',
    },
    {
      label: 'Booked Clients',
      value: booked,
      caption: 'This Month',
      icon: BookOpen,
      tone: 'green',
    },
  ];

  const selectCls =
    'h-10 rounded-md border-input bg-background text-sm text-foreground shadow-none focus:ring-1 focus:ring-ring/40';

  const startingEntry = customers.length
    ? (paginationState.page - 1) * paginationState.rowsPerPage + 1
    : 0;

  const endingEntry = Math.min(
    paginationState.page * paginationState.rowsPerPage,
    totalCustomers
  );

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-background p-4 text-foreground md:p-6">
      <div className="w-full min-w-0 space-y-5">
        <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {statCards.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <Card className="min-w-0 rounded-lg border-border bg-card text-card-foreground shadow-sm">
          <CardContent className="p-0">
            <div className="flex min-w-0 flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
              <div className="relative w-full min-w-0 lg:max-w-[360px] lg:flex-1">
                <Input
                  placeholder="Search client by name, phone, city..."
                  className="h-10 rounded-md border-input bg-background pr-10 text-sm text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring/40"
                  value={search}
                  onChange={(event) => handleSearchValueChange(event.target.value)}
                />
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <Select
                  value={leadStatus || 'all'}
                  onValueChange={(value) => {
                    setLeadStatus(value === 'all' ? '' : value);
                    paginationDispatch({ type: 'reset' });
                  }}
                >
                  <SelectTrigger className={`${selectCls} w-full sm:w-[140px]`}>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {clientLeadStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className={`${selectCls} w-full sm:w-[140px]`}>
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    <SelectItem value="Lucknow">Lucknow</SelectItem>
                    <SelectItem value="Kanpur">Kanpur</SelectItem>
                    <SelectItem value="Varanasi">Varanasi</SelectItem>
                    <SelectItem value="Delhi">Delhi</SelectItem>
                    <SelectItem value="Agra">Agra</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={advisorFilter} onValueChange={setAdvisorFilter}>
                  <SelectTrigger className={`${selectCls} w-full sm:w-[150px]`}>
                    <SelectValue placeholder="All Advisors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Advisors</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee._id} value={employee._id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-md border-border bg-background px-6 text-sm text-foreground shadow-none hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    setSearch('');
                    setLeadStatus('');
                    setCityFilter('all');
                    setAdvisorFilter('all');
                    paginationDispatch({ type: 'reset' });
                  }}
                >
                  Reset
                </Button>

                <Button
                  type="button"
                  className="h-10 rounded-md px-7 text-sm font-semibold shadow-none sm:ml-auto"
                  onClick={() => setIsFormOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              </div>
            </div>

            <div className="p-4 pt-3">
              <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
                <div className="border-b border-border px-4 py-3">
                  <h2 className="text-base font-semibold text-foreground">Client List</h2>
                </div>

                {isFetching ? (
                  <div className="flex h-[360px] items-center justify-center bg-card">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="min-w-0 max-w-full overflow-hidden">
                    <Table className="w-full table-fixed">
                      <TableHeader>
                        <TableRow className="border-border bg-muted/60 hover:bg-muted/60">
                          <TableHead className="w-[40px] text-xs font-semibold text-muted-foreground">
                            #
                          </TableHead>
                          <TableHead className="w-[14%] text-xs font-semibold text-muted-foreground">
                            Client Name
                          </TableHead>
                          <TableHead className="w-[11%] text-xs font-semibold text-muted-foreground">
                            Mobile Number
                          </TableHead>
                          <TableHead className="w-[8%] text-xs font-semibold text-muted-foreground">
                            City
                          </TableHead>
                          <TableHead className="w-[10%] text-xs font-semibold text-muted-foreground">
                            Event Date
                          </TableHead>
                          <TableHead className="w-[8%] text-xs font-semibold text-muted-foreground">
                            Guest Count
                          </TableHead>
                          <TableHead className="w-[14%] text-xs font-semibold text-muted-foreground">
                            Event Type / Functions
                          </TableHead>
                          <TableHead className="w-[10%] text-xs font-semibold text-muted-foreground">
                            Status
                          </TableHead>
                          <TableHead className="w-[11%] text-xs font-semibold text-muted-foreground">
                            Assigned Advisor
                          </TableHead>
                          <TableHead className="w-[10%] text-xs font-semibold text-muted-foreground">
                            Next Follow-up
                          </TableHead>
                          <TableHead className="w-[80px] text-right text-xs font-semibold text-muted-foreground">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {customers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={11} className="h-40 text-center">
                              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                <Users className="h-9 w-9 text-muted-foreground/50" />
                                <span className="text-sm font-medium">No clients found</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          customers.map((customer, index) => (
                            <TableRow
                              key={customer._id || customer.phone || index}
                              className="h-[52px] border-border hover:bg-muted/40"
                            >
                              <TableCell className="truncate text-xs font-medium text-muted-foreground">
                                {(paginationState.page - 1) * paginationState.rowsPerPage + index + 1}
                              </TableCell>

                              <TableCell className="min-w-0">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                                    {customer.name?.slice(0, 2)?.toUpperCase() || 'CL'}
                                  </div>
                                  <span className="min-w-0 truncate text-xs font-semibold text-foreground">
                                    {customer.name || '-'}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell className="truncate text-xs text-foreground">
                                {customer.phone ? `+91 ${customer.phone}` : '-'}
                              </TableCell>

                              <TableCell className="truncate text-xs text-foreground">
                                {formatLabel(customer.city)}
                              </TableCell>

                              <TableCell className="truncate text-xs text-foreground">
                                {formatDate(customer.eventDate)}
                              </TableCell>

                              <TableCell className="truncate text-xs text-foreground">
                                {customer.guests ?? '-'}
                              </TableCell>

                              <TableCell className="truncate text-xs text-foreground">
                                {formatLabel(customer.eventType)} / {customer.functions ?? '-'}{' '}
                              </TableCell>

                              <TableCell className="min-w-0">
                                <Badge
                                  variant="outline"
                                  className={`max-w-full truncate rounded-md px-2 py-0.5 text-xs ${getStatusBadgeClass(
                                    customer.leadStatus
                                  )}`}
                                >
                                  {customer.leadStatus || 'New'}
                                </Badge>
                              </TableCell>

                              <TableCell className="truncate text-xs text-foreground">
                                {customer.assignedEmployee?.name || customer.assignedEmployee || '-'}
                              </TableCell>

                              <TableCell className="truncate text-xs text-foreground">
                                {formatDate(customer.followup?.[0]?.date)}
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => navigate(`/dashboard/assigned-clients/${customer._id}`)}
                                    className="size-6 rounded-md border-border bg-background text-foreground shadow-none hover:bg-accent hover:text-accent-foreground"
                                  >
                                    <Eye className="size-3" />
                                  </Button>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="size-6 rounded-md border-border bg-background text-foreground shadow-none hover:bg-accent hover:text-accent-foreground"
                                      >
                                        <MoreVertical className="size-3" />
                                      </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
                                      <DropdownMenuItem>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <CalendarClock className="mr-2 h-4 w-4" />
                                        Schedule Follow-up
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Proposal
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="flex flex-col items-start justify-between gap-3 border-t border-border px-4 py-4 lg:flex-row lg:items-center">
                  <p className="text-sm text-muted-foreground">
                    Showing {startingEntry} to {endingEntry} of {totalCustomers} entries
                  </p>

                  <div className="max-w-full overflow-hidden">
                    <ClientPagination state={paginationState} dispatch={paginationDispatch} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>

          <CRMFlowCard />
        </div>
      </div>

      <ClientLeadSheet
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        employees={employees}
        onSubmit={handleCreateClient}
        saving={Boolean(createCustomerMutation.isPending || createCustomerMutation.isLoading)}
      />
    </div>
  );
}
