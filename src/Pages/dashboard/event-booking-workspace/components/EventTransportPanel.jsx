/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import {
  BusFront,
  CarFront,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  MapPinned,
  Plus,
  Search,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./EventTable";
import EventGuestsNav from "./EventGuestsNav";
import EventSummaryCards from "./EventSummaryCards";

const idOf = (value) => String(value?._id || value || "");
const routeKey = (item) => `${item.origin || ""}|||${item.destination || ""}`;
const statuses = [
  "Pending Assignment",
  "Assigned",
  "Scheduled",
  "Confirmed",
  "Completed",
  "Cancelled",
];
const statusTone = (status) =>
  ["Assigned", "Confirmed", "Completed"].includes(status)
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "Scheduled"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : status === "Cancelled"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-amber-200 bg-amber-50 text-amber-700";
const scheduleLabel = (value) => {
  if (!value) return { date: "-", time: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "-", time: "" };
  return {
    date: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
};

export default function EventTransportPanel({
  assignments,
  guests,
  vehicles,
  onGuestTab,
  onAddTransport,
  onEditTransport,
  onAddVehicle,
}) {
  const [search, setSearch] = useState("");
  const [routeFilter, setRouteFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const guestMap = useMemo(
    () => new Map(guests.map((item) => [idOf(item), item])),
    [guests],
  );
  const vehicleMap = useMemo(
    () => new Map(vehicles.map((item) => [idOf(item), item])),
    [vehicles],
  );
  const routes = useMemo(
    () =>
      Array.from(
        new Map(
          assignments
            .filter((item) => item.origin || item.destination)
            .map((item) => [
              routeKey(item),
              {
                key: routeKey(item),
                label: [item.origin, item.destination]
                  .filter(Boolean)
                  .join(" → "),
              },
            ]),
        ).values(),
      ),
    [assignments],
  );
  const filtered = useMemo(
    () =>
      assignments.filter((item) => {
        const guest = guestMap.get(idOf(item.guest));
        const vehicle = vehicleMap.get(idOf(item.vehicle));
        const term = search.trim().toLowerCase();
        if (
          term &&
          !`${guest?.name || ""} ${item.origin || ""} ${item.destination || ""} ${vehicle?.name || ""} ${vehicle?.registrationNumber || ""}`
            .toLowerCase()
            .includes(term)
        )
          return false;
        if (routeFilter !== "all" && routeKey(item) !== routeFilter)
          return false;
        if (statusFilter !== "all" && item.status !== statusFilter)
          return false;
        return true;
      }),
    [
      assignments,
      guestMap,
      routeFilter,
      search,
      statusFilter,
      vehicleMap,
    ],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [routeFilter, search, statusFilter]);
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);
  const required = guests
    .filter(
      (item) =>
        item.transportRequired ||
        (item.hospitalityNeeds || []).some((need) =>
          /pickup|drop|transport|transfer/i.test(need),
        ),
    )
    .reduce((total, item) => total + Number(item.memberCount || 1), 0);
  const assigned = assignments
    .filter(
      (item) => !["Pending Assignment", "Cancelled"].includes(item.status),
    )
    .reduce((total, item) => total + Number(item.guestCount || 1), 0);
  const summaries = [
    {
      label: "Transport Required",
      value: required,
      icon: CarFront,
      tone: "blue",
    },
    {
      label: "Assigned",
      value: assigned,
      icon: CheckCircle2,
      tone: "emerald",
    },
    {
      label: "Pending Assignment",
      value: Math.max(0, required - assigned),
      icon: Clock3,
      tone: "amber",
    },
    {
      label: "Vehicles",
      value: vehicles.length,
      icon: BusFront,
      tone: "blue",
    },
    {
      label: "Routes",
      value: routes.length,
      icon: MapPinned,
      tone: "blue",
    },
  ];
  const download = () => {
    const rows = [['Guest / Family', 'Pickup', 'Drop', 'Vehicle', 'Registration', 'Driver', 'Date', 'Time', 'Guests', 'Status'], ...filtered.map((item) => {
      const guest = guestMap.get(idOf(item.guest));
      const vehicle = vehicleMap.get(idOf(item.vehicle));
      const schedule = scheduleLabel(item.scheduledAt);
      return [guest?.name || '', item.origin || '', item.destination || '', vehicle?.name || '', vehicle?.registrationNumber || '', vehicle?.driverName || '', schedule.date, schedule.time, item.guestCount || 1, item.status || 'Pending Assignment'];
    })];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transport.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const filters = (
    <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-x-auto pb-1">
      <div className="relative min-w-56 flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search guest / family, route or driver..."
          className="h-9 pl-9 text-xs"
        />
      </div>
      <Select value={routeFilter} onValueChange={setRouteFilter}>
        <SelectTrigger className="h-9 w-32 shrink-0 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Routes</SelectItem>
          {routes.map((route) => (
            <SelectItem key={route.key} value={route.key}>
              {route.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="h-9 w-36 shrink-0 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Transport Status</SelectItem>
          {statuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Card id="transport-plan" className="crm-card overflow-hidden">
      <EventSummaryCards
        metricItems={summaries.map((item) => ({
          ...item,
          value: item.value.toLocaleString("en-IN"),
        }))}
      />
      <EventGuestsNav active="transport" onSelect={onGuestTab} />
      <CardContent className="p-4">
        <div className="mb-3 flex flex-nowrap items-center gap-2 overflow-x-auto">{filters}<Button variant="outline" size="sm" className="h-9 shrink-0" onClick={download} disabled={!filtered.length}><Download className="h-4 w-4" />Download</Button><Button variant="outline" size="sm" className="h-9 shrink-0" onClick={onAddVehicle}><CarFront className="h-4 w-4" />Manage Vehicle</Button><Button variant="custom" size="sm" className="h-9 shrink-0" onClick={onAddTransport}><Plus className="h-4 w-4" />Add Transport</Button></div>
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <Table headerVariant="section" className="min-w-[1100px] table-fixed text-xs">
              <colgroup>
                <col className="w-[4%]" /><col className="w-[15%]" /><col className="w-[11%]" /><col className="w-[19%]" /><col className="w-[20%]" /><col className="w-[12%]" /><col className="w-[7%]" /><col className="w-[8%]" /><col className="w-[9%]" />
              </colgroup>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>#</TableHead>
                  <TableHead>Guest / Family</TableHead>
                  <TableHead>Movement</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Vehicle &amp; Driver</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length ? (
                  pageRows.map((item, index) => {
                    const guest = guestMap.get(idOf(item.guest));
                    const vehicle = vehicleMap.get(idOf(item.vehicle));
                    const schedule = scheduleLabel(item.scheduledAt);
                    return (
                      <TableRow key={item._id || `pending-${idOf(item.guest)}`}>
                        <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">
                              {guest?.name || "Guest record"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{item.transferType ? <Badge variant="secondary" className="whitespace-nowrap rounded px-2 py-1 text-[10px] text-blue-700">{item.transferType}</Badge> : '-'}</TableCell>
                        <TableCell>
                          {item.origin || item.destination ? (
                            <div className="flex items-center gap-2">
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cyan-50 text-cyan-600">
                                <MapPinned className="h-4 w-4" />
                              </span>
                              <p className="max-w-48 font-medium text-foreground">
                                {item.origin || "-"}{" "}
                                <span className="text-muted-foreground">→</span>{" "}
                                {item.destination || "-"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              Route pending
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {vehicle ? (
                            <div className="flex items-center gap-2">
                              <CarFront className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="font-semibold text-foreground">
                                  {vehicle.name}
                                </p>
                                <p className="text-[10px] text-blue-700">
                                  {vehicle.registrationNumber ||
                                    vehicle.vehicleType ||
                                    "-"}
                                </p>
                                {vehicle.driverName ? <p className="text-[10px] text-muted-foreground">{vehicle.driverName}{vehicle.driverContact ? ` · ${vehicle.driverContact}` : ''}</p> : null}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              Not Assigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="flex items-center gap-2 font-medium">
                            <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                            {schedule.date}
                          </p>
                          {schedule.time ? (
                            <p className="mt-0.5 pl-5 text-[10px] text-foreground">
                              {schedule.time}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="font-semibold">{item.guestCount || guest?.memberCount || 1}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`rounded px-2 py-0.5 text-[9px] ${statusTone(item.status)}`}
                          >
                            {item.status || "Pending Assignment"}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 px-3 text-blue-700"
                              onClick={() => onEditTransport(item)}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-40 text-center">
                      <BusFront className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="font-semibold text-foreground">
                        No transport records found
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Add transport needs to guests or create an assignment.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">
              Showing {filtered.length ? (page - 1) * pageSize + 1 : 0} to{" "}
              {Math.min(page * pageSize, filtered.length)} of {filtered.length}{" "}
              transport records
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === 1}
                onClick={() => setPage((value) => value - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="grid h-8 min-w-8 place-items-center rounded-md bg-emerald-50 px-2 font-semibold text-emerald-700">
                {page}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === pages}
                onClick={() => setPage((value) => value + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
