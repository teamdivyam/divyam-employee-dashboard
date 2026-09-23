/* eslint-disable react/prop-types */
import EventSummarySlot from "./EventSummarySlot";
import {
  ChevronRight,
  CircleUserRound,
  Flag,
  ListChecks,
  SlidersHorizontal,
  IndianRupee,
} from "lucide-react";
import { Card, CardContent } from "@components/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@components/components/ui/avatar";
import { currencyAmount } from "../eventBookingDashboard.utils";
const metricTones = {
  violet:
    "bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300",
  orange:
    "bg-orange-100 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300",
  green:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300",
};

const metricCardTones = {
  violet: "bg-violet-50/40 dark:bg-violet-400/5",
  blue: "bg-blue-50/40 dark:bg-blue-400/5",
  orange: "bg-orange-50/40 dark:bg-orange-400/5",
  green: "bg-emerald-50/40 dark:bg-emerald-400/5",
};

export default function EventOverviewSummary({
  booking,
  summary,
  onViewTasks,
}) {
  const cards = [
    {
      label: "Event Manager",
      value: booking.assignedManager?.name || "Unassigned",
      caption:
        booking.assignedManager?.designation?.trim().toLowerCase() ===
        "event manager"
          ? null
          : booking.assignedManager?.designation,
      icon: CircleUserRound,
      tone: "violet",
    },
    {
      label: "Planning Stage",
      value: summary.stage,
      caption: `Stage ${summary.stageStep} of 5`,
      icon: SlidersHorizontal,
      tone: "blue",
    },
    {
      label: "Next Milestone",
      value: summary.nextMilestone.label,
      caption: summary.nextMilestone.date,
      icon: Flag,
      tone: "orange",
    },
    {
      label: "Payment Progress",
      value: `${summary.payment.clampedPercentage}% Paid`,
      caption: `${currencyAmount(summary.received)} / ${currencyAmount(summary.total)}`,
      icon: IndianRupee,
      tone: "green",
    },
  ];
  return (
    <EventSummarySlot>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, caption, icon: Icon, tone }) => (
          <Card key={label} className={`crm-card ${metricCardTones[tone]}`}>
            <CardContent className="flex h-24 items-center gap-3 p-4">
              {label === "Event Manager" ? (
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarImage
                    src={booking.assignedManager?.profileImage?.smallUrl}
                    alt={booking.assignedManager?.name || "Event manager"}
                    className="object-cover"
                  />
                  <AvatarFallback className={metricTones[tone]}>
                    <CircleUserRound aria-hidden="true" className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${metricTones[tone]}`}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">
                  {value}
                </p>
                {caption && (
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">
                    {caption}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className={`crm-card ${metricCardTones.violet}`}>
          <CardContent className="flex h-24 items-center gap-3 p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
              <ListChecks className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] text-muted-foreground">Open Tasks</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {summary.openTasks}
              </p>
              <button
                type="button"
                onClick={onViewTasks}
                className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-blue-600"
              >
                View Tasks
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </EventSummarySlot>
  );
}
