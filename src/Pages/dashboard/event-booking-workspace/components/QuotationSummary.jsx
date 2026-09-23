/* eslint-disable react/prop-types */
import { CheckCircle2, Clock3, FileSpreadsheet, Layers } from 'lucide-react';
import EventMetricCards from './EventMetricCards';
import { currency, numberOf } from '../eventFinance.utils';

export default function QuotationSummary({ quotations = [] }) {
  const summary = { totalQuotedValue: quotations.reduce((sum, row) => sum + numberOf(row.priceSummary?.finalQuotationValue), 0), activeQuotations: quotations.length, quotations: quotations.length, quotationVersions: quotations.reduce((sum, row) => sum + numberOf(row.version), 0) };
  return <EventMetricCards items={[
    {
      label: 'Total Quoted Value',
      value: currency(summary.totalQuotedValue),
      caption: `Across ${numberOf(summary.activeQuotations)} quotations`,
      icon: FileSpreadsheet,
      tone: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
      info: 'Total value of quotation records returned by the server.',
    },
    {
      label: 'Accepted Value',
      value: '?',
      caption: 'Acceptance status unavailable',
      icon: CheckCircle2,
      tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
      info: 'Total value of quotations accepted by the client.',
    },
    {
      label: 'Pending Client Decision',
      value: '?',
      caption: 'Decision status unavailable',
      icon: Clock3,
      tone: 'bg-orange-500/10 text-orange-600 dark:text-orange-300',
      info: 'Value of sent quotations awaiting a client decision.',
    },
    {
      label: 'Quotation Versions',
      value: numberOf(summary.quotationVersions),
      caption: `${numberOf(summary.quotations)} quotation(s)`,
      icon: Layers,
      tone: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
      info: 'Sum of the current version numbers. Previous revisions are not archived by the server.',
    },
  ]} />;
}
