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

const defaultForm = (clientName) => ({
  feedbackFrom: "Client",
  nameReference: clientName,
  feedbackDate: "",
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

function ReviewSection({ number, title, children }) {
  return (
    <section className="overflow-hidden rounded-md border border-primary/15 bg-card">
      <div className="flex items-center gap-1.5 border-b border-primary/10 bg-primary/[0.06] px-2.5 py-1.5 text-[11px] font-semibold text-foreground">
        <span>{number}.</span>
        <span>{title}</span>
      </div>
      <div className="p-2">{children}</div>
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
      <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-20px)] max-w-[760px] flex-col gap-0 overflow-hidden rounded-md border-border bg-background p-0">
        <DialogHeader className="shrink-0 border-b border-border px-3.5 py-1.5 pr-11 text-left">
          <DialogTitle className="text-base font-semibold text-foreground">
            {isEditing ? "Edit Feedback" : "Add Feedback"}
          </DialogTitle>
          <DialogDescription className="text-[11px] text-muted-foreground">
            Record feedback or observations related to this event.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2.5">
          <div className="flex items-center gap-2.5 rounded-md border border-primary/15 bg-primary/[0.04] px-2.5 py-1.5">
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

          <fieldset disabled={saving} className="space-y-1.5">
            <ReviewSection number="1" title="Feedback Details">
              <div className="grid gap-x-2 gap-y-1.5 sm:grid-cols-2 md:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium">Feedback From <span className="text-destructive">*</span></Label>
                  <Select value={form.feedbackFrom} onValueChange={(value) => {
                    set("feedbackFrom", value);
                    if (value === "Client") set("nameReference", clientName);
                  }}>
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{FEEDBACK_FROM_OPTIONS.map((option) => <SelectItem key={option} value={option} className="text-xs">{option}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-medium">Name / Reference <span className="text-destructive">*</span></Label>
                  <Input className="h-7 text-[10px]" value={form.nameReference} onChange={(event) => set("nameReference", event.target.value)} placeholder="Enter name" maxLength={150} />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-medium">Feedback Date <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input type="date" className="h-7 pr-8 text-[10px]" value={form.feedbackDate} onChange={(event) => set("feedbackDate", event.target.value)} />
                    <CalendarDays className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-medium">Source <span className="text-destructive">*</span></Label>
                  <Select value={form.source} onValueChange={(value) => set("source", value)}>
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Select source" /></SelectTrigger>
                    <SelectContent>{SOURCE_OPTIONS.map((option) => <SelectItem key={option} value={option} className="text-xs">{option}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-medium">Related To <span className="text-destructive">*</span></Label>
                  <Select value={form.relatedTo} onValueChange={(value) => setForm((current) => ({ ...current, relatedTo: value, relatedItem: "" }))}>
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{RELATED_TO_OPTIONS.map((option) => <SelectItem key={option} value={option} className="text-xs">{option}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-medium">Related Item</Label>
                  <Select value={form.relatedItem || undefined} onValueChange={(value) => set("relatedItem", value)} disabled={!relatedItemOptions.length}>
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>{relatedItemOptions.map((option) => <SelectItem key={option} value={option} className="text-xs">{option}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </ReviewSection>

            <ReviewSection number="2" title="Feedback & Notes">
              <div className="space-y-1.5">
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium">Feedback / Observation <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Textarea className="min-h-12 resize-none pb-4 text-[10px]" maxLength={1000} value={form.observation} onChange={(event) => set("observation", event.target.value)} placeholder="Enter the feedback or observation as received..." />
                    <span className="pointer-events-none absolute bottom-1.5 right-2 text-[9px] text-muted-foreground">{form.observation.length}/1000</span>
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <div className="rounded-md border border-border p-2">
                    <Label className="text-[10px] font-medium">Overall Rating (Optional)</Label>
                    <div className="mt-1"><StarRating value={form.rating} onChange={(value) => set("rating", value)} /></div>
                    <p className="mt-1 text-[9px] text-muted-foreground">Use only if an actual rating was provided.</p>
                  </div>
                  <div className="space-y-1 rounded-md border border-border p-2">
                    <Label className="text-[10px] font-medium">Internal Note (Optional)</Label>
                    <div className="relative">
                      <Textarea className="min-h-10 resize-none pb-4 text-[10px]" maxLength={500} value={form.internalNote} onChange={(event) => set("internalNote", event.target.value)} placeholder="Add internal clarification or follow-up note..." />
                      <span className="pointer-events-none absolute bottom-1.5 right-2 text-[9px] text-muted-foreground">{form.internalNote.length}/500</span>
                    </div>
                  </div>
                </div>
              </div>
            </ReviewSection>
          </fieldset>
        </div>

        <DialogFooter className="shrink-0 flex-row items-center justify-between gap-2 border-t border-border bg-muted/20 px-3.5 py-1.5 sm:justify-between sm:space-x-0">
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" size="sm" className="h-8 min-w-32 gap-1.5 text-xs" disabled={saving} onClick={handleSubmit}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


