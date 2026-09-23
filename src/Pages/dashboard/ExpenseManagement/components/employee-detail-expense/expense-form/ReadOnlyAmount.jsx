/* eslint-disable react/prop-types */
import { formatCurrency } from "../expense.utils";

export default function ReadOnlyAmount({ label, value }) {
  return (
    <div>
      <p className="mb-1 text-[9px] text-muted-foreground">{label}</p>
      <div className="flex h-8 items-center rounded-md border border-border bg-muted/50 px-2.5 text-[11px] font-medium tabular-nums">
        {formatCurrency(value)}
      </div>
    </div>
  );
}

