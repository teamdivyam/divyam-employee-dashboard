/* eslint-disable react/prop-types */
import { Avatar, AvatarFallback, AvatarImage } from "@components/components/ui/avatar";
import { formatDate, getInitials, getLinkedToName } from "./expense.utils";

const FALLBACK_COLORS = [
  "bg-[hsl(var(--chart-3)/0.15)] text-[hsl(var(--chart-3))]",
  "bg-[hsl(var(--chart-4)/0.15)] text-[hsl(var(--chart-4))]",
  "bg-[hsl(var(--chart-5)/0.15)] text-[hsl(var(--chart-5))]",
];

export default function LinkedToDisplay({ value, centered = false }) {
  const name = getLinkedToName(value);
  const labelAvatar = typeof value === "string" && name === "Office"
    ? { initials: "OF", className: "bg-[hsl(var(--chart-1)/0.15)] text-[hsl(var(--chart-1))]" }
    : typeof value === "string" && name === "General Work"
      ? { initials: "GW", className: "bg-[hsl(var(--chart-2)/0.15)] text-[hsl(var(--chart-2))]" }
      : null;
  if (!value || (typeof value !== "object" && !labelAvatar)) {
    return <span className="text-[11px] font-normal">{getLinkedToName(value) || "—"}</span>;
  }

  const initials = getInitials(name);
  const colorIndex = Array.from(name.toLowerCase()).reduce(
    (hash, letter) => (hash * 31 + letter.codePointAt(0)) >>> 0, 0,
  ) % FALLBACK_COLORS.length;
  return (
    <span className={`flex min-w-0 items-center gap-2 ${centered ? "justify-center text-center" : "text-left"}`}>
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={value.profileImage || undefined} alt={name} className="object-cover" />
        <AvatarFallback className={`text-[10px] font-medium ${labelAvatar?.className || FALLBACK_COLORS[colorIndex]}`}>
          {labelAvatar?.initials || (name ? (initials.length < 2 ? name.slice(0, 2).toUpperCase() : initials.slice(0, 2)) : "—")}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="block max-w-[210px] truncate text-[11px] font-normal" title={name}>{name || "—"}</span>
        {!labelAvatar ? <span className="block text-[10px] font-normal text-muted-foreground">
          {value.eventDate ? formatDate(value.eventDate) : "No event date"}
        </span> : null}
      </span>
    </span>
  );
}
