/* eslint-disable react/prop-types */
import { createContext, useContext, useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@components/components/ui/avatar';
import { Input } from '@components/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/components/ui/select';
import { bookingStatuses, paymentStatuses } from './EventBookingComponents';
import {
  CLOSURE_STATUS_OPTIONS,
  HOLD_STATUS_OPTIONS,
  LIVE_STATUS_OPTIONS,
  PLANNING_BOOKING_STATUSES,
  READINESS_FILTER_OPTIONS,
  SETTLEMENT_STATUS_OPTIONS,
} from '../eventBookingDashboard.constants';
import { avatarUrl, initials } from '../eventBookingDashboard.utils';

const FilterDropdownContext = createContext(null);

export function EventBookingDashboardFilters({ activeTab, cities, employees, eventTypes, filters, setFilter }) {
  const [openFilter, setOpenFilter] = useState(null);
  const managerOptions = employees.map((employee) => ({
    value: employee._id,
    label: employee.name,
    content: (
      <span className="flex items-center gap-2">
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarImage className="object-cover" src={avatarUrl(employee)} alt={employee.name} />
          <AvatarFallback className="bg-slate-900 text-[8px] font-semibold text-white">{initials(employee.name)}</AvatarFallback>
        </Avatar>
        <span className="truncate">{employee.name}</span>
      </span>
    ),
  }));

  useEffect(() => setOpenFilter(null), [activeTab]);

  return (
    <FilterDropdownContext.Provider value={{ openFilter, setOpenFilter }}>
          <div className={`mb-3 grid min-w-0 gap-2 sm:grid-cols-2 ${activeTab === 'today' ? 'xl:grid-cols-[minmax(260px,1.6fr)_180px_200px_150px_180px]' : activeTab === 'closed' ? 'xl:grid-cols-[minmax(260px,1.5fr)_130px_180px_160px_210px]' : 'xl:grid-cols-[minmax(220px,1.5fr)_140px_160px_140px_160px]'}`}>
            <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-9 pl-9 text-xs" placeholder="Search client name or booking ID..." value={filters.search} onChange={(event) => setFilter('search', event.target.value)} />
            </div>
            {activeTab === 'completed' ? (
              <>
                <FilterSelect value={filters.managerId} onChange={(value) => setFilter('managerId', value)} placeholder="All Event Managers" options={managerOptions} />
                <FilterSelect value={filters.eventType} onChange={(value) => setFilter('eventType', value)} placeholder="All Event Types" options={eventTypes} />
                <FilterSelect value={filters.closureStatus} onChange={(value) => setFilter('closureStatus', value)} placeholder="Closure Status" options={CLOSURE_STATUS_OPTIONS} />
                <FilterSelect value={filters.paymentStatus} onChange={(value) => setFilter('paymentStatus', value)} placeholder="Payment Status" options={paymentStatuses} />
              </>
            ) : activeTab === 'closed' ? (
              <>
                <FilterSelect value={filters.status} onChange={(value) => setFilter('status', value)} placeholder="Status" options={HOLD_STATUS_OPTIONS} />
                <FilterSelect value={filters.managerId} onChange={(value) => setFilter('managerId', value)} placeholder="All Event Managers" options={managerOptions} />
                <FilterSelect value={filters.eventType} onChange={(value) => setFilter('eventType', value)} placeholder="All Event Types" options={eventTypes} />
                <FilterSelect value={filters.settlementStatus} onChange={(value) => setFilter('settlementStatus', value)} placeholder="Payment / Settlement Status" options={SETTLEMENT_STATUS_OPTIONS} />
              </>
            ) : activeTab === 'today' ? (
              <>
                <FilterSelect value={filters.managerId} onChange={(value) => setFilter('managerId', value)} placeholder="All Event Managers" options={managerOptions} />
                <FilterSelect value={filters.city} onChange={(value) => setFilter('city', value)} placeholder="All Cities / Venues" options={cities} />
                <FilterSelect value={filters.liveStatus} onChange={(value) => setFilter('liveStatus', value)} placeholder="Live Status" options={LIVE_STATUS_OPTIONS} />
                <FilterSelect value={filters.paymentStatus} onChange={(value) => setFilter('paymentStatus', value)} placeholder="Payment Status" options={paymentStatuses} />
              </>
            ) : activeTab === 'planning' ? (
              <>
                <FilterSelect value={filters.managerId} onChange={(value) => setFilter('managerId', value)} placeholder="All Event Managers" options={managerOptions} />
                <FilterSelect value={filters.eventType} onChange={(value) => setFilter('eventType', value)} placeholder="All Event Types" options={eventTypes} />
                <FilterSelect value={filters.status} onChange={(value) => setFilter('status', value)} placeholder="Planning Stage" options={PLANNING_BOOKING_STATUSES} />
                <FilterSelect value={filters.paymentStatus} onChange={(value) => setFilter('paymentStatus', value)} placeholder="Payment Status" options={paymentStatuses} />
              </>
            ) : activeTab === 'execution_ready' ? (
              <>
                <FilterSelect value={filters.managerId} onChange={(value) => setFilter('managerId', value)} placeholder="All Event Managers" options={managerOptions} />
                <FilterSelect value={filters.eventType} onChange={(value) => setFilter('eventType', value)} placeholder="All Event Types" options={eventTypes} />
                <FilterSelect value={filters.readinessStatus} onChange={(value) => setFilter('readinessStatus', value)} placeholder="Readiness Status" options={READINESS_FILTER_OPTIONS} />
                <FilterSelect value={filters.paymentStatus} onChange={(value) => setFilter('paymentStatus', value)} placeholder="Payment Status" options={paymentStatuses} />
              </>
            ) : (
              <>
                <FilterSelect value={filters.eventType} onChange={(value) => setFilter('eventType', value)} placeholder="All Event Types" options={eventTypes} />
                <FilterSelect value={filters.managerId} onChange={(value) => setFilter('managerId', value)} placeholder="All Event Managers" options={managerOptions} />
                <FilterSelect value={filters.city} onChange={(value) => setFilter('city', value)} placeholder="All Cities" options={cities} />
                <FilterSelect value={filters.status} onChange={(value) => setFilter('status', value)} placeholder="Planning Stage" options={bookingStatuses} />
              </>
            )}
          </div>
    </FilterDropdownContext.Provider>
  );
}
function FilterSelect({ value, onChange, placeholder, options }) {
  const { openFilter, setOpenFilter } = useContext(FilterDropdownContext);
  const isOpen = openFilter === placeholder;

  return (
    <Select
      open={isOpen}
      value={value}
      onOpenChange={(open) => {
        if (open) setOpenFilter(placeholder);
        else setOpenFilter((current) => current === placeholder ? null : current);
      }}
      onValueChange={(nextValue) => {
        onChange(nextValue);
        setOpenFilter(null);
      }}
    >
      <SelectTrigger className="h-9 text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((option) => {
          const item = typeof option === 'string' ? { value: option, label: option } : option;
          return <SelectItem key={item.value} value={item.value} textValue={item.label}>{item.content || item.label}</SelectItem>;
        })}
      </SelectContent>
    </Select>
  );
}
