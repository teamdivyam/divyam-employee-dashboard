/* eslint-disable react/prop-types */
import { forwardRef } from 'react';

import { cn } from '@components/lib/utils';
import {
  Table as BaseTable,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/components/ui/table';

const EventTable = forwardRef(({ className, headerVariant = 'default', ...props }, ref) => (
  <BaseTable
    ref={ref}
    className={cn(
      '[&_thead]:bg-muted/60 [&_thead_tr]:h-11 [&_thead_tr]:border-b',
      '[&_thead_tr]:border-border [&_thead_tr]:bg-muted/60 [&_thead_tr]:hover:bg-muted/60',
      '[&_thead_th]:h-11 [&_thead_th]:whitespace-nowrap [&_thead_th]:px-3',
      '[&_thead_th]:leading-none',
      '[&_thead_th]:tracking-[0.01em]',
      '[&_thead_th:first-child]:pl-4 [&_thead_th:last-child]:pr-4',
      '[&_tbody_td:first-child]:pl-6 [&_tbody_td:last-child]:pr-6',
      className,
      '[&_thead_th]:text-[11px] [&_thead_th]:font-semibold [&_thead_th]:text-foreground',
      headerVariant === 'section' && '[&_thead_th:first-child]:text-center [&_thead_th:last-child]:text-center [&_thead_th:first-child]:px-4 [&_thead_th:last-child]:px-4',
    )}
    {...props}
  />
));

EventTable.displayName = 'EventTable';

export {
  EventTable as Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};
