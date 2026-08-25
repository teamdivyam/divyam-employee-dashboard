/* eslint-disable react/prop-types */
import { Button } from "@components/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * state: useReducer hook with initial value { page, totalRows, state.rowsPerPage }
 */

export default function DataPagination({
  state,
  dispatch,
  onPageChange,
  itemLabel = "results",
  className = "",
}) {
  const totalPages = Math.ceil(state.totalRows / state.rowsPerPage) || 1;
  const goToPage = (page, action) => {
    if (page < 1 || page > totalPages || page === state.page) return;
    if (onPageChange) onPageChange(page);
    else dispatch?.({ type: action });
  };

  return (
    <div className={`flex flex-col gap-2 border-t border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="text-[10px] text-muted-foreground">
        {state.totalRows > 0 ? (
          <>
            Showing{" "}
            <span className="font-medium">
              {(state.page - 1) * state.rowsPerPage + 1}
            </span>{" "}
            -{" "}
            <span className="font-medium">
              {Math.min(state.page * state.rowsPerPage, state.totalRows)}
            </span>{" "}
            of <span className="font-medium">{state.totalRows}</span> {itemLabel}
          </>
        ) : (
          "No data available"
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          disabled={state.page === 1}
          onClick={() => goToPage(state.page - 1, "previous")}
          className="h-7 w-7"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        <span className="grid h-7 min-w-7 place-items-center rounded-md bg-primary px-2 text-[10px] font-medium text-primary-foreground">
          {state.page}
        </span>

        <Button
          variant="outline"
          size="icon"
          disabled={state.totalRows === 0 || state.page === totalPages}
          onClick={() => goToPage(state.page + 1, "next")}
          className="h-7 w-7"
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
