/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  MessageCircle,
  Phone,
  Plus,
  Search,
  UserRound,
  UsersRound,
  CheckCircle2,
  Clock3,
  Crown,
  BedDouble,
} from "lucide-react";

import { Badge } from "@components/components/ui/badge";
import { Avatar, AvatarFallback } from "@components/components/ui/avatar";
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
import { initials } from "../eventBookingDashboard.utils";
import { getEventGuestNeeds } from "../eventRecordAdapters";
import EventSummaryCards from "./EventSummaryCards";

const idOf = (value) => String(value?._id || value || "");
const functionTones = [
  "border-rose-200 bg-rose-50 text-rose-700",
  "border-violet-200 bg-violet-50 text-violet-700",
  "border-emerald-200 bg-emerald-50 text-emerald-700",
];
const phoneFor = (item) => {
  const digits = String(item.contact || "").replace(/\D/g, "");
  const code = String(item.countryCode || "+91").replace(/\D/g, "");
  return digits.startsWith(code) && (String(item.contact).startsWith("+") || (code === "91" && digits.length === 12))
    ? digits
    : code + digits;
};
const needTones = [
  "border-amber-200 bg-amber-50 text-amber-700",
  "border-blue-200 bg-blue-50 text-blue-700",
  "border-cyan-200 bg-cyan-50 text-cyan-700",
];
const rsvpTone = (status) =>
  status === "Confirmed"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "Declined"
      ? "border-red-200 bg-red-50 text-red-700"
      : status === "Maybe"
        ? "border-violet-200 bg-violet-50 text-violet-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

export default function EventGuestListPanel({
  guests,
  functions,
  onGuestTab,
  onAdd,
  onEdit,
  onImport,
}) {
  const [search, setSearch] = useState("");
  const [functionFilter, setFunctionFilter] = useState("all");
  const [rsvpFilter, setRsvpFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const functionMap = useMemo(
    () => new Map(functions.map((item) => [idOf(item), item])),
    [functions],
  );
  const filtered = useMemo(
    () =>
      guests.filter((item) => {
        const term = search.trim().toLowerCase();
        if (
          term &&
          !`${item.name || ""} ${item.contact || ""} ${item.email || ""}`
            .toLowerCase()
            .includes(term)
        )
          return false;
        if (
          functionFilter !== "all" &&
          !(item.functions || []).map(idOf).includes(functionFilter)
        )
          return false;
        if (rsvpFilter !== "all" && item.rsvpStatus !== rsvpFilter)
          return false;
        return true;
      }),
    [functionFilter, guests, rsvpFilter, search],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [functionFilter, rsvpFilter, search]);
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);
  const totals = useMemo(
    () =>
      guests.reduce(
        (summary, item) => {
          const members = Number(item.memberCount || 1);
          summary.total += members;
          if (item.rsvpStatus === "Confirmed") summary.confirmed += members;
          if (item.rsvpStatus === "Pending") summary.pending += members;
          if (item.isVip || (item.hospitalityNeeds || []).includes("VIP"))
            summary.vip += members;
          if (
            item.stayRequired ||
            (item.hospitalityNeeds || []).includes("Stay")
          )
            summary.stay += members;
          return summary;
        },
        { total: 0, confirmed: 0, pending: 0, vip: 0, stay: 0 },
      ),
    [guests],
  );
  const summaryItems = [
    { label: "Total Guests", value: totals.total, tone: "blue", icon: UsersRound },
    { label: "Confirmed", value: totals.confirmed, tone: "emerald", icon: CheckCircle2 },
    { label: "Pending RSVP", value: totals.pending, tone: "amber", icon: Clock3 },
    { label: "VIP Guests", value: totals.vip, tone: "violet", icon: Crown },
    { label: "Stay Required", value: totals.stay, tone: "cyan", icon: BedDouble },
  ];

  return (
    <Card id="guest-list" className="crm-card overflow-hidden">
      <EventSummaryCards metricItems={summaryItems.map((item) => ({ ...item, value: item.value.toLocaleString("en-IN") }))} />
      <EventGuestsNav active="list" onSelect={onGuestTab} />

      <CardContent className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div className="relative min-w-44 flex-1 basis-44">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search guest / family"
                className="h-9 pl-9 text-xs"
              />
            </div>
            <Select value={functionFilter} onValueChange={setFunctionFilter}>
              <SelectTrigger className="h-9 w-32 shrink-0 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Functions</SelectItem>
                {functions.map((item) => (
                  <SelectItem key={idOf(item)} value={idOf(item)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={rsvpFilter} onValueChange={setRsvpFilter}>
              <SelectTrigger className="h-9 w-36 shrink-0 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All RSVP Status</SelectItem>
                {["Pending", "Confirmed", "Declined", "Maybe"].map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-2" onClick={onImport}>
              <Download className="h-4 w-4" />
              Import Guest List
            </Button>
            <Button
              variant="custom"
              size="sm"
              className="h-9 gap-2"
              onClick={onAdd}
            >
              <Plus className="h-4 w-4" />
              Add Guest
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <Table headerVariant="section" className="min-w-[950px] table-fixed text-xs">
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[18%] text-center">Guest / Family</TableHead>
                  <TableHead className="w-[16%]">Contact</TableHead>
                  <TableHead className="w-[7%] text-center">Members</TableHead>
                  <TableHead className="w-[17%]">Functions</TableHead>
                  <TableHead className="w-[12%]">RSVP Status</TableHead>
                  <TableHead className="w-[20%]">Hospitality Needs</TableHead>
                  <TableHead className="w-[13%] text-center">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length ? (
                  pageRows.map((item, index) => (
                    <TableRow key={idOf(item)}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className={functionTones[index % functionTones.length]}>{initials(item.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">
                              {item.name}
                            </p>
                            <p className="truncate text-[10px] text-muted-foreground">
                              {[item.comingFrom, item.guestType || (item.memberCount > 1 ? "Family" : "Individual")].filter(Boolean).join(" : ")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.contact ? <div className="space-y-1"><a href={`tel:+${phoneFor(item)}`} className="flex items-center gap-1 text-[11px]"><Phone className="h-3 w-3" />+{phoneFor(item)}</a><a href={`https://wa.me/${phoneFor(item)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300"><MessageCircle className="h-3 w-3" />WhatsApp</a></div> : "-"}</TableCell>
                      <TableCell className="text-center font-semibold">
                        {item.memberCount || 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(item.functions || []).length ? (
                            item.functions
                              .map(idOf)
                              .map((id) => functionMap.get(id))
                              .filter(Boolean)
                              .map((fn, badgeIndex) => (
                                <Badge
                                  key={idOf(fn)}
                                  variant="outline"
                                  className={`rounded px-2 py-0.5 text-[9px] ${functionTones[badgeIndex % functionTones.length]}`}
                                >
                                  {fn.name}
                                </Badge>
                              ))
                          ) : (
                            <span className="text-muted-foreground">
                              All functions
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`whitespace-nowrap rounded px-2 py-0.5 text-[9px] ${rsvpTone(item.rsvpStatus)}`}
                        >
                          {item.rsvpStatus || "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getEventGuestNeeds(item).length ? (
                            getEventGuestNeeds(item).map((need, needIndex) => (
                              <Badge
                                key={need}
                                variant="outline"
                                className={`rounded px-2 py-0.5 text-[9px] ${needTones[needIndex % needTones.length]}`}
                              >
                                {need}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 px-3 text-blue-700"
                          onClick={() => onEdit(item)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <UserRound className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="font-semibold text-foreground">
                        No guest records found
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Add guests or adjust the current filters.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t border-border px-6 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">
              Showing {filtered.length ? (page - 1) * pageSize + 1 : 0} to{" "}
              {Math.min(page * pageSize, filtered.length)} of {filtered.length}{" "}
              guest records
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
