/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import { ExternalLink, ImageOff, Plus } from 'lucide-react';

import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/components/ui/select';

const preferenceTone = (status = '') => {
  if (status === 'Final Preference') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300';
  if (status === 'Client Preferred') return 'bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300';
  if (status === 'Shortlisted') return 'bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300';
  return 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300';
};

export default function VisualPreferencesGallery({ preferences = [], functionNames = [], onAdd }) {
  const [functionFilter, setFunctionFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('recent');

  const filters = useMemo(() => [
    'All',
    ...new Set([...functionNames, ...preferences.map((item) => item.functionName)].filter(Boolean)),
  ], [functionNames, preferences]);

  const visiblePreferences = useMemo(() => preferences
    .filter((item) => functionFilter === 'All' || item.functionName === functionFilter)
    .sort((left, right) => {
      const leftTime = new Date(left.createdAt || 0).getTime();
      const rightTime = new Date(right.createdAt || 0).getTime();
      return sortOrder === 'oldest' ? leftTime - rightTime : rightTime - leftTime;
    }), [functionFilter, preferences, sortOrder]);

  return (
    <div className="p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex max-w-full gap-1.5 overflow-x-auto pb-0.5">
          {filters.map((filter) => (
            <Button key={filter} type="button" variant={functionFilter === filter ? 'default' : 'outline'} size="sm" onClick={() => setFunctionFilter(filter)} className={`h-7 shrink-0 px-3 text-[10px] ${functionFilter === filter ? 'bg-pink-600 hover:bg-pink-700' : ''}`}>
              {filter}
            </Button>
          ))}
        </div>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="h-7 w-[150px] text-[10px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="recent">Recently Added</SelectItem><SelectItem value="oldest">Oldest First</SelectItem></SelectContent>
        </Select>
      </div>

      {visiblePreferences.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
          {visiblePreferences.map((item, index) => (
            <article key={item._id || `${item.title}-${index}`} className="group overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
              <a href={item.imageUrl} target="_blank" rel="noreferrer" className="relative block aspect-[4/3] overflow-hidden bg-muted" aria-label={`Open ${item.title || 'client preference'} image`}>
                <img src={item.imageUrl} alt={item.title || 'Client preference'} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                <Badge variant="secondary" className="absolute left-2 top-2 border-0 bg-background/90 text-[9px] text-foreground shadow-sm backdrop-blur-sm">{item.source || 'Client Shared'}</Badge>
                {item.recordStatus === 'Draft' ? <Badge variant="secondary" className="absolute right-2 top-2 border-0 bg-slate-900/70 text-[9px] text-white">Draft</Badge> : null}
                <span className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-slate-950/70 text-white opacity-0 transition-opacity group-hover:opacity-100"><ExternalLink className="h-3.5 w-3.5" /></span>
              </a>
              <div className="space-y-1.5 p-2.5">
                <p className="truncate text-[11px] font-semibold text-foreground">{item.title}</p>
                <p className="truncate text-[9px] text-muted-foreground">{item.category} <span aria-hidden="true">·</span> {item.functionName}</p>
                <Badge variant="outline" className={`border-0 text-[9px] font-medium ${preferenceTone(item.status)}`}>{item.status || 'Under Review'}</Badge>
                <p className="line-clamp-2 text-[10px] leading-4 text-muted-foreground">{item.likes}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid place-items-center py-8 text-center">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-pink-50 text-pink-600 dark:bg-pink-400/10 dark:text-pink-300"><ImageOff className="h-4 w-4" /></span>
          <p className="mt-2 text-xs font-semibold text-foreground">No visual preferences added</p>
          <p className="mt-0.5 max-w-sm text-[10px] text-muted-foreground">Upload client references and connect each image to a function and category.</p>
          <Button type="button" size="sm" onClick={onAdd} className="mt-3 h-8 gap-1.5 bg-pink-600 text-[11px] hover:bg-pink-700"><Plus className="h-3.5 w-3.5" />Add Preference</Button>
        </div>
      )}
    </div>
  );
}
