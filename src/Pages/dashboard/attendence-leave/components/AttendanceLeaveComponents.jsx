/* eslint-disable react/prop-types, react-refresh/only-export-components */
import React from "react";
import {
  AlertTriangle,
  Ban,
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FilePenLine,
  FileText,
  HeartPulse,
  Info,
  LogIn,
  LogOut,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Umbrella,
  UserRoundCheck,
  XCircle,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/components/ui/dropdown-menu";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export const DEFAULT_SHIFT_START_TIME = "11:00 AM";
export const DEFAULT_SHIFT_END_TIME = "07:30 PM";

export const tabs = [
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "monthly", label: "Monthly Attendance", icon: CalendarCheck },
  { id: "leaves", label: "Leave Requests", icon: Umbrella },
  { id: "duty", label: "Event Duty", icon: BriefcaseBusiness },
  { id: "corrections", label: "Correction Requests", icon: FilePenLine },
  { id: "rules", label: "Attendance Rules", icon: FileText },
];

export function displayText(value, fallback = "--") {
  if (value === null || value === undefined || value === "") return fallback;
  if (React.isValidElement(value)) return value;
  if (Array.isArray(value)) return value.map((item) => displayText(item, "")).filter(Boolean).join(", ") || fallback;
  if (typeof value === "object") {
    return (
      value.label ||
      value.status ||
      value.name ||
      value.title ||
      value.value ||
      value.text ||
      value.description ||
      fallback
    );
  }
  return value;
}

const text = displayText;

function getDateWithTime(dateValue, timeValue = DEFAULT_SHIFT_START_TIME) {
  const baseDate = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(baseDate.getTime())) return null;

  const time = String(timeValue || DEFAULT_SHIFT_START_TIME).trim();
  const match = time.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  baseDate.setHours(hours, minutes, 0, 0);
  return baseDate;
}

export function isLateCheckIn(checkInTime, shiftStartTime = DEFAULT_SHIFT_START_TIME) {
  if (!checkInTime) return false;
  const checkInDate = new Date(checkInTime);
  const shiftStartDate = getDateWithTime(checkInTime, shiftStartTime);
  if (Number.isNaN(checkInDate.getTime()) || !shiftStartDate) return false;
  return checkInDate > shiftStartDate;
}

export function isEarlyCheckOut(checkOutTime, shiftEndTime = DEFAULT_SHIFT_END_TIME) {
  if (!checkOutTime) return false;
  const checkOutDate = new Date(checkOutTime);
  const shiftEndDate = getDateWithTime(checkOutTime, shiftEndTime);
  if (Number.isNaN(checkOutDate.getTime()) || !shiftEndDate) return false;
  return checkOutDate < shiftEndDate;
}

export function resolvePresenceStatus(attendance = {}) {
  const value = String(attendance.status || "").toLowerCase();
  if (value.includes("absent")) return "Absent";
  if (attendance.checkInTime || value.includes("present") || value.includes("late") || value.includes("half")) return "Present";
  return "Absent";
}

export function formatDisplayDate(value) {
  value = displayText(value, "");
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "long",
  });
}

export function formatShortDate(value) {
  value = displayText(value, "");
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatTime(value) {
  value = displayText(value, "");
  if (!value || value === "--") return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function StatusPill({ children, tone = "green" }) {
  const tones = {
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
    red: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
    orange: "bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
    purple: "bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300",
    gray: "bg-muted text-muted-foreground",
  };
  return <span className={`inline-flex rounded px-2 py-0.5 text-[11px] ${tones[tone] || tones.gray}`}>{displayText(children)}</span>;
}

export function Panel({ children, className = "" }) {
  return <section className={`rounded-lg border border-border bg-card text-card-foreground shadow-sm ${className}`}>{children}</section>;
}

export function SectionTitle({ icon: Icon, children, action }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
      <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="h-4 w-4 text-[#f97316]" />
        {children}
      </h2>
      {action}
    </div>
  );
}

export function SummaryCard({ icon: Icon, label, value, sub, tone = "green" }) {
  const tones = {
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
    orange: "bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300",
    red: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
    purple: "bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300",
  };
  return (
    <Panel className="flex min-h-[88px] items-center gap-4 p-4">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${tones[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground">{displayText(label)}</p>
        <p className="mt-1 truncate text-lg font-semibold text-foreground">{displayText(value)}</p>
        <p className={`mt-1 text-xs ${tone === "red" ? "text-red-600" : "text-muted-foreground"}`}>{displayText(sub)}</p>
      </div>
    </Panel>
  );
}

export function TopTabs({ activeTab, onChange }) {
  return (
    <Panel className="overflow-x-auto">
      <div className="flex min-w-max items-center gap-4 px-3">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-medium transition ${
              activeTab === id ? "border-[#f97316] text-[#f97316]" : "border-transparent text-foreground hover:text-[#f97316]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </Panel>
  );
}

export function TodayPanel({ attendance, duty }) {
  const presenceStatus = resolvePresenceStatus(attendance);
  const isLate = isLateCheckIn(attendance.checkInTime);
  const isTooEarly = isEarlyCheckOut(attendance.checkOutTime);
  const locationLabel =
    attendance.locationName ||
    attendance.locationAddress ||
    attendance.location?.address ||
    attendance.location?.locationAddress ||
    (attendance.latitude && attendance.longitude ? `${attendance.latitude}, ${attendance.longitude}` : "");
  const rows = [
    ["Date", formatDisplayDate(attendance.date || attendance.attendanceDate)],
    ["Status", <StatusPill key="attendance-status" tone={statusTone(presenceStatus)}>{presenceStatus}</StatusPill>],
    ["Shift Time", `${DEFAULT_SHIFT_START_TIME} - ${DEFAULT_SHIFT_END_TIME}`],
    ["Check-In Time", <><span className={isLate ? "text-orange-600" : "text-emerald-600"}>{formatTime(attendance.checkInTime)}</span> {attendance.checkInTime && <StatusPill tone={isLate ? "orange" : "green"}>{isLate ? "Late" : "In Time"}</StatusPill>}</>],
    ["Check-Out Time", <><span>{formatTime(attendance.checkOutTime)}</span> {isTooEarly && <StatusPill tone="orange">Too Early</StatusPill>} {!attendance.checkOutTime && <StatusPill tone="orange">Not Checked Out</StatusPill>}</>],
    ["Location", <> {text(locationLabel)}</>],
  ];
  return (
    <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
      <Panel>
        <SectionTitle icon={CalendarCheck}>Today&apos;s Attendance</SectionTitle>
        <div className="grid gap-x-10 gap-y-3 p-4 md:grid-cols-2">
          {rows.map(([label, value]) => (
            <React.Fragment key={label}>
              <p className="text-xs text-foreground">{label}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-foreground">{value}</div>
            </React.Fragment>
          ))}
        </div>
      </Panel>
      <Panel className="bg-blue-50/50 dark:bg-blue-400/5">
        <SectionTitle icon={BriefcaseBusiness}>Today&apos;s Duty</SectionTitle>
        <div className="space-y-4 p-4 text-xs">
          <InfoRow label="Duty Type" value={<StatusPill tone="blue">{text(duty.dutyType)}</StatusPill>} />
          <InfoRow label="Department" value={text(duty.department)} />
          <InfoRow label="Reporting Manager" value={<>{text(duty.reportingManager)}<br /><span className="text-muted-foreground">{text(duty.managerRole)}</span></>} />
          <InfoRow label="Remarks" value={text(duty.remarks)} />
        </div>
      </Panel>
    </div>
  );
}

export function InfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function AttendanceTable({
  rows,
  monthLabel,
  title = "Monthly Attendance",
  showFullReportButton = false,
  onViewFullReport,
  onAddCorrection,
}) {
  const safeRows = rows?.length ? rows : [];
  const [selectedAttendance, setSelectedAttendance] = React.useState(null);
  return (
    <Panel>
      <SectionTitle
        icon={CalendarDays}
        action={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs"><ChevronLeft className="h-3.5 w-3.5" />{monthLabel}<ChevronRight className="h-3.5 w-3.5" /></button>
            <button className="hidden items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs md:flex"><Download className="h-3.5 w-3.5" />Download</button>
          </div>
        }
      >
        {title} - {monthLabel}
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-xs">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>{["Date", "Status", "Check In", "Check Out", "Working Hours", "Duty Type", "Action"].map((h) => <th key={h} className="px-4 py-2 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {safeRows.map((row, index) => {
              const rowStatus = resolvePresenceStatus(row);
              return (
                <tr key={row._id || row.id || index} className="border-t border-border">
                  <td className="px-4 py-2">{formatShortDate(row.date || row.attendanceDate)}</td>
                  <td className="px-4 py-2"><StatusPill tone={statusTone(rowStatus)}>{rowStatus}</StatusPill></td>
                  <td className="px-4 py-2">{formatTime(row.checkInTime)}</td>
                  <td className="px-4 py-2">{formatTime(row.checkOutTime)}</td>
                  <td className="px-4 py-2">{text(row.workingHours || row.totalWorkingHours)}</td>
                  <td className="px-4 py-2">{text(row.dutyType)}</td>
                  <td className="px-4 py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted"
                          aria-label="Attendance actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => setSelectedAttendance(row)}>
                          <Eye className="h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddCorrection?.(row)}>
                          <Pencil className="h-4 w-4" />
                          Add Correction
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
            {!safeRows.length && <tr><td colSpan="7" className="px-4 py-8 text-center text-muted-foreground">No attendance records found.</td></tr>}
          </tbody>
        </table>
      </div>
      {showFullReportButton && (
        <div className="flex justify-center p-4">
          <button
            type="button"
            onClick={onViewFullReport}
            className="rounded-md border border-border px-4 py-2 text-xs font-medium"
          >
            View Full Monthly Report
          </button>
        </div>
      )}
      <AttendanceDetailDialog attendance={selectedAttendance} onOpenChange={(open) => !open && setSelectedAttendance(null)} />
    </Panel>
  );
}

function AttendanceDetailDialog({ attendance, onOpenChange }) {
  const open = Boolean(attendance);
  if (!attendance) return null;

  const location =
    attendance.locationName ||
    attendance.locationAddress ||
    attendance.location?.address ||
    attendance.location?.locationAddress ||
    (attendance.latitude && attendance.longitude ? `${attendance.latitude}, ${attendance.longitude}` : "");
  const details = [
    ["Date", formatDisplayDate(attendance.date || attendance.attendanceDate)],
    ["Status", resolvePresenceStatus(attendance)],
    ["Check In", formatTime(attendance.checkInTime)],
    ["Check Out", formatTime(attendance.checkOutTime)],
    ["Working Hours", text(attendance.workingHours || attendance.totalWorkingHours)],
    ["Working Minutes", text(attendance.workingMinutes)],
    ["Duty Type", text(attendance.dutyType)],
    ["Location Type", text(attendance.locationType)],
    ["Location Name", text(attendance.locationName)],
    ["Location Address", text(location)],
    ["Latitude", text(attendance.latitude || attendance.location?.latitude)],
    ["Longitude", text(attendance.longitude || attendance.location?.longitude)],
    ["Source", text(attendance.attendanceSource)],
    ["Notes", text(attendance.notes || attendance.remark || attendance.remarks)],
    ["Admin Correction Note", text(attendance.adminCorrectionNote || attendance.correctionNote || attendance.adminRemark || attendance.adminRemarks || attendance.adminNote)],
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="atl-card max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">Attendance Detail</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 text-xs">
          {details.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[140px_1fr] gap-3 rounded-md border border-border px-3 py-2">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SimpleList({ title, icon, rows, emptyText, renderRow }) {
  const Icon = icon;
  return (
    <Panel>
      <SectionTitle icon={Icon}>{title}</SectionTitle>
      <div className="divide-y divide-border">
        {rows?.length ? rows.map(renderRow) : <p className="p-5 text-center text-xs text-muted-foreground">{emptyText}</p>}
      </div>
    </Panel>
  );
}

export function CorrectionForm({ form, setForm, onSubmit, isPending }) {
  const input = "rounded-md border border-input bg-background px-3 py-2 text-xs outline-none focus:border-primary";
  return (
    <Panel>
      <SectionTitle icon={FilePenLine}>Request Attendance Correction</SectionTitle>
      <form onSubmit={onSubmit} className="grid gap-3 p-4 md:grid-cols-2">
        <input className={input} type="date" value={form.attendanceDate} onChange={(e) => setForm({ ...form, attendanceDate: e.target.value })} required />
        <select className={input} value={form.correctionType} onChange={(e) => setForm({ ...form, correctionType: e.target.value })}>
          <option>Check_In</option><option>Check_Out</option><option>Status</option><option>Both</option>
        </select>
        <input className={input} type="datetime-local" value={form.requestedCheckInTime} onChange={(e) => setForm({ ...form, requestedCheckInTime: e.target.value })} />
        <input className={input} type="datetime-local" value={form.requestedCheckOutTime} onChange={(e) => setForm({ ...form, requestedCheckOutTime: e.target.value })} />
        <select className={input} value={form.requestedStatus} onChange={(e) => setForm({ ...form, requestedStatus: e.target.value })}>
          <option>Present</option><option>Late</option><option>Absent</option><option>Paid Leave</option>
        </select>
        <input className={input} type="file" onChange={(e) => setForm({ ...form, attachment: e.target.files?.[0] })} />
        <textarea className={`${input} md:col-span-2`} rows="3" placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
        <button disabled={isPending} className="rounded-md bg-[#f97316] px-4 py-2 text-xs font-medium text-white disabled:opacity-60">
          {isPending ? "Submitting..." : "Submit Correction"}
        </button>
      </form>
    </Panel>
  );
}

export function RightRail({ health, quickActions, alerts, note, setActiveTab, monthLabel }) {
  const actions = quickActions || [];
  const presentDays = Number(health.presentDays) || 0;
  const absentDays = Number(health.absentDays) || 0;
  const leaveDays = Number(health.leaveDays) || 0;
  const healthTotal = presentDays + absentDays + leaveDays;
  const healthPercent = healthTotal ? Math.round((presentDays / healthTotal) * 100) : null;
  const healthItems = [
    { name: "Present", value: presentDays, color: "hsl(var(--chart-2))" },
    { name: "Absent", value: absentDays, color: "hsl(var(--chart-5))" },
    { name: "Leaves", value: leaveDays, color: "hsl(var(--chart-4))" },
  ];
  const visibleHealthItems = healthItems.filter((item) => item.value > 0);
  const getAlertMeta = (alert = {}) => {
    const value = String(alert.status || alert.title || "").toLowerCase();
    if (value.includes("approved")) return { icon: CheckCircle2, className: "text-emerald-600" };
    if (value.includes("reject")) return { icon: XCircle, className: "text-red-600" };
    if (value.includes("cancel")) return { icon: Ban, className: "text-slate-500" };
    if (value.includes("pending")) return { icon: Clock3, className: "text-orange-600" };
    return { icon: Bell, className: "text-blue-600" };
  };

  return (
    <aside className="space-y-4">
      <Panel>
        <SectionTitle
          icon={HeartPulse}
          action={<span className="text-xs font-medium text-muted-foreground">{displayText(monthLabel, "Current Month")}</span>}
        >
          Attendance Health
        </SectionTitle>
        <div className="grid grid-cols-[126px_1fr] items-center gap-4 p-4 text-xs">
          <div className="relative h-28 w-28">
            {visibleHealthItems.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visibleHealthItems}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={34}
                    outerRadius={52}
                    paddingAngle={4}
                    cornerRadius={8}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                  >
                    {visibleHealthItems.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} Days`, name]}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full rounded-full border-[10px] border-muted" />
            )}
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{healthPercent === null ? "--" : `${healthPercent}%`}</p>
                <p className="text-[10px] font-medium text-muted-foreground">Present</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {healthItems.map((item) => (
              <RailStat
                key={item.name}
                label={
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                }
                value={`${item.value} Days`}
              />
            ))}
            <RailStat label="Total" value={`${healthTotal} Days`} />
          </div>
        </div>
      </Panel>
      <Panel>
        <SectionTitle icon={Zap}>Quick Actions</SectionTitle>
        <div className="space-y-3 p-4">
          {actions.map((action, index) => {
            const Icon = action.icon || [Umbrella, FilePenLine, FileText, UserRoundCheck][index % 4];
            return (
              <button key={displayText(action.title || action.label, index)} onClick={() => action.tab && setActiveTab(action.tab)} className="flex w-full items-start gap-3 text-left text-xs">
                <Icon className="mt-0.5 h-4 w-4 text-blue-600" />
                <span><b className="block font-medium text-foreground">{displayText(action.title || action.label)}</b><span className="text-muted-foreground">{displayText(action.description)}</span></span>
              </button>
            );
          })}
          {!actions.length && <p className="text-center text-xs text-muted-foreground">No quick actions available.</p>}
        </div>
      </Panel>
      <Panel>
        <SectionTitle icon={Bell}>Alerts & Notifications</SectionTitle>
        <div className="p-3">
          <ul className="space-y-3">
            {(alerts || []).map((alert, index) => {
              const { icon: AlertIcon, className } = getAlertMeta(alert);
              return (
                <li key={index} className="flex gap-2 text-xs">
                  <AlertIcon className={`mt-0.5 h-4 w-4 shrink-0 ${className}`} />
                  <div className="min-w-0">
                    <p className="font-medium leading-4 text-foreground">{displayText(alert.title)}</p>
                    <p className="mt-0.5 leading-4 text-muted-foreground">{displayText(alert.description || alert.message)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          {!alerts?.length && <p className="p-2 text-center text-xs text-muted-foreground">No alerts found.</p>}
        </div>
      </Panel>
      <Panel className="border-orange-200 bg-orange-50/70 dark:bg-orange-400/10">
        <div className="flex gap-3 p-4 text-xs">
          <Info className="h-4 w-4 text-orange-600" />
          <div><p className="mb-2 text-sm font-medium text-orange-800 dark:text-orange-200">Note</p><p>{displayText(note)}</p></div>
        </div>
      </Panel>
    </aside>
  );
}

function RailStat({ label, value }) {
  return <div className="flex justify-between gap-3"><span>{displayText(label)}</span><b className="font-semibold">{displayText(value)}</b></div>;
}

export function HeaderActions({ onCheckIn, onCheckOut, onApplyLeave, setActiveTab, isBusy, visibleAttendanceAction = "checkIn" }) {
  const button = "inline-flex items-center gap-2 rounded-md border px-4 py-2 text-xs font-medium disabled:opacity-60";
  return (
    <div className="flex flex-wrap items-center gap-3">
      {visibleAttendanceAction === "completed" ? (
        <button disabled className={`${button} border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300`}><CalendarCheck className="h-4 w-4" />Completed Today</button>
      ) : visibleAttendanceAction === "checkOut" ? (
        <button disabled={isBusy} onClick={onCheckOut} className={`${button} border-red-200 text-red-600`}><LogOut className="h-4 w-4" />Check Out</button>
      ) : (
        <button disabled={isBusy} onClick={onCheckIn} className={`${button} border-emerald-600 bg-emerald-600 text-white`}><LogIn className="h-4 w-4" />Check In</button>
      )}
      <button onClick={onApplyLeave || (() => setActiveTab("leaves"))} className={`${button} border-blue-300 text-foreground`}><CalendarCheck className="h-4 w-4" />Apply Leave</button>
    </div>
  );
}

export function statusTone(status = "") {
  const value = String(status).toLowerCase();
  if (value.includes("late")) return "orange";
  if (value.includes("absent") || value.includes("reject")) return "red";
  if (value.includes("leave")) return "blue";
  if (value.includes("pending")) return "purple";
  if (value.includes("present") || value.includes("approved")) return "green";
  return "gray";
}

export const summaryIcons = {
  status: ShieldCheck,
  checkIn: Clock3,
  hours: Clock3,
  present: CalendarCheck,
  late: UserRoundCheck,
  leave: Umbrella,
  alert: AlertTriangle,
};
