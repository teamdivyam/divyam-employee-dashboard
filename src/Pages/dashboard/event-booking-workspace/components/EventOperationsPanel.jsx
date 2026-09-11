/* eslint-disable react/prop-types */
import { useNavigate } from "react-router-dom";
import { UserRound, UsersRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@components/components/ui/avatar";
import { Badge } from "@components/components/ui/badge";
import { Button } from "@components/components/ui/button";
import { Card, CardContent } from "@components/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./EventTable";
import { avatarUrl, initials } from "../eventBookingDashboard.utils";
import EventOperationsNav from "./EventOperationsNav";

const idOf = (value) => String(value?._id || value || "");

function EventCoreTeamCard({ team, onManageTeam }) {
  return (
    <Card className="crm-card h-fit overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <div>
            <h2 className="text-sm font-semibold">Event Core Team</h2>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {team.length} assigned member{team.length === 1 ? "" : "s"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onManageTeam} className="h-8 gap-1 px-2 text-[10px]">
            <UserRound className="h-3.5 w-3.5" />
            Manage Team
          </Button>
        </div>

        <div className="divide-y divide-border px-3">
          {team.length ? team.map((member) => {
            const employee = member.employee || member;
            const name = employee.name || "Team Member";
            return (
              <div key={idOf(member) || idOf(employee)} className="flex items-center gap-2 py-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl(employee)} />
                  <AvatarFallback className="bg-violet-50 text-[9px] font-bold text-violet-700">
                    {initials(name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{name}</p>
                  <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                    {employee.designation || member.responsibility || "Event Team"}
                  </p>
                </div>
                <Badge variant="outline" className="max-w-24 truncate border-violet-100 bg-violet-50 text-[8px] text-violet-700">
                  {member.role || "Team Member"}
                </Badge>
              </div>
            );
          }) : (
            <div className="py-12 text-center">
              <UsersRound className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-2 text-xs font-semibold">No team assigned</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function EventOperationsPanel({ booking, team = [], onManageTeam }) {
  const navigate = useNavigate();
  const tasks = booking.eventTasks || [];

  return (
    <div className="space-y-3">
      <EventOperationsNav active="tasks" />

      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="crm-card min-w-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">Event Tasks</h2>
                <p className="mt-1 text-[10px] text-muted-foreground">Tasks linked to this event.</p>
              </div>
              <Button size="sm" className="h-8 text-xs" onClick={() => navigate("/dashboard/my-tasks")}>Open My Tasks</Button>
            </div>
            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.length ? tasks.map((task) => (
                    <TableRow key={idOf(task)}>
                      <TableCell className="font-medium">{task.taskTitle || task.title}</TableCell>
                      <TableCell>{task.assignedTo?.name || "Unassigned"}</TableCell>
                      <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN") : "-"}</TableCell>
                      <TableCell><Badge variant="outline">{task.priority || "Medium"}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{task.status || "Pending"}</Badge></TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No event tasks available.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <EventCoreTeamCard team={team} onManageTeam={onManageTeam} />
      </div>
    </div>
  );
}
