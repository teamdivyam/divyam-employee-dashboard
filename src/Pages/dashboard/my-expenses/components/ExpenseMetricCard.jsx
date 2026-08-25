/* eslint-disable react/prop-types */
import { Card } from "@components/components/ui/card";
import { formatCurrency } from "./expense.utils";

export default function ExpenseMetricCard({ label, icon: Icon, iconClass, suffix, metric, loading }) {
  const counts = Number(metric?.counts) || 0;

  return (
    <Card className="flex min-h-[82px] items-center gap-3 rounded-lg p-3 shadow-sm">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${iconClass}`}>
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-medium text-muted-foreground">{label}</p>
        {loading ? (
          <div className="mt-1 h-4 w-16 animate-pulse rounded bg-muted" />
        ) : (
          <p className="mt-1 text-[15px] font-semibold tabular-nums">{formatCurrency(metric?.amount)}</p>
        )}
        <p className="mt-1 truncate text-[10px] text-muted-foreground">
          {suffix === "Claims" ? `${counts} ${counts === 1 ? "Claim" : suffix}` : suffix}
        </p>
      </div>
    </Card>
  );
}

