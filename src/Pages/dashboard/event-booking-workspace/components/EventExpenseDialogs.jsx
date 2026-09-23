/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@components/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@components/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@components/components/ui/command";
import { format } from "date-fns";
import AdminService from "../../../../services/event-booking-workspace.service";
import { getEmployees } from "./EventBookingComponents";
import ExpenseFormDialog from "../../ExpenseManagement/components/employee-detail-expense/AddExpenseDialog";
import FormSelectField from "../../ExpenseManagement/components/employee-detail-expense/expense-form/FormSelectField";
import CompactField from "../../ExpenseManagement/components/employee-detail-expense/expense-form/CompactField";

import { Button } from "@components/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/components/ui/dialog";
import { Input } from "@components/components/ui/input";
import { Label } from "@components/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import { numberOf } from "../eventFinance.utils";

const settlementForFundingSource = (fundingSource) => {
  if (fundingSource === "Personal Funds") return "Reimbursement Due";
  if (fundingSource === "Company Advance") return "Advance Adjusted";
  if (fundingSource === "Company Payment") return "Company Paid";
  return "Not Applicable";
};

const sourceValues = {
  "Paid Personally": "Personal Funds",
  "Office Expense Advance": "Company Advance",
  "Paid Directly by Company": "Company Payment",
};

function EmployeeAvatar({ employee }) {
  const photo = employee?.profileImage;
  return <Avatar className="h-6 w-6 shrink-0">
    <AvatarImage src={photo?.smallUrl || photo?.small || photo?.url || (typeof photo === "string" ? photo : undefined)} alt={employee.name} className="object-cover" />
    <AvatarFallback className="text-[9px]">{employee.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</AvatarFallback>
  </Avatar>;
}

export function AddExpenseDialog({ open, onOpenChange, options, saving, onSave, booking }) {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);
  const employeeTriggerRef = useRef(null);
  const employeesQuery = useQuery({
    queryKey: ["event-expense-managers"],
    enabled: open && form.expenseBy === "Employee",
    queryFn: async () => {
      const result = [];
      let page = 1;
      while (true) {
        const { data } = await AdminService.getEventBookingManagers({ page, limit: 100, search: "" });
        const batch = getEmployees(data);
        const fresh = batch.filter((item) => !result.some((entry) => entry._id === item._id));
        result.push(...fresh);
        if (batch.length < 100 || !fresh.length) break;
        page += 1;
      }
      return result;
    },
  });
  const employees = employeesQuery.data || [];
  const selectedEmployee = employees.find((employee) => employee._id === form.employeeId);
  useEffect(() => {
    if (!open) return;
    setForm({ expenseName: "", expenseDate: format(new Date(), "yyyy-MM-dd"), expenseFor: "Event",
      linkedTo: booking?.eventName || "", category: options.categories?.[0] || "",
      paymentSource: "Paid Directly by Company", expenseAmount: "", paidTo: "",
      businessPurpose: "", supportingNote: "", attachments: [], expenseBy: "Company", employeeId: "",
      paymentMode: options.paymentModes?.[0] || "UPI", approvalStatus: "Approved", settlementStatus: "Company Paid", billNumber: "",
    });
    setErrors({});
    setEmployeePickerOpen(false);
    // Preserve entered values when background queries update options or booking.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const update = (key, value) => {
    setErrors((current) => ({ ...current, [key]: undefined }));
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "expenseBy") {
        next.employeeId = "";
        next.paymentSource = "Paid Directly by Company";
      }
      if (["expenseBy", "paymentSource", "approvalStatus"].includes(key)) {
        next.settlementStatus = next.approvalStatus === "Approved" ? settlementForFundingSource(sourceValues[next.paymentSource]) : "Not Applicable";
      }
      return next;
    });
  };
  const submit = async () => {
    if (saving) return;
    const nextErrors = {};
    if (!form.expenseName.trim()) nextErrors.expenseName = "Expense name is required.";
    if (!form.expenseDate) nextErrors.expenseDate = "Expense date is required.";
    if (!form.category) nextErrors.category = "Category is required.";
    if (!Number.isFinite(Number(form.expenseAmount)) || numberOf(form.expenseAmount) <= 0) nextErrors.expenseAmount = "Enter a positive expense amount.";
    const employee = employees.find((item) => item._id === form.employeeId);
    if (form.expenseBy === "Employee" && !employee) nextErrors.employeeId = "Select an employee.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      await onSave({
        expenseTitle: form.expenseName.trim(), date: form.expenseDate, category: form.category,
        amount: numberOf(form.expenseAmount), expenseBy: form.expenseBy,
        employeeId: form.expenseBy === "Employee" ? form.employeeId : undefined,
        paidByName: form.expenseBy === "Employee" ? employee.name : "Company",
        paidTo: form.paidTo.trim(), fundingSource: sourceValues[form.paymentSource],
        expenseFor: form.expenseFor, linkedTo: form.linkedTo.trim(), businessPurpose: form.businessPurpose.trim(),
        notes: form.supportingNote.trim(), paymentMode: form.paymentMode, approvalStatus: form.approvalStatus,
        settlementStatus: form.settlementStatus, billNumber: form.billNumber.trim(), billReceipt: form.attachments[0] || null,
      });
      onOpenChange(false);
    } catch { /* Parent mutation displays the error toast. */ }
  };
  if (!form.attachments) return null;
  return <ExpenseFormDialog
    open={open} onOpenChange={(value) => !saving && onOpenChange(value)}
    profile={{ name: booking?.customer?.name || booking?.clientName || "Client", detail: [booking?.customer?.phone, booking?.eventName].filter(Boolean).join(" ? ") || "Client" }}
    form={form} errors={errors} availableAdvance={null} onFieldChange={update} onFieldBlur={() => {}}
    categoryOptions={options.categories || []}
    paymentSourceOptions={form.expenseBy === "Company" ? ["Paid Directly by Company"] : Object.keys(sourceValues)}
    attachmentTypes={["image/*", "application/pdf"]} attachmentHint="One PDF or image, up to the server upload limit."
    onAddFiles={(files) => {
      const file = files[0];
      if (file && !(file.type.startsWith("image/") || file.type === "application/pdf")) {
        setErrors((current) => ({ ...current, attachments: "Choose an image or PDF." }));
        return;
      }
      update("attachments", file ? [file] : []);
    }}
    onRemoveFile={() => update("attachments", [])} onSubmit={submit} submitting={saving} allowSubmit showDraft={false}
    additionalFields={<>
      <FormSelectField label="Expense By" required value={form.expenseBy} options={["Company", "Employee"]} onValueChange={(value) => update("expenseBy", value)} />
      {form.expenseBy === "Employee" && <CompactField label="Employee" required error={errors.employeeId}>
        <Popover open={employeePickerOpen} onOpenChange={setEmployeePickerOpen}>
          <PopoverTrigger asChild>
            <Button ref={employeeTriggerRef} type="button" variant="outline" role="combobox" aria-label="Employee" aria-expanded={employeePickerOpen} disabled={saving || employeesQuery.isPending || employeesQuery.isError} className="h-8 w-full justify-between gap-2 px-2 text-[11px] font-normal">
              {selectedEmployee ? <span className="flex min-w-0 items-center gap-2"><EmployeeAvatar employee={selectedEmployee} /><span className="truncate">{selectedEmployee.name}</span></span> : <span>{employeesQuery.isPending ? "Loading employees..." : "Select employee"}</span>}
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent container={employeeTriggerRef.current?.closest('[role="dialog"]')} align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
            <Command filter={(_value, search, keywords) => keywords.join(" ").toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0}>
              <CommandInput aria-label="Search employees" placeholder="Search by name or employee code..." className="text-xs" />
              <CommandList className="max-h-56 overscroll-contain">
                <CommandEmpty>No employees found.</CommandEmpty>
                <CommandGroup>{employees.map((employee) => <CommandItem key={employee._id} value={employee._id} keywords={[employee.name, employee.employeeCode || ""]} onSelect={() => { update("employeeId", employee._id); setEmployeePickerOpen(false); }} className="text-xs">
                  <EmployeeAvatar employee={employee} />
                  <span className="min-w-0 flex-1"><span className="block truncate">{employee.name}</span>{employee.employeeCode && <span className="block text-[10px] text-muted-foreground">{employee.employeeCode}</span>}</span>
                  {form.employeeId === employee._id && <Check aria-hidden="true" className="h-4 w-4 text-primary" />}
                </CommandItem>)}</CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {employeesQuery.isError ? <Button type="button" variant="link" className="h-auto p-0 text-xs text-destructive" onClick={() => employeesQuery.refetch()}>Unable to load employees. Retry</Button> : !employeesQuery.isPending && !employees.length && <p className="text-[11px] text-muted-foreground">No employees available.</p>}
      </CompactField>}
      <FormSelectField label="Payment Mode" value={form.paymentMode} options={options.paymentModes?.length ? options.paymentModes : ["UPI"]} onValueChange={(value) => update("paymentMode", value)} />
      <CompactField label="Bill Number"><Input aria-label="Bill Number" className="h-8 text-[11px]" value={form.billNumber} onChange={(event) => update("billNumber", event.target.value)} /></CompactField>
      <FormSelectField label="Approval Status" value={form.approvalStatus} options={options.approvalStatuses || ["Approved", "Pending", "Rejected"]} onValueChange={(value) => update("approvalStatus", value)} />
      <CompactField label="Settlement"><Select value={form.settlementStatus} disabled={form.approvalStatus !== "Approved"} onValueChange={(value) => update("settlementStatus", value)}><SelectTrigger aria-label="Settlement" className="h-8 text-[11px]"><SelectValue /></SelectTrigger><SelectContent>{(options.settlementStatuses || ["Company Paid", "Reimbursement Due", "Advance Adjusted", "Not Applicable"]).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></CompactField>
    </>}
  />;
}

export function MoreExpenseFiltersDialog({
  open,
  onOpenChange,
  filters,
  options,
  onApply,
}) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [filters, open]);

  const update = (key, value) =>
    setDraft((state) => ({ ...state, [key]: value }));
  const clear = () =>
    setDraft((state) => ({
      ...state,
      fundingSource: "all",
      settlementStatus: "all",
      proofStatus: "all",
    }));

  const apply = () => {
    onApply({
      fundingSource: draft.fundingSource,
      settlementStatus: draft.settlementStatus,
      proofStatus: draft.proofStatus,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>More Expense Filters</DialogTitle>
          <DialogDescription>
            Narrow expenses by how they were funded, settled, or documented.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Funding Source</Label>
            <Select
              value={draft.fundingSource}
              onValueChange={(value) => update("fundingSource", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Funding Sources</SelectItem>
                {(options.fundingSources || []).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Settlement</Label>
            <Select
              value={draft.settlementStatus}
              onValueChange={(value) => update("settlementStatus", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Settlements</SelectItem>
                {(options.settlementStatuses || [])
                  .filter((value) => value !== "Not Applicable")
                  .map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Proof</Label>
            <Select
              value={draft.proofStatus}
              onValueChange={(value) => update("proofStatus", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Proof Status</SelectItem>
                {(options.proofStatuses || []).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={clear}>
            Clear
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="custom" onClick={apply}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
