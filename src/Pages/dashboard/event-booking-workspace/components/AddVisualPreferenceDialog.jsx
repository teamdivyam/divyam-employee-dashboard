/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  Coffee,
  FileText,
  Heart,
  ImagePlus,
  Info,
  Loader2,
  UploadCloud,
  UserRound,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@components/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/components/ui/select';
import { Textarea } from '@components/components/ui/textarea';

const categories = ['Stage & Mandap', 'Entrance', 'Décor', 'Catering Presentation', 'Photo Booth', 'Seating', 'Lighting', 'Other'];
const statuses = ['Client Preferred', 'Final Preference', 'Shortlisted', 'Under Review'];
const sources = ['Client Shared', 'Team Reference'];
const initialForm = {
  functionName: '', category: '', title: '', status: 'Client Preferred', source: 'Client Shared', likes: '', avoid: '', notes: '',
};

const eventLabel = (customer) => {
  const event = customer?.eventType || customer?.eventTitle || 'Event';
  if (!customer?.eventDate) return event;
  const date = new Date(customer.eventDate);
  if (Number.isNaN(date.getTime())) return event;
  return `${event} – ${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
};

function ContextCard({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-lg border border-border px-3 py-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pink-50 text-pink-600 dark:bg-pink-400/10 dark:text-pink-300"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0"><p className="text-[9px] font-medium text-muted-foreground">{label}</p><p className="truncate text-[11px] font-semibold text-foreground">{value || '-'}</p></div>
    </div>
  );
}

function Field({ label, required = false, children, className = '' }) {
  return <div className={`space-y-1 ${className}`}><Label className="text-[10px] font-semibold">{label}{required ? <span className="ml-0.5 text-destructive">*</span> : null}</Label>{children}</div>;
}

export default function AddVisualPreferenceDialog({ open, onOpenChange, customer, onSubmit, isSaving = false }) {
  const inputRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const functionOptions = useMemo(() => {
    const detailed = Array.isArray(customer?.functionDetails) ? customer.functionDetails.map((item) => item.name) : [];
    const legacy = Array.isArray(customer?.ceremonies) ? customer.ceremonies : [];
    return [...new Set([...detailed, ...legacy].filter(Boolean))];
  }, [customer?.ceremonies, customer?.functionDetails]);

  useEffect(() => {
    if (!open) return;
    setForm({ ...initialForm, functionName: functionOptions[0] || customer?.eventType || 'General Event' });
    setImageFile(null);
    setPreviewUrl('');
  }, [customer?.eventType, functionOptions, open]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const chooseImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a JPG, PNG, WebP, or other image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Preference image cannot exceed 10 MB.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const submit = (recordStatus) => {
    if (!imageFile || !form.functionName || !form.category || !form.title.trim() || !form.likes.trim()) {
      toast.error('Image, function, category, title, and client likes are required.');
      return;
    }
    const formData = new FormData();
    formData.append('image', imageFile);
    Object.entries({ ...form, recordStatus }).forEach(([key, value]) => formData.append(key, value));
    onSubmit(formData);
  };

  const inputClass = 'h-8 text-[11px]';
  const ownerName = typeof customer?.assignedEmployee === 'object' ? customer.assignedEmployee?.name : customer?.assignedEmployee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12"><DialogTitle className="text-xl">Add Preference</DialogTitle><DialogDescription className="text-xs">Add image-based preference details for this client.</DialogDescription></DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <ContextCard icon={UserRound} label="Client" value={customer?.name} />
            <ContextCard icon={CalendarDays} label="Event" value={eventLabel(customer)} />
            <ContextCard icon={UserRound} label="Owner" value={ownerName || 'Unassigned'} />
            <ContextCard icon={FileText} label="Status" value={customer?.leadStatus || 'New'} />
          </div>

          <div aria-label="Requirement sections" className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {[
              { label: 'Event & Guests', icon: UserRound },
              { label: `Functions (${functionOptions.length})`, icon: Users },
              { label: `Services (${Array.isArray(customer?.serviceDetails) ? customer.serviceDetails.length : 0})`, icon: Coffee },
              { label: 'Preferences', icon: Heart, active: true },
            ].map(({ label, icon: Icon, active }) => (
              <div key={label} className={`flex h-9 items-center justify-center gap-2 rounded-md border text-[10px] font-semibold ${active ? 'border-pink-300 text-pink-600 dark:border-pink-400/40 dark:text-pink-300' : 'border-border text-muted-foreground'}`}>
                <Icon className="h-3.5 w-3.5" />{label}
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div>
              <Label className="text-[10px] font-semibold">Preference Image<span className="ml-0.5 text-destructive">*</span></Label>
              <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(event) => chooseImage(event.target.files?.[0])} />
              <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseImage(event.dataTransfer.files?.[0]); }} className="mt-1 grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-lg border border-dashed border-pink-300 bg-card text-center outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-pink-400/40">
                {previewUrl ? <img src={previewUrl} alt="Preference preview" className="h-full w-full object-cover" /> : <span className="px-5"><UploadCloud className="mx-auto h-8 w-8 text-pink-500" /><span className="mt-2 block text-xs font-semibold text-pink-600">Upload One Image</span><span className="mt-1 block text-[10px] leading-4 text-muted-foreground">Drag and drop or click to browse</span></span>}
              </button>
              <p className="mt-1.5 text-center text-[9px] text-muted-foreground">JPG, PNG or WebP up to 10 MB · Recommended 16:9 or 4:3</p>
            </div>

            <div className="grid content-start gap-2.5 md:grid-cols-2">
              <Field label="Applies To Function" required><Select value={form.functionName} onValueChange={(value) => update('functionName', value)}><SelectTrigger className={inputClass}><SelectValue placeholder="Select function" /></SelectTrigger><SelectContent>{[...functionOptions, ...(functionOptions.length ? [] : [customer?.eventType || 'General Event'])].map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Preference Category" required><Select value={form.category} onValueChange={(value) => update('category', value)}><SelectTrigger className={inputClass}><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Preference Title" required className="md:col-span-2"><Input className={inputClass} maxLength={200} value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="e.g. Royal Wedding Stage" /></Field>
              <Field label="Status" required><Select value={form.status} onValueChange={(value) => update('status', value)}><SelectTrigger className={inputClass}><SelectValue /></SelectTrigger><SelectContent>{statuses.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Source" required><Select value={form.source} onValueChange={(value) => update('source', value)}><SelectTrigger className={inputClass}><SelectValue /></SelectTrigger><SelectContent>{sources.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="What Client Likes" required className="md:col-span-2"><div className="relative"><Textarea maxLength={500} className="min-h-16 resize-none pb-5 text-[11px]" value={form.likes} onChange={(event) => update('likes', event.target.value)} placeholder="Mention exactly what the client likes in this image" /><span className="absolute bottom-1.5 right-2 text-[9px] text-muted-foreground">{form.likes.length}/500</span></div></Field>
              <Field label="What to Avoid (Optional)"><Textarea maxLength={500} className="min-h-14 resize-none text-[11px]" value={form.avoid} onChange={(event) => update('avoid', event.target.value)} placeholder="What should be avoided?" /></Field>
              <Field label="Additional Notes (Optional)"><Textarea maxLength={500} className="min-h-14 resize-none text-[11px]" value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Other notes or comments" /></Field>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row items-center border-t border-border bg-muted/30 px-5 py-3 sm:justify-between sm:space-x-0">
          <p className="hidden items-center gap-2 text-[10px] text-muted-foreground md:flex"><Info className="h-4 w-4" />This preference will be added to the requirements timeline.</p>
          <div className="ml-auto flex gap-2"><Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="button" size="sm" disabled={isSaving} onClick={() => submit('Saved')} className="gap-2 bg-pink-600 hover:bg-pink-700">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}Add Preference</Button></div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
