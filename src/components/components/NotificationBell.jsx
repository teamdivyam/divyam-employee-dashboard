import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import {
  AlarmClock,
  Bell,
  BellOff,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  MessageSquare,
  RotateCcw,
  Send,
  Trash2,
  Undo2,
  XCircle,
} from "lucide-react";

import { Skeleton } from "@components/components/ui/skeleton";
import EmployeeV2Service from "../../services/employee-v2.service";
import { getSocket } from "../../services/socket";

const NOTIFICATIONS_QUERY_KEY = ["notifications"];
const REMINDER_NOTIFICATION_TYPES = new Set([
  "work_request_reminder",
  "task_scheduled_reminder",
]);

const NOTIFICATION_STYLES = {
  work_request_received: { icon: Send, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  work_request_accepted: { icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  work_request_rejected: { icon: XCircle, className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  work_request_withdrawn: { icon: Undo2, className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  work_request_reminder: { icon: AlarmClock, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  task_scheduled_reminder: { icon: AlarmClock, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  task_message: { icon: MessageSquare, className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  due_date_change_requested: { icon: CalendarClock, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  due_date_change_responded: { icon: CalendarClock, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  task_marked_completed: { icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  task_sent_for_rework: { icon: RotateCcw, className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  task_updated: { icon: RotateCcw, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  task_deleted: { icon: Trash2, className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
};

const getNotificationStyle = (type) => NOTIFICATION_STYLES[type] || NOTIFICATION_STYLES.task_message;

const formatTimeAgo = (date) => formatDistanceToNowStrict(new Date(date), { addSuffix: true });

export function NotificationBell({ mode = "all" }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isReminderMode = mode === "reminders";
  const [isRinging, setIsRinging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const hasLoadedOnce = useRef(false);
  const containerRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, mode],
    queryFn: async () => {
      const response = await EmployeeV2Service.getMyNotifications({ limit: isReminderMode ? 100 : 20 });
      return response.data?.data;
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const allNotifications = data?.notifications || [];
  const notifications = isReminderMode
    ? allNotifications.filter((notification) => REMINDER_NOTIFICATION_TYPES.has(notification.type))
    : allNotifications;
  const unreadCount = isReminderMode
    ? notifications.filter((notification) => !notification.isRead).length
    : data?.unreadCount || 0;

  const markReadMutation = useMutation({
    mutationFn: (notificationId) => EmployeeV2Service.markNotificationRead(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => EmployeeV2Service.markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });

  const clearAllMutation = useMutation({
    mutationFn: () => EmployeeV2Service.clearAllNotifications(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });

  useEffect(() => {
    const socket = getSocket();
    const handleNewNotification = (notification) => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      if (isReminderMode && !REMINDER_NOTIFICATION_TYPES.has(notification?.type)) return;
      if (hasLoadedOnce.current) {
        setIsRinging(true);
        setTimeout(() => setIsRinging(false), 900);
      }
    };
    socket.on("notification:new", handleNewNotification);
    return () => socket.off("notification:new", handleNewNotification);
  }, [isReminderMode, queryClient]);

  useEffect(() => {
    if (!isLoading) hasLoadedOnce.current = true;
  }, [isLoading]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markReadMutation.mutate(notification._id);
    if (notification.taskId) {
      navigate(`/dashboard/my-tasks?taskId=${encodeURIComponent(notification.taskId)}`);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef}>
      <button
        type="button"
        aria-label={isReminderMode ? "Task reminders" : "Notifications"}
        title={isReminderMode ? "Task reminders" : "Notifications"}
        onClick={() => setIsOpen((value) => !value)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${
          isRinging ? "animate-wiggle" : ""
        }`}
      >
        {isReminderMode ? <AlarmClock className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`fixed top-14 z-50 w-[340px] origin-top-right animate-in overflow-hidden rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-2xl ring-1 ring-black/5 fade-in-0 zoom-in-95 duration-150 dark:ring-white/10 ${isReminderMode ? "right-16" : "right-6"}`}>
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-foreground">{isReminderMode ? "Task Reminders" : "Notifications"}</p>
              {!isReminderMode && unreadCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                  onClick={() => markAllReadMutation.mutate()}
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              {!isReminderMode && notifications.length > 0 && (
                <button
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                  onClick={() => clearAllMutation.mutate()}
                  disabled={clearAllMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div className="h-px bg-border" />
          <div className="max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-1 p-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-start gap-2.5 px-1.5 py-2">
                    <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-1.5 pt-0.5">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  {isReminderMode ? <AlarmClock className="h-4 w-4 text-muted-foreground" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
                </div>
                <p className="text-sm font-medium text-foreground">{isReminderMode ? "No reminders yet" : "You're all caught up"}</p>
                <p className="text-xs text-muted-foreground">
                  {isReminderMode ? "Task reminder notifications will show up here" : "Work requests and new messages will show up here"}
                </p>
              </div>
            ) : (
              <div className="space-y-0.5 p-1.5">
                {notifications.map((notification) => {
                  const { icon: Icon, className } = getNotificationStyle(notification.type);
                  return (
                    <button
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent ${
                        notification.isRead ? "" : "bg-primary/[0.05]"
                      }`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${className}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={`min-w-0 flex-1 truncate text-[13px] leading-snug text-foreground ${notification.isRead ? "font-normal" : "font-semibold"}`}>
                            {notification.title}
                          </p>
                          <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-muted-foreground/70">
                            {!notification.isRead && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                        {notification.body && (
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {notification.body}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ReminderNotificationBell() {
  return <NotificationBell mode="reminders" />;
}
