/* eslint-disable react/prop-types */
import EventSummarySlot from "./EventSummarySlot";
import {
  ChevronRight,
  CircleUserRound,
  Flag,
  ListChecks,
  MessageSquareText,
  ClipboardCheck,
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
    "event-overview-icon-violet",
  blue: "event-overview-icon-blue",
  orange:
    "event-overview-icon-orange",
  green:
    "event-overview-icon-emerald",
  amber:
    "event-overview-icon-amber",
  red: "event-overview-icon-red",
};

const metricCardTones = {
  violet: "event-overview-surface-violet",
  blue: "event-overview-surface-blue",
  orange: "event-overview-surface-orange",
  green: "event-overview-surface-emerald",
  amber: "event-overview-surface-amber",
  red: "event-overview-surface-red",
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
      icon: ClipboardCheck,
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
      tone: summary.payment.isComplete ? "green" : "red",
    },
  ];
  return (
    <EventSummarySlot>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map(({ label, value, caption, icon: Icon, tone }) => (
          <Card key={label} className={`crm-card event-overview-kpi h-full ${metricCardTones[tone]}`}>
            <CardContent className="event-overview-kpi-content">
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
                <p className="event-overview-kpi-label">{label}</p>
                <div className="event-overview-kpi-value-row">
                  <p className="event-overview-kpi-value" title={String(value)}>
                    {value}
                  </p>
                </div>
                <div className="mt-1 flex h-4 items-center">
                  {caption ? (
                    <p className="event-overview-kpi-caption">
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
        <Card className={`crm-card event-overview-kpi h-full ${metricCardTones.violet}`}>
          <CardContent className="event-overview-kpi-content">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full event-overview-icon-violet">
              <ListChecks className="h-5 w-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <p className="event-overview-kpi-label">Open Tasks</p>
              <div className="event-overview-kpi-value-row">
                <p className="event-overview-kpi-value">
                  {summary.openTasks}
                </p>
              </div>
              <div className="mt-1 flex h-4 items-center">
                <button
                  type="button"
                  onClick={onViewTasks}
                  className="event-overview-kpi-link"
                >
                  View Tasks
                  <ChevronRight className="h-3 w-3 shrink-0" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`crm-card event-overview-kpi h-full ${metricCardTones.amber}`}>
          <CardContent className="event-overview-kpi-content">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${metricTones.amber}`}>
              <MessageSquareText className="h-5 w-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <p className="event-overview-kpi-label">Feedback</p>
              <div className="event-overview-kpi-value-row">
                <p className="event-overview-kpi-value">
                  {feedbacks.length} Received
                </p>
              </div>
              <div className="mt-1 flex h-4 items-center">
                <button
                  type="button"
                  onClick={onViewFeedback}
                  className="event-overview-kpi-link"
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
