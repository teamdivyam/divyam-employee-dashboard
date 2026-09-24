import PropTypes from 'prop-types';
import { Card } from '@components/components/ui/card';

const tones = {
  blue: 'bg-blue-100/70 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300',
  green: 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
  amber: 'bg-amber-100/70 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  violet: 'bg-violet-100/70 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300',
  red: 'bg-red-100/70 text-red-600 dark:bg-red-400/10 dark:text-red-300',
};

export default function MetricCard({ label, value, icon: Icon, tone, onOpen, loading }) {
  const Content = onOpen ? 'button' : 'div';
  return (
    <Card className={`min-w-0 overflow-hidden border-0 shadow-none ${tones[tone]}`}>
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
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium leading-5 text-foreground">{label}</p>
            <p className="mt-1 break-words text-base font-bold leading-tight tracking-tight text-foreground">{loading ? '—' : value ?? '—'}</p>
          </div>
          {/* {onOpen && <ChevronRight className="mt-5 h-4 w-4 shrink-0" aria-hidden="true" />} */}
        </div>
      </Content>
    </Card>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.elementType.isRequired,
  tone: PropTypes.oneOf(Object.keys(tones)).isRequired,
  description: PropTypes.string,
  footer: PropTypes.string,
  onOpen: PropTypes.func,
  loading: PropTypes.bool,
};
