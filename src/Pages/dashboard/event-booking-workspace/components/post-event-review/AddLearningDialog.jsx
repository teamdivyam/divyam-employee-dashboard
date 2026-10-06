/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Info, Loader2, X } from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/components/ui/popover";
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

const RELATED_OPTIONS = [
  "Service",
  "Vendor",
  "Operations",
  "Hospitality",
  "Function",
  "Overall Event",
  "Other",
];

const emptyForm = {
  title: "",
  learningType: "Worked Well",
  relatedTo: "Service",
  relatedItem: "",
  functions: [],
  observation: "",
  recommendedPractice: "",
};

const itemName = (item) => {
  if (typeof item === "string") return item;
  return (
    item?.name ||
    item?.service ||
    item?.functionName ||
    item?.companyName ||
    item?.vendor?.companyName ||
    item?.vendor?.name ||
    ""
  );
};

function Field({ label, required, children, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="flex min-h-4 items-center gap-1 text-[11px] font-medium text-foreground">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}

export default function AddLearningDialog({
  open,
  onOpenChange,
  booking,
  initialData = null,
  saving = false,
  onSave,
}) {
  const [form, setForm] = useState(emptyForm);
  const [functionsOpen, setFunctionsOpen] = useState(false);
  const functionsTriggerRef = useRef(null);
  const isEditing = Boolean(initialData?._id || initialData?.id);
  const clientName = booking?.customer?.name || booking?.eventName || "Event Booking";
  const functionOptions = useMemo(
    () => (booking?.functions || []).map(itemName).filter(Boolean),
    [booking],
  );

  const relatedItems = useMemo(() => {
    let items = [];
    if (form.relatedTo === "Service") {
      items = [
        ...(booking?.servicesSelected || []),
        ...(booking?.servicesRequired || []),
      ];
    } else if (form.relatedTo === "Vendor") {
      items = booking?.vendorAssignments || [];
    } else if (form.relatedTo === "Function") {
      items = booking?.functions || [];
    } else if (form.relatedTo === "Operations") {
      items = ["Event Coordination", "Logistics", "Inventory"];
    } else if (form.relatedTo === "Hospitality") {
      items = ["Guest Management", "Accommodation", "Transport"];
    } else {
      items = [form.relatedTo];
    }
    const names = [...items.map(itemName), form.relatedItem].filter(Boolean);
    if (form.relatedTo === "Service" && names.length === 0) {
      names.push("Catering", "Decor", "Hospitality", "Photography", "Transport");
    }
    if (form.relatedTo === "Function" && names.length === 0) {
      names.push("Overall Event");
    }
    return [...new Map(names.map((name) => [name.toLowerCase(), name])).values()];
  }, [booking, form.relatedItem, form.relatedTo]);

  useEffect(() => {
    if (!open) return;
    setForm(
      initialData
        ? {
            ...emptyForm,
            ...initialData,
            learningType:
              initialData.learningType ||
              initialData.type ||
              (initialData.impact === "High" ? "Improvement" : "Worked Well"),
            relatedTo: initialData.relatedTo || initialData.category || "Overall Event",
            relatedItem: initialData.relatedItem || "",
            functions: Array.isArray(initialData.functions)
              ? initialData.functions
              : [],
            observation:
              initialData.observation || initialData.description || "",
            recommendedPractice: initialData.recommendedPractice || "",
          }
        : emptyForm,
    );
  }, [initialData, open]);

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleFunction = (name) =>
    setForm((current) => ({
      ...current,
      functions: current.functions.includes(name)
        ? current.functions.filter((item) => item !== name)
        : [...current.functions, name],
    }));

  const submit = () => {
    if (
      !form.title.trim() ||
      !form.learningType ||
      !form.relatedTo ||
      !form.relatedItem ||
      (functionOptions.length > 0 && form.functions.length === 0) ||
      !form.observation.trim() ||
      !form.recommendedPractice.trim()
    ) {
      toast.error("Please fill all required learning fields.");
      return;
    }

    onSave?.({
      title: form.title.trim(),
      learningType: form.learningType,
      relatedTo: form.relatedTo,
      relatedItem: form.relatedItem,
      functions: form.functions,
      observation: form.observation.trim(),
      recommendedPractice: form.recommendedPractice.trim(),
      category: form.relatedTo,
      impact: form.learningType === "Improvement" ? "High" : "Medium",
      description: form.observation.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent
        className="flex max-h-[94dvh] w-[calc(100vw-20px)] max-w-[780px] flex-col gap-0 overflow-hidden rounded-md border-border bg-background p-0"
      >
        <DialogHeader className="shrink-0 border-b border-border px-4 py-2.5 pr-11 text-left">
          <DialogTitle className="text-base font-semibold">
            {isEditing ? "Edit Learning" : "Add Learning"}
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            {isEditing
              ? "Update the learning or recommended practice for this event."
              : "Capture a key learning or best practice from this event."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div className="flex items-center gap-3 rounded-md border border-primary/15 bg-primary/[0.04] px-3 py-2.5">
            <Avatar className="h-8 w-8 shrink-0 rounded-md">
              <AvatarFallback className="rounded-md bg-primary/10 text-xs font-semibold text-primary">
                {initials(clientName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">{clientName}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                <span>{bookingCode(booking) || "—"}</span>
                {booking?.eventType ? <><span>|</span><span>{booking.eventType}</span></> : null}
                {eventDateLabel(booking) ? <><span>|</span><span>{eventDateLabel(booking)}</span></> : null}
                {(booking?.venue || booking?.city) ? <><span>|</span><span>{[booking.venue, booking.city].filter(Boolean).join(", ")}</span></> : null}
              </div>
            </div>
          </div>

          <fieldset disabled={saving} className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
            <Field label="Learning Title" required>
              <Input className="h-8 text-[11px]" value={form.title} maxLength={200} placeholder="Enter a short title for the learning" onChange={(event) => update("title", event.target.value)} />
            </Field>

            <Field label="Type" required>
              <div className="grid grid-cols-2 gap-1.5">
                {["Worked Well", "Improvement"].map((type) => {
                  const workedWell = type === "Worked Well";
                  return (
                    <button key={type} type="button" onClick={() => update("learningType", type)} className={`flex h-8 items-center justify-center gap-1.5 rounded-md border text-[11px] font-medium transition ${workedWell ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"} ${form.learningType === type ? "ring-2 ring-primary/25" : "opacity-65 hover:opacity-100"}`}>
                      <span className="grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-current">{form.learningType === type ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}</span>
                      {type}
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
              <Field label="Related To" required>
                <Select value={form.relatedTo} onValueChange={(value) => setForm((current) => ({ ...current, relatedTo: value, relatedItem: "" }))}>
                  <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{RELATED_OPTIONS.map((item) => <SelectItem key={item} value={item} className="text-[10px]">{item}</SelectItem>)}</SelectContent>
                </Select>
              </Field>

              <Field label={<span className="inline-flex items-center gap-1">Related Item <Info className="h-3 w-3 text-muted-foreground" /></span>} required>
                <Select value={form.relatedItem || undefined} onValueChange={(value) => update("relatedItem", value)}>
                  <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="Select item" /></SelectTrigger>
                  <SelectContent>{relatedItems.map((item) => <SelectItem key={item} value={item} className="text-[10px]">{item}</SelectItem>)}</SelectContent>
                </Select>
              </Field>

              <Field label="Function(s)" required={functionOptions.length > 0}>
                <Popover open={functionsOpen} onOpenChange={setFunctionsOpen}>
                  <PopoverTrigger asChild>
                    <Button ref={functionsTriggerRef} type="button" variant="outline" className="h-8 w-full justify-between px-2 text-[11px] font-normal">
                      <span className="flex min-w-0 items-center gap-1 overflow-hidden">
                        {form.functions.length ? form.functions.slice(0, 2).map((name) => <span key={name} className="inline-flex shrink-0 items-center gap-1 rounded bg-primary/10 px-1 py-0.5 text-[9px] text-primary">{name}<X className="h-2.5 w-2.5" /></span>) : <span className="text-muted-foreground">Select functions</span>}
                        {form.functions.length > 2 ? <span className="text-[10px] text-muted-foreground">+{form.functions.length - 2}</span> : null}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    container={functionsTriggerRef.current?.closest('[role="dialog"]')}
                    align="end"
                    className="w-56 p-1"
                  >
                    {functionOptions.length ? functionOptions.map((name) => <button key={name} type="button" onClick={() => toggleFunction(name)} className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[10px] hover:bg-muted"><span>{name}</span>{form.functions.includes(name) ? <Check className="h-3.5 w-3.5 text-primary" /> : null}</button>) : <p className="p-2 text-[10px] text-muted-foreground">No functions available</p>}
                  </PopoverContent>
                </Popover>
              </Field>
            </div>

            <Field label="Learning / Observation" required className="sm:col-span-2">
              <div className="relative">
                <Textarea className="min-h-16 resize-none pb-5 text-[11px]" value={form.observation} maxLength={500} placeholder="What did we learn from this event? Be specific and factual." onChange={(event) => update("observation", event.target.value)} />
                <span className="absolute bottom-1.5 right-2 text-[9px] text-muted-foreground">{form.observation.length}/500</span>
              </div>
            </Field>

            <Field label="Recommended Practice" required className="sm:col-span-2">
              <div className="relative">
                <Textarea className="min-h-14 resize-none pb-5 text-[11px]" value={form.recommendedPractice} maxLength={500} placeholder="What should be repeated or improved in future events?" onChange={(event) => update("recommendedPractice", event.target.value)} />
                <span className="absolute bottom-1.5 right-2 text-[9px] text-muted-foreground">{form.recommendedPractice.length}/500</span>
              </div>
            </Field>
          </fieldset>
        </div>

        <DialogFooter className="shrink-0 flex-row justify-between gap-2 border-t border-border bg-muted/20 px-4 py-2.5 sm:justify-between sm:space-x-0">
          <Button type="button" variant="outline" size="sm" className="h-8 min-w-28 text-xs font-normal" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" size="sm" className="h-8 min-w-36 gap-1.5 text-xs font-medium" disabled={saving} onClick={submit}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Learning"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


