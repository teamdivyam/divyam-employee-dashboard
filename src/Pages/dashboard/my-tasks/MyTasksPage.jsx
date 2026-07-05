import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import { Textarea } from "@components/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@components/components/ui/sheet";
import {
  CalendarCheck,
  Camera,
  CheckSquare,
  ClipboardList,
  Clock3,
  FileText,
  Filter,
  Flag,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import EmployeeService from "@/services/employee.service";
import {
  DataTable,
  DetailLine,
  formatDate,
  formatDateTime,
  IconPill,
  MetricCard,
  MoreButton,
  SectionCard,
  StatusBadge,
  TableButton,
} from "./components/WorkPanelUI";

const tabs = [
  ["all", "All Tasks"],
  ["Pending", "Pending"],
  ["In Progress", "In Progress"],
  ["Submitted", "Submitted"],
  ["Rework", "Rework"],
  ["Completed", "Completed"],
  ["overdue", "Overdue"],
];

const taskIcons = [FileText, Camera, ClipboardList, CalendarCheck, CheckSquare];

export default function MyTasksPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    tab: "all",
    sortBy: "dueDate",
    page: 1,
  });
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [proofFiles, setProofFiles] = useState([]);
  const [comment, setComment] = useState("");
  const [newTask, setNewTask] = useState({
    taskTitle: "",
    relatedTo: "",
    dueDate: "",
    priority: "Medium",
    description: "",
  });

  const analyticsQuery = useQuery({
    queryKey: ["my-task-analytics"],
    queryFn: async () => {
      const response = await EmployeeService.getMyTaskAnalytics();
      return response.data.analytics;
    },
  });

  const tasksQuery = useQuery({
    queryKey: ["my-tasks", filters],
    queryFn: async () => {
      const isView = ["overdue"].includes(filters.tab);
      const response = await EmployeeService.getMyTasks({
        page: filters.page,
        limit: 8,
        search: filters.search || undefined,
        status: !isView && filters.tab !== "all" ? filters.tab : undefined,
        view: filters.tab === "overdue" ? "overdue" : undefined,
        sortBy: filters.sortBy,
        sortOrder: "asc",
      });
      return response.data;
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
      const response = await EmployeeService.getMyTaskDetail({ taskId: selectedTaskId });
      return response.data.task;
    },
    enabled: Boolean(selectedTaskId) && isDetailOpen,
  });

  const taskDetail = { ...selectedTask, ...(detailQuery.data || {}) };

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, action, status }) =>
      EmployeeService.updateMyTaskStatus({
        taskId,
        action,
        status,
        note: comment || "Updated from task dashboard",
      }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Task updated");
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-task-detail", selectedTaskId] });
      queryClient.invalidateQueries({ queryKey: ["my-task-analytics"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update task"),
  });

  const proofMutation = useMutation({
    mutationFn: ({ submit }) => {
      const formData = new FormData();
      proofFiles.forEach((file) => formData.append("proof", file));
      formData.append("note", comment || "Uploaded from task dashboard");
      return EmployeeService.uploadMyTaskProof({ taskId: selectedTaskId, formData }).then((response) => {
        if (submit) {
          return EmployeeService.updateMyTaskStatus({
            taskId: selectedTaskId,
            action: "submit",
            note: comment || "Submitted for approval",
          });
        }
        return response;
      });
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Proof uploaded");
      setProofFiles([]);
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-task-detail", selectedTaskId] });
      queryClient.invalidateQueries({ queryKey: ["my-task-analytics"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to upload proof"),
  });

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: key === "page" ? value : 1 }));

  const openTaskDetail = (task) => {
    setSelectedTaskId(task._id || task.taskId);
    setIsDetailOpen(true);
  };

  const analytics = analyticsQuery.data || {};
  const metricCards = [
    ["Total Assigned", analytics.totalAssigned || 0, "All Tasks", ClipboardList, "blue"],
    ["Pending", String(analytics.pending || 0).padStart(2, "0"), "Tasks", Clock3, "green"],
    ["In Progress", String(analytics.inProgress || 0).padStart(2, "0"), "Tasks", Flag, "orange"],
    ["Submitted", String(analytics.submitted || 0).padStart(2, "0"), "For Approval", FileText, "violet"],
    ["Rework", String(analytics.rework || 0).padStart(2, "0"), "Requires Action", RotateCcw, "red"],
    ["Completed", analytics.completed || 0, "Tasks", CheckSquare, "slate"],
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-4 text-foreground md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <PageHeader
          title="My Tasks"
          breadcrumb="My Tasks"
          search={filters.search}
          onSearch={(value) => setFilter("search", value)}
          placeholder="Search tasks, events, clients..."
          onAddTask={() => setIsAddTaskOpen(true)}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metricCards.map(([label, value, subLabel, Icon, tone]) => (
            <MetricCard key={label} label={label} value={value} subLabel={subLabel} icon={Icon} tone={tone} />
          ))}
        </div>

        <div className="space-y-5">
          <div className="space-y-5">
            <section className="rounded-lg border border-border bg-card shadow-sm">
              <div className="flex flex-col gap-4 border-b border-border p-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                  {tabs.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter("tab", value)}
                      className={`h-10 rounded-md border px-4 text-sm font-medium transition ${
                        filters.tab === value
                          ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300"
                          : "border-border bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="h-10 gap-2 rounded-md">
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                  <Select value={filters.sortBy} onValueChange={(value) => setFilter("sortBy", value)}>
                    <SelectTrigger className="h-10 w-[150px] rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dueDate">Sort: Due Date</SelectItem>
                      <SelectItem value="priority">Sort: Priority</SelectItem>
                      <SelectItem value="status">Sort: Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {tasksQuery.isFetching && !tasks.length ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-theme-color" />
                  Loading tasks
                </div>
              ) : (
                <DataTable
                  emptyText="No tasks found."
                  headers={["#", "Task Title", "Related To", "Assigned By", "Due Date", "Priority", "Status", "Proof", "Action", ""]}
                  rows={tasks.map((task, index) => {
                    const Icon = taskIcons[index % taskIcons.length];
                    return [
                      (filters.page - 1) * 8 + index + 1,
                      <button type="button" className="flex items-center gap-3 text-left" onClick={() => openTaskDetail(task)}>
                        <IconPill icon={Icon} tone={["blue", "violet", "orange", "green"][index % 4]} />
                        <div>
                          <p className="font-semibold text-foreground">{task.taskTitle}</p>
                          <p className="text-xs text-muted-foreground">{task.category}</p>
                        </div>
                      </button>,
                      <div>
                        <p className="font-semibold">{task.relatedTo?.name}</p>
                        <p className="text-xs text-muted-foreground">{task.relatedTo?.type}</p>
                      </div>,
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-900 text-xs font-semibold text-white">
                          {task.assignedBy?.name?.charAt(0) || "A"}
                        </span>
                        <div>
                          <p className="font-medium">{task.assignedBy?.name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</p>
                        </div>
                      </div>,
                      formatDateTime(task.dueDate),
                      <StatusBadge>{task.priority}</StatusBadge>,
                      <StatusBadge>{task.status}</StatusBadge>,
                      task.proofRequired ? "Yes" : "No",
                      <TableButton onClick={() => openTaskDetail(task)}>
                        {task.availableActions?.startTask ? "Start Task" : task.availableActions?.continueTask ? "Continue" : "View"}
                      </TableButton>,
                      <MoreButton />,
                    ];
                  })}
                />
              )}

              <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {tasks.length ? 1 : 0} to {tasks.length} of {pagination?.totalTasks || tasks.length} tasks
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
            </section>

            <div className="grid gap-4 lg:grid-cols-3">
              <TaskAlertCard title={`Due Today (${analytics.dueToday || 0})`} tone="red" tasks={tasks.slice(0, 2)} />
              <TaskAlertCard title={`Overdue Tasks (${analytics.overdue || 0})`} tone="orange" tasks={tasks.filter((task) => task.status !== "Completed").slice(0, 1)} />
              <TaskAlertCard title={`Rework Required (${analytics.rework || 0})`} tone="violet" tasks={tasks.filter((task) => task.status === "Rework").slice(0, 2)} />
            </div>
          </div>
        </div>
      </div>

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <TaskDetailPanel
            task={taskDetail}
            detailLoading={detailQuery.isFetching}
            proofFiles={proofFiles}
            setProofFiles={setProofFiles}
            comment={comment}
            setComment={setComment}
            proofMutation={proofMutation}
            updateTaskMutation={updateTaskMutation}
          />
        </SheetContent>
      </Sheet>

      <AddTaskSheet
        open={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
        task={newTask}
        setTask={setNewTask}
      />
    </div>
  );
}

function PageHeader({ title, breadcrumb, search, onSearch, placeholder, onAddTask }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/dashboard" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span>{breadcrumb}</span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
        <div className="relative w-full lg:w-[430px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={placeholder} className="h-11 rounded-lg pl-10" />
        </div>
        <Button className="h-11 gap-2 rounded-md bg-slate-950 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground" onClick={onAddTask}>
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>
    </div>
  );
}

function TaskDetailPanel({ task, detailLoading, proofFiles, setProofFiles, comment, setComment, proofMutation, updateTaskMutation }) {
  if (!task) {
    return (
      <aside className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
        Select a task to view details.
      </aside>
    );
  }

  return (
    <div>
      <SheetHeader className="border-b border-border pb-4">
        <SheetTitle>Task Details</SheetTitle>
        <SheetDescription>Review task information and upload proof when required.</SheetDescription>
      </SheetHeader>
      <div className="space-y-5 p-4">
        {detailLoading ? <Loader2 className="h-5 w-5 animate-spin text-theme-color" /> : null}
        <div className="flex items-start gap-4">
          <IconPill icon={FileText} tone="blue" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{task.taskTitle}</h3>
                <p className="text-sm text-muted-foreground">{task.category}</p>
              </div>
              <StatusBadge>{task.status}</StatusBadge>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-b border-border pb-4">
          <DetailLine icon={UserRound} label="Related To" value={task.relatedTo?.name} />
          <DetailLine icon={UserRound} label="Assigned By" value={task.assignedBy?.name} />
          <DetailLine icon={CalendarCheck} label="Due Date" value={formatDateTime(task.dueDate)} />
          <DetailLine icon={Flag} label="Priority" value={<StatusBadge>{task.priority}</StatusBadge>} />
          <DetailLine icon={Clock3} label="Status" value={<StatusBadge>{task.status}</StatusBadge>} />
          <DetailLine icon={FileText} label="Proof Required" value={task.proofRequired ? "Yes" : "No"} />
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Task Description</h3>
          <p className="text-sm leading-6 text-foreground">{task.description || "No description available."}</p>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Attachments from Admin</h3>
          {(task.attachments || []).length ? (task.attachments || []).map((file, index) => (
            <div key={index} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
              <FileText className="h-5 w-5 text-red-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{file.fileName || `Attachment ${index + 1}`}</p>
                <p className="text-xs text-muted-foreground">{file.fileSize || "File"}</p>
              </div>
            </div>
          )) : (
            <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">No attachments available.</div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Your Submission</h3>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-blue-200 bg-background p-6 text-center text-sm text-muted-foreground dark:border-blue-400/30">
            <UploadCloud className="mb-2 h-8 w-8 text-primary" />
            <span className="font-semibold text-foreground">Drag & drop files here or click to browse</span>
            <span className="mt-1 text-xs">Supported: JPG, PNG, PDF, Doc</span>
            <Input type="file" multiple className="hidden" onChange={(event) => setProofFiles(Array.from(event.target.files || []))} />
          </label>
          {proofFiles.map((file) => (
            <div key={file.name} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
              <FileText className="h-5 w-5 text-red-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{Math.round(file.size / 1024)} KB</p>
              </div>
              <button onClick={() => setProofFiles((files) => files.filter((item) => item.name !== file.name))}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Comment (Optional)</label>
          <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a comment or note for admin..." className="min-h-20 resize-none" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline" disabled={!proofFiles.length || proofMutation.isPending} onClick={() => proofMutation.mutate({ submit: false })}>Save Draft</Button>
          <Button variant="outline" disabled={updateTaskMutation.isPending} onClick={() => updateTaskMutation.mutate({ taskId: task._id || task.taskId, action: "complete" })}>Mark as Done</Button>
          <Button className="bg-blue-600 text-white hover:bg-blue-700" disabled={!proofFiles.length || proofMutation.isPending} onClick={() => proofMutation.mutate({ submit: true })}>
            {proofMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddTaskSheet({ open, onOpenChange, task, setTask }) {
  const setField = (key, value) => setTask((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    toast.info("Create task API is not available in the provided task APIs yet.");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Add Task</SheetTitle>
          <SheetDescription>Create task form is ready. Backend create-task API is needed to save it.</SheetDescription>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <FormInput label="Task Title" value={task.taskTitle} onChange={(value) => setField("taskTitle", value)} />
          <FormInput label="Related To" value={task.relatedTo} onChange={(value) => setField("relatedTo", value)} />
          <FormInput label="Due Date" type="datetime-local" value={task.dueDate} onChange={(value) => setField("dueDate", value)} />
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Priority</label>
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
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Description</label>
            <Textarea value={task.description} onChange={(event) => setField("description", event.target.value)} className="min-h-28 resize-none" />
          </div>
          <Button type="submit" className="h-11 w-full gap-2 bg-theme-color">
            <Save className="h-4 w-4" />
            Save Task
          </Button>
        </form>
      </SheetContent>
    </Sheet>
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

function TaskAlertCard({ title, tone, tasks }) {
  const color = {
    red: "border-red-200 bg-red-50/70 dark:border-red-400/30 dark:bg-red-400/10",
    orange: "border-orange-200 bg-orange-50/70 dark:border-orange-400/30 dark:bg-orange-400/10",
    violet: "border-violet-200 bg-violet-50/70 dark:border-violet-400/30 dark:bg-violet-400/10",
  }[tone];

  return (
    <SectionCard title={title} icon={CalendarCheck} className={color}>
      <div className="space-y-3">
        {tasks.length ? tasks.map((task) => (
          <div key={task._id || task.taskId} className="flex items-center justify-between gap-3 rounded-md bg-card/70 p-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{task.taskTitle}</p>
              <p className="text-xs text-muted-foreground">{task.relatedTo?.name}</p>
            </div>
            <StatusBadge>{task.priority || task.status}</StatusBadge>
          </div>
        )) : <p className="text-sm text-muted-foreground">No items here.</p>}
        <button type="button" className="pt-2 text-sm font-semibold text-theme-color">View All</button>
      </div>
    </SectionCard>
  );
}
