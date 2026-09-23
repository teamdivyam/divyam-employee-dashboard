import { useMemo } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { buildOverviewDetails } from './eventOverview.utils';
import EventOverviewSummary from './components/EventOverviewSummary';
import { BookingSnapshot, FunctionsOverview, PaymentHistory, PaymentSummary, ReadinessPlanning, ServicesOverview } from './components/EventOverviewPanels';
import { planningStageStep, planningViewStage, readinessPercentage } from './eventBookingDashboard.utils';

const formatActivityDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
};

const milestoneFromBooking = (booking) => {
  const openTasks = (booking.eventTasks || [])
    .filter((task) => task && !['Completed', 'Cancelled'].includes(task.status))
    .sort((left, right) => new Date(left.dueDate || '9999-12-31') - new Date(right.dueDate || '9999-12-31'));
  if (openTasks.length) {
    return {
      label: openTasks[0].taskTitle || 'Planning task',
      date: openTasks[0].dueDate ? formatActivityDate(openTasks[0].dueDate).split(',')[0] : 'Due date pending',
    };
  }
  const nextFunction = (booking.functions || [])
    .filter((item) => item.date && new Date(item.date) >= new Date())
    .sort((left, right) => new Date(left.date) - new Date(right.date))[0];
  return nextFunction
    ? { label: nextFunction.name, date: formatActivityDate(nextFunction.date).split(',')[0] }
    : { label: 'No milestone pending', date: 'Planning is up to date' };
};

const buildOverview = (booking) => {
  const details = buildOverviewDetails(booking);
  return {
    ...details,
    stage: booking.executionReadiness?.isReady ? 'Execution Ready' : 'In Planning',
    stageStep: booking.executionReadiness?.isReady ? 5 : planningStageStep(planningViewStage(booking)),
    nextMilestone: milestoneFromBooking(booking),
    readiness: readinessPercentage(booking),
    payment: { clampedPercentage: details.percentage, pending: details.pending },
    openTasks: (booking.eventTasks || []).filter((task) => !['Completed', 'Cancelled'].includes(task.status)).length,
  };
};

export default function EventOverviewModernPage() {
  const { booking, openBookingSnapshotEdit } = useOutletContext();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const summary = useMemo(() => buildOverview(booking), [booking]);
  const basePath = `/dashboard/assigned-events/${eventId}`;
  const openPlanning = () => navigate(`${basePath}/plan/functions`);

  return (
    <div className="min-w-0 space-y-4">
      <EventOverviewSummary booking={booking} summary={summary} onViewTasks={() => navigate(`${basePath}/operations`)} />
      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          <BookingSnapshot booking={booking} details={summary} onEdit={openBookingSnapshotEdit} />
          <FunctionsOverview details={summary} onView={openPlanning} />
          <ServicesOverview details={summary} onView={() => navigate(`${basePath}/plan/services`)} />
        </div>
        <div className="min-w-0 space-y-3">
          <ReadinessPlanning booking={booking} summary={summary} details={summary} onView={openPlanning} />
          <PaymentSummary details={summary} />
          <PaymentHistory details={summary} onView={() => navigate(`${basePath}/finance?tab=payments`)} />
        </div>
      </div>
    </div>
  );
}
