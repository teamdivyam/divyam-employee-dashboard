import React from "react";
import {
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileText,
  Info,
  Lock,
  MessageCircle,
  Star,
  ThumbsUp,
  TrendingUp,
  Trophy,
  UsersRound,
  Zap,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@components/components/ui/button";
import {
  IconPill,
  MetricCard,
  SectionCard,
  StatusBadge,
} from "../../my-tasks/components/WorkPanelUI";

export const scorecardData = {
  metrics: [
    ["Overall Score", "82 / 100", "Good", Trophy, "violet"],
    ["Current Grade", "B+", "Good Performance", Award, "orange"],
    ["Task Completion Rate", "87%", "Above Average", ClipboardCheck, "green"],
    ["Attendance Rate", "96%", "Excellent", CalendarCheck, "blue"],
    ["Report Discipline", "88%", "Good", ClipboardList, "violet"],
    ["360° Feedback Avg.", "4.4 / 5", "Very Good", UsersRound, "orange"],
  ],
  breakdown: [
    ["Work Completion", "Timely completion & quality of tasks", 22, 25, BriefcaseBusiness, "violet"],
    ["Punctuality & Attendance", "Attendance, check-ins & punctuality", 17, 20, Clock3, "orange"],
    ["Proof & Reporting", "Reports, proofs & documentation", 13, 15, FileText, "green"],
    ["Event Responsibility", "Ownership & execution of events", 14, 15, UsersRound, "blue"],
    ["Team Behavior", "Collaboration & communication", 8, 10, UsersRound, "violet"],
    ["Discipline & Reliability", "Policy adherence & reliability", 8, 10, BadgeCheck, "orange"],
  ],
  feedback: [
    ["Manager Rating", 4.5, "Reviewed by Rohit Bajpai", "violet"],
    ["Colleague Rating", 4.3, "Based on peer feedback", "orange"],
    ["Vendor Rating", 4.2, "Based on vendor feedback", "green"],
    ["Client Rating", 4.6, "Based on client feedback", "blue"],
  ],
  trend: [
    { month: "Dec", score: 62 },
    { month: "Jan", score: 66 },
    { month: "Feb", score: 71 },
    { month: "Mar", score: 74 },
    { month: "Apr", score: 78 },
    { month: "May", score: 82 },
  ],
  strengths: [
    "Consistently completes tasks on time with high quality.",
    "Excellent communication with clients and internal team.",
    "Takes full ownership of events from planning to execution.",
    "Well-organized documentation and proof submission.",
    "Polite, respectful and solution-oriented behavior.",
  ],
  improvements: [
    "Reduce late check-ins and ensure on-time starts.",
    "Submit daily reports within the SLA timeline.",
    "Improve vendor follow-up consistency.",
    "Share event updates proactively with stakeholders.",
    "Focus on continuous process improvement.",
  ],
  activity: [
    ["Reports Approved", 5, "This Month", CheckCircle2, "green"],
    ["Overdue Tasks", 2, "This Month", Clock3, "orange"],
    ["Late Reporting", 1, "This Month", Clock3, "red"],
    ["Client Praise", 1, "Received", ThumbsUp, "blue"],
    ["Positive Feedback", 3, "This Month", ClipboardList, "violet"],
    ["Policy Violations", 0, "This Month", Award, "green"],
  ],
};

export function PageHeader() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">My Scorecard</h1>
      <p className="mt-2 text-xs font-medium text-muted-foreground">
        Track your work quality, discipline, behavior and growth.
      </p>
    </div>
  );
}

export function ScoreMetrics({ metrics }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {metrics.map(([label, value, subLabel, Icon, tone]) => (
        <MetricCard key={label} label={label} value={value} subLabel={subLabel} icon={Icon} tone={tone} />
      ))}
    </div>
  );
}

export function ScoreBreakdown({ items, className = "" }) {
  return (
    <SectionCard title="Score Breakdown" icon={Zap} className={className}>
      <p className="-mt-1 mb-5 text-xs font-medium text-muted-foreground">
        Detailed evaluation across key performance areas
      </p>
      <div className="space-y-5">
        {items.map(([title, subtitle, score, total, Icon, tone]) => {
          const percent = (score / total) * 100;
          return (
            <div key={title} className="grid gap-3 md:grid-cols-[220px_1fr_70px] md:items-center">
              <div className="flex items-center gap-3">
                <IconPill icon={Icon} tone={tone} />
                <div>
                  <p className="text-xs font-semibold text-foreground">{title}</p>
                  <p className="text-xs font-normal text-muted-foreground">{subtitle}</p>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-muted">
                <div className={`h-2.5 rounded-full ${barColor(tone)}`} style={{ width: `${percent}%` }} />
              </div>
              <p className={`text-right text-xs font-semibold ${textColor(tone)}`}>{score} <span className="text-muted-foreground">/ {total}</span></p>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Info className="h-4 w-4 text-blue-600" />
        Scores are as of 23 May 2025 and updated weekly.
      </div>
    </SectionCard>
  );
}

export function FeedbackPanel({ feedback, className = "" }) {
  return (
    <SectionCard title="360° Feedback" icon={UsersRound} className={className}>
      <p className="-mt-9 ml-[149px] text-xs font-medium text-muted-foreground">(Approved & Verified)</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {feedback.map(([title, rating, subtitle, tone]) => (
          <div key={title} className="text-center">
            <div className={`mx-auto grid h-24 w-24 place-items-center rounded-full border-4 ${ringColor(tone)}`}>
              <div>
                <p className={`text-lg font-semibold ${textColor(tone)}`}>{rating}<span className="text-xs"> /5</span></p>
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold text-foreground">{title}</p>
            <p className="mx-auto mt-1 max-w-[130px] text-xs font-normal leading-5 text-muted-foreground">{subtitle}</p>
            <div className="mt-3"><StatusBadge>Approved</StatusBadge></div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function TrendPanel({ trend, className = "" }) {
  return (
    <SectionCard
      title="Monthly Score Trend"
      className={className}
      action={<Button variant="outline" className="h-9 text-xs font-medium">Last 6 Months</Button>}
    >
      <div className="h-[235px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 20, right: 18, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#4338ca" strokeWidth={3} dot={{ r: 5, fill: "#4338ca" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
        Overall Score
      </div>
    </SectionCard>
  );
}

export function ListCard({ title, icon: Icon, items, tone = "green", className = "" }) {
  return (
    <SectionCard title={title} icon={Icon} className={className}>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 text-xs font-normal leading-5 text-foreground">
            <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${textColor(tone)}`} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function ManagerRemarks({ className = "" }) {
  return (
    <SectionCard title="Manager Remarks" icon={MessageCircle} className={className}>
      <div className="rounded-lg bg-muted/30 p-5">
        <p className="text-xs font-semibold leading-5 text-foreground">
          Ayush consistently demonstrates strong ownership and dedication in managing events. His client handling and execution quality are excellent. Focus on improving report turnaround time and reducing late check-ins. Keep up the great work!
        </p>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white">RB</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground">Rohit Bajpai</p>
          <p className="text-xs text-muted-foreground">Operations Director</p>
        </div>
        <p className="text-xs text-muted-foreground">23 May 2025</p>
      </div>
    </SectionCard>
  );
}

export function ActivityPanel({ activity, className = "" }) {
  return (
    <SectionCard title="Recent Score Activity" icon={Zap} className={className}>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {activity.map(([label, value, subLabel, Icon, tone]) => (
          <div key={label} className="flex items-center gap-3">
            <IconPill icon={Icon} tone={tone} />
            <div>
              <p className="text-lg font-semibold text-foreground">{value}</p>
              <p className="text-xs font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{subLabel}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function ConfidentialPanel({ className = "" }) {
  return (
    <div className={`rounded-lg border border-violet-200 bg-violet-50 p-5 text-violet-800 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-200 ${className}`}>
      <div className="flex items-center gap-3">
        <IconPill icon={Lock} tone="violet" />
        <div>
          <p className="text-sm font-semibold">This scorecard is private and confidential.</p>
          <p className="mt-1 text-xs font-medium">Visible only to you and authorized company management.</p>
        </div>
      </div>
    </div>
  );
}

function barColor(tone) {
  const colors = {
    violet: "bg-violet-600",
    orange: "bg-orange-500",
    green: "bg-emerald-500",
    blue: "bg-blue-600",
    red: "bg-red-500",
  };
  return colors[tone] || colors.blue;
}

function textColor(tone) {
  const colors = {
    violet: "text-violet-600 dark:text-violet-300",
    orange: "text-orange-500 dark:text-orange-300",
    green: "text-emerald-600 dark:text-emerald-300",
    blue: "text-blue-600 dark:text-blue-300",
    red: "text-red-600 dark:text-red-300",
  };
  return colors[tone] || colors.blue;
}

function ringColor(tone) {
  const colors = {
    violet: "border-violet-200 text-violet-600 dark:border-violet-400/30",
    orange: "border-orange-200 text-orange-500 dark:border-orange-400/30",
    green: "border-emerald-200 text-emerald-600 dark:border-emerald-400/30",
    blue: "border-blue-200 text-blue-600 dark:border-blue-400/30",
  };
  return colors[tone] || colors.blue;
}
