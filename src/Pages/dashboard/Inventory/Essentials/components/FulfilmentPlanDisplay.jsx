import { Store, CalendarDays } from "lucide-react";
import PropTypes from "prop-types";

// Persisted source quantities only; no stock or transfer-state inference.
export default function FulfilmentPlanDisplay({ plan, allocationPlanning, sources = [], compact = false }) {
  return (<div className={compact ? "w-fit max-w-48 space-y-1" : "space-y-1 min-w-36"}>
                              {plan ? <>
                                {plan.mainStoreQuantity > 0 && <div className="flex items-center justify-between gap-2 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"><span className={compact ? "flex min-w-0 items-center gap-1.5 break-words" : "flex items-center gap-1.5"}><Store className="h-3.5 w-3.5 shrink-0" />Main Store</span><strong className="shrink-0">{plan.mainStoreQuantity}</strong></div>}
                                {plan.eventQuantity > 0 && <div className="flex items-center justify-between gap-2 rounded border border-violet-200 bg-violet-50 px-2 py-1 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300"><span className={compact ? "flex min-w-0 items-center gap-1.5 break-words" : "flex items-center gap-1.5"}><CalendarDays className="h-3.5 w-3.5 shrink-0" />{sources.find(source => String(source._id) === String(allocationPlanning?.designatedSourceAllocation?._id || allocationPlanning?.designatedSourceAllocation))?.eventName || "—"}</span><strong className="shrink-0">{plan.eventQuantity}</strong></div>}
                              </> : "—"}
                            </div>);
}
FulfilmentPlanDisplay.propTypes = { plan: PropTypes.object, allocationPlanning: PropTypes.object, sources: PropTypes.array, compact: PropTypes.bool };
