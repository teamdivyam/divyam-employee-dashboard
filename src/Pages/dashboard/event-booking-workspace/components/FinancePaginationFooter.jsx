/* eslint-disable react/prop-types */
import { Button } from "@components/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import { numberOf } from "../eventFinance.utils";

export default function FinancePaginationFooter({
  pagination,
  totalKey = "totalRecords",
  onChange,
  compact = false,
}) {
  const total = numberOf(pagination?.[totalKey]);
  const page = numberOf(pagination?.page) || 1;
  const limit = numberOf(pagination?.limit) || 10;
  const totalPages = numberOf(pagination?.totalPages);
  return (
    <div
      className={`flex flex-col border-t px-4 sm:flex-row sm:items-center sm:justify-end ${
        compact ? "gap-2 py-2" : "gap-3 py-3"
      }`}
    >
      <span className="text-xs text-muted-foreground">
        {total
          ? `${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total}`
          : "0 of 0"}
      </span>
      <Select
        value={String(limit)}
        onValueChange={(value) => onChange({ page: 1, limit: Number(value) })}
      >
        <SelectTrigger className={`${compact ? "h-8" : "h-9"} w-24`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[10, 25, 50].map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size} rows
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-1">
        <Button
          size="icon"
          variant="outline"
          className={compact ? "h-8 w-8" : "h-9 w-9"}
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange({ page: page - 1 })}
        >
          ‹
        </Button>
        <Button
          size="icon"
          variant="outline"
          className={compact ? "h-8 w-8" : "h-9 w-9"}
          aria-label="Next page"
          disabled={!totalPages || page >= totalPages}
          onClick={() => onChange({ page: page + 1 })}
        >
          ›
        </Button>
      </div>
    </div>
  );
}
