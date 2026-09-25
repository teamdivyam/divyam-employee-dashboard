/* eslint-disable react/prop-types */
import {
  CalendarClock,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  CircleCheckBig,
  ClipboardCheck,
  Clock3,
  Info,
  LockKeyhole,
  MessageSquareText,
  Plus,
  RotateCcw,
  Search,
  Star,
  Sprout,
  Target,
  TrendingDown,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@components/components/ui/button";
import { Skeleton } from "@components/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/components/ui/dialog";
import { Input } from "@components/components/ui/input";
import { Textarea } from "@components/components/ui/textarea";

const COMPONENT_META = {
  taskPerformance: { icon: ClipboardCheck, tone: "blue" },
  punctualityAttendance: { icon: CalendarClock, tone: "orange" },
  adminReview: { icon: UserRoundCheck, tone: "violet" },
  teamFeedback: { icon: UsersRound, tone: "blue" },
  clientFeedback: { icon: Star, tone: "orange" },
};

const TONES = {
  blue: {
    icon: "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300",
    bar: "bg-blue-600",
    text: "text-blue-600 dark:text-blue-300",
  },
  orange: {
    icon: "bg-orange-50 text-orange-500 dark:bg-orange-400/10 dark:text-orange-300",
    bar: "bg-orange-500",
    text: "text-orange-500 dark:text-orange-300",
  },
  violet: {
    icon: "bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300",
    bar: "bg-violet-600",
    text: "text-violet-600 dark:text-violet-300",
  },
  green: {
    icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300",
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-300",
  },
};

const REVIEW_TONES = ["violet", "blue", "green"];
const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const formatScorecardMonth = (month, options = {}) => {
  if (!month) return "";
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: options.short ? "short" : "long",
    year: options.hideYear ? undefined : "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
};

const formatDate = (date) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

export function Panel({ title, subtitle, icon: Icon, action, children, className = "" }) {
  return (
    <section className={`rounded-lg border border-border bg-card shadow-sm ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4">
        <div className="flex items-start gap-2.5">
          {Icon ? <Icon className="mt-0.5 h-5 w-5 text-primary" /> : null}
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ScorecardHeader({ month, onMonthChange, status, showStatus = true, helpMode = "scorecard" }) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return (
    <div className="flex shrink-0 items-center">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="month"
          value={month}
          max={currentMonth}
          onChange={(event) => onMonthChange(event.target.value)}
          className="h-9 w-[160px] bg-card text-xs font-medium"
          aria-label="Scorecard month"
        />
        {showStatus ? (
          <span className={`inline-flex h-8 items-center rounded-md px-3 text-xs font-semibold ${
            status === "Published"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
              : "bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300"
          }`}>
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
            {status || "In Progress"}
          </span>
        ) : null}
        <ScoringRulesDialog mode={helpMode} />
      </div>
    </div>
  );
}

function ScoringRulesDialog({ mode }) {
  const scoreRules = [
    ["Task Performance", "40%", "Completion and on-time delivery"],
    ["Punctuality & Attendance", "15%", "Presence and punctuality"],
    ["Admin Review", "25%", "Work quality and ownership"],
    ["Team Feedback", "10%", "Collaboration and communication"],
    ["Client Feedback", "10%", "Service and client experience"],
  ];
  const feedbackRules = [
    ["Rate everyone", "Monthly", "Complete feedback for every listed teammate"],
    ["Use direct experience", "Fair", "Rate only work behavior you observed"],
    ["Keep it constructive", "Useful", "Add a specific example and practical suggestion"],
    ["Confidential by design", "Private", "Only aggregate team ratings are shared"],
  ];
  const isFeedback = mode === "feedback";
  const rules = isFeedback ? feedbackRules : scoreRules;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-card">
          <Info className="h-4 w-4" /> {isFeedback ? "How it works" : "How scoring works"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{isFeedback ? "How team feedback works" : "How your score is calculated"}</DialogTitle>
          <DialogDescription className="text-xs">
            {isFeedback
              ? "Complete honest and constructive feedback for your teammates each month."
              : "Your monthly score combines operational performance and verified feedback."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {rules.map(([label, weight, detail]) => (
            <div key={label} className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
              </div>
              <span className="text-sm font-semibold text-primary">{weight}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ComponentIcon({ component, className = "" }) {
  const meta = COMPONENT_META[component.key] || COMPONENT_META.taskPerformance;
  const Icon = meta.icon;
  return (
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${TONES[meta.tone].icon} ${className}`}>
      <Icon className="h-5 w-5" />
    </span>
  );
}

export function ScoreOverview({ scorecard }) {
  const components = scorecard?.components || [];
  const score = clamp(scorecard?.score);
  return (
    <div className="grid gap-3 xl:grid-cols-[1.45fr_repeat(5,minmax(0,0.72fr))]">
      <section className="flex min-h-[142px] items-center gap-5 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div
          className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(#10b981 ${score * 3.6}deg, hsl(var(--muted)) 0deg)` }}
          aria-label={`${score} out of 100`}
        >
          <div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-card text-center">
            <div>
              <p className="text-3xl font-semibold text-foreground">{score}</p>
              <p className="text-xs font-medium text-muted-foreground">/ 100</p>
            </div>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Provisional Score</p>
          <span className="mt-2 inline-flex rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
            {scorecard?.label || "Requires Attention"}
          </span>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {scorecard?.status === "Published"
              ? "Your final score for this month is published."
              : "Your score remains provisional until the month is closed."}
          </p>
        </div>
      </section>

      {components.map((component) => {
        const change = Number(component.changeFromPreviousMonth) || 0;
        return (
          <section key={component.key} className="min-h-[142px] rounded-lg border border-border bg-card p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <ComponentIcon component={component} />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium text-muted-foreground">{component.label}</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {component.score} <span className="text-xs text-muted-foreground">/ {component.maxScore}</span>
                </p>
              </div>
            </div>
            <p className="mt-2 text-xl font-semibold text-foreground">{component.percentage}%</p>
            <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {change > 0 ? "+" : ""}{change}% <span className="font-normal text-muted-foreground">vs last month</span>
            </p>
          </section>
        );
      })}
    </div>
  );
}

export function ScoreBreakdown({ components }) {
  return (
    <Panel
      title="Score Breakdown"
      subtitle="Your score is calculated from the following components."
      icon={TrendingUp}
      className="min-w-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[690px] text-left">
          <thead>
            <tr className="border-y border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground">
              <th className="px-3 py-2">Component</th>
              <th className="px-3 py-2">Weight</th>
              <th className="px-3 py-2">Your Score</th>
              <th className="px-3 py-2">Progress</th>
              <th className="px-3 py-2">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {(components || []).map((component) => {
              const meta = COMPONENT_META[component.key] || COMPONENT_META.taskPerformance;
              return (
                <tr key={component.key} className="border-b border-border last:border-0">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <ComponentIcon component={component} />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{component.label}</p>
                        <p className="mt-0.5 max-w-[230px] text-[11px] text-muted-foreground">{component.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs font-semibold text-foreground">{component.weight}%</td>
                  <td className={`px-3 py-3 text-xs font-semibold ${TONES[meta.tone].text}`}>
                    {component.score} / {component.maxScore}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${TONES[meta.tone].bar}`} style={{ width: `${clamp(component.percentage)}%` }} />
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground">{component.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex rounded-md bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                      {component.remark}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function TrendPanel({ trend }) {
  const data = (trend || []).map((item) => ({
    ...item,
    label: formatScorecardMonth(item.month, { short: true }),
  }));
  return (
    <Panel title="Monthly Score Trend" subtitle="Overall score for the last six months." icon={TrendingUp}>
      <div className="h-[210px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 16, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
                fontSize: 12,
              }}
            />
            <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: "#2563eb", strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Published / provisional score
      </div>
    </Panel>
  );
}

export function FeedbackSummary({ feedback, notice }) {
  return (
    <Panel
      title="Feedback Summary"
      subtitle="Ratings from people you work with."
      icon={UsersRound}
      action={
        <span className="hidden max-w-[270px] items-start gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-2 py-1.5 text-[10px] text-orange-700 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-300 md:flex">
          <Info className="mt-0.5 h-3 w-3 shrink-0" /> {notice}
        </span>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {(feedback || []).map((item, index) => {
          const tone = REVIEW_TONES[index] || "blue";
          const meta = {
            "Admin Review": UserRoundCheck,
            "Team Feedback": UsersRound,
            "Client Feedback": Star,
          };
          const Icon = meta[item.type] || Star;
          return (
            <div key={item.type} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <span className={`grid h-11 w-11 place-items-center rounded-full ${TONES[tone].icon}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">{item.type}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{item.averageRating} / 5</p>
                <p className="text-[10px] text-muted-foreground">
                  Based on {item.responseCount} {item.responseCount === 1 ? "response" : "responses"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export function InsightList({ title, subtitle, icon: Icon, items, numbered = false }) {
  return (
    <Panel title={title} subtitle={subtitle} icon={Icon} className="h-full">
      {items?.length ? (
        <div className="space-y-2.5">
          {items.map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-start gap-2.5 text-xs leading-5 text-foreground">
              {numbered ? (
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-50 text-xs font-semibold text-orange-600 dark:bg-orange-400/10 dark:text-orange-300">
                  {index + 1}
                </span>
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              )}
              <span>{item}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyText>No items have been added for this month.</EmptyText>
      )}
    </Panel>
  );
}

export function GoalsPanel({ goals, onAdd, onToggle, isUpdating }) {
  return (
    <Panel
      title="Next Month Goals"
      subtitle="Focus areas agreed for your growth."
      icon={Target}
      className="h-full"
      action={<Button type="button" variant="outline" size="sm" onClick={onAdd}><Plus className="h-3.5 w-3.5" /> Add goal</Button>}
    >
      {goals?.length ? (
        <div className="space-y-2.5">
          {goals.map((goal) => (
            <div key={goal._id} className="flex items-start gap-2.5 text-xs leading-5 text-foreground">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onToggle(goal)}
                className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border ${goal.isCompleted ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"}`}
                aria-label={`${goal.isCompleted ? "Mark incomplete" : "Mark complete"}: ${goal.text}`}
              >
                {goal.isCompleted ? <Check className="h-3 w-3" /> : null}
              </button>
              <span className={goal.isCompleted ? "text-muted-foreground line-through" : ""}>{goal.text}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyText>No goals yet. Add a focus area for next month.</EmptyText>
      )}
    </Panel>
  );
}

export function RecentComments({ comments }) {
  return (
    <Panel title="Recent Comments" subtitle="Latest feedback from your reviewer." icon={MessageSquareText} className="h-full">
      {comments?.length ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment._id}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">{comment.reviewerName}</p>
                <p className="text-[10px] text-muted-foreground">{formatDate(comment.submittedAt)}</p>
              </div>
              <p className="mt-2 rounded-md bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">“{comment.comment}”</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyText>No reviewer comments are available for this month.</EmptyText>
      )}
    </Panel>
  );
}

export function GoalDialog({ open, onOpenChange, value, onValueChange, onSubmit, isSubmitting }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Add next month goal</DialogTitle>
          <DialogDescription className="text-xs">Add one clear, measurable area to focus on.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Textarea
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            maxLength={300}
            rows={4}
            placeholder="e.g. Submit every event report within 24 hours"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!value.trim() || isSubmitting}>{isSubmitting ? "Adding..." : "Add goal"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TeamFeedbackPanel({
  dashboard,
  filters,
  setFilters,
  onOpenSubmission,
  isLoading,
}) {
  const summary = dashboard?.summary || {};
  const employees = dashboard?.employees || [];
  const progress = clamp(summary.progressPercentage);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FeedbackMetric icon={UsersRound} tone="blue" value={summary.total || 0} label="Team Members" note="Excluding yourself" />
        <FeedbackMetric icon={CircleCheckBig} tone="green" value={summary.completed || 0} label="Completed" note="Feedback given" />
        <FeedbackMetric icon={Clock3} tone="orange" value={summary.pending || 0} label="Pending" note={summary.dueDate ? `Complete before ${formatDate(summary.dueDate)}` : "Awaiting feedback"} />
        <section className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div
            className="grid h-16 w-16 shrink-0 place-items-center rounded-full"
            style={{ background: `conic-gradient(#7c3aed ${progress * 3.6}deg, hsl(var(--muted)) 0deg)` }}
          >
            <div className="h-11 w-11 rounded-full bg-card" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-semibold text-foreground">{progress}%</p>
            <p className="text-xs font-semibold text-foreground">Overall Progress</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-blue-900 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" />
          <div>
            <p className="text-xs font-semibold">Monthly team feedback helps us build a stronger, more collaborative team.</p>
            <p className="mt-1 text-[11px] opacity-80">Your feedback is confidential and individual responses are never shared with team members.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-red-700 dark:bg-red-400/10 dark:text-red-300">
          <CalendarClock className="h-4 w-4" />
          <div>
            <p className="text-[10px] font-semibold">Monthly Feedback Due</p>
            <p className="text-xs font-semibold">{summary.dueDate ? formatDate(summary.dueDate) : "Not available"}</p>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="grid gap-3 p-3 md:grid-cols-[1fr_280px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search by name or role..."
              className="pl-9"
            />
          </div>
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground"
            aria-label="Feedback status"
          >
            <option value="All">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
          </select>
          <Button type="button" variant="outline" size="sm" onClick={() => setFilters({ search: "", status: "All" })}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>

        <div className="mt-2 overflow-x-auto border-t border-border">
          <table className="w-full min-w-[760px] table-fixed text-left">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[25%]" />
              <col className="w-[20%]" />
              <col className="w-[25%]" />
            </colgroup>
            <thead className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground">
              <tr>
                <th className="px-12 py-3">Employee</th>
                <th className="px-12 py-3">Role</th>
                <th className="px-12 py-3">Status</th>
                <th className="py-3 pl-6 pr-20 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }, (_, index) => (
                  <tr key={index} className="border-t border-border"><td colSpan={4} className="px-5 py-2"><Skeleton className="h-8 w-full" /></td></tr>
                ))
              ) : employees.length ? employees.map((employee) => (
                <tr key={employee._id} className="border-t border-border text-xs">
                  <td className="px-6 py-2.5">
                    <div className="flex items-center gap-3">
                      <EmployeeAvatar employee={employee} />
                      <div>
                        <p className="font-semibold text-foreground">{employee.name}</p>
                        <p className="text-[10px] text-muted-foreground">{employee.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-2.5 text-muted-foreground">{employee.designation}</td>
                  <td className="px-6 py-2.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium ${
                      employee.status === "Completed"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                        : "bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300"
                    }`}>
                      {employee.status === "Completed" ? <CircleCheckBig className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-2.5 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant={employee.status === "Completed" ? "outline" : "default"}
                      className="min-w-[126px]"
                      onClick={() => onOpenSubmission(employee)}
                    >
                      {employee.status === "Completed" ? "View Submission" : "Rate Now"}
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-xs text-muted-foreground">No team members match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 text-[11px] text-orange-900 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-200">
        <p className="font-semibold">Tips for Good Feedback</p>
        {["Be honest and constructive", "Focus on work behavior", "Highlight strengths and improvement areas", "Keep feedback respectful and professional"].map((tip) => (
          <span key={tip} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-orange-500" />{tip}</span>
        ))}
      </div>
    </div>
  );
}

function FeedbackMetric({ icon: Icon, tone, value, label, note }) {
  return (
    <section className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${TONES[tone].icon}`}><Icon className="h-7 w-7" /></span>
      <div>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">{note}</p>
      </div>
    </section>
  );
}

function EmployeeAvatar({ employee }) {
  const url = employee.profileImage?.smallUrl || employee.profileImage?.originalUrl;
  const initials = employee.name?.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return url ? (
    <img src={url} alt="" className="h-8 w-8 rounded-full object-cover" />
  ) : (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">{initials}</span>
  );
}

export function TeamFeedbackDialog({
  open,
  onOpenChange,
  employee,
  submission,
  summary,
  month,
  isLoading,
  form,
  setForm,
  onSubmit,
  isSubmitting,
}) {
  const readOnly = employee?.status === "Completed";
  const ratingAreas = [
    ["teamworkSupport", "Teamwork & Support", "Collaborates well and supports the team", UsersRound],
    ["responsibilityReliability", "Responsibility & Reliability", "Takes ownership and delivers consistently", ClipboardCheck],
    ["communication", "Communication", "Clear, timely and respectful communication", MessageSquareText],
    ["professionalConduct", "Professional Conduct", "Positive attitude, discipline and professionalism", UserRoundCheck],
  ];
  const isAreaComplete = (key) =>
    readOnly || Number(form.ratings[key]) > 0 || form.notObserved[key];
  const canSubmit = ratingAreas.every(([key]) => isAreaComplete(key));
  const displayRating = (key) => {
    if (!readOnly) return Number(form.ratings[key]) || 0;
    return Number(submission?.ratings?.[key] ?? submission?.rating) || 0;
  };
  const isNotObserved = (key) =>
    readOnly
      ? submission?.ratings && submission.ratings[key] == null
      : form.notObserved[key];
  const appreciation = readOnly
    ? submission?.appreciation || ""
    : form.appreciation;
  const improvementSuggestion = readOnly
    ? submission?.improvementSuggestion || ""
    : form.improvementSuggestion;
  const progress = clamp(summary?.progressPercentage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] max-w-2xl overflow-y-auto border-t-4 border-t-orange-400 p-0">
        <div className="border-b border-border px-5 py-3">
          <DialogHeader>
            <div className="flex flex-col gap-4 pr-8 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <DialogTitle className="text-lg">Team Feedback — {formatScorecardMonth(month) || "Monthly Review"}</DialogTitle>
                <DialogDescription className="mt-1 text-xs">Help us build a stronger team at DIVYAM.</DialogDescription>
              </div>
              <div className="w-full max-w-[220px]">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{summary?.completed || 0} of {summary?.total || 0} completed</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>
        {isLoading ? <Skeleton className="h-48" /> : (
          <form onSubmit={onSubmit}>
            <div className="space-y-3 px-5 py-3">
              <div className="flex flex-col gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-400/10 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <EmployeeAvatarLarge employee={employee} />
                  <div>
                    <p className="text-base font-semibold text-foreground">{employee?.name}</p>
                    <p className="text-xs text-muted-foreground">{employee?.designation}</p>
                    <p className="mt-1 text-[11px] italic text-muted-foreground">“Every team member makes a difference.”</p>
                  </div>
                </div>
                <div className="flex max-w-[250px] items-center gap-3 text-xs text-blue-900 dark:text-blue-200">
                  <UsersRound className="h-6 w-6 shrink-0" />
                  <p>Your feedback helps us grow together as a stronger team.</p>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-foreground">Rate the following areas</h3>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-primary"><Info className="h-4 w-4" /> Rate only what you observed</span>
                </div>
                <div className="space-y-2">
                  {ratingAreas.map(([key, title, description, Icon]) => {
                    const rating = displayRating(key);
                    const notObserved = isNotObserved(key);
                    return (
                      <div key={key} className="grid gap-2 rounded-lg border border-border p-2 md:grid-cols-[1fr_auto_auto] md:items-center">
                        <div className="flex items-center gap-3">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300"><Icon className="h-4 w-4" /></span>
                          <div>
                            <p className="text-xs font-semibold text-foreground">{title}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <button
                              key={value}
                              type="button"
                              disabled={readOnly || notObserved}
                              onClick={() => setForm((current) => ({
                                ...current,
                                ratings: { ...current.ratings, [key]: value },
                                notObserved: { ...current.notObserved, [key]: false },
                              }))}
                              className="rounded p-0.5 disabled:cursor-default"
                              aria-label={`${value} stars for ${title}`}
                            >
                              <Star className={`h-5 w-5 ${value <= rating && !notObserved ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                            </button>
                          ))}
                        </div>
                        <label className="flex items-center gap-2 whitespace-nowrap text-[11px] text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={Boolean(notObserved)}
                            disabled={readOnly}
                            onChange={(event) => setForm((current) => ({
                              ...current,
                              ratings: { ...current.ratings, [key]: event.target.checked ? 0 : current.ratings[key] },
                              notObserved: { ...current.notObserved, [key]: event.target.checked },
                            }))}
                            className="h-4 w-4 rounded border-input accent-primary"
                          />
                          Not Observed
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-400/10">
                  <label htmlFor="feedback-appreciation" className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300"><Sprout className="h-4 w-4" /> Appreciation <span className="font-normal text-muted-foreground">(Optional)</span></label>
                  <Textarea
                    id="feedback-appreciation"
                    value={appreciation}
                    onChange={(event) => setForm((current) => ({ ...current, appreciation: event.target.value }))}
                    readOnly={readOnly}
                    rows={3}
                    maxLength={250}
                    placeholder="What does this team member do well?"
                    className="bg-card"
                  />
                  <p className="mt-1 text-right text-[10px] text-muted-foreground">{appreciation.length}/250</p>
                </div>
                <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-400/10">
                  <label htmlFor="feedback-improvement" className="mb-2 flex items-center gap-2 text-xs font-semibold text-orange-800 dark:text-orange-300"><BarChart3 className="h-4 w-4" /> Improvement Suggestion <span className="font-normal text-muted-foreground">(Optional)</span></label>
                  <Textarea
                    id="feedback-improvement"
                    value={improvementSuggestion}
                    onChange={(event) => setForm((current) => ({ ...current, improvementSuggestion: event.target.value }))}
                    readOnly={readOnly}
                    rows={3}
                    maxLength={250}
                    placeholder="What could help them work better with the team?"
                    className="bg-card"
                  />
                  <p className="mt-1 text-right text-[10px] text-muted-foreground">{improvementSuggestion.length}/250</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3 text-[11px] text-blue-800 dark:bg-blue-400/10 dark:text-blue-200">
                <LockKeyhole className="h-5 w-5 shrink-0" />
                Your feedback is confidential. Team members see only aggregated feedback, never individual ratings or reviewer names.
              </div>
              {readOnly ? <p className="text-[11px] text-muted-foreground">Submitted {formatDate(submission?.submittedAt)}</p> : null}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" className="sm:min-w-[170px]" onClick={() => onOpenChange(false)}>{readOnly ? "Close" : "Skip for Now"}</Button>
              {!readOnly ? (
                <Button type="submit" className="sm:min-w-[210px]" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save & Next"} <ArrowRight className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EmployeeAvatarLarge({ employee }) {
  const url = employee?.profileImage?.mediumUrl || employee?.profileImage?.smallUrl || employee?.profileImage?.originalUrl;
  const initials = employee?.name?.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return url ? (
    <img src={url} alt="" className="h-16 w-16 rounded-full object-cover" />
  ) : (
    <span className="grid h-16 w-16 place-items-center rounded-full bg-card text-lg font-semibold text-primary shadow-sm">{initials}</span>
  );
}

export function ScorecardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-[142px]" />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-[420px]" />
        <Skeleton className="h-[420px]" />
      </div>
    </div>
  );
}

export function ScorecardError({ message, onRetry }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-400/20 dark:bg-red-400/10">
      <p className="text-sm font-semibold text-red-700 dark:text-red-300">Unable to load your scorecard</p>
      <p className="mt-1 text-xs text-red-600/80 dark:text-red-300/80">{message}</p>
      <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onRetry}>Try again</Button>
    </div>
  );
}

function EmptyText({ children }) {
  return <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">{children}</p>;
}
