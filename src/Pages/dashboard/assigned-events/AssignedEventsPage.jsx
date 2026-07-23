import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import PageLocked from "@components/components/PageLocked";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import { CalendarDays, Filter, Loader2, Search } from "lucide-react";
import EmployeeService from "@/services/employee.service";
import {
  formatDate,
  formatDay,
  getEventImage,
  MetricCard,
  metricConfig,
  MoreButton,
  ReadinessBar,
  RoleBadge,
  StatusBadge,
  TableActionButton,
} from "./components/AssignedEventUI";

const viewTabs = [
  ["all", "All Events"],
  ["upcoming", "Upcoming"],
  ["today", "Today"],
  ["week", "This Week"],
  ["completed", "Completed"],
];

export default function AssignedEventsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: "",
    view: "all",
    status: "all",
    city: "all",
    role: "all",
    page: 1,
  });

  const analyticsQuery = useQuery({
    queryKey: ["assigned-event-analytics"],
    queryFn: async () => {
      const response = await EmployeeService.getAssignedEventAnalytics();
      return response.data.analytics;
    },
  });

  const eventsQuery = useQuery({
    queryKey: ["assigned-events", filters],
    queryFn: async () => {
      const response = await EmployeeService.getAssignedEvents({
        page: filters.page,
        limit: 10,
        search: filters.search || undefined,
        view: filters.view === "all" ? undefined : filters.view,
        status: filters.status === "all" ? undefined : filters.status,
        city: filters.city === "all" ? undefined : filters.city,
        role: filters.role === "all" ? undefined : filters.role,
      });
      return response.data;
    },
    placeholderData: (previous) => previous,
  });

  const events = eventsQuery.data?.events || [];
  const pagination = eventsQuery.data?.pagination;
  const optionValues = useMemo(() => {
    const city = [...new Set(events.map((event) => event.city).filter(Boolean))];
    const role = [...new Set(events.map((event) => event.myRole).filter(Boolean))];
    const status = [...new Set(events.map((event) => event.bookingStatus).filter(Boolean))];
    return { city, role, status };
  }, [events]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: key === "page" ? value : 1 }));
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="min-h-[calc(100vh-4rem)] bg-background p-4 text-foreground md:p-6">
        <div className="mx-auto max-w-[1500px] space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Assigned Events</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/dashboard" className="hover:text-primary">Home</Link>
              <span>/</span>
              <span>Assigned Events</span>
            </div>
          </div>

          <div className="relative w-full lg:w-[420px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Search events, clients, venues..."
              className="h-11 rounded-lg pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metricConfig.map(([key, label, subLabel, Icon, tone]) => (
            <MetricCard
              key={key}
              label={label}
              value={analyticsQuery.data?.[key] ?? 0}
              subLabel={subLabel}
              icon={Icon}
              tone={tone}
            />
          ))}
        </div>

        <section className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border p-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {viewTabs.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateFilter("view", value)}
                  className={`h-10 rounded-md border px-4 text-sm font-medium transition ${
                    filters.view === value
                      ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FilterSelect label="Status" value={filters.status} values={optionValues.status} onChange={(value) => updateFilter("status", value)} />
              <FilterSelect label="City" value={filters.city} values={optionValues.city} onChange={(value) => updateFilter("city", value)} />
              <FilterSelect label="Role" value={filters.role} values={optionValues.role} onChange={(value) => updateFilter("role", value)} />
              <Button variant="outline" className="h-10 gap-2 rounded-md" onClick={() => setFilters({ search: "", view: "all", status: "all", city: "all", role: "all", page: 1 })}>
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-5 py-4">#</th>
                  <th className="px-5 py-4">Event Name</th>
                  <th className="px-5 py-4">Client Name</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">City / Venue</th>
                  <th className="px-5 py-4">My Role</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Readiness</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {eventsQuery.isFetching && !events.length ? (
                  <tr>
                    <td colSpan="9" className="px-5 py-12 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-theme-color" />
                      Loading assigned events
                    </td>
                  </tr>
                ) : events.length ? (
                  events.map((event, index) => (
                    <tr key={event._id} className="hover:bg-muted/30">
                      <td className="px-5 py-4 font-medium text-foreground">{(filters.page - 1) * 10 + index + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img src={getEventImage(event)} alt={event.eventName} className="h-14 w-20 rounded-md object-cover" />
                          <div>
                            <p className="font-semibold text-foreground">{event.eventName}</p>
                            <p className="text-xs text-muted-foreground">{event.eventType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{event.client?.name}</p>
                        <p className="text-xs text-muted-foreground">{event.client?.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{formatDate(event.eventDate)}</p>
                        <p className="text-xs text-muted-foreground">{formatDay(event.eventDate)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{event.city}</p>
                        <p className="text-xs text-muted-foreground">{event.venue}</p>
                      </td>
                      <td className="px-5 py-4"><RoleBadge>{event.myRole}</RoleBadge></td>
                      <td className="px-5 py-4"><StatusBadge>{event.bookingStatus}</StatusBadge></td>
                      <td className="px-5 py-4"><ReadinessBar value={event.readiness?.percentage} /></td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <TableActionButton onClick={() => navigate(`/dashboard/assigned-events/${event._id}`)}>View Event</TableActionButton>
                          <MoreButton />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-5 py-12 text-center text-muted-foreground">
                      <CalendarDays className="mx-auto mb-3 h-8 w-8" />
                      No assigned events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {events.length ? 1 : 0} to {events.length} of {pagination?.totalEvents || events.length} events
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={(pagination?.page || 1) <= 1} onClick={() => updateFilter("page", filters.page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" className="border-primary text-primary">{pagination?.page || 1}</Button>
              <Button variant="outline" size="sm" disabled={(pagination?.page || 1) >= (pagination?.totalPages || 1)} onClick={() => updateFilter("page", filters.page + 1)}>Next</Button>
            </div>
          </div>
        </section>
        </div>
      </div>
      <PageLocked className="z-[100]" />
    </div>
  );
}

function FilterSelect({ label, value, values, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 rounded-md">
        <SelectValue placeholder={`${label}: All`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{label}: All</SelectItem>
        {values.map((item) => (
          <SelectItem key={item} value={item}>{item}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
