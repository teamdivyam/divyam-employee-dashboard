/* eslint-disable react/prop-types */
import { AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/components/ui/dropdown-menu';

import {
  currencyAmount,
  getKeyPendingItems,
  getOnboardingProgress,
  getPaymentMetrics,
  readinessPercentage,
} from '../eventBookingDashboard.utils';

export function Readiness({ booking, onChange, disabled }) {
  const percentage = readinessPercentage(booking);
  const pending = Math.max(0,
    Number(booking.executionReadiness?.totalTasks || 0)
      - Number(booking.executionReadiness?.completedTasks || 0));
  const color = percentage === 100 ? '#16a34a' : percentage >= 60 ? '#2563eb' : '#16a34a';

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[10px] font-bold"
        style={{ background: `radial-gradient(circle, hsl(var(--card)) 58%, transparent 60%), conic-gradient(${color} ${percentage}%, hsl(var(--muted)) 0)` }}
      >
        {percentage === 100 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : percentage}
      </span>
      <div className="min-w-0">
        {onChange ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={disabled || booking.isCrmOnly || booking.bookingStatus === 'Completed'}
                aria-label={`Change readiness: ${percentage}%`}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {percentage}%
                <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {[10, 25, 50, 75, 100].map((value) => (
                <DropdownMenuItem
                  key={value}
                  disabled={value === percentage}
                  onSelect={() => onChange(booking, value)}
                >
                  {value}%
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <p className="text-xs font-semibold text-foreground">{percentage}%</p>
        )}
        <p className="truncate text-[10px] text-muted-foreground">
          {percentage === 100 ? 'All set' : pending ? `${pending} critical pending` : 'Planning in progress'}
        </p>
      </div>
    </div>
  );
}

export function PlanningProgress({ booking }) {
  const percentage = readinessPercentage(booking);

  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-[11px] font-semibold text-foreground">{percentage}%</p>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`Planning ${percentage}% complete`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <div className="h-full rounded-full bg-blue-600 dark:bg-blue-500" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export function KeyPending({ booking }) {
  const items = getKeyPendingItems(booking);

  if (!items.length) {
    return <p className="truncate text-[10px] font-medium text-emerald-600 dark:text-emerald-400">No critical items</p>;
  }

  return (
    <ul className="min-w-0 space-y-1 text-[10px] text-foreground">
      {items.map((item) => (
        <li key={item} className="flex min-w-0 items-start gap-1.5">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
          <span className="line-clamp-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ExecutionReadinessProgress({ booking }) {
  const percentage = readinessPercentage(booking);
  const isStrong = percentage >= 85;

  return (
    <div className="min-w-0 space-y-1.5">
      <p className={`text-[11px] font-semibold ${isStrong ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
        {percentage}% Ready
      </p>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`Execution readiness ${percentage}%`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <div className={`h-full rounded-full ${isStrong ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export function FinalPending({ booking }) {
  const items = getKeyPendingItems(booking);

  if (!items.length) {
    return (
      <div className="space-y-1 text-[10px]">
        <p className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          <span className="truncate">All final checks complete</span>
        </p>
        <p className="text-muted-foreground">Ready for execution</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-1">
      <ul className="space-y-1 text-[10px] text-foreground">
        {items.map((item) => (
          <li key={item} className="flex min-w-0 items-start gap-1.5">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
            <span className="line-clamp-1">{item}</span>
          </li>
        ))}
      </ul>
      <p className="text-[9px] font-semibold text-blue-600 dark:text-blue-400">{items.length} item{items.length === 1 ? '' : 's'} pending</p>
    </div>
  );
}

export function PaymentProgress({ booking }) {
  const { clampedPercentage, pending } = getPaymentMetrics(booking);
  const tone = clampedPercentage >= 70
    ? 'text-emerald-600 dark:text-emerald-400'
    : clampedPercentage >= 30
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-destructive';
  const barTone = clampedPercentage >= 70
    ? 'bg-emerald-500'
    : clampedPercentage >= 30
      ? 'bg-amber-500'
      : 'bg-destructive';

  return (
    <div className="w-32 max-w-full space-y-1">
      <p className={`text-[11px] font-semibold ${tone}`}>{clampedPercentage}% Paid</p>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`Payment ${clampedPercentage}% paid`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clampedPercentage}
      >
        <div className={`h-full rounded-full ${barTone}`} style={{ width: `${clampedPercentage}%` }} />
      </div>
      <p className="truncate text-[10px] font-semibold text-foreground">{currencyAmount(pending)} Pending</p>
    </div>
  );
}

export function OnboardingProgress({ booking }) {
  const onboarding = getOnboardingProgress(booking);
  const percentage = Math.round((onboarding.completed / onboarding.total) * 100);
  const isComplete = onboarding.completed === onboarding.total;

  return (
    <div className="min-w-0 space-y-1">
      <p className={`text-[11px] font-semibold ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
        {onboarding.completed} / {onboarding.total} Completed
      </p>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`${onboarding.completed} of ${onboarding.total} onboarding steps completed`}
        aria-valuemin={0}
        aria-valuemax={onboarding.total}
        aria-valuenow={onboarding.completed}
      >
        <div
          className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className={`flex items-center gap-1 truncate text-[9px] ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
        {isComplete ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <AlertTriangle className="h-3 w-3 shrink-0" />}
        <span className="truncate">{onboarding.message}</span>
      </p>
    </div>
  );
}
