import React from "react";
import { FileImage, FileText, Paperclip } from "lucide-react";

export const TASK_STATUS_TONE = {
  "In Progress": "orange",
  Pending: "slate",
  "Pending Acceptance": "amber",
  Submitted: "navy",
  "Pending Approval": "violet",
  "Under Admin Review": "red",
  Completed: "green",
  Rework: "red",
  Cancelled: "gray",
  Rejected: "red",
};

export const TASK_STATUS_DOT_CLASS = {
  orange: "bg-orange-500",
  navy: "bg-blue-700",
  green: "bg-emerald-500",
  red: "bg-red-500",
  slate: "bg-slate-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  gray: "bg-gray-500",
};

export const TASK_STATUS_BADGE_CLASS = {
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300",
  navy: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  red: "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300",
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-400/10 dark:text-slate-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
  gray: "bg-gray-200 text-gray-700 dark:bg-gray-400/10 dark:text-gray-300",
};

export const getTaskStatusTone = (status) => TASK_STATUS_TONE[status] || "slate";

export const getTaskTitleValidationError = (value) => {
  const title = String(value || "").trim();
  if (!title) return "Task title is required";
  if (title.length > 30) return "Task title must be 30 characters or fewer";
  return "";
};

export const getDisplayTaskTitle = (value) =>
  String(value || "").slice(0, 30);

export const getDisplayTaskStatus = (task) => {
  return task?.status;
};

export function TaskStatusPill({ status }) {
  return (
    <span className={`inline-flex w-fit items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${TASK_STATUS_BADGE_CLASS[getTaskStatusTone(status)]}`}>
      {status}
    </span>
  );
}

export const PRIORITY_TEXT_CLASS = {
  High: "text-red-600 dark:text-red-400",
  Medium: "text-orange-600 dark:text-orange-400",
  Low: "text-emerald-600 dark:text-emerald-400",
};

export const PRIORITY_BADGE_CLASS = {
  High: "border border-red-300 bg-red-100 text-red-700 dark:border-red-400/40 dark:bg-red-400/15 dark:text-red-300",
  Medium: "border border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-400/40 dark:bg-orange-400/15 dark:text-orange-300",
  Low: "border border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/15 dark:text-emerald-300",
};

export const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getFileIconStyle = (file) => {
  const name = (file.fileName || "").toLowerCase();
  const type = (file.fileType || "").toLowerCase();
  if (type.includes("pdf") || name.endsWith(".pdf")) {
    return { icon: FileText, className: "bg-red-100 text-red-600 dark:bg-red-400/10 dark:text-red-300" };
  }
  if (type.includes("image") || /\.(png|jpe?g|gif|webp)$/.test(name)) {
    return { icon: FileImage, className: "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300" };
  }
  return { icon: Paperclip, className: "bg-muted text-muted-foreground" };
};

export const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
};

export const getAvatarUrl = (avatar) => {
  if (!avatar) return "";
  if (/^https?:\/\//.test(avatar)) return avatar;
  return `https://assets.divyam.com/Uploads/employee/${avatar}`;
};

const formatStatusDate = (value) => new Date(value).toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "short",
});

export const getDueDateNote = (dueDate, status, completedOn, submittedOn) => {
  if (status === "Completed") {
    return completedOn ? { text: `Completed on ${formatStatusDate(completedOn)}`, tone: "text-emerald-600" } : null;
  }
  if (status === "Cancelled" || status === "Rejected") return null;
  if (["Submitted", "Pending Approval", "Under Admin Review"].includes(status)) {
    return {
      text: submittedOn ? `Submitted on ${formatStatusDate(submittedOn)}` : "Submitted",
      tone: "text-blue-600",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return { text: `Overdue by ${days} day${days > 1 ? "s" : ""}`, tone: "text-red-600" };
  }
  if (diffDays === 0) return { text: "Due today", tone: "text-orange-600" };
  return { text: `${diffDays} day${diffDays > 1 ? "s" : ""} left`, tone: "text-muted-foreground" };
};

export function SectionHeader({ index, tone, title, badge, trailing }) {
  const toneClasses = {
    blue: "bg-blue-600 text-white",
    green: "bg-emerald-600 text-white",
    violet: "bg-violet-600 text-white",
    grey: "bg-slate-500 text-white",
    orange: "bg-orange-600 text-white",
  }[tone];
  const barClasses = {
    blue: "bg-blue-50 dark:bg-blue-400/10",
    green: "bg-emerald-50 dark:bg-emerald-400/10",
    violet: "bg-violet-50 dark:bg-violet-400/10",
    grey: "bg-slate-100 dark:bg-slate-400/10",
    orange: "bg-orange-50 dark:bg-orange-400/10",
  }[tone];
  const titleClasses = {
    blue: "text-blue-700 dark:text-blue-300",
    green: "text-emerald-700 dark:text-emerald-300",
    violet: "text-violet-700 dark:text-violet-300",
    grey: "text-slate-700 dark:text-slate-300",
    orange: "text-orange-700 dark:text-orange-300",
  }[tone];

  return (
    <div className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 ${barClasses}`}>
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${toneClasses}`}>
        {index}
      </span>
      <p className={`text-sm font-semibold ${titleClasses}`}>{title}</p>
      {badge && (
        <span className="rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {badge}
        </span>
      )}
      {trailing && <span className="ml-auto">{trailing}</span>}
    </div>
  );
}
