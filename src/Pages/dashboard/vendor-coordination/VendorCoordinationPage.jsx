import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/components/ui/select";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Eye,
  Hourglass,
  Loader2,
  Pencil,
  RefreshCcw,
  Search,
  UsersRound,
} from "lucide-react";
import EmployeeService from "@/services/employee.service";
import {
  DataTable,
  formatDate,
  formatDay,
  IconButton,
  MetricCard,
  MoreButton,
  SectionCard,
  StatusBadge,
  VendorLogo,
} from "./components/VendorCoordinationUI";

export default function VendorCoordinationPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    category: "all",
    city: "all",
    eventId: "all",
    startDate: "2025-05-20",
    endDate: "2025-06-19",
    page: 1,
  });

  const analyticsQuery = useQuery({
    queryKey: ["vendor-coordination-analytics"],
    queryFn: async () => {
      const response = await EmployeeService.getVendorCoordinationAnalytics();
      return response.data.analytics;
    },
  });

  const vendorsQuery = useQuery({
    queryKey: ["vendor-coordinations", filters],
    queryFn: async () => {
      const response = await EmployeeService.getVendorCoordinations({
        page: filters.page,
        limit: 8,
        search: filters.search || undefined,
        status: filters.status === "all" ? undefined : filters.status,
        category: filters.category === "all" ? undefined : filters.category,
        city: filters.city === "all" ? undefined : filters.city,
        eventId: filters.eventId === "all" ? undefined : filters.eventId,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      return response.data;
    },
    placeholderData: (previous) => previous,
  });

  const vendors = vendorsQuery.data?.vendorCoordinations || [];
  const pagination = vendorsQuery.data?.pagination;

  const optionValues = useMemo(() => {
    const category = [...new Set(vendors.map((item) => item.category || item.service).filter(Boolean))];
    const city = [...new Set(vendors.map((item) => item.city || item.relatedEvent?.city).filter(Boolean))];
    const status = [...new Set(vendors.map((item) => item.status).filter(Boolean))];
    const events = vendors
      .map((item) => item.relatedEvent)
      .filter(Boolean)
      .reduce((acc, event) => {
        if (!acc.some((item) => item._id === event._id)) acc.push(event);
        return acc;
      }, []);
    return { category, city, status, events };
  }, [vendors]);

  const setFilter = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value, page: key === "page" ? value : 1 }));

  const openVendor = (vendor) => {
    navigate(`/dashboard/vendor-coordination/${vendor.vendorId}/${vendor.assignmentId}`);
  };

  const analytics = analyticsQuery.data || {};
  const metrics = [
    ["Assigned Vendors", analytics.assignedVendors || 0, "All Active", UsersRound, "violet"],
    ["Upcoming Vendor Work", analytics.upcomingVendorWork || 0, "Next 7 Days", CalendarDays, "blue"],
    ["Pending Confirmation", String(analytics.pendingConfirmation || 0).padStart(2, "0"), "Awaiting Response", Hourglass, "orange"],
    ["In Progress", String(analytics.inProgress || 0).padStart(2, "0"), "Active Work", RefreshCcw, "blue"],
    ["Completed", analytics.completedThisMonth || 0, "This Month", CheckCircle2, "green"],
    ["Issues Reported", String(analytics.issuesReported || 0).padStart(2, "0"), "Needs Attention", AlertTriangle, "red"],
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-4 text-foreground md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Vendor Coordination</h1>
            <p className="mt-1 text-sm text-muted-foreground">Coordinate assigned vendors for your events.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex min-w-[300px] items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Input type="date" value={filters.startDate} onChange={(event) => setFilter("startDate", event.target.value)} className="h-7 border-0 p-0 shadow-none" />
              <span className="text-muted-foreground">-</span>
              <Input type="date" value={filters.endDate} onChange={(event) => setFilter("endDate", event.target.value)} className="h-7 border-0 p-0 shadow-none" />
            </div>
            <div className="relative w-full sm:w-[430px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="Search vendors, events, services..." className="h-11 rounded-lg pl-10" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metrics.map(([label, value, subLabel, Icon, tone]) => (
            <MetricCard key={label} label={label} value={value} subLabel={subLabel} icon={Icon} tone={tone} />
          ))}
        </div>

        <section className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border p-4">
            <h2 className="text-lg font-semibold text-foreground">Assigned Vendor Coordination</h2>
          </div>
          <div className="grid gap-3 border-b border-border p-4 md:grid-cols-2 xl:grid-cols-[160px_180px_180px_180px_1fr_110px]">
            <FilterSelect label="Status" value={filters.status} values={optionValues.status} onChange={(value) => setFilter("status", value)} />
            <FilterSelect label="Categories" value={filters.category} values={optionValues.category} onChange={(value) => setFilter("category", value)} />
            <FilterSelect label="Cities" value={filters.city} values={optionValues.city} onChange={(value) => setFilter("city", value)} />
            <Select value={filters.eventId} onValueChange={(value) => setFilter("eventId", value)}>
              <SelectTrigger className="h-10 rounded-md"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {optionValues.events.map((event) => <SelectItem key={event._id} value={event._id}>{event.eventName}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="Search vendor..." className="h-10 rounded-md" />
            <Button variant="outline" className="h-10 gap-2 rounded-md" onClick={() => setFilters({ search: "", status: "all", category: "all", city: "all", eventId: "all", startDate: "2025-05-20", endDate: "2025-06-19", page: 1 })}>
              <RefreshCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {vendorsQuery.isFetching && !vendors.length ? (
            <div className="p-12 text-center text-muted-foreground">
              <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-theme-color" />
              Loading assigned vendors
            </div>
          ) : (
            <DataTable
              emptyText="No assigned vendor coordination found."
              headers={["#", "Vendor Name", "Category / Service", "Related Event", "Event Date", "City / Venue", "Vendor Contact", "Work Status", "Confirmation", "Action"]}
              rows={vendors.map((vendor, index) => [
                (filters.page - 1) * 8 + index + 1,
                <button type="button" className="flex items-center gap-3 text-left" onClick={() => openVendor(vendor)}>
                  <VendorLogo name={vendor.vendorName} />
                  <span>
                    <span className="block font-semibold text-foreground">{vendor.vendorName}</span>
                    {vendor.preferred ? <span className="text-xs text-emerald-600 dark:text-emerald-300">Preferred Vendor</span> : null}
                  </span>
                </button>,
                vendor.category || vendor.service,
                vendor.relatedEvent?.eventName,
                <div><p className="font-semibold">{formatDate(vendor.relatedEvent?.eventDate)}</p><p className="text-xs text-muted-foreground">{formatDay(vendor.relatedEvent?.eventDate)}</p></div>,
                <div><p className="font-semibold">{vendor.relatedEvent?.city || vendor.city}</p><p className="text-xs text-muted-foreground">{vendor.relatedEvent?.venue}</p></div>,
                <div><p className="font-semibold">{vendor.contactPerson}</p><p className="text-xs text-muted-foreground">{vendor.mobileNumber}</p></div>,
                <StatusBadge>{vendor.status}</StatusBadge>,
                <StatusBadge>{vendor.confirmationStatus}</StatusBadge>,
                <div className="flex gap-2">
                  <IconButton onClick={() => openVendor(vendor)}><Eye className="h-4 w-4" /></IconButton>
                  <IconButton onClick={() => openVendor(vendor)}><Pencil className="h-4 w-4" /></IconButton>
                </div>,
              ])}
            />
          )}

          <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {vendors.length ? 1 : 0} to {vendors.length} of {pagination?.totalAssignments || vendors.length} vendors
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={(pagination?.page || 1) <= 1} onClick={() => setFilter("page", filters.page - 1)}>Previous</Button>
              {Array.from({ length: Math.min(pagination?.totalPages || 1, 3) }).map((_, index) => (
                <Button key={index} variant="outline" size="sm" className={(pagination?.page || 1) === index + 1 ? "border-primary text-primary" : ""} onClick={() => setFilter("page", index + 1)}>
                  {index + 1}
                </Button>
              ))}
              <Button variant="outline" size="sm" disabled={(pagination?.page || 1) >= (pagination?.totalPages || 1)} onClick={() => setFilter("page", filters.page + 1)}>Next</Button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard title="Upcoming Vendor Work" icon={CalendarDays} action={<button className="text-sm font-semibold text-primary">View All</button>}>
            <div className="space-y-3">
              {vendors.slice(0, 4).map((vendor) => (
                <div key={`${vendor.vendorId}-${vendor.assignmentId}`} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{vendor.vendorName}</p>
                    <p className="text-xs text-muted-foreground">{vendor.relatedEvent?.eventName}</p>
                  </div>
                  <StatusBadge>{vendor.status}</StatusBadge>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Work Scope Snapshot" icon={Hourglass} action={<button className="text-sm font-semibold text-primary">View All</button>}>
            <div className="space-y-4">
              {["Decor", "Lighting", "Catering", "Sound", "Floral", "Beverage"].map((scope, index) => (
                <div key={scope} className="grid grid-cols-[80px_1fr_36px] items-center gap-3 text-sm">
                  <span className="font-medium text-foreground">{scope}</span>
                  <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-theme-color" style={{ width: `${90 - index * 10}%` }} /></div>
                  <span className="text-xs text-muted-foreground">{Math.max(1, 6 - index)} / 6</span>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Coordination Notes / Recent Updates" icon={CheckCircle2} action={<button className="text-sm font-semibold text-primary">View All</button>}>
            <div className="space-y-4">
              {vendors.slice(0, 4).map((vendor) => (
                <div key={`${vendor.vendorId}-${vendor.assignmentId}-note`} className="text-sm">
                  <p className="font-medium text-foreground">{vendor.vendorName} confirmed for {vendor.relatedEvent?.eventName}.</p>
                  <p className="text-xs text-muted-foreground">{formatDate(vendor.reportingTime)}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, values, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 rounded-md"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label}</SelectItem>
        {values.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
