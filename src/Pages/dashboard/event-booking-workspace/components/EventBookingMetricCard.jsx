import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@components/components/ui/button';
import PropTypes from 'prop-types';
import { Card } from '@components/components/ui/card';

export default function MetricCard({ label, value, subValue, icon: Icon, tone, footer, onOpen, loading, hideable = false, hidden = false, onToggleHidden }) {
  const Content = onOpen ? 'button' : 'div';
  return (
    <Card className="booking-overview-kpi" data-tone={tone}>
      <Content
        {...(onOpen ? { type: 'button', onClick: onOpen } : {})}
        className="flex h-full w-full min-w-0 flex-col rounded-lg p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        aria-busy={loading}
      >
        <div className="flex w-full items-start gap-2.5">
          <span className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg">
            <span className="absolute inset-0 bg-current opacity-15" />
            <Icon className="relative h-4 w-4" aria-hidden="true" />
          </span>
          <div className={hideable ? "min-w-0 flex-1 pr-4" : "min-w-0 flex-1"}>
            <p className="text-[11px] font-medium leading-5 text-foreground">{label}</p>
            <p className={`mt-1 break-words text-base font-bold leading-tight tracking-tight ${tone === 'red' ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
              {hidden ? '\u20B9XXX,XXX' : loading
                ? '—'
                : value == null || value === ''
                  ? '—'
                  : React.isValidElement(value)
                    ? value
                    : Number.isNaN(Number(value))
                      ? value
                      : Math.trunc(Number(value))}
              {subValue && !hidden && !loading && value != null && value !== '' && value !== '—' && (
                <span className="ml-1 text-xs font-normal">
                  {subValue}
                </span>
              )}
            </p>
          </div>
          {/* {onOpen && <ChevronRight className="mt-5 h-4 w-4 shrink-0" aria-hidden="true" />} */}
        </div>
        {footer && !hidden && (
          <p className="mt-1 pl-10 text-[10px] leading-4 text-muted-foreground">
            {footer}
          </p>
        )}
      </Content>
      {hideable && <Button type="button" variant="ghost" size="icon" className="booking-overview-visibility" aria-label={hidden ? 'Show payment KPI values' : 'Hide payment KPI values'} aria-pressed={hidden} onClick={onToggleHidden}>{hidden ? <EyeOff /> : <Eye />}</Button>}
    </Card>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]),
  subValue: PropTypes.node,
  icon: PropTypes.elementType.isRequired,
  tone: PropTypes.oneOf(['blue', 'green', 'amber', 'softAmber', 'violet', 'red']).isRequired,
  description: PropTypes.string,
  footer: PropTypes.string,
  onOpen: PropTypes.func,
  loading: PropTypes.bool,
  hideable: PropTypes.bool,
  hidden: PropTypes.bool,
  onToggleHidden: PropTypes.func,
};
