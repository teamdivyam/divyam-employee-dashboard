import React from "react";
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import { Textarea } from "@components/components/ui/textarea";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Send,
  UserRound,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  DataTable,
  formatDate,
  formatDateTime,
  IconPill,
  MetricCard,
  SectionCard,
  StatusBadge,
} from "../../my-tasks/components/WorkPanelUI";

export const emptyLeaveForm = {
  leaveType: "",
  fromDate: "",
  toDate: "",
  duration: "Full Day",
  reason: "",
  attachment: null,
};

export const emptyCheckInForm = {
  locationType: "Office",
  locationName: "Head Office",
  locationAddress: "Prayagraj",
  latitude: "",
  longitude: "",
  attendanceSource: "Web Portal",
  notes: "Starting work",
};

export function PageHeader() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-950">Attendance / Leave</h1>
      <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-500">
        <span>Home</span>
        <span>/</span>
        <span>Attendance / Leave</span>
      </div>
    </div>
  );
}

export function AttendanceMetrics({ dashboard }) {
  const metrics = [
    ["Today Status", dashboard.todayStatus || "Not Marked", dashboard.checkInTime ? `Since ${formatTime(dashboard.checkInTime)}` : "Today", CalendarDays, "blue"],
    ["Check-in Time", dashboard.checkInTime ? formatTime(dashboard.checkInTime) : "--:--", dashboard.checkInTime ? formatDate(dashboard.checkInTime) : "Not Checked In", LogIn, "green"],
    ["Check-out Time", dashboard.checkOutTime ? formatTime(dashboard.checkOutTime) : "--:-- --", dashboard.checkOutTime ? formatDate(dashboard.checkOutTime) : "Not Checked Out", LogOut, "orange"],
    ["Working Hours", dashboard.workingHours || "00h 00m", "Till Now", Clock3, "violet"],
    ["Leaves Taken", `${dashboard.leavesTakenThisMonth || 0} Days`, "This Month", UserRound, "orange"],
    ["Pending Requests", dashboard.pendingRequests || 0, "Request(s)", FileText, "red"],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {metrics.map(([label, value, subLabel, Icon, tone]) => (
        <MetricCard key={label} label={label} value={value} subLabel={subLabel} icon={Icon} tone={tone} />
      ))}
    </div>
  );
}

export function TodayAttendanceCard({
  dashboard,
  checkInForm,
  setCheckInForm,
  checkOutNotes,
  setCheckOutNotes,
  onCheckIn,
  onCheckOut,
  checkingIn,
  checkingOut,
}) {
  const checkedIn = Boolean(dashboard.checkInTime);
  const checkedOut = Boolean(dashboard.checkOutTime);

  return (
    <SectionCard
      title="Today's Attendance"
      icon={UserRound}
      action={<StatusBadge>{dashboard.todayStatus || "Not Marked"}</StatusBadge>}
    >
      <p className="-mt-2 mb-4 text-xs font-medium text-slate-500">{formatLongDate(new Date())}</p>
      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.8fr]">
        <div className="grid gap-4 rounded-lg border border-emerald-100 bg-emerald-50/40 p-4 sm:grid-cols-2">
          <div className="border-slate-200 sm:border-r">
            <p className="text-xs font-medium text-slate-700">Check In</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-600">{dashboard.checkInTime ? formatTime(dashboard.checkInTime) : "--:-- --"}</p>
            <p className="mt-2 text-xs font-medium text-slate-600">{dashboard.checkInTime ? formatDate(dashboard.checkInTime) : "Today"}</p>
            <Button
              variant="outline"
              className="mt-4 h-9 min-w-[150px] border-emerald-200 bg-white text-xs font-medium text-emerald-700 hover:bg-emerald-50"
              disabled={checkedIn || checkingIn}
              onClick={onCheckIn}
            >
              {checkingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {checkedIn ? "Checked In ✓" : "Check In"}
            </Button>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-700">Check Out</p>
            <p className="mt-2 text-2xl font-semibold text-orange-500">{dashboard.checkOutTime ? formatTime(dashboard.checkOutTime) : "--:-- --"}</p>
            <p className="mt-2 text-xs font-medium text-slate-600">{dashboard.checkOutTime ? formatDate(dashboard.checkOutTime) : "Not checked out"}</p>
            <Button
              variant="outline"
              className="mt-4 h-9 min-w-[150px] border-orange-200 bg-white text-xs font-medium text-orange-600 hover:bg-orange-50"
              disabled={!checkedIn || checkedOut || checkingOut}
              onClick={onCheckOut}
            >
              {checkingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Check Out
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          <InfoRow label="Working Hours" value={dashboard.workingHours || "00h 00m"} />
          <InfoRow label="Location" value={`${checkInForm.locationName}, ${checkInForm.locationAddress}`} />
          <InfoRow label="Attendance Source" value={checkInForm.attendanceSource} />
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">Note (Optional)</label>
            <Textarea
              value={checkedIn && !checkedOut ? checkOutNotes : checkInForm.notes}
              onChange={(event) => checkedIn && !checkedOut ? setCheckOutNotes(event.target.value) : setCheckInForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Add note for today..."
              className="min-h-14 resize-none border-slate-200 text-xs"
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export function LeaveRequestForm({ form, setForm, meta, onSubmit, loading, onBalance }) {
  const leaveTypes = meta.leaveTypes?.length ? meta.leaveTypes : ["Casual Leave", "Sick Leave", "Event Comp-off", "Emergency Leave", "Unpaid Leave"];
  const durations = meta.leaveDurations?.length ? meta.leaveDurations : ["Full Day", "Half Day"];
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <SectionCard
      title="Request Leave"
      icon={CalendarDays}
      action={<button type="button" onClick={onBalance} className="text-xs font-medium text-blue-600">View Leave Balance</button>}
    >
      <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Leave Type *" value={form.leaveType} values={leaveTypes} placeholder="Select Leave Type" onChange={(value) => setField("leaveType", value)} />
          <SelectField label="Half / Full Day" value={form.duration} values={durations} onChange={(value) => setField("duration", value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormInput label="From Date *" type="date" value={form.fromDate} onChange={(value) => setField("fromDate", value)} />
          <FormInput label="To Date *" type="date" value={form.toDate} onChange={(value) => setField("toDate", value)} />
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">Attachment <span className="text-slate-400">(Optional)</span></label>
            <Input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(event) => setField("attachment", event.target.files?.[0] || null)} className="h-9 border-slate-200 text-xs" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600">Reason *</label>
          <Textarea value={form.reason} onChange={(event) => setField("reason", event.target.value)} placeholder="Enter reason for leave..." className="h-9 min-h-9 resize-none border-slate-200 py-2 text-xs" />
        </div>
        <Button type="submit" className="h-10 w-full gap-2 bg-blue-600 text-xs font-medium text-white hover:bg-blue-700" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit Leave Request
        </Button>
      </form>
    </SectionCard>
  );
}

export function LeaveRequestsTable({ requests, loading, onView }) {
  return (
    <SectionCard title="My Leave Requests" icon={FileText} action={<span className="text-xs font-medium text-blue-600">View All</span>}>
      {loading && !requests.length ? (
        <LoadingLine label="Loading leave requests" />
      ) : (
        <DataTable
          emptyText="No leave requests found."
          headers={["#", "Leave Type", "From - To", "Days", "Reason", "Status", "Approved By", "Action"]}
          rows={requests.slice(0, 4).map((leave, index) => [
            index + 1,
            <span className="font-medium text-slate-800">{leave.leaveType}</span>,
            dateRange(leave.fromDate, leave.toDate),
            `${leave.leaveDays || (leave.duration === "Half Day" ? 0.5 : 1)} Day${Number(leave.leaveDays) > 1 ? "s" : ""}`,
            <span className="text-slate-700">{leave.reason || "-"}</span>,
            <StatusBadge>{leave.leaveStatus}</StatusBadge>,
            <span>
              <span className="block font-medium text-slate-800">{leave.approval?.actionBy?.fullName || "-"}</span>
              <span className="block text-xs text-slate-500">{leave.approval?.actionAt ? formatDate(leave.approval.actionAt) : ""}</span>
            </span>,
            <button type="button" onClick={() => onView(leave)} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
              <Eye className="h-4 w-4" />
            </button>,
          ])}
        />
      )}
    </SectionCard>
  );
}

export function EventDutyTable({ duties }) {
  return (
    <SectionCard title="Event Duty Attendance" icon={CalendarDays}>
      <DataTable
        emptyText="No event duty attendance found."
        headers={["#", "Event Name", "Duty Date", "Reporting Time", "Venue / City", "Role", "Duty Status"]}
        rows={(duties || []).slice(0, 3).map((duty, index) => [
          index + 1,
          <span className="font-medium text-slate-800">{duty.eventName || duty.event?.eventName || "-"}</span>,
          formatDate(duty.dutyDate || duty.eventDate),
          duty.reportingTime || duty.time || "-",
          duty.venueCity || duty.venue || duty.city || "-",
          duty.role || duty.dutyRole || "-",
          <StatusBadge>{duty.dutyStatus || duty.status || "Assigned"}</StatusBadge>,
        ])}
      />
    </SectionCard>
  );
}

export function MonthlySummary({ summary }) {
  const total = Number(summary.totalDays) || 1;
  const data = [
    { name: "Present Days", value: Number(summary.presentDays) || 0, color: "#22c55e" },
    { name: "Absent Days", value: Number(summary.absentDays) || 0, color: "#ef4444" },
    { name: "Late Days", value: Number(summary.lateDays) || 0, color: "#fb923c" },
    { name: "Leave Days", value: Number(summary.leaveDays) || 0, color: "#8b5cf6" },
  ];

  return (
    <SectionCard
      title="Monthly Attendance Summary"
      action={<span className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">May 2025</span>}
    >
      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
        <div className="relative h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={48} outerRadius={68} paddingAngle={1}>
                {data.map((item) => <Cell key={item.name} fill={item.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-xs font-medium text-slate-500">Total</p>
              <p className="text-2xl font-semibold text-slate-950">{total}</p>
              <p className="text-xs text-slate-500">Days</p>
            </div>
          </div>
        </div>
        <div className="space-y-3 pt-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-2 font-medium text-slate-700">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
              <span className="font-medium text-slate-900">{item.value} ({((item.value / total) * 100).toFixed(2)}%)</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-sm">
        <span className="font-medium text-slate-800">Total Working Hours</span>
        <span className="font-semibold text-slate-950">{summary.totalWorkingHours || "00h 00m"}</span>
      </div>
    </SectionCard>
  );
}

export function AttendanceGuidelines() {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-4">
      <div className="flex gap-3">
        <IconPill icon={Clock3} tone="blue" />
        <div>
          <h3 className="text-sm font-semibold text-blue-700">Attendance Guidelines</h3>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs font-normal leading-5 text-slate-700">
            <li>Please check-in when you start your work.</li>
            <li>Check-out when your day's work is completed.</li>
            <li>For event duties, attendance will be marked by admin.</li>
            <li>Leave requests require approval from your reporting manager.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function LeaveBalancePanel({ balances }) {
  return (
    <SectionCard title="Leave Balance">
      <div className="space-y-3">
        {balances.length ? balances.map((item) => (
          <div key={item.leaveType} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-900">{item.leaveType}</span>
              <span className="font-semibold text-blue-600">{item.balance} left</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(100, (Number(item.used || 0) / Number(item.allotted || 1)) * 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">{item.used} used of {item.allotted} allotted</p>
          </div>
        )) : <p className="text-xs text-slate-500">No leave balance data.</p>}
      </div>
    </SectionCard>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-xs">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value || "-"}</span>
    </div>
  );
}

function SelectField({ label, value, values, onChange, placeholder }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 border-slate-200 text-xs font-normal">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {values.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function FormInput({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <Input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} className="h-9 border-slate-200 text-xs" />
    </div>
  );
}

function LoadingLine({ label }) {
  return (
    <div className="p-8 text-center text-xs text-slate-500">
      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-blue-600" />
      {label}
    </div>
  );
}

export function formatTime(value) {
  if (!value) return "--:--";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatLongDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function dateRange(fromDate, toDate) {
  if (!fromDate) return "-";
  if (!toDate || formatDate(fromDate) === formatDate(toDate)) return formatDate(fromDate);
  return `${formatDate(fromDate)} - ${formatDate(toDate)}`;
}
