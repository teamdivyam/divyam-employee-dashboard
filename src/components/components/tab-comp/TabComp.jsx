/* eslint-disable react/prop-types */
import { Tabs, TabsList, TabsTrigger } from "@components/components/ui/tabs";
import { cn } from "@components/lib/utils";

/**
 * Shared dashboard tab navigation.
 *
 * Each tab must contain a `value` and `label`. Optional fields are `icon`,
 * `disabled`, and `notificationCount`. A notification badge is only rendered
 * when `notificationCount` is greater than zero.
 * Tab content can be supplied as children (usually with the exported
 * `TabsContent` primitive) or rendered separately from the controlled value.
 */
export default function TabComp({
  tabs,
  value,
  onValueChange,
  children,
  actions,
  className,
  listClassName,
  variant = "default",
  distribution = "equal",
  density = "default",
  display = "block",
  ariaLabel = "Page sections",
  rightAction = null,
}) {
  const isInline = display === "inline-block";
  const isContentWidth = distribution === "content";
  const isCompact = density === "compact";

  const tabList = (
    <TabsList
        className={cn(
          "tab-comp-list",
          variant === "detail" && "tab-comp-detail-list",
          variant === "detail" && isContentWidth && "tab-comp-content-list",
          variant === "detail" && isCompact && "tab-comp-compact-list",
          isInline ? "w-auto max-w-full" : "w-full",
          listClassName,
        )}
        aria-label={ariaLabel}
      >
        {tabs.map(({
          value: tabValue,
          label,
          icon: Icon,
          disabled = false,
          notificationCount,
        }) => {
          const count = Number(notificationCount);
          const hasNotification = Number.isFinite(count) && count > 0;

          return (
            <TabsTrigger
              key={tabValue}
              value={tabValue}
              disabled={disabled}
              className={cn(
                "tab-comp-trigger data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                variant === "detail" && "tab-comp-detail-trigger",
                variant === "detail" && isContentWidth && "tab-comp-content-trigger",
                variant === "detail" && isCompact && "tab-comp-compact-trigger",
              )}
            >
              {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
              <span>{label}</span>
              {hasNotification ? (
                <span
                  className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-400 px-1.5 py-1 text-[10px] font-semibold leading-none text-white dark:bg-orange-400/15 dark:text-orange-300"
                  aria-label={`${count} pending notification${count === 1 ? "" : "s"}`}
                >
                  {count}
                </span>
              ) : null}
            </TabsTrigger>
          );
        })}
      </TabsList>
  );

  return (
    <Tabs
      value={value}
      onValueChange={onValueChange}
      className={cn(
        isInline ? "inline-block max-w-full align-top" : "block w-full",
        className,
      )}
    >
      {actions ? (
        <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
          <div className="min-w-0 flex-1">{tabList}</div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        </div>
      ) : tabList}
      {children}
    </Tabs>
  );
}
