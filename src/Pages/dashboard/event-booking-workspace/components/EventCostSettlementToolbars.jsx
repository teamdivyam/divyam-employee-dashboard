/* eslint-disable react/prop-types */
import { Plus, Search, SlidersHorizontal } from "lucide-react";

import { Badge } from "@components/components/ui/badge";
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import { numberOf } from "../eventFinance.utils";

export function VendorSettlementToolbar({
  filters,
  options,
  onFilterChange,
  onRecordSettlement,
}) {
  const hasOutstandingVendor = (options.vendors || []).some(
    (vendor) => numberOf(vendor.outstandingAmount) > 0,
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap xl:flex-nowrap xl:justify-end">
      <div className="relative min-w-0 flex-1 sm:min-w-56 xl:max-w-64">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) => onFilterChange("search", event.target.value)}
          className="pl-9"
          placeholder="Search vendor or service..."
          aria-label="Search vendor settlements"
        />
      </div>

      <Select
        value={filters.service}
        onValueChange={(value) => onFilterChange("service", value)}
      >
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Services</SelectItem>
          {(options.services || []).map((service) => (
            <SelectItem key={service} value={service}>
              {service}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(value) => onFilterChange("status", value)}
      >
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {(options.statuses || []).map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="custom"
        onClick={onRecordSettlement}
        disabled={!hasOutstandingVendor}
        className="shrink-0 gap-2 whitespace-nowrap"
      >
        <Plus className="h-4 w-4" />
        Record Settlement
      </Button>
    </div>
  );
}

export function ExpenseToolbar({
  filters,
  options,
  activeExtraFilters,
  onFilterChange,
  onMoreFilters,
  onAddExpense,
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap xl:flex-nowrap xl:justify-end">
      <div className="relative min-w-0 flex-1 sm:min-w-52 xl:max-w-56">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) => onFilterChange("search", event.target.value)}
          className="pl-9"
          placeholder="Search expenses..."
          aria-label="Search event expenses"
        />
      </div>

      <Select
        value={filters.category}
        onValueChange={(value) => onFilterChange("category", value)}
      >
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {(options.categories || []).map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.approvalStatus}
        onValueChange={(value) => onFilterChange("approvalStatus", value)}
      >
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue placeholder="Approval Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Approval Status</SelectItem>
          {(options.approvalStatuses || []).map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        onClick={onMoreFilters}
        className="shrink-0 gap-2 whitespace-nowrap"
      >
        <SlidersHorizontal className="h-4 w-4" />
        More Filters
        {activeExtraFilters ? (
          <Badge className="ml-1 h-5 min-w-5 justify-center rounded-full px-1.5">
            {activeExtraFilters}
          </Badge>
        ) : null}
      </Button>

      <Button
        variant="custom"
        onClick={onAddExpense}
        className="shrink-0 gap-2 whitespace-nowrap"
      >
        <Plus className="h-4 w-4" />
        Add Expense
      </Button>
    </div>
  );
}
