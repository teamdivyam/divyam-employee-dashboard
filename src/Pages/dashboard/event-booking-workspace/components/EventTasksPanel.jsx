/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { CheckSquare2, ClipboardList, Eye, Plus, Search } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@components/components/ui/avatar";
import { Badge } from "@components/components/ui/badge";
import { Button } from "@components/components/ui/button";
import { Card, CardContent } from "@components/components/ui/card";
import { Input } from "@components/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import TabComp from "@components/components/tab-comp";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./EventTable";
import { avatarUrl, initials } from "../eventBookingDashboard.utils";

const PAGE_SIZE = 8;
const REVIEW_STATUSES = ["Submitted", "Pending Approval", "Awaiting Review"];
const TERMINAL_STATUSES = ["Completed", "Cancelled", "Rejected"];
const idOf = (value) => String(value?._id || value || "");

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const isOverdue = (task) => {
  if (!task?.dueDate || TERMINAL_STATUSES.includes(task.status)) return false;
  return task.status === "Overdue" || new Date(task.dueDate).getTime() < Date.now();
};

const statusTone = (status = "") => {
  if (status === "Completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (REVIEW_STATUSES.includes(status)) return "border-violet-200 bg-violet-50 text-violet-700";
  if (["Overdue", "Rejected"].includes(status)) return "border-red-200 bg-red-50 text-red-700";
  if (status === "In Progress") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-orange-200 bg-orange-50 text-orange-700";
};

const priorityTone = (priority = "") => ({
  High: "border-red-200 bg-red-50 text-red-700",
  Medium: "border-orange-200 bg-orange-50 text-orange-700",
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
}[priority] || "border-border bg-muted/40 text-muted-foreground");

export default function EventTasksPanel({ booking, sideContent, onCreateTask, onViewTask }) {
  const [tab, setTab] = useState("open");
  const [search, setSearch] = useState("");
  const [taskType, setTaskType] = useState("all");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [page, setPage] = useState(1);

  const tasks = useMemo(() => {
    const unique = new Map();
    [...(booking.workflowTasks || []), ...(booking.eventTasks || [])].forEach((task) => {
      if (task && !task.isDeleted) unique.set(idOf(task), task);
    });
    return [...unique.values()];
  }, [booking.eventTasks, booking.workflowTasks]);

  const tabs = [
    { value: "open", label: "Open" },
    { value: "overdue", label: "Overdue" },
    { value: "completed", label: "Completed" },
    { value: "awaiting_review", label: "Awaiting Review" },
  ];
  const taskTypes = useMemo(() => [...new Set(tasks.map((task) => task.taskType).filter(Boolean))], [tasks]);
  const statuses = useMemo(() => [...new Set(tasks.map((task) => task.status).filter(Boolean))], [tasks]);
  const priorities = useMemo(() => [...new Set(tasks.map((task) => task.priority).filter(Boolean))], [tasks]);

  const filtered = useMemo(() => tasks.filter((task) => {
    const term = search.trim().toLowerCase();
    const searchable = [task.taskTitle, task.taskType, task.relatedTo?.name, task.assignedTo?.name, task.assignedToName]
      .filter(Boolean).join(" ").toLowerCase();
    const matchesTab = (tab === "open" && !TERMINAL_STATUSES.includes(task.status) && !REVIEW_STATUSES.includes(task.status) && !isOverdue(task))
      || (tab === "overdue" && isOverdue(task))
      || (tab === "completed" && task.status === "Completed")
      || (tab === "awaiting_review" && REVIEW_STATUSES.includes(task.status));
    return matchesTab
      && (!term || searchable.includes(term))
      && (taskType === "all" || task.taskType === taskType)
      && (status === "all" || task.status === status)
      && (priority === "all" || task.priority === priority);
  }), [priority, search, status, tab, taskType, tasks]);

  useEffect(() => setPage(1), [priority, search, status, tab, taskType]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => { if (page > pages) setPage(pages); }, [page, pages]);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card className="admin-task-table-card min-w-0">
      <CardContent className="p-3">
          <div className="mb-2 flex flex-col gap-2 2xl:flex-row 2xl:items-center">
            <div className="min-w-0 max-w-full shrink-0 overflow-x-auto">
              <TabComp
                tabs={tabs}
                value={tab}
                onValueChange={setTab}
                className="admin-task-tabs"
                listClassName="admin-task-tab-list !border-0 !shadow-none"
                display="inline-block"
                ariaLabel="Event task sections"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 2xl:flex-nowrap 2xl:justify-end">
              <div className="relative min-w-[160px] flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search task or team member" className="h-8 rounded-md pl-9 text-xs" />
              </div>
              <Select value={taskType} onValueChange={setTaskType}><SelectTrigger className="h-8 w-28 shrink-0 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Task Types</SelectItem>{taskTypes.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
              <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-8 w-24 shrink-0 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{statuses.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
              <Select value={priority} onValueChange={setPriority}><SelectTrigger className="h-8 w-24 shrink-0 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Priority</SelectItem>{priorities.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
              <Button variant="custom" size="sm" onClick={onCreateTask} className="h-8 shrink-0 gap-1.5 whitespace-nowrap px-3 text-xs"><Plus className="h-4 w-4" />Create Task</Button>
            </div>
          </div>

          <div className="grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0">
          <div className="admin-task-data-table overflow-x-auto [&_table]:min-w-[880px] [&_td]:!px-1.5 [&_td]:text-center [&_th]:!px-1 [&_th]:text-center">
            <Table className="table-fixed text-xs">
              <TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30"><TableHead className="w-[17%]">Task Title</TableHead><TableHead className="w-[10%]">Task Type</TableHead><TableHead className="w-[12%]">Linked To</TableHead><TableHead className="w-[14%]">Assigned To</TableHead><TableHead className="w-[12%]">Due Date</TableHead><TableHead className="w-[9%]">Priority</TableHead><TableHead className="w-[11%]">Status</TableHead><TableHead className="w-[9%]">Progress</TableHead><TableHead className="w-[11%] text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {pageRows.length ? pageRows.map((task) => {
                  const assignee = task.assignedTo?.name || task.assignedToName || "Self";
                  const progress = task.status === "Completed" ? 100 : Number(task.progressPercent || 0);
                  return (
                    <TableRow key={idOf(task)}>
                      <TableCell><div className="flex items-center gap-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"><ClipboardList className="h-4 w-4" /></span><p className="line-clamp-2 font-semibold">{task.taskTitle || "Task"}</p></div></TableCell>
                      <TableCell className="text-muted-foreground">{task.taskType || "Task"}</TableCell>
                      <TableCell><p className="font-medium">{task.relatedTo?.name || booking.eventName || "Event"}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{task.relatedTo?.type || "Event"}</p></TableCell>
                      <TableCell><div className="flex items-center gap-2"><Avatar className="h-7 w-7"><AvatarImage src={avatarUrl(task.assignedTo)} /><AvatarFallback className="bg-blue-900 text-[9px] font-semibold text-white">{initials(assignee)}</AvatarFallback></Avatar><span className="line-clamp-2 font-medium">{assignee}</span></div></TableCell>
                      <TableCell><p>{formatDate(task.dueDate)}</p>{task.status === "Completed" && task.completedOn ? <p className="mt-0.5 text-[10px] text-emerald-600">Completed on {formatDate(task.completedOn)}</p> : null}</TableCell>
                      <TableCell><Badge variant="outline" className={`rounded-full px-2 py-0.5 text-[10px] ${priorityTone(task.priority)}`}>{task.priority || "Medium"}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] ${statusTone(task.status)}`}>{task.status || "Pending"}</Badge></TableCell>
                      <TableCell><div className="flex items-center gap-2"><div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} /></div><span>{progress}%</span></div></TableCell>
                      <TableCell className="text-right"><div className="flex items-center justify-end"><Button variant="outline" size="sm" onClick={() => onViewTask(task)} className="h-8 gap-1.5 border-blue-300 bg-transparent px-3 text-blue-700 hover:bg-blue-50 hover:text-blue-800"><Eye className="h-4 w-4" />View</Button></div></TableCell>
                    </TableRow>
                  );
                }) : <TableRow><TableCell colSpan={9} className="h-36 text-center"><CheckSquare2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground" /><p className="font-semibold">No tasks found</p><p className="mt-1 text-[11px] text-muted-foreground">Create a task or adjust the current filters.</p></TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-2 border-t border-border p-2 text-xs sm:flex-row sm:items-center sm:justify-between"><span className="text-muted-foreground">Showing {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} tasks</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button variant="outline" size="sm" className="border-primary text-primary">{page}</Button><Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div>
            </div>
            <aside className="min-w-0">{sideContent}</aside>
          </div>
      </CardContent>
    </Card>
  );
}
