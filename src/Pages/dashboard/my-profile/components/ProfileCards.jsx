/* eslint-disable react/prop-types, react-refresh/only-export-components */
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CircleUserRound,
  Clock3,
  Download,
  FileText,
  IdCard,
  LockKeyhole,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
  UsersRound,
  Zap,
} from "lucide-react";

export const profileTabs = [
  { value: "overview", label: "Overview" },
  { value: "personal", label: "Personal Information" },
  { value: "work", label: "Work Information" },
  { value: "emergency", label: "Emergency Contact" },
  { value: "documents", label: "Documents" },
];

export function displayText(value, fallback = "--") {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) return value.map((item) => displayText(item, "")).filter(Boolean).join(", ") || fallback;
  if (typeof value === "object") {
    return value.label || value.name || value.title || value.status || value.value || value.email || value.phoneNo || fallback;
  }
  return value;
}

export function formatDate(value, fallback = "--", options = {}) {
  const raw = displayText(value, "");
  if (!raw) return fallback;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  });
}

export function formatDateTime(value, fallback = "--") {
  const raw = displayText(value, "");
  if (!raw) return fallback;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getSections(profile = {}) {
  return {
    overview: profile.overview || {},
    personal: profile.personalInformation || {},
    access: profile.roleAndAccess || {},
    employment: profile.employmentInformation || {},
    emergency: profile.emergencyContactInformation || {},
    security: profile.loginSecurity || {},
    quickActions: profile.quickActions || [],
    completion: profile.profileCompletion || {},
    summary: profile.summary || {},
  };
}

function getModuleAccess(profile = {}) {
  const { access } = getSections(profile);
  const modules =
    profile.modulePermissions?.employeeModules ||
    profile.moduleAccess ||
    access.moduleAccess ||
    profile.overview?.moduleAccess ||
    [];
  if (Array.isArray(modules)) {
    return modules.map((module) => {
      if (typeof module === "string") {
        return { key: module, label: module, allowed: true };
      }
      return {
        ...module,
        allowed: module.allowed !== false,
      };
    });
  }
  if (typeof modules === "object" && modules !== null) {
    return Object.entries(modules).map(([key, value]) => ({
      key,
      label: key.replace(/_/g, " "),
      allowed: Boolean(value),
    }));
  }
  return [];
}

export function profileName(profile) {
  const { overview, personal } = getSections(profile);
  return displayText(profile.fullName || overview.fullName || personal.fullName, "Employee");
}

function initials(name) {
  return displayText(name, "E").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function statusTone(value) {
  const normalized = String(displayText(value, "")).toLowerCase();
  if (["enabled", "protected", "allowed", "active"].includes(normalized)) return "green";
  if (["pending", "inactive"].includes(normalized)) return "orange";
  return "gray";
}

export function StatusPill({ children, tone }) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300",
    orange: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300",
    gray: "border-border bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${tones[tone || statusTone(children)] || tones.gray}`}>
      {displayText(children)}
    </span>
  );
}

export function SectionCard({ title, icon: Icon, children, className = "", action }) {
  return (
    <section className={`rounded-lg border border-border bg-card text-card-foreground shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-5 w-5 text-foreground" />}
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}

export function DetailRows({ rows, valueClassName = "" }) {
  return (
    <div className="grid gap-3">
      {rows.map(({ label, value, render, valueClassName: rowValueClassName = "" }) => (
        <div key={label} className="grid min-w-0 grid-cols-[minmax(116px,0.7fr)_minmax(0,1fr)] gap-4 text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className={`min-w-0 break-words font-semibold text-foreground ${valueClassName} ${rowValueClassName}`}>{render ? render(value) : displayText(value)}</span>
        </div>
      ))}
    </div>
  );
}

function ViewAllButton({ onClick }) {
  return (
    <button onClick={onClick} className="text-xs font-semibold text-theme-color">
      View All
    </button>
  );
}

export function ProfileHero({ profile, onAction }) {
  const { overview } = getSections(profile);
  const name = profileName(profile);
  const avatar = profile.profileImage?.medium || profile.profileImage?.small || profile.profileImage?.original || "";

  return (
    <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid flex-1 gap-8 xl:grid-cols-[1.25fr_1px_0.95fr]">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-full bg-muted">
              {avatar ? (
                <img src={avatar} alt={name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-4xl font-semibold text-muted-foreground">{initials(name)}</div>
              )}
              <span className="absolute bottom-4 right-4 h-6 w-6 rounded-full border-[3px] border-card bg-chart-2" />
            </div>
            <div className="min-w-0 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold leading-tight text-foreground">{name}</h1>
                <StatusPill>{overview.status || "Active"}</StatusPill>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold text-foreground">{displayText(overview.designation)}</p>
                <StatusPill tone="orange">Employee ID: {displayText(overview.employeeId || profile.employeeId)}</StatusPill>
              </div>
              <div className="mt-5 grid gap-3 text-sm font-semibold text-foreground">
                <span className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /> +91 {displayText(overview.phoneNo)}</span>
                <span className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /> {displayText(overview.email)}</span>
                <span className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground" /> {displayText(overview.location)}</span>
              </div>
            </div>
          </div>

          <div className="hidden bg-border xl:block" />

          <div className="lg:pt-2">
            <DetailRows
              rows={[
                { label: "Panel Access", value: overview.panelAccess },
                { label: "Reporting Manager", value: overview.reportingManagerName, render: (value) => <span className="text-primary">{displayText(value)}</span> },
                { label: "Joining Date", value: formatDate(overview.joiningDate) },
                { label: "Employment Type", value: overview.employmentType },
                { label: "Status", value: overview.status, render: (value) => <span className="text-chart-2">{displayText(value)}</span> },
              ]}
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-3 lg:justify-end">
          <button onClick={() => onAction("password")} className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-5 text-xs font-bold text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground">
            <LockKeyhole className="h-4 w-4" /> Change Password
          </button>
          <button onClick={() => onAction("edit")} className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90">
            <Pencil className="h-4 w-4" /> Edit Profile
          </button>
        </div>
      </div>
    </section>
  );
}

export function OverviewTab({ profile, onAction }) {
  return (
    <div className="grid gap-4 xl:grid-cols-12">
      <PersonalInformationCard profile={profile} onAction={() => onAction("tab:personal")} className="xl:col-span-4" />
      <RoleAccessCard profile={profile} onAction={() => onAction("tab:work")} className="xl:col-span-8" />
      <EmploymentInformationCard profile={profile} className="xl:col-span-5" />
      <LoginSecurityCard profile={profile} onAction={() => onAction("password")} className="xl:col-span-3" />
      <QuickActionsCard profile={profile} onAction={onAction} className="xl:col-span-4" />
    </div>
  );
}

export function PersonalInformationCard({ profile, onAction, className = "" }) {
  const { personal } = getSections(profile);
  return (
    <SectionCard title="Personal Information" icon={UserRound} className={className} action={onAction && <ViewAllButton onClick={onAction} />}>
      <DetailRows rows={[
        { label: "Full Name", value: personal.fullName },
        { label: "Email Address", value: personal.emailAddress },
        { label: "Mobile Number", value: personal.mobileNumber || personal.phoneNo },
        { label: "Address", value: personal.address },
        { label: "City", value: personal.city },
        { label: "State", value: personal.state },
        { label: "PIN Code", value: personal.pinCode || personal.pincode },
      ]} />
    </SectionCard>
  );
}

export function RoleAccessCard({ profile, onAction, className = "" }) {
  const { access } = getSections(profile);
  const modules = getModuleAccess(profile);
  return (
    <SectionCard title="Role & Access" icon={ShieldCheck} className={className} action={onAction && <ViewAllButton onClick={onAction} />}>
      <div className="grid gap-5 lg:grid-cols-[150px_1px_minmax(0,1fr)]">
        <div className="flex flex-col gap-6 text-xs">
          <div className="grid  gap-3">
            <span className="text-muted-foreground">Role / Designation</span>
            <span className="font-medium leading-snug text-foreground">{displayText(access.roleDesignation)}</span>
          </div>
          <div className="grid gap-3">
            <span className="text-muted-foreground">Panel Access</span>
            <span className="font-medium leading-snug text-foreground">{displayText(access.panelAccess)}</span>
          </div>
        </div>
        <div className="hidden bg-border lg:block" />
        <div>
          <p className="mb-4 text-xs font-medium text-foreground">Module Access</p>
          <div className="grid gap-x-7 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
            {modules.length ? modules.map((module) => (
              <div key={module.key || module.label} className="grid min-h-6 grid-cols-[minmax(72px,1fr)_58px] items-center gap-2 text-xs">
                <span className="break-words font-medium leading-snug text-foreground">{displayText(module.label)}</span>
                <StatusPill tone={module.allowed ? "green" : "gray"}>{module.allowed ? "Allowed" : "Denied"}</StatusPill>
              </div>
            )) : <p className="text-xs text-muted-foreground">No module access found.</p>}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export function EmploymentInformationCard({ profile, className = "" }) {
  const { employment } = getSections(profile);
  const workHours = employment.workHours?.label
    ? `${employment.workHours.label} (${displayText(employment.workHours.start)} - ${displayText(employment.workHours.end)})`
    : employment.workHours;
  return (
    <SectionCard title="Employment Information" icon={BriefcaseBusiness} className={className}>
      <DetailRows rows={[
        { label: "Employee ID", value: employment.employeeId },
        { label: "Employment Type", value: employment.employmentType },
        { label: "Joining Date", value: formatDate(employment.joiningDate) },
        { label: "Probation End Date", value: formatDate(employment.probationEndDate) },
        { label: "Work Location", value: employment.workLocation },
        { label: "Work Hours", value: workHours },
      ]} />
    </SectionCard>
  );
}

export function LoginSecurityCard({ profile, onAction, className = "" }) {
  const { security } = getSections(profile);
  return (
    <SectionCard title="Login & Security" icon={LockKeyhole} className={className}>
      <DetailRows rows={[
        { label: "Login Email", value: security.loginEmail, valueClassName: "break-all" },
        { label: "Login Status", value: security.loginStatus, render: (value) => <StatusPill>{value}</StatusPill> },
        { label: "Last Login", value: formatDateTime(security.lastLoginAt) },
        { label: "Password Status", value: security.passwordStatus, render: (value) => <StatusPill>{value}</StatusPill> },
      ]} />
      <button onClick={onAction} className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-background text-xs font-bold text-foreground hover:bg-accent hover:text-accent-foreground">
        <LockKeyhole className="h-4 w-4" /> Change Password
      </button>
    </SectionCard>
  );
}

export function QuickActionsCard({ profile, onAction, className = "" }) {
  const { quickActions } = getSections(profile);
  const actions = [
    { key: "update_profile", label: "Update Profile", icon: CircleUserRound, tone: "text-indigo-600", action: "edit" },
    { key: "change_password", label: "Change Password", icon: LockKeyhole, tone: "text-chart-3", action: "password" },
    { key: "download_id_card", label: "Download ID Card", icon: IdCard, tone: "text-primary", action: "download_id_card" },
    { key: "request_leave", label: "Request Leave", icon: CalendarDays, tone: "text-chart-5", action: "request_leave" },
    { key: "raise_request", label: "Raise Request", icon: Zap, tone: "text-chart-4", action: "raise_request" },
    { key: "view_payslip", label: "View Payslip", icon: FileText, tone: "text-chart-2", action: "view_payslip" },
  ];
  const availableKeys = new Set(quickActions.map((item) => item.key));

  return (
    <SectionCard title="Quick Actions" icon={Zap} className={className}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {actions.map(({ key, label, icon: Icon, tone, action }) => (
          <button
            key={key}
            onClick={() => onAction(action)}
            className={`min-h-20 rounded-lg border border-border bg-background px-2 py-3 text-center shadow-sm transition hover:bg-accent ${availableKeys.size && !availableKeys.has(key) ? "opacity-75" : ""}`}
          >
            <Icon className={`mx-auto h-6 w-6 ${tone}`} />
            <span className="mt-2 block text-xs font-bold text-foreground">{label}</span>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

export function WorkInformationTab({ profile }) {
  const { access, employment, overview, summary } = getSections(profile);
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <EmploymentInformationCard profile={profile} />
      <RoleAccessCard profile={profile} />
      <SectionCard title="Work Summary" icon={Clock3} className="xl:col-span-2">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Assigned Tasks", summary.assignedTasks],
            ["Pending Tasks", summary.pendingTasks],
            ["Assigned Events", summary.assignedEvents],
            ["Pending Leaves", summary.pendingLeaveRequests],
            ["Expenses", summary.expenseCount],
            ["Documents", summary.documentCount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-2xl font-bold text-foreground">{displayText(value, 0)}</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Overview" icon={BadgeCheck} className="xl:col-span-2">
        <DetailRows rows={[
          { label: "Designation", value: overview.designation || access.roleDesignation },
          { label: "Panel Access", value: overview.panelAccess || access.panelAccess },
          { label: "Reporting Manager", value: overview.reportingManagerName },
          { label: "Employment Type", value: overview.employmentType || employment.employmentType },
          { label: "Status", value: overview.status },
        ]} />
      </SectionCard>
    </div>
  );
}

export function PersonalInformationTab({ profile }) {
  const { personal } = getSections(profile);
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <PersonalInformationCard profile={profile} />
      <SectionCard title="Additional Details" icon={CircleUserRound}>
        <DetailRows rows={[
          { label: "Date of Birth", value: formatDate(personal.dateOfBirth) },
          { label: "Gender", value: personal.gender },
          { label: "Phone No", value: personal.phoneNo },
          { label: "PIN Code", value: personal.pinCode || personal.pincode },
        ]} />
      </SectionCard>
    </div>
  );
}

export function EmergencyContactTab({ profile }) {
  const { emergency } = getSections(profile);
  return (
    <SectionCard title="Emergency Contact" icon={UsersRound}>
      <DetailRows rows={[
        { label: "Contact Name", value: emergency.name },
        { label: "Relationship", value: emergency.relationship },
        { label: "Mobile Number", value: emergency.mobileNumber },
      ]} />
    </SectionCard>
  );
}

export function DocumentsTab({ profile, onAction }) {
  const { summary } = getSections(profile);
  return (
    <SectionCard title="Documents" icon={FileText}>
      <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm font-semibold text-foreground">{displayText(summary.documentCount, 0)} document(s) on record</p>
        <p className="mt-1 text-xs text-muted-foreground">Document list data is not included in the current profile response.</p>
        <button onClick={() => onAction("download_id_card")} className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/90">
          <Download className="h-4 w-4" /> Download ID Card
        </button>
      </div>
    </SectionCard>
  );
}

export function CompletionStrip({ profile }) {
  const { completion } = getSections(profile);
  const percentage = Number(completion.percentage || 0);
  return (
    <div className="rounded-lg border border-border bg-card px-5 py-4 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">Profile Completion</p>
          <p className="text-xs text-muted-foreground">Last updated {formatDate(completion.updatedAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(percentage, 100))}%` }} />
          </div>
          <span className="text-sm font-bold text-foreground">{percentage}%</span>
        </div>
      </div>
    </div>
  );
}
