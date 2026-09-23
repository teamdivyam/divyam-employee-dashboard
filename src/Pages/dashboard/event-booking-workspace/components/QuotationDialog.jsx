/* eslint-disable react/prop-types */
import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import AdminService from '../../../../services/event-booking-workspace.service';
import { functionFormValues, functionPayload } from '@/validator/event-function.validator';
import { serviceFormValues, servicePayload } from '@/validator/event-service.validator';
import quotationCelebration from '../assets/quotation-celebration.png';
import { differenceInCalendarDays } from 'date-fns';
import { Eye, FileText, Plus, Trash2, Loader2, IndianRupee, CalendarDays, Settings2, Phone, ContactRound, MapPin, PartyPopper, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@components/components/ui/dialog';
import { Button } from '@components/components/ui/button';
import { Input } from '@components/components/ui/input';
import { Textarea } from '@components/components/ui/textarea';
import { Label } from '@components/components/ui/label';
import { Checkbox } from '@components/components/ui/checkbox';
import { Switch } from '@components/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@components/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Badge } from '@components/components/ui/badge';
import { bookingCode, customerPhone, eventDateLabel, initials } from '../eventBookingDashboard.utils';
import { Avatar, AvatarFallback } from '@components/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './EventTable';
import { quotationForm, quotationPrice, quotationSchema, quotationPatch, emptyLine, roundMoney } from '../quotation.utils';
import QuotationPdfPreview from './QuotationPdfPreview';
import { currency } from '../eventFinance.utils';

function syncServiceRows(current, selectedIds, options) {
  const names = [...new Set(options.filter((service) => selectedIds.includes(service.id)).map((service) => service.label))];
  const lineItems = current.lineItems.filter((row) => names.includes(row.item));
  names.forEach((name) => {
    if (!lineItems.some((row) => row.item === name)) lineItems.push({ ...emptyLine(), item: name });
  });
  return { ...current, services: selectedIds, lineItems: lineItems.length ? lineItems : [emptyLine()] };
}

function OptionBoxes({ label, options, value, onChange, disabled, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const add = async () => {
    if (!name.trim() || busy) return;
    setBusy(true); setError('');
    try { await onAdd(name.trim()); setName(''); setAdding(false); }
    catch (failure) { setError(failure.response?.data?.message || failure.message || 'Unable to add option.'); }
    finally { setBusy(false); }
  };
  return <div className="space-y-2 rounded-md border border-border p-2">
    <div className="flex flex-wrap gap-2">{options.map((option) => <Button key={option.id} type="button" size="sm" variant="outline" disabled={disabled || busy} aria-pressed={value.includes(option.id)} className={`h-8 text-xs ${value.includes(option.id) ? 'border-primary bg-primary/10 text-primary' : ''}`} onClick={() => onChange(value.includes(option.id) ? value.filter((id) => id !== option.id) : [...value, option.id])}>{option.label}</Button>)}
      {!disabled && <Button type="button" size="sm" variant="ghost" disabled={busy} className="h-8 gap-1 text-xs text-primary" onClick={() => setAdding(true)}><Plus className="h-3 w-3" />Add</Button>}
    </div>
    {adding && <div className="space-y-1"><div className="flex gap-2"><Input aria-label={`Custom ${label}`} placeholder={`Enter custom ${label.toLowerCase()}`} value={name} disabled={disabled || busy} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} className="h-8 text-xs" /><Button type="button" size="sm" disabled={disabled || busy || !name.trim()} onClick={add}>{busy ? 'Adding...' : 'Add'}</Button><Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => { setAdding(false); setError(''); }}>Cancel</Button></div><p className="text-[10px] text-muted-foreground">Added to this event and selected for the quotation.</p></div>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}
function FunctionDropdown({ options, value, onChange, disabled, label }) {
  const triggerRef = useRef(null);
  return <Popover><PopoverTrigger asChild><Button ref={triggerRef} type="button" variant="outline" disabled={disabled} aria-label={label} className="h-8 w-36 justify-between text-[10px]"><span className="truncate">{value.length ? options.filter((item) => value.includes(item.id)).map((item) => item.label).join(', ') : 'Select functions'}</span><ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" /></Button></PopoverTrigger><PopoverContent container={triggerRef.current?.closest('[role="dialog"]')} align="start" className="max-h-56 overflow-y-auto p-2">{options.length ? options.map((item) => <label key={item.id} className="flex items-center gap-2 rounded p-2 text-xs hover:bg-muted"><Checkbox checked={value.includes(item.id)} onCheckedChange={(checked) => onChange(checked ? [...value, item.id] : value.filter((id) => id !== item.id))} />{item.label}</label>) : <p className="p-2 text-xs text-muted-foreground">Select quotation functions first.</p>}</PopoverContent></Popover>;
}
function Section({ title, description, icon: Icon, children, action }) {
  return <section className="rounded-md border border-border bg-card p-3"><div className="mb-2 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="rounded bg-amber-600/10 p-1.5 text-amber-700 dark:text-amber-300"><Icon className="h-4 w-4" /></span><div><h3 className="text-xs font-semibold">{title}</h3><p className="text-[10px] text-muted-foreground">{description}</p></div></div>{action}</div>{children}</section>;
}
export default function QuotationDialog({ booking, record, readOnly = false, initialPreview = false, onClose, onSave, saving }) {
  const [form, setForm] = useState(() => quotationForm(record));
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(initialPreview);
  const queryClient = useQueryClient();
  const [customOptions, setCustomOptions] = useState({ functions: [], servicesSelected: [] });
  const [addingOption, setAddingOption] = useState(false);
  const addOption = async (kind, name) => {
    const field = 'name';
    const existing = [...(booking?.[kind] || []), ...customOptions[kind]].find((item) => String(item.name || item.service || '').toLowerCase() === name.toLowerCase());
    if (existing) { update(kind === 'functions' ? 'functions' : 'services', Array.from(new Set([...(kind === 'functions' ? form.functions : form.services), existing._id]))); return; }
    setAddingOption(true);
    try {
      const payload = kind === 'functions' ? await functionPayload(functionFormValues({ [field]: name }), {}, false) : await servicePayload(serviceFormValues({ [field]: name }), {}, false);
      const response = await (kind === 'functions' ? AdminService.addEventFunction : AdminService.addEventService)({ eventId: booking._id, ...payload });
      const event = response.data?.event || (await AdminService.getEventBookingDetail({ eventId: booking._id })).data?.event;
      const created = event?.[kind]?.find((item) => String(item.name || item.service || '').toLowerCase() === name.toLowerCase());
      if (!created?._id) throw new Error('Option saved but could not be loaded. Reopen this dialog to refresh event options.');
      setCustomOptions((current) => ({ ...current, [kind]: [...current[kind], created] }));
      const key = kind === 'functions' ? 'functions' : 'services';
      setForm((current) => {
        const selectedIds = [...new Set([...current[key], created._id])];
        if (key === 'services') {
          const label = typeof created.service === 'string' ? created.service : created.service?.name || created.name || name;
          return syncServiceRows(current, selectedIds, [...services, { id: created._id, label }]);
        }
        return { ...current, [key]: selectedIds };
      });
      await Promise.all(['event-booking-detail', 'event-bookings', 'event-booking-analytics'].map((key) => queryClient.invalidateQueries({ queryKey: key === 'event-booking-detail' ? [key, booking._id] : [key] })));
    } finally { setAddingOption(false); }
  };
  const functions = useMemo(() => Array.from(new Map([...(booking?.functions || []), ...customOptions.functions].map((item) => [item._id, item])).values()).filter((item) => item._id).map((item) => ({ id: item._id, label: item.name || 'Function' })), [booking, customOptions.functions]);
  const services = useMemo(() => Array.from(new Map([...(booking?.servicesSelected || []), ...customOptions.servicesSelected].map((item) => [item._id, item])).values()).filter((item) => item._id).map((item) => ({ id: item._id, label: typeof item.service === 'string' ? item.service : item.service?.name || item.name || 'Service' })), [booking, customOptions.servicesSelected]);
  const price = useMemo(() => readOnly && record?.priceSummary ? record.priceSummary : quotationPrice(form), [readOnly, record, form]);
  const selectedServiceNames = [...new Set(services.filter((service) => form.services.includes(service.id)).map((service) => service.label))];
  const update = (key, value) => setForm((current) => {
    if (key !== 'services') return { ...current, [key]: value };
    return syncServiceRows(current, value, services);
  });
  const updateLine = (index, key, value) => update('lineItems', form.lineItems.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const field = (label, key, props = {}) => <div className="space-y-1"><Label htmlFor={`quotation-${key}`} className="text-[10px]">{label}{props.required && <span className="text-destructive"> *</span>}</Label><Input id={`quotation-${key}`} className="h-8 text-[11px]" value={form[key]} onChange={(event) => update(key, event.target.value)} {...props} /></div>;
  const submit = async (event) => {
    event.preventDefault(); if (saving || readOnly || addingOption) return;
    try {
      const payload = await quotationSchema.validate(form, { abortEarly: false });
      const validFunctions = new Set(functions.map((item) => item.id));
      const validServices = new Set(services.map((item) => item.id));
      if (payload.functions.some((id) => !validFunctions.has(id)) || payload.services.some((id) => !validServices.has(id))) throw new Error('Select functions and services from this event.');
      if (payload.lineItems.some((row) => row.appliesTo.some((id) => !payload.functions.includes(id)))) throw new Error('Line items must apply only to selected functions.');
      payload.lineItems = payload.lineItems.map((row) => ({ ...row, quantity: Math.round(row.quantity * 1000) / 1000, rate: roundMoney(row.rate) }));
      if (payload.lineItems.some((row) => row.quantity <= 0)) throw new Error('Quantity must be at least 0.001.');
      payload.discount.value = roundMoney(payload.discount.value); payload.gstRate = roundMoney(payload.gstRate);
      const totals = quotationPrice(payload);
      if (payload.discount.type === 'Percentage' && payload.discount.value > 100 || totals.discountAmount > totals.subtotal) throw new Error('Discount cannot exceed the subtotal or 100%.');
      const changes = record ? quotationPatch(quotationForm(record), payload) : payload;
      if (!Object.keys(changes).length) { onClose(); return; }
      setError(''); await onSave(changes); onClose();
    } catch (failure) { setError(failure.errors?.join(' ') || failure.response?.data?.message || failure.message || 'Unable to save quotation.'); }
  };
  const previewInput = useMemo(() => ({ form, record, booking, functions, services, price }), [form, record, booking, functions, services, price]);
  const client = booking?.customer?.name || booking?.clientName || 'Client';
  return <Dialog open onOpenChange={(open) => !open && !saving && !addingOption && onClose()}><DialogContent className="max-h-[94dvh] max-w-6xl gap-0 overflow-hidden p-0">
    <form className="flex max-h-[94dvh] min-h-0 flex-col" onSubmit={submit} noValidate>
      <DialogHeader className="flex-row items-center justify-between gap-3 border-b p-3 pr-12 text-left"><div><DialogTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5 text-amber-700 dark:text-amber-300" />{readOnly ? 'View Quotation' : record ? 'Edit Quotation' : 'Create Quotation'}</DialogTitle><DialogDescription className="mt-1 text-[10px]">Prepare a professional quotation for your client.</DialogDescription></div><Button type="button" variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setPreview(!preview)}><Eye className="h-4 w-4" />{preview ? 'Back to Details' : 'Preview Quotation'}</Button></DialogHeader>
      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 p-3">
        <div className="relative mb-3 flex min-h-28 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="relative z-10 flex min-w-0 flex-1 items-center gap-4 p-4">
            <Avatar className="h-16 w-16 shrink-0 rounded-md">
              <AvatarFallback className="rounded-md bg-violet-50 text-xl font-semibold text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">{initials(client)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-sm font-bold text-foreground sm:text-base">{client}</p>
                {booking?.bookingStatus && <Badge variant="secondary" className="rounded border-0 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{booking.bookingStatus}</Badge>}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
                {[
                  [Phone, customerPhone(booking || {})],
                  [ContactRound, bookingCode(booking || {})],
                  [CalendarDays, eventDateLabel(booking || {}, { includeWeekday: true })],
                  [PartyPopper, booking?.eventType || 'Event'],
                ].map(([Icon, value], index) => <span key={index} className="inline-flex items-center gap-1.5 sm:border-r sm:border-border sm:pr-3 sm:last:border-0 sm:last:pr-0"><Icon className="h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />{value}</span>)}
              </div>
              <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />{[booking?.venue, booking?.city].filter(Boolean).join(', ') || 'Venue not set'}</p>
            </div>
          </div>
          <div className="relative hidden w-72 shrink-0 overflow-hidden bg-amber-50 lg:block dark:bg-amber-950/20" aria-hidden="true">
            <img src={quotationCelebration} alt="" className="absolute inset-0 h-full w-full object-cover object-right" />
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-transparent" />
            <div className="relative flex h-full flex-col justify-center pl-5 font-serif text-stone-700 dark:text-stone-200">
              <p className="text-sm uppercase leading-5 tracking-widest">Memorable<br />Celebrations</p>
              <p className="mt-1 text-[9px] uppercase tracking-widest">Beautifully planned</p>
            </div>
          </div>
        </div>
        {error && <p role="alert" className="mb-3 rounded border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">{error}</p>}
        {preview ? <QuotationPdfPreview input={previewInput} /> : <fieldset disabled={readOnly || saving || addingOption} className="min-w-0 space-y-3">
          <Section title="1. Quotation Details" description="Set the basic details for this quotation." icon={FileText}><div className="grid gap-3 sm:grid-cols-4">{record && <div><Label className="text-[10px]">Quotation No.</Label><Input readOnly value={record.quotationNo} className="h-8 bg-muted text-[11px]" /></div>}{field('Quotation Title', 'quotationTitle', { required: true, maxLength: 200 })}<div><Label className="text-[10px]">Quotation Type *</Label><Select value={form.quotationType} onValueChange={(value) => update('quotationType', value)} disabled={readOnly || saving || addingOption}><SelectTrigger aria-label="Quotation Type" className="h-8 text-[11px]"><SelectValue /></SelectTrigger><SelectContent>{Array.from(new Set(['Main Booking', 'Revised Quotation', 'Additional Service', form.quotationType])).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>{record && <div><Label className="text-[10px]">Version</Label><Input readOnly value={`v${record.version}`} className="h-8 bg-muted text-[11px]" /></div>}{field('Issue Date', 'issueDate', { type: 'date', required: true })}{field('Valid Until', 'validUntil', { type: 'date', min: form.issueDate, required: true })}<p className="self-end py-2 text-[10px] text-muted-foreground">{differenceInCalendarDays(new Date(form.validUntil), new Date(form.issueDate)) || 0} days validity</p></div></Section>
          <Section title="2. Functions & Services" description="Select the functions and services included in this quotation." icon={CalendarDays}><div className="grid gap-3 sm:grid-cols-2"><div><Label className="text-[10px]">Functions *</Label><OptionBoxes onAdd={(name) => addOption('functions', name)} label="Functions" options={functions} value={form.functions} disabled={readOnly || saving || addingOption} onChange={(value) => setForm((current) => ({ ...current, functions: value, lineItems: current.lineItems.map((row) => ({ ...row, appliesTo: row.appliesTo.filter((id) => value.includes(id)) })) }))} /></div><div><Label className="text-[10px]">Services *</Label><OptionBoxes onAdd={(name) => addOption('servicesSelected', name)} label="Services" options={services} value={form.services} disabled={readOnly || saving || addingOption} onChange={(value) => update('services', value)} /></div><div className="sm:col-span-2"><Label htmlFor="quotation-scope" className="text-[10px]">Scope / Description *</Label><Textarea id="quotation-scope" maxLength={1000} value={form.scope} onChange={(event) => update('scope', event.target.value)} className="min-h-14 text-xs" /><p className="text-right text-[10px] text-muted-foreground">{form.scope.length}/1000</p></div></div></Section>
          <div className="grid gap-3 lg:grid-cols-3"><div className="min-w-0 lg:col-span-2"><Section title="3. Commercials" description="Add the services and pricing details for this quotation." icon={IndianRupee} action={<Button type="button" variant="custom" size="sm" className="h-7 gap-1 text-[10px]" disabled={form.lineItems.length >= 100 || readOnly || saving} onClick={() => update('lineItems', [...form.lineItems, emptyLine()])}><Plus className="h-3 w-3" />Add Line Item</Button>}><div className="overflow-x-auto"><Table className="min-w-[620px] text-[10px]"><TableHeader><TableRow>{['#', 'Item / Service *', 'Applies To *', 'Qty *', 'Unit *', 'Rate *', 'Amount', 'Action'].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{form.lineItems.map((row, index) => <TableRow key={index}><TableCell>{index + 1}</TableCell><TableCell><Select value={row.item} onValueChange={(value) => updateLine(index, 'item', value)} disabled={readOnly || saving || addingOption || !selectedServiceNames.length}><SelectTrigger aria-label={`Item / Service ${index + 1}`} className="h-8 min-w-36 text-[10px]"><SelectValue placeholder={selectedServiceNames.length ? 'Select service' : 'Select services above'} /></SelectTrigger><SelectContent>{row.item && !selectedServiceNames.includes(row.item) && <SelectItem value={row.item} disabled>{row.item}</SelectItem>}{selectedServiceNames.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select></TableCell><TableCell><FunctionDropdown label={`Applies to item ${index + 1}`} options={functions.filter((item) => form.functions.includes(item.id))} value={row.appliesTo} disabled={readOnly || saving || addingOption} onChange={(value) => updateLine(index, 'appliesTo', value)} /></TableCell>{['quantity', 'unit', 'rate'].map((key) => <TableCell key={key}><Input aria-label={`${key} for item ${index + 1}`} type={key === 'unit' ? 'text' : 'number'} min={key === 'quantity' ? '0.001' : '0'} step={key === 'quantity' ? '0.001' : '0.01'} max={key === 'quantity' ? 1000000 : key === 'rate' ? 100000000 : undefined} maxLength={key === 'unit' ? 50 : undefined} value={row[key]} onChange={(event) => updateLine(index, key, event.target.value)} className="h-7 w-20 text-[10px]" /></TableCell>)}<TableCell>{currency(Number(row.quantity) * Number(row.rate))}</TableCell><TableCell><Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" aria-label={`Remove item ${index + 1}`} disabled={form.lineItems.length === 1} onClick={() => update('lineItems', form.lineItems.filter((_, i) => i !== index))}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell></TableRow>)}</TableBody></Table></div></Section></div>
          <Section title="Price Summary" description="" icon={IndianRupee}><div className="space-y-3 text-xs"><div className="flex justify-between"><span>Subtotal</span><strong>{currency(price.subtotal)}</strong></div><div className="flex flex-wrap items-center gap-2"><Label className="text-[10px]">Discount</Label><Select value={form.discount.type} disabled={readOnly || saving || addingOption} onValueChange={(type) => update('discount', { ...form.discount, type })}><SelectTrigger aria-label="Discount type" className="h-7 w-28 text-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Percentage">Percentage</SelectItem><SelectItem value="Fixed">Fixed</SelectItem></SelectContent></Select><Input aria-label="Discount value" type="number" min="0" step="0.01" value={form.discount.value} onChange={(event) => update('discount', { ...form.discount, value: event.target.value })} className="h-7 w-16 text-[10px]" /><strong className="ml-auto whitespace-nowrap text-right">- {currency(price.discountAmount)}</strong></div><div className="flex justify-between"><span>Taxable Value</span><strong>{currency(price.taxableValue)}</strong></div><div className="flex items-center justify-between gap-2"><Label htmlFor="quotation-gst" className="text-[10px]">GST (%)</Label><Input id="quotation-gst" type="number" min="0" max="100" step="0.01" value={form.gstRate} onChange={(event) => update('gstRate', event.target.value)} className="h-7 w-16 text-[10px]" /><strong>{currency(price.gstAmount)}</strong></div><div className="flex justify-between rounded bg-amber-600/10 p-2 font-semibold"><span>Final Quotation Value</span><span>{currency(price.finalQuotationValue)}</span></div></div></Section></div>
          <div className="grid gap-3 lg:grid-cols-5"><div className="lg:col-span-3"><Section title="4. Terms & Conditions" description="Add payment terms and other details to include in the quotation." icon={FileText}><div className="space-y-2">{[['paymentTerms', 'Payment Terms', true], ['inclusions', 'Inclusions', true], ['exclusions', 'Exclusions'], ['specialTerms', 'Special Terms (Optional)']].map(([key, label, required]) => <div key={key} className="grid gap-1 sm:grid-cols-3"><Label htmlFor={`quotation-${key}`} className="text-[10px]">{label}{required ? ' *' : ''}</Label><Textarea id={`quotation-${key}`} maxLength={5000} value={form[key]} onChange={(event) => update(key, event.target.value)} className="min-h-9 text-[11px] sm:col-span-2" /></div>)}</div></Section></div><div className="lg:col-span-2"><Section title="5. PDF Options" description="Configure what to include in the quotation." icon={Settings2}>{[['showItemWiseRates', 'Show Item-wise Rates', 'Display quantity, rate and amount for each item.'], ['showTermsAndConditions', 'Show Terms & Conditions', 'Include payment terms, inclusions and exclusions.']].map(([key, label, hint]) => <div key={key} className="mb-3 flex items-start gap-3"><Switch id={key} checked={form.pdfOptions[key]} onCheckedChange={(value) => update('pdfOptions', { ...form.pdfOptions, [key]: value })} /><div><Label htmlFor={key} className="text-[11px]">{label}</Label><p className="text-[10px] text-muted-foreground">{hint}</p></div></div>)}<p className="text-[10px] text-muted-foreground">These preferences apply to the preview and downloaded PDF.</p></Section></div></div>
        </fieldset>}
      </div><DialogFooter className="shrink-0 border-t p-3 sm:justify-between"><Button type="button" variant="outline" size="sm" disabled={saving || addingOption} onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</Button>{!readOnly && <Button type="submit" variant="custom" size="sm" disabled={saving || addingOption} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}{record ? 'Save Quotation' : 'Generate Quotation'}</Button>}</DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
