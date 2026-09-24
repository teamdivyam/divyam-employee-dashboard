/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { CalendarDays, FileText, Info, Loader2, UploadCloud, UserRound, X } from 'lucide-react';
import { Button } from '@components/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Textarea } from '@components/components/ui/textarea';

const initial = { preferenceTitle: '', functionAppliesTo: '', preferenceCategory: '', status: 'Client Preferred', source: 'Client Shared', clientLikes: '', avoid: '', notes: '', image: '' };
const idOf = value => String(value?._id || value || '');
const pink = 'border-pink-200 text-pink-600 dark:border-pink-400/30 dark:text-pink-300';
const actionStyle = 'bg-pink-600 text-white hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600';
const categories = ['Stage Decor', 'Entrance', 'Mandap', 'Floral Decor', 'Lighting', 'Seating', 'Table Decor', 'Catering Presentation', 'Photo Booth', 'Other'];
function Field({ name, label, required, children, className = '' }) {
  return <div className={'min-w-0 space-y-1.5 ' + className}><Label htmlFor={'event-preference-' + name} className="text-xs font-semibold">{label}{required && <span className="ml-1 text-pink-600">*</span>}</Label>{children}</div>;
}
export default function EventVisualPreferenceDialog({ open, onOpenChange, customer = {}, booking = {}, onSubmit, onEdit, isSaving, preference, mode = 'add', initialFunctionName = '', extraFields, extraPayload = {}, maxImageMB = 10, titleMaxLength = 200 }) {
  const [form, setForm] = useState(initial);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const originalForm = useRef(initial);
  const functions = customer.functionDetails || [];
  const readOnly = mode === 'view';
  useEffect(() => {
    if (!open) return;
    const next = { ...initial,
      preferenceTitle: preference?.preferenceTitle || preference?.title || '',
      functionAppliesTo: idOf(preference?.functionAppliesTo) || idOf((customer.functionDetails || []).find(fn => fn.name === (preference?.functionName || initialFunctionName))),
      preferenceCategory: preference?.preferenceCategory || preference?.category || '',
      status: preference?.status || initial.status, source: preference?.source || initial.source,
      clientLikes: preference?.clientLikes || preference?.likes || '', avoid: preference?.avoid || '', notes: preference?.notes || '',
      image: preference?.image || preference?.imageUrl || '',
    };
    originalForm.current = next;
    setForm(next);
    setFile(null); setError('');
  }, [open, preference, initialFunctionName, customer.functionDetails]);
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url);
  }, [file]);
  const update = (name, value) => setForm(current => ({ ...current, [name]: value }));
  const choose = files => {
    if (isSaving || readOnly || !files?.length) return;
    if (files.length !== 1) return setError('Upload one image only.');
    const image = files[0];
    if (!['image/jpeg', 'image/png'].includes(image.type)) return setError('Choose a JPG or PNG image.');
    if (image.size > maxImageMB * 1024 * 1024) return setError('Image must be ' + maxImageMB + ' MB or smaller.');
    setFile(image); setError('');
  };
  const submit = event => {
    event.preventDefault();
    if (readOnly || isSaving) return;
    if (!form.preferenceTitle.trim() || !form.preferenceCategory.trim() || !form.clientLikes.trim()) return setError('Complete all required fields.');
    if (!functions.some(fn => idOf(fn) === form.functionAppliesTo)) return setError('Select a function belonging to this event.');
    if (!file && !/^https?:[/][/]/i.test(form.image)) return setError('Upload a preference image.');
    if (form.preferenceTitle.length > titleMaxLength || form.preferenceCategory.length > 100 || [form.clientLikes, form.avoid, form.notes].some(value => value.length > 500)) return setError('One or more fields exceed the character limit.');
    const payload = { ...form, ...extraPayload, preferenceTitle: form.preferenceTitle.trim(), preferenceCategory: form.preferenceCategory.trim(), clientLikes: form.clientLikes.trim() };
    if (mode === 'edit') {
      Object.keys(payload).forEach(key => { if (payload[key] === originalForm.current[key]) delete payload[key]; });
      if (!file && !Object.keys(payload).length) return setError('No changes to save.');
    }
    if (file) {
      const data = new FormData(); Object.entries(payload).forEach(([key, value]) => { if (key !== 'image') data.append(key, value); }); data.set('image', file); onSubmit(data);
    } else onSubmit(payload);
  };
  const select = (name, options) => <Select disabled={readOnly || isSaving} value={form[name]} onValueChange={value => update(name, value)}><SelectTrigger id={'event-preference-' + name} className="h-9 text-xs"><SelectValue placeholder="Select an option" /></SelectTrigger><SelectContent>{[...new Set([...options, form[name]].filter(Boolean))].map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>;
  const eventDate = customer.eventDate && !Number.isNaN(new Date(customer.eventDate).getTime()) ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(customer.eventDate)) : '';
  const displayImage = preview || form.image;
  return <Dialog open={open} onOpenChange={value => !isSaving && onOpenChange(value)}>
    <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-1.5rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0">
      <DialogHeader className="shrink-0 px-6 pb-3 pt-5 pr-12 text-left"><DialogTitle className="text-2xl font-semibold">{readOnly ? 'View' : mode === 'edit' ? 'Edit' : 'Add'} Preference</DialogTitle><DialogDescription className="text-xs">Add image-based preference details for this client.</DialogDescription></DialogHeader>
      <form id="event-visual-preference" onSubmit={submit} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[[UserRound, 'Client', customer.name], [CalendarDays, 'Event', [customer.eventType, eventDate].filter(Boolean).join(' ? ')], [UserRound, 'Owner', customer.assignedEmployee?.name || 'Unassigned'], [FileText, 'Status', booking.bookingStatus || customer.leadStatus]].map(([Icon, label, value]) => <div key={label} className="flex min-w-0 items-center gap-3 rounded-md border border-border p-3"><span className="rounded-full bg-pink-50 p-2 text-pink-600 dark:bg-pink-400/10 dark:text-pink-300"><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-[10px] text-muted-foreground">{label}</p><p className="truncate text-xs font-semibold" title={value}>{value || '-'}</p></div></div>)}</div>
        <fieldset disabled={readOnly || isSaving} className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div><Field name="image" label="Preference Image" required>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" className="sr-only" aria-label="Choose preference image" onChange={event => { choose(event.target.files); event.target.value = ''; }} />
            <div className="relative"><button id="event-preference-image" type="button" disabled={readOnly || isSaving} aria-label={displayImage ? 'Replace preference image' : 'Upload preference image'} onClick={() => inputRef.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); choose(event.dataTransfer.files); }} className={'flex min-h-64 w-full flex-col items-center justify-center overflow-hidden rounded-md border border-dashed p-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-80 ' + pink}>{displayImage ? <img src={displayImage} alt={form.preferenceTitle || 'Preference preview'} className="max-h-80 w-full object-contain" /> : <><UploadCloud className="mb-4 h-10 w-10" /><span className="text-sm font-semibold">Upload One Image</span><span className="mt-2 text-xs leading-5 text-muted-foreground">Drag & drop image here<br />or click to browse</span><span className={'mt-4 rounded-md border px-4 py-2 text-xs font-semibold ' + pink}>Browse Image</span></>}</button>{displayImage && !readOnly && <Button type="button" variant="secondary" size="icon" disabled={isSaving} aria-label="Remove preference image" className="absolute right-2 top-2 h-7 w-7" onClick={() => { setFile(null); update('image', ''); }}><X className="h-4 w-4" /></Button>}</div>
          </Field><p className="mt-3 text-center text-[10px] text-muted-foreground">JPG, PNG up to {maxImageMB}MB ? Recommended size 16:9 or 4:3</p><p className="mt-3 flex gap-2 text-[10px] text-muted-foreground"><Info className="h-3.5 w-3.5 shrink-0" />Please upload one clear image for this preference.</p></div>
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <Field name="functionAppliesTo" label="Applies To Function" required><Select disabled={readOnly || isSaving} value={form.functionAppliesTo} onValueChange={value => update('functionAppliesTo', value)}><SelectTrigger id="event-preference-functionAppliesTo" className="h-9 text-xs"><SelectValue placeholder="Select Function" /></SelectTrigger><SelectContent>{functions.map(fn => <SelectItem key={idOf(fn)} value={idOf(fn)}>{fn.name}</SelectItem>)}</SelectContent></Select>{!functions.length && <p className="text-xs text-muted-foreground">Add an event function first.</p>}</Field>
            <Field name="preferenceCategory" label="Preference Category" required>{select('preferenceCategory', categories)}</Field>
            <Field name="preferenceTitle" label="Preference Title" required className="sm:col-span-2"><Input id="event-preference-preferenceTitle" required maxLength={titleMaxLength} value={form.preferenceTitle} onChange={event => update('preferenceTitle', event.target.value)} placeholder="Enter preference title (e.g. Royal Wedding Stage)" className="h-9 text-xs" /></Field>
            <Field name="status" label="Status" required>{select('status', ['Client Preferred', 'Final Preference', 'Shortlisted', 'Under Review'])}</Field>
            <Field name="source" label="Source" required>{select('source', ['Client Shared', 'Team Reference'])}</Field>
            {extraFields}
            {[['clientLikes', 'What Client Likes', 'Mention exactly what the client likes in this image...'], ['avoid', 'What to Avoid (Optional)', 'Mention what should be avoided based on this reference...'], ['notes', 'Additional Notes (Optional)', 'Any other notes or comments about this preference...']].map(([name, label, placeholder]) => <Field key={name} name={name} label={label} required={name === 'clientLikes'} className="sm:col-span-2"><div className="relative"><Textarea id={'event-preference-' + name} required={name === 'clientLikes'} maxLength={500} value={form[name]} onChange={event => update(name, event.target.value)} placeholder={placeholder} className="min-h-20 resize-none pb-5 text-xs" /><span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">{form[name].length} / 500</span></div></Field>)}
          </div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </form>
      <DialogFooter className="shrink-0 flex-row flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4 sm:justify-between"><p className="flex items-center gap-2 text-[11px] text-muted-foreground"><Info className="h-4 w-4" />This preference will be added to the client requirements and timeline.</p><div className="flex gap-3"><Button variant="outline" disabled={isSaving} onClick={() => onOpenChange(false)}>{readOnly ? 'Close' : 'Cancel'}</Button>{readOnly ? <Button className={actionStyle} onClick={onEdit}>Edit Preference</Button> : <Button type="submit" form="event-visual-preference" disabled={isSaving || !onSubmit} className={actionStyle}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{mode === 'edit' ? 'Save Changes' : 'Add Preference'}</Button>}</div></DialogFooter>
    </DialogContent>
  </Dialog>;
}
