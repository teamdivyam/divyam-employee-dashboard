/* eslint-disable react/prop-types */
import { Tabs, TabsList, TabsTrigger } from "@components/components/ui/tabs";
import { cn } from "@components/lib/utils";

/**
 * Shared dashboard tab navigation.
 *
 * Each tab must contain a `value` and `label`. Optional fields are `icon`,
 * `disabled`, `notificationCount`, `className`, and `iconClassName`. A notification badge is only rendered
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
  toolbarClassName,
  toolbarRef,
  variant = "default",
  distribution = "equal",
  density = "default",
  display = "block",
  flush = false,
  ariaLabel = "Page sections",
}) {
  const isButtons = variant === "buttons";
  const isInline = display === "inline-block";
  const isContentWidth = distribution === "content";
  const isCompact = density === "compact";

  const tabList = (
    <TabsList
      className={cn(
        isButtons
          ? "flex h-auto justify-start gap-3 overflow-x-auto rounded-none bg-transparent p-1"
          : "tab-comp-list",
        variant === "detail" && "tab-comp-detail-list",
        variant === "detail" && isContentWidth && "tab-comp-content-list",
        variant === "detail" && isCompact && "tab-comp-compact-list",
        flush && "tab-comp-flush-list",
        isInline ? "w-auto max-w-full" : "w-full",
        listClassName,
      )}
      aria-label={ariaLabel}
    >
      {tabs.map(
        ({
          value: tabValue,
          label,
          icon: Icon,
          disabled = false,
          notificationCount,
          className: triggerClassName,
          iconClassName,
        }) => {
          const count = Number(notificationCount);
          const hasNotification = Number.isFinite(count) && count > 0;

          return (
            <TabsTrigger
              key={tabValue}
              value={tabValue}
              disabled={disabled}
              className={cn(
                isButtons
                  ? "h-11 shrink-0 gap-2 rounded-md border border-border bg-card px-5 text-xs font-semibold text-foreground shadow-sm hover:bg-accent data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
                  : "tab-comp-trigger data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                variant === "detail" && "tab-comp-detail-trigger",
                variant === "detail" &&
                  isContentWidth &&
                  "tab-comp-content-trigger",
                variant === "detail" && isCompact && "tab-comp-compact-trigger",
                isButtons && isCompact && "h-9 px-4",
                triggerClassName,
              )}
            >
              {Icon && (
                <Icon
                  className={cn("h-4 w-4", iconClassName)}
                  aria-hidden="true"
                />
              )}
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
        },
      )}
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
        <div
          ref={toolbarRef}
          className={cn(
            "flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center",
            toolbarClassName,
          )}
        >
          <div className="min-w-0 flex-1">{tabList}</div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        </div>
      ) : (
        tabList
      )}
      {children}
    </Tabs>
  );
}
