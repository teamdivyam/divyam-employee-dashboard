/* eslint-disable react/prop-types */
import EventMetricCards from "./EventMetricCards";
import {
  Banknote,
  CircleAlert,
  Coins,
  FileText,
  ReceiptText,
  UsersRound,
} from "lucide-react";

import { Button } from "@components/components/ui/button";
import { Card, CardContent } from "@components/components/ui/card";
import { Skeleton } from "@components/components/ui/skeleton";
import { currency, numberOf } from "../eventFinance.utils";

export function VendorSummary({ summary = {} }) {
  const cards = [
    {
      label: "Total Vendor Cost",
      value: currency(summary.totalVendorCost),
      caption: `${numberOf(summary.totalVendors)} vendors`,
      icon: Coins,
      tone: "text-blue-600 bg-blue-500/10 dark:text-blue-300",
    },
    {
      label: "Paid",
      value: currency(summary.paidAmount),
      caption: `${numberOf(summary.paidPercentage)}%`,
      icon: Banknote,
      tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-300",
    },
    {
      label: "Outstanding",
      value: currency(summary.outstandingAmount),
      caption: `${numberOf(summary.outstandingPercentage)}%`,
      icon: ReceiptText,
      tone: "text-slate-700 bg-slate-500/10 dark:text-slate-300",
    },
    {
      label: "Overdue",
      value: currency(summary.overdueAmount),
      caption: `${numberOf(summary.overduePercentage)}%`,
      icon: CircleAlert,
      tone: "text-red-600 bg-red-500/10 dark:text-red-300",
    },
    {
      label: "Settled Vendors",
      value: `${numberOf(summary.settledVendors)} / ${numberOf(summary.totalVendors)}`,
      caption: "Fully settled",
      icon: UsersRound,
      tone: "text-violet-600 bg-violet-500/10 dark:text-violet-300",
    },
  ];

  return <EventMetricCards items={cards} />;
}

export function ExpenseSummary({ summary = {} }) {
  const cards = [
    {
      label: "Approved Expenses",
      value: currency(summary.approvedExpenses),
      icon: Coins,
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    },
    {
      label: "Pending Approval",
      value: currency(summary.pendingApproval),
      icon: ReceiptText,
      tone: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    },
    {
      label: "Reimbursement Due",
      value: currency(summary.reimbursementDue),
      icon: UsersRound,
      tone: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
      info: true,
    },
    {
      label: "Missing Proof",
      value: numberOf(summary.missingProof),
      icon: FileText,
      tone: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    },
  ];

  return <EventMetricCards items={cards} />;
}

export function LoadingState() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <Card>
      <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
        <CircleAlert className="h-8 w-8 text-destructive" />
        <div>
          <p className="font-semibold">
            Unable to load cost and settlement data
          </p>
          <p className="text-sm text-muted-foreground">
            {error?.response?.data?.message ||
              "Please check the connection and try again."}
          </p>
        </div>
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
}
