/* eslint-disable react/prop-types */
import ExpenseMetricCard from "./ExpenseMetricCard";
import { METRIC_CONFIG } from "./expense.constants";

export default function ExpenseMetrics({ analytics, loading }) {
  return (
    <section className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-6">
      {METRIC_CONFIG.map(({ key, ...metric }) => (
        <ExpenseMetricCard key={key} {...metric} metric={analytics[key]} loading={loading} />
      ))}
    </section>
  );
}
