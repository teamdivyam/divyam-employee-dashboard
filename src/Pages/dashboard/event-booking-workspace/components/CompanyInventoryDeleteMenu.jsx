import { useState } from "react";
import PropTypes from "prop-types";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@components/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@components/components/ui/alert-dialog";
import EventDeleteMenu from "./EventDeleteMenu";
import { canEditAllocationRequirements } from "../../Inventory/Essentials/allocationEditAccess";
import { allocationLinePayload, allocationVersion } from "../../Inventory/Essentials/allocationAmendment";

export default function CompanyInventoryDeleteMenu({ line, service, disabled, onDeleted }) {
  const [open, setOpen] = useState(false);
  const deletion = useMutation({
    retry: false,
    mutationFn: async () => {
      const { allocationId, allocationLineId } = line.ownership;
      const response = await service.getInventoryV2AllocationById(allocationId);
      const current = response.data?.data;
      if (!current || current._id !== allocationId || current.updatedAt !== line.owningAllocation.updatedAt) {
        throw new Error("The allocation has changed. Refresh before deleting.");
      }
      if (!service.canUpdateAllocations || !canEditAllocationRequirements(current, service.accessRole)) {
        throw new Error("This allocation is locked or you do not have permission to delete its requirements.");
      }
      if (!current.items.some(item => item._id === allocationLineId && item.status !== "Cancelled")) {
        throw new Error("This requirement is no longer available. Refresh before deleting.");
      }
      return service.updateInventoryV2Allocation(allocationId, {
        ...allocationVersion(current),
        items: current.items.filter(item => item.status !== "Cancelled" && item._id !== allocationLineId).map(allocationLinePayload),
      });
    },
    onSuccess: async () => {
      setOpen(false);
      toast.success("Company inventory requirement deleted");
      await onDeleted();
    },
    onError: error => toast.error(error?.response?.data?.message || error.message || "Unable to delete requirement"),
  });
  return <>
    <EventDeleteMenu label={line.itemName || "inventory item"} onDelete={() => setOpen(true)} disabled={disabled || deletion.isPending} />
    <AlertDialog open={open} onOpenChange={next => { if (!deletion.isPending) setOpen(next); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete inventory requirement?</AlertDialogTitle>
          <AlertDialogDescription>Remove {line.itemName || "this item"} from this event’s company inventory allocation?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletion.isPending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={deletion.isPending} onClick={() => deletion.mutate()}>{deletion.isPending ? "Deleting..." : "Delete"}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}

CompanyInventoryDeleteMenu.propTypes = {
  line: PropTypes.object.isRequired,
  service: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
  onDeleted: PropTypes.func.isRequired,
};
