import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  ConciergeBell,
  Download,
  Edit,
  Eye,
  FileText,
  IndianRupee,
  Link2,
  Loader2,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Plus,
  Upload,
  User,
  UserRound,
  Users,
  Zap,
} from 'lucide-react';

import { Button } from '@components/components/ui/button';
import { Badge } from '@components/components/ui/badge';
import { toast } from 'sonner';

import {
  AddNoteDialog,
  CrmStatusTimeline,
  EditClientSheet,
  FieldItem,
  SectionCard,
  StatusBadge,
  SummaryTile,
  TaskManagerDialog,
  ViewMoreButton,
  fmtDate,
  getCurrentCrmStatus,
  money,
} from './components/ClientDetailComponents';
import EmployeeService from '../../../services/employee.service';

const fetchCustomer = async ({ queryKey }) => {
  const [, id] = queryKey;
  const response = await EmployeeService.getCustomerDetail({ id });
  return response.data;
};

const fetchAddNoteCustomer = async ({ customerId, date, note }) => {
  const response = await EmployeeService.addNoteCustomer({
    customerId,
    date,
    note,
  });

  return response.data;
};

const fetchUpdateCustomerTask = async ({ customerId, action, taskId, ...formData }) => {
  const response = await EmployeeService.updateCustomerTask({
    customerId,
    action,
    taskId,
    ...formData,
  });

  return response.data;
};

const fetchUpdateCustomerCrmStatus = async ({ customerId, status }) => {
  const response = await EmployeeService.updateCustomerCrmStatus({
    customerId,
    status,
  });

  return response.data;
};

const fetchUpdateCustomer = async ({ customerId, ...formData }) => {
  const response = await EmployeeService.updateCustomer({
    id: customerId,
    ...formData,
  });

  return response.data;
};

const fetchEmployee = async () => {
  const response = await EmployeeService.getEmployee({ page: 1, limit: 100, search: '' });
  return response.data;
};

const getInitialNotes = (customer) => {
  if (customer?.followup?.length) {
    return customer.followup;
  }

  return [
    {
      date: customer?.createdOn || customer?.createdAt,
      note: 'Lead created',
    },
    {
      date: customer?.createdOn || customer?.createdAt,
      note: `Advisor assigned to ${customer?.assignedEmployee?.name || 'advisor'}`,
    },
    {
      date: customer?.proposalSentDate,
      note: customer?.proposalStatus === 'Sent' ? 'Proposal shared' : 'Proposal pending',
    },
  ].filter((item) => item.date || item.note);
};

const getInitialTasks = (customer) => {
  if (customer?.clientTask?.length) {
    return customer.clientTask;
  }

  return [];
};

const getTaskOwnerName = (task) => {
  if (!task?.assignedTo) return task?.assignedEmployee?.name || '-';

  if (typeof task.assignedTo === 'object') {
    return task.assignedTo.name || task.assignedTo.email || '-';
  }

  return task.assignedEmployee?.name || task.assignedTo || '-';
};

const getDocuments = (customer) => {
  if (customer?.documents?.length) {
    return customer.documents;
  }

  return [
    { name: 'Proposal PDF', size: '2.4 MB' },
    { name: 'Quotation', size: '1.8 MB' },
    { name: 'Decor Moodboard', size: '3.1 MB' },
    { name: 'Menu Draft', size: '1.6 MB' },
    { name: 'Agreement Draft', size: '2.2 MB' },
  ];
};

export default function DetailClientPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [noteOpen, setNoteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [crmStatus, setCrmStatus] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['client-detail', clientId],
    queryFn: fetchCustomer,
    enabled: Boolean(clientId),
  });

  const { data: employeeData } = useQuery({
    queryKey: ['client-detail-employees'],
    queryFn: fetchEmployee,
  });

  const addNoteCustomerMutation = useMutation({
    mutationFn: fetchAddNoteCustomer,

    onSuccess: (response) => {
      toast.success(response?.message || 'Customer note added!');

      if (Array.isArray(response?.followup)) {
        setNotes(response.followup);
      }

      setNoteOpen(false);
      refetch();
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Unable to add follow-up note'
      );
    },
  });

  const taskMutation = useMutation({
    mutationFn: fetchUpdateCustomerTask,

    onSuccess: (response) => {
      toast.success(response?.message || 'Customer task updated!');

      if (Array.isArray(response?.clientTask)) {
        setTasks(response.clientTask);
      }

      refetch();
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Unable to update customer task'
      );
    },
  });

  const crmStatusMutation = useMutation({
    mutationFn: fetchUpdateCustomerCrmStatus,

    onSuccess: (response) => {
      toast.success(response?.message || 'CRM status updated!');

      if (response?.customer?.leadStatus) {
        setCrmStatus(response.customer.leadStatus);
      }

      refetch();
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Unable to update CRM status'
      );
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: fetchUpdateCustomer,

    onSuccess: (response) => {
      toast.success(response?.message || 'Customer updated!');
      setEditOpen(false);

      if (response?.customer?.leadStatus) {
        setCrmStatus(response.customer.leadStatus);
      }

      refetch();
    },

    onError: (error) => {
      const validationMessage = error.response?.data?.validationError?.[0]?.message;

      toast.error(
        validationMessage ||
        error.response?.data?.message ||
        error.message ||
        'Unable to update customer'
      );
    },
  });

  const customer = data?.customer;
  const employees = employeeData?.employee || [];

  useEffect(() => {
    if (!customer) return;

    setNotes(getInitialNotes(customer));
    setTasks(getInitialTasks(customer));
    setCrmStatus(getCurrentCrmStatus(customer));
  }, [customer?._id, customer?.leadStatus, customer?.proposalStatus]);

  const currentStatus = useMemo(
    () => crmStatus || getCurrentCrmStatus(customer),
    [crmStatus, customer]
  );

  const documents = useMemo(() => getDocuments(customer), [customer]);

  if (isLoading) {
    return (
      <div className="crm-page flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="crm-page min-h-screen p-6">
        <div className="crm-card p-6 text-[15px] font-medium">
          {data?.message || 'Customer not found'}
        </div>
      </div>
    );
  }

  const nextFollowup = notes?.[0]?.date || customer.followup?.[0]?.date;
  const hasAdvance = Boolean(customer.paymentId?.length);
  const isBooked = customer.leadStatus === 'Booked';

  return (
    <div className="crm-page min-h-screen p-4 md:p-5">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 flex items-center gap-2 text-[13px] font-medium text-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Client List
      </button>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0 space-y-5">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <h1 className="min-w-0 whitespace-normal break-words text-[23px] font-semibold leading-tight text-foreground">
                {customer.name || customer.eventTitle || 'Client Detail'}
              </h1>

              <StatusBadge status={currentStatus} />
            </div>

            <p className="mt-1 max-w-2xl text-[13px] font-normal leading-relaxed text-muted-foreground">
              Client profile, event plan, follow-ups and proposal health.
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            <SummaryTile icon={CalendarDays} label="Event Date" value={fmtDate(customer.eventDate)} />
            <SummaryTile icon={MapPin} label="City" value={customer.city} />
            <SummaryTile icon={Users} label="Guests" value={customer.guests} />
            <SummaryTile icon={ConciergeBell} label="Functions" value={customer.functions} />
            <SummaryTile icon={UserRound} label="Advisor" value={customer.assignedEmployee?.name} />
          </div>

          <div className="grid min-w-0 gap-3 lg:grid-cols-2">
            <SectionCard icon={User} title="Client Information">
              <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
                <FieldItem icon={User} label="Client Name" value={customer.name} />
                <FieldItem icon={Phone} label="Mobile Number" value={customer.phone ? `+91 ${customer.phone}` : '-'} />
                <FieldItem icon={Mail} label="Email" value={customer.email} />
                <FieldItem icon={MapPin} label="City" value={customer.city} />
                <FieldItem icon={Link2} label="Lead Source" value={customer.leadSource} />
                <FieldItem icon={CalendarClock} label="Created On" value={fmtDate(customer.createdOn || customer.createdAt)} />
              </div>
            </SectionCard>

            <SectionCard icon={CalendarDays} title="Event Information">
              <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
                <FieldItem icon={CalendarDays} label="Event Title" value={customer.eventTitle} />
                <FieldItem icon={ClipboardList} label="Functions" value={customer.functions} />
                <FieldItem icon={FileText} label="Event Type" value={customer.eventType} />
                <FieldItem icon={ConciergeBell} label="Catering" value={customer.cateringPreference} />
                <FieldItem icon={MapPin} label="Venue" value={customer.venue} />
                <FieldItem icon={Users} label="Decor" value={customer.decorPreference} />
                <FieldItem icon={CalendarClock} label="Event Date" value={fmtDate(customer.eventDate)} />
                <FieldItem icon={IndianRupee} label="Budget" value={customer.budgetRange} />
                <FieldItem icon={Users} label="Guest Count" value={customer.guests} />
              </div>
            </SectionCard>
          </div>

          <div className="grid min-w-0 gap-3 lg:grid-cols-2">
            <SectionCard
              icon={CalendarClock}
              title="Follow-up & Notes"
              action={
                <Button
                  type="button"
                  variant="outline"
                  className="crm-outline-button h-8 px-3 text-[12px] font-medium"
                  onClick={() => setNoteOpen(true)}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Note
                </Button>
              }
            >
              <div className="space-y-0">
                {notes.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">No follow-up note added yet.</p>
                ) : (
                  notes.map((item, index) => (
                    <div key={`${item.date}-${index}`} className="relative flex min-w-0 gap-3 pb-4 last:pb-0">
                      {index < notes.length - 1 && (
                        <span className="absolute left-[5px] top-4 h-full w-px bg-primary" />
                      )}

                      <span className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-primary bg-background" />

                      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[92px_minmax(0,1fr)]">
                        <p className="text-[12px] font-medium text-muted-foreground">
                          {fmtDate(item.date)}
                        </p>
                        <p className="whitespace-normal break-words text-[12px] font-normal leading-relaxed text-foreground">
                          {item.note || item.message || '-'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard
              icon={ClipboardList}
              title="Tasks for This Client"
              action={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setTaskOpen(true)}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
            >
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="crm-muted-surface grid grid-cols-4 gap-4 px-3 py-2.5 text-[11px] font-medium">
                  <span>Task</span>
                  <span>Owner</span>
                  <span>Due</span>
                  <span>Status</span>
                </div>

                {tasks.map((task, index) => (
                  <div
                    key={`${task.task || task.title}-${index}`}
                    className="grid grid-cols-4 gap-4 items-center border-t border-border px-3 py-3 text-[12px]"
                  >
                    <span className="min-w-0 whitespace-normal break-words font-medium text-foreground">
                      {task.task || task.title || '-'}
                    </span>
                    <span className="min-w-0 whitespace-normal break-words text-muted-foreground">
                      {getTaskOwnerName(task)}
                    </span>
                    <span className="text-muted-foreground">{fmtDate(task.dueDate)}</span>
                    <Badge
                      variant="outline"
                      className="crm-status-pending w-fit rounded-md px-2 py-0.5 text-[11px] font-medium"
                    >
                      {task.status || 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard
            icon={FileText}
            title="Documents"
            action={<ViewMoreButton>View All</ViewMoreButton>}
          >
            <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {documents.map((doc, index) => (
                <div
                  key={`${doc.name || doc}-${index}`}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-card p-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-destructive/10">
                      <FileText className="h-5 w-5 text-destructive" />
                    </span>

                    <div className="min-w-0">
                      <p className="whitespace-normal break-words text-[12px] font-medium text-foreground">
                        {doc.name || doc}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        PDF · {doc.size || '2.4 MB'}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
                    <Eye className="h-4 w-4 cursor-pointer hover:text-foreground" />
                    <Download className="h-4 w-4 cursor-pointer hover:text-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </main>

        <aside className="min-w-0 space-y-5 xl:sticky xl:top-5 xl:self-start">
          <CrmStatusTimeline
            currentStatus={currentStatus}
            isUpdating={crmStatusMutation.isPending || crmStatusMutation.isLoading}
            updatingStatus={crmStatusMutation.variables?.status}
            onStatusChange={(status) => {
              if (status === currentStatus) return;

              crmStatusMutation.mutate({
                customerId: customer._id,
                status,
              });
            }}
          />

          <SectionCard icon={Phone} title="Next Follow-up">
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Date</p>
                <p className="mt-1 font-medium text-foreground">{fmtDate(nextFollowup)}</p>
              </div>

              <Badge
                variant="outline"
                className="rounded-md border-border bg-background px-3 py-1 text-[11px] font-medium text-foreground"
              >
                Call
              </Badge>
            </div>
          </SectionCard>

          <SectionCard icon={FileText} title="Proposal">
            <div className="space-y-3">
              <div className="flex justify-between gap-4 text-[12px]">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-primary">
                  {customer.proposalStatus || '-'}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-[12px]">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium text-foreground">
                  {money(customer.proposalAmount)}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-[12px]">
                <span className="text-muted-foreground">Sent Date</span>
                <span className="font-medium text-foreground">
                  {fmtDate(customer.proposalSentDate)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <Button className="crm-primary-button h-9 text-[12px] font-medium">
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  View
                </Button>

                <Button
                  variant="outline"
                  className="crm-outline-button h-9 text-[12px] font-medium"
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload
                </Button>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={CalendarDays} title="Booking">
            <div className="space-y-3">
              <div className="flex justify-between gap-4 text-[12px]">
                <span className="text-muted-foreground">Advance Received</span>
                <span className={hasAdvance ? 'font-medium text-[hsl(var(--chart-2))]' : 'font-medium text-destructive'}>
                  {hasAdvance ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-[12px]">
                <span className="text-muted-foreground">Booking Status</span>
                <span className={isBooked ? 'font-medium text-[hsl(var(--chart-2))]' : 'font-medium text-destructive'}>
                  {isBooked ? 'Booked' : 'Not Booked Yet'}
                </span>
              </div>

              <Button className="crm-primary-button h-9 w-full text-[12px] font-medium">
                Convert to Booking
              </Button>
            </div>
          </SectionCard>

          <SectionCard icon={Zap} title="Quick Actions">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="crm-outline-button h-9 text-[12px] font-medium"
                onClick={() => setEditOpen(true)}
              >
                <Edit className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>

              <Button
                variant="outline"
                className="crm-outline-button h-9 text-[12px] font-medium"
                onClick={() => setNoteOpen(true)}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Follow-up
              </Button>

              <Button
                variant="outline"
                className="crm-outline-button h-9 text-[12px] font-medium"
              >
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Proposal
              </Button>

              <Button
                variant="outline"
                className="crm-outline-button h-9 text-[12px] font-medium"
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Document
              </Button>
            </div>

            <Button className="crm-primary-button mt-3 h-9 w-full text-[12px] font-medium">
              Convert to Booking
            </Button>
          </SectionCard>
        </aside>
      </div>

      <AddNoteDialog
        open={noteOpen}
        onOpenChange={setNoteOpen}
        isSaving={addNoteCustomerMutation.isPending || addNoteCustomerMutation.isLoading}
        onSave={(payload) => {
          addNoteCustomerMutation.mutate({
            customerId: customer._id,
            date: payload.date,
            note: payload.note,
          });
        }}
      />

      <TaskManagerDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        tasks={tasks}
        employees={employees}
        isSaving={taskMutation.isPending || taskMutation.isLoading}
        onAddTask={(payload) => {
          taskMutation.mutate({
            customerId: customer._id,
            action: 'add',
            ...payload,
          });
        }}
        onUpdateTask={(taskId, payload) => {
          taskMutation.mutate({
            customerId: customer._id,
            action: 'update',
            taskId,
            ...payload,
          });
        }}
        onDeleteTask={(taskId) => {
          taskMutation.mutate({
            customerId: customer._id,
            action: 'delete',
            taskId,
          });
        }}
      />

      <EditClientSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
        isSaving={updateCustomerMutation.isPending || updateCustomerMutation.isLoading}
        onSave={(payload) => {
          updateCustomerMutation.mutate({
            customerId: customer._id,
            ...payload,
          });
        }}
      />
    </div>
  );
}
