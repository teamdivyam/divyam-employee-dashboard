/* eslint-disable react/prop-types */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  Loader2,
  MapPin,
} from "lucide-react";

import { Badge } from "@components/components/ui/badge";
import { Button } from "@components/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/components/ui/table";
import EmployeeService from "@/services/employee.service";
import {
  formatDate,
  formatDay,
  RoleBadge,
  StatusBadge,
} from "../../assigned-events/components/AssignedEventUI";
import { SectionCard } from "./ClientDetailComponents";

export default function AssignedClientEventsPanel({ clientId }) {
  const navigate = useNavigate();
  const eventsQuery = useQuery({
    queryKey: ["assigned-client-events", clientId],
    queryFn: async () => {
      const response = await EmployeeService.getAssignedEvents({
        clientId,
        page: 1,
        limit: 100,
      });
      return response.data;
    },
    enabled: Boolean(clientId),
  });

  const events = eventsQuery.data?.events || [];

  return (
    <SectionCard
      icon={CalendarDays}
      title="Events & Bookings"
      action={
        <Badge variant="outline" className="border-primary/30 text-primary">
          {events.length} {events.length === 1 ? "event" : "events"}
        </Badge>
      }
    >
      {eventsQuery.isLoading ? (
        <div className="flex min-h-28 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Loading assigned events
        </div>
      ) : eventsQuery.isError ? (
        <div className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-muted-foreground">
            {eventsQuery.error?.response?.data?.message ||
              "Unable to load events for this client."}
          </p>
          <Button size="sm" variant="outline" onClick={() => eventsQuery.refetch()}>
            Try Again
          </Button>
        </div>
      ) : events.length ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead>Event / Booking</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>My Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event._id}>
                  <TableCell>
                    <p className="font-semibold text-foreground">
                      {event.eventName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {event.eventCode || event.eventType || "Event"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">
                      {formatDate(event.eventDate)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDay(event.eventDate)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="flex items-center gap-1.5 font-medium text-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {event.venue || "Venue pending"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {event.city || "City pending"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <RoleBadge>{event.myRole || "Team Member"}</RoleBadge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge>{event.bookingStatus}</StatusBadge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-primary text-foreground hover:bg-primary/5"
                      onClick={() =>
                        navigate(
                          `/dashboard/assigned-clients/${clientId}/events/${event._id}`,
                        )
                      }
                    >
                      Open Event
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
          <CalendarDays className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium text-foreground">
            No assigned event yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Events appear here after this client is booked and you are assigned
            to the event team.
          </p>
        </div>
      )}
    </SectionCard>
  );
}
