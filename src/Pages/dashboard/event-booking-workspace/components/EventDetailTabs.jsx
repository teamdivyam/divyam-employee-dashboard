/* eslint-disable react/prop-types */
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ImageIcon,
  Settings2,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const primaryTabs = [
  { key: "overview", label: "Overview", icon: CheckCircle2 },
  { key: "plan", label: "Event Plan", icon: CalendarDays },
  { key: "operations", label: "Operations", icon: Settings2 },
  { key: "finance", label: "Finance & Files", icon: WalletCards },
  { key: "activity", label: "Activity", icon: ClipboardCheck },
];

const planTabs = [
  {
    key: "functions",
    label: "Functions",
    icon: CalendarDays,
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    key: "services",
    label: "Services",
    icon: ClipboardCheck,
    tone: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    key: "guests",
    label: "Guests & Hospitality",
    icon: UserRound,
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    key: "preferences",
    label: "Visual Preferences",
    icon: ImageIcon,
    tone: "border-pink-200 bg-pink-50 text-pink-700",
  },
  {
    key: "approvals",
    label: "Client Approvals",
    icon: CheckCircle2,
    tone: "border-orange-200 bg-orange-50 text-orange-700",
  },
];

export default function EventDetailTabs({
  activePrimary,
  activePlan,
  onSelect,
  showPlanTabs = false,
}) {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const selectPrimary = (key) => {
    const routeByTab = eventId
      ? {
          overview: `/dashboard/assigned-events/${eventId}`,
          plan: `/dashboard/assigned-events/${eventId}/plan/functions`,
          operations: `/dashboard/assigned-events/${eventId}/operations`,
          finance: `/dashboard/assigned-events/${eventId}/finance`,
          activity: `/dashboard/assigned-events/${eventId}/activity`,
        }
      : {};
    if (routeByTab[key]) navigate(routeByTab[key]);
    else onSelect?.(key);
  };
  return (
    <>
      <nav
        className="flex gap-3 overflow-x-auto border-b border-border"
        aria-label="Event sections"
      >
        {primaryTabs.map(({ key, label, icon: Icon }) => {
          const active = key === activePrimary;
          return (
            <button
              key={key}
              type="button"
              onClick={() => selectPrimary(key)}
              className={`flex min-w-max items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold ${active ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>

      {showPlanTabs ? (
        <nav
          className="flex gap-3 overflow-x-auto"
          aria-label="Event plan sections"
        >
          {planTabs.map(({ key, label, icon: Icon, tone }) => {
            const active = key === activePlan;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                className={`flex min-w-max items-center justify-center gap-2 rounded-md border px-5 py-2.5 text-xs font-semibold transition-colors ${active ? tone : "border-border bg-card text-foreground hover:bg-muted/60"}`}
              >
                <Icon
                  className={`h-4 w-4 ${active ? "" : tone.split(" ").at(-1)}`}
                />
                {label}
              </button>
            );
          })}
        </nav>
      ) : null}
    </>
  );
}
