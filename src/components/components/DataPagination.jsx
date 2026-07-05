import React from "react";
import { Button } from "@components/components/ui/button";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

/**
 * state: useReducer hook with initial value { page, totalRows, state.rowsPerPage }
 */

export default function DataPagination({ state, setSearchParams, dispatch }) {
  const totalPages = Math.ceil(state.totalRows / state.rowsPerPage) || 1;

  return (
    <div className="mt-5 flex items-center justify-between px-4 pb-4">
      {/* Left side: info */}
      <div className="text-sm text-muted-foreground">
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
            of <span className="font-medium">{state.totalRows}</span> results
          </>
        ) : (
          "No data available"
        )}
      </div>

      {/* Right side: pagination controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={state.page === 1}
          onClick={() => {
            setSearchParams({ page: state.page })
            dispatch({ type: "previous" })
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="px-3 text-sm">
          Page <span className="font-medium">{state.page}</span> of{" "}
          <span className="font-medium">{totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={state.totalRows === 0 || state.page === totalPages}
          onClick={() => {
            dispatch({ type: "next" });
            setSearchParams({ page: state.page})
          }
          }
        >
          <ArrowRight className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          disabled={state.page === 1 && state.totalRows === 0}
          onClick={() => dispatch({ type: "reset" })}
          className="ml-2"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>
    </div>
  );
}
