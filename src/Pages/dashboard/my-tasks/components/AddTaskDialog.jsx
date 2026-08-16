import React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  Flag,
  Info,
  Loader2,
  Lock,
  Send,
  UserRound,
} from "lucide-react";

import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import { Textarea } from "@components/components/ui/textarea";
import { Label } from "@components/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@components/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@components/components/ui/avatar";
import { Separator } from "@components/components/ui/separator";

import EmployeeV2Service from "@/services/employee-v2.service";
import useCurrentEmployee from "@/hooks/useCurrentEmployee";

import { formatDate } from "./WorkPanelUI";
import { SectionHeader, getAvatarUrl, getInitials, getTaskTitleValidationError } from "./taskHelpers";

export default function AddTaskDialog({ open, onOpenChange, task, setTask, createTaskMutation }) {
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

    if (!task.dueDate) {
      toast.error("Due date is required");
      return;
    }

    const taskTitleError = getTaskTitleValidationError(task.taskTitle);
    if (taskTitleError) {
      toast.error(taskTitleError);
      return;
    }

    if (!task.description?.trim()) {
      toast.error("Description is required");
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
      <DialogContent className="flex max-h-[92vh] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[600px]">
        <div className="shrink-0 border-b border-border p-4">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Create your own task or request work from another employee.</DialogDescription>
          </DialogHeader>

          <div className="mt-3 flex items-center gap-2 overflow-hidden rounded-md border border-border p-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={getAvatarUrl(currentEmployee?.profileImage?.smallUrl)} alt={currentEmployee?.name} />
                <AvatarFallback className="bg-blue-900 text-[10px] font-semibold text-white">
                  {getInitials(currentEmployee?.name) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-[11px] leading-tight text-muted-foreground">Created By</p>
                <p className="break-words text-xs font-semibold leading-tight text-foreground">{currentEmployee?.name || "—"}</p>
              </div>
            </div>
            <Separator orientation="vertical" className="h-8 shrink-0" />
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
                <CalendarCheck className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] leading-tight text-muted-foreground">Created On</p>
                <p className="break-words text-xs font-semibold leading-tight text-foreground">{formatDate(new Date())}</p>
              </div>
            </div>
            {isWorkRequest ? (
              <>
                <Separator orientation="vertical" className="h-8 shrink-0" />
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={getAvatarUrl(requestedEmployee?.profileImage?.smallUrl)} alt={requestedEmployee?.name} />
                    <AvatarFallback className="bg-orange-500 text-[10px] font-semibold text-white">
                      {requestedEmployee?.name ? getInitials(requestedEmployee.name) : <UserRound className="h-3.5 w-3.5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-[11px] leading-tight text-muted-foreground">Request To</p>
                    <p className="break-words text-xs font-semibold leading-tight text-foreground">{requestedEmployee?.name || "—"}</p>
                  </div>
                </div>
                <Separator orientation="vertical" className="h-8 shrink-0" />
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-400/10 dark:text-red-300">
                    <Flag className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] leading-tight text-muted-foreground">Priority</p>
                    <p className="break-words text-xs font-semibold leading-tight text-foreground">{task.priority}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Separator orientation="vertical" className="h-8 shrink-0" />
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] leading-tight text-muted-foreground">Visibility</p>
                    <p className="break-words text-xs font-semibold leading-tight text-foreground">{task.visibility}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          <div className="space-y-1.5">
            <SectionHeader index={1} tone="blue" title="Task Type" />
            <RadioGroup
              value={task.taskType}
              onValueChange={(value) => setField("taskType", value)}
              className="grid grid-cols-2 gap-1.5"
            >
              <label
                className={`flex cursor-pointer items-center gap-1.5 rounded-md border p-1.5 text-xs ${
                  task.taskType === "Self Task" ? "border-blue-500 dark:border-blue-400/60" : "border-border"
                }`}
              >
                <RadioGroupItem value="Self Task" />
                <UserRound className={`h-3.5 w-3.5 ${task.taskType === "Self Task" ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
                Self Task
              </label>
              <label
                className={`flex cursor-pointer items-center gap-1.5 rounded-md border p-1.5 text-xs ${
                  task.taskType === "Work Request" ? "border-orange-500 dark:border-orange-400/60" : "border-border"
                }`}
              >
                <RadioGroupItem value="Work Request" />
                <Briefcase className={`h-3.5 w-3.5 ${task.taskType === "Work Request" ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`} />
                Work Request
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <SectionHeader index={2} tone="green" title="Assignment Details" />

            <div className="rounded-md border border-emerald-200 p-2 dark:border-emerald-400/30">
            {isWorkRequest ? (
              <div className="space-y-1.5">
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">Request To <span className="text-red-600">*</span></Label>
                    <Select value={task.requestTo} onValueChange={(value) => setField("requestTo", value)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={employeesQuery.isFetching ? "Loading employees..." : "Select employee"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(employeesQuery.data || []).map((employee) => (
                          <SelectItem key={employee._id} value={employee._id}>
                            <span className="flex items-center gap-2">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={getAvatarUrl(employee.profileImage?.smallUrl)} alt={employee.name} />
                                <AvatarFallback className="bg-blue-900 text-[8px] font-semibold text-white">
                                  {getInitials(employee.name) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              {employee.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">Employee Department</Label>
                    <div className="flex h-8 items-center rounded-md border border-border bg-muted/40 px-2.5 text-xs text-muted-foreground">
                      {requestedEmployee?.designation || "—"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">Acceptance Required</Label>
                    <div className="flex h-8 items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Yes
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50/60 px-2.5 py-1.5 text-[11px] text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  This request will be sent for acceptance before work begins.
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">Assigned To</Label>
                    <div className="flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-foreground">
                      <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                      Self — {currentEmployee?.name || "—"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">Visibility</Label>
                    <div className="relative flex h-8 rounded-md border border-border p-0.5">
                      <div
                        className={`absolute inset-y-0.5 w-[calc(50%-2px)] rounded-[5px] bg-emerald-500 transition-transform duration-200 ease-out ${
                          task.visibility === "Manager Visible" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setField("visibility", "Private")}
                        className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 text-xs font-medium transition-colors duration-200 ${
                          task.visibility === "Private" ? "text-white" : "text-muted-foreground"
                        }`}
                      >
                        <UserRound className="h-3.5 w-3.5" />
                        Private
                      </button>
                      <button
                        type="button"
                        onClick={() => setField("visibility", "Manager Visible")}
                        className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 text-xs font-medium transition-colors duration-200 ${
                          task.visibility === "Manager Visible" ? "text-white" : "text-muted-foreground"
                        }`}
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Manager Visible
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50/60 px-2.5 py-1.5 text-[11px] text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  {task.visibility === "Manager Visible"
                    ? "This task will be visible to managers."
                    : "This task is private and only visible to you."}
                </div>
              </div>
            )}
            </div>
          </div>

          <div className="space-y-1.5">
            <SectionHeader index={3} tone="violet" title="Task Details" />

            <div className="grid gap-2 rounded-md border border-violet-200 p-2 dark:border-violet-400/30 sm:grid-cols-2">
              <FormInput label="Task Title" required maxLength={50} helper="Maximum 50 characters" value={task.taskTitle} onChange={(value) => setField("taskTitle", value)} />
              <FormInput label="Linked To" value={task.relatedTo} onChange={(value) => setField("relatedTo", value)} />
              <FormInput label="Due Date" type="date" required min={new Date().toISOString().slice(0, 10)} value={task.dueDate} onChange={(value) => setField("dueDate", value)} />
              <FormInput label="Due Time (Optional)" type="time" value={task.dueTime} onChange={(value) => setField("dueTime", value)} />

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">Priority</Label>
                <Select value={task.priority} onValueChange={(value) => setField("priority", value)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                        High
                      </span>
                    </SelectItem>
                    <SelectItem value="Medium">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                        Medium
                      </span>
                    </SelectItem>
                    <SelectItem value="Low">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                        Low
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">Expected Outcome <span className="text-red-500">*</span></Label>
                <Textarea value={task.description} onChange={(event) => setField("description", event.target.value)} className="h-16 min-h-16 resize-none text-xs" />
              </div>
            </div>
          </div>
        </div>

          <DialogFooter className="shrink-0 border-t border-border p-3">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              type="submit"
              size="sm"
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              disabled={createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isWorkRequest ? "Send Work Request" : "Create Self Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormInput({ label, value, onChange, type = "text", required = false, min, maxLength, helper }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-foreground">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <Input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} min={min} maxLength={maxLength} className="h-8 text-xs" />
      {helper ? <p className="text-[10px] text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

