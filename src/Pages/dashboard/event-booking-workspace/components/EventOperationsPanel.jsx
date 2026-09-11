/* eslint-disable react/prop-types */
import { useNavigate } from "react-router-dom";
import { UserRound, UsersRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@components/components/ui/avatar";
import { Badge } from "@components/components/ui/badge";
import { Button } from "@components/components/ui/button";
import { Card, CardContent } from "@components/components/ui/card";
import { avatarUrl, initials } from "../eventBookingDashboard.utils";
import EventOperationsNav from "./EventOperationsNav";
import EventTasksPanel from "./EventTasksPanel";

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

export default function EventOperationsPanel({ booking, team = [], onManageTeam, onCreateTask }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <EventOperationsNav active="tasks" />
      <EventTasksPanel
        booking={booking}
        onCreateTask={onCreateTask}
        onViewTask={(task) => navigate(`/dashboard/my-tasks?taskId=${encodeURIComponent(idOf(task))}`)}
        sideContent={<EventCoreTeamCard team={team} onManageTeam={onManageTeam} />}
      />
    </div>
  );
}
