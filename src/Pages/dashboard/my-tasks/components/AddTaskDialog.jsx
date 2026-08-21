import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  CalendarCheck,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  Loader2,
  Paperclip,
  Plus,
  Send,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@components/components/ui/avatar";
import { Button } from "@components/components/ui/button";
import { Checkbox } from "@components/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@components/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@components/components/ui/dropdown-menu";
import { Input } from "@components/components/ui/input";
import { Label } from "@components/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@components/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import { Textarea } from "@components/components/ui/textarea";

import EmployeeV2Service from "@/services/employee-v2.service";
import useCurrentEmployee from "@/hooks/useCurrentEmployee";

import { formatDate } from "./WorkPanelUI";
import { getAvatarUrl, getInitials, getTaskTitleValidationError } from "./taskHelpers";

const ROLE_RANK = Object.freeze({
  Employee: 1,
  Finance: 1,
  Inventory: 1,
  Admin: 2,
  "Super Admin": 3,
});

const TONES = {
  blue: { bar: "border-blue-200 bg-blue-50/80 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300", badge: "bg-blue-600" },
  green: { bar: "border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300", badge: "bg-emerald-600" },
  violet: { bar: "border-violet-200 bg-violet-50/80 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-300", badge: "bg-violet-600" },
  amber: { bar: "border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300", badge: "bg-amber-500" },
};

const REMINDER_OPTIONS = ["None", "At Due Time", "On Due Date 09:00", "1 Day Before", "2 Days Before", "1 Week Before"];
const COMPLETION_REQUIREMENTS = ["None", "Update Note", "Attachment", "Update Note + Attachment"];

const createTaskItem = () => ({
  clientId: globalThis.crypto?.randomUUID?.() || `task-${Date.now()}-${Math.random()}`,
  taskTitle: "",
  relatedTo: "",
  dueDate: "",
  dueTime: "",
  priority: "Medium",
  reminderType: "None",
  instructions: "",
  expectedOutcome: "",
  checklist: [],
  completionRequirement: "Update Note",
  attachments: [],
});

const requiresAcceptance = (creatorRole, ownerRole) => {
  const creatorRank = ROLE_RANK[creatorRole];
  const ownerRank = ROLE_RANK[ownerRole];
  return Number.isInteger(creatorRank) && Number.isInteger(ownerRank) && ownerRank >= creatorRank;
};

function SectionBar({ index, tone, title, summary, open = true, onToggle }) {
  const style = TONES[tone];
  return (
    <button type="button" onClick={onToggle} className={`flex min-h-9 w-full items-center gap-2 rounded-t-lg border px-3 py-1.5 text-left transition-colors ${style.bar}`}>
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${style.badge}`}>{index}</span>
      <span className="text-sm font-semibold">{title}</span>
      {summary ? <span className="ml-auto hidden max-w-[55%] truncate text-xs font-medium sm:block">{summary}</span> : <span className="ml-auto" />}
      {onToggle ? open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" /> : null}
    </button>
  );
}

function Field({ label, required, helper, children }) {
  return (
    <div className="space-y-0.5">
      <Label className="text-sm font-semibold text-foreground">{label}{required ? <span className="text-red-500"> *</span> : null}</Label>
      {children}
      {helper ? <p className="text-xs leading-4 text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function EmployeeOption({ employee }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={getAvatarUrl(employee?.profileImage?.smallUrl)} alt={employee?.name} />
        <AvatarFallback className="bg-blue-900 text-[9px] font-semibold text-white">{getInitials(employee?.name) || "?"}</AvatarFallback>
      </Avatar>
      <span className="truncate">{employee?.name}</span>
      <span className="ml-auto text-[10px] text-muted-foreground">{employee?.accessRole}</span>
    </span>
  );
}

export default function AddTaskDialog({ open, onOpenChange, task, setTask, createTaskMutation }) {
  const { data: currentEmployee } = useCurrentEmployee();
  const [expandedTasks, setExpandedTasks] = useState(() => new Set());
  const isWorkRequest = task.taskType === "Work Request";
  const currentEmployeeId = String(currentEmployee?._id || currentEmployee?.employeeId || "");
  const firstTaskClientId = task.tasks[0]?.clientId;

  const employeesQuery = useQuery({
    queryKey: ["task-assignable-employees"],
    queryFn: async () => {
      const response = await EmployeeV2Service.getTaskAssignmentEmployees({ limit: 100 });
      return [...(response.data?.data?.employees || [])].sort((first, second) =>
        String(first.name || "").localeCompare(String(second.name || ""), undefined, { sensitivity: "base", numeric: true })
      );
    },
    enabled: open,
  });

  const employees = employeesQuery.data || [];
  const employeeById = useMemo(() => new Map(employees.map((employee) => [String(employee._id), employee])), [employees]);
  const primaryOwner = isWorkRequest ? employeeById.get(String(task.primaryOwnerId)) : currentEmployee;
  const selectedCollaborators = task.collaboratorIds.map((employeeId) => employeeById.get(String(employeeId))).filter(Boolean);
  const reviewer = String(task.reviewerId) === currentEmployeeId ? currentEmployee : employeeById.get(String(task.reviewerId));
  const needsAcceptance = isWorkRequest && requiresAcceptance(currentEmployee?.accessRole, primaryOwner?.accessRole);

  useEffect(() => {
    if (open && isWorkRequest && currentEmployeeId && !task.reviewerId) {
      setTask((current) => ({ ...current, reviewerId: currentEmployeeId }));
    }
  }, [currentEmployeeId, isWorkRequest, open, setTask, task.reviewerId]);

  useEffect(() => {
    setExpandedTasks(open && firstTaskClientId ? new Set([firstTaskClientId]) : new Set());
  }, [firstTaskClientId, open]);

  const updateRoot = (key, value) => setTask((current) => ({ ...current, [key]: value }));
  const updateTask = (clientId, updates) => setTask((current) => ({
    ...current,
    tasks: current.tasks.map((item) => item.clientId === clientId ? { ...item, ...updates } : item),
  }));

  const changeTaskType = (taskType) => setTask((current) => ({
    ...current,
    taskType,
    primaryOwnerId: "",
    reviewerId: taskType === "Work Request" ? currentEmployeeId : "",
  }));

  const toggleCollaborator = (employeeId) => setTask((current) => ({
    ...current,
    collaboratorIds: current.collaboratorIds.includes(employeeId)
      ? current.collaboratorIds.filter((id) => id !== employeeId)
      : [...current.collaboratorIds, employeeId],
  }));

  const toggleTask = (clientId) => setExpandedTasks((current) => {
    const next = new Set(current);
    if (next.has(clientId)) next.delete(clientId);
    else next.add(clientId);
    return next;
  });

  const focusTaskField = (clientId, field, checklistItemId) => {
    setExpandedTasks(new Set([clientId]));
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const target = Array.from(document.querySelectorAll(`[data-task-field="${field}"]`)).find((element) => (
        element.dataset.taskClientId === String(clientId)
        && (!checklistItemId || element.dataset.checklistItemId === String(checklistItemId))
      ));
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus();
    }));
  };

  const validateTaskDetails = () => {
    for (const [index, item] of task.tasks.entries()) {
      const titleError = getTaskTitleValidationError(item.taskTitle);
      if (titleError) {
        focusTaskField(item.clientId, "title");
        toast.error(`Task ${index + 1}: ${titleError}`);
        return false;
      }
      if (!item.dueDate) {
        focusTaskField(item.clientId, "dueDate");
        toast.error(`Task ${index + 1}: Due date is required`);
        return false;
      }
      if (!item.expectedOutcome.trim()) {
        focusTaskField(item.clientId, "expectedOutcome");
        toast.error(`Task ${index + 1}: Expected outcome is required`);
        return false;
      }
      const emptyChecklistItem = item.checklist.find((checklistItem) => !checklistItem.text.trim());
      if (emptyChecklistItem) {
        focusTaskField(item.clientId, "checklist", emptyChecklistItem.id);
        toast.error(`Task ${index + 1}: Remove or complete empty checklist items`);
        return false;
      }
    }
    return true;
  };

  const addTask = () => {
    if (!validateTaskDetails()) return;
    const nextTask = createTaskItem();
    setTask((current) => ({ ...current, tasks: [...current.tasks, nextTask] }));
    setExpandedTasks(new Set([nextTask.clientId]));
  };

  const removeTask = (clientId) => {
    if (task.tasks.length === 1) return;
    setTask((current) => ({ ...current, tasks: current.tasks.filter((item) => item.clientId !== clientId) }));
  };

  const addChecklistItem = (clientId) => {
    const currentTask = task.tasks.find((item) => item.clientId === clientId);
    if ((currentTask?.checklist.length || 0) >= 25) return;
    updateTask(clientId, { checklist: [...(currentTask?.checklist || []), { id: `item-${Date.now()}-${Math.random()}`, text: "" }] });
  };

  const updateChecklistItem = (clientId, itemId, text) => {
    const currentTask = task.tasks.find((item) => item.clientId === clientId);
    updateTask(clientId, { checklist: currentTask.checklist.map((item) => item.id === itemId ? { ...item, text } : item) });
  };

  const removeChecklistItem = (clientId, itemId) => {
    const currentTask = task.tasks.find((item) => item.clientId === clientId);
    updateTask(clientId, { checklist: currentTask.checklist.filter((item) => item.id !== itemId) });
  };

  const addFiles = (clientId, fileList) => {
    const currentTask = task.tasks.find((item) => item.clientId === clientId);
    updateTask(clientId, { attachments: [...(currentTask.attachments || []), ...Array.from(fileList)].slice(0, 5) });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isWorkRequest && !task.primaryOwnerId) {
      toast.error("Select a primary owner");
      return;
    }

    if (!validateTaskDetails()) return;

    const payload = {
      taskType: task.taskType,
      primaryOwnerId: isWorkRequest ? task.primaryOwnerId : undefined,
      collaboratorIds: task.collaboratorIds,
      reviewerId: task.reviewerId || null,
      visibility: task.visibility,
      tasks: task.tasks.map((item) => ({
        clientId: item.clientId,
        taskTitle: item.taskTitle.trim(),
        relatedTo: item.relatedTo.trim() ? { type: "Other", name: item.relatedTo.trim() } : undefined,
        dueDate: item.dueDate,
        dueTime: item.dueTime || undefined,
        priority: item.priority,
        reminderType: item.reminderType,
        instructions: item.instructions.trim() || undefined,
        expectedOutcome: item.expectedOutcome.trim(),
        checklist: item.checklist.map(({ text }) => ({ text: text.trim() })),
        completionRequirement: item.completionRequirement,
      })),
    };
    const attachmentsByClientId = Object.fromEntries(task.tasks.map((item) => [item.clientId, item.attachments || []]));
    createTaskMutation.mutate({ payload, attachmentsByClientId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[112vh] w-[calc(100%-1rem)] max-w-none origin-center !scale-[0.8] flex-col gap-0 overflow-hidden rounded-xl border-border p-0 shadow-2xl [&_input]:!text-sm [&_textarea]:!text-sm [&_[role=combobox]]:!text-sm sm:max-w-[1100px]">
        <DialogHeader className="shrink-0 px-4 pb-2.5 pt-3 text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight">Create Task</DialogTitle>
          <p className="text-xs text-muted-foreground">Create your own task or assign work to another employee.</p>
          <div className="mt-2 grid gap-2 rounded-lg border border-border bg-background px-3 py-2 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={getAvatarUrl(currentEmployee?.profileImage?.smallUrl)} alt={currentEmployee?.name} />
                <AvatarFallback className="bg-blue-900 text-[10px] font-semibold text-white">{getInitials(currentEmployee?.name) || "?"}</AvatarFallback>
              </Avatar>
              <div><p className="text-xs text-muted-foreground">Created By</p><p className="text-sm font-semibold">{currentEmployee?.name || "—"}</p></div>
            </div>
            <div className="flex items-center gap-2 sm:border-l sm:border-border sm:pl-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300"><CalendarCheck className="h-4 w-4" /></span>
              <div><p className="text-xs text-muted-foreground">Created On</p><p className="text-sm font-semibold">{formatDate(new Date())}</p></div>
            </div>
          </div>
        </DialogHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-muted/10 p-2 sm:px-3 sm:py-2.5">
            <section>
              <SectionBar index={1} tone="blue" title="Task Type" summary={isWorkRequest ? "Assign Task" : "Self Task"} />
              <div className="rounded-b-lg border border-t-0 border-blue-200 bg-background p-2 dark:border-blue-400/30">
                <RadioGroup value={task.taskType} onValueChange={changeTaskType} className="grid gap-3 sm:grid-cols-2">
                  {[["Self Task", UserRound, "Create a task for yourself."], ["Work Request", Users, "Assign work to another employee."]].map(([value, Icon, description]) => (
                    <label key={value} className={`flex min-h-[48px] cursor-pointer items-start gap-2 rounded-lg border p-2 transition-colors ${task.taskType === value ? "border-blue-500 bg-blue-50/60 shadow-sm dark:bg-blue-400/10" : "border-border hover:bg-muted/40"}`}>
                      <RadioGroupItem value={value} className="mt-0.5" />
                      <Icon className="mt-0.5 h-4 w-4 text-blue-600" />
                      <span><span className="block text-sm font-semibold">{value === "Work Request" ? "Assign Task" : value}</span><span className="text-xs text-muted-foreground">{description}</span></span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </section>

            <section>
              <SectionBar index={2} tone="green" title="People & Responsibility" summary={`${primaryOwner?.name || "Select owner"} • ${selectedCollaborators.length} collaborator${selectedCollaborators.length === 1 ? "" : "s"}${reviewer ? " • Reviewer assigned" : ""}`} />
              <div className="grid gap-2 rounded-b-lg border border-t-0 border-emerald-200 bg-background p-2.5 dark:border-emerald-400/30 md:grid-cols-3">
                <Field label="Primary Owner" required helper="The primary owner is responsible for completing this task.">
                  {isWorkRequest ? (
                    <Select value={task.primaryOwnerId} onValueChange={(value) => setTask((current) => ({ ...current, primaryOwnerId: value, collaboratorIds: current.collaboratorIds.filter((id) => id !== value) }))}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={employeesQuery.isFetching ? "Loading..." : "Select employee"} /></SelectTrigger>
                      <SelectContent>{employees.map((employee) => <SelectItem key={employee._id} value={employee._id}><EmployeeOption employee={employee} /></SelectItem>)}</SelectContent>
                    </Select>
                  ) : <div className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm"><UserRound className="h-4 w-4 text-emerald-600" />{currentEmployee?.name || "You"}</div>}
                </Field>

                <Field label="Collaborators (Optional)" helper="Collaborators can view, contribute and add updates.">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button type="button" variant="outline" className="h-9 w-full justify-start gap-2 text-sm"><Plus className="h-4 w-4" />Add Collaborators ({selectedCollaborators.length})</Button></DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-72 w-72 overflow-y-auto" align="start">
                      {employees.filter((employee) => String(employee._id) !== String(task.primaryOwnerId) && String(employee._id) !== currentEmployeeId).map((employee) => (
                        <DropdownMenuCheckboxItem key={employee._id} checked={task.collaboratorIds.includes(employee._id)} onCheckedChange={() => toggleCollaborator(employee._id)} onSelect={(event) => event.preventDefault()}><EmployeeOption employee={employee} /></DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {selectedCollaborators.length ? <div className="flex flex-wrap gap-1.5 pt-1">{selectedCollaborators.map((employee) => <span key={employee._id} className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-1 text-xs">{employee.name}<button type="button" aria-label={`Remove ${employee.name}`} onClick={() => toggleCollaborator(employee._id)}><X className="h-3 w-3" /></button></span>)}</div> : null}
                </Field>

                <Field label="Reviewer / Reporting Head (Optional)" helper="This person can review, complete or request rework.">
                  <Select value={task.reviewerId || "none"} onValueChange={(value) => updateRoot("reviewerId", value === "none" ? "" : value)}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select reviewer" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No reviewer</SelectItem>
                      {currentEmployeeId ? <SelectItem value={currentEmployeeId}><EmployeeOption employee={{ ...currentEmployee, name: `${currentEmployee?.name} (You)` }} /></SelectItem> : null}
                      {employees.filter((employee) => String(employee._id) !== currentEmployeeId).map((employee) => <SelectItem key={employee._id} value={employee._id}><EmployeeOption employee={employee} /></SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                {isWorkRequest && primaryOwner ? <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300 md:col-span-3"><Info className="h-3.5 w-3.5 shrink-0" />{needsAcceptance ? `${primaryOwner.name} must accept this task before work begins.` : `This task starts directly in ${primaryOwner.name}'s My Work list.`}</div> : null}
              </div>
            </section>

            {task.tasks.map((item, taskIndex) => {
              const isOpen = expandedTasks.has(item.clientId);
              const dueSummary = item.dueDate ? `Due ${formatDate(item.dueDate)}` : "Due date pending";
              return (
                <section key={item.clientId}>
                  <SectionBar index={taskIndex * 2 + 3} tone="violet" title={`Task ${taskIndex + 1} Details`} summary={`${item.taskTitle || "Untitled"} • ${dueSummary} • ${item.priority}`} open={isOpen} onToggle={() => toggleTask(item.clientId)} />
                  {isOpen ? (
                    <div className="space-y-2 rounded-b-lg border border-t-0 border-violet-200 bg-background p-2.5 dark:border-violet-400/30">
                      <div className="grid gap-x-2.5 gap-y-1.5 sm:grid-cols-2">
                        <Field label="Task Title" required><Input data-task-client-id={item.clientId} data-task-field="title" value={item.taskTitle} maxLength={30} onChange={(event) => updateTask(item.clientId, { taskTitle: event.target.value })} placeholder="Enter task title" className="h-9 text-xs" /><p className="text-right text-[11px] text-muted-foreground">{item.taskTitle.length} / 30</p></Field>
                        <Field label="Linked To (Optional)"><Input value={item.relatedTo} onChange={(event) => updateTask(item.clientId, { relatedTo: event.target.value })} placeholder="Enter linked item" className="h-9 text-xs" /></Field>
                        <Field label="Due Date" required><Input data-task-client-id={item.clientId} data-task-field="dueDate" type="date" min={new Date().toISOString().slice(0, 10)} value={item.dueDate} onChange={(event) => updateTask(item.clientId, { dueDate: event.target.value })} className="h-9 text-xs" /></Field>
                        <Field label="Due Time (Optional)"><Input type="time" value={item.dueTime} onChange={(event) => updateTask(item.clientId, { dueTime: event.target.value })} className="h-9 text-xs" /></Field>
                        <Field label="Priority"><Select value={item.priority} onValueChange={(value) => updateTask(item.clientId, { priority: value })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{["High", "Medium", "Low"].map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectContent></Select></Field>
                        <Field label="Reminder (Optional)"><Select value={item.reminderType} onValueChange={(value) => updateTask(item.clientId, { reminderType: value })}><SelectTrigger className="h-9 text-xs"><Bell className="mr-2 h-4 w-4 text-blue-600" /><SelectValue /></SelectTrigger><SelectContent>{REMINDER_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></Field>
                        <Field label="Task Instructions (Optional)"><Textarea value={item.instructions} maxLength={500} onChange={(event) => updateTask(item.clientId, { instructions: event.target.value })} placeholder="Add instructions, requirements or important details..." className="h-14 min-h-14 resize-none text-xs" /><p className="text-right text-[11px] text-muted-foreground">{item.instructions.length}/500</p></Field>
                        <Field label="Expected Outcome" required><Textarea data-task-client-id={item.clientId} data-task-field="expectedOutcome" value={item.expectedOutcome} maxLength={300} onChange={(event) => updateTask(item.clientId, { expectedOutcome: event.target.value })} placeholder="What should be the final result or output?" className="h-14 min-h-14 resize-none text-xs" /><p className="text-right text-[11px] text-muted-foreground">{item.expectedOutcome.length}/300</p></Field>
                      </div>

                      <div className="rounded-lg border border-blue-100 bg-blue-50/30 p-2 dark:border-blue-400/20 dark:bg-blue-400/5">
                        <div className="mb-2 flex items-center gap-2"><CheckSquare className="h-4 w-4 text-blue-600" /><p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Checklist <span className="font-normal text-muted-foreground">(Optional)</span></p></div>
                        <div className="space-y-2">{item.checklist.map((checklistItem) => <div key={checklistItem.id} className="flex items-center gap-2"><Checkbox disabled /><Input data-task-client-id={item.clientId} data-task-field="checklist" data-checklist-item-id={checklistItem.id} value={checklistItem.text} maxLength={200} onChange={(event) => updateChecklistItem(item.clientId, checklistItem.id, event.target.value)} placeholder="Checklist item" className="h-9 bg-background text-sm" /><Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={() => removeChecklistItem(item.clientId, checklistItem.id)}><X className="h-4 w-4" /></Button></div>)}</div>
                        <Button type="button" variant="ghost" size="sm" className="mt-2 h-8 gap-1 text-xs text-blue-600" onClick={() => addChecklistItem(item.clientId)}><Plus className="h-4 w-4" />Add checklist item</Button>
                      </div>

                      <div>
                        <SectionBar index={taskIndex * 2 + 4} tone="amber" title={`Work Requirement & Attachments (Task ${taskIndex + 1})`} summary={`${item.completionRequirement} • ${item.attachments.length} file${item.attachments.length === 1 ? "" : "s"}`} />
                        <div className="grid gap-2 rounded-b-lg border border-t-0 border-amber-200 p-2.5 dark:border-amber-400/30 md:grid-cols-2">
                          <Field label="Completion Requirement" required helper="This must be satisfied before the task can be submitted."><Select value={item.completionRequirement} onValueChange={(value) => updateTask(item.clientId, { completionRequirement: value })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{COMPLETION_REQUIREMENTS.map((requirement) => <SelectItem key={requirement} value={requirement}>{requirement}</SelectItem>)}</SelectContent></Select></Field>
                          <Field label="Reference Attachments" helper={`${item.attachments.length} of 5 files added`}><label className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-blue-300 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-blue-400/10"><Paperclip className="h-4 w-4" />Add Files<input type="file" multiple className="hidden" onChange={(event) => addFiles(item.clientId, event.target.files)} /></label>{item.attachments.length ? <div className="mt-1.5 flex flex-wrap gap-1">{item.attachments.map((file, fileIndex) => <span key={`${file.name}-${fileIndex}`} className="inline-flex max-w-full items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px]"><FileText className="h-3 w-3 shrink-0" /><span className="max-w-40 truncate">{file.name}</span><button type="button" aria-label={`Remove ${file.name}`} onClick={() => updateTask(item.clientId, { attachments: item.attachments.filter((_, index) => index !== fileIndex) })}><X className="h-3 w-3" /></button></span>)}</div> : null}</Field>
                        </div>
                      </div>
                      {task.tasks.length > 1 ? <div className="flex justify-end"><Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-xs text-red-600" onClick={() => removeTask(item.clientId)}><Trash2 className="h-4 w-4" />Remove task</Button></div> : null}
                    </div>
                  ) : null}
                </section>
              );
            })}

            <Button type="button" variant="outline" className="h-8 w-full justify-start gap-2 border-dashed border-blue-300 text-sm font-medium text-blue-600" onClick={addTask} disabled={task.tasks.length >= 10}><Plus className="h-3.5 w-3.5" />Add Another Task</Button>
            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50/60 px-2.5 py-1.5 text-xs leading-4 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>Owners and collaborators can add work updates, complete checklist items and upload proof. Reviewers are notified and can complete the task or request rework.</span></div>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-background px-4 py-1.5">
            <Button type="button" variant="outline" className="h-8 px-4 text-sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="h-8 gap-2 bg-blue-600 px-4 text-sm text-white hover:bg-blue-700" disabled={createTaskMutation.isPending}>{createTaskMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Create {task.tasks.length > 1 ? `${task.tasks.length} Tasks` : "Task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
