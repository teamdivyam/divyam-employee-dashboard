/* eslint-disable react/prop-types */
import { useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';

import { Button } from '@components/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';

const splitCsvRow = (line) => {
  const values = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { values.push(value.trim()); value = ''; }
    else value += char;
  }
  values.push(value.trim());
  return values;
};
const normalizedHeader = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const truthy = (value) => ['yes', 'true', '1', 'y'].includes(String(value || '').trim().toLowerCase());

export default function EventGuestImportDialog({ open, onOpenChange, functions, saving, onImport }) {
  const [file, setFile] = useState(null);
  const submit = async (event) => {
    event.preventDefault();
    if (!file) return;
    const lines = (await file.text()).split(/\r?\n/).filter((line) => line.trim());
    const headers = splitCsvRow(lines.shift() || '').map(normalizedHeader);
    const functionMap = new Map(functions.map((item) => [item.name.toLowerCase(), String(item._id)]));
    const records = lines.map((line) => {
      const values = splitCsvRow(line);
      const row = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
      const needs = String(row.hospitalityneeds || row.needs || '').split('|').map((value) => value.trim()).filter(Boolean);
      if (truthy(row.vip) && !needs.includes('VIP')) needs.push('VIP');
      if (truthy(row.stayrequired || row.stay) && !needs.includes('Stay')) needs.push('Stay');
      return {
        name: row.name || row.guestfamily || row.guest,
        contact: row.contact || row.phone || undefined,
        email: row.email || undefined,
        memberCount: Math.max(1, Number(row.members || row.membercount || 1)),
        functions: String(row.functions || '').split('|').map((name) => functionMap.get(name.trim().toLowerCase())).filter(Boolean),
        rsvpStatus: ['Pending', 'Confirmed', 'Declined', 'Maybe'].find((status) => status.toLowerCase() === String(row.rsvp || row.rsvpstatus).toLowerCase()) || 'Pending',
        hospitalityNeeds: needs,
        isVip: needs.includes('VIP'),
        stayRequired: needs.includes('Stay'),
        transportRequired: needs.some((need) => /pickup|drop|transport|transfer/i.test(need)),
        notes: row.notes || undefined,
      };
    }).filter((row) => row.name);
    onImport(records);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { onOpenChange(value); if (!value) setFile(null); }}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-border bg-blue-50/70 px-5 py-4 pr-12 text-left"><DialogTitle className="flex items-center gap-3 text-lg"><span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-100 text-blue-700"><FileUp className="h-4 w-4" /></span>Import Guest List</DialogTitle><DialogDescription className="text-xs">Upload a CSV file to add several guest records together.</DialogDescription></DialogHeader>
        <form id="guest-import-form" onSubmit={submit} className="space-y-4 p-5"><div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-[11px] leading-5 text-blue-800"><strong>Columns:</strong> name, contact, email, members, functions, rsvp, hospitalityNeeds, vip, stayRequired, notes. Separate multiple functions or needs with <strong>|</strong>.</div><div className="space-y-1.5"><Label className="text-xs font-semibold">CSV File</Label><Input type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] || null)} /></div></form>
        <DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3 sm:space-x-0"><Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="guest-import-form" size="sm" disabled={saving || !file} className="min-w-28 bg-blue-600 hover:bg-blue-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Import Guests</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
