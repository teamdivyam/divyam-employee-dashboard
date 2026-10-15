/* eslint-disable react/prop-types */
import EventSummarySlot from "./EventSummarySlot";
import {
  ChevronRight,
  CircleUserRound,
  Flag,
  ListChecks,
  MessageSquareText,
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
  amber:
    "bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300",
};

const metricCardTones = {
  violet: "bg-violet-50/40 dark:bg-violet-400/5",
  blue: "bg-blue-50/40 dark:bg-blue-400/5",
  orange: "bg-orange-50/40 dark:bg-orange-400/5",
  green: "bg-emerald-50/40 dark:bg-emerald-400/5",
  amber: "bg-amber-50/40 dark:bg-amber-400/5",
};

export default function EventOverviewSummary({
  booking,
  summary,
  onViewTasks,
  onViewFeedback,
}) {
  const feedbacks = booking.feedbacks || [];
  const ratings = feedbacks
    .map((item) => Number(item.rating))
    .filter((rating) => rating > 0);
  const averageRating = ratings.length
    ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length
    : null;
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
      value: summary.nextMilestone?.label || "No milestone pending",
      caption: summary.nextMilestone?.date || "Planning is up to date",
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map(({ label, value, caption, icon: Icon, tone }) => (
          <Card key={label} className={`crm-card h-full ${metricCardTones[tone]}`}>
            <CardContent className="flex h-[104px] items-center gap-3 p-3.5">
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
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <p className="text-[10px] font-medium leading-none text-muted-foreground">{label}</p>
                <div className="mt-1.5 flex h-9 items-start">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground" title={String(value)}>
                    {value}
                  </p>
                </div>
                <div className="mt-1 flex h-4 items-center">
                  {caption ? (
                    <p className="truncate text-[10px] leading-none text-muted-foreground">
                      {caption}
                    </p>
                  ) : (
                    <span className="text-[10px] leading-none opacity-0 select-none">-</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className={`crm-card h-full ${metricCardTones.violet}`}>
          <CardContent className="flex h-[104px] items-center gap-3 p-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
              <ListChecks className="h-5 w-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <p className="text-[10px] font-medium leading-none text-muted-foreground">Open Tasks</p>
              <div className="mt-1.5 flex h-9 items-start">
                <p className="text-sm font-semibold leading-snug text-foreground">
                  {summary.openTasks}
                </p>
              </div>
              <div className="mt-1 flex h-4 items-center">
                <button
                  type="button"
                  onClick={onViewTasks}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold leading-none text-blue-600 hover:text-blue-700 hover:underline"
                >
                  View Tasks
                  <ChevronRight className="h-3 w-3 shrink-0" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`crm-card h-full ${metricCardTones.amber}`}>
          <CardContent className="flex h-[104px] items-center gap-3 p-3.5">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${metricTones.amber}`}>
              <MessageSquareText className="h-5 w-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <p className="text-[10px] font-medium leading-none text-muted-foreground">Feedback</p>
              <div className="mt-1.5 flex h-9 items-start">
                <p className="truncate text-sm font-semibold leading-snug text-foreground">
                  {feedbacks.length} Received
                </p>
              </div>
              <div className="mt-1 flex h-4 items-center">
                <button
                  type="button"
                  onClick={onViewFeedback}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold leading-none text-primary hover:text-primary/80 hover:underline"
                >
                  {averageRating ? `${averageRating.toFixed(1)}/5 Average` : "View Feedback"}
                  <ChevronRight className="h-3 w-3 shrink-0" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </EventSummarySlot>
  );
}
