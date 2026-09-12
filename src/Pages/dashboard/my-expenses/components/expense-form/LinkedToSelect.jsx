/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@components/components/ui/avatar";
import { Button } from "@components/components/ui/button";
import { Command, CommandInput, CommandItem, CommandList } from "@components/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@components/components/ui/popover";
import EmployeeV2Service from "@/services/employee-v2.service";
import { formatDate, getInitials } from "../expense.utils";

export default function LinkedToSelect({ expenseFor, value, displayName, error, onChange, onBlur }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const listRef = useRef(null);
  const moreRef = useRef(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useInfiniteQuery({
    queryKey: ["expense-lookup", expenseFor, debouncedSearch],
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const response = await EmployeeV2Service.getExpenseLookup({
        expenseFor, page: pageParam, limit: 25, search: debouncedSearch, signal,
      });
      if (response.data?.success === false) throw new Error("Unable to load linked records");
      return response.data.data;
    },
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.pagination?.page);
      return page < Number(lastPage.pagination?.totalPages) ? page + 1 : undefined;
    },
  });
  const { hasNextPage, isFetching, isError, fetchNextPage } = query;
  const searching = search.trim() !== debouncedSearch;
  const items = query.data?.pages.flatMap((page) => page.items || []) || [];
  const selected = selectedItem?._id === value ? selectedItem : items.find((item) => item._id === value);

  useEffect(() => {
    if (!open || searching || !hasNextPage || isFetching || isError) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) fetchNextPage({ cancelRefetch: false });
    }, { root: listRef.current, rootMargin: "60px" });
    if (moreRef.current) observer.observe(moreRef.current);
    return () => observer.disconnect();
  }, [open, searching, hasNextPage, isFetching, isError, fetchNextPage]);

  return (
    <Popover open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (!nextOpen) onBlur();
    }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-label="Linked To"
          aria-expanded={open}
          aria-invalid={Boolean(error)}
          className={`h-auto min-h-8 w-full justify-between gap-2 px-2 py-1 text-[11px] font-normal ${error ? "border-destructive" : ""}`}
        >
          {value ? <LookupItem item={selected || { name: displayName || "Selected record" }} /> : (
            <span className="text-muted-foreground">Select {expenseFor.toLowerCase()}</span>
          )}
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            aria-label={`Search ${expenseFor.toLowerCase()}s`}
            placeholder={`Search ${expenseFor.toLowerCase()}s...`}
            value={search}
            onValueChange={(nextSearch) => {
              setSearch(nextSearch);
              if (listRef.current) listRef.current.scrollTop = 0;
            }}
            className="h-9 text-[11px]"
          />
          <CommandList ref={listRef} className="max-h-60 overscroll-contain" aria-busy={isFetching || searching}>
            {!searching && items.map((item, index) => (
              <CommandItem
                key={item._id || `${item.name}-${index}`}
                value={item._id || `${item.name}-${index}`}
                disabled={!item._id}
                onSelect={() => {
                  setSelectedItem(item);
                  onChange(item._id, item);
                  setOpen(false);
                }}
                className="text-[11px]"
              >
                <LookupItem item={item} />
                {value === item._id ? <Check className="ml-auto h-3.5 w-3.5 text-primary" /> : null}
              </CommandItem>
            ))}
            {isFetching || searching ? (
              <div role="status" className="flex items-center justify-center gap-2 p-3 text-[11px] text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
              </div>
            ) : isError ? (
              <div role="alert" className="p-3 text-center text-[11px] text-destructive">
                Unable to load {expenseFor.toLowerCase()}s.
                <Button type="button" variant="ghost" className="ml-1 h-7 text-[11px]" onClick={() => (
                  query.isFetchNextPageError ? fetchNextPage() : query.refetch()
                )}>Retry</Button>
              </div>
            ) : items.length === 0 ? (
              <div role="status" className="p-3 text-center text-[11px] text-muted-foreground">No results found.</div>
            ) : null}
            {hasNextPage && !searching && !isError ? (
              <div ref={moreRef} className="p-1">
                <Button type="button" variant="ghost" disabled={isFetching} className="h-7 w-full text-[11px]" onClick={() => fetchNextPage({ cancelRefetch: false })}>
                  Load more
                </Button>
              </div>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function LookupItem({ item }) {
  const name = item.name || "Unknown";
  const initials = getInitials(name);
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={item.profileImage || undefined} alt={name} className="object-cover" />
        <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
          {initials.length < 2 ? name.slice(0, 2).toUpperCase() : initials.slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-normal">{name}</span>
        <span className="block text-[10px] text-muted-foreground">
          {item.eventDate ? formatDate(item.eventDate) : "No event date"}
        </span>
      </span>
    </span>
  );
}
