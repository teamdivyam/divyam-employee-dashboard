/* eslint-disable react/prop-types */
import { useId, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@components/components/ui/avatar';
import { Button } from '@components/components/ui/button';
import { Label } from '@components/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@components/components/ui/popover';
import { Command, CommandInput, CommandItem, CommandList } from '@components/components/ui/command';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { useCommandQuery } from './useCommand';
import { Pager, QueryState } from './CommandUI';

const eventDate = value => value && !Number.isNaN(new Date(value).getTime())
  ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
  : 'Date not set';

function EventOption({ event }) {
  return <>
    <Avatar className="h-8 w-8 shrink-0"><AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{event.eventName?.trim().slice(0, 2).toUpperCase() || 'EV'}</AvatarFallback></Avatar>
    <span className="min-w-0 flex-1 text-left">
      <span className="block truncate text-xs font-medium">{event.eventName}</span>
      <span className="block whitespace-normal text-[10px] leading-relaxed text-muted-foreground">{eventDate(event.eventDate)} - {eventDate(event.eventEndDate)}</span>
    </span>
  </>;
}

export default function EventSelector({ conversationId, value, selectedEvent, onChange, label = 'Selected event' }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [chosenEvent, setChosenEvent] = useState(null);
  const debounced = useDebouncedValue(search, 300);
  const query = useCommandQuery('/events', { conversationId, search: debounced, page, limit: 25 }, open);
  const selected = selectedEvent || (chosenEvent?._id === value ? chosenEvent : query.data?.items?.find(event => event._id === value));
  const select = eventId => { setChosenEvent(query.data?.items?.find(event => event._id === eventId) || null); onChange(eventId); setOpen(false); setSearch(''); setPage(1); };
  return <div className="min-w-0 space-y-1">
    <Label htmlFor={id} className="text-xs">{label}</Label>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" role="combobox" aria-expanded={open} aria-controls={`${id}-options`} aria-label={label} variant="outline" className="h-auto min-h-9 w-full justify-between gap-2 px-2 py-2 font-normal">
          {selected ? <EventOption event={selected} /> : <span className="truncate text-xs text-muted-foreground">{value ? 'Loading selected event...' : 'Select event...'}</span>}
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <CommandInput aria-label="Search events" placeholder="Search events..." value={search} maxLength={100} onValueChange={value => { setSearch(value); setPage(1); }} className="h-9 text-xs" />
          <CommandList id={`${id}-options`}>
            {value && <CommandItem value="clear-selection" onSelect={() => select('')} className="text-xs">Clear selection</CommandItem>}
            <QueryState query={query} empty={query.data?.items?.length === 0}>
              {query.data?.items?.map(event => <CommandItem key={event._id} value={event._id} onSelect={() => select(event._id)} className="gap-2 py-2">
                <EventOption event={event} />
                {event._id === value && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
              </CommandItem>)}
            </QueryState>
          </CommandList>
        </Command>
        <Pager data={query.data} page={page} setPage={setPage} />
      </PopoverContent>
    </Popover>
  </div>;
}
