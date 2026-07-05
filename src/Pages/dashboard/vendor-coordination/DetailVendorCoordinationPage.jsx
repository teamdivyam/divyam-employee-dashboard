import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import { Textarea } from "@components/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Image,
  Loader2,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  Send,
  Upload,
  UserRound,
} from "lucide-react";
import EmployeeService from "@/services/employee.service";
import {
  DetailItem,
  formatDate,
  formatTime,
  SectionCard,
  StatusBadge,
  VendorLogo,
} from "./components/VendorCoordinationUI";

const statusSteps = [
  "Contacted",
  "Confirmed",
  "Material Dispatched",
  "Reached Venue",
  "Setup In Progress",
  "Completed",
];

export default function DetailVendorCoordinationPage() {
  const { vendorId, assignmentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusForm, setStatusForm] = useState({ status: "Setup In Progress", confirmationStatus: "Confirmed", note: "" });
  const [issue, setIssue] = useState({ issueType: "Material Shortage", urgency: "High", notes: "", proof: null });
  const [proof, setProof] = useState({ title: "", notes: "", files: [] });
  const [note, setNote] = useState("");

  const detailQuery = useQuery({
    queryKey: ["vendor-coordination-detail", vendorId, assignmentId],
    queryFn: async () => {
      const response = await EmployeeService.getVendorCoordinationDetail({ vendorId, assignmentId });
      return response.data.vendorCoordination;
    },
    enabled: Boolean(vendorId) && Boolean(assignmentId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["vendor-coordination-detail", vendorId, assignmentId] });

  const statusMutation = useMutation({
    mutationFn: () => EmployeeService.updateVendorCoordinationStatus({ vendorId, assignmentId, ...statusForm }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Vendor status updated");
      invalidate();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update status"),
  });

  const proofMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      proof.files.forEach((file) => formData.append("proof", file));
      formData.append("title", proof.title || "Vendor Proof");
      formData.append("notes", proof.notes || "");
      return EmployeeService.uploadVendorCoordinationProof({ vendorId, assignmentId, formData });
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Proof uploaded");
      setProof({ title: "", notes: "", files: [] });
      invalidate();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to upload proof"),
  });

  const issueMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append("issueType", issue.issueType);
      formData.append("urgency", issue.urgency);
      formData.append("notes", issue.notes);
      if (issue.proof) formData.append("proof", issue.proof);
      return EmployeeService.raiseVendorCoordinationIssue({ vendorId, assignmentId, formData });
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Issue raised");
      setIssue({ issueType: "Material Shortage", urgency: "High", notes: "", proof: null });
      invalidate();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to raise issue"),
  });

  const noteMutation = useMutation({
    mutationFn: () => EmployeeService.addVendorCoordinationNote({ vendorId, assignmentId, note }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Note added");
      setNote("");
      invalidate();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to add note"),
  });

  const vendor = detailQuery.data;

  if (detailQuery.isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-4 text-sm font-semibold text-foreground shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-theme-color" />
          Loading vendor coordination
        </div>
      </div>
    );
  }

  if (detailQuery.isError || !vendor) {
    return (
      <div className="p-5">
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300">
          Unable to load vendor coordination detail.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-4 text-foreground md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold text-foreground">{vendor.vendorName}</h1>
              <StatusBadge>{vendor.confirmationStatus}</StatusBadge>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/dashboard/vendor-coordination" className="hover:text-primary">Vendor Coordination</Link>
              <span>/</span>
              <span>{vendor.vendorName}</span>
            </div>
          </div>
          <Button variant="outline" className="h-10 gap-2 rounded-md" onClick={() => navigate("/dashboard/vendor-coordination")}>
            <ArrowLeft className="h-4 w-4" />
            Back to Vendor List
          </Button>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="grid gap-8 lg:grid-cols-[180px_1fr]">
                <VendorLogo name={vendor.vendorName} size="large" />
                <div className="grid gap-6 md:grid-cols-4">
                  <DetailItem icon={PackageCheck} label="Vendor Name" value={vendor.vendorName} />
                  <DetailItem icon={PackageCheck} label="Category / Service" value={vendor.service || vendor.category} />
                  <DetailItem icon={UserRound} label="Contact Person" value={vendor.contactPerson} />
                  <DetailItem icon={Phone} label="Mobile Number" value={vendor.mobileNumber} />
                  <DetailItem icon={PackageCheck} label="Related Event" value={vendor.relatedEvent?.eventName} />
                  <DetailItem icon={CalendarDays} label="Event Date" value={formatDate(vendor.relatedEvent?.eventDate)} />
                  <DetailItem icon={MapPin} label="Venue" value={vendor.relatedEvent?.venue} />
                  <DetailItem icon={CheckCircle2} label="Current Status" value={<StatusBadge>{vendor.status}</StatusBadge>} />
                </div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <SectionCard title="Work Scope (What Vendor Has to Deliver)" icon={PackageCheck}>
                <div className="space-y-3">
                  {(vendor.workScope || []).map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                  <div className="mt-5 rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-400/10 dark:text-blue-200">
                    Note: All setup to be as per approved design & moodboard.
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Event Assignment Details" icon={UserRound}>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-5">
                    <DetailItem label="Function" value={vendor.assignmentDetails?.functionName} />
                    <DetailItem label="Reporting Time" value={`${formatDate(vendor.assignmentDetails?.reportingTime)} ${formatTime(vendor.assignmentDetails?.reportingTime)}`} />
                    <DetailItem label="Setup Start Time" value={`${formatDate(vendor.assignmentDetails?.setupStartTime)} ${formatTime(vendor.assignmentDetails?.setupStartTime)}`} />
                    <DetailItem label="Completion Deadline" value={`${formatDate(vendor.assignmentDetails?.completionDeadline)} ${formatTime(vendor.assignmentDetails?.completionDeadline)}`} />
                  </div>
                  <div className="space-y-5 border-l border-border pl-6">
                    <DetailItem icon={UserRound} label="Assigned Coordinator" value="Ayush Gupta" />
                    <DetailItem icon={UserRound} label="Reporting Manager" value="Pappu Verma" />
                    <DetailItem icon={MapPin} label="Venue" value={vendor.relatedEvent?.venue} />
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <SectionCard title="Documents & Files" icon={FileText} action={<button className="text-sm font-semibold text-primary">View All</button>}>
                <div className="space-y-3">
                  {(vendor.documents || []).length ? vendor.documents.map((doc, index) => (
                    <div key={doc._id || index} className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-red-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{doc.fileName || doc.title || `Document ${index + 1}`}</p>
                        <p className="text-xs text-muted-foreground">{doc.fileType || "PDF"} • Uploaded on {formatDate(doc.uploadedAt)}</p>
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No documents available.</p>}
                </div>
              </SectionCard>

              <SectionCard title="Proof / Photos Uploaded" icon={Image} action={<button className="text-sm font-semibold text-primary">View All</button>}>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(vendor.proofs || []).slice(0, 3).map((item, index) => (
                    <div key={item._id || index}>
                      <div className="h-28 rounded-lg bg-muted">
                        {item.fileUrl ? <img src={item.fileUrl} alt={item.title} className="h-full w-full rounded-lg object-cover" /> : null}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground">{item.title || item.fileName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.uploadedAt)}</p>
                    </div>
                  ))}
                  <label className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 text-center text-sm text-primary">
                    <Upload className="mb-2 h-6 w-6" />
                    Upload More Photos
                    <Input type="file" multiple className="hidden" onChange={(event) => setProof((current) => ({ ...current, files: Array.from(event.target.files || []) }))} />
                  </label>
                </div>
              </SectionCard>
            </div>

            <SectionCard title="Activity / Update Timeline" icon={CheckCircle2}>
              <div className="grid gap-4 md:grid-cols-6">
                {statusSteps.map((step, index) => (
                  <div key={step} className="text-center">
                    <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 ${index <= statusSteps.indexOf(vendor.status) ? "border-emerald-300 bg-emerald-50 text-emerald-600" : "border-border bg-background text-muted-foreground"}`}>
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground">{step}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(vendor.assignmentDetails?.reportingTime)}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <aside className="space-y-5">
            <SectionCard title="Quick Actions">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="gap-2"><Phone className="h-4 w-4 text-emerald-600" />Call Vendor</Button>
                <Button variant="outline" className="gap-2"><MessageCircle className="h-4 w-4 text-emerald-600" />WhatsApp</Button>
                <Button variant="outline" className="gap-2"><CheckCircle2 className="h-4 w-4 text-blue-600" />Update Status</Button>
                <Button variant="outline" className="gap-2" onClick={() => proofMutation.mutate()} disabled={!proof.files.length || proofMutation.isPending}><Upload className="h-4 w-4 text-violet-600" />Upload Proof</Button>
                <Button variant="outline" className="gap-2"><AlertTriangle className="h-4 w-4 text-orange-600" />Raise Issue</Button>
                <Button variant="outline" className="gap-2">View Event<ArrowRight className="h-4 w-4" /></Button>
              </div>
            </SectionCard>

            <SectionCard title="Status Update" icon={CheckCircle2}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {statusSteps.map((step) => (
                    <span key={step} className={`h-3 w-3 rounded-full ${statusSteps.indexOf(step) <= statusSteps.indexOf(vendor.status) ? "bg-blue-600" : "bg-muted-foreground/30"}`} />
                  ))}
                </div>
                <Select value={statusForm.status} onValueChange={(value) => setStatusForm((current) => ({ ...current, status: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Assigned", "Contacted", "Confirmed", "Material Dispatched", "Reached Venue", "Setup In Progress", "Completed", "Issue Reported", "Cancelled", "Upcoming", "In Progress"].map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusForm.confirmationStatus} onValueChange={(value) => setStatusForm((current) => ({ ...current, confirmationStatus: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Pending", "Confirmed", "Not Confirmed"].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Textarea value={statusForm.note} onChange={(event) => setStatusForm((current) => ({ ...current, note: event.target.value }))} placeholder="Status note..." className="min-h-20 resize-none" />
                <Button className="w-full bg-blue-600 text-white hover:bg-blue-700" onClick={() => statusMutation.mutate()} disabled={statusMutation.isPending}>
                  {statusMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Update Status
                </Button>
              </div>
            </SectionCard>

            <SectionCard title="Issue Reporting" icon={AlertTriangle} action={<button className="text-sm font-semibold text-primary">View All</button>}>
              <div className="space-y-4">
                {(vendor.issues || []).slice(0, 1).map((item, index) => (
                  <div key={item._id || index} className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{item.issueType}</p>
                      <StatusBadge>{item.urgency}</StatusBadge>
                    </div>
                    <p className="mt-3">{item.notes}</p>
                    <p className="mt-3 font-semibold">Status: {item.status}</p>
                  </div>
                ))}
                <Select value={issue.issueType} onValueChange={(value) => setIssue((current) => ({ ...current, issueType: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Material Shortage", "Vendor Delay", "Quality Issue", "Staff Issue"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={issue.urgency} onValueChange={(value) => setIssue((current) => ({ ...current, urgency: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["High", "Medium", "Low"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Textarea value={issue.notes} onChange={(event) => setIssue((current) => ({ ...current, notes: event.target.value }))} placeholder="Describe the issue..." className="min-h-24 resize-none" />
                <Input type="file" onChange={(event) => setIssue((current) => ({ ...current, proof: event.target.files?.[0] || null }))} />
                <Button className="w-full bg-red-600 text-white hover:bg-red-700" disabled={!issue.notes || issueMutation.isPending} onClick={() => issueMutation.mutate()}>
                  {issueMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                  Raise Issue
                </Button>
              </div>
            </SectionCard>

            <SectionCard title="Notes from Manager" icon={MessageCircle} action={<button className="text-sm font-semibold text-primary">View All</button>}>
              <div className="space-y-4">
                {(vendor.managerNotes || []).map((item, index) => (
                  <div key={item._id || index} className="rounded-lg border border-border bg-background p-3 text-sm">
                    <p className="font-semibold text-foreground">{item.by || "Manager"}</p>
                    <p className="mt-2 text-muted-foreground">{item.note || item.message}</p>
                  </div>
                ))}
                <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add coordination note..." className="min-h-20 resize-none" />
                <Button variant="outline" className="w-full gap-2" disabled={!note || noteMutation.isPending} onClick={() => noteMutation.mutate()}>
                  {noteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Add Note
                </Button>
              </div>
            </SectionCard>
          </aside>
        </div>
      </div>
    </div>
  );
}
