/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import {
  CircleAlert,
  Eye,
  FileImage,
  FileSpreadsheet,
  FileText,
  Files,
  HardDrive,
  Loader2,
  LockKeyhole,
  Plus,
  Search,
  Users,
} from "lucide-react";

import { Badge } from "@components/components/ui/badge";
import { Button } from "@components/components/ui/button";
import { Card, CardContent } from "@components/components/ui/card";
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
import { Skeleton } from "@components/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./EventTable";
import { Textarea } from "@components/components/ui/textarea";
import { fileSize, idOf, numberOf, shortDate } from "../eventFinance.utils";
import FinancePaginationFooter from "./FinancePaginationFooter";

const categoryClasses = {
  Proposal:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  Agreement:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  Invoice:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  Receipt:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  Vendor:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  Finance:
    "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300",
  Operations:
    "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
  Compliance:
    "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300",
  Quotation:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  Menu: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
  Image:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
  "Client Document":
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300",
  Design:
    "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-800 dark:bg-pink-950/40 dark:text-pink-300",
  Internal: "border-border bg-muted text-muted-foreground",
  Document: "border-border bg-muted text-muted-foreground",
  Other: "border-border bg-muted text-muted-foreground",
};

const visibilityClasses = {
  "Client Visible":
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  "Internal Only":
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
};

const defaultForm = {
  documentName: "",
  documentType: "Document",
  linkedModule: "Event",
  visibility: "Internal Only",
  version: "1",
  notes: "",
  document: null,
};

function DocumentIcon({ document }) {
  const type = String(document.fileType || "").toLowerCase();
  const name = String(document.documentName || "").toLowerCase();
  let Icon = FileText;
  let iconClass = "text-red-600 dark:text-red-300";

  if (type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/.test(name)) {
    Icon = FileImage;
    iconClass = "text-blue-600 dark:text-blue-300";
  } else if (/spreadsheet|excel/.test(type) || /\.(xlsx?|csv)$/.test(name)) {
    Icon = FileSpreadsheet;
    iconClass = "text-emerald-600 dark:text-emerald-300";
  }

  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border bg-background shadow-sm">
      <Icon className={`h-6 w-6 ${iconClass}`} />
    </span>
  );
}

function DocumentSummary({ summary = {} }) {
  const cards = [
    {
      label: "Total Documents",
      value: numberOf(summary.totalDocuments),
      icon: Files,
      tone: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
      surface:
        "border-blue-100 bg-blue-50/55 dark:border-blue-900/60 dark:bg-blue-950/20",
      valueTone: "text-blue-950 dark:text-blue-100",
    },
    {
      label: "Client Visible",
      value: numberOf(summary.clientVisible),
      icon: Users,
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
      surface:
        "border-emerald-100 bg-emerald-50/55 dark:border-emerald-900/60 dark:bg-emerald-950/20",
      valueTone: "text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Internal Only",
      value: numberOf(summary.internalOnly),
      icon: LockKeyhole,
      tone: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
      surface:
        "border-rose-100 bg-rose-50/55 dark:border-rose-900/60 dark:bg-rose-950/20",
      valueTone: "text-rose-700 dark:text-rose-300",
    },
    {
      label: "Total Size",
      value: fileSize(summary.totalSize),
      icon: HardDrive,
      tone: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
      surface:
        "border-violet-100 bg-violet-50/55 dark:border-violet-900/60 dark:bg-violet-950/20",
      valueTone: "text-violet-700 dark:text-violet-300",
    },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, tone, surface, valueTone }) => (
        <Card key={label} className={`${surface} shadow-sm`}>
          <CardContent className="flex items-center gap-3 p-3">
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                {label}
              </p>
              <p className={`mt-0.5 text-lg font-bold ${valueTone}`}>{value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UploadDocumentDialog({ open, onOpenChange, options, saving, onSave }) {
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({
      ...defaultForm,
      documentType: options.categories?.includes("Document")
        ? "Document"
        : options.categories?.[0] || "Document",
      linkedModule: options.linkedModules?.includes("Event")
        ? "Event"
        : options.linkedModules?.[0] || "Event",
      visibility: options.visibilities?.includes("Internal Only")
        ? "Internal Only"
        : options.visibilities?.[0] || "Internal Only",
    });
    setError("");
  }, [open, options]);

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.document) {
      setError("Please select a document to upload.");
      return;
    }
    try {
      await onSave({
        ...form,
        documentName:
          form.documentName.trim() ||
          form.document.name.replace(/\.[^.]+$/, ""),
        notes: form.notes.trim(),
        version: numberOf(form.version) || 1,
      });
      onOpenChange(false);
    } catch {
      // The page mutation displays the request error.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Event Document</DialogTitle>
          <DialogDescription>
            Add a finance or event file and control where it is visible.
          </DialogDescription>
        </DialogHeader>
        <form
          id="upload-event-document"
          onSubmit={submit}
          className="grid gap-3 py-1 sm:grid-cols-2"
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="event-document-file">Document File</Label>
            <Input
              id="event-document-file"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp"
              onChange={(event) =>
                update("document", event.target.files?.[0] || null)
              }
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="event-document-name">File Name</Label>
            <Input
              id="event-document-name"
              value={form.documentName}
              onChange={(event) => update("documentName", event.target.value)}
              placeholder="Defaults to the uploaded file name"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={form.documentType}
              onValueChange={(value) => update("documentType", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(options.categories || []).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Linked Module</Label>
            <Select
              value={form.linkedModule}
              onValueChange={(value) => update("linkedModule", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(options.linkedModules || []).map((module) => (
                  <SelectItem key={module} value={module}>
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Visibility</Label>
            <Select
              value={form.visibility}
              onValueChange={(value) => update("visibility", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(options.visibilities || []).map((visibility) => (
                  <SelectItem key={visibility} value={visibility}>
                    {visibility}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-document-version">Version</Label>
            <Input
              id="event-document-version"
              type="number"
              min="1"
              step="1"
              value={form.version}
              onChange={(event) => update("version", event.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="event-document-notes">Notes</Label>
            <Textarea
              id="event-document-notes"
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Optional internal note"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive sm:col-span-2">{error}</p>
          ) : null}
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button variant="custom" type="submit" form="upload-event-document" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Upload Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <Card>
      <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
        <CircleAlert className="h-8 w-8 text-destructive" />
        <div>
          <p className="font-semibold">Unable to load event documents</p>
          <p className="text-sm text-muted-foreground">
            {error?.response?.data?.message ||
              "Please check the connection and try again."}
          </p>
        </div>
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
}

export default function EventDocumentsPanel({
  data,
  filters,
  onFiltersChange,
  loading,
  error,
  onRetry,
  onUpload,
  uploading,
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const setFilter = (key, value) =>
    onFiltersChange({ ...filters, [key]: value, page: 1 });

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 xl:flex-row xl:justify-end">
        <div className="relative min-w-0 flex-1 xl:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(event) => setFilter("search", event.target.value)}
            className="h-9 pl-9"
            placeholder="Search documents..."
            aria-label="Search event documents"
          />
        </div>
        <Select
          value={filters.category}
          onValueChange={(value) => setFilter("category", value)}
        >
          <SelectTrigger className="h-9 w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Category</SelectItem>
            {(data?.options?.categories || []).map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.visibility}
          onValueChange={(value) => setFilter("visibility", value)}
        >
          <SelectTrigger className="h-9 w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Visibility</SelectItem>
            {(data?.options?.visibilities || []).map((visibility) => (
              <SelectItem key={visibility} value={visibility}>
                {visibility}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.linkedModule}
          onValueChange={(value) => setFilter("linkedModule", value)}
        >
          <SelectTrigger className="h-9 w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Linked Module</SelectItem>
            {(data?.options?.linkedModules || []).map((module) => (
              <SelectItem key={module} value={module}>
                {module}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="custom"
          size="sm"
          onClick={() => setUploadOpen(true)}
          className="h-9 gap-2 px-4"
        >
          <Plus className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : (
        <>
          <DocumentSummary summary={data?.summary} />
          <Card className="overflow-hidden shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[1120px] table-fixed">
                  <colgroup>
                    <col className="w-[19%]" />
                    <col className="w-[11%]" />
                    <col className="w-[13%]" />
                    <col className="w-[11%]" />
                    <col className="w-[13%]" />
                    <col className="w-[11%]" />
                    <col className="w-[8%]" />
                    <col className="w-[14%]" />
                  </colgroup>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="h-10">File Name</TableHead>
                      <TableHead className="h-10">Category</TableHead>
                      <TableHead className="h-10">Linked To</TableHead>
                      <TableHead className="h-10">Visibility</TableHead>
                      <TableHead className="h-10">Uploaded By</TableHead>
                      <TableHead className="h-10">Uploaded On</TableHead>
                      <TableHead className="h-10">Version</TableHead>
                      <TableHead className="sticky right-0 z-10 h-10 bg-muted pr-4 text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.documents?.length ? (
                      data.documents.map((document) => (
                        <TableRow
                          key={idOf(document) || document.fileUrl}
                          className="group"
                        >
                          <TableCell className="py-2">
                            <div className="flex min-w-0 items-center gap-3">
                              <DocumentIcon document={document} />
                              <div className="min-w-0">
                                <p
                                  className="truncate font-medium text-blue-950 dark:text-blue-200"
                                  title={document.documentName}
                                >
                                  {document.documentName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {fileSize(document.fileSize)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`min-w-20 justify-center ${
                                categoryClasses[document.documentType] ||
                                categoryClasses.Other
                              }`}
                            >
                              {document.documentType}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-blue-950 dark:text-blue-200">
                            {document.linkedModule || "Event"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`min-w-24 justify-center ${
                                visibilityClasses[document.visibility] ||
                                "border-border bg-muted text-muted-foreground"
                              }`}
                            >
                              {document.visibility}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {document.uploadedByName || "Admin"}
                          </TableCell>
                          <TableCell>
                            {shortDate(document.uploadedOn)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              v{numberOf(document.version) || 1}
                            </Badge>
                          </TableCell>
                          <TableCell className="sticky right-0 bg-card pr-4 text-right group-hover:bg-muted/50">
                            {document.fileUrl ? (
                              <Button size="sm" variant="outline" asChild className="gap-1 text-blue-700">
                                <a
                                  href={document.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Eye className="h-4 w-4" />
                                  View File
                                </a>
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="h-40 text-center text-muted-foreground"
                        >
                          No documents match the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <FinancePaginationFooter
                pagination={data?.pagination}
                compact
                onChange={(values) =>
                  onFiltersChange({ ...filters, ...values })
                }
              />
            </CardContent>
          </Card>
        </>
      )}

      <UploadDocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        options={data?.options || {}}
        saving={uploading}
        onSave={onUpload}
      />
    </div>
  );
}
