/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Loader2, UsersRound } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';

const idOf = (value) => String(value?._id || value || '');
const numberValue = (value) => Math.max(0, Number(value || 0));

export default function EventGuestCountsDialog({ open, onOpenChange, functions, saving, onSave }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (open) setRows(functions.map((item) => ({
      functionId: idOf(item),
      name: item.name,
      guestCount: item.guestCount ?? 0,
      confirmedGuestCount: item.confirmedGuestCount ?? 0,
      vipGuestCount: item.vipGuestCount ?? 0,
    })));
  }, [functions, open]);

  const update = (index, field, value) => setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  const submit = (event) => {
    event.preventDefault();
    onSave(rows.map((row) => ({
      functionId: row.functionId,
      guestCount: numberValue(row.guestCount),
      confirmedGuestCount: numberValue(row.confirmedGuestCount),
      vipGuestCount: numberValue(row.vipGuestCount),
    })));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-border bg-emerald-50/70 px-5 py-4 pr-12 text-left dark:bg-emerald-400/5">
          <DialogTitle className="flex items-center gap-3 text-lg"><span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700"><UsersRound className="h-4 w-4" /></span>Update Guest Counts</DialogTitle>
          <DialogDescription className="text-xs">Update estimated, confirmed and VIP attendance for each function.</DialogDescription>
        </DialogHeader>
        <form id="event-guest-counts-form" onSubmit={submit} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
          {rows.length ? rows.map((row, index) => <div key={row.functionId} className="rounded-lg border border-border p-3"><p className="mb-3 text-sm font-semibold text-foreground">{row.name}</p><div className="grid grid-cols-3 gap-3"><Field label="Estimated"><Input type="number" min="0" value={row.guestCount} onChange={(event) => update(index, 'guestCount', event.target.value)} /></Field><Field label="Confirmed"><Input type="number" min="0" value={row.confirmedGuestCount} onChange={(event) => update(index, 'confirmedGuestCount', event.target.value)} /></Field><Field label="VIP"><Input type="number" min="0" value={row.vipGuestCount} onChange={(event) => update(index, 'vipGuestCount', event.target.value)} /></Field></div></div>) : <p className="rounded-lg border border-dashed p-5 text-center text-xs text-muted-foreground">Add functions before managing guest counts.</p>}
        </form>
        <DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:space-x-0"><Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="event-guest-counts-form" size="sm" disabled={saving || !rows.length} className="min-w-28 bg-blue-600 hover:bg-blue-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save Counts</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) {
  return <div className="space-y-1.5"><Label className="text-[11px] font-semibold">{label}</Label>{children}</div>;
}
