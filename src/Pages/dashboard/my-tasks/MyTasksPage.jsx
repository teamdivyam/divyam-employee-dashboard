import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import { Dialog, DialogContent } from "@components/components/ui/dialog";
import MonthFilterControl from "@components/components/MonthFilterControl";
import TabComp from "@components/components/tab-comp";
import {
  AlertTriangle,
  CalendarCheck,
  CheckSquare,
  ClipboardList,
  Eye,
  FileText,
  Info,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";
import EmployeeV2Service from "@/services/employee-v2.service";
import { getSocket } from "@/services/socket";
import useCurrentEmployee from "@/hooks/useCurrentEmployee";
import { Avatar, AvatarFallback, AvatarImage } from "@components/components/ui/avatar";
import {
  DataTable,
  formatDate,
  IconPill,
  MetricCard,
  TableButton,
} from "./components/WorkPanelUI";
import {
  PRIORITY_BADGE_CLASS,
  TaskStatusPill,
  getAvatarUrl,
  getDisplayTaskTitle,
  getDisplayTaskStatus,
  getDueDateNote,
  getInitials,
  getTaskStatusTone,
} from "./components/taskHelpers";
import TaskDetailDialog from "./components/TaskDetailDialog";
import AddTaskDialog from "./components/AddTaskDialog";

const tabs = [
  ["my_work", "My Work", CalendarCheck, "my_work"],
  ["collaborating", "Collaborating", Users, "collaborating"],
  ["requests_sent", "Requests Sent", Send, "employee_requests_sent"],
  ["pending_acceptance", "Pending Acceptance", FileText, "employee_pending_acceptance"],
  ["awaiting_review", "Awaiting Review", Eye, "awaiting_review"],
  ["completed", "Completed", CheckSquare, "completed"],
];

const SCOPE_BY_TAB = Object.fromEntries(
  tabs.map(([tab, , , scope]) => [tab, scope]),
);

const createTaskItem = () => ({
  clientId: globalThis.crypto?.randomUUID?.() || `task-${Date.now()}-${Math.random()}`,
  taskTitle: "",
  relatedTo: "",
  dueDate: "",
  dueTime: "",
  priority: "Medium",
  reminderDate: "",
  reminderTime: "",
  instructions: "",
  expectedOutcome: "",
  checklist: [],
  completionRequirement: "Update Note",
  attachments: [],
});

const createEmptyTaskBatch = () => ({
  taskType: "Self Task",
  primaryOwnerId: "",
  collaboratorIds: [],
  reviewerId: "",
  visibility: "Private",
  tasks: [createTaskItem()],
});


export default function MyTasksPage() {
  const queryClient = useQueryClient();
  const { data: currentEmployee } = useCurrentEmployee();
  const [filters, setFilters] = useState({
    search: "",
    tab: "my_work",
    sortBy: "dueDate",
    page: 1,
    taskType: "all",
    status: "all",
    priority: "all",
    relatedType: "all",
  });
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [openFilterDropdown, setOpenFilterDropdown] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const markedNotificationIdsRef = useRef(new Set());

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await EmployeeV2Service.getMyNotifications({ limit: 20 });
      return response.data?.data;
    },
    staleTime: 0,
  });
  const unreadTaskNotifications = notificationsData?.unreadTaskNotifications
    || (notificationsData?.notifications || []).filter((notification) => !notification.isRead && notification.task);
  const unreadCountByTask = useMemo(() => {
    const counts = new Map();
    unreadTaskNotifications.forEach((notification) => {
      [notification.task, notification.taskId]
        .filter(Boolean)
        .forEach((taskKey) => {
          const key = String(taskKey);
          counts.set(key, (counts.get(key) || 0) + 1);
        });
    });
    return counts;
  }, [unreadTaskNotifications]);

  useEffect(() => {
    const taskIdFromLink = searchParams.get("taskId");
    if (!taskIdFromLink) return;

    setSelectedTaskId(taskIdFromLink);
    setIsDetailOpen(true);
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete("taskId");
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!isDetailOpen || !selectedTaskId) return;

    const selectedKey = String(selectedTaskId);
    const unreadForTask = unreadTaskNotifications.filter((notification) => (
      String(notification.task) === selectedKey || String(notification.taskId) === selectedKey
    ) && !markedNotificationIdsRef.current.has(String(notification._id)));
    if (!unreadForTask.length) return;

    unreadForTask.forEach((notification) => markedNotificationIdsRef.current.add(String(notification._id)));
    void Promise.allSettled(
      unreadForTask.map((notification) => EmployeeV2Service.markNotificationRead(notification._id)),
    ).then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }));
  }, [isDetailOpen, queryClient, selectedTaskId, unreadTaskNotifications]);

  useEffect(() => {
    const socket = getSocket();
    const handleTaskUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-task-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["my-task-counters"] });
      queryClient.invalidateQueries({ queryKey: ["my-task-detail"] });
    };
    socket.on("task:updated", handleTaskUpdated);
    return () => socket.off("task:updated", handleTaskUpdated);
  }, [queryClient]);

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState(createEmptyTaskBatch);

  const selectedMonth = `${monthFilter.year}-${String(monthFilter.month).padStart(2, "0")}`;

  const analyticsQuery = useQuery({
    queryKey: ["my-task-analytics", selectedMonth],
    queryFn: async () => {
      const response = await EmployeeV2Service.getTaskAnalyticsV2({ month: selectedMonth });
      return response.data?.data?.analytics;
    },
  });

  const pendingAcceptanceCountQuery = useQuery({
    queryKey: ["my-task-counters", "employee_pending_acceptance", selectedMonth],
    queryFn: async () => {
      const response = await EmployeeV2Service.getMyTasksV2({
        scope: "employee_pending_acceptance",
        month: selectedMonth,
        page: 1,
        limit: 1,
      });
      return response.data?.data?.pagination?.total ?? 0;
    },
  });

  const requestsSentCountQuery = useQuery({
    queryKey: ["my-task-counters", "employee_requests_sent", selectedMonth],
    queryFn: async () => {
      const response = await EmployeeV2Service.getMyTasksV2({
        scope: "employee_requests_sent",
        month: selectedMonth,
        page: 1,
        limit: 1,
      });
      return response.data?.data?.pagination?.total ?? 0;
    },
  });

  const tasksQuery = useQuery({
    queryKey: ["my-tasks", filters, selectedMonth],
    queryFn: async () => {
      const response = await EmployeeV2Service.getMyTasksV2({
        scope: SCOPE_BY_TAB[filters.tab] || filters.tab,
        page: filters.page,
        limit: 10,
        search: filters.search || undefined,
        taskType: filters.taskType !== "all" ? filters.taskType : undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        priority: filters.priority !== "all" ? filters.priority : undefined,
        relatedType: filters.relatedType !== "all" ? filters.relatedType : undefined,
        month: selectedMonth,
        sortBy: filters.sortBy,
        sortOrder: "asc",
      });
      return response.data?.data;
    },
    placeholderData: (previous) => previous,
  });

  const tasks = tasksQuery.data?.tasks || [];
  const pagination = tasksQuery.data?.pagination;

  const selectedTask = useMemo(
    () => tasks.find((task) => task._id === selectedTaskId || task.taskId === selectedTaskId),
    [selectedTaskId, tasks]
  );

  const detailQuery = useQuery({
    queryKey: ["my-task-detail", selectedTaskId],
    queryFn: async () => {
      const response = await EmployeeV2Service.getMyTaskV2Detail(selectedTaskId);
      return response.data?.data?.task;
    },
    enabled: Boolean(selectedTaskId) && isDetailOpen,
  });

  const taskDetail = { ...selectedTask, ...(detailQuery.data || {}) };

  const createTaskMutation = useMutation({
    mutationFn: (payload) => EmployeeV2Service.createTaskBatch(payload),
    onSuccess: (response) => {
      const createdTasks = response.data?.data?.tasks || [];
      toast.success(`${createdTasks.length} task${createdTasks.length === 1 ? "" : "s"} created successfully`);
      setIsAddTaskOpen(false);
      setNewTask(createEmptyTaskBatch());
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-task-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["my-task-counters"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to create task"),
  });

  const invalidateTaskQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["my-task-detail", selectedTaskId] });
    queryClient.invalidateQueries({ queryKey: ["my-task-analytics"] });
    queryClient.invalidateQueries({ queryKey: ["my-task-counters"] });
  };

  const updateProgressMutation = useMutation({
    mutationFn: (payload) => EmployeeV2Service.updateTaskProgress(payload),
    onSuccess: () => {
      toast.success("Task updated");
      invalidateTaskQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update task"),
  });

  const editTaskMutation = useMutation({
    mutationFn: (payload) => EmployeeV2Service.updateTaskDetails(payload),
    onSuccess: () => {
      toast.success("Task details updated");
      invalidateTaskQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update task details"),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => EmployeeV2Service.deleteTask(taskId),
    onSuccess: () => {
      toast.success("Self task deleted");
      setIsDetailOpen(false);
      setSelectedTaskId(null);
      invalidateTaskQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to delete task"),
  });

  const reviewTaskMutation = useMutation({
    mutationFn: (payload) => EmployeeV2Service.reviewTask(payload),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Review recorded");
      invalidateTaskQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to record review"),
  });

  const respondMutation = useMutation({
    mutationFn: (payload) => EmployeeV2Service.respondToWorkRequest(payload),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Response recorded");
      invalidateTaskQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to respond to request"),
  });

  const dueDateChangeMutation = useMutation({
    mutationFn: (payload) => EmployeeV2Service.requestDueDateChange(payload),
    onSuccess: (response) => {
      const requestStatus = response.data?.data?.task?.dueDateChangeRequest?.status;
      toast.success(requestStatus === "Approved" ? "Due date updated" : "Due date change requested");
      invalidateTaskQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to request due date change"),
  });

  const dueDateChangeRespondMutation = useMutation({
    mutationFn: (payload) => EmployeeV2Service.respondToDueDateChange(payload),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Response recorded");
      invalidateTaskQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to respond to due date change"),
  });

  const withdrawMutation = useMutation({
    mutationFn: (taskId) => EmployeeV2Service.withdrawWorkRequest(taskId),
    onSuccess: () => {
      toast.success("Work request withdrawn");
      invalidateTaskQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to withdraw request"),
  });

  const reminderMutation = useMutation({
    mutationFn: (taskId) => EmployeeV2Service.sendTaskReminder(taskId),
    onSuccess: () => {
      toast.success("Reminder sent");
      invalidateTaskQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to send reminder"),
  });

  const discussionMutation = useMutation({
    mutationFn: (payload) => EmployeeV2Service.addTaskDiscussionMessage(payload),
    onSuccess: () => {
      invalidateTaskQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to send message"),
  });

  const checklistMutation = useMutation({
    mutationFn: (payload) => EmployeeV2Service.updateTaskChecklistItem(payload),
    onSuccess: () => invalidateTaskQueries(),
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update checklist"),
  });

  const escalateMutation = useMutation({
    mutationFn: (payload) => EmployeeV2Service.escalateTask(payload),
    onSuccess: () => {
      toast.success("Task escalated to admin");
      invalidateTaskQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to escalate task"),
  });

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: key === "page" ? value : 1 }));

  const setTaskMonth = (updater) => {
    setMonthFilter(updater);
    setFilters((current) => ({ ...current, page: 1 }));
  };

  const hasActiveFilters = Boolean(
    filters.search
    || filters.taskType !== "all"
    || filters.status !== "all"
    || filters.priority !== "all"
    || filters.relatedType !== "all"
  );

  const clearFilters = () => setFilters((current) => ({
    ...current,
    search: "",
    taskType: "all",
    status: "all",
    priority: "all",
    relatedType: "all",
    page: 1,
  }));

  const openTaskDetail = (task) => {
    setSelectedTaskId(task._id || task.taskId);
    setIsDetailOpen(true);
  };

  const analytics = analyticsQuery.data || {};
  const employeeTabCounts = {
    pending_acceptance: pendingAcceptanceCountQuery.data ?? 0,
    requests_sent: requestsSentCountQuery.data ?? 0,
  };
  const metricCards = [
    ["Due Today", analytics.dueToday || 0, "Tasks", CalendarCheck, "blue"],
    ["In Progress", analytics.inProgress || 0, "Tasks", RotateCcw, "orange"],
    ["Overdue", analytics.overdue || 0, "Tasks", AlertTriangle, "red"],
    ["Pending Acceptance", employeeTabCounts.pending_acceptance, "Tasks", ClipboardList, "violet"],
    ["Awaiting Review", analytics.tabCounts?.awaiting_review || 0, "Tasks", Eye, "blue"],
    ["Completed This Month", analytics.tabCounts?.completed || 0, "Tasks", CheckSquare, "green"],
  ];
  const taskTabs = tabs.map(([value, label, icon]) => ({
    value,
    label,
    icon,
    notificationCount: value === "completed"
      ? undefined
      : employeeTabCounts[value] ?? analytics.tabCounts?.[SCOPE_BY_TAB[value] || value],
  }));

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="min-h-[calc(100vh-4rem)] bg-background p-2 text-foreground md:p-3">
        <div className="mx-auto max-w-[1500px] space-y-3">
        <PageHeader
          title={"My Tasks"}
          subtitle={filters.tab === "collaborating"
            ? "Tasks where you are added as a collaborator."
            : "View, manage and complete your assigned work and requests."}
          actions={(
            <>
              <MonthFilterControl filters={monthFilter} onFilterChange={setTaskMonth} />
              <Button size="sm" className="h-8 gap-1.5 bg-blue-500 text-white hover:bg-blue-600" onClick={() => setIsAddTaskOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Create Task
              </Button>
            </>
          )}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metricCards.map(([label, value, subLabel, Icon, tone]) => (
            <MetricCard key={label} label={label} value={value} subLabel={subLabel} icon={Icon} tone={tone} />
          ))}
        </div>

        <TabComp
          tabs={taskTabs}
          value={filters.tab}
          onValueChange={(value) => setFilter("tab", value)}
          className="employee-task-tabs"
          listClassName="employee-task-tab-list"
          ariaLabel="Employee task sections"
        />

        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">

              <div className="flex flex-wrap items-center gap-2 border-b border-border p-2">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={filters.search}
                    onChange={(event) => setFilter("search", event.target.value)}
                    placeholder="Search employee name…"
                    className="h-8 rounded-md pl-9 pr-8 text-xs"
                  />
                  {filters.search ? (
                    <button
                      type="button"
                      aria-label="Clear employee name"
                      title="Clear employee name"
                      onClick={() => setFilter("search", "")}
                      className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>

                <Select
                  value={filters.taskType}
                  onValueChange={(value) => setFilter("taskType", value)}
                  open={openFilterDropdown === "taskType"}
                  onOpenChange={(isOpen) => setOpenFilterDropdown(isOpen ? "taskType" : null)}
                >
                  <SelectTrigger className="h-8 w-[150px] rounded-md text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Task Types</SelectItem>
                    <SelectItem value="Self Task">Self Task</SelectItem>
                    <SelectItem value="Work Request">Work Request</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilter("status", value)}
                  open={openFilterDropdown === "status"}
                  onOpenChange={(isOpen) => setOpenFilterDropdown(isOpen ? "status" : null)}
                >
                  <SelectTrigger className="h-8 w-[135px] rounded-md text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Rework">Rework</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.priority}
                  onValueChange={(value) => setFilter("priority", value)}
                  open={openFilterDropdown === "priority"}
                  onOpenChange={(isOpen) => setOpenFilterDropdown(isOpen ? "priority" : null)}
                >
                  <SelectTrigger className="h-8 w-[135px] rounded-md text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.relatedType}
                  onValueChange={(value) => setFilter("relatedType", value)}
                  open={openFilterDropdown === "relatedType"}
                  onOpenChange={(isOpen) => setOpenFilterDropdown(isOpen ? "relatedType" : null)}
                >
                  <SelectTrigger className="h-8 w-[150px] rounded-md text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events / Clients</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                    <SelectItem value="Client">Client</SelectItem>
                    <SelectItem value="Vendor">Vendor</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 animate-in gap-1.5 fade-in slide-in-from-left-1 text-xs text-muted-foreground duration-200 hover:text-foreground"
                    onClick={clearFilters}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* <p className="p-2 pb-0 text-center text-sm font-semibold text-foreground">
                {tabs.find(([value]) => value === filters.tab)?.[1]}
              </p> */}

              {tasksQuery.isFetching && !tasks.length ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-theme-color" />
                  Loading tasks
                </div>
              ) : (
                <DataTable
                  compact
                  zebra
                  headerAlign="center"
                  bodyAlign="center"
                  emptyText="No tasks found."
                  headers={[
                    "Task Title",
                    "Task Type",
                    "Linked To",
                    ...(filters.tab === "completed"
                      ? ["Assigned By", "Assigned To"]
                      : [filters.tab === "pending_acceptance"
                        ? "Request With"
                        : filters.tab === "requests_sent"
                        ? "Assigned To"
                        : ["collaborating", "awaiting_review"].includes(filters.tab) ? "Primary Owner" : "Assigned By"]),
                    "Due Date",
                    "Priority",
                    "Progress",
                    "Status",
                    "Action",
                  ]}
                  rows={tasks.map((task) => {
                    const dueDateNote = getDueDateNote(task.dueDate, task.status, task.completedOn, task.submittedOn);
                    const isSelfTask = task.taskType === "Self Task";
                    const isTaskCreator = String(task.createdBy) === String(currentEmployee?._id);
                    const showAssignedTo = filters.tab === "requests_sent"
                      || (filters.tab === "pending_acceptance" && isTaskCreator);

                    const assignedByCell = (
                      <div className="ml-3 flex w-fit items-center gap-2 text-left">
                        <Avatar className="h-7 w-7">
                          <AvatarImage
                            src={getAvatarUrl(task.createdByProfileImage?.smallUrl)}
                            alt={task.createdByName}
                          />
                          <AvatarFallback className="bg-blue-900 text-xs font-semibold text-white">
                            {getInitials(task.createdByName) || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium">
                          {isSelfTask ? "Self" : task.createdByName}
                        </p>
                      </div>
                    );

                    const assignedToCell = (
                      <div className="ml-3 flex w-fit items-center gap-2 text-left">
                        <Avatar className="h-7 w-7">
                          <AvatarImage
                            src={getAvatarUrl(task.assignedToProfileImage?.smallUrl)}
                            alt={task.assignedToName}
                          />
                          <AvatarFallback className="bg-blue-900 text-xs font-semibold text-white">
                            {getInitials(task.assignedToName) || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium">
                          {isSelfTask ? "Self" : task.assignedToName}
                        </p>
                      </div>
                    );

                    return [
                      <button type="button" className="ml-3 flex w-fit items-center gap-3 text-left" onClick={() => openTaskDetail(task)}>
                        <IconPill icon={ClipboardList} tone={getTaskStatusTone(task.status)} />
                        <span>
                          <span className="block font-semibold text-foreground">{getDisplayTaskTitle(task.taskTitle)}</span>
                          {filters.tab === "collaborating" ? (
                            <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {task.collaborators?.length || 0} collaborator{task.collaborators?.length === 1 ? "" : "s"}
                            </span>
                          ) : null}
                        </span>
                      </button>,
                      <span className="text-xs text-muted-foreground">{task.taskType}</span>,
                      <div>
                        <p className="font-semibold">{task.relatedTo?.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{task.relatedTo?.type}</p>
                      </div>,
                      ...(filters.tab === "completed"
                        ? [assignedByCell, assignedToCell]
                        : [["collaborating", "awaiting_review"].includes(filters.tab) || showAssignedTo ? assignedToCell : assignedByCell]),
                      <div>
                        <p className="font-medium">{formatDate(task.dueDate)}</p>
                        {dueDateNote ? <p className={`text-xs ${dueDateNote.tone}`}>{dueDateNote.text}</p> : null}
                      </div>,
                      task.createdBy === currentEmployee?._id && task.status !== "Completed" ? (
                        <Select
                          value={task.priority}
                          onValueChange={(value) => updateProgressMutation.mutate({ taskId: task.taskId || task._id, priority: value })}
                        >
                          <SelectTrigger className={`mx-auto h-6 w-fit gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium shadow-none ${PRIORITY_BADGE_CLASS[task.priority] || ""}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_BADGE_CLASS[task.priority] || ""}`}>
                          {task.priority}
                        </span>
                      ),
                      <div className="mx-auto flex w-fit items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted">
                          <div className="h-1.5 rounded-full bg-primary" style={{ width: `${task.progressPercent ?? 0}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{task.progressPercent ?? 0}%</span>
                      </div>,
                      <TaskStatusPill status={getDisplayTaskStatus(task)} />,
                      <div className="relative mx-auto w-fit">
                        <TableButton compact onClick={() => openTaskDetail(task)}>
                          {["Completed", "Cancelled", "Rejected"].includes(task.status) ? "View" : "Update"}
                        </TableButton>
                        {Math.max(unreadCountByTask.get(String(task._id)) || 0, unreadCountByTask.get(String(task.taskId)) || 0) > 0 ? (
                          <span className="pointer-events-none absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-red-500" />
                        ) : null}
                      </div>,
                    ];
                  })}
                />
              )}

              <div className="flex flex-col gap-2 border-t border-border p-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing {tasks.length ? 1 : 0} to {tasks.length} of {pagination?.total ?? tasks.length} tasks
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={(pagination?.page || 1) <= 1} onClick={() => setFilter("page", filters.page - 1)}>Previous</Button>
                  {Array.from({ length: Math.min(pagination?.totalPages || 1, 3) }).map((_, index) => (
                    <Button key={index} variant="outline" size="sm" className={(pagination?.page || 1) === index + 1 ? "border-primary text-primary" : ""} onClick={() => setFilter("page", index + 1)}>
                      {index + 1}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={(pagination?.page || 1) >= (pagination?.totalPages || 1)} onClick={() => setFilter("page", filters.page + 1)}>Next</Button>
                </div>
              </div>

              <div className="flex items-start gap-2 border-t border-border bg-blue-50 p-2 text-xs text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Company tasks, work requests, self tasks and system-linked work appear here. Keep your progress updated and submit work for review on time.</p>
              </div>
            </section>
        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="flex max-h-[94vh] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[880px]">
          <TaskDetailDialog
            task={taskDetail}
            detailLoading={detailQuery.isFetching}
            onClose={() => setIsDetailOpen(false)}
            updateProgressMutation={updateProgressMutation}
            editTaskMutation={editTaskMutation}
            reviewTaskMutation={reviewTaskMutation}
            respondMutation={respondMutation}
            withdrawMutation={withdrawMutation}
            reminderMutation={reminderMutation}
            discussionMutation={discussionMutation}
            checklistMutation={checklistMutation}
            dueDateChangeMutation={dueDateChangeMutation}
            dueDateChangeRespondMutation={dueDateChangeRespondMutation}
            escalateMutation={escalateMutation}
            deleteTaskMutation={deleteTaskMutation}
          />
        </DialogContent>
      </Dialog>

        <AddTaskDialog
          open={isAddTaskOpen}
          onOpenChange={setIsAddTaskOpen}
          task={newTask}
          setTask={setNewTask}
          createTaskMutation={createTaskMutation}
        />
    </div>
  );
}

function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {actions}
      </div>
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  actions: PropTypes.node.isRequired,
};
