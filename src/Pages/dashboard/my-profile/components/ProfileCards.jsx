import React from "react";
import { Badge } from "@components/components/ui/badge";
import { Button } from "@components/components/ui/button";
import {
  BriefcaseBusiness,
  CalendarDays,
  CircleUserRound,
  FileText,
  IdCard,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  Zap,
} from "lucide-react";

const formatDate = (value, fallback = "Not available") => {
  if (!value) return fallback;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const valueOrDash = (value) => value || "Not available";

const profileImage = (profile) =>
  profile?.profileImage?.medium ||
  profile?.profileImage?.small ||
  profile?.profileImage?.original ||
  "";

export function StatusBadge({ children, variant = "active" }) {
  const isActive = String(children || "").toLowerCase() === "active";
  const classes =
    variant === "outline"
      ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300"
      : isActive
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300"
      : "border-border bg-muted text-muted-foreground";

  return (
    <Badge variant="outline" className={`rounded-md px-2 py-0.5 text-[11px] ${classes}`}>
      {children}
    </Badge>
  );
}

export function SectionCard({ title, icon: Icon, action, children, className = "" }) {
  return (
    <section className={`rounded-lg border border-border bg-card text-card-foreground shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-5 w-5 text-slate-700 dark:text-slate-200" />}
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function InfoGrid({ items, columns = "md:grid-cols-2" }) {
  return (
    <div className={`grid gap-x-10 gap-y-5 ${columns}`}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
          <p className="mt-1 break-words text-sm font-semibold text-foreground">{valueOrDash(item.value)}</p>
        </div>
      ))}
    </div>
  );
}

export function ProfileHero({ profile, onAction }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-full bg-muted">
            {profileImage(profile) ? (
              <img src={profileImage(profile)} alt={profile.fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-muted-foreground">
                {profile?.fullName?.charAt(0) || "E"}
              </div>
            )}
            <span className="absolute bottom-4 right-4 h-5 w-5 rounded-full border-4 border-card bg-emerald-500" />
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-normal text-foreground">{valueOrDash(profile?.fullName)}</h1>
                <StatusBadge>{profile?.status}</StatusBadge>
                <StatusBadge variant="outline">Employee ID: {valueOrDash(profile?.employeeId)}</StatusBadge>
              </div>
              <p className="mt-2 text-base font-semibold text-foreground">{valueOrDash(profile?.designation)}</p>
            </div>

            <div className="grid gap-3 text-sm font-semibold text-foreground">
              <span className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" />+91 {valueOrDash(profile?.phoneNo)}</span>
              <span className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" />{valueOrDash(profile?.email)}</span>
              <span className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground" />{[profile?.city, profile?.state].filter(Boolean).join(", ") || "Not available"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:min-w-[520px]">
          <div className="flex justify-end gap-3">
            <Button variant="outline" className="h-11 gap-2 rounded-md" onClick={() => onAction("change_password")}>
              <LockKeyhole className="h-4 w-4" /> Change Password
            </Button>
            <Button className="h-11 gap-2 rounded-md bg-slate-950 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground" onClick={() => onAction("update_profile")}>
              <UserRound className="h-4 w-4" /> Edit Profile
            </Button>
          </div>

          <div className="grid gap-4 border-l border-border pl-8 sm:grid-cols-2">
            {[
              ["Department", profile?.department],
              ["Reporting Manager", profile?.reportingManager?.name],
              ["Joining Date", formatDate(profile?.joiningDate)],
              ["Employment Type", profile?.employmentType],
              ["Status", profile?.status],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className={`mt-1 text-sm font-bold ${label === "Status" ? "text-emerald-600 dark:text-emerald-400" : label === "Reporting Manager" ? "text-primary" : "text-foreground"}`}>{valueOrDash(value)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function OverviewTab({ profile, quickActions = [], onAction }) {
  const address = [profile?.address, profile?.city, profile?.state, profile?.pincode].filter(Boolean).join(", ");
  const moduleAccess = profile?.moduleAccess?.length ? profile.moduleAccess : [];

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[0.65fr_1fr]">
        <SectionCard title="Personal Information" icon={CircleUserRound} action={<button className="text-xs font-bold text-theme-color" onClick={() => onAction("update_profile")}>View All</button>}>
          <InfoGrid
            items={[
              { label: "Full Name", value: profile?.fullName },
              { label: "Email Address", value: profile?.email },
              { label: "Date of Birth", value: formatDate(profile?.dateOfBirth) },
              { label: "Mobile Number", value: profile?.phoneNo ? `+91 ${profile.phoneNo}` : "" },
              { label: "Gender", value: profile?.gender },
              { label: "Address", value: address },
            ]}
          />
        </SectionCard>

        <SectionCard title="Role & Access" icon={ShieldCheck} action={<button className="text-xs font-bold text-theme-color" onClick={() => onAction("manage_access")}>View All</button>}>
          <div className="grid gap-6 lg:grid-cols-[0.45fr_1fr]">
            <InfoGrid
              columns="grid-cols-1"
              items={[
                { label: "Role / Designation", value: profile?.role?.name || profile?.designation },
                { label: "Department", value: profile?.department },
                { label: "Access Level", value: profile?.employmentType === "Full Time" ? "Employee" : profile?.employmentType },
              ]}
            />
            <div className="border-l border-border pl-6">
              <p className="mb-3 text-xs font-bold text-foreground">Module Access</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {moduleAccess.map((module) => (
                  <div key={module.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-foreground">{module.label}</span>
                    <StatusBadge>{module.allowed ? "Allowed" : "Denied"}</StatusBadge>
                  </div>
                ))}
              </div>
              <button className="mt-5 flex w-full justify-end text-xs font-bold text-theme-color" onClick={() => onAction("manage_access")}>Manage Access</button>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_0.55fr_0.78fr]">
        <SectionCard title="Employment Information" icon={BriefcaseBusiness}>
          <InfoGrid
            items={[
              { label: "Employee ID", value: profile?.employeeId },
              { label: "Employment Type", value: profile?.employmentType },
              { label: "Joining Date", value: formatDate(profile?.joiningDate) },
              { label: "Working Hours", value: profile?.workHours?.label },
              { label: "Probation End Date", value: formatDate(profile?.probationEndDate) },
              { label: "Work Location", value: profile?.workLocation },
            ]}
          />
        </SectionCard>

        <SectionCard title="Login & Security" icon={KeyRound}>
          <InfoGrid
            columns="grid-cols-1"
            items={[
              { label: "Login Email", value: profile?.email },
              { label: "Login Status", value: profile?.loginAccess },
              { label: "Last Login", value: profile?.lastLoginAt ? `${formatDate(profile.lastLoginAt)}, ${new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(new Date(profile.lastLoginAt))}` : "" },
              { label: "Password", value: "••••••••" },
            ]}
          />
          <Button variant="outline" className="mt-5 h-10 w-full gap-2 rounded-md" onClick={() => onAction("change_password")}>
            <LockKeyhole className="h-4 w-4" /> Change Password
          </Button>
        </SectionCard>

        <SectionCard title="Quick Actions" icon={Zap}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {quickActions.map((action) => (
              <button
                key={action.key}
                type="button"
                disabled={action.enabled === false}
                onClick={() => onAction(action.key)}
                className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-background p-3 text-center text-xs font-bold text-foreground transition hover:border-orange-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-orange-400/30 dark:hover:bg-orange-400/10"
              >
                <QuickActionIcon actionKey={action.key} />
                <span>{action.label}</span>
                {action.badgeCount ? <StatusBadge variant="outline">{action.badgeCount}</StatusBadge> : null}
              </button>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export function QuickActionIcon({ actionKey }) {
  const className = "h-5 w-5";
  const wrap = "flex h-9 w-9 items-center justify-center rounded-full";
  const map = {
    update_profile: [UserRound, "bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300"],
    change_password: [LockKeyhole, "bg-orange-50 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300"],
    download_id_card: [IdCard, "bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300"],
    view_payslip: [FileText, "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300"],
    request_leave: [CalendarDays, "bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300"],
    raise_request: [Mail, "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-400/10 dark:text-fuchsia-300"],
  };
  const [Icon, color] = map[actionKey] || [Zap, "bg-muted text-muted-foreground"];
  return <span className={`${wrap} ${color}`}><Icon className={className} /></span>;
}

export function DetailTabs({ profile, activeTab }) {
  const address = [profile?.address, profile?.city, profile?.state, profile?.pincode].filter(Boolean).join(", ");
  const content = {
    personal: (
      <SectionCard title="Personal Information" icon={CircleUserRound}>
        <InfoGrid items={[
          { label: "Full Name", value: profile?.fullName },
          { label: "Email Address", value: profile?.email },
          { label: "Phone Number", value: profile?.phoneNo },
          { label: "Emergency Contact", value: profile?.emergencyContactNo },
          { label: "Date of Birth", value: formatDate(profile?.dateOfBirth) },
          { label: "Gender", value: profile?.gender },
          { label: "Address", value: address },
        ]} />
      </SectionCard>
    ),
    work: (
      <SectionCard title="Work Information" icon={BriefcaseBusiness}>
        <InfoGrid items={[
          { label: "Employee ID", value: profile?.employeeId },
          { label: "Department", value: profile?.department },
          { label: "Designation", value: profile?.designation },
          { label: "Reporting Manager", value: profile?.reportingManager?.name },
          { label: "Employment Type", value: profile?.employmentType },
          { label: "Work Location", value: profile?.workLocation },
          { label: "Working Hours", value: profile?.workHours?.label },
          { label: "Joining Date", value: formatDate(profile?.joiningDate) },
        ]} />
      </SectionCard>
    ),
    emergency: (
      <SectionCard title="Emergency Contact" icon={Phone}>
        <InfoGrid items={[
          { label: "Emergency Contact Number", value: profile?.emergencyContactNo },
          { label: "Primary Phone", value: profile?.phoneNo },
          { label: "Reporting Manager", value: profile?.reportingManager?.name },
          { label: "Manager Phone", value: profile?.reportingManager?.phoneNo },
          { label: "Manager Email", value: profile?.reportingManager?.email },
        ]} />
      </SectionCard>
    ),
    documents: (
      <SectionCard title="Documents" icon={FileText}>
        {profile?.documents?.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {profile.documents.map((doc, index) => (
              <div key={doc._id || index} className="rounded-lg border border-border bg-background p-4">
                <p className="font-semibold text-foreground">{doc.name || doc.label || `Document ${index + 1}`}</p>
                <p className="mt-1 text-xs text-muted-foreground">{doc.status || "Uploaded"}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground">
            No documents uploaded yet.
          </div>
        )}
      </SectionCard>
    ),
  };

  return content[activeTab] || null;
}
