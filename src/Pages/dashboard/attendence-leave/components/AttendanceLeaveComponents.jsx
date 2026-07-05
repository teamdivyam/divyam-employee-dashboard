/* eslint-disable react/prop-types, react-refresh/only-export-components */
import React from "react";
import {
  AlertTriangle,
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
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
  MapPin,
  MoreHorizontal,
  Send,
  ShieldCheck,
  Umbrella,
  UserRoundCheck,
  Zap,
} from "lucide-react";

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
  const rows = [
    ["Date", formatDisplayDate(attendance.date || attendance.attendanceDate)],
    ["Shift Time", text(attendance.shiftTime, `${text(attendance.shiftStartTime, "11:00 AM")} - ${text(attendance.shiftEndTime, "07:30 PM")}`)],
    ["Check-In Time", <><span className="text-emerald-600">{attendance.checkInTime ? formatTime(attendance.checkInTime) : "11:05 AM"}</span> <StatusPill>On Time</StatusPill></>],
    ["Check-Out Time", <><span>{formatTime(attendance.checkOutTime)}</span> {!attendance.checkOutTime && <StatusPill tone="orange">Not Checked Out</StatusPill>}</>],
    ["Status", <StatusPill key="attendance-status">{text(attendance.status, "Present")}</StatusPill>],
    ["Location", <><MapPin className="inline h-3.5 w-3.5" /> {text(attendance.location, "DIVYAM Office, Prayagraj")} <StatusPill>Verified</StatusPill></>],
    ["Check-In Proof", text(attendance.checkInProof || attendance.proofLabel, "11:05 AM View Photo")],
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
          <InfoRow label="Duty Type" value={<StatusPill tone="blue">{text(duty.dutyType, "Office Duty")}</StatusPill>} />
          <InfoRow label="Department" value={text(duty.department, "Event Management")} />
          <InfoRow label="Reporting Manager" value={<>{text(duty.reportingManager, "Pappu Verma")}<br /><span className="text-muted-foreground">{text(duty.managerRole, "Sr. Operation Manager")}</span></>} />
          <InfoRow label="Remarks" value={text(duty.remarks, "Regular office day.")} />
          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-blue-300 px-3 py-2 text-xs font-medium text-foreground hover:bg-blue-100 dark:hover:bg-blue-400/10">
            View Today&apos;s Tasks <Send className="h-3.5 w-3.5" />
          </button>
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

export function AttendanceTable({ rows, monthLabel }) {
  const safeRows = rows?.length ? rows : [];
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
        Monthly Attendance - {monthLabel}
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-xs">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>{["Date", "Day", "Check In", "Check Out", "Working Hours", "Status", "Duty Type", "Remark", "Action"].map((h) => <th key={h} className="px-4 py-2 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {safeRows.map((row, index) => (
              <tr key={row._id || row.id || index} className="border-t border-border">
                <td className="px-4 py-2">{formatShortDate(row.date || row.attendanceDate)}</td>
                <td className="px-4 py-2">{text(row.day, new Date(row.date || row.attendanceDate).toLocaleDateString("en-IN", { weekday: "short" }))}</td>
                <td className="px-4 py-2">{formatTime(row.checkInTime)}</td>
                <td className="px-4 py-2">{formatTime(row.checkOutTime)}</td>
                <td className="px-4 py-2">{text(row.workingHours || row.totalWorkingHours)}</td>
                <td className="px-4 py-2"><StatusPill tone={statusTone(text(row.status))}>{text(row.status)}</StatusPill></td>
                <td className="px-4 py-2">{text(row.dutyType)}</td>
                <td className="px-4 py-2">{text(row.remark || row.remarks)}</td>
                <td className="px-4 py-2">{index === 0 ? <MoreHorizontal className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</td>
              </tr>
            ))}
            {!safeRows.length && <tr><td colSpan="9" className="px-4 py-8 text-center text-muted-foreground">No attendance records found.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center p-4">
        <button className="rounded-md border border-border px-4 py-2 text-xs font-medium">View Full Monthly Report</button>
      </div>
    </Panel>
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

export function RightRail({ health, quickActions, alerts, note, setActiveTab }) {
  const actions = quickActions?.length ? quickActions : [
    { title: "Apply Leave", description: "Request new leave", tab: "leaves", icon: Umbrella },
    { title: "Request Correction", description: "Fix attendance issue", tab: "corrections", icon: FilePenLine },
    { title: "View Monthly Report", description: "Download attendance", tab: "monthly", icon: FileText },
    { title: "Contact Manager", description: "Talk to your manager", tab: "duty", icon: UserRoundCheck },
  ];
  return (
    <aside className="space-y-4">
      <Panel>
        <SectionTitle icon={HeartPulse}>Attendance Health</SectionTitle>
        <div className="grid grid-cols-[110px_1fr] items-center gap-4 p-4 text-xs">
          <div className="relative grid h-24 w-24 place-items-center rounded-full border-[10px] border-emerald-200 border-l-emerald-600">
            <span className="text-sm font-semibold">Good</span>
          </div>
          <div className="space-y-3">
            <RailStat label="Present Days" value={text(health.presentDays, 22)} />
            <RailStat label="Late Count" value={text(health.lateCount, 3)} />
            <RailStat label="Absent Days" value={text(health.absentDays, 1)} />
            <RailStat label="Paid Leaves Used" value={text(health.paidLeavesUsed, 2)} />
            <RailStat label="Corrections Pending" value={text(health.correctionsPending, 1)} />
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
        </div>
      </Panel>
      <Panel>
        <SectionTitle icon={Bell}>Alerts & Notifications</SectionTitle>
        <div className="space-y-3 p-3">
          {(alerts?.length ? alerts : [{ title: "1 correction request is pending.", description: "Please update before monthly lock." }, { title: "Monthly attendance will be locked on 07 Jul 2026.", description: "Learn More" }]).map((alert, index) => (
            <div key={index} className={`rounded-md border p-3 text-xs ${index ? "border-blue-200 bg-blue-50 text-blue-900 dark:bg-blue-400/10 dark:text-blue-200" : "border-orange-200 bg-orange-50 text-orange-900 dark:bg-orange-400/10 dark:text-orange-200"}`}>
              <p className="font-medium">{displayText(alert.title)}</p>
              <p>{displayText(alert.description || alert.message)}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel className="border-orange-200 bg-orange-50/70 dark:bg-orange-400/10">
        <div className="flex gap-3 p-4 text-xs">
          <Info className="h-4 w-4 text-orange-600" />
          <div><p className="mb-2 text-sm font-medium text-orange-800 dark:text-orange-200">Note</p><p>{displayText(note, "Attendance records may be used for payroll calculation after verification by Finance.")}</p></div>
        </div>
      </Panel>
    </aside>
  );
}

function RailStat({ label, value }) {
  return <div className="flex justify-between gap-3"><span>{displayText(label)}</span><b className="font-semibold">{displayText(value)}</b></div>;
}

export function HeaderActions({ onCheckIn, onCheckOut, setActiveTab, isBusy }) {
  const button = "inline-flex items-center gap-2 rounded-md border px-4 py-2 text-xs font-medium disabled:opacity-60";
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button disabled={isBusy} onClick={onCheckIn} className={`${button} border-emerald-600 bg-emerald-600 text-white`}><LogIn className="h-4 w-4" />Check In</button>
      <button disabled={isBusy} onClick={onCheckOut} className={`${button} border-red-200 text-red-600`}><LogOut className="h-4 w-4" />Check Out</button>
      <button onClick={() => setActiveTab("leaves")} className={`${button} border-blue-300 text-foreground`}><CalendarCheck className="h-4 w-4" />Apply Leave</button>
      <button onClick={() => setActiveTab("corrections")} className={`${button} border-blue-300 text-foreground`}><FilePenLine className="h-4 w-4" />Request Correction</button>
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
