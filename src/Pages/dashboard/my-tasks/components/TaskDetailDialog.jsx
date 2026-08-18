import React, { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Flag,
  Info,
  Loader2,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Send,
  Smile,
  Trash2,
  XCircle,
} from "lucide-react";

import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import { Textarea } from "@components/components/ui/textarea";
import { Label } from "@components/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@components/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@components/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@components/components/ui/popover";
import { Separator } from "@components/components/ui/separator";

import useCurrentEmployee from "@/hooks/useCurrentEmployee";
import { getSocket } from "@/services/socket";

import { formatDate, formatDateTime } from "./WorkPanelUI";
import {
  PRIORITY_TEXT_CLASS,
  SectionHeader,
  TASK_STATUS_DOT_CLASS,
  TaskStatusPill,
  formatFileSize,
  getAvatarUrl,
  getDisplayTaskTitle,
  getDisplayTaskStatus,
  getDueDateNote,
  getFileIconStyle,
  getInitials,
  getTaskTitleValidationError,
  getTaskStatusTone,
} from "./taskHelpers";

const WORK_REQUEST_EDITABLE_STATUSES = ["In Progress", "Submitted"];
const SELF_TASK_EDITABLE_STATUSES = ["In Progress", "Completed"];
const TASK_ROLE_RANK = {
  Employee: 1,
  Finance: 1,
  Inventory: 1,
  Admin: 2,
  "Super Admin": 3,
};

const ESCALATION_TYPES = [
  "Clarification Required",
  "No Response / Delay",
  "Due Date Issue",
  "Reassignment Required",
  "Approval Required",
  "Resource / Dependency Issue",
  "Responsibility Conflict",
  "Priority Conflict",
];

const ESCALATION_REQUESTED_ACTIONS = [
  "Admin Review",
  "Provide Clarification",
  "Approve Due Date Change",
  "Reassign Task",
  "Provide Approval",
  "Resolve Responsibility",
  "Change Priority",
  "Close / Resolve Issue",
];

const scrollTimelineHorizontally = (event) => {
  if (!event.deltaY) return;
  const container = event.currentTarget;
  const maxScrollLeft = container.scrollWidth - container.clientWidth;
  const nextScrollLeft = Math.min(maxScrollLeft, Math.max(0, container.scrollLeft + event.deltaY));
  if (nextScrollLeft === container.scrollLeft) return;
  event.preventDefault();
  container.scrollLeft = nextScrollLeft;
};

export default function TaskDetailDialog({
  task,
  detailLoading,
  onClose,
  updateProgressMutation,
  editTaskMutation,
  reviewTaskMutation,
  respondMutation,
  withdrawMutation,
  reminderMutation,
  discussionMutation,
  dueDateChangeMutation,
  dueDateChangeRespondMutation,
  escalateMutation,
}) {
  const [status, setStatus] = useState(task?.status || "Pending");
  const [progressPercent, setProgressPercent] = useState(task?.progressPercent ?? 0);
  const [priority, setPriority] = useState(task?.priority || "Medium");
  const [note, setNote] = useState("");
  const [proofFiles, setProofFiles] = useState([]);
  const [discussionMessage, setDiscussionMessage] = useState("");
  const [discussionFiles, setDiscussionFiles] = useState([]);
  const [isDueDateFormOpen, setIsDueDateFormOpen] = useState(false);
  const [newDueDate, setNewDueDate] = useState("");
  const [dueDateReason, setDueDateReason] = useState("");
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editRelatedToName, setEditRelatedToName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [escalationType, setEscalationType] = useState("");
  const [escalationAction, setEscalationAction] = useState("");
  const [escalationPriority, setEscalationPriority] = useState("High");
  const [escalationReason, setEscalationReason] = useState("");
  const [showEscalationForm, setShowEscalationForm] = useState(false);
  const discussionListRef = useRef(null);
  const discussionInputRef = useRef(null);
  const escalationSectionRef = useRef(null);
  const { data: currentEmployee } = useCurrentEmployee();
  const queryClient = useQueryClient();
  const isRecipient = task && currentEmployee && task.assignedTo === currentEmployee._id;
  const isRequester = task && currentEmployee && task.createdBy === currentEmployee._id;
  const isPendingAcceptance = task?.taskType === "Work Request" && task?.acceptanceStatus === "Pending";
  const isPendingDueDateChange = task?.dueDateChangeRequest?.status === "Pending";
  const isCompleted = task?.status === "Completed";
  const isRejected = task?.status === "Rejected";
  const isLocked = isCompleted || isRejected;
  const isWorkLocked = isLocked || isPendingAcceptance;
  const isDiscussionLocked = isLocked;
  const isTaskFromAdmin = task?.taskType !== "Self Task" && ["Admin", "Super Admin"].includes(task?.createdByRole);
  const isViewerSuperAdmin = currentEmployee?.accessRole === "Super Admin";
  const isHigherHierarchyRecipient = isRecipient
    && TASK_ROLE_RANK[task?.assignedToRole || currentEmployee?.accessRole]
      > TASK_ROLE_RANK[task?.createdByRole];
  const isReadyForReview = ["Submitted", "Pending Approval", "Under Admin Review"].includes(status);
  const canParticipantMarkCompleted = (isRequester || isHigherHierarchyRecipient)
    && !isPendingAcceptance && isReadyForReview;
  const hideEscalateButton = isTaskFromAdmin || isViewerSuperAdmin;
  const displayStatus = getDisplayTaskStatus({ ...task, status });
  const workLockedMessage = isRejected
    ? "This request was rejected and is view-only."
    : isCompleted
      ? "This task is completed and locked."
    : "Accept the work request before updating work.";

  useEffect(() => {
    setStatus(task?.status || "Pending");
    setProgressPercent(task?.progressPercent ?? 0);
    setPriority(task?.priority || "Medium");
    setNote("");
    setProofFiles([]);
    setDiscussionMessage("");
    setDiscussionFiles([]);
    setIsDueDateFormOpen(false);
    setNewDueDate("");
    setDueDateReason("");
    setIsEditingInfo(false);
    setEditTaskTitle(task?.taskTitle || "");
    setEditRelatedToName(task?.relatedTo?.name || "");
    setEditDescription(task?.description || "");
    setEscalationType("");
    setEscalationAction("");
    setEscalationPriority("High");
    setEscalationReason("");
  }, [task?._id]);

  useEffect(() => {
    if (!isRequester) {
      setPriority(task?.priority || "Medium");
    }
  }, [task?.priority, isRequester]);

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
    const container = discussionListRef.current;
    if (container) container.scrollTop = container.scrollHeight;
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
          window.requestAnimationFrame(() => discussionInputRef.current?.focus());
        },
      }
    );
  };

  const handleSaveUpdate = () => {
    const statusChanged = status !== task.status;
    const progressChanged = progressPercent !== (task.progressPercent ?? 0);
    const noteEntered = note.trim().length > 0;
    const infoChanged = isEditingInfo && (
      editTaskTitle.trim() !== task.taskTitle
      || editRelatedToName.trim() !== (task.relatedTo?.name || "")
      || editDescription.trim() !== (task.description || "")
    );
    const dueDateRequested = isDueDateFormOpen && Boolean(newDueDate);

    const saveProgress = () => {
      if (!statusChanged && !progressChanged && !noteEntered && !proofFiles.length) {
        onClose();
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

    const submitDueDateChange = () => {
      if (!dueDateRequested) {
        saveProgress();
        return;
      }

      dueDateChangeMutation.mutate(
        { taskId: task.taskId || task._id, requestedDueDate: newDueDate, reason: dueDateReason },
        {
          onSuccess: () => {
            setIsDueDateFormOpen(false);
            saveProgress();
          },
        }
      );
    };

    if (!statusChanged && !progressChanged && !noteEntered && !proofFiles.length && !infoChanged && !dueDateRequested) {
      toast.info("No changes to save");
      onClose();
      return;
    }

    if (infoChanged) {
      const taskTitleError = getTaskTitleValidationError(editTaskTitle);
      if (taskTitleError) {
        toast.error(taskTitleError);
        return;
      }
    }

    if (infoChanged) {
      editTaskMutation.mutate(
        {
          taskId: task.taskId || task._id,
          taskTitle: editTaskTitle.trim(),
          relatedTo: {
            type: task.relatedTo?.type || "Internal",
            refId: task.relatedTo?.refId || null,
            refModel: task.relatedTo?.refModel || null,
            name: editRelatedToName.trim(),
          },
          description: editDescription.trim(),
        },
        {
          onSuccess: () => {
            setIsEditingInfo(false);
            submitDueDateChange();
          },
        }
      );
    } else {
      submitDueDateChange();
    }
  };

  const handleMarkAsCompleted = () => {
    const taskId = task.taskId || task._id;
    const onSuccess = (response) => {
      const updated = response?.data?.data?.task;
      setStatus(updated?.status || "Completed");
      setProgressPercent(updated?.progressPercent ?? 100);
      onClose();
    };

    if (isRequester) {
      reviewTaskMutation.mutate(
        { taskId, decision: "approve" },
        { onSuccess }
      );
      return;
    }

    updateProgressMutation.mutate(
      { taskId, status: "Completed", progressPercent: 100 },
      { onSuccess }
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border bg-background p-4">
        <DialogHeader>
          <DialogTitle>Task Detail & Update</DialogTitle>
          <DialogDescription>Update progress, share work details or submit your work for review.</DialogDescription>
        </DialogHeader>
      </div>

      <div className="flex-1 overflow-y-auto">
      <div className="border-b border-border p-3">
        <div className="rounded-md border border-border p-2">
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-1.5">
            {(() => {
              const showAssignedTo = isRequester && task.taskType === "Work Request";
              const name = showAssignedTo ? task.assignedToName : task.createdByName;
              const profileImage = showAssignedTo ? task.assignedToProfileImage : task.createdByProfileImage;
              return (
                <>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={getAvatarUrl(profileImage?.smallUrl)} alt={name} />
                    <AvatarFallback className="bg-blue-900 text-[10px] font-semibold text-white">
                      {getInitials(name) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">{showAssignedTo ? "Assigned To" : "Assigned By"}</p>
                    <p className="break-words text-xs font-semibold text-foreground">{name || "—"}</p>
                  </div>
                </>
              );
            })()}
          </div>
          <Separator orientation="vertical" className="hidden h-8 sm:block" />
          <div className="flex min-w-0 flex-1 items-start gap-1.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Task Type</p>
              <p className="break-words text-xs font-semibold text-foreground">{task.taskType}</p>
            </div>
          </div>
          <Separator orientation="vertical" className="hidden h-8 sm:block" />
          <div className="flex min-w-0 flex-1 items-start gap-1.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
              <CalendarCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Due Date</p>
              <p className="break-words text-xs font-semibold text-foreground">{formatDate(task.dueDate)}</p>
              {(() => {
                const dueDateNote = getDueDateNote(task.dueDate, task.status, task.completedOn);
                return dueDateNote ? <p className={`text-[11px] font-medium ${dueDateNote.tone}`}>{dueDateNote.text}</p> : null;
              })()}
            </div>
          </div>
          <Separator orientation="vertical" className="hidden h-8 sm:block" />
          <div className="flex min-w-0 flex-1 items-start gap-1.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-400/10 dark:text-red-300">
              <Flag className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Priority</p>
              {isRequester && !isLocked ? (
                <Select
                  value={priority}
                  onValueChange={(value) => {
                    setPriority(value);
                    updateProgressMutation.mutate({ taskId: task.taskId || task._id, priority: value });
                  }}
                >
                  <SelectTrigger className={`h-6 w-fit gap-1 border-none bg-transparent p-0 text-xs font-semibold shadow-none focus:ring-0 ${PRIORITY_TEXT_CLASS[priority] || ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className={`text-xs font-semibold ${PRIORITY_TEXT_CLASS[task.priority] || "text-foreground"}`}>{task.priority}</p>
              )}
            </div>
          </div>
          <Separator orientation="vertical" className="hidden h-8 sm:block" />
          <div className="flex min-w-0 flex-1 items-start gap-1.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
              <Clock3 className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Current Status</p>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    TASK_STATUS_DOT_CLASS[getTaskStatusTone(displayStatus)] || "bg-muted-foreground"
                  }`}
                />
                {displayStatus}
              </p>
            </div>
          </div>
        </div>
        {(() => {
          const lastActivity = task.activity?.[task.activity.length - 1];
          return lastActivity ? (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock3 className="h-3 w-3 shrink-0" />
              Last updated by {lastActivity.performedByName} • {formatDateTime(lastActivity.createdAt)}
            </p>
          ) : null;
        })()}
        </div>
        {detailLoading ? <p className="mt-2 text-xs text-muted-foreground">Refreshing…</p> : null}
      </div>

      <div className="space-y-2 p-3">
        <div className="space-y-1.5">
          <SectionHeader
            index={1}
            tone="blue"
            title="Task Information"
            trailing={
              !isLocked ? (
                isEditingInfo ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingInfo(false);
                      setEditTaskTitle(task?.taskTitle || "");
                      setEditRelatedToName(task?.relatedTo?.name || "");
                      setEditDescription(task?.description || "");
                    }}
                    className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    <XCircle className="h-3 w-3" />
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo(true)}
                    className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                )
              ) : null
            }
          />
          <div className="space-y-2 rounded-md border border-border p-2">
            {isEditingInfo ? (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Task Title</Label>
                    <Input value={editTaskTitle} maxLength={30} onChange={(event) => setEditTaskTitle(event.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Linked To</Label>
                    <Input value={editRelatedToName} onChange={(event) => setEditRelatedToName(event.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Expected Outcome</Label>
                  <Textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} className="h-16 min-h-16 resize-none text-xs" />
                </div>
                <p className="text-[10px] leading-none text-muted-foreground">Edits apply when you click Save Update below.</p>
              </>
            ) : (
              <>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">Task Name</p>
                <div className="truncate rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs font-medium text-foreground">
                  {getDisplayTaskTitle(task.taskTitle)}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">Linked To</p>
                <div className="truncate rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs font-medium text-foreground">
                  {task.relatedTo?.name || "—"}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">Assigned On</p>
                <div className="truncate rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs font-medium text-foreground">
                  {formatDate(task.createdAt)}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground">Expected Outcome</p>
              <div className="rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs leading-5 text-foreground">
                {task.description || "No description available."}
              </div>
            </div>
              </>
            )}
          </div>
        </div>

        {isPendingAcceptance ? (
          <div className="space-y-1.5">
            <SectionHeader index={2} tone="green" title="Acceptance Status" />
            <div className="space-y-2 rounded-md border border-orange-200 bg-orange-50/60 p-2 dark:border-orange-400/30 dark:bg-orange-400/10">
              {isRecipient ? (
                <>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="grid flex-1 grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">Requested By</p>
                        <p className="text-xs font-semibold text-foreground">{task.createdByName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">Requested On</p>
                        <p className="text-xs font-semibold text-foreground">{formatDate(task.createdAt)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">Due Date</p>
                        <p className="text-xs font-semibold text-foreground">{formatDate(task.dueDate)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                        disabled={respondMutation.isPending}
                        onClick={() => respondMutation.mutate(
                          { taskId: task.taskId || task._id, action: "accept" },
                          {
                            onSuccess: (response) => {
                              const updated = response.data?.data?.task;
                              if (updated) {
                                setStatus(updated.status);
                                setProgressPercent(updated.progressPercent ?? 0);
                              }
                              onClose();
                            },
                          }
                        )}
                      >
                        Accept Request
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 text-red-600"
                        disabled={respondMutation.isPending}
                        onClick={() => {
                          if (!note.trim()) {
                            toast.error("Add a note in Work Update & Proof explaining the reason for rejection");
                            return;
                          }
                          respondMutation.mutate({ taskId: task.taskId || task._id, action: "reject", note: note.trim() });
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-[11px] text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {task.createdByName} has sent you this work request. Accept it to begin work, or reject it if you're unable to take it on.
                    </span>
                  </div>
                </>
              ) : isRequester ? (
                <>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="grid flex-1 grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">Acceptance Required</p>
                        <p className="text-xs font-semibold text-foreground">Yes</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">Recipient Response</p>
                        <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">Pending</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">Last Reminder</p>
                        <p className="text-xs font-semibold text-foreground">
                          {task.lastReminderAt ? formatDateTime(task.lastReminderAt) : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={reminderMutation.isPending}
                        onClick={() => reminderMutation.mutate(task.taskId || task._id)}
                      >
                        <Send className="h-4 w-4" />
                        Send Reminder
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-[11px] text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {task.assignedToName} has not accepted this request yet. Work will begin only after acceptance.
                      {" "}Reminder can be sent once every 24 hours.
                    </span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <SectionHeader index={2} tone="green" title="Progress Update" />
            {isLocked && (
              <div className="flex items-start gap-1.5 rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{isRejected ? "This request was rejected and is view-only." : `This task is completed and locked. ${isRequester ? "Click Rework above to reopen it." : "Ask the requester to reopen it via Rework."}`}</span>
              </div>
            )}

            {!isLocked ? (
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Current Progress</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => setProgressPercent((value) => Math.max(0, value - 10))}
                    >
                      −
                    </Button>
                    <div className="h-1.5 flex-1 rounded-full bg-muted">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => setProgressPercent((value) => Math.min(100, value + 10))}
                    >
                      +
                    </Button>
                    <span className="w-9 shrink-0 text-right text-xs font-medium text-foreground">{progressPercent}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Task Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value) => {
                      setStatus(value);
                      if (value === "In Progress") setProgressPercent(10);
                      if (value === "Completed") setProgressPercent(100);
                      if (value === "Rework") setProgressPercent(0);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const baseOptions = task.taskType === "Self Task" ? SELF_TASK_EDITABLE_STATUSES : WORK_REQUEST_EDITABLE_STATUSES;
                        const options = baseOptions.includes(status) ? baseOptions : [status, ...baseOptions];
                        return options.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>
                {isRecipient && (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">Due Date Change</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-full gap-2 text-xs text-blue-600 hover:text-blue-700"
                      disabled={isPendingDueDateChange}
                      onClick={() => setIsDueDateFormOpen((value) => !value)}
                    >
                      <CalendarCheck className="h-3.5 w-3.5" />
                      {isPendingDueDateChange ? "Request Pending" : "Request Due Date Change"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-3 rounded-md border border-emerald-200 bg-emerald-50/40 p-2.5 dark:border-emerald-400/30 dark:bg-emerald-400/10 sm:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground">Overall Progress</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{progressPercent}%</span>
                    <div className="h-1.5 flex-1 rounded-full bg-muted">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground">Task Status</p>
                  <TaskStatusPill status={displayStatus} />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground">Last Updated</p>
                  <p className="flex items-center gap-1 text-xs font-medium text-foreground">
                    <CalendarCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {formatDateTime(task.updatedAt)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground">Updated By</p>
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5 shrink-0">
                      <AvatarImage src={getAvatarUrl(task.assignedToProfileImage?.smallUrl)} alt={task.assignedToName} />
                      <AvatarFallback className="bg-blue-900 text-[9px] font-semibold text-white">
                        {getInitials(task.assignedToName) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-xs font-medium text-foreground">{task.assignedToName}</span>
                  </div>
                </div>
              </div>
            )}

            {isRecipient && !isLocked && isDueDateFormOpen && (
              <div className="space-y-2 rounded-md border border-border p-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">New Due Date</Label>
                    <Input
                      type="date"
                      value={newDueDate}
                      onChange={(event) => setNewDueDate(event.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">Reason</Label>
                    <Input
                      value={dueDateReason}
                      onChange={(event) => setDueDateReason(event.target.value)}
                      placeholder="Why do you need more time?"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">Click Save Update below to submit this request.</p>
              </div>
            )}

            {isPendingDueDateChange && (
              <div className="space-y-4 rounded-lg bg-amber-50/60 p-4 dark:bg-amber-400/10">
                <div className="flex items-center gap-1.5">
                  <CalendarClock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Due Date Change Requested</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-[11px] text-muted-foreground">Current Due Date</p>
                    <p className="text-xs font-semibold text-foreground">{formatDate(task.dueDate)}</p>
                  </div>
                  <Separator orientation="vertical" className="hidden h-8 bg-amber-200/70 sm:block dark:bg-amber-400/20" />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-[11px] text-muted-foreground">Requested Date</p>
                    <p className="text-xs font-semibold text-foreground">{formatDate(task.dueDateChangeRequest.requestedDueDate)}</p>
                  </div>
                  <Separator orientation="vertical" className="hidden h-8 bg-amber-200/70 sm:block dark:bg-amber-400/20" />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-[11px] text-muted-foreground">Reason</p>
                    <p className="break-words text-xs font-medium text-foreground">{task.dueDateChangeRequest.reason || "No reason provided"}</p>
                  </div>
                  <Separator orientation="vertical" className="hidden h-8 bg-amber-200/70 sm:block dark:bg-amber-400/20" />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-[11px] text-muted-foreground">Requested On</p>
                    <p className="text-xs font-medium text-foreground">{formatDateTime(task.dueDateChangeRequest.requestedOn || task.updatedAt)}</p>
                  </div>
                </div>
                {isRequester && (
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 text-xs text-red-600"
                      disabled={dueDateChangeRespondMutation.isPending}
                      onClick={() => dueDateChangeRespondMutation.mutate(
                        { taskId: task.taskId || task._id, action: "reject" },
                        { onSuccess: () => onClose() }
                      )}
                    >
                      Decline
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="gap-2 bg-blue-600 text-xs text-white hover:bg-blue-700"
                      disabled={dueDateChangeRespondMutation.isPending}
                      onClick={() => dueDateChangeRespondMutation.mutate(
                        { taskId: task.taskId || task._id, action: "approve" },
                        { onSuccess: () => onClose() }
                      )}
                    >
                      Approve New Date
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <SectionHeader index={3} tone="violet" title="Work Update & Proof" />
          {isWorkLocked && (
            <div className="flex items-start gap-1.5 rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{workLockedMessage}</span>
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Work Update Note</Label>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={
                  isLocked
                    ? workLockedMessage
                    : isPendingAcceptance
                      ? isRecipient
                        ? "Add a note (e.g. reason for rejection)..."
                        : "Only the assignee can add a note before the request is accepted."
                      : "Share a quick update on this task..."
                }
                maxLength={500}
                disabled={isLocked || (isPendingAcceptance && !isRecipient)}
                className="h-32 min-h-32 resize-none text-xs"
              />
              {!isLocked && <p className="text-right text-[10px] text-muted-foreground">{note.length}/500</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Attachments</Label>
              <div className="space-y-1.5">
                {(task.attachments || []).length ? task.attachments.map((file, index) => {
                  const { icon: FileIcon, className: iconClassName } = getFileIconStyle(file);
                  return (
                    <div key={file._id || index} className="flex items-center gap-2 rounded-lg border border-border bg-background p-2">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${iconClassName}`}>
                        <FileIcon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">{file.fileName || `Attachment ${index + 1}`}</p>
                        <p className="text-[10px] text-muted-foreground">{formatFileSize(file.fileSize)}</p>
                      </div>
                      <a href={file.fileUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <button type="button" onClick={notAvailable} className="text-muted-foreground hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                }) : !proofFiles.length ? (
                  <p className="text-xs text-muted-foreground">No attachments yet.</p>
                ) : null}
                {proofFiles.length ? (
                  <div className="flex flex-wrap gap-1">
                    {proofFiles.map((file, index) => (
                      <span key={index} className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-foreground dark:bg-blue-400/10">
                        {file.name}
                        <span className="text-[10px] text-muted-foreground">(pending)</span>
                        <button type="button" onClick={() => setProofFiles((files) => files.filter((_, i) => i !== index))}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
                {!isWorkLocked && (
                  <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
                    <label className="cursor-pointer">
                      <Plus className="h-4 w-4" />
                      Add More Files
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(event) => setProofFiles((files) => [...files, ...Array.from(event.target.files || [])])}
                      />
                    </label>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <SectionHeader
            index={4}
            tone="grey"
            title={task.taskType === "Self Task" ? "Activity Timeline" : "Activity & Discussion"}
            trailing={
              task.taskType !== "Self Task" ? <button
                type="button"
                onClick={notAvailable}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                Show: All Messages
              </button> : null
            }
          />
          <div className={`grid items-stretch overflow-hidden rounded-md border border-border ${task.taskType === "Self Task" ? "grid-cols-1" : "sm:grid-cols-3"}`}>
            <div className={`flex flex-col overflow-hidden ${task.taskType === "Self Task" ? "min-h-32" : "h-64"}`}>
              <p className="border-b border-border px-2.5 pb-2 pt-2.5 text-xs font-semibold text-foreground">
                Activity Timeline
              </p>
              <div
                className={task.taskType === "Self Task" ? "task-timeline-scroll flex-1 overflow-x-auto px-2.5 py-2" : "flex-1 overflow-y-auto p-2.5"}
                onWheel={task.taskType === "Self Task" ? scrollTimelineHorizontally : undefined}
                tabIndex={task.taskType === "Self Task" ? 0 : undefined}
              >
                {(task.activity || []).length ? (task.taskType === "Self Task" ? (
                  <div className="flex min-w-max items-start">
                    {[...task.activity].reverse().map((entry, index, arr) => (
                      <div key={entry._id} className="w-44 shrink-0 pr-2 text-xs">
                        <div className="flex items-center">
                          <span className="relative z-10 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-primary bg-background" />
                          {index < arr.length - 1 && <span className="h-px flex-1 bg-border" />}
                        </div>
                        <div className="mt-1.5 pr-2">
                          <p className="text-[11px] text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                          <p className="font-medium text-foreground">{entry.action}{entry.note ? ` — ${entry.note}` : ""}</p>
                          <p className="text-[11px] text-muted-foreground">by {entry.performedByName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : [...task.activity].reverse().map((entry, index, arr) => (
                  <div key={entry._id} className="relative flex gap-2.5 pb-3 text-xs last:pb-0">
                    {index < arr.length - 1 && (
                      <span className="absolute left-[5px] top-3 h-full w-px bg-border" />
                    )}
                    <span className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-primary bg-background" />
                    <div>
                      <p className="text-[11px] text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                      <p className="font-medium text-foreground">{entry.action}{entry.note ? ` — ${entry.note}` : ""}</p>
                      <p className="text-[11px] text-muted-foreground">by {entry.performedByName}</p>
                    </div>
                  </div>
                ))) : <p className="text-xs text-muted-foreground">No activity yet.</p>}
              </div>
            </div>

            {task.taskType !== "Self Task" && (
            <div className="flex h-64 flex-col overflow-hidden border-t border-border sm:col-span-2 sm:border-l sm:border-t-0">
              <p className="flex items-center gap-1 border-b border-border px-2.5 pb-2 pt-2.5 text-xs font-semibold text-foreground">
                <MessageSquare className="h-3.5 w-3.5" /> Discussion
              </p>
              <div ref={discussionListRef} className="flex flex-1 flex-col gap-2 overflow-y-auto bg-background px-2.5 py-2.5">
                {(task.discussion || []).length ? task.discussion.map((message) => {
                  const isOwn = currentEmployee && message.sender === currentEmployee._id;
                  const senderProfileImage = isOwn
                    ? currentEmployee?.profileImage
                    : message.sender === task.createdBy
                      ? task.createdByProfileImage
                      : task.assignedToProfileImage;
                  return (
                    <div key={message._id} className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarImage src={getAvatarUrl(senderProfileImage?.smallUrl)} alt={message.senderName} />
                        <AvatarFallback className="bg-muted text-[10px] font-semibold text-muted-foreground">
                          {getInitials(message.senderName) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex max-w-[75%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
                        <div
                          className={`rounded-2xl bg-blue-50 px-2.5 py-1.5 text-xs text-foreground shadow-sm dark:bg-blue-400/10 ${
                            isOwn ? "rounded-br-sm" : "rounded-bl-sm"
                          }`}
                        >
                          <p className="mb-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="font-semibold">{message.senderName}</span>
                            <span className="text-muted-foreground/70">{formatDateTime(message.sentAt)}</span>
                          </p>
                          {message.message && <p className="whitespace-pre-wrap break-words">{message.message}</p>}
                          {(message.attachments || []).map((file, index) => (
                            <a
                              key={file._id || index}
                              href={file.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 flex items-center gap-1 text-xs text-blue-700 underline-offset-2 hover:underline dark:text-blue-300"
                            >
                              <Paperclip className="h-3 w-3 shrink-0" />
                              <span className="truncate">{file.fileName || "Attachment"}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }) : <p className="py-6 text-center text-xs text-muted-foreground">No messages yet.</p>}
              </div>

              <div className="space-y-2 border-t border-border bg-muted/20 p-2">
                {isDiscussionLocked && (
                  <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    {isRejected ? "This request was rejected and is view-only." : `This task is completed and locked. ${isRequester ? "Click Rework above to reopen it and send messages." : "Ask the requester to reopen it via Rework to send messages."}`}
                  </p>
                )}
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
                  <label className={`cursor-pointer rounded-full p-1.5 text-muted-foreground hover:bg-muted ${isDiscussionLocked ? "pointer-events-none opacity-40" : ""}`}>
                    <Paperclip className="h-3.5 w-3.5" />
                    <input
                      type="file"
                      multiple
                      disabled={isDiscussionLocked}
                      className="hidden"
                      onChange={(event) => setDiscussionFiles((files) => [...files, ...Array.from(event.target.files || [])])}
                    />
                  </label>
                  <Input
                    ref={discussionInputRef}
                    value={discussionMessage}
                    onChange={(event) => setDiscussionMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSendDiscussion();
                      }
                    }}
                    placeholder={isDiscussionLocked ? (isRejected ? "This request was rejected and is view-only." : "This task is completed and locked.") : "Write an update or ask a question..."}
                    disabled={discussionMutation.isPending || isDiscussionLocked}
                    className="h-7 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" disabled={isDiscussionLocked} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-40">
                        <Smile className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-56 p-2">
                      <div className="grid grid-cols-8 gap-1">
                        {["😀","😂","😊","👍","🙏","🎉","❤️","🔥","✅","👌","😅","🤔","😢","👏","💯","🚀"].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="rounded-md p-1 text-lg hover:bg-muted"
                            onClick={() => setDiscussionMessage((value) => value + emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 shrink-0 gap-1.5 rounded-full bg-blue-600 px-3 text-xs hover:bg-blue-700"
                    onClick={handleSendDiscussion}
                    disabled={discussionMutation.isPending || isDiscussionLocked}
                  >
                    {discussionMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Send
                  </Button>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>

        {(task.isEscalated || showEscalationForm) && (
        <div ref={escalationSectionRef} className="space-y-1.5">
          <SectionHeader
            index={5}
            tone="orange"
            title="Escalation"
            trailing={
              !task.isEscalated && showEscalationForm ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowEscalationForm(false);
                    setEscalationType("");
                    setEscalationAction("");
                    setEscalationReason("");
                  }}
                  className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  <XCircle className="h-3 w-3" />
                  Cancel
                </button>
              ) : null
            }
          />
          {task.isEscalated ? (
            <div className="flex items-start gap-1.5 rounded-md border border-orange-200 bg-orange-50/60 px-2.5 py-1.5 text-[11px] text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>This task has been escalated to admin and is under review.</span>
            </div>
          ) : (
            <div className="space-y-2 rounded-md border border-orange-200 bg-orange-50/40 p-2 dark:border-orange-400/30 dark:bg-orange-400/10">
              <p className="text-[11px] text-orange-700 dark:text-orange-300">Escalation helps Admin resolve blockers faster.</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Escalation Type</Label>
                  <Select value={escalationType} onValueChange={setEscalationType} disabled={isLocked}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select escalation type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESCALATION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Requested Action</Label>
                  <Select value={escalationAction} onValueChange={setEscalationAction} disabled={isLocked}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select requested action" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESCALATION_REQUESTED_ACTIONS.map((action) => (
                        <SelectItem key={action} value={action}>{action}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Priority (Escalation)</Label>
                  <Select value={escalationPriority} onValueChange={setEscalationPriority} disabled={isLocked}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">Reason for Escalation <span className="text-red-600">*</span></Label>
                <Textarea
                  value={escalationReason}
                  onChange={(event) => setEscalationReason(event.target.value)}
                  maxLength={500}
                  disabled={isLocked}
                  placeholder="Explain why admin intervention is required..."
                  className="h-20 min-h-20 resize-none text-xs"
                />
                <p className="text-right text-[10px] text-muted-foreground">{escalationReason.length}/500</p>
              </div>
              <p className="flex items-center gap-1.5 text-[11px] text-orange-700 dark:text-orange-300">
                <Info className="h-3.5 w-3.5 shrink-0" />
                Your escalation will be reviewed by Admin and you will be notified.
              </p>
            </div>
          )}
        </div>
        )}
      </div>
      </div>

      <DialogFooter className="flex-row items-center justify-between sm:justify-between border-t border-border p-3">
        {hideEscalateButton ? <div /> : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-400/40"
          disabled={task.isEscalated || isLocked || escalateMutation.isPending}
          onClick={() => {
            if (!showEscalationForm) {
              setShowEscalationForm(true);
              requestAnimationFrame(() => {
                escalationSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
              return;
            }
            if (!escalationType || !escalationAction || !escalationReason.trim()) {
              toast.error("Fill in escalation type, requested action, and reason");
              return;
            }
            escalateMutation.mutate(
              {
                taskId: task.taskId || task._id,
                escalationType,
                requestedAction: escalationAction,
                priority: escalationPriority,
                reason: escalationReason.trim(),
              },
              {
                onSuccess: () => {
                  setShowEscalationForm(false);
                  setEscalationType("");
                  setEscalationAction("");
                  setEscalationReason("");
                  onClose();
                },
              }
            );
          }}
        >
          {escalateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
          {task.isEscalated ? "Escalated" : showEscalationForm ? "Submit Escalation" : "Escalate to Admin"}
        </Button>
        )}
        <div className="flex justify-end gap-2">
          {(isRequester || isHigherHierarchyRecipient) && task.taskType === "Work Request" && status !== "Completed" && !isRejected && !isPendingAcceptance && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400/40"
              disabled={reviewTaskMutation.isPending || updateProgressMutation.isPending || !canParticipantMarkCompleted}
              title={!canParticipantMarkCompleted ? "Available after the task is submitted" : undefined}
              onClick={handleMarkAsCompleted}
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark As Completed
            </Button>
          )}
          {isRequester && !isPendingAcceptance && !isRejected ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-400/40"
                disabled={reviewTaskMutation.isPending}
                onClick={() => {
                  reviewTaskMutation.mutate(
                    { taskId: task.taskId || task._id, decision: "rework" },
                    {
                      onSuccess: (response) => {
                        const updated = response.data?.data?.task;
                        setStatus(updated?.status || "Rework");
                        setProgressPercent(updated?.progressPercent ?? 0);
                        onClose();
                      },
                    }
                  );
                }}
              >
                <RotateCcw className="h-4 w-4" />
                Rework
              </Button>
            </>
          ) : isRequester && isPendingAcceptance ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 text-red-600"
              disabled={withdrawMutation.isPending}
              onClick={() => withdrawMutation.mutate(task.taskId || task._id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Withdraw Request
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          )}
          {(isRecipient || isRequester) && !isWorkLocked && (
            <Button type="button" size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={handleSaveUpdate} disabled={updateProgressMutation.isPending}>
              {updateProgressMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Update
            </Button>
          )}
        </div>
      </DialogFooter>
    </div>
  );
}

