import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import { Textarea } from "@components/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  FolderOpen,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Upload,
  UserRound,
  UsersRound,
} from "lucide-react";
import EmployeeService from "@/services/employee.service";
import {
  DetailStat,
  formatDate,
  formatDateTime,
  formatDay,
  getEventImage,
  MoreButton,
  RoleBadge,
  SectionCard,
  StatusBadge,
  TableActionButton,
} from "./components/AssignedEventUI";

export default function DetailAssignedEventPage() {
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [issue, setIssue] = useState({ issueType: "Vendor Issue", description: "" });
  const [proofTaskId, setProofTaskId] = useState("");
  const [proofFiles, setProofFiles] = useState([]);

  const eventQuery = useQuery({
    queryKey: ["assigned-event-detail", eventId],
    queryFn: async () => {
      const response = await EmployeeService.getAssignedEventDetail({ eventId });
      return response.data.event;
    },
    enabled: Boolean(eventId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["assigned-event-detail", eventId] });

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }) =>
      EmployeeService.updateAssignedEventTaskStatus({
        eventId,
        taskId,
        status,
        note: `Updated to ${status}`,
      }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Task updated");
      invalidate();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update task"),
  });

  const proofMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      proofFiles.forEach((file) => formData.append("proof", file));
      formData.append("note", "Uploaded from employee event dashboard");
      return EmployeeService.uploadAssignedEventTaskProof({ eventId, taskId: proofTaskId, formData });
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Proof uploaded");
      setProofFiles([]);
      setProofTaskId("");
      invalidate();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to upload proof"),
  });

  const issueMutation = useMutation({
    mutationFn: () => EmployeeService.raiseAssignedEventIssue({ eventId, ...issue }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Issue raised");
      setIssue({ issueType: "Vendor Issue", description: "" });
      invalidate();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to raise issue"),
  });

  const dutyMutation = useMutation({
    mutationFn: (action) => EmployeeService.updateAssignedEventDutyAttendance({ eventId, action, notes: "Updated from dashboard" }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Duty attendance updated");
      invalidate();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update duty attendance"),
  });

  const event = eventQuery.data;
  const assignment = event?.myAssignment || {};

  if (eventQuery.isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-4 text-sm font-semibold text-foreground shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-theme-color" />
          Loading assigned event
        </div>
      </div>
    );
  }

  if (eventQuery.isError) {
    return (
      <div className="p-5">
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300">
          <div className="flex items-center gap-3 font-semibold">
            <AlertCircle className="h-5 w-5" />
            Unable to load assigned event
          </div>
          <p className="mt-2 text-sm">{eventQuery.error?.response?.data?.message || "Please try again in a moment."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-4 text-foreground md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{event.eventName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Link to="/dashboard" className="hover:text-primary">Home</Link>
              <span>/</span>
              <Link to="/dashboard/assigned-events" className="hover:text-primary">Assigned Events</Link>
              <span>/</span>
              <span>{event.eventName}</span>
            </div>
          </div>
          <div className="relative w-full lg:w-[420px]">
            <Input placeholder="Search events, clients, venues..." className="h-11 rounded-lg pl-4" />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
              <DetailStat icon={CalendarDays} label="Event Date" value={formatDate(event.eventDate)} subValue={formatDay(event.eventDate)} />
              <DetailStat icon={MapPin} label="Venue" value={event.venue} subValue={event.city} tone="green" />
              <DetailStat icon={Building2} label="City" value={event.city} subValue="Uttar Pradesh" tone="slate" />
              <DetailStat icon={UsersRound} label="Guest Count" value={`${event.guestCount || 0} pax`} subValue="Approx." tone="violet" />
              <DetailStat icon={CalendarDays} label="Functions" value={event.noOfFunctions} subValue="Functions" />
              <DetailStat icon={UserRound} label="My Role" value={assignment.role} subValue={assignment.responsibility} tone="red" />
              <DetailStat icon={UserRound} label="Reporting Manager" value={event.reportingManager?.name || assignment.reportingManager?.name} subValue="Manager" tone="slate" />
            </div>

            <SectionCard title="My Role & Responsibilities" icon={UserRound}>
              <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                <div className="space-y-3">
                  <Info label="My Role" value={<RoleBadge>{assignment.role}</RoleBadge>} />
                  <Info label="Reporting Manager" value={event.reportingManager?.name || "Not available"} />
                  <Info label="Team Size" value={`${assignment.teamSize || 0} Members`} />
                  <Info label="Reporting Time" value={formatDateTime(assignment.reportingTime)} />
                </div>
                <div className="border-l border-border pl-6">
                  <p className="mb-3 text-sm font-semibold text-foreground">Key Responsibilities</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {(assignment.responsibilities || []).map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Functions & Timeline" icon={CalendarDays}>
              <DataTable
                headers={["#", "Function", "Date & Day", "Time", "Venue Area", "Guest Count", "My Responsibility", "Status"]}
                rows={(event.functions || []).map((fn, index) => [
                  index + 1,
                  fn.name,
                  <><p>{formatDate(fn.date)}</p><p className="text-xs text-muted-foreground">{formatDay(fn.date)}</p></>,
                  `${fn.startTime || ""} - ${fn.endTime || ""}`,
                  fn.area,
                  `${fn.guestCount || 0} pax`,
                  fn.myResponsibility,
                  <StatusBadge>{fn.status}</StatusBadge>,
                ])}
              />
            </SectionCard>

            <SectionCard title="My Tasks for This Event" icon={Check}>
              <DataTable
                headers={["#", "Task", "Due Date", "Priority", "Status", "Proof Required", "Action", ""]}
                rows={(event.tasks || []).map((task, index) => [
                  index + 1,
                  task.taskTitle,
                  formatDateTime(task.dueDate),
                  <StatusBadge>{task.priority}</StatusBadge>,
                  <StatusBadge>{task.status}</StatusBadge>,
                  task.proofRequired ? "Yes" : "No",
                  <TableActionButton onClick={() => statusMutation.mutate({ taskId: task._id, status: task.status === "Not Started" ? "In Progress" : "Submitted" })}>
                    {task.status === "Not Started" ? "Start Task" : "Continue"}
                  </TableActionButton>,
                  <MoreButton />,
                ])}
              />
            </SectionCard>

            <SectionCard title="Event Brief & Documents" icon={FileText}>
              {event.documents?.length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {event.documents.map((doc, index) => (
                    <div key={doc._id || index} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                      <FileText className="h-6 w-6 text-red-500" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{doc.name || doc.label || `Document ${index + 1}`}</p>
                        <p className="text-xs text-muted-foreground">{doc.fileType || "Document"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground">
                  No event documents available.
                </div>
              )}
            </SectionCard>

            <SectionCard title="Inventory / Essentials" icon={FolderOpen}>
              <DataTable
                headers={["Item", "Description", "Required", "Issued", "Pending", "Status"]}
                rows={[
                  ["Welcome Kits", "Including welcome card, tissue, mint", 300, 180, 120, <StatusBadge>Pending</StatusBadge>],
                  ["Water Station Items", "Water bottles, dispensers, glasses", 500, 350, 150, <StatusBadge>Pending</StatusBadge>],
                  ["Guest Badges", "VIP & Guest badges with lanyards", 400, 400, 0, <StatusBadge>Issued</StatusBadge>],
                ]}
              />
            </SectionCard>
          </div>

          <aside className="space-y-5">
            <img src={getEventImage(event)} alt={event.eventName} className="h-56 w-full rounded-lg object-cover shadow-sm" />

            <SectionCard title="Team & Contacts" icon={UsersRound}>
              <div className="space-y-4">
                {(event.teamContacts || []).map((person, index) => (
                  <div key={person._id || index} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">{person.name?.charAt(0) || "T"}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{person.name}</p>
                      <p className="text-xs text-muted-foreground">{person.role || person.designation}</p>
                    </div>
                    <Phone className="h-4 w-4 text-primary" />
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                ))}
                {!event.teamContacts?.length ? <p className="text-sm text-muted-foreground">No team contacts available.</p> : null}
              </div>
            </SectionCard>

            <SectionCard title="Duty Attendance" icon={Clock3}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Reporting Time" value={formatDateTime(assignment.reportingTime)} />
                <Info label="Duty Status" value={<StatusBadge>{assignment.dutyAttendance?.status}</StatusBadge>} />
                <Info label="Check In" value={formatDateTime(assignment.dutyAttendance?.checkInAt)} />
                <Info label="Check Out" value={formatDateTime(assignment.dutyAttendance?.checkOutAt)} />
              </div>
            </SectionCard>

            <SectionCard title="Raise Event Issue" icon={AlertCircle}>
              <div className="space-y-3">
                <Select value={issue.issueType} onValueChange={(value) => setIssue((current) => ({ ...current, issueType: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Vendor Issue", "Inventory Missing", "Staff Shortage", "Delay", "Client Issue", "Damage / Loss"].map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={issue.description}
                  onChange={(eventInput) => setIssue((current) => ({ ...current, description: eventInput.target.value }))}
                  placeholder="Describe the issue in detail..."
                  className="min-h-24 resize-none"
                />
                <Button className="w-full bg-theme-color" disabled={!issue.description || issueMutation.isPending} onClick={() => issueMutation.mutate()}>
                  {issueMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit Issue
                </Button>
              </div>
            </SectionCard>

            <SectionCard title="Recent Updates" icon={Clock3}>
              <div className="space-y-3">
                {(event.recentUpdates || []).map((update, index) => (
                  <div key={update._id || index} className="flex justify-between gap-3 text-sm">
                    <span className="text-foreground">{update.message || update.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(update.createdAt)}</span>
                  </div>
                ))}
                {!event.recentUpdates?.length ? <p className="text-sm text-muted-foreground">No recent updates.</p> : null}
              </div>
            </SectionCard>

            <SectionCard title="Quick Actions" icon={Check}>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline">View My Tasks</Button>
                <Button variant="outline" onClick={() => document.getElementById("proof-upload")?.click()}><Upload className="mr-2 h-4 w-4" />Upload Proof</Button>
                <Button variant="outline">View Event Brief</Button>
                <Button variant="outline">Contact Manager</Button>
                <Button variant="outline" onClick={() => dutyMutation.mutate("check_in")}>Check In</Button>
                <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => dutyMutation.mutate("complete")}>Mark Complete</Button>
              </div>
              <div className="mt-4 space-y-3">
                <Select value={proofTaskId} onValueChange={setProofTaskId}>
                  <SelectTrigger><SelectValue placeholder="Select task for proof" /></SelectTrigger>
                  <SelectContent>
                    {(event.tasks || []).map((task) => <SelectItem key={task._id} value={task._id}>{task.taskTitle}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input id="proof-upload" type="file" multiple onChange={(inputEvent) => setProofFiles(Array.from(inputEvent.target.files || []))} />
                <Button className="w-full bg-theme-color" disabled={!proofTaskId || !proofFiles.length || proofMutation.isPending} onClick={() => proofMutation.mutate()}>
                  {proofMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Upload Selected Proof
                </Button>
              </div>
            </SectionCard>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium text-foreground">{value || "Not available"}</div>
    </div>
  );
}

function DataTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-border text-xs font-semibold text-muted-foreground">
          <tr>
            {headers.map((header) => <th key={header} className="px-3 py-3">{header}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length ? rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-muted/30">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-3 align-middle text-foreground">{cell}</td>)}
            </tr>
          )) : (
            <tr>
              <td colSpan={headers.length} className="px-3 py-8 text-center text-muted-foreground">No data available.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
