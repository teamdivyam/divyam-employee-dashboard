/* eslint-disable react/prop-types */
export default function FormSectionHeader({ number, title, tone, icon: Icon }) {
  const toneConfig = {
    blue: {
      header: "bg-primary/5 text-primary",
      icon: "bg-primary/10 text-primary",
    },
    green: {
      header: "bg-[hsl(var(--chart-2)/0.06)] text-[hsl(var(--chart-2))]",
      icon: "bg-[hsl(var(--chart-2)/0.14)] text-[hsl(var(--chart-2))]",
    },
    violet: {
      header: "bg-[hsl(var(--chart-4)/0.06)] text-[hsl(var(--chart-4))]",
      icon: "bg-[hsl(var(--chart-4)/0.14)] text-[hsl(var(--chart-4))]",
    },
  }[tone];

  return (
    <div className={`flex items-center gap-2 rounded-t-md border border-border px-2.5 py-1.5 text-[11px] font-medium ${toneConfig.header}`}>
      <span className={`grid h-6 w-6 place-items-center rounded-md ${toneConfig.icon}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span>{number}. {title}</span>
    </div>
  );
}

