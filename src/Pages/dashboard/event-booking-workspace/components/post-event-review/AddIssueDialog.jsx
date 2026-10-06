/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { Info, Loader2 } from "lucide-react";
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

const ISSUE_SOURCES = [
  "Client Feedback",
  "Internal Team",
  "Vendor",
  "Guest",
  "Family Member",
  "Operations Team",
  "Other",
];
const RELATED_TO_OPTIONS = [
  "Service",
  "Vendor",
  "Operations",
  "Function",
  "Overall Event",
  "Other",
];
const PRIORITIES = [
  {
    value: "High",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300",
  },
  {
    value: "Medium",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300",
  },
  {
    value: "Low",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300",
  },
];

const emptyForm = {
  title: "",
  source: "Client Feedback",
  linkedFeedbackId: "",
  relatedTo: "Service",
  service: "",
  whatHappened: "",
  priority: "High",
  owner: "",
  ownerRole: "",
  targetDate: "",
  immediateAction: "",
  status: "Open",
};

const dateValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const idOf = (value) => String(value?._id || value?.id || value || "");

const itemName = (item) => {
  if (typeof item === "string") return item;
  return (
    item?.name ||
    item?.service ||
    item?.functionName ||
    item?.companyName ||
    item?.vendor?.name ||
    item?.vendor?.companyName ||
    ""
  );
};

function Field({ label, required, children, help, className = "" }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-[10px] font-medium text-foreground">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      {help ? (
        <p className="flex items-center gap-1 text-[9px] leading-3 text-muted-foreground">
          <Info className="h-3 w-3 shrink-0" />
          {help}
        </p>
      ) : null}
    </div>
  );
}

function FormSection({ number, title, children }) {
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

export default function AddIssueDialog({
  open,
  onOpenChange,
  booking,
  initialData = null,
  saving = false,
  onSave,
}) {
  const [form, setForm] = useState(emptyForm);
  const isEditing = Boolean(initialData?._id || initialData?.id);
  const feedbacks = booking?.feedbacks || [];
  const clientName = booking?.customer?.name || booking?.eventName || "Event Booking";

  useEffect(() => {
    if (!open) return;
    setForm(
      initialData
        ? {
            ...emptyForm,
            ...initialData,
            title:
              initialData.title ||
              initialData.issueTitle ||
              initialData.description ||
              "",
            linkedFeedbackId: idOf(initialData.linkedFeedbackId),
            whatHappened:
              initialData.whatHappened || initialData.description || "",
            owner: initialData.owner || initialData.assignee || "",
            targetDate: dateValue(
              initialData.targetDate || initialData.date,
            ),
            immediateAction:
              initialData.immediateAction || initialData.actionTaken || "",
          }
        : emptyForm,
    );
  }, [initialData, open]);

  const ownerOptions = useMemo(() => {
    const people = [
      booking?.assignedManager,
      ...(booking?.assignedTeam || []).map((item) => item.employee || item),
      ...(booking?.eventTasks || []).map((item) => item.assignedTo),
    ].filter(Boolean);
    const values = people.map((person) => ({
      name: person.name || person.assignedToName || "",
      role: person.designation || person.role || "",
    }));
    if (form.owner) values.push({ name: form.owner, role: form.ownerRole });
    if (!values.some((item) => item.name === "Admin Team")) {
      values.push({ name: "Admin Team", role: "Administration" });
    }
    return [
      ...new Map(
        values
          .filter((item) => item.name)
          .map((item) => [item.name.toLowerCase(), item]),
      ).values(),
    ];
  }, [booking, form.owner, form.ownerRole]);

  const relatedItems = useMemo(() => {
    let values = [];
    if (form.relatedTo === "Service") {
      values = [
        ...(booking?.servicesSelected || []),
        ...(booking?.servicesRequired || []),
      ];
    } else if (form.relatedTo === "Vendor") {
      values = booking?.vendorAssignments || [];
    } else if (form.relatedTo === "Function") {
      values = booking?.functions || [];
    } else if (form.relatedTo === "Operations") {
      values = ["Event Operations", "Hospitality", "Logistics", "Inventory"];
    } else if (form.relatedTo === "Overall Event") {
      values = ["Overall Event"];
    } else {
      values = ["Other"];
    }
    const names = [...values.map(itemName), form.service].filter(Boolean);
    if (form.relatedTo === "Service" && names.length === 0) {
      names.push("Catering", "Decor", "Hospitality", "Photography", "Transport");
    }
    return [...new Map(names.map((name) => [name.toLowerCase(), name])).values()];
  }, [booking, form.relatedTo, form.service]);

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const updateOwner = (owner) => {
    const selected = ownerOptions.find((item) => item.name === owner);
    setForm((current) => ({
      ...current,
      owner,
      ownerRole: selected?.role || current.ownerRole,
    }));
  };

  const submit = () => {
    if (
      !form.title.trim() ||
      !form.source ||
      (feedbacks.length > 0 && !form.linkedFeedbackId) ||
      !form.relatedTo ||
      !form.service.trim() ||
      !form.whatHappened.trim() ||
      !form.owner.trim() ||
      !form.targetDate
    ) {
      toast.error("Please fill all required issue fields.");
      return;
    }

    onSave?.({
      title: form.title.trim(),
      source: form.source,
      linkedFeedbackId: form.linkedFeedbackId || null,
      relatedTo: form.relatedTo,
      service: form.service.trim(),
      whatHappened: form.whatHappened.trim(),
      priority: form.priority,
      owner: form.owner.trim(),
      ownerRole: form.ownerRole.trim(),
      targetDate: form.targetDate,
      immediateAction: form.immediateAction.trim(),
      status: form.status || "Open",
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}
    >
      <DialogContent
        className="flex max-h-[94dvh] w-[calc(100vw-20px)] max-w-[760px] flex-col gap-0 overflow-hidden rounded-md border-border bg-background p-0"
      >
        <DialogHeader className="shrink-0 border-b border-border px-3.5 py-1.5 pr-11 text-left">
          <DialogTitle className="text-base font-semibold">
            {isEditing ? "Edit Issue" : "Add Issue"}
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            Record an event issue and assign responsibility for follow-up.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2.5">
          <div className="flex items-center gap-2.5 rounded-md border border-primary/15 bg-primary/[0.04] px-2.5 py-1.5">
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

          <fieldset disabled={saving} className="space-y-1.5">
            <FormSection number="1" title="Issue Details">
              <div className="grid gap-x-2 gap-y-1.5 sm:grid-cols-2">
                <Field label="Issue Title" required>
                  <Input className="h-7 text-[10px]" value={form.title} maxLength={150} placeholder="Enter a short title for the issue" onChange={(event) => update("title", event.target.value)} />
                </Field>

                <Field label="Issue Source" required>
                  <Select value={form.source} onValueChange={(value) => update("source", value)}>
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{ISSUE_SOURCES.map((item) => <SelectItem key={item} value={item} className="text-xs">{item}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>

                <Field label="Linked Feedback" required={feedbacks.length > 0} className="sm:col-span-2" help="Link the feedback from which this issue has been raised.">
                  <Select value={form.linkedFeedbackId || undefined} onValueChange={(value) => update("linkedFeedbackId", value)} disabled={!feedbacks.length}>
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder={feedbacks.length ? "Select the related feedback" : "No feedback available"} /></SelectTrigger>
                    <SelectContent>{feedbacks.map((item, index) => {
                      const feedbackId = idOf(item) || `feedback-${index}`;
                      const summary = item.observation || item.feedbackSummary || "Feedback";
                      return <SelectItem key={feedbackId} value={feedbackId} className="text-xs">{item.nameReference || item.feedbackFrom || "Feedback"} — {summary.slice(0, 65)}</SelectItem>;
                    })}</SelectContent>
                  </Select>
                </Field>

                <Field label="Related To" required help="Choose the area of the event this issue is related to.">
                  <Select value={form.relatedTo} onValueChange={(value) => setForm((current) => ({ ...current, relatedTo: value, service: "" }))}>
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{RELATED_TO_OPTIONS.map((item) => <SelectItem key={item} value={item} className="text-xs">{item}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>

                <Field label={`Select ${form.relatedTo === "Overall Event" ? "Area" : form.relatedTo}`} required>
                  <Select value={form.service || undefined} onValueChange={(value) => update("service", value)}>
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder={`Select ${form.relatedTo.toLowerCase()}`} /></SelectTrigger>
                    <SelectContent>{relatedItems.map((item) => <SelectItem key={item} value={item} className="text-xs">{item}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>

                <Field label="What Happened" required className="sm:col-span-2">
                  <div className="relative">
                    <Textarea className="min-h-12 resize-none pb-4 text-[10px]" value={form.whatHappened} maxLength={1000} placeholder="Describe the issue in detail. Be specific and factual." onChange={(event) => update("whatHappened", event.target.value)} />
                    <span className="absolute bottom-1.5 right-2 text-[9px] text-muted-foreground">{form.whatHappened.length}/1000</span>
                  </div>
                </Field>
              </div>
            </FormSection>

            <FormSection number="2" title="Action & Ownership">
              <div className="grid gap-x-2 gap-y-1.5 md:grid-cols-3">
                <Field label="Priority" required>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PRIORITIES.map((item) => (
                      <button key={item.value} type="button" aria-pressed={form.priority === item.value} onClick={() => update("priority", item.value)} className={`flex h-7 items-center justify-center gap-1 rounded-md border text-[9px] font-semibold transition ${item.className} ${form.priority === item.value ? "ring-2 ring-primary/30" : "opacity-65 hover:opacity-100"}`}>
                        <span className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border-2 border-current">
                          <span
                            className={`h-1.5 w-1.5 rounded-full bg-current transition-opacity ${
                              form.priority === item.value
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                        </span>
                        {item.value}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Owner" required>
                  <Select value={form.owner || undefined} onValueChange={updateOwner}>
                    <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Select owner" /></SelectTrigger>
                    <SelectContent>{ownerOptions.map((item) => <SelectItem key={item.name} value={item.name} className="text-xs">{item.name}{item.role ? ` — ${item.role}` : ""}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>

                <Field label="Target Date" required>
                  <Input type="date" className="h-7 text-[10px]" value={form.targetDate} onChange={(event) => update("targetDate", event.target.value)} />
                </Field>

                <Field label="Immediate Action / Next Step (Optional)" className="md:col-span-3">
                  <div className="relative">
                    <Textarea className="min-h-10 resize-none pb-4 text-[10px]" value={form.immediateAction} maxLength={500} placeholder="Enter the immediate action or next steps to address this issue." onChange={(event) => update("immediateAction", event.target.value)} />
                    <span className="absolute bottom-1.5 right-2 text-[9px] text-muted-foreground">{form.immediateAction.length}/500</span>
                  </div>
                </Field>
              </div>
            </FormSection>
          </fieldset>

          {!isEditing ? (
            <div className="flex items-start gap-2 rounded-md border border-primary/15 bg-primary/[0.05] px-2.5 py-1.5 text-primary">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold">New issues are created with Open status.</p>
                <p className="mt-0.5 text-[10px] opacity-80">Status can be updated from the issue log after creation.</p>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 flex-row justify-between gap-2 border-t border-border bg-muted/20 px-3.5 py-1.5 sm:justify-between sm:space-x-0">
          <Button type="button" variant="outline" size="sm" className="h-8 min-w-28 text-xs" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" size="sm" className="h-8 min-w-36 gap-1.5 text-xs" disabled={saving} onClick={submit}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Issue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


