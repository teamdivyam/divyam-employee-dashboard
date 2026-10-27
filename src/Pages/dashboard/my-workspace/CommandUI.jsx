/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@components/components/ui/button';
import { Input } from '@components/components/ui/input';
import { Label } from '@components/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@components/components/ui/dialog';
import { Badge } from '@components/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@components/components/ui/avatar';
import { cn } from '@components/lib/utils';
import { useCommandQuery } from './useCommand';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { errorMessage, initials } from './centralCommand.utils';

export function QueryState({ query, empty = false, children }) {
  if (query.isPending && query.fetchStatus !== 'idle') return <p className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading...</p>;
  if (query.isError) return <div role="alert" className="space-y-2 p-3 text-sm text-destructive"><p>{errorMessage(query.error)}</p><Button size="sm" variant="outline" onClick={() => query.refetch()}>Retry</Button></div>;
  if (empty) return <p className="p-4 text-sm text-muted-foreground">No records found.</p>;
  return children;
}
export function Pager({ data, page, setPage }) {
  if (!data || data.total <= data.limit) return null;
  return <div className="flex items-center justify-between gap-2 border-t border-border p-2 text-xs text-muted-foreground"><Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span>{page} / {Math.ceil(data.total / data.limit)}</span><Button variant="ghost" size="sm" disabled={page * data.limit >= data.total} onClick={() => setPage(page + 1)}>Next</Button></div>;
}
export function Choice({ label, value, onChange, options, disabled }) {
  return <div className="min-w-0 space-y-1"><Label className="text-xs">{label}</Label><Select value={value || '__none'} onValueChange={v => onChange(v === '__none' ? '' : v)} disabled={disabled}><SelectTrigger aria-label={label} className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{options.map(o => <SelectItem key={o.value || '__none'} value={o.value || '__none'}>{o.label}</SelectItem>)}</SelectContent></Select></div>;
}
export function Lookup({ label, path, value, onChange, nameKey = 'name', params = {}, extra = [], filter = () => true }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebouncedValue(search, 300);
  const query = useCommandQuery(path, { ...params, search: debounced, page, limit: 25 });
  const options = [...extra, ...(query.data?.items || []).filter(filter).map(item => ({ value: item._id, label: item[nameKey] || item._id }))];
  if (value && !options.some(o => o.value === value)) options.push({ value, label: 'Current selection (' + value.slice(-6) + ')' });
  return <div className="space-y-2"><Input aria-label={'Search ' + label} placeholder={'Search ' + label.toLowerCase()} value={search} maxLength={100} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-8 text-xs" /><QueryState query={query}><Choice label={label} value={value} onChange={onChange} options={[{ value: '', label: 'Select...' }, ...new Map(options.map(o => [o.value, o])).values()]} /></QueryState><Pager data={query.data} page={page} setPage={setPage} /></div>;
}
export function PersonAvatar({ name, image, className = '', fallbackClassName = 'bg-primary/10 text-primary' }) {
  return <Avatar className={'h-9 w-9 shrink-0 ' + className}><AvatarImage src={image?.smallUrl} alt="" className="object-cover" /><AvatarFallback className={'text-xs font-medium ' + fallbackClassName}>{initials(name)}</AvatarFallback></Avatar>;
}
export function Status({ children }) {
  return <Badge variant="outline" className="whitespace-normal text-[10px]">{children}</Badge>;
}
export function Modal({ title, description, children, onClose, wide = false, contentClassName }) {
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className={cn(wide ? 'max-h-[90dvh] w-[calc(100%-1.5rem)] overflow-y-auto text-foreground sm:max-w-5xl' : 'max-h-[90dvh] w-[calc(100%-1.5rem)] overflow-y-auto text-foreground sm:max-w-xl', contentClassName)}><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description || 'My Workspace'}</DialogDescription></DialogHeader>{children}</DialogContent></Dialog>;
}
export function Field({ label, error, children }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}{error && <p role="alert" className="text-xs text-destructive">{error.message || error}</p>}</div>;
}
