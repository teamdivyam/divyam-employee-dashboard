/* eslint-disable react/prop-types */
import EventMetricCards from "./EventMetricCards";
import { useState } from "react";
import {
  CircleAlert,
  FileImage,
  FileSpreadsheet,
  FileText,
  Files,
  HardDrive,
  LockKeyhole,
  Plus,
  Search,
  Users,
} from "lucide-react";

import { Badge } from "@components/components/ui/badge";
import { Button } from "@components/components/ui/button";
import { Card, CardContent } from "@components/components/ui/card";
import { Input } from "@components/components/ui/input";
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
import { fileSize, idOf, numberOf, shortDate } from "../eventFinance.utils";
import { bookingCode, initials } from "../eventBookingDashboard.utils";
import { documentOptions } from "../eventDocument.constants";
import FinancePaginationFooter from "./FinancePaginationFooter";
import UploadDocumentDialog from "./UploadDocumentDialog";

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
  "Client Shareable":
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  "Internal Only":
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
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

export function DocumentSummary({ summary = {} }) {
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

  return <EventMetricCards items={cards} />;
}

function LoadingState() {
  return (
    <div className="space-y-2">
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
  booking,
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
      <Card className="min-w-0 overflow-hidden">
        <CardContent className="p-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <div className="relative min-w-44 flex-1 basis-44">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            maxLength={200}
            value={filters.search}
            onChange={(event) => setFilter("search", event.target.value)}
            className="h-9 pl-9 text-xs"
            placeholder="Search documents..."
            aria-label="Search event documents"
          />
        </div>
        <Select
          value={filters.category}
          onValueChange={(value) => setFilter("category", value)}
        >
          <SelectTrigger className="h-9 w-full text-xs sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Category</SelectItem>
            {(data?.options?.categories || [...documentOptions.uploadCategories, "Quotation", "Invoice", "Receipt"]).map((category) => (
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
          <SelectTrigger className="h-9 w-full text-xs sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Visibility</SelectItem>
            {(data?.options?.visibilities || documentOptions.visibilities).map((visibility) => (
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
          <SelectTrigger className="h-9 w-full text-xs sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Linked Module</SelectItem>
            {(data?.options?.linkedModules || documentOptions.linkedModules).map((module) => (
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
        <div className="min-w-0">
              <div className="overflow-x-auto">
                <Table
                  headerVariant="section"
                  className="min-w-[1120px] table-fixed"
                >
                  <colgroup>
                    {[25, 14, 14, 14, 10, 15, 8].map((width, index) => (
                      <col key={index} style={{ width: `${width}%` }} />
                    ))}
                  </colgroup>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="h-10">Document</TableHead>
                      <TableHead className="h-10">Category</TableHead>
                      <TableHead className="h-10">Linked To</TableHead>
                      <TableHead className="h-10">Visibility</TableHead>
                      <TableHead className="h-10">Document Date</TableHead>
                      <TableHead className="h-10">Added By</TableHead>
                      <TableHead className="h-10">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.documents?.length ? (
                      data.documents.map((document) => {
                        const editable =
                          document.sourceType === "event" ||
                          (!document.sourceType && document.canDelete === true);
                        const shareable = [
                          "Client Shareable",
                          "Client Visible",
                        ].includes(document.visibility);
                        const visibility = shareable
                          ? "Client Shareable"
                          : document.visibility;
                        const VisibilityIcon = shareable
                          ? Users
                          : LockKeyhole;
                        const url = /^https?:\/\//i.test(
                          document.fileUrl || "",
                        )
                          ? document.fileUrl
                          : undefined;
                        let filename = "";
                        try {
                          filename = url
                            ? decodeURIComponent(
                                new URL(url).pathname.split("/").pop(),
                              )
                            : "";
                        } catch {
                          // Keep the document title when a filename is unavailable.
                        }
                        const uploadedAt = new Date(document.uploadedOn);
                        const timestamp = !Number.isNaN(uploadedAt.getTime())
                          ? uploadedAt.toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-";

                        return (
                        <TableRow
                          key={`${document.sourceType || "document"}-${idOf(document) || document.fileUrl}`}
                        >
                          <TableCell className="py-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <DocumentIcon document={document} />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1">
                                  <p className="break-words font-medium">
                                    {document.documentName}
                                  </p>
                                  {!editable ? (
                                    <Badge
                                      variant="secondary"
                                      className="text-[9px]"
                                    >
                                      Related Attachment
                                    </Badge>
                                  ) : null}
                                </div>
                                <p
                                  className="mt-1 truncate text-[10px] text-muted-foreground"
                                  title={filename}
                                >
                                  {filename ? `${filename} · ` : ""}
                                  {fileSize(document.fileSize)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                categoryClasses[document.documentType] ||
                                categoryClasses.Other
                              }
                            >
                              {document.documentType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">
                              {document.linkedModule || "Event"}
                            </p>
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {bookingCode(booking || data?.event || {})}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`gap-1 text-[10px] ${visibilityClasses[visibility] || ""}`}
                            >
                              <VisibilityIcon className="h-3 w-3" />
                              {visibility || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {shortDate(document.documentDate)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-[10px] font-semibold text-primary">
                                {initials(document.uploadedByName || "Admin")}
                              </span>
                              <div>
                                <p className="text-xs font-medium">
                                  {document.uploadedByName || "Admin"}
                                </p>
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                  {timestamp}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {url ? (
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                                className="h-8 px-2 text-primary"
                              >
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View
                                </a>
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
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
        </div>
      )}
        </CardContent>
      </Card>

      {uploadOpen ? (
        <UploadDocumentDialog
          key="new"
          booking={booking}
          options={data?.options || {}}
          saving={uploading}
          onClose={() => setUploadOpen(false)}
          onSave={onUpload}
        />
      ) : null}
    </div>
  );
}
