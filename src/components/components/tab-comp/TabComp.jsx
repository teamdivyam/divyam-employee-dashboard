/* eslint-disable react/prop-types */
import { Tabs, TabsList, TabsTrigger } from "@components/components/ui/tabs";
import { cn } from "@components/lib/utils";

/**
 * Shared dashboard tab navigation.
 *
 * Each tab must contain a `value` and `label`; `icon` is optional.
 * Tab content can be supplied as children (usually with the exported
 * `TabsContent` primitive) or rendered separately from the controlled value.
 */
export default function TabComp({
  tabs,
  value,
  onValueChange,
  children,
  className,
  listClassName,
  display = "block",
  ariaLabel = "Page sections",
}) {
  const isInline = display === "inline-block";

  return (
    <Tabs
      value={value}
      onValueChange={onValueChange}
      className={cn(
        isInline ? "inline-block max-w-full align-top" : "block w-full",
        className,
      )}
    >
      <TabsList
        className={cn(
          "tab-comp-list",
          isInline ? "w-auto max-w-full" : "w-full",
          listClassName,
        )}
        aria-label={ariaLabel}
      >
        {tabs.map(({ value: tabValue, label, icon: Icon, disabled = false }) => (
          <TabsTrigger
            key={tabValue}
            value={tabValue}
            disabled={disabled}
            className="tab-comp-trigger data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
