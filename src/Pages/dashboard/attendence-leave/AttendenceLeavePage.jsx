import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import EmployeeService from "@/services/employee.service";
import {
  AttendanceGuidelines,
  AttendanceMetrics,
  emptyCheckInForm,
  emptyLeaveForm,
  EventDutyTable,
  LeaveBalancePanel,
  LeaveRequestForm,
  LeaveRequestsTable,
  MonthlySummary,
  PageHeader,
  TodayAttendanceCard,
} from "./components/AttendanceLeaveComponents";

export default function AttendenceLeavePage() {
  const queryClient = useQueryClient();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [leaveForm, setLeaveForm] = useState(emptyLeaveForm);
  const [checkInForm, setCheckInForm] = useState(emptyCheckInForm);
  const [checkOutNotes, setCheckOutNotes] = useState("Completed work for today");
  const [showBalance, setShowBalance] = useState(false);

  const dashboardQuery = useQuery({
    queryKey: ["attendance-leave-dashboard", year, month],
    queryFn: async () => {
      const response = await EmployeeService.getAttendanceLeaveDashboard({ year, month });
      return response.data.dashboard;
    },
  });

  const leaveRequestsQuery = useQuery({
    queryKey: ["attendance-leave-requests"],
    queryFn: async () => {
      const response = await EmployeeService.getLeaveRequests({ page: 1, limit: 25 });
      return response.data;
    },
    placeholderData: (previous) => previous,
  });

  const leaveBalanceQuery = useQuery({
    queryKey: ["attendance-leave-balance", year],
    queryFn: async () => {
      const response = await EmployeeService.getLeaveBalance({ year });
      return response.data.leaveBalance || [];
    },
    enabled: showBalance,
  });

  const dashboard = dashboardQuery.data || {};
  const meta = dashboard.meta || leaveRequestsQuery.data?.meta || {};
  const leaveRequests = leaveRequestsQuery.data?.leaveRequests || dashboard.myLeaveRequests || [];
  const monthlySummary = dashboard.monthlySummary || {};

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["attendance-leave-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["attendance-leave-requests"] });
    queryClient.invalidateQueries({ queryKey: ["attendance-leave-balance"] });
  };

  const checkInMutation = useMutation({
    mutationFn: () => EmployeeService.checkInAttendance(normalizeCheckInPayload(checkInForm)),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Checked in successfully");
      invalidate();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to check in"),
  });

  const checkOutMutation = useMutation({
    mutationFn: () => EmployeeService.checkOutAttendance({ notes: checkOutNotes }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Checked out successfully");
      invalidate();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to check out"),
  });

  const submitLeaveMutation = useMutation({
    mutationFn: () => EmployeeService.submitLeaveRequest({ formData: buildLeaveFormData(leaveForm) }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Leave request submitted");
      setLeaveForm(emptyLeaveForm);
      invalidate();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to submit leave request"),
  });

  const visibleBalance = useMemo(() => leaveBalanceQuery.data || [], [leaveBalanceQuery.data]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 p-4 text-slate-950 md:p-6">
      <div className="mx-auto max-w-[1700px] space-y-4">
        <PageHeader />
        <AttendanceMetrics dashboard={dashboard} />

        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          <div className="min-w-0 space-y-4">
            <TodayAttendanceCard
              dashboard={dashboard}
              checkInForm={checkInForm}
              setCheckInForm={setCheckInForm}
              checkOutNotes={checkOutNotes}
              setCheckOutNotes={setCheckOutNotes}
              onCheckIn={() => checkInMutation.mutate()}
              onCheckOut={() => checkOutMutation.mutate()}
              checkingIn={checkInMutation.isPending}
              checkingOut={checkOutMutation.isPending}
            />

            <LeaveRequestsTable
              requests={leaveRequests}
              loading={leaveRequestsQuery.isFetching}
              onView={(leave) => toast.info(leave.reason || "Leave request selected")}
            />

            <EventDutyTable duties={dashboard.eventDutyAttendance || []} />
          </div>

          <div className="min-w-0 space-y-4">
            <LeaveRequestForm
              form={leaveForm}
              setForm={setLeaveForm}
              meta={meta}
              loading={submitLeaveMutation.isPending}
              onSubmit={() => submitLeaveMutation.mutate()}
              onBalance={() => setShowBalance((current) => !current)}
            />

            {showBalance ? <LeaveBalancePanel balances={visibleBalance} /> : null}
            <MonthlySummary summary={monthlySummary} />
            <AttendanceGuidelines />
          </div>
        </div>
      </div>
    </div>
  );
}

function buildLeaveFormData(form) {
  const formData = new FormData();
  formData.append("leaveType", form.leaveType);
  formData.append("fromDate", form.fromDate);
  formData.append("toDate", form.toDate);
  formData.append("duration", form.duration);
  formData.append("reason", form.reason);
  if (form.attachment) {
    formData.append("attachment", form.attachment);
  }
  return formData;
}

function normalizeCheckInPayload(form) {
  return {
    ...form,
    latitude: form.latitude === "" ? undefined : Number(form.latitude),
    longitude: form.longitude === "" ? undefined : Number(form.longitude),
  };
}
