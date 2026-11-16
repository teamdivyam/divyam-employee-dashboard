/* eslint-disable react/prop-types */
import { Card, CardContent } from '@components/components/ui/card';
import { Info } from 'lucide-react';

export default function EventMetricCards({ items, layout = 'default' }) {
  const isOverview = layout === 'overview';
  return <div className={`grid gap-3 sm:grid-cols-2 ${items.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-5'}`}>
    {items.map(({ label, value, caption, icon: Icon, tone, cardTone, surface, valueClass, valueTone, info }) => (
      <Card key={label} className={`crm-card min-w-0 h-full ${cardTone || surface || ''}`}>
        <CardContent className={`flex items-center gap-3 ${isOverview ? 'event-detail-kpi-content' : 'h-24 p-4'}`}>
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${tone || 'bg-primary/10 text-primary'}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className={isOverview ? "flex min-w-0 flex-1 flex-col justify-center" : "min-w-0"}>
            <p title={String(value ?? '')} className={`truncate ${isOverview ? 'event-detail-kpi-value' : 'text-xl font-bold'} ${valueClass || valueTone || 'text-foreground'}`}>{value}</p>
            <p className={`flex items-center gap-1.5 ${isOverview ? 'event-detail-kpi-label' : 'text-xs font-semibold text-foreground'}`}>
              <span className="truncate" title={label}>{label}</span>
              {info && <span tabIndex={0} className="shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" title={typeof info === 'string' ? info : 'Personal expenses awaiting reimbursement'} aria-label={typeof info === 'string' ? info : 'Personal expenses awaiting reimbursement'}><Info className="h-3 w-3 text-muted-foreground" aria-hidden="true" /></span>}
            </p>
            {(caption != null || isOverview) && <p title={caption != null ? String(caption) : undefined} className={`mt-1 truncate text-[10px] text-muted-foreground ${isOverview ? 'order-3 h-4 leading-4' : ''}`}>{caption}</p>}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>;
}
