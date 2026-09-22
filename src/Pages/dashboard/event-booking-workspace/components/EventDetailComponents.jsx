/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Download,
  Edit,
  Eye,
  FileText,
  Handshake,
  Home,
  IndianRupee,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  Users,
  Utensils,
} from 'lucide-react';

import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Textarea } from '@components/components/ui/textarea';
import { PaymentBadge, StatusBadge, formatDate } from './EventBookingComponents';

export const fallbackFunctions = [
  { name: 'Mehendi', date: '2025-12-23', startTime: '11:00 AM', venue: 'Lawn Area', guestCount: 120, status: 'Confirmed' },
  { name: 'Sangeet', date: '2025-12-23', startTime: '07:00 PM', venue: 'Ballroom', guestCount: 220, status: 'Confirmed' },
  { name: 'Wedding', date: '2025-12-24', startTime: '08:00 PM', venue: 'Main Venue', guestCount: 300, status: 'Confirmed' },
];

export const fallbackServices = [
  { service: 'Catering', status: 'Confirmed', icon: Utensils },
  { service: 'Decor & Design', status: 'In Progress', icon: Sparkles },
  { service: 'Hospitality', status: 'Confirmed', icon: Home },
  { service: 'Planning', status: 'Active', icon: ClipboardCheck },
  { service: 'Tent / Lighting / Furniture', status: 'Confirmed', icon: Building2 },
  { service: 'Wedding Essentials', status: 'Pending', icon: CalendarDays },
];

export const fallbackTeam = [
  { employee: { name: 'Priya Arora' }, role: 'Event Manager' },
  { employee: { name: 'Pappu Verma' }, role: 'Client Coordination Lead' },
  { employee: { name: 'Siyaram' }, role: 'Inventory Lead' },
  { employee: { name: 'Sumit Chauhan' }, role: 'Finance Contact' },
  { employee: { name: 'Ayush Gupta' }, role: 'Hospitality Lead' },
];

export const fallbackVendors = [
  { vendor: { name: 'Rajesh Events & Decor' }, category: 'Decor', status: 'Confirmed', paymentStatus: 'Partial Paid' },
  { vendor: { name: 'Light Wala' }, category: 'Lighting', status: 'Confirmed', paymentStatus: 'Pending' },
  { vendor: { name: 'Royal Caterers' }, category: 'Catering Contractor', status: 'Confirmed', paymentStatus: 'Advance Received' },
  { vendor: { name: 'Sound Pro' }, category: 'Sound', status: 'Assigned', paymentStatus: 'Pending' },
];

export const fallbackTasks = [
  { taskTitle: 'Confirm final guest count', assignedToName: 'Priya Arora', dueDate: '2025-06-10', status: 'In Progress' },
  { taskTitle: 'Upload final proposal PDF', assignedToName: 'Rishi Prasad', dueDate: '2025-06-05', status: 'Completed' },
  { taskTitle: 'Confirm decor vendor', assignedToName: 'Pappu Verma', dueDate: '2025-06-08', status: 'Pending' },
  { taskTitle: 'Check inventory allocation', assignedToName: 'Siyaram', dueDate: '2025-06-09', status: 'In Progress' },
  { taskTitle: 'Send payment reminder', assignedToName: 'Sumit Chauhan', dueDate: '2025-06-07', status: 'Pending' },
];

export const fallbackDocuments = [
  { documentName: 'Proposal PDF', documentType: 'Proposal', uploadedOn: '2025-05-02' },
  { documentName: 'Quotation', documentType: 'Quotation', uploadedOn: '2025-05-02' },
  { documentName: 'Client Agreement', documentType: 'Agreement', uploadedOn: '2025-05-03' },
  { documentName: 'Payment Receipt', documentType: 'Receipt', uploadedOn: '2025-05-05' },
  { documentName: 'Menu PDF', documentType: 'Menu', uploadedOn: '2025-05-07' },
  { documentName: 'Decor Moodboard', documentType: 'Image', uploadedOn: '2025-05-08' },
  { documentName: 'Vendor Bills', documentType: 'Document', uploadedOn: '2025-05-10' },
];

export const fallbackTimeline = [
  { title: 'Client approved venue and decor direction.', description: 'By Priya Arora', activityDate: '2025-05-08T11:20:00.000Z' },
  { title: 'Advance payment received.', description: 'By Sumit Chauhan', activityDate: '2025-05-05T16:45:00.000Z' },
  { title: 'Rajesh Events & Decor assigned for decor.', description: 'By Pappu Verma', activityDate: '2025-05-04T10:30:00.000Z' },
  { title: 'Menu discussion scheduled with family.', description: 'By Priya Arora', activityDate: '2025-05-03T18:15:00.000Z' },
  { title: 'Inventory review pending.', description: 'By Siyaram', activityDate: '2025-05-02T09:40:00.000Z' },
];

export const safeList = (value, fallback) => (Array.isArray(value) && value.length ? value : fallback);
export const getName = (value) => {
  if (!value) return '-';
  if (typeof value !== 'object') return value;
  return value.name || value.fullName || value.companyName || value.contactPerson || value.title || value.label || value._id || '-';
};
export const getText = (value) => {
  if (!value) return '-';
  if (typeof value !== 'object') return value;
  return getName(value);
};
export const shortDate = (date) => formatDate(date).replace(' 2025', '');
export const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const tones = {
  blue: 'border-blue-200 bg-blue-50 text-blue-600',
  violet: 'border-violet-200 bg-violet-50 text-violet-600',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  amber: 'border-amber-200 bg-amber-50 text-amber-600',
  rose: 'border-rose-200 bg-rose-50 text-rose-600',
  cyan: 'border-cyan-200 bg-cyan-50 text-cyan-600',
};

export function DetailCard({ number, icon: Icon, title, tone = 'blue', action, children }) {
  return (
    <Card className="crm-card min-w-0 overflow-hidden rounded-lg shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
      <CardContent className="p-0">
        <div className="flex min-h-[34px] items-center justify-between border-b border-border px-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-medium ${tones[tone]}`}>{number}</span>
            <Icon className={`h-4 w-4 ${tones[tone].split(' ').at(-1)}`} />
            {title}
          </div>
          {action}
        </div>
        <div className="p-3">{children}</div>
      </CardContent>
    </Card>
  );
}

export function MiniTable({ columns, rows, renderRow, minWidth = 420 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[11px]" style={{ minWidth }}>
        <thead className="text-[10px] font-semibold text-muted-foreground">
          <tr>{columns.map((column) => <th key={column} className="border-b border-border pb-2">{column}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border text-foreground">
          {rows.length ? rows.map(renderRow) : (
            <tr><td colSpan={columns.length} className="py-6 text-center text-muted-foreground">No records added yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function SummaryStrip({ booking, functionsCount }) {
  const cells = [
    { label: 'Event Name', value: booking.eventName, icon: Users, wide: true },
    { label: 'Client', value: booking.customer?.name, icon: User },
    { label: 'Status', badge: <StatusBadge status={booking.bookingStatus} /> },
    { label: 'Event Date', value: formatDate(booking.eventDate), icon: CalendarDays },
    { label: 'City', value: booking.city, icon: MapPin },
    { label: 'Venue', value: booking.venue, icon: Building2 },
    { label: 'Guests', value: booking.guestCount, icon: Users },
    { label: 'Functions', value: booking.noOfFunctions || functionsCount, icon: CalendarDays },
    { label: 'Event Manager', value: booking.assignedManager?.name, icon: User, wide: true },
    { label: 'Payment Status', badge: <PaymentBadge status={booking.paymentStatus} />, wide: true },
  ];

  return (
    <Card className="crm-card overflow-hidden rounded-lg">
      <CardContent className="grid p-0 sm:grid-cols-2 lg:grid-cols-6">
        {cells.map((cell) => (
          <div key={cell.label} className={`flex min-h-[58px] items-center gap-3 px-3 py-2.5 ${cell.wide ? 'sm:col-span-2' : ''}`}>
            {cell.icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-600"><cell.icon className="h-4 w-4" /></span>}
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground">{cell.label}</p>
              <div className="mt-1 truncate text-xs font-semibold text-foreground">{cell.badge || cell.value || '-'}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ReadinessRing({ value }) {
  const percentage = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="relative h-24 w-24 shrink-0">
      <div className="h-full w-full rounded-full" style={{ background: `conic-gradient(hsl(var(--chart-2)) ${percentage * 3.6}deg, hsl(var(--muted)) 0deg)` }} />
      <div className="absolute inset-3 flex items-center justify-center rounded-full bg-card text-xl font-semibold text-foreground">{percentage}%</div>
    </div>
  );
}

export const quickActionConfigs = [
  { key: 'edit', label: 'Edit Event', icon: Edit },
  { key: 'function', label: 'Add Function', icon: Plus },
  { key: 'team', label: 'Assign Team', icon: Users },
  { key: 'vendor', label: 'Assign Vendor', icon: Handshake },
  { key: 'task', label: 'Add Task', icon: ClipboardList },
  { key: 'document', label: 'Upload Document', icon: Upload },
  { key: 'payment', label: 'Add Payment Note', icon: ReceiptText },
];

const defaultForms = {
  function: { name: '', fromDate: '', toDate: '', startTime: '', endTime: '', venue: '', guestCount: '', status: 'Confirmed', notes: '' },
  team: { employee: '', role: '', responsibility: '', isPrimary: false, notes: '' },
  vendor: { vendor: '', service: '', category: '', status: 'Confirmed', paymentStatus: 'Advance Received', quotationAmount: '', agreedAmount: '', notes: '' },
  task: { taskTitle: '', description: '', assignedTo: '', assignedToName: '', dueDate: '', priority: 'High', status: 'In Progress' },
  document: { documentName: '', documentType: '', fileUrl: '', fileType: '', fileSize: '', notes: '' },
  payment: { title: '', amount: '', paymentMode: 'Bank Transfer', status: 'Received', paymentDate: '', dueDate: '', referenceNo: '', note: '' },
  ready: { remarks: 'All critical event planning items are ready.' },
};

function normalizePayload(key, form) {
  const payload = { ...form };
  ['guestCount', 'quotationAmount', 'agreedAmount', 'amount', 'fileSize'].forEach((field) => {
    if (payload[field] !== undefined && payload[field] !== '') payload[field] = Number(payload[field]);
  });
  if (key === 'payment') {
    payload.transactionType = 'Income';
    payload.direction = 'In';
    payload.isAdvance = true;
  }
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== ''));
}

export function QuickActionDialog({ open, onOpenChange, action, employees, saving, onSubmit }) {
  const [form, setForm] = useState(defaultForms[action?.key] || {});

  useEffect(() => {
    setForm(defaultForms[action?.key] || {});
  }, [action]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    onSubmit(action.key, normalizePayload(action.key, form));
  };

  const fields = useMemo(() => {
    switch (action?.key) {
      case 'function':
        return [['name', 'Function Name'], ['fromDate', 'From Date', 'date'], ['toDate', 'To Date', 'date'], ['startTime', 'Start Time'], ['endTime', 'End Time'], ['venue', 'Venue'], ['guestCount', 'Guests', 'number'], ['notes', 'Notes', 'textarea']];
      case 'team':
        return [['employee', 'Employee', 'employee'], ['role', 'Role'], ['responsibility', 'Responsibility'], ['notes', 'Notes', 'textarea']];
      case 'vendor':
        return [['vendor', 'Vendor ID'], ['service', 'Service'], ['category', 'Category'], ['quotationAmount', 'Quotation Amount', 'number'], ['agreedAmount', 'Agreed Amount', 'number'], ['notes', 'Notes', 'textarea']];
      case 'task':
        return [['taskTitle', 'Task Title'], ['assignedTo', 'Employee ID'], ['assignedToName', 'Assignee Name'], ['dueDate', 'Due Date', 'date'], ['description', 'Description', 'textarea']];
      case 'document':
        return [['documentName', 'Document Name'], ['documentType', 'Document Type'], ['fileUrl', 'File URL'], ['fileType', 'File Type'], ['fileSize', 'File Size', 'number'], ['notes', 'Notes', 'textarea']];
      case 'payment':
        return [['title', 'Payment Title'], ['amount', 'Amount', 'number'], ['paymentDate', 'Payment Date', 'date'], ['dueDate', 'Due Date', 'date'], ['referenceNo', 'Reference No'], ['note', 'Note', 'textarea']];
      case 'ready':
        return [['remarks', 'Remarks', 'textarea']];
      default:
        return [];
    }
  }, [action]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-[520px]">
        <div className="border-b border-border p-5">
          <DialogHeader className="text-left"><DialogTitle className="text-base font-semibold text-foreground">{action?.label || 'Quick Action'}</DialogTitle></DialogHeader>
        </div>
        <form className="space-y-4 p-5" onSubmit={submit}>
          {fields.map(([key, label, type = 'text']) => (
            <div key={key} className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">{label}</Label>
              {type === 'textarea' ? (
                <Textarea className="crm-input min-h-[96px]" value={form[key] || ''} onChange={(event) => update(key, event.target.value)} />
              ) : type === 'employee' ? (
                <Select value={form[key] || ''} onValueChange={(value) => update(key, value)}>
                  <SelectTrigger className="crm-input h-10"><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => <SelectItem key={employee._id} value={employee._id}>{employee.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input className="crm-input h-10" type={type} value={form[key] || ''} onChange={(event) => update(key, event.target.value)} />
              )}
            </div>
          ))}
          <Button type="submit" className="crm-primary-button h-10 w-full text-xs font-semibold" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const detailIcons = {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Download,
  Eye,
  FileText,
  Handshake,
  IndianRupee,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Users,
};
