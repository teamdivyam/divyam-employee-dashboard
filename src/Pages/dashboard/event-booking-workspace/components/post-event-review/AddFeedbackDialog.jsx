/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@components/components/ui/avatar";
import { Button } from "@components/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/components/ui/dialog";
import { Input } from "@components/components/ui/input";
import { Label } from "@components/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import { Textarea } from "@components/components/ui/textarea";

import {
  bookingCode,
  eventDateLabel,
  initials,
} from "../../eventBookingDashboard.utils";
import {
  FEEDBACK_FROM_OPTIONS,
  RELATED_TO_OPTIONS,
  SOURCE_OPTIONS,
} from "./postEventReview.constants";
import StarRating from "./StarRating";

const dateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const todayInputValue = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

const defaultForm = (clientName) => ({
  feedbackFrom: "Client",
  nameReference: clientName,
  feedbackDate: todayInputValue(),
  source: "",
  relatedTo: "",
  relatedItem: "",
  observation: "",
  rating: 0,
  internalNote: "",
});

const optionName = (item) => {
  if (typeof item === "string") return item;
  return item?.name || item?.service || item?.functionName || item?.companyName || "";
};

const sectionToneClass = {
  blue: "border-blue-200/80 bg-blue-50/80 dark:border-blue-900/70 dark:bg-blue-950/30",
  mint: "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/70 dark:bg-emerald-950/30",
};

function ReviewSection({ number, title, tone, children }) {
  return (
    <section className="overflow-hidden rounded-md border border-border bg-card">
      <div className={`flex items-center gap-1.5 border-b px-3 py-2 text-xs font-semibold text-foreground ${sectionToneClass[tone]}`}>
        <span>{number}.</span>
        <span>{title}</span>
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

export default function AddFeedbackDialog({
  open,
  onOpenChange,
  booking,
  initialData = null,
  saving = false,
  onSave,
}) {
  const clientName = booking?.customer?.name || booking?.eventName || "";
  const [form, setForm] = useState(() => defaultForm(clientName));
  const isEditing = Boolean(initialData?._id || initialData?.id);

  useEffect(() => {
    if (!open) return;
    const defaults = defaultForm(clientName);
    setForm(initialData ? {
      ...defaults,
      ...initialData,
      feedbackDate: dateInputValue(initialData.feedbackDate),
      rating: Number(initialData.rating || 0),
    } : defaults);
  }, [clientName, initialData, open]);

  const relatedItemOptions = useMemo(() => {
    const values = [
      ...(booking?.functions || []).map(optionName),
      ...(booking?.servicesSelected || []).map(optionName),
      ...(booking?.servicesRequired || []).map(optionName),
      ...(booking?.vendorAssignments || []).map((item) => optionName(item?.vendor || item)),
      booking?.venue,
      form.relatedItem,
    ];
    const unique = new Map();
    values.forEach((value) => {
      const name = String(value || "").trim();
      if (name && !unique.has(name.toLowerCase())) unique.set(name.toLowerCase(), name);
    });
    return [...unique.values()];
  }, [booking, form.relatedItem]);

  const bookingIdentityOptions = useMemo(() => {
    let values = [];
    if (form.feedbackFrom === "Guest") {
      values = booking?.guestList || [];
    } else if (form.feedbackFrom === "Vendor") {
      values = (booking?.vendorAssignments || []).map((item) => item?.vendor || item);
    }

    const unique = new Map();
    values.map(optionName).forEach((value) => {
      const name = String(value || "").trim();
      if (name && !unique.has(name.toLowerCase())) unique.set(name.toLowerCase(), name);
    });
    return [...unique.values()];
  }, [booking, form.feedbackFrom]);

  const nameReferenceOptions = isEditing && form.nameReference
    && !bookingIdentityOptions.some((option) => option.toLowerCase() === form.nameReference.toLowerCase())
    ? [form.nameReference, ...bookingIdentityOptions]
    : bookingIdentityOptions;

  const usesBookingIdentity = ["Guest", "Vendor"].includes(form.feedbackFrom)
    && bookingIdentityOptions.length > 0;

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = () => {
    if (
      !form.feedbackFrom
      || !form.nameReference.trim()
      || !form.feedbackDate
      || !form.source
      || !form.relatedTo
      || !form.observation.trim()
    ) {
      toast.error("Please fill all required fields marked with *");
      return;
    }

    onSave?.({
      feedbackFrom: form.feedbackFrom,
      nameReference: form.nameReference.trim(),
      feedbackDate: form.feedbackDate,
      source: form.source,
      relatedTo: form.relatedTo,
      relatedItem: form.relatedItem.trim(),
      observation: form.observation.trim(),
      rating: Number(form.rating || 0),
      internalNote: form.internalNote.trim(),
      avatarInitials: initials(form.nameReference || form.feedbackFrom),
      avatarBg: initialData?.avatarBg || "bg-primary/10 text-primary",
    });
  };

  const handleOpenChange = (nextOpen) => {
    if (!saving) onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[96dvh] w-[calc(100vw-24px)] max-w-[900px] flex-col gap-0 overflow-hidden rounded-md border-border bg-background p-0">
        <DialogHeader className="shrink-0 border-b border-violet-200/70 bg-violet-50/80 px-4 py-3 pr-12 text-left dark:border-violet-900/70 dark:bg-violet-950/30">
          <DialogTitle className="text-base font-semibold text-foreground">
            {isEditing ? "Edit Feedback" : "Add Feedback"}
          </DialogTitle>
          <DialogDescription className="text-[11px] text-muted-foreground">
            Record feedback or observations related to this event.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div className="flex items-center gap-3 rounded-md border border-blue-200/70 bg-blue-50/70 px-3 py-2.5 dark:border-blue-900/60 dark:bg-blue-950/25">
            <Avatar className="h-8 w-8 shrink-0 rounded-md">
              <AvatarFallback className="rounded-md bg-primary/10 text-xs font-semibold text-primary">
                {initials(clientName || "Event")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">{clientName || "Event Booking"}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                <span>{bookingCode(booking) || "—"}</span>
                {booking?.eventType ? <><span>|</span><span>{booking.eventType}</span></> : null}
                {eventDateLabel(booking) ? <><span>|</span><span>{eventDateLabel(booking)}</span></> : null}
                {(booking?.venue || booking?.city) ? <><span>|</span><span>{[booking.venue, booking.city].filter(Boolean).join(", ")}</span></> : null}
              </div>
            </div>
          </div>

          <fieldset disabled={saving} className="space-y-4">
            <ReviewSection number="1" title="Feedback Details" tone="blue">
              <div className="grid gap-x-3 gap-y-3 sm:grid-cols-2 md:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Feedback From <span className="text-destructive">*</span></Label>
                  <Select value={form.feedbackFrom} onValueChange={(value) => {
                    setForm((current) => ({
                      ...current,
                      feedbackFrom: value,
                      nameReference: value === "Client" ? clientName : "",
                    }));
                  }}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{FEEDBACK_FROM_OPTIONS.map((option) => <SelectItem key={option} value={option} className="text-xs">{option}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Name / Reference <span className="text-destructive">*</span></Label>
                  {usesBookingIdentity ? (
                    <Select value={form.nameReference || undefined} onValueChange={(value) => set("nameReference", value)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={`Select ${form.feedbackFrom.toLowerCase()}`} /></SelectTrigger>
                      <SelectContent>{nameReferenceOptions.map((option) => <SelectItem key={option} value={option} className="text-xs">{option}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <Input className="h-9 text-xs" value={form.nameReference} onChange={(event) => set("nameReference", event.target.value)} placeholder={`Enter ${form.feedbackFrom.toLowerCase()} name`} maxLength={150} />
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Feedback Date <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input type="date" className="h-9 pr-8 text-xs" value={form.feedbackDate} onChange={(event) => set("feedbackDate", event.target.value)} />
                    <CalendarDays className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Source <span className="text-destructive">*</span></Label>
                  <Select value={form.source} onValueChange={(value) => set("source", value)}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select source" /></SelectTrigger>
                    <SelectContent>{SOURCE_OPTIONS.map((option) => <SelectItem key={option} value={option} className="text-xs">{option}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Related To <span className="text-destructive">*</span></Label>
                  <Select value={form.relatedTo} onValueChange={(value) => setForm((current) => ({ ...current, relatedTo: value, relatedItem: "" }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{RELATED_TO_OPTIONS.map((option) => <SelectItem key={option} value={option} className="text-xs">{option}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Related Item</Label>
                  <Select value={form.relatedItem || undefined} onValueChange={(value) => set("relatedItem", value)} disabled={!relatedItemOptions.length}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>{relatedItemOptions.map((option) => <SelectItem key={option} value={option} className="text-xs">{option}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </ReviewSection>

            <ReviewSection number="2" title="Feedback & Notes" tone="mint">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium">Feedback / Observation <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Textarea className="min-h-20 resize-none pb-6 text-xs" maxLength={1000} value={form.observation} onChange={(event) => set("observation", event.target.value)} placeholder="Enter the feedback or observation as received..." />
                    <span className="pointer-events-none absolute bottom-2 right-2.5 text-[10px] text-muted-foreground">{form.observation.length}/1000</span>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-border p-3">
                    <Label className="text-[11px] font-medium">Overall Rating (Optional)</Label>
                    <div className="mt-1"><StarRating value={form.rating} onChange={(value) => set("rating", value)} /></div>
                    <p className="mt-1 text-[9px] text-muted-foreground">Leave unrated if no actual rating was provided.</p>
                  </div>
                  <div className="space-y-1.5 rounded-md border border-border p-3">
                    <Label className="text-[11px] font-medium">Internal Note (Optional)</Label>
                    <div className="relative">
                      <Textarea className="min-h-16 resize-none pb-6 text-xs" maxLength={500} value={form.internalNote} onChange={(event) => set("internalNote", event.target.value)} placeholder="Add internal clarification or follow-up note..." />
                      <span className="pointer-events-none absolute bottom-2 right-2.5 text-[10px] text-muted-foreground">{form.internalNote.length}/500</span>
                    </div>
                  </div>
                </div>
              </div>
            </ReviewSection>
          </fieldset>
        </div>

        <DialogFooter className="shrink-0 flex-row items-center justify-between gap-2 border-t border-border bg-muted/20 px-4 py-2.5 sm:justify-between sm:space-x-0">
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" size="sm" variant="custom" className="h-8 min-w-32 gap-1.5 text-xs" disabled={saving} onClick={handleSubmit}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


