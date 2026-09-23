/* eslint-disable react/prop-types */
import { CalendarDays, ClipboardList, Hourglass, ImageIcon, UsersRound } from 'lucide-react';
import EventMetricCards from './EventMetricCards';
import EventSummarySlot from './EventSummarySlot';

const metricTones = {
  violet: 'bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300',
  cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-300',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-400/10 dark:text-purple-300',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300',
  rose: 'bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300',
};

export default function EventSummaryCards({ metrics = {}, metricItems: suppliedMetricItems, showMetrics = true }) {
  const defaultMetricItems = [
    { label: 'Functions', value: metrics.functions, caption: metrics.functionsCaption || 'Confirmed', icon: CalendarDays, tone: 'violet' },
    { label: 'Services', value: metrics.services, caption: metrics.servicesCaption || 'Planned', icon: ClipboardList, tone: 'blue' },
    { label: 'Peak Guests', value: metrics.peakGuests, caption: 'Max on any day', icon: UsersRound, tone: 'cyan' },
    { label: 'Final Preferences', value: metrics.preferences, caption: 'Finalised', icon: ImageIcon, tone: 'purple' },
    { label: 'Approvals Pending', value: metrics.approvals, caption: 'Awaiting client', icon: Hourglass, tone: 'amber' },
  ];
  const metricItems = suppliedMetricItems || defaultMetricItems;
  return <EventSummarySlot>{showMetrics && <EventMetricCards items={metricItems.map((item) => ({ ...item, tone: metricTones[item.tone] || metricTones.blue }))} />}</EventSummarySlot>;
}
