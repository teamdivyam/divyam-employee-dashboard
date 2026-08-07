import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import {
  AlarmClock,
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  MessageSquare,
  Send,
  Undo2,
  XCircle,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/components/ui/popover";
import { ScrollArea } from "@components/components/ui/scroll-area";
import { Skeleton } from "@components/components/ui/skeleton";
import EmployeeV2Service from "../../services/employee-v2.service";
import { getSocket } from "../../services/socket";

const NOTIFICATIONS_QUERY_KEY = ["notifications"];

const NOTIFICATION_STYLES = {
  work_request_received: { icon: Send, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  work_request_accepted: { icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  work_request_rejected: { icon: XCircle, className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  work_request_withdrawn: { icon: Undo2, className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  work_request_reminder: { icon: AlarmClock, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  task_message: { icon: MessageSquare, className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
};

const getNotificationStyle = (type) => NOTIFICATION_STYLES[type] || NOTIFICATION_STYLES.task_message;

const formatTimeAgo = (date) => formatDistanceToNowStrict(new Date(date), { addSuffix: true });

export function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRinging, setIsRinging] = useState(false);
  const hasLoadedOnce = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: async () => {
      const response = await EmployeeV2Service.getMyNotifications({ limit: 20 });
      return response.data?.data;
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const markReadMutation = useMutation({
    mutationFn: (notificationId) => EmployeeV2Service.markNotificationRead(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => EmployeeV2Service.markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });

  useEffect(() => {
    const socket = getSocket();
    const handleNewNotification = () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      if (hasLoadedOnce.current) {
        setIsRinging(true);
        setTimeout(() => setIsRinging(false), 900);
      }
    };
    socket.on("notification:new", handleNewNotification);
    return () => socket.off("notification:new", handleNewNotification);
  }, [queryClient]);

  useEffect(() => {
    if (!isLoading) hasLoadedOnce.current = true;
  }, [isLoading]);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markReadMutation.mutate(notification._id);
    if (notification.taskId) {
      navigate(`/dashboard/my-tasks?taskId=${encodeURIComponent(notification.taskId)}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${
            isRinging ? "animate-wiggle" : ""
          }`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-96 origin-top-right overflow-hidden p-0 shadow-lg duration-200 ease-out data-[state=closed]:duration-150 data-[state=closed]:ease-in"
      >
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
              onClick={() => markAllReadMutation.mutate()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="space-y-1 p-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-start gap-3 px-1 py-2.5">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <BellOff className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">You're all caught up</p>
              <p className="text-xs text-muted-foreground">
                Work requests and new messages will show up here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              {notifications.map((notification) => {
                const { icon: Icon, className } = getNotificationStyle(notification.type);
                return (
                  <button
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`group relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent ${
                      notification.isRead ? "" : "bg-primary/[0.04]"
                    }`}
                  >
                    {!notification.isRead && (
                      <span className="absolute left-0 top-0 h-full w-0.5 bg-primary" />
                    )}
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${className}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug text-foreground ${notification.isRead ? "font-normal" : "font-semibold"}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      {notification.body && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {notification.body}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] font-medium text-muted-foreground/70">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
