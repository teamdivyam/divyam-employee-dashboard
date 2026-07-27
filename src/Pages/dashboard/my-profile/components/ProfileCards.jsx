/* eslint-disable react/prop-types, react-refresh/only-export-components */
import {
  BadgeCheck,
  BadgeInfo,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleUserRound,
  Clock3,
  CreditCard,
  Eye,
  FileCheck2,
  FileClock,
  FileText,
  IdCard,
  Landmark,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  UploadCloud,
  UserRoundCheck,
  UserRound,
  WalletCards,
  Zap,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/components/ui/table";

export const profileTabs = [
  { value: "overview", label: "Overview", icon: CircleUserRound },
  { value: "personal", label: "Personal Information", icon: UserRound },
  { value: "work", label: "Work Information", icon: BriefcaseBusiness },
  // { value: "emergency", label: "Emergency Contact", icon: Phone },
  { value: "documents", label: "Documents", icon: FileText },
];

export function displayText(value, fallback = "--") {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) return value.map((item) => displayText(item, "")).filter(Boolean).join(" ") || fallback;
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
    banking: profile.bankingInformation || {},
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
          <span className="text-foreground font-semibold">{label}</span>
          <span className={`min-w-0 break-words text-foreground ${valueClassName} ${rowValueClassName}`}>{render ? render(value) : displayText(value)}</span>
        </div>
      ))}
    </div>
  );
}

function ProfileDetailRows({ rows }) {
  return (
    <dl className="divide-y divide-border">
      {rows.map(({ label, value }) => (
        <div
          key={label}
          className="grid min-w-0 grid-cols-[minmax(118px,0.72fr)_minmax(0,1fr)] gap-4 py-3 first:pt-0 last:pb-0"
        >
          <dt className="text-xs font-medium leading-5 text-foreground">{label}</dt>
          <dd className="min-w-0 break-words text-xs leading-5 text-foreground">
            {displayText(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ProfileDetailCard({ title, description, icon: Icon, tone, rows }) {
  return (
    <section className="profile-detail-card">
      <header className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span className={`profile-detail-icon profile-detail-icon-${tone}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-5 text-foreground">{title}</h2>
          <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="px-5 py-4">
        <ProfileDetailRows rows={rows} />
      </div>
    </section>
  );
}

function maskAccountNumber(value) {
  const raw = displayText(value, "");
  if (!raw) return "--";
  if (/[*xX]/.test(raw)) return raw;

  const compact = String(raw).replace(/\s+/g, "");
  if (compact.length <= 4) return compact;
  return `${"X".repeat(Math.max(compact.length - 4, 8))}${compact.slice(-4)}`;
}

function BankingDetailItem({ icon: Icon, label, value, revealable = false }) {
  return (
    <div className="grid grid-cols-[18px_minmax(112px,0.65fr)_minmax(0,1fr)_18px] items-center gap-2 border-b border-border py-3 last:border-b-0">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <span className="text-xs font-medium text-foreground">{label}</span>
      <span className="min-w-0 break-words text-xs text-foreground">{displayText(value)}</span>
      {revealable ? <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> : <span />}
    </div>
  );
}

function BankingDetailsCard({
  banking,
  isLoading,
  error,
  canEdit,
  onEdit,
  onRetry,
}) {
  const details = banking || {};
  const normalizedStatus = String(displayText(details.verificationStatus, "")).toLowerCase();
  const isApproved = Boolean(details.isVerified)
    || ["approved", "verified", "finance approved", "approved by finance"].includes(normalizedStatus);
  const isRejected = normalizedStatus === "rejected";
  const isPending = ["pending", "pending verification"].includes(normalizedStatus);
  const statusLabel = isApproved
    ? "Approved by Finance"
    : displayText(details.verificationStatus, "Not available");
  const StatusIcon = isApproved ? CheckCircle2 : Clock3;

  return (
    <section className="profile-detail-card overflow-hidden">
      <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="profile-detail-icon profile-detail-icon-bank">
            <Landmark className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold leading-5 text-foreground">Banking Details</h2>
            <div className="profile-bank-notice mt-1.5">
              <BadgeInfo className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Bank details are added and verified by the Finance team. Only finance-approved details are shown here.</span>
            </div>
          </div>
        </div>
        {canEdit && !isLoading && !error && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-xs font-medium text-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            {banking ? "Edit Banking Details" : "Add Banking Details"}
          </button>
        )}
      </header>

      {isLoading ? (
        <div className="grid min-h-40 place-items-center px-5 py-8 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4 animate-pulse" aria-hidden="true" />
            Loading banking details
          </span>
        </div>
      ) : error ? (
        <div className="grid min-h-40 place-items-center px-5 py-8 text-center">
          <div>
            <p className="text-xs text-destructive">Unable to load banking details.</p>
            <button type="button" onClick={onRetry} className="mt-2 text-xs font-medium text-primary hover:underline">
              Try again
            </button>
          </div>
        </div>
      ) : (
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px]">
        <div className="px-5 py-3 lg:border-r lg:border-border">
          <BankingDetailItem icon={UserRound} label="Account Holder Name" value={details.accountHolderName} />
          <BankingDetailItem icon={Building2} label="Bank Name" value={details.bankName} />
          <BankingDetailItem icon={CreditCard} label="Account Number" value={maskAccountNumber(details.accountNumber)} revealable />
        </div>
        <div className="border-t border-border px-5 py-3 lg:border-r lg:border-t-0">
          <BankingDetailItem icon={UserRoundCheck} label="IFSC Code" value={details.ifscCode} />
          <BankingDetailItem icon={MapPin} label="Branch" value={details.branch} />
          <BankingDetailItem icon={WalletCards} label="UPI ID" value={details.upiId} />
        </div>
        <div className="flex items-center justify-center border-t border-border px-5 py-6 lg:border-t-0">
          <div className="text-center">
            <p className="text-xs font-medium text-muted-foreground">Verification Status</p>
            <div className={`profile-bank-status mt-2 ${isApproved ? "profile-bank-status-approved" : ""} ${isRejected ? "profile-bank-status-rejected" : ""} ${isPending ? "profile-bank-status-pending" : ""}`}>
              <div className="flex items-center justify-center gap-2 text-xs font-semibold">
                <StatusIcon className="h-4 w-4" aria-hidden="true" />
                <span>{statusLabel}</span>
              </div>
              {details.verifiedAt && (
                <p className="mt-1.5 text-[11px] font-normal">
                  Verified on {formatDate(details.verifiedAt)}
                </p>
              )}
              {!canEdit && !isApproved && normalizedStatus === "inactive" && (
                <p className="mt-1.5 text-[11px] font-normal">Editing is disabled</p>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </section>
  );
}

function documentStatus(document = {}) {
  const rawStatus = displayText(
    document.approvalStatus
    || document.verificationStatus
    || document.status,
    "Pending Approval",
  );
  const normalized = String(rawStatus).trim().toLowerCase();

  if (normalized.includes("reject") || normalized.includes("declin")) {
    return { label: "Rejected", tone: "rejected" };
  }
  if (normalized.includes("approv") || normalized.startsWith("verified")) {
    return { label: "Approved", tone: "approved" };
  }
  return { label: normalized.includes("pending") ? "Pending" : rawStatus, tone: "pending" };
}

function documentIcon(document = {}) {
  const type = String(document.documentType || document.documentName || "").toLowerCase();
  if (type.includes("bank")) return Landmark;
  if (["identity", "aadhaar", "aadhar", "pan", "passport"].some((item) => type.includes(item))) return IdCard;
  if (["photo", "image"].some((item) => type.includes(item))) return UserRound;
  return FileText;
}

function documentReviewText(document, status) {
  const review =
    document.adminReview?.remarks
    || document.reviewRemarks
    || document.verificationRemarks
    || document.rejectionReason;
  if (review) return review;

  const reviewer = displayText(
    document.adminReview?.reviewedBy
    || document.reviewedBy
    || document.verifiedBy,
    "Admin",
  );
  if (status.tone === "approved") return `Approved by ${reviewer}`;
  if (status.tone === "rejected") return "Rejected – Re-upload required";
  return "Awaiting Review";
}

function DocumentSummaryCard({ icon: Icon, label, value, description, tone }) {
  return (
    <div className={`profile-document-summary profile-document-summary-${tone}`}>
      <span className={`profile-document-summary-icon profile-document-summary-icon-${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-lg font-semibold leading-5 text-foreground">{value}</p>
        <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function DocumentStatusPill({ status }) {
  return (
    <span className={`profile-document-status profile-document-status-${status.tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.label}
    </span>
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
                <h1 className="text-xl font-semibold leading-tight text-foreground">{name}</h1>
                <StatusPill>{overview.status || "Active"}</StatusPill>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs ">
                <p className="font-semibold text-foreground">{displayText(overview.designation)}</p>
                <StatusPill tone="orange">ID: {displayText(overview.employeeId || profile.employeeId)}</StatusPill>
              </div>
              <div className="mt-5 grid gap-3 text-xs font-semibold text-foreground">
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
          <button onClick={() => onAction("password")} className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-5 text-xs font-semibold text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground">
            <LockKeyhole className="h-4 w-4" /> Change Password
          </button>
          <button onClick={() => onAction("edit")} className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
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
      <EmploymentInformationCard profile={profile} className="xl:col-span-4" />
      <LoginSecurityCard profile={profile} onAction={() => onAction("password")} className="xl:col-span-4" />
      <RoleAccessCard profile={profile} onAction={() => onAction("tab:work")} className="xl:col-span-8" />
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
        { label: "Last Login", value: formatDateTime(security.lastLoginAt) },
        { label: "Login Status", value: security.loginStatus, render: (value) => <StatusPill>{value}</StatusPill> },
        { label: "Password Status", value: security.passwordStatus, render: (value) => <StatusPill>{value}</StatusPill> },
      ]} />
      <button onClick={onAction} className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-background text-xs font-semibold text-foreground hover:bg-accent hover:text-accent-foreground">
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
            className={`min-h-20 rounded-lg border border-border bg-background px-1.5 py-3 text-center shadow-sm transition hover:bg-accent ${availableKeys.size && !availableKeys.has(key) ? "opacity-75" : ""}`}
          >
            <Icon className={`mx-auto h-6 w-6 ${tone}`} />
            <span className="mt-2 block text-xs font-semibold text-foreground">{label}</span>
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
              <p className="text-2xl font-semibold text-foreground">{displayText(value, 0)}</p>
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

export function PersonalInformationTab({
  profile,
  banking,
  isBankingLoading,
  bankingError,
  canEditBanking,
  onEditBanking,
  onRetryBanking,
}) {
  const { personal, emergency } = getSections(profile);
  return (
    <div className="space-y-4">
      <div className="grid items-stretch gap-4 xl:grid-cols-3">
        <ProfileDetailCard
          title="Personal Information"
          description="Basic personal and contact information"
          icon={UserRound}
          tone="personal"
          rows={[
            { label: "Full Name", value: personal.fullName },
            { label: "Email Address", value: personal.emailAddress },
            { label: "Mobile Number", value: personal.mobileNumber || personal.phoneNo },
            { label: "Address", value: personal.address },
            { label: "City", value: personal.city },
            { label: "State", value: personal.state },
            { label: "PIN Code", value: personal.pinCode || personal.pincode },
          ]}
        />
        <ProfileDetailCard
          title="Additional Details"
          description="More information about the employee"
          icon={IdCard}
          tone="additional"
          rows={[
            { label: "Date of Birth", value: formatDate(personal.dateOfBirth) },
            { label: "Gender", value: personal.gender },
            { label: "Phone No", value: personal.phoneNo || personal.mobileNumber },
            { label: "Alternate Phone", value: personal.alternatePhone },
            { label: "Marital Status", value: personal.maritalStatus },
            { label: "Aadhaar / ID", value: personal.aadhaarId },
          ]}
        />
        <ProfileDetailCard
          title="Emergency Contact Details"
          description="Emergency contact information"
          icon={Phone}
          tone="emergency"
          rows={[
            { label: "Emergency Contact Name", value: emergency.name },
            { label: "Relationship", value: emergency.relationship },
            { label: "Emergency Mobile Number", value: emergency.mobileNumber },
            { label: "Alternate Emergency Number", value: emergency.alternateMobileNumber },
            { label: "Contact Address", value: emergency.address },
          ]}
        />
      </div>
      <BankingDetailsCard
        banking={banking}
        isLoading={isBankingLoading}
        error={bankingError}
        canEdit={canEditBanking}
        onEdit={onEditBanking}
        onRetry={onRetryBanking}
      />
    </div>
  );
}

// export function EmergencyContactTab({ profile }) {
//   const { emergency } = getSections(profile);
//   return (
//     <SectionCard title="Emergency Contact" icon={UsersRound}>
//       <DetailRows rows={[
//         { label: "Contact Name", value: emergency.name },
//         { label: "Relationship", value: emergency.relationship },
//         { label: "Mobile Number", value: emergency.mobileNumber },
//       ]} />
//     </SectionCard>
//   );
// }

export function DocumentsTab({
  documents,
  isLoading,
  error,
  onRetry,
  onUpload,
  onReupload,
  onDelete,
  deletingDocumentId,
}) {
  const statuses = documents.map((document) => documentStatus(document));
  const pendingCount = statuses.filter((status) => status.tone === "pending").length;
  const approvedCount = statuses.filter((status) => status.tone === "approved").length;

  return (
    <section className="profile-documents-card">
      <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold leading-5 text-foreground">Documents</h2>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
              Upload your documents for admin approval. Approved documents are view-only.
            </p>
          </div>
        </div>
        <button type="button" onClick={onUpload} className="profile-document-upload-button">
          <UploadCloud className="h-4 w-4" aria-hidden="true" />
          Upload Document
        </button>
      </header>

      <div className="space-y-3 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <DocumentSummaryCard
            icon={FileText}
            label="Total Documents"
            value={isLoading ? "--" : documents.length}
            description="All uploaded documents"
            tone="total"
          />
          <DocumentSummaryCard
            icon={FileClock}
            label="Pending Approval"
            value={isLoading ? "--" : pendingCount}
            description="Awaiting admin review"
            tone="pending"
          />
          <DocumentSummaryCard
            icon={FileCheck2}
            label="Approved"
            value={isLoading ? "--" : approvedCount}
            description="Available for viewing"
            tone="approved"
          />
        </div>

        <div className="profile-document-notice">
          <BadgeInfo className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Once a document is approved by admin, it becomes view-only.</span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="whitespace-nowrap px-4 text-[11px] font-medium">Document Name</TableHead>
                <TableHead className="whitespace-nowrap px-4 text-[11px] font-medium">Document Type</TableHead>
                <TableHead className="whitespace-nowrap px-4 text-[11px] font-medium">Uploaded On</TableHead>
                <TableHead className="whitespace-nowrap px-4 text-[11px] font-medium">Status</TableHead>
                <TableHead className="whitespace-nowrap px-4 text-[11px] font-medium">Admin Review</TableHead>
                <TableHead className="whitespace-nowrap px-4 text-right text-[11px] font-medium">File</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                    Loading documents...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <p className="text-xs text-destructive">
                      {String(error.response?.data?.message || error.response?.data?.msg || error.message || "Unable to load documents.").split("|")[0]}
                    </p>
                    <button type="button" onClick={onRetry} className="mt-3 text-xs font-medium text-primary hover:underline">
                      Try again
                    </button>
                  </TableCell>
                </TableRow>
              ) : documents.length ? (
                documents.map((document, index) => {
                  const status = statuses[index];
                  const DocumentIcon = documentIcon(document);
                  const fileUrl =
                    document.file?.fileUrl
                    || document.file?.url
                    || document.fileUrl
                    || document.url;

                  return (
                    <TableRow key={document._id || `${document.documentName}-${index}`} className="hover:bg-muted/30">
                      <TableCell className="px-4">
                        <div className="flex items-center gap-3">
                          <span className="profile-document-row-icon">
                            <DocumentIcon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="text-xs font-medium text-foreground">
                            {displayText(document.documentName)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 text-xs text-foreground">
                        {displayText(document.documentType)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 text-xs text-foreground">
                        {formatDateTime(document.uploadedAt || document.createdAt)}
                      </TableCell>
                      <TableCell className="px-4">
                        <DocumentStatusPill status={status} />
                      </TableCell>
                      <TableCell className={`px-4 text-xs profile-document-review-${status.tone}`}>
                        {documentReviewText(document, status)}
                      </TableCell>
                      <TableCell className="px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {status.tone === "rejected" ? (
                            <button
                              type="button"
                              onClick={() => onReupload(document)}
                              className="profile-document-reupload-button"
                            >
                              <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />
                              Re-upload
                            </button>
                          ) : fileUrl ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="profile-document-view-button"
                            >
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                              View
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">--</span>
                          )}
                          {status.tone !== "approved" && (
                            <button
                              type="button"
                              onClick={() => onDelete(document)}
                              disabled={deletingDocumentId === document._id}
                              className="profile-document-delete-button"
                              aria-label={`Delete ${displayText(document.documentName, "document")}`}
                            >
                              {deletingDocumentId === document._id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                : <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                    No documents have been added for you.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}

export function CompletionStrip({ profile }) {
  const { completion } = getSections(profile);
  const percentage = Number(completion.percentage || 0);
  return (
    <div className="rounded-lg border border-border bg-card px-5 py-4 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Profile Completion</p>
          <p className="text-xs text-muted-foreground">Last updated {formatDate(completion.updatedAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(percentage, 100))}%` }} />
          </div>
          <span className="text-sm font-semibold text-foreground">{percentage}%</span>
        </div>
      </div>
    </div>
  );
}
