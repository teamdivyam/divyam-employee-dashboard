import { useEffect, useState } from 'react';
import {
    CalendarClock,
    Check,
    ChevronRight,
    ClipboardList,
    Edit,
    Plus,
    Save,
    Trash2,
    Loader2
} from 'lucide-react';

import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@components/components/ui/dialog';
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
import { Textarea } from '@components/components/ui/textarea';

export const statusSteps = [
    'New',
    'Contacted',
    'Qualified',
    'Consultation Scheduled',
    'Proposal Pending',
    'Proposal Sent',
    'Follow-up Due',
    'Negotiation',
    'Booked',
    'Lost',
];

export const fmtDate = (date) => {
    if (!date) return '-';

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '-';

    return parsed.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

export const toInputDate = (date) => {
    if (!date) return '';

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '';

    return parsed.toISOString().slice(0, 10);
};

export const money = (value) => {
    if (!value) return '-';

    const amount = Number(value);
    if (Number.isNaN(amount)) return value;

    return `₹${amount.toLocaleString('en-IN')}`;
};

export const getCurrentCrmStatus = (customer) => {
    if (!customer) return 'New';

    return customer.leadStatus || 'New';
};

export function StatusBadge({ status }) {
    const styles = {
        New: 'crm-status-new',
        Contacted: 'crm-status-contacted',
        Qualified: 'crm-status-qualified',
        'Consultation Scheduled': 'crm-status-consultation',
        'Proposal Pending': 'crm-status-proposal-pending',
        'Proposal Sent': 'crm-status-proposal-sent',
        'Follow-up Due': 'crm-status-follow-up',
        Negotiation: 'crm-status-negotiation',
        Booked: 'crm-status-booked',
        Lost: 'crm-status-lost',
    };

    return (
        <Badge
            variant="outline"
            className={`rounded-md px-3 py-1 text-[11px] font-medium ${styles[status] || styles.New
                }`}
        >
            {status || 'New'}
        </Badge>
    );
}

export function SectionCard({ icon: Icon, title, action, children, className = '' }) {
    return (
        <Card className={`crm-card ${className}`}>
            <CardContent className="p-4 md:p-5">
                <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        {Icon && (
                            <span className="crm-icon-soft flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                                <Icon className="h-4.5 w-4.5" />
                            </span>
                        )}

                        <h2 className="crm-title min-w-0 whitespace-normal break-words text-[14px] font-semibold">
                            {title}
                        </h2>
                    </div>

                    {action}
                </div>

                {children}
            </CardContent>
        </Card>
    );
}

export function SummaryTile({ icon: Icon, label, value }) {
    return (
        <Card className="crm-card">
            <CardContent className="flex min-h-[72px] min-w-0 items-center gap-3 p-2">
                <div className="crm-icon-soft flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                    <Icon className="h-4.5 w-4.5" />
                </div>

                <div className="min-w-0">
                    <p className="crm-muted-text text-[11px] font-medium">{label}</p>
                    <p className="crm-title mt-1 whitespace-normal break-words text-xs font-semibold leading-snug">
                        {value || '-'}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

export function FieldItem({ icon: Icon, label, value }) {
    return (
        <div className="flex min-w-0 gap-3">
            {Icon && <Icon className="crm-muted-text mt-0.5 h-4 w-4 shrink-0" />}

            <div className="min-w-0">
                <p className="crm-muted-text text-[11px] font-medium">{label}</p>
                <p className="crm-title mt-1 whitespace-normal break-words text-[12px] font-medium leading-snug">
                    {value || '-'}
                </p>
            </div>
        </div>
    );
}

export function CrmStatusTimeline({
    currentStatus,
    onStatusChange,
    isUpdating = false,
    updatingStatus = '',
}) {
    const activeIndex = Math.max(0, statusSteps.indexOf(currentStatus));

    return (
        <SectionCard icon={ClipboardList} title="CRM Status">
            <div className="space-y-0.5">
                {statusSteps.map((step, index) => {
                    const active = index === activeIndex;
                    const done = index < activeIndex;

                    return (
                        <button
                            key={step}
                            type="button"
                            disabled={isUpdating}
                            className="relative flex w-full gap-3 rounded-md text-left outline-none transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70"
                            onClick={() => onStatusChange?.(step)}
                        >
                            {index < statusSteps.length - 1 && (
                                <span
                                    className={`absolute left-[9px] top-5 h-full w-px ${done ? 'bg-primary' : 'bg-border'
                                        }`}
                                />
                            )}

                            <span
                                className={`relative z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${active
                                    ? 'crm-timeline-active'
                                    : done
                                        ? 'crm-timeline-done'
                                        : 'crm-timeline-idle'
                                    }`}
                            >
                                {isUpdating && updatingStatus === step ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                ) : done ? (
                                    <Check className="h-3 w-3 text-white" />
                                ) : active ? (
                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                ) : (
                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                                )}
                            </span>

                            <div
                                className={`min-w-0 flex-1 rounded-md px-2.5 py-1.5 ${active ? 'bg-accent' : 'bg-transparent'
                                    }`}
                            >
                                <p
                                    className={`whitespace-normal break-words text-[12px] leading-snug ${active
                                        ? 'font-semibold text-accent-foreground'
                                        : done
                                            ? 'font-medium text-foreground'
                                            : 'font-medium text-muted-foreground'
                                        }`}
                                >
                                    {step}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </SectionCard>
    );
}

export function AddNoteDialog({
    open,
    onOpenChange,
    onSave,
    isSaving = false,
}) {
    const [form, setForm] = useState({
        date: '',
        note: '',
    });

    useEffect(() => {
        if (!open) {
            setForm({ date: '', note: '' });
        }
    }, [open]);

    const handleSave = () => {
        if (!form.date || !form.note?.trim()) return;

        onSave?.({
            date: form.date,
            note: form.note.trim(),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="crm-card sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle className="crm-title text-[16px] font-semibold">
                        Add Follow-up Note
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label className="crm-title text-[12px] font-medium">
                            Next Follow-up Date
                        </label>
                        <Input
                            type="date"
                            value={form.date}
                            disabled={isSaving}
                            onChange={(event) =>
                                setForm((prev) => ({ ...prev, date: event.target.value }))
                            }
                            className="crm-input mt-1 h-10 rounded-md text-[13px]"
                        />
                    </div>

                    <div>
                        <label className="crm-title text-[12px] font-medium">
                            Note
                        </label>
                        <Textarea
                            value={form.note}
                            disabled={isSaving}
                            onChange={(event) =>
                                setForm((prev) => ({ ...prev, note: event.target.value }))
                            }
                            className="crm-input mt-1 min-h-[110px] resize-none rounded-md text-[13px]"
                            placeholder="Write a short follow-up note..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isSaving}
                            className="crm-outline-button h-10 text-[13px] font-medium"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            disabled={isSaving || !form.date || !form.note?.trim()}
                            className="crm-primary-button h-10 text-[13px] font-medium"
                            onClick={handleSave}
                        >
                            {isSaving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {isSaving ? 'Saving...' : 'Save Note'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

const emptyTask = {
    task: '',
    assignedTo: '',
    dueDate: '',
    status: 'Pending',
};

const taskStatusOptions = ['Pending', 'Upcoming', 'In Progress', 'Completed'];

const taskBadgeClass = (status) => {
    switch (status) {
        case 'Upcoming':
            return 'crm-status-upcoming';
        case 'In Progress':
            return 'crm-status-in-progress';
        case 'Completed':
            return 'crm-status-completed';
        default:
            return 'crm-status-pending';
    }
};

const getTaskOwnerName = (task) => {
    if (!task?.assignedTo) return task?.assignedEmployee?.name || '-';

    if (typeof task.assignedTo === 'object') {
        return task.assignedTo.name || task.assignedTo.email || '-';
    }

    return task.assignedEmployee?.name || task.assignedTo || '-';
};

const getTaskOwnerId = (task) => {
    if (!task?.assignedTo) return '';
    return typeof task.assignedTo === 'object' ? task.assignedTo._id || '' : task.assignedTo;
};

export function TaskManagerDialog({
    open,
    onOpenChange,
    tasks,
    employees = [],
    isSaving = false,
    onAddTask,
    onUpdateTask,
    onDeleteTask,
}) {
    const [form, setForm] = useState(emptyTask);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [deletingTaskId, setDeletingTaskId] = useState(null);

    useEffect(() => {
        if (!open) {
            setForm(emptyTask);
            setEditingTaskId(null);
            setDeletingTaskId(null);
        }
    }, [open]);

    const handleSave = () => {
        if (!form.task.trim() || !form.assignedTo || !form.dueDate || !form.status) return;

        const payload = {
            task: form.task.trim(),
            assignedTo: form.assignedTo,
            dueDate: form.dueDate,
            status: form.status,
        };

        if (editingTaskId) {
            onUpdateTask?.(editingTaskId, payload);
        } else {
            onAddTask?.(payload);
        }

        setForm(emptyTask);
        setEditingTaskId(null);
    };

    const handleEdit = (task) => {
        setForm({
            task: task.task || task.title || '',
            assignedTo: getTaskOwnerId(task),
            dueDate: toInputDate(task.dueDate),
            status: task.status || 'Pending',
        });
        setEditingTaskId(task._id);
    };

    const handleDelete = (taskId) => {
        if (!taskId) return;

        setDeletingTaskId(taskId);
        onDeleteTask?.(taskId);
    };

    useEffect(() => {
        if (!isSaving) {
            setDeletingTaskId(null);
        }
    }, [isSaving]);

    const isFormValid = Boolean(
        form.task.trim() &&
        form.assignedTo &&
        form.dueDate &&
        form.status
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="crm-card sm:max-w-[760px]">
                <DialogHeader>
                    <DialogTitle className="crm-title text-[16px] font-semibold">
                        Manage Client Tasks
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_180px_145px_140px]">
                        <Input
                            value={form.task}
                            disabled={isSaving}
                            onChange={(event) =>
                                setForm((prev) => ({ ...prev, task: event.target.value }))
                            }
                            placeholder="Task"
                            className="crm-input h-10 text-[13px]"
                        />

                        <Select
                            value={form.assignedTo}
                            disabled={isSaving}
                            onValueChange={(value) =>
                                setForm((prev) => ({ ...prev, assignedTo: value }))
                            }
                        >
                            <SelectTrigger className="crm-input h-10 text-[13px]">
                                <SelectValue placeholder="Assigned to" />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map((employee) => (
                                    <SelectItem key={employee._id} value={employee._id}>
                                        {employee.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Input
                            type="date"
                            value={form.dueDate}
                            disabled={isSaving}
                            onChange={(event) =>
                                setForm((prev) => ({ ...prev, dueDate: event.target.value }))
                            }
                            className="crm-input h-10 text-[13px]"
                        />

                        <Select
                            value={form.status}
                            disabled={isSaving}
                            onValueChange={(value) =>
                                setForm((prev) => ({ ...prev, status: value }))
                            }
                        >
                            <SelectTrigger className="crm-input h-10 text-[13px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {taskStatusOptions.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {status}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        type="button"
                        className="crm-primary-button text-[13px] font-medium"
                        disabled={isSaving || !isFormValid}
                        onClick={handleSave}
                    >
                        {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="mr-2 h-4 w-4" />
                        )}
                        {editingTaskId ? 'Update Task' : 'Create Task'}
                    </Button>

                    <div className="overflow-hidden rounded-lg border border-border">
                        <div className="crm-muted-surface grid grid-cols-[minmax(160px,1fr)_130px_115px_105px_70px] px-3 py-2.5 text-[11px] font-medium">
                            <span>Task</span>
                            <span>Owner</span>
                            <span>Due Date</span>
                            <span>Status</span>
                            <span className="text-right">Action</span>
                        </div>

                        {tasks.length === 0 ? (
                            <div className="crm-muted-text px-3 py-8 text-center text-[13px]">
                                No task created yet.
                            </div>
                        ) : (
                            tasks.map((task, index) => (
                                <div
                                    key={`${task.task || task.title}-${index}`}
                                    className="grid grid-cols-[minmax(160px,1fr)_130px_115px_105px_70px] items-center border-t border-border px-3 py-3 text-[12px] text-foreground"
                                >
                                    <span className="min-w-0 whitespace-normal break-words font-medium">
                                        {task.task || task.title || '-'}
                                    </span>
                                    <span className="crm-muted-text min-w-0 whitespace-normal break-words">
                                            {getTaskOwnerName(task)}
                                    </span>
                                    <span className="crm-muted-text">{fmtDate(task.dueDate)}</span>
                                    <Badge
                                        variant="outline"
                                        className={`w-fit rounded-md px-2 py-0.5 text-[11px] font-medium ${taskBadgeClass(
                                            task.status
                                        )}`}
                                    >
                                        {task.status || 'Pending'}
                                    </Badge>

                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            className="text-muted-foreground hover:text-foreground"
                                            disabled={isSaving}
                                            onClick={() => handleEdit(task)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>

                                        <button
                                            type="button"
                                            className="text-destructive hover:text-destructive/80"
                                            disabled={isSaving}
                                            onClick={() => handleDelete(task._id)}
                                        >
                                            {isSaving && deletingTaskId === task._id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

const editableCustomerFields = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Mobile Number' },
    { key: 'eventDate', label: 'Event Date', type: 'date' },
    { key: 'city', label: 'City' },
    { key: 'guests', label: 'Guests', type: 'number' },
    { key: 'functions', label: 'Functions', type: 'number' },
    { key: 'leadSource', label: 'Lead Source' },
    { key: 'eventTitle', label: 'Event Title' },
    { key: 'eventType', label: 'Event Type' },
    { key: 'venue', label: 'Venue' },
    { key: 'budgetRange', label: 'Budget Range' },
    { key: 'decorPreference', label: 'Decor Preference' },
    { key: 'cateringPreference', label: 'Catering Preference' },
    { key: 'proposalAmount', label: 'Proposal Amount' },
    { key: 'proposalSentDate', label: 'Proposal Sent Date', type: 'date' },
];

const buildCustomerUpdatePayload = (form) =>
    editableCustomerFields.reduce((payload, field) => {
        const value = form[field.key];

        if (value === undefined || value === null || value === '') {
            return payload;
        }

        if (field.type === 'number') {
            return {
                ...payload,
                [field.key]: Number(value),
            };
        }

        return {
            ...payload,
            [field.key]: typeof value === 'string' ? value.trim() : value,
        };
    }, {});

export function EditClientSheet({ open, onOpenChange, customer, onSave, isSaving = false }) {
    const [form, setForm] = useState({});

    useEffect(() => {
        if (!customer) return;

        setForm({
            name: customer.name || '',
            eventDate: toInputDate(customer.eventDate),
            city: customer.city || '',
            guests: customer.guests || '',
            functions: customer.functions || '',
            phone: customer.phone || '',
            email: customer.email || '',
            leadSource: customer.leadSource || '',
            eventTitle: customer.eventTitle || '',
            eventType: customer.eventType || '',
            venue: customer.venue || '',
            cateringPreference: customer.cateringPreference || '',
            decorPreference: customer.decorPreference || '',
            budgetRange: customer.budgetRange || '',
            proposalAmount: customer.proposalAmount || '',
            proposalSentDate: toInputDate(customer.proposalSentDate),
        });
    }, [customer, open]);

    const handleSave = () => {
        const payload = buildCustomerUpdatePayload(form);

        if (Object.keys(payload).length === 0) return;

        onSave?.(payload);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full overflow-y-auto border-l border-border bg-card text-card-foreground sm:max-w-[540px]"
            >
                <SheetHeader>
                    <SheetTitle className="crm-title text-[18px] font-semibold">
                        Edit Client
                    </SheetTitle>
                </SheetHeader>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {editableCustomerFields.map((field) => (
                        <div key={field.key} className="min-w-0 space-y-1">
                            <label className="crm-title text-[12px] font-medium">
                                {field.label}
                            </label>
                            <Input
                                type={field.type || 'text'}
                                value={form[field.key] || ''}
                                disabled={isSaving}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        [field.key]: event.target.value,
                                    }))
                                }
                                className="crm-input h-10 rounded-md text-[13px]"
                            />
                        </div>
                    ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isSaving}
                        className="crm-outline-button h-10 text-[13px] font-medium"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="button"
                        disabled={isSaving}
                        className="crm-primary-button h-10 text-[13px] font-medium"
                        onClick={handleSave}
                    >
                        {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export function ViewMoreButton({ children }) {
    return (
        <Button
            type="button"
            variant="ghost"
            className="h-8 px-2 text-[12px] font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
        >
            {children}
            <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
    );
}
