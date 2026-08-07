import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import PageLocked from "@components/components/PageLocked";
import { Textarea } from "@components/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/components/ui/dialog";
import {
  CalendarCheck,
  Camera,
  CheckSquare,
  ClipboardList,
  Clock3,
  AlertTriangle,
  Eye,
  FileText,
  Flag,
  Info,
  Loader2,
  Lock,
  MessageSquare,
  Paperclip,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  UserRound,
} from "lucide-react";
import EmployeeV2Service from "@/services/employee-v2.service";
import { getSocket } from "@/services/socket";
import { Label } from "@components/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@components/components/ui/radio-group";
import { Switch } from "@components/components/ui/switch";
import useCurrentEmployee from "@/hooks/useCurrentEmployee";
import { Avatar, AvatarFallback, AvatarImage } from "@components/components/ui/avatar";
import {
  DataTable,
  DetailLine,
  formatDate,
  formatDateTime,
  IconPill,
  MetricCard,
  StatusBadge,
  TableButton,
} from "./components/WorkPanelUI";

const tabs = [
  ["my_work", "My Work", CalendarCheck],
  ["requests_sent", "Requests Sent", Send],
  ["pending_acceptance", "Pending Acceptance", FileText],
  ["awaiting_review", "Awaiting Review", Eye],
  ["completed", "Completed", CheckSquare],
];

const taskIcons = [FileText, Camera, ClipboardList, CalendarCheck, CheckSquare];

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const emptyNewTask = {
    taskType: "Self Task",
    taskTitle: "",
    relatedTo: "",
    dueDate: "",
    dueTime: "",
    priority: "Medium",
    description: "",
    visibility: "Private",
    requestTo: "",
    acceptanceRequired: true,
  };
  const [newTask, setNewTask] = useState(emptyNewTask);

  const analyticsQuery = useQuery({
    queryKey: ["my-task-analytics"],
    queryFn: async () => {
      const response = await EmployeeV2Service.getTaskAnalyticsV2();
      return response.data?.data?.analytics;
    },
  });

  const tasksQuery = useQuery({
    queryKey: ["my-tasks", filters],
    queryFn: async () => {
      const response = await EmployeeV2Service.getMyTasksV2({
        scope: filters.tab,
        page: filters.page,
        limit: 8,
        search: filters.search || undefined,
        taskType: filters.taskType !== "all" ? filters.taskType : undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        priority: filters.priority !== "all" ? filters.priority : undefined,
        relatedType: filters.relatedType !== "all" ? filters.relatedType : undefined,
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
    mutationFn: (payload) => EmployeeV2Service.createTask(payload),
    onSuccess: (response) => {
      const created = response.data?.data?.task;
      toast.success(`Task created${created?.taskId ? ` (${created.taskId})` : ""}`);
      setIsAddTaskOpen(false);
      setNewTask(emptyNewTask);
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to create task"),
  });

  const invalidateTaskQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["my-task-detail", selectedTaskId] });
    queryClient.invalidateQueries({ queryKey: ["my-task-analytics"] });
  };

  const updateProgressMutation = useMutation({
    mutationFn: (payload) => EmployeeV2Service.updateTaskProgress(payload),
    onSuccess: () => {
      toast.success("Task updated");
      invalidateTaskQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update task"),
  });

  const respondMutation = useMutation({
    mutationFn: (payload) => EmployeeV2Service.respondToWorkRequest(payload),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Response recorded");
      invalidateTaskQueries();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to respond to request"),
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

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: key === "page" ? value : 1 }));

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
  const metricCards = [
    ["Due Today", analytics.dueToday || 0, "Tasks", CalendarCheck, "blue"],
    ["In Progress", analytics.inProgress || 0, "Tasks", RotateCcw, "orange"],
    ["Overdue", analytics.overdue || 0, "Tasks", AlertTriangle, "red"],
    ["Pending Acceptance", analytics.pendingAcceptance || 0, "Tasks", ClipboardList, "violet"],
    ["Awaiting Review", analytics.awaitingReview || 0, "Tasks", Eye, "blue"],
    ["Completed This Month", analytics.completedThisMonth || 0, "Tasks", CheckSquare, "green"],
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="min-h-[calc(100vh-4rem)] bg-background p-3 text-foreground md:p-4">
        <div className="mx-auto max-w-[1500px] space-y-3">
        <PageHeader
          title="My Tasks"
          subtitle="View, manage and complete your assigned work and requests."
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metricCards.map(([label, value, subLabel, Icon, tone]) => (
            <MetricCard key={label} label={label} value={value} subLabel={subLabel} icon={Icon} tone={tone} />
          ))}
        </div>

        <section className="rounded-lg border border-border bg-card shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
                <div className="flex flex-wrap gap-6">
                  {tabs.map(([value, label, Icon]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter("tab", value)}
                      className={`flex items-center gap-2 border-b-2 pb-1 text-sm font-medium transition ${
                        filters.tab === value
                          ? "border-orange-500 text-orange-600 dark:text-orange-400"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
                <Button className="h-9 gap-2 rounded-md bg-blue-500 text-white hover:bg-blue-600" onClick={() => setIsAddTaskOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create Task
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={filters.search}
                    onChange={(event) => setFilter("search", event.target.value)}
                    placeholder="Search task..."
                    className="h-10 rounded-md pl-10"
                  />
                </div>

                <Select value={filters.taskType} onValueChange={(value) => setFilter("taskType", value)}>
                  <SelectTrigger className="h-10 w-[170px] rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Task Types</SelectItem>
                    <SelectItem value="Self Task">Self Task</SelectItem>
                    <SelectItem value="Work Request">Work Request</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(value) => setFilter("status", value)}>
                  <SelectTrigger className="h-10 w-[150px] rounded-md">
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
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.priority} onValueChange={(value) => setFilter("priority", value)}>
                  <SelectTrigger className="h-10 w-[150px] rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.relatedType} onValueChange={(value) => setFilter("relatedType", value)}>
                  <SelectTrigger className="h-10 w-[170px] rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events / Clients</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                    <SelectItem value="Client">Client</SelectItem>
                    <SelectItem value="Vendor">Vendor</SelectItem>
                    <SelectItem value="Internal">Internal</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 gap-2 text-muted-foreground hover:text-foreground"
                    onClick={clearFilters}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Clear Filters
                  </Button>
                )}
              </div>

              <p className="p-3 pb-0 font-semibold text-foreground">
                {tabs.find(([value]) => value === filters.tab)?.[1]}
              </p>

              {tasksQuery.isFetching && !tasks.length ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-theme-color" />
                  Loading tasks
                </div>
              ) : (
                <DataTable
                  emptyText="No tasks found."
                  headers={["Task Name", "Task Type", "Linked To", "Assigned By", "Due Date", "Priority", "Progress", "Status", "Action"]}
                  rows={tasks.map((task, index) => {
                    const Icon = taskIcons[index % taskIcons.length];
                    const dueDateNote = getDueDateNote(task.dueDate, task.status, task.completedOn);
                    return [
                      <button type="button" className="flex items-center gap-3 text-left" onClick={() => openTaskDetail(task)}>
                        <IconPill icon={Icon} tone={["blue", "violet", "orange", "green"][index % 4]} />
                        <p className="font-semibold text-foreground">{task.taskTitle}</p>
                      </button>,
                      <span className="text-sm text-muted-foreground">{task.taskType}</span>,
                      <div>
                        <p className="font-semibold">{task.relatedTo?.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{task.relatedTo?.type}</p>
                      </div>,
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          {task.createdBy === currentEmployee?._id ? (
                            <AvatarImage src={getAvatarUrl(currentEmployee?.profileImage?.smallUrl)} alt={task.createdByName} />
                          ) : null}
                          <AvatarFallback className="bg-blue-900 text-xs font-semibold text-white">
                            {getInitials(task.createdByName) || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium">{task.taskType === "Self Task" ? "Self" : task.createdByName}</p>
                      </div>,
                      <div>
                        <p className="font-medium">{formatDate(task.dueDate)}</p>
                        {dueDateNote ? <p className={`text-xs ${dueDateNote.tone}`}>{dueDateNote.text}</p> : null}
                      </div>,
                      <StatusBadge>{task.priority}</StatusBadge>,
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted">
                          <div className="h-1.5 rounded-full bg-primary" style={{ width: `${task.progressPercent ?? 0}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{task.progressPercent ?? 0}%</span>
                      </div>,
                      <StatusBadge>{task.status}</StatusBadge>,
                      <TableButton onClick={() => openTaskDetail(task)}>
                        {["Completed", "Cancelled"].includes(task.status) ? "View" : "Update"}
                      </TableButton>,
                    ];
                  })}
                />
              )}

              <div className="flex flex-col gap-2 border-t border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
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

              <div className="flex items-start gap-2 border-t border-border bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Company tasks, work requests, self tasks and system-linked work appear here. Keep your progress updated and submit work for review on time.</p>
              </div>
            </section>
        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] gap-0 overflow-y-auto p-0 sm:max-w-[760px]">
          <TaskDetailDialog
            task={taskDetail}
            detailLoading={detailQuery.isFetching}
            onClose={() => setIsDetailOpen(false)}
            updateProgressMutation={updateProgressMutation}
            respondMutation={respondMutation}
            withdrawMutation={withdrawMutation}
            reminderMutation={reminderMutation}
            discussionMutation={discussionMutation}
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
      {/* <PageLocked className="z-[100]" /> */}
    </div>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

const EDITABLE_TASK_STATUSES = ["Pending", "In Progress", "Submitted", "Rework", "Completed"];

function TaskDetailDialog({
  task,
  detailLoading,
  onClose,
  updateProgressMutation,
  respondMutation,
  withdrawMutation,
  reminderMutation,
  discussionMutation,
}) {
  const [status, setStatus] = useState(task?.status || "Pending");
  const [progressPercent, setProgressPercent] = useState(task?.progressPercent ?? 0);
  const [note, setNote] = useState("");
  const [proofFiles, setProofFiles] = useState([]);
  const [discussionMessage, setDiscussionMessage] = useState("");
  const [discussionFiles, setDiscussionFiles] = useState([]);
  const discussionEndRef = useRef(null);
  const { data: currentEmployee } = useCurrentEmployee();
  const queryClient = useQueryClient();
  const isRecipient = task && currentEmployee && task.assignedTo === currentEmployee._id;
  const isRequester = task && currentEmployee && task.createdBy === currentEmployee._id;
  const isPendingAcceptance = task?.taskType === "Work Request" && task?.acceptanceStatus === "Pending";

  useEffect(() => {
    setStatus(task?.status || "Pending");
    setProgressPercent(task?.progressPercent ?? 0);
    setNote("");
    setProofFiles([]);
    setDiscussionMessage("");
    setDiscussionFiles([]);
  }, [task?._id]);

  useEffect(() => {
    if (!task?._id) return undefined;

    const socket = getSocket();
    const taskId = task._id;
    socket.emit("task:join", { taskId });

    const handleMessage = (payload) => {
      if (payload.taskId === taskId) {
        queryClient.invalidateQueries({ queryKey: ["my-task-detail"] });
      }
    };
    socket.on("task:message", handleMessage);

    return () => {
      socket.emit("task:leave", { taskId });
      socket.off("task:message", handleMessage);
    };
  }, [task?._id, queryClient]);

  useEffect(() => {
    discussionEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [task?.discussion?.length]);

  if (!task) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Select a task to view details.
      </div>
    );
  }

  const notAvailable = () => toast.info("This action isn't available yet.");

  const handleSendDiscussion = () => {
    if (!discussionMessage.trim() && !discussionFiles.length) {
      toast.error("Write a message or attach a file");
      return;
    }

    discussionMutation.mutate(
      { taskId: task.taskId || task._id, message: discussionMessage.trim(), attachments: discussionFiles },
      {
        onSuccess: () => {
          setDiscussionMessage("");
          setDiscussionFiles([]);
        },
      }
    );
  };

  const handleSaveUpdate = () => {
    const statusChanged = status !== task.status;
    const progressChanged = progressPercent !== (task.progressPercent ?? 0);
    const noteEntered = note.trim().length > 0;

    if (!statusChanged && !progressChanged && !noteEntered && !proofFiles.length) {
      toast.info("No changes to save");
      return;
    }

    updateProgressMutation.mutate(
      {
        taskId: task.taskId || task._id,
        status: statusChanged ? status : undefined,
        progressPercent: progressChanged ? progressPercent : undefined,
        note: note.trim() || undefined,
        attachments: proofFiles,
      },
      {
        onSuccess: () => {
          setNote("");
          setProofFiles([]);
          onClose();
        },
      }
    );
  };

  return (
    <div>
      <div className="border-b border-border p-4">
        <DialogHeader>
          <DialogTitle>Task Detail & Update</DialogTitle>
          <DialogDescription>Update progress, share work details or submit your work for review.</DialogDescription>
        </DialogHeader>

        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-md border border-border bg-muted/40 p-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
              {isRequester ? (
                <AvatarImage src={getAvatarUrl(currentEmployee?.profileImage?.smallUrl)} alt={task.createdByName} />
              ) : null}
              <AvatarFallback className="bg-blue-900 text-xs font-semibold text-white">
                {getInitials(task.createdByName) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground">Assigned By</p>
              <p className="text-sm font-semibold text-foreground">{task.createdByName || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Task Type</p>
              <p className="text-sm font-semibold text-foreground">{task.taskType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
              <CalendarCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Due Date</p>
              <p className="text-sm font-semibold text-foreground">{formatDateTime(task.dueDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-400/10 dark:text-red-300">
              <Flag className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Priority</p>
              <StatusBadge>{task.priority}</StatusBadge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
              <Clock3 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Current Status</p>
              <StatusBadge>{status}</StatusBadge>
            </div>
          </div>
        </div>
        {detailLoading ? <p className="mt-2 text-xs text-muted-foreground">Refreshing…</p> : null}
      </div>

      <div className="space-y-3 p-4">
        <div className="space-y-2">
          <SectionHeader index={1} tone="blue" title="Task Information" />
          <div className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2">
            <DetailLine icon={FileText} label="Task Name" value={task.taskTitle} />
            <DetailLine icon={UserRound} label="Linked To" value={task.relatedTo?.name || "—"} />
            <DetailLine icon={CalendarCheck} label="Assigned On" value={formatDate(task.createdAt)} />
            <DetailLine icon={UserRound} label="Assigned To" value={task.assignedToName} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Expected Outcome</p>
            <p className="text-sm leading-6 text-foreground">{task.description || "No description available."}</p>
          </div>
        </div>

        {isPendingAcceptance ? (
          <div className="space-y-2">
            <SectionHeader index={2} tone="green" title="Acceptance Status" />
            <div className="space-y-3 rounded-md border border-orange-200 bg-orange-50/60 p-3 dark:border-orange-400/30 dark:bg-orange-400/10">
              {isRecipient ? (
                <>
                  <p className="text-sm text-foreground">
                    {task.createdByName} has sent you this work request. Accept it to begin work, or reject it.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={respondMutation.isPending}
                      onClick={() => respondMutation.mutate({ taskId: task.taskId || task._id, action: "accept" })}
                    >
                      Accept Request
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 text-red-600"
                      disabled={respondMutation.isPending}
                      onClick={() => respondMutation.mutate({ taskId: task.taskId || task._id, action: "reject" })}
                    >
                      Reject
                    </Button>
                  </div>
                </>
              ) : isRequester ? (
                <>
                  <p className="text-sm text-foreground">
                    Waiting for {task.assignedToName} to accept this request.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {task.lastReminderAt ? `Last reminder sent ${formatDateTime(task.lastReminderAt)}` : "No reminder sent yet"} · Reminder can be sent once every 24 hours.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      disabled={reminderMutation.isPending}
                      onClick={() => reminderMutation.mutate(task.taskId || task._id)}
                    >
                      <Send className="h-4 w-4" />
                      Send Reminder
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 text-red-600"
                      disabled={withdrawMutation.isPending}
                      onClick={() => withdrawMutation.mutate(task.taskId || task._id)}
                    >
                      Withdraw Request
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <SectionHeader index={2} tone="green" title="Progress Update" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-foreground">Current Progress</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setProgressPercent((value) => Math.max(0, value - 10))}
                  >
                    −
                  </Button>
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setProgressPercent((value) => Math.min(100, value + 10))}
                  >
                    +
                  </Button>
                  <span className="w-10 text-right text-sm font-medium text-foreground">{progressPercent}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-foreground">Task Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EDITABLE_TASK_STATUSES.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={notAvailable}>
              <CalendarCheck className="h-4 w-4" />
              Request Due Date Change
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <SectionHeader index={3} tone="violet" title="Work Update & Proof" />
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-foreground">Work Update Note</Label>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Share a quick update on this task..."
              className="min-h-16 resize-none"
            />
          </div>
          <div className="space-y-2">
            {(task.attachments || []).length ? task.attachments.map((file, index) => (
              <div key={file._id || index} className="flex items-center gap-3 rounded-lg border border-border bg-background p-2.5">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <p className="truncate text-sm font-medium text-foreground">{file.fileName || `Attachment ${index + 1}`}</p>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No attachments yet.</p>
            )}
            {proofFiles.length ? (
              <div className="flex flex-wrap gap-1">
                {proofFiles.map((file, index) => (
                  <span key={index} className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                    {file.name}
                    <button type="button" onClick={() => setProofFiles((files) => files.filter((_, i) => i !== index))}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
            <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
              <label className="cursor-pointer">
                <Paperclip className="h-4 w-4" />
                Add More Files
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => setProofFiles((files) => [...files, ...Array.from(event.target.files || [])])}
                />
              </label>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <SectionHeader index={4} tone="blue" title="Activity & Discussion" />
          <div className="grid items-stretch gap-3 sm:grid-cols-2">
            <div className="flex h-80 flex-col overflow-hidden rounded-md border border-border">
              <p className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
                Activity Timeline
              </p>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {(task.activity || []).length ? [...task.activity].reverse().map((entry) => (
                  <div key={entry._id} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium text-foreground">{entry.action}{entry.note ? ` — ${entry.note}` : ""}</p>
                      <p className="text-xs text-muted-foreground">{entry.performedByName} • {formatDateTime(entry.createdAt)}</p>
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No activity yet.</p>}
              </div>
            </div>

            <div className="flex h-80 flex-col overflow-hidden rounded-md border border-border">
              <p className="flex items-center gap-1 border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" /> Discussion
              </p>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-background px-3 py-3">
                {(task.discussion || []).length ? task.discussion.map((message) => {
                  const isOwn = currentEmployee && message.sender === currentEmployee._id;
                  return (
                    <div key={message._id} className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                      {!isOwn && (
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarFallback className="bg-muted text-[10px] font-semibold text-muted-foreground">
                            {getInitials(message.senderName) || "?"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`flex max-w-[75%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
                        {!isOwn && (
                          <p className="mb-0.5 px-1 text-[11px] font-semibold text-muted-foreground">
                            {message.senderName}
                          </p>
                        )}
                        <div
                          className={`rounded-2xl px-3 py-1.5 text-sm shadow-sm ${
                            isOwn
                              ? "rounded-br-sm bg-primary text-primary-foreground"
                              : "rounded-bl-sm bg-muted text-foreground"
                          }`}
                        >
                          {message.message && <p className="whitespace-pre-wrap break-words">{message.message}</p>}
                          {(message.attachments || []).map((file, index) => (
                            <a
                              key={file._id || index}
                              href={file.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`mt-1 flex items-center gap-1 text-xs underline-offset-2 hover:underline ${
                                isOwn ? "text-primary-foreground/90" : "text-blue-600 dark:text-blue-400"
                              }`}
                            >
                              <Paperclip className="h-3 w-3 shrink-0" />
                              <span className="truncate">{file.fileName || "Attachment"}</span>
                            </a>
                          ))}
                        </div>
                        <p className="mt-0.5 px-1 text-[10px] text-muted-foreground/70">
                          {formatDateTime(message.sentAt)}
                        </p>
                      </div>
                    </div>
                  );
                }) : <p className="py-6 text-center text-sm text-muted-foreground">No messages yet.</p>}
                <div ref={discussionEndRef} />
              </div>

              <div className="space-y-2 border-t border-border bg-muted/20 p-2">
                {discussionFiles.length ? (
                  <div className="flex flex-wrap gap-1">
                    {discussionFiles.map((file, index) => (
                      <span key={index} className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                        {file.name}
                        <button type="button" onClick={() => setDiscussionFiles((files) => files.filter((_, i) => i !== index))}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="flex items-center gap-1 rounded-full border border-border bg-background pl-1 pr-1.5">
                  <label className="cursor-pointer rounded-full p-2 text-muted-foreground hover:bg-muted">
                    <Paperclip className="h-4 w-4" />
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(event) => setDiscussionFiles((files) => [...files, ...Array.from(event.target.files || [])])}
                    />
                  </label>
                  <Input
                    value={discussionMessage}
                    onChange={(event) => setDiscussionMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSendDiscussion();
                      }
                    }}
                    placeholder="Write an update or ask a question..."
                    disabled={discussionMutation.isPending}
                    className="h-8 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full"
                    onClick={handleSendDiscussion}
                    disabled={discussionMutation.isPending}
                  >
                    {discussionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="border-t border-border p-4">
        <Button type="button" variant="outline" className="mr-auto gap-2 text-red-600" onClick={notAvailable}>
          <AlertTriangle className="h-4 w-4" />
          Escalate to Admin
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" className="gap-2 bg-theme-color" onClick={handleSaveUpdate} disabled={updateProgressMutation.isPending}>
          {updateProgressMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Update
        </Button>
      </DialogFooter>
    </div>
  );
}

function SectionHeader({ index, tone, title }) {
  const toneClasses = {
    blue: "bg-blue-600 text-white",
    green: "bg-emerald-600 text-white",
    violet: "bg-violet-600 text-white",
  }[tone];
  const barClasses = {
    blue: "bg-blue-50 dark:bg-blue-400/10",
    green: "bg-emerald-50 dark:bg-emerald-400/10",
    violet: "bg-violet-50 dark:bg-violet-400/10",
  }[tone];

  return (
    <div className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 ${barClasses}`}>
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${toneClasses}`}>
        {index}
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
    </div>
  );
}

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
};

const getAvatarUrl = (avatar) => {
  if (!avatar) return "";
  if (/^https?:\/\//.test(avatar)) return avatar;
  return `https://assets.divyam.com/Uploads/employee/${avatar}`;
};

const getDueDateNote = (dueDate, status, completedOn) => {
  if (status === "Completed") {
    return completedOn ? { text: `Completed on ${formatDate(completedOn)}`, tone: "text-emerald-600" } : null;
  }
  if (status === "Cancelled") return null;

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

function AddTaskDialog({ open, onOpenChange, task, setTask, createTaskMutation }) {
  const setField = (key, value) => setTask((current) => ({ ...current, [key]: value }));
  const isWorkRequest = task.taskType === "Work Request";
  const { data: currentEmployee } = useCurrentEmployee();

  const employeesQuery = useQuery({
    queryKey: ["task-assignable-employees"],
    queryFn: async () => {
      const response = await EmployeeV2Service.getTaskAssignmentEmployees({ limit: 50 });
      return response.data?.data?.employees || [];
    },
    enabled: open && isWorkRequest,
  });

  const requestedEmployee = employeesQuery.data?.find((employee) => employee._id === task.requestTo);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!task.taskTitle.trim() || !task.dueDate) {
      toast.error("Task title and due date are required");
      return;
    }

    if (isWorkRequest && !task.requestTo) {
      toast.error("Select an employee to send the request to");
      return;
    }

    createTaskMutation.mutate({
      taskType: task.taskType,
      taskTitle: task.taskTitle.trim(),
      description: task.description?.trim() || undefined,
      relatedTo: task.relatedTo.trim() ? { type: "Internal", name: task.relatedTo.trim() } : undefined,
      dueDate: task.dueDate,
      dueTime: task.dueTime || undefined,
      priority: task.priority,
      visibility: isWorkRequest ? undefined : task.visibility,
      requestTo: isWorkRequest ? task.requestTo : undefined,
      acceptanceRequired: isWorkRequest ? task.acceptanceRequired : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] gap-0 overflow-y-auto p-0 sm:max-w-[600px]">
        <div className="border-b border-border p-4">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Create your own task or request work from another employee.</DialogDescription>
          </DialogHeader>

          <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-md border border-border bg-muted/40 p-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={getAvatarUrl(currentEmployee?.profileImage?.smallUrl)} alt={currentEmployee?.name} />
                <AvatarFallback className="bg-blue-900 text-sm font-semibold text-white">
                  {getInitials(currentEmployee?.name) || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p className="text-base font-semibold text-foreground">{currentEmployee?.name || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
                <CalendarCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Created On</p>
                <p className="text-base font-semibold text-foreground">{formatDate(new Date())}</p>
              </div>
            </div>
            {isWorkRequest ? (
              <>
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getAvatarUrl(requestedEmployee?.profileImage?.smallUrl)} alt={requestedEmployee?.name} />
                    <AvatarFallback className="bg-orange-500 text-sm font-semibold text-white">
                      {requestedEmployee?.name ? getInitials(requestedEmployee.name) : <UserRound className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-muted-foreground">Request To</p>
                    <p className="text-base font-semibold text-foreground">{requestedEmployee?.name || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-400/10 dark:text-red-300">
                    <Flag className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <p className="text-base font-semibold text-foreground">{task.priority}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                  <Lock className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Visibility</p>
                  <p className="text-base font-semibold text-foreground">{task.visibility}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <form className="space-y-3 p-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <SectionHeader index={1} tone="blue" title="Task Type" />
            <RadioGroup
              value={task.taskType}
              onValueChange={(value) => setField("taskType", value)}
              className="grid grid-cols-2 gap-2"
            >
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm ${
                  task.taskType === "Self Task" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <RadioGroupItem value="Self Task" />
                Self Task
              </label>
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm ${
                  task.taskType === "Work Request" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <RadioGroupItem value="Work Request" />
                Work Request
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <SectionHeader index={2} tone="green" title="Assignment Details" />

            {isWorkRequest ? (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-foreground">Request To</Label>
                  <Select value={task.requestTo} onValueChange={(value) => setField("requestTo", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={employeesQuery.isFetching ? "Loading employees..." : "Select employee"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(employeesQuery.data || []).map((employee) => (
                        <SelectItem key={employee._id} value={employee._id}>
                          {employee.name}
                          {employee.designation ? ` — ${employee.designation}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-md border border-border p-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Acceptance Required</p>
                    <p className="text-xs text-muted-foreground">Recipient must accept before work begins.</p>
                  </div>
                  <Switch
                    checked={task.acceptanceRequired}
                    onCheckedChange={(value) => setField("acceptanceRequired", value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-foreground">Visibility</Label>
                <Select value={task.visibility} onValueChange={(value) => setField("visibility", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Private">Private</SelectItem>
                    <SelectItem value="Manager Visible">Manager Visible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <SectionHeader index={3} tone="violet" title="Task Details" />

            <div className="grid gap-3 sm:grid-cols-2">
              <FormInput label="Task Name" value={task.taskTitle} onChange={(value) => setField("taskTitle", value)} />
              <FormInput label="Linked To" value={task.relatedTo} onChange={(value) => setField("relatedTo", value)} />
              <FormInput label="Due Date" type="date" value={task.dueDate} onChange={(value) => setField("dueDate", value)} />
              <FormInput label="Due Time (Optional)" type="time" value={task.dueTime} onChange={(value) => setField("dueTime", value)} />

              <div className="space-y-1">
                <Label className="text-sm font-semibold text-foreground">Priority</Label>
                <Select value={task.priority} onValueChange={(value) => setField("priority", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-semibold text-foreground">Description / Expected Outcome</Label>
                <Textarea value={task.description} onChange={(event) => setField("description", event.target.value)} className="h-10 min-h-10 resize-none" />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="gap-2 bg-theme-color" disabled={createTaskMutation.isPending}>
              {createTaskMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isWorkRequest ? "Send Work Request" : "Create Self Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormInput({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <Input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

