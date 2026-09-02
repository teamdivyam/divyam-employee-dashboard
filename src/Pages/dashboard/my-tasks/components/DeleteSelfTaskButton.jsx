import { useState } from "react";
import PropTypes from "prop-types";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@components/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@components/components/ui/alert-dialog";
export default function DeleteSelfTaskButton({ task, currentEmployeeId, mutation }) {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const creatorId = task?.createdBy?._id || task?.createdBy?.id || task?.createdBy;
  const isOwnSelfTask = task?.taskType === "Self Task"
    && Boolean(creatorId && currentEmployeeId)
    && String(creatorId) === String(currentEmployeeId);
  const isRejectedTaskAssigner = task?.status === "Rejected"
    && Boolean(creatorId && currentEmployeeId)
    && String(creatorId) === String(currentEmployeeId);
  const canDelete = isOwnSelfTask || isRejectedTaskAssigner;

  if (!canDelete) return null;

  const taskId = task.taskId || task._id;
  const actionLabel = isRejectedTaskAssigner ? "Withdraw" : "Delete Task";
  const pendingLabel = isRejectedTaskAssigner ? "Withdrawing..." : "Deleting...";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-400/40 dark:hover:bg-red-400/10"
        disabled={mutation.isPending}
        onClick={() => setConfirmationOpen(true)}
      >
        {mutation.isPending
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Trash2 className="h-4 w-4" />}
        {actionLabel}
      </Button>

      <AlertDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRejectedTaskAssigner ? "Withdraw this rejected task?" : "Delete this self task?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {task.taskId || task.taskTitle} will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(taskId, {
                onSuccess: () => setConfirmationOpen(false),
              })}
            >
              {mutation.isPending ? pendingLabel : actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

DeleteSelfTaskButton.propTypes = {
  task: PropTypes.shape({
    _id: PropTypes.string,
    taskId: PropTypes.string,
    taskTitle: PropTypes.string,
    taskType: PropTypes.string,
    status: PropTypes.string,
    createdBy: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ _id: PropTypes.string, id: PropTypes.string }),
    ]),
  }).isRequired,
  currentEmployeeId: PropTypes.string,
  mutation: PropTypes.shape({
    isPending: PropTypes.bool,
    mutate: PropTypes.func.isRequired,
  }).isRequired,
};
