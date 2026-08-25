/* eslint-disable react/prop-types */
export default function ExpenseSummaryPill({ icon: Icon, label, value, tone }) {
  const toneClass = {
    blue: "bg-primary/10 text-primary",
    green: "bg-[hsl(var(--chart-2)/0.12)] text-[hsl(var(--chart-2))]",
    violet: "bg-[hsl(var(--chart-4)/0.12)] text-[hsl(var(--chart-4))]",
  }[tone];

  return (
    <div className="flex min-w-[115px] items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5">
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded ${toneClass}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[9px] text-muted-foreground">{label}</p>
        <p className="max-w-[125px] truncate text-[10px] font-medium">{value}</p>
      </div>
    </div>
  );
}

