/* eslint-disable react/prop-types */
import { ExternalLink, FileText, Loader2 } from 'lucide-react';

import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { approvalStatuses, approvalStatusTone } from '../eventApproval.utils';

export default function EventApprovalDetailDialog({ open, onOpenChange, item, status, onStatusChange, saving }) {
  if (!item) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-orange-100 bg-orange-50/70 px-5 py-4 pr-12 text-left dark:bg-orange-400/5"><DialogTitle className="text-lg">{item.title}</DialogTitle><DialogDescription className="text-xs">Review the client approval request and update its current status.</DialogDescription></DialogHeader>
        <div className="space-y-4 p-5">
          <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2">
            <div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Type</p><p className="mt-1 text-xs font-semibold">{item.approvalType || 'Other'}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Current Status</p><Badge variant="outline" className={`mt-1 text-[10px] ${approvalStatusTone(item.status)}`}>{item.status || 'Pending'}</Badge></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Shared By</p><p className="mt-1 text-xs font-semibold">{item.sharedByName || 'Admin'}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Coverage</p><p className="mt-1 text-xs font-semibold">{item.appliesToLabel || 'Selected functions'}</p></div>
          </div>
          {item.reference?.fileUrl ? <a href={item.reference.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted/40"><span className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><FileText className="h-4 w-4" /></span><span className="min-w-0"><span className="block truncate text-xs font-semibold">{item.reference.fileName || 'Open reference'}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">{item.reference.fileType || 'Reference file'}</span></span></span><ExternalLink className="h-4 w-4 shrink-0 text-blue-600" /></a> : null}
          {item.notes ? <div><p className="text-xs font-semibold">Notes</p><p className="mt-1 rounded-lg bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">{item.notes}</p></div> : null}
          <div className="space-y-1.5"><Label className="text-xs font-semibold">Update Status</Label><Select value={status} onValueChange={onStatusChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{approvalStatuses.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:space-x-0"><Button variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Close</Button><Button size="sm" disabled={saving || status === item.status} onClick={() => onStatusChange(status, true)} className="min-w-28 bg-orange-600 hover:bg-orange-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save Status</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
