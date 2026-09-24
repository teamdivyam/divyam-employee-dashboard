/* eslint-disable react/prop-types */
import { Eye, IndianRupee, MoreVertical, Pencil } from "lucide-react";

import { Badge } from "@components/components/ui/badge";
import { Button } from "@components/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./EventTable";
import { currency, idOf, shortDate } from "../eventFinance.utils";
import {
  ErrorState,
  LoadingState,
} from "./EventCostSettlementSummary";
import FinancePaginationFooter from "./FinancePaginationFooter";

const settlementStatusClasses = {
  Settled:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  "Partially Paid":
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  Overdue:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
  Pending:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
};

const serviceClasses = {
  Catering: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  Decor: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  Hospitality:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  Transport:
    "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  Accommodation:
    "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
};

function StatusBadge({ status }) {
  return (
    <Badge
      variant="outline"
      className={
        settlementStatusClasses[status] ||
        "border-border bg-muted text-muted-foreground"
      }
    >
      {status || "Pending"}
    </Badge>
  );
}

function SettlementActions({ settlement, onView, onEdit, onRecord, readOnly }) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 border-blue-300 bg-transparent text-blue-700 hover:bg-blue-50 hover:text-blue-800"
        onClick={() => onView(settlement)}
      >
        <Eye className="h-4 w-4" />
        View
      </Button>
      {!readOnly && <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            aria-label={`Actions for ${settlement.vendorName}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEdit(settlement)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit settlement
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={settlement.settlementStatus === "Settled"}
            onSelect={() => onRecord(settlement)}
          >
            <IndianRupee className="mr-2 h-4 w-4" />
            Record payment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>}
    </div>
  );
}

export default function EventVendorSettlementRegister({
  data,
  filters,
  onFiltersChange,
  loading,
  error,
  onRetry,
  onViewSettlement,
  onEditSettlement,
  onRecordPayment,
  readOnly = false,
}) {
  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState error={error} onRetry={onRetry} />;

  return (
    <div className="space-y-3">
      <div className="min-w-0">
          <div className="max-w-full overflow-x-auto">
            <Table headerVariant="section" className="min-w-[1100px] text-xs">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Vendor</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right text-xs font-medium">Final Cost</TableHead>
                  <TableHead className="text-right text-xs font-medium">Paid</TableHead>
                  <TableHead className="text-right text-xs font-medium">Outstanding</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right text-xs font-medium">
                    Settlement Status
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.settlements?.length ? (
                  data.settlements.map((settlement) => (
                    <TableRow key={idOf(settlement)}>
                      <TableCell className="text-xs font-normal text-foreground">
                        {settlement.vendorName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`border-0 ${serviceClasses[settlement.service] || "bg-muted text-foreground"}`}
                        >
                          {settlement.service}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {currency(settlement.finalCost)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {currency(settlement.paidAmount)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {currency(settlement.outstandingAmount)}
                      </TableCell>
                      <TableCell>{shortDate(settlement.dueDate)}</TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        <StatusBadge status={settlement.settlementStatus} />
                      </TableCell>
                      <TableCell>
                        <SettlementActions
                          settlement={settlement}
                          onView={onViewSettlement}
                          onEdit={onEditSettlement}
                          onRecord={onRecordPayment}
                          readOnly={readOnly}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-40 text-center text-muted-foreground"
                    >
                      No vendor settlements match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <FinancePaginationFooter
            pagination={data?.pagination}
            totalKey="totalSettlements"
            onChange={(values) =>
              onFiltersChange({ ...filters, ...values })
            }
          />
      </div>
    </div>
  );
}
