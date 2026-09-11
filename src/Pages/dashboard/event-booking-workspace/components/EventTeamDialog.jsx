/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Textarea } from '@components/components/ui/textarea';

const roles = ['Event Manager', 'Client Coordination Lead', 'Inventory Lead', 'Finance Contact', 'Hospitality Lead', 'Operations Lead', 'Other'];

export default function EventTeamDialog({ open, onOpenChange, employees = [], assignedIds = [], saving, onSave }) {
  const [employee, setEmployee] = useState('');
  const [role, setRole] = useState('Operations Lead');
  const [responsibility, setResponsibility] = useState('');
  useEffect(() => { if (open) { setEmployee(''); setRole('Operations Lead'); setResponsibility(''); } }, [open]);
  const availableEmployees = employees.filter((item) => !assignedIds.includes(String(item._id)));

  const submit = (event) => {
    event.preventDefault();
    onSave({ employee, role, responsibility: responsibility.trim(), accessSections: ['overview', 'functions', 'tasks', 'team'], actionPermissions: ['view_event', 'view_tasks', 'start_task', 'update_task_status', 'view_team_contacts'] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden p-0">
        <form onSubmit={submit}>
          <DialogHeader className="border-b border-border bg-violet-50/60 px-6 py-4"><DialogTitle>Manage Event Team</DialogTitle><DialogDescription>Add an employee to this event&apos;s core team.</DialogDescription></DialogHeader>
          <div className="space-y-4 p-6">
            <div className="space-y-1.5"><Label>Employee *</Label><Select required value={employee} onValueChange={setEmployee}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{availableEmployees.length ? availableEmployees.map((item) => <SelectItem key={item._id} value={String(item._id)}>{item.name}{item.designation ? ` — ${item.designation}` : ''}</SelectItem>) : <SelectItem value="none" disabled>All employees are assigned</SelectItem>}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Event role *</Label><Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roles.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Responsibility</Label><Textarea rows={3} value={responsibility} onChange={(event) => setResponsibility(event.target.value)} placeholder="Describe this member's event responsibility" /></div>
          </div>
          <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={saving || !employee} className="gap-2 bg-blue-600 hover:bg-blue-700">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}Add Team Member</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
