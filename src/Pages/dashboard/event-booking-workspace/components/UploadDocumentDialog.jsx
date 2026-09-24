/* eslint-disable react/prop-types */
import { useRef, useState } from "react";
import {
  CalendarDays,
  CloudUpload,
  Info,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Upload,
  X,
} from "lucide-react";

import { Badge } from "@components/components/ui/badge";
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
import { documentOptions } from "../eventDocument.constants";
import {
  bookingCode,
  customerPhone,
  eventDateLabel,
  initials,
} from "../eventBookingDashboard.utils";
import { fileSize } from "../eventFinance.utils";

const formats = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const valuesFor = (record) => ({
  documentName: record?.documentName || "",
  documentType: record?.documentType || "",
  linkedModule: record?.linkedModule || "Booking",
  visibility:
    record?.visibility === "Client Visible"
      ? "Client Shareable"
      : record?.visibility || "Internal Only",
  documentDate: record?.documentDate?.slice(0, 10) || "",
  notes: record?.notes || "",
});

function Section({ number, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3 bg-primary/5 px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          {number}
        </span>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="grid gap-5 p-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export default function UploadDocumentDialog({
  booking = {},
  record,
  options = {},
  saving,
  onSave,
  onClose,
}) {
  const [form, setForm] = useState(() => valuesFor(record));
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const categories = (
    options.categories ||
    options.uploadCategories ||
    documentOptions.uploadCategories
  ).filter(
    (value) => !["Quotation", "Invoice", "Receipt"].includes(value),
  );
  const modules = options.linkedModules || documentOptions.linkedModules;
  const visibilities = [
    ...(options.visibilities || documentOptions.visibilities),
  ].sort(
    (left, right) =>
      Number(right === "Internal Only") - Number(left === "Internal Only"),
  );

  const pick = (files) => {
    if (saving || !files?.length) return;
    if (files.length !== 1) {
      setFile(null);
      setError("Select one file only.");
      return;
    }
    const selected = files[0];
    const extension = selected.name.split(".").pop().toLowerCase();
    if (!formats[extension] || selected.type !== formats[extension]) {
      setFile(null);
      setError(
        "Upload a PDF, JPG, PNG, DOCX, or XLSX file with a matching file type.",
      );
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setFile(null);
      setError("Document must not exceed 10 MB.");
      return;
    }
    setFile(selected);
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (
      !form.documentName.trim() ||
      !categories.includes(form.documentType) ||
      !modules.includes(form.linkedModule) ||
      !visibilities.includes(form.visibility)
    ) {
      setError(
        "Enter a document title and select a category, linked module and visibility.",
      );
      return;
    }
    if (!record && !file) {
      setError("Please select a document to upload.");
      return;
    }

    const values = {
      ...form,
      documentName: form.documentName.trim(),
      notes: form.notes.trim(),
      documentDate: form.documentDate || null,
    };
    const original = valuesFor(record);
    const payload = record
      ? Object.fromEntries(
          Object.entries(values).filter(
            ([key, value]) =>
              value !==
              (key === "documentDate" ? original[key] || null : original[key]),
          ),
        )
      : values;
    if (file) payload.document = file;
    if (record && !Object.keys(payload).length) {
      onClose();
      return;
    }

    try {
      setError("");
      await onSave(payload);
      onClose();
    } catch (failure) {
      setError(
        (
          failure.response?.data?.message ||
          failure.message ||
          "Unable to save document."
        ).replace("|ERRDVYM_VALIDATION", ""),
      );
    }
  };

  const client =
    booking.customer?.name || booking.clientName || "Client";
  const select = (key, label, values, hint) => (
    <div className="space-y-2">
      <Label htmlFor={`document-${key}`}>
        {label} <span className="text-destructive">*</span>
      </Label>
      <Select
        value={form[key]}
        onValueChange={(value) => update(key, value)}
        disabled={saving}
      >
        <SelectTrigger id={`document-${key}`}>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {values.map((value) => (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-1.5rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 px-5 py-4 text-left">
          <DialogTitle>
            {record ? "Edit Document" : "Upload Document"}
          </DialogTitle>
          <DialogDescription>
            Upload and organize important documents for this booking.
          </DialogDescription>
        </DialogHeader>
        <form
          id="event-document-form"
          onSubmit={submit}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-5"
        >
          <div className="grid gap-4 rounded-lg border border-primary/15 bg-primary/5 p-4 lg:grid-cols-4">
            <div className="flex items-center gap-3 lg:col-span-2">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-primary/10 text-lg font-semibold text-primary">
                {initials(client)}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{client}</h3>
                  {booking.bookingStatus ? (
                    <Badge variant="secondary">{booking.bookingStatus}</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {bookingCode(booking)} · {booking.eventType || booking.eventName || "Event"} · {eventDateLabel(booking, { includeWeekday: true })}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {[booking.venue, booking.city].filter(Boolean).join(", ") ||
                    "Venue not set"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 lg:border-l lg:pl-4">
              <CalendarDays className="h-6 w-6 shrink-0 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Event Date</p>
                <p className="mt-1 text-sm font-semibold">
                  {eventDateLabel(booking, { includeWeekday: true })}
                </p>
              </div>
            </div>
            <div className="space-y-2 text-xs lg:border-l lg:pl-4">
              <p className="text-muted-foreground">Client Contact</p>
              <p className="flex gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                {customerPhone(booking)}
              </p>
              <p className="flex gap-2 break-all">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                {booking.customer?.email ||
                  booking.clientEmail ||
                  "Email not provided"}
              </p>
            </div>
          </div>

          <fieldset disabled={saving} className="min-w-0 space-y-4">
            <Section
              number="1"
              title="Document Details"
              description="Enter the details of the document you want to upload."
            >
              <div className="space-y-2">
                <Label htmlFor="document-title">
                  Document Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="document-title"
                  required
                  maxLength={200}
                  value={form.documentName}
                  onChange={(event) =>
                    update("documentName", event.target.value)
                  }
                  placeholder="Enter document title (e.g. Venue Contract, Menu, Layout Plan)"
                />
              </div>
              {select("documentType", "Document Category", categories)}
              {select(
                "linkedModule",
                "Linked To",
                modules,
                "Select what this document is related to.",
              )}
              <div className="space-y-2">
                <Label htmlFor="document-related">Related Item</Label>
                <Input
                  id="document-related"
                  readOnly
                  value={`${bookingCode(booking)} (${client})`}
                  className="bg-muted/40"
                />
                <p className="text-xs text-muted-foreground">
                  This document will be linked to the current booking.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="document-date">Document Date</Label>
                <Input
                  id="document-date"
                  type="date"
                  value={form.documentDate}
                  onChange={(event) =>
                    update("documentDate", event.target.value)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Select the document date (optional).
                </p>
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  Visibility <span className="text-destructive">*</span>
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {visibilities.map((visibility) => (
                    <label
                      key={visibility}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${form.visibility === visibility ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <input
                        type="radio"
                        name="document-visibility"
                        className="mt-1 accent-primary"
                        checked={form.visibility === visibility}
                        onChange={() => update("visibility", visibility)}
                      />
                      <span className="text-xs">
                        <strong>{visibility}</strong>
                        <span className="mt-1 block text-muted-foreground">
                          {visibility === "Internal Only"
                            ? "Visible to your team members only"
                            : "Can be shared with the client"}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </Section>

            <Section
              number="2"
              title="File & Notes"
              description="Upload the document file and add any additional notes (optional)."
            >
              <div className="space-y-2">
                <Label htmlFor="document-file">
                  {record ? "Replace File (Optional)" : "Upload File *"}
                </Label>
                <input
                  ref={fileRef}
                  id="document-file"
                  type="file"
                  className="sr-only"
                  accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
                  onChange={(event) => {
                    pick(event.target.files);
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    pick(event.dataTransfer.files);
                  }}
                  className={`flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dragging ? "border-primary bg-primary/10" : "border-border"}`}
                >
                  <CloudUpload className="h-8 w-8 text-muted-foreground" />
                  <span className="break-all">
                    {file ? (
                      file.name
                    ) : (
                      <>
                        <strong className="text-primary">Click to upload</strong>{" "}
                        or drag and drop
                      </>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {file
                      ? fileSize(file.size)
                      : "PDF, JPG, PNG, DOCX, XLSX (Max 10 MB, 1 file only)"}
                  </span>
                </button>
                {file ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Remove selected file
                  </Button>
                ) : null}
                {record && !file ? (
                  <p className="text-xs text-muted-foreground">
                    The current file is kept unless you select a replacement.
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="document-notes">
                  Internal Note / Description (Optional)
                </Label>
                <Textarea
                  id="document-notes"
                  maxLength={300}
                  value={form.notes}
                  onChange={(event) => update("notes", event.target.value)}
                  placeholder="Add a short note about this document (optional)"
                  className="min-h-32"
                />
                <p className="text-right text-xs text-muted-foreground">
                  {form.notes.length}/300
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-md border border-primary/15 bg-primary/5 p-3 text-xs md:col-span-2">
                <Info className="h-5 w-5 shrink-0 text-primary" />
                <p>
                  <strong>Important:</strong> Quotations, invoices and receipts
                  are system-generated and managed through their respective
                  sections. Please do not upload them here.
                </p>
              </div>
            </Section>
          </fieldset>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </form>
        <DialogFooter className="shrink-0 border-t p-4 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="event-document-form"
            variant="custom"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {record ? "Save Document" : "Upload Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
