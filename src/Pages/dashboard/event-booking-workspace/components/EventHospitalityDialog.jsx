/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { FileText, Info, Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '@components/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Textarea } from '@components/components/ui/textarea';

const statuses = ['Pending', 'In Planning', 'Finalised', 'Completed', 'Cancelled'];
const idOf = value => String(value?._id || value || '');
const dateOf = value => value ? String(value).slice(0, 10) : '';
const initial = {
  requirementType: '', requirementName: '', functionAppliesTo: [], guestSegments: '',
  quantity: '', units: '', location: '', serviceWindowFromDate: '', serviceWindowToDate: '',
  serviceWindowFromTime: '', serviceWindowToTime: '', planningOwner: '', planningStatus: 'In Planning',
  specification: '', image: '',
};
function fromItem(item = {}) {
  return { ...initial, ...Object.fromEntries(Object.keys(initial).map(key => [key, item[key] ?? initial[key]])),
    requirementName: item.requirementName || item.requirement || '',
    functionAppliesTo: (item.functionAppliesTo || item.appliesToFunctions || []).map(idOf),
    guestSegments: item.guestSegments || item.guestSegment || '',
    planningOwner: idOf(item.planningOwner || item.owner),
    planningStatus: item.planningStatus || item.status || 'In Planning',
    specification: item.specification || item.details || '',
    serviceWindowFromDate: dateOf(item.serviceWindowFromDate || item.serviceStartAt),
    serviceWindowToDate: dateOf(item.serviceWindowToDate),
  };
}
function Field({ name, label, required, children, className = '' }) {
  return <div className={'space-y-2 ' + className}><Label htmlFor={'hospitality-' + name} className="text-xs font-semibold">{label}{required && <span className="ml-1 text-destructive">*</span>}</Label>{children}</div>;
}
function Choice({ name, value, options, onChange, placeholder = 'Select', disabled }) {
  const choices = [...new Set([...options, ...(value && value !== 'unassigned' ? [value] : [])])];
  return <Select value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger id={'hospitality-' + name} className="h-10 text-xs"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{choices.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>;
}

export default function EventHospitalityDialog({ open, onOpenChange, item, functions = [], employees = [], saving, onSave }) {
  const [form, setForm] = useState(initial);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const submitAction = useRef('save');
  useEffect(() => { if (open) { setForm(fromItem(item || {})); setFile(null); setError(''); } }, [open, item]);
  useEffect(() => {
    if (!file || file.type === 'application/pdf') { setPreview(''); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const toggle = id => update('functionAppliesTo', form.functionAppliesTo.includes(id) ? form.functionAppliesTo.filter(value => value !== id) : [...form.functionAppliesTo, id]);
  const chooseFile = selected => {
    if (!selected) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(selected.type) || !/[.](jpe?g|png|pdf)$/i.test(selected.name)) { setError('Choose a JPG, PNG or PDF file.'); return; }
    if (selected.size > 5 * 1024 * 1024) { setError('Reference file must be 5 MB or smaller.'); return; }
    setFile(selected); setError('');
  };
  const submit = event => {
    event.preventDefault();
    if (saving) return;
    const required = ['requirementType', 'requirementName', 'guestSegments', 'units', 'location', 'specification'];
    if (required.some(key => !String(form[key]).trim())) return setError('Complete all required fields.');
    if (!form.functionAppliesTo.length || form.functionAppliesTo.some(id => !functions.some(fn => idOf(fn) === id))) return setError('Select at least one function belonging to this event.');
    if (!Number.isFinite(Number(form.quantity)) || Number(form.quantity) <= 0) return setError('Quantity must be greater than zero.');
    if (form.specification.trim().length > 1000) return setError('Specification cannot exceed 1000 characters.');
    if (!file && !/^https?:[/][/]/i.test(form.image)) return setError('Upload a reference image or PDF.');
    if (form.serviceWindowFromDate && form.serviceWindowToDate && form.serviceWindowToDate < form.serviceWindowFromDate) return setError('End date cannot precede start date.');
    if (form.serviceWindowFromDate && form.serviceWindowFromDate === form.serviceWindowToDate && form.serviceWindowFromTime && form.serviceWindowToTime && form.serviceWindowToTime < form.serviceWindowFromTime) return setError('End time cannot precede start time on the same date.');
    const payload = { ...form, quantity: Number(form.quantity), planningOwner: form.planningOwner || null,
      planningStatus: submitAction.current === 'draft' ? 'Pending' : form.planningStatus };
    required.forEach(key => { payload[key] = payload[key].trim(); });
    ['serviceWindowFromDate', 'serviceWindowToDate', 'serviceWindowFromTime', 'serviceWindowToTime'].forEach(key => { if (!payload[key]) delete payload[key]; });
    setError('');
    if (file) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => { if (key !== 'image') formData.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value)); });
      formData.set('image', file);
      onSave({ formData });
    } else onSave(payload);
  };
  const textInput = (name, type = 'text', extra = {}) => <Input id={'hospitality-' + name} type={type} value={form[name]} onChange={event => update(name, event.target.value)} className="h-10 text-xs" {...extra} />;
  const choice = (name, options) => <Choice name={name} value={form[name]} options={options} onChange={value => update(name, value)} disabled={saving} />;
  const imageUrl = preview || (!file ? form.image : '');
  const isPdf = file?.type === 'application/pdf' || /[.]pdf(?:[?#]|$)/i.test(imageUrl);
  const currentOwner = item?.planningOwner || item?.owner;
  const owners = currentOwner?._id && !employees.some(employee => idOf(employee) === idOf(currentOwner)) ? [currentOwner, ...employees] : employees;
  return <Dialog open={open} onOpenChange={value => !saving && onOpenChange(value)}>
    <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-1.5rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0">
      <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12 text-left">
        <DialogTitle className="text-xl font-semibold sm:text-2xl">{item?._id ? 'Edit' : 'Add'} Hospitality Requirement</DialogTitle>
        <DialogDescription>Add a requirement for guest hospitality and related services.</DialogDescription>
      </DialogHeader>
      <form id="event-hospitality-form" onSubmit={submit} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <fieldset disabled={saving} className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
          <div className="space-y-5 rounded-md border border-border p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="requirementType" label="Requirement Type" required>{choice('requirementType', ['Gift Hamper', 'Welcome Desk', 'Welcome Kit', 'Guest Assistance', 'VIP Hospitality', 'Refreshments', 'Other'])}</Field>
              <Field name="requirementName" label="Requirement Name" required>{textInput('requirementName', 'text', { required: true, placeholder: 'Enter requirement name' })}</Field>
              <div className="min-w-0 space-y-1.5">
                <Label id="hospitality-functions-label" className="text-xs font-semibold">Applies To (Functions)<span className="ml-1 text-destructive">*</span></Label>
                <div role="group" aria-labelledby="hospitality-functions-label" className="flex flex-wrap gap-2">
                  {functions.map(fn => {
                    const id = idOf(fn);
                    const selected = form.functionAppliesTo.includes(id);
                    return <Button key={id} type="button" variant="outline" size="sm" disabled={saving} aria-pressed={selected} onClick={() => toggle(id)} className={`inline-flex h-auto min-h-8 max-w-full whitespace-normal break-words px-3 py-1.5 text-xs font-normal ${selected ? 'border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary' : ''}`}>{fn.name}</Button>;
                  })}
                  {!functions.length && <p className="text-xs text-muted-foreground">No functions available.</p>}
                </div>
                <p className="text-[11px] text-muted-foreground">Select the functions where this requirement will be used.</p>
              </div>
              <Field name="guestSegments" label="Guest Segment" required>{choice('guestSegments', ['All Guests', 'Staying Guests', 'VIP Guests', 'Family', 'Other'])}</Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field name="quantity" label="Quantity" required>{textInput('quantity', 'number', { min: '0', step: 'any', required: true })}</Field>
              <Field name="units" label="Unit" required>{choice('units', ['Kits', 'Pieces', 'Sets', 'Boxes', 'Persons', 'Other'])}</Field>
              <Field name="location" label="Location / Use" required>{choice('location', ['Guest Rooms', 'Welcome Desk', 'Venue', 'Dining Area', 'Reception', 'Other'])}</Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Field name="serviceWindowFromDate" label="Service Window From">{textInput('serviceWindowFromDate', 'date')}</Field>
              <Field name="serviceWindowToDate" label="Service Window To">{textInput('serviceWindowToDate', 'date', { min: form.serviceWindowFromDate || undefined })}</Field>
              <Field name="serviceWindowFromTime" label="Start Time (Optional)">{textInput('serviceWindowFromTime', 'time')}</Field>
              <Field name="serviceWindowToTime" label="End Time (Optional)">{textInput('serviceWindowToTime', 'time')}</Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="planningOwner" label="Planning Owner"><Select value={form.planningOwner || 'unassigned'} onValueChange={value => update('planningOwner', value === 'unassigned' ? '' : value)} disabled={saving}><SelectTrigger id="hospitality-planningOwner" className="h-10 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unassigned">Unassigned</SelectItem>{owners.map(employee => <SelectItem key={idOf(employee)} value={idOf(employee)}>{employee.name}</SelectItem>)}</SelectContent></Select></Field>
              <Field name="planningStatus" label="Planning Status" required>{choice('planningStatus', statuses)}</Field>
            </div>
            <Field name="specification" label="Requirement / Specification" required><div className="relative"><Textarea id="hospitality-specification" required maxLength={1000} value={form.specification} onChange={event => update('specification', event.target.value)} className="min-h-24 resize-none pb-6 text-xs" placeholder="Describe the requirement and specifications" /><span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">{form.specification.length}/1000</span></div></Field>
          </div>
          <aside className="space-y-3">
            <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
              <Label className="text-sm font-semibold">Reference Image <span className="text-destructive">*</span></Label>
              <div className="relative flex min-h-48 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
                {isPdf ? <div className="p-6 text-center"><FileText className="mx-auto mb-2 h-10 w-10 text-muted-foreground" /><p className="break-all text-xs">{file?.name || 'PDF reference'}</p></div> : imageUrl ? <img src={imageUrl} alt="Hospitality reference" className="h-56 w-full object-contain" /> : <Upload className="h-10 w-10 text-muted-foreground" />}
                {(file || form.image) && <Button type="button" variant="outline" size="icon" aria-label="Remove reference" className="absolute right-2 top-2 h-8 w-8 text-destructive" onClick={() => { setFile(null); update('image', ''); }}><Trash2 className="h-4 w-4" /></Button>}
              </div>
              <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="hidden" aria-label="Upload reference image" onChange={event => { chooseFile(event.target.files?.[0]); event.target.value = ''; }} />
              <Button type="button" variant="secondary" className="w-full gap-2" onClick={() => inputRef.current?.click()}><Upload className="h-4 w-4" />{file || form.image ? 'Change Image' : 'Upload Image'}</Button>
              {file && <p className="break-all text-xs text-muted-foreground">{file.name}</p>}
              <p className="text-xs leading-5 text-muted-foreground">Accepted formats: JPG, PNG, PDF<br />Max file size: 5 MB</p>
            </div>
            <div className="rounded-md bg-muted/60 p-4 text-xs">
              <p className="mb-2 flex items-center gap-2 font-semibold"><Info className="h-4 w-4" />Guidelines</p>
              <ul className="list-disc space-y-2 pl-5 leading-5 text-muted-foreground"><li>Upload a clear image or reference document.</li><li>Add complete details to avoid delays.</li><li>This requirement will be planned and executed by the operations team.</li><li>You can edit this requirement anytime.</li></ul>
            </div>
          </aside>
        </fieldset>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      </form>
      <DialogFooter className="shrink-0 flex-row flex-wrap justify-between gap-2 border-t border-border px-5 py-3 sm:justify-between">
        <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
        <div className="flex gap-2">{!item?._id && <Button type="submit" form="event-hospitality-form" variant="secondary" disabled={saving} onClick={() => { submitAction.current = 'draft'; }}>Save as Draft</Button>}<Button type="submit" form="event-hospitality-form" variant="custom" disabled={saving} onClick={() => { submitAction.current = 'save'; }}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{item?._id ? 'Save Changes' : 'Add Requirement'}</Button></div>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

