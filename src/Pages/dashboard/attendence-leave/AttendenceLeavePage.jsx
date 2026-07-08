/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AttendanceTable,
  HeaderActions,
  Panel,
  RightRail,
  SectionTitle,
  SimpleList,
  StatusPill,
  SummaryCard,
  TodayPanel,
  TopTabs,
  displayText,
  formatShortDate,
  formatTime,
  resolvePresenceStatus,
  statusTone,
  summaryIcons,
} from "./components/AttendanceLeaveComponents";
import EmployeeService from "@/services/employee.service";
import { BriefcaseBusiness, FilePenLine, FileText, Umbrella } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/components/ui/dialog";

const todayIso = new Date().toISOString().slice(0, 10);
const now = new Date();

const defaultLeaveForm = {
  leaveType: "Casual Leave",
  fromDate: todayIso,
  toDate: todayIso,
  duration: "Full Day",
  reason: "",
  attachment: null,
};

const allowedLeaveTypes = ["Casual Leave", "Emergency Leave"];
const leaveDurations = ["Full Day", "Half Day"];
const correctionTypes = ["Check_In", "Check_Out", "Status", "Working_Hours", "Location", "Other"];
const correctionStatuses = ["Present", "Absent", "Late", "On_Leave", "Half_Day"];

const defaultCorrectionForm = {
  attendanceId: "",
  correctionType: "Check_In",
  requestedCheckInTime: "",
  requestedCheckOutTime: "",
  requestedStatus: "Present",
  reason: "",
  attachment: null,
};

function getFiscalYearStartYear(dateValue) {
  const date = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().getFullYear();
  return date.getMonth() + 1 >= 4 ? date.getFullYear() : date.getFullYear() - 1;
}

function formatFiscalYearLabel(startYear) {
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

function getLeaveDaysEstimate(fromDate, toDate, duration) {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  const days = Math.floor((end - start) / 86400000) + 1;
  return duration === "Half Day" ? days * 0.5 : days;
}

function toDatetimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function getCurrentLocationPayload() {
  if (!navigator.geolocation) {
    return Promise.reject(new Error("Location is not supported by this browser"));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const latitude = Number(coords.latitude.toFixed(7));
        const longitude = Number(coords.longitude.toFixed(7));

        resolve({
          locationType: "Office",
          locationName: "Office",
          locationAddress: `${latitude}, ${longitude}`,
          latitude,
          longitude,
          location: {
            latitude,
            longitude,
            accuracy: coords.accuracy,
            capturedAt: new Date().toISOString(),
          },
        });
      },
      (error) => reject(new Error(error.message || "Unable to capture location")),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  });
}

export default function AttendenceLeavePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("today");
  const [filters] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const [leaveForm, setLeaveForm] = useState(defaultLeaveForm);
  const [correctionForm, setCorrectionForm] = useState(defaultCorrectionForm);
  const [attendanceAction, setAttendanceAction] = useState(null);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isCorrectionDialogOpen, setIsCorrectionDialogOpen] = useState(false);
  const [recentCorrectionRequest, setRecentCorrectionRequest] = useState(null);
  const leaveFiscalYearStartYear = useMemo(() => getFiscalYearStartYear(leaveForm.fromDate), [leaveForm.fromDate]);

  const historyFilters = useMemo(
    () => ({
      page: 1,
      limit: 25,
      status: "All",
      startDate: new Date(filters.year, filters.month - 1, 1).toISOString().slice(0, 10),
      endDate: new Date(filters.year, filters.month, 0).toISOString().slice(0, 10),
    }),
    [filters.month, filters.year]
  );

  const dashboardQuery = useQuery({
    queryKey: ["attendance-leave-dashboard", filters.year, filters.month],
    queryFn: async () => {
      const response = await EmployeeService.getAttendanceLeaveDashboard(filters);
      return response.data?.dashboard || {};
    },
  });

  const historyQuery = useQuery({
    queryKey: ["attendance-leave-history", historyFilters],
    queryFn: async () => {
      const response = await EmployeeService.getAttendanceHistory(historyFilters);
      return response.data || {};
    },
  });

  const leaveBalanceQuery = useQuery({
    queryKey: ["attendance-leave-balance", leaveFiscalYearStartYear],
    queryFn: async () => {
      const response = await EmployeeService.getLeaveBalance({ fiscalYearStartYear: leaveFiscalYearStartYear });
      return response.data || {};
    },
  });

  const leaveRequestsQuery = useQuery({
    queryKey: ["attendance-leave-requests"],
    queryFn: async () => {
      const response = await EmployeeService.getLeaveRequests({
        page: 1,
        limit: 25,
        leaveStatus: "All",
        leaveType: "All",
      });
      return response.data || {};
    },
  });

  const actionMutation = useMutation({
    mutationFn: async (action) => {
      const locationPayload = await getCurrentLocationPayload();

      if (action === "checkIn") {
        return EmployeeService.checkInAttendance({
          status: "Present",
          attendanceSource: "Web Portal",
          notes: "Checked in from attendance dashboard",
          ...locationPayload,
        });
      }

      return EmployeeService.checkOutAttendance({
        attendanceSource: "Web Portal",
        notes: "Checked out from attendance dashboard",
        ...locationPayload,
      });
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Attendance updated");
      const attendance = response.data?.attendance || {};
      setAttendanceAction(attendance.checkInTime && attendance.checkOutTime ? "completed" : "checkOut");
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-history"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-balance"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || "Unable to update attendance"),
  });

  const leaveMutation = useMutation({
    mutationFn: () => {
      if (!allowedLeaveTypes.includes(leaveForm.leaveType)) {
        throw new Error("Only Casual Leave and Emergency Leave can be applied from leave balance!");
      }

      const formData = new FormData();
      formData.append("leaveType", leaveForm.leaveType);
      formData.append("fromDate", leaveForm.fromDate);
      formData.append("toDate", leaveForm.toDate);
      formData.append("duration", leaveForm.duration);
      formData.append("reason", leaveForm.reason);
      if (leaveForm.attachment) formData.append("attachment", leaveForm.attachment);

      return EmployeeService.submitLeaveRequest({ formData });
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Leave request submitted");
      setLeaveForm(defaultLeaveForm);
      setIsLeaveDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-balance"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || "Unable to submit leave request"),
  });

  const cancelLeaveMutation = useMutation({
    mutationFn: (leaveId) =>
      EmployeeService.cancelLeaveRequest({
        leaveId,
        reason: "Cancelled by employee",
      }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Leave request cancelled");
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-balance"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to cancel leave request"),
  });

  const correctionMutation = useMutation({
    mutationFn: () => {
      const payload = {
        correctionType: correctionForm.correctionType,
        requestedStatus: correctionForm.requestedStatus,
        reason: correctionForm.reason.trim(),
      };

      if (correctionForm.requestedCheckInTime) {
        payload.requestedCheckInTime = new Date(correctionForm.requestedCheckInTime).toISOString();
      }
      if (correctionForm.requestedCheckOutTime) {
        payload.requestedCheckOutTime = new Date(correctionForm.requestedCheckOutTime).toISOString();
      }

      if (correctionForm.attachment) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => formData.append(key, value));
        formData.append("attachment", correctionForm.attachment);
        return EmployeeService.submitAttendanceCorrection({
          attendanceId: correctionForm.attendanceId,
          data: formData,
        });
      }

      return EmployeeService.submitAttendanceCorrection({
        attendanceId: correctionForm.attendanceId,
        data: payload,
      });
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Correction request submitted");
      setRecentCorrectionRequest(response.data?.correctionRequest || null);
      setCorrectionForm(defaultCorrectionForm);
      setIsCorrectionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-history"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to submit correction request"),
  });

  const data = dashboardQuery.data || {};
  const todayAttendance = data.todayAttendance || {};
  const normalizedTodayAttendance = {
    ...todayAttendance,
    status: data.todayStatus || todayAttendance.status,
    checkInTime: data.checkInTime || todayAttendance.checkInTime,
    checkOutTime: data.checkOutTime || todayAttendance.checkOutTime,
    workingMinutes: data.workingMinutes || todayAttendance.workingMinutes,
    workingHours: data.workingHours || todayAttendance.workingHours,
  };
  const resolvedTodayStatus = resolvePresenceStatus({
    ...normalizedTodayAttendance,
  });
  const hasCheckedIn = Boolean(normalizedTodayAttendance.checkInTime);
  const hasCheckedOut = Boolean(normalizedTodayAttendance.checkOutTime);
  const visibleAttendanceAction = attendanceAction || (hasCheckedIn ? (hasCheckedOut ? "completed" : "checkOut") : "checkIn");
  const todaysDuty = Array.isArray(data.eventDutyAttendance)
    ? data.eventDutyAttendance[0] || {}
    : data.eventDutyAttendance || {};
  const monthlyRows = historyQuery.data?.attendance?.length ? historyQuery.data.attendance : [];
  const correctionAttendanceRows = monthlyRows.length
    ? monthlyRows
    : normalizedTodayAttendance._id
      ? [normalizedTodayAttendance]
      : [];
  const dashboardCorrections = data.recentCorrectionRequests || data.correctionRequests || data.myCorrectionRequests || [];
  const recentCorrections = recentCorrectionRequest
    ? [recentCorrectionRequest]
    : Array.isArray(dashboardCorrections)
      ? dashboardCorrections.slice(0, 1)
      : dashboardCorrections
        ? [dashboardCorrections]
        : [];
  const leaveRequests = leaveRequestsQuery.data?.leaveRequests?.length
    ? leaveRequestsQuery.data.leaveRequests
    : data.myLeaveRequests || [];
  const leaveBalanceResponse = leaveBalanceQuery.data || {};
  const leaveBalance = leaveBalanceResponse.leaveBalance || [];
  const selectedLeaveBalance = leaveBalance.find((item) => item.leaveType === leaveForm.leaveType);
  const estimatedLeaveDays = getLeaveDaysEstimate(leaveForm.fromDate, leaveForm.toDate, leaveForm.duration);
  const monthLabel = useMemo(
    () => new Date(filters.year, filters.month - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    [filters.month, filters.year]
  );
  const summary = data.monthlySummary || {};

  const submitLeave = (event) => {
    event.preventDefault();
    if (!leaveForm.leaveType || !leaveForm.fromDate || !leaveForm.toDate || !leaveForm.reason.trim()) {
      toast.error("Leave type, from date, to date and reason are required!");
      return;
    }
    if (!leaveDurations.includes(leaveForm.duration)) {
      toast.error("Invalid leave duration!");
      return;
    }
    if (estimatedLeaveDays === null) {
      toast.error("To date cannot be before from date!");
      return;
    }
    leaveMutation.mutate();
  };

  const submitCorrection = (event) => {
    event.preventDefault();

    if (!correctionForm.attendanceId) {
      toast.error("Attendance record is required!");
      return;
    }
    if (!correctionTypes.includes(correctionForm.correctionType)) {
      toast.error("Invalid correction type!");
      return;
    }
    if (!correctionStatuses.includes(correctionForm.requestedStatus)) {
      toast.error("Invalid requested status!");
      return;
    }
    if (!correctionForm.reason.trim()) {
      toast.error("Reason is required!");
      return;
    }

    correctionMutation.mutate();
  };

  const submitAttendanceAction = (action) => {
    if (visibleAttendanceAction === "completed") {
      toast.info("Today's check-in and check-out are already completed");
      return;
    }

    if (action !== visibleAttendanceAction) {
      toast.error("This attendance action is not available right now");
      return;
    }

    actionMutation.mutate(action);
  };

  const cardConfig = [
    {
      label: "Today Status",
      value: resolvedTodayStatus,
      sub: normalizedTodayAttendance.checkOutTime ? "Checked Out" : normalizedTodayAttendance.checkInTime ? "Checked In" : "Not checked in",
      icon: summaryIcons.status,
      tone: statusTone(resolvedTodayStatus),
    },
    {
      label: "Check-In Time",
      value: formatTime(normalizedTodayAttendance.checkInTime),
      sub: "Today",
      icon: summaryIcons.checkIn,
      tone: "blue",
    },
    {
      label: "Working Hours",
      value: displayText(normalizedTodayAttendance.workingHours),
      sub: normalizedTodayAttendance.workingMinutes === null || normalizedTodayAttendance.workingMinutes === undefined ? "--" : `${normalizedTodayAttendance.workingMinutes} Minutes`,
      icon: summaryIcons.hours,
      tone: "orange",
    },
    {
      label: "This Month Present",
      value: summary.presentDays === null || summary.presentDays === undefined ? "--" : `${summary.presentDays} Days`,
      sub: summary.totalDays === null || summary.totalDays === undefined ? "--" : `Out of ${summary.totalDays} Days`,
      icon: summaryIcons.present,
      tone: "green",
    },
    {
      label: "Late / Absent",
      value: summary.lateDays === null || summary.lateDays === undefined ? "--" : `${summary.lateDays} Late`,
      sub: summary.absentDays === null || summary.absentDays === undefined ? "--" : `${summary.absentDays} Absent`,
      icon: summaryIcons.late,
      tone: "red",
    },
    {
      label: "Leave Balance",
      value: leaveBalance[0]?.balance === null || leaveBalance[0]?.balance === undefined ? "--" : `${leaveBalance[0].balance} Days`,
      sub: `${displayText(leaveBalance[0]?.leaveType, "Leave")} Left`,
      icon: summaryIcons.leave,
      tone: "purple",
    },
  ];

  return (
    <div className="atl-page min-h-screen px-4 py-4">
      <header className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div>
          <h1 className="atl-title text-2xl font-semibold">Attendance & Leave</h1>
          <p className="atl-muted mt-1 text-sm">Track your attendance, working hours, leave balance, event duty and requests.</p>
        </div>
        <HeaderActions
          isBusy={actionMutation.isPending}
          visibleAttendanceAction={visibleAttendanceAction}
          onCheckIn={() => submitAttendanceAction("checkIn")}
          onCheckOut={() => submitAttendanceAction("checkOut")}
          onApplyLeave={() => {
            setActiveTab("leaves");
            setIsLeaveDialogOpen(true);
          }}
          onRequestCorrection={() => {
            setActiveTab("corrections");
            setIsCorrectionDialogOpen(true);
          }}
          setActiveTab={setActiveTab}
        />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {cardConfig.map((card) => <SummaryCard key={card.label} {...card} />)}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_330px]">
        <main className="space-y-4">
          <TopTabs activeTab={activeTab} onChange={setActiveTab} />
          {dashboardQuery.isLoading ? (
            <div className="atl-card p-8 text-center text-sm text-muted-foreground">Loading attendance details...</div>
          ) : (
            <>
              {activeTab === "today" && (
                <>
                  <TodayPanel attendance={normalizedTodayAttendance} duty={todaysDuty} />
                  <AttendanceTable rows={monthlyRows} monthLabel={monthLabel} />
                </>
              )}
              {activeTab === "monthly" && <AttendanceTable rows={monthlyRows} monthLabel={monthLabel} />}
              {activeTab === "leaves" && (
                  <LeaveRequestsList
                    rows={leaveRequests}
                    cancelLeaveMutation={cancelLeaveMutation}
                    onApplyLeave={() => setIsLeaveDialogOpen(true)}
                  />
              )}
              {activeTab === "duty" && (
                <SimpleList
                  title="Event Duty"
                  icon={BriefcaseBusiness}
                  rows={[todaysDuty].filter((item) => Object.keys(item || {}).length)}
                  emptyText="No event duty assigned for today."
                  renderRow={(duty, index) => (
                    <div key={duty._id || index} className="grid gap-2 p-4 text-xs md:grid-cols-2">
                      <p><b className="font-medium">Duty Type:</b> {displayText(duty.dutyType)}</p>
                      <p><b className="font-medium">Department:</b> {displayText(duty.department)}</p>
                      <p><b className="font-medium">Manager:</b> {displayText(duty.reportingManager)}</p>
                      <p><b className="font-medium">Remarks:</b> {displayText(duty.remarks)}</p>
                    </div>
                  )}
                />
              )}
              {activeTab === "corrections" && (
                <RecentCorrectionsList
                  rows={recentCorrections}
                  onRequestCorrection={() => setIsCorrectionDialogOpen(true)}
                />
              )}
              {activeTab === "rules" && (
                <SimpleList
                  title="Attendance Rules"
                  icon={FileText}
                  rows={[]}
                  emptyText="No attendance rules available."
                  renderRow={() => null}
                />
              )}
            </>
          )}
        </main>

        <RightRail
          health={{
            presentDays: summary.presentDays,
            lateCount: summary.lateDays,
            absentDays: summary.absentDays,
            paidLeavesUsed: data.leavesTakenThisMonth,
            correctionsPending: data.pendingRequests,
          }}
          quickActions={data.quickActions}
          alerts={data.alerts}
          note={data.note}
          setActiveTab={setActiveTab}
        />
      </div>
      <LeaveRequestDialog
        open={isLeaveDialogOpen}
        onOpenChange={setIsLeaveDialogOpen}
        form={leaveForm}
        setForm={setLeaveForm}
        leaveTypes={allowedLeaveTypes}
        leaveDurations={leaveDurations}
        leaveBalance={leaveBalance}
        fiscalYear={leaveBalanceResponse.fiscalYear}
        selectedLeaveBalance={selectedLeaveBalance}
        estimatedLeaveDays={estimatedLeaveDays}
        fiscalYearStartYear={leaveFiscalYearStartYear}
        onSubmit={submitLeave}
        isPending={leaveMutation.isPending}
      />
      <CorrectionRequestDialog
        open={isCorrectionDialogOpen}
        onOpenChange={setIsCorrectionDialogOpen}
        form={correctionForm}
        setForm={setCorrectionForm}
        attendanceRows={correctionAttendanceRows}
        onSubmit={submitCorrection}
        isPending={correctionMutation.isPending}
      />
    </div>
  );
}

function LeaveRequestDialog({ open, onOpenChange, ...props }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="atl-card max-h-[88vh] overflow-y-auto p-0 sm:max-w-[760px]">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Umbrella className="h-4 w-4 text-[#f97316]" />
            Apply Leave
          </DialogTitle>
        </DialogHeader>
        <LeaveRequestForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

function CorrectionRequestDialog({ open, onOpenChange, ...props }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="atl-card max-h-[88vh] overflow-y-auto p-0 sm:max-w-[720px]">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <FilePenLine className="h-4 w-4 text-[#f97316]" />
            Request Attendance Correction
          </DialogTitle>
        </DialogHeader>
        <CorrectionRequestForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

function CorrectionRequestForm({ form, setForm, attendanceRows, onSubmit, isPending }) {
  const input = "atl-input rounded-md border px-3 py-2 text-xs";
  const selectedAttendance = attendanceRows.find((attendance) => (attendance._id || attendance.id) === form.attendanceId);

  const handleAttendanceChange = (attendanceId) => {
    const attendance = attendanceRows.find((row) => (row._id || row.id) === attendanceId);
    setForm({
      ...form,
      attendanceId,
      requestedCheckInTime: toDatetimeLocal(attendance?.checkInTime),
      requestedCheckOutTime: toDatetimeLocal(attendance?.checkOutTime),
      requestedStatus: attendance?.status || "Present",
    });
  };

  return (
      <form onSubmit={onSubmit} className="grid gap-3 p-4 md:grid-cols-2">
        <label className="grid gap-1 text-xs md:col-span-2">
          <span className="font-medium text-foreground">Attendance Record</span>
          <select className={input} value={form.attendanceId} onChange={(event) => handleAttendanceChange(event.target.value)} required>
            <option value="">Select attendance record</option>
            {attendanceRows.map((attendance) => {
              const attendanceId = attendance._id || attendance.id;
              return (
                <option key={attendanceId} value={attendanceId}>
                  {formatShortDate(attendance.attendanceDate || attendance.date)} - {formatTime(attendance.checkInTime)} / {formatTime(attendance.checkOutTime)}
                </option>
              );
            })}
          </select>
        </label>
        <label className="grid gap-1 text-xs">
          <span className="font-medium text-foreground">Correction Type</span>
          <select className={input} value={form.correctionType} onChange={(event) => setForm({ ...form, correctionType: event.target.value })}>
            {correctionTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs">
          <span className="font-medium text-foreground">Requested Status</span>
          <select className={input} value={form.requestedStatus} onChange={(event) => setForm({ ...form, requestedStatus: event.target.value })}>
            {correctionStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs">
          <span className="font-medium text-foreground">Requested Check In</span>
          <input
            className={input}
            type="datetime-local"
            value={form.requestedCheckInTime}
            onChange={(event) => setForm({ ...form, requestedCheckInTime: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-xs">
          <span className="font-medium text-foreground">Requested Check Out</span>
          <input
            className={input}
            type="datetime-local"
            value={form.requestedCheckOutTime}
            onChange={(event) => setForm({ ...form, requestedCheckOutTime: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-xs md:col-span-2">
          <span className="font-medium text-foreground">Reason</span>
          <textarea
            className={input}
            rows="3"
            placeholder="Explain what needs to be corrected"
            value={form.reason}
            onChange={(event) => setForm({ ...form, reason: event.target.value })}
            required
          />
        </label>
        <label className="grid min-w-0 gap-1 text-xs">
          <span className="font-medium text-foreground">Attachment</span>
          <input className={`${input} w-full min-w-0`} type="file" onChange={(event) => setForm({ ...form, attachment: event.target.files?.[0] || null })} />
        </label>
        <div className="flex items-end">
          <button disabled={isPending || !attendanceRows.length} className="atl-primary w-full rounded-md px-4 py-2 text-xs font-medium disabled:opacity-60">
            {isPending ? "Submitting..." : "Submit Correction"}
          </button>
        </div>
        {!attendanceRows.length && (
          <p className="text-xs text-muted-foreground md:col-span-2">No attendance record is available for correction.</p>
        )}
        {selectedAttendance && (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-xs md:col-span-2">
            <p className="font-medium text-foreground">Selected Attendance</p>
            <p className="mt-1 text-muted-foreground">
              {formatShortDate(selectedAttendance.attendanceDate || selectedAttendance.date)} - {displayText(selectedAttendance.status)} - {displayText(selectedAttendance.workingHours)}
            </p>
          </div>
        )}
      </form>
  );
}

function RecentCorrectionsList({ rows, onRequestCorrection }) {
  return (
    <Panel>
      <SectionTitle
        icon={FilePenLine}
        action={
          <button type="button" onClick={onRequestCorrection} className="atl-primary rounded-md px-3 py-1.5 text-xs font-medium">
            Request Correction
          </button>
        }
      >
        Recent Correction
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {["Date", "Type", "Reason", "Status", "Requested At"].map((header) => (
                <th key={header} className="px-4 py-2 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.length ? rows.map((correction, index) => {
              const correctionStatus = displayText(correction.correctionStatus || correction.status, "Pending");
              return (
                <tr key={correction._id || index} className="border-t border-border align-top">
                  <td className="px-4 py-3">{formatShortDate(correction.attendanceDate || correction.createdAt)}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{displayText(correction.correctionType)}</td>
                  <td className="max-w-[320px] px-4 py-3 text-muted-foreground">{displayText(correction.reason || correction.remarks)}</td>
                  <td className="px-4 py-3"><StatusPill tone={statusTone(correctionStatus)}>{correctionStatus}</StatusPill></td>
                  <td className="px-4 py-3 text-muted-foreground">{formatShortDate(correction.requestedAt || correction.createdAt)}</td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">No recent correction request found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function LeaveRequestForm({
  form,
  setForm,
  leaveTypes,
  leaveDurations,
  leaveBalance,
  fiscalYear,
  selectedLeaveBalance,
  estimatedLeaveDays,
  fiscalYearStartYear,
  onSubmit,
  isPending,
}) {
  const input = "atl-input rounded-md border px-3 py-2 text-xs";
  const fiscalYearLabel = fiscalYear?.fiscalYearLabel || formatFiscalYearLabel(fiscalYearStartYear);

  return (
      <div className="grid gap-4 p-4 lg:grid-cols-[260px_1fr]">
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3 text-xs">
          <div>
            <p className="font-medium text-foreground">Fiscal Year</p>
            <p className="text-muted-foreground">{fiscalYearLabel}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <BalanceStat label="Allotted" value={selectedLeaveBalance?.allotted} />
            <BalanceStat label="Used" value={selectedLeaveBalance?.used} />
            <BalanceStat label="Balance" value={selectedLeaveBalance?.balance} />
          </div>
          <div className="rounded-md border border-border bg-background p-2">
            <p className="font-medium text-foreground">Requested Days</p>
            <p className="text-muted-foreground">{estimatedLeaveDays === null ? "--" : estimatedLeaveDays}</p>
          </div>
          <div className="space-y-2">
            {(leaveBalance || []).map((balance) => (
              <div key={balance.leaveType} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-2 py-1.5">
                <span>{displayText(balance.leaveType)}</span>
                <span className="font-medium text-foreground">{displayText(balance.balance)} left</span>
              </div>
            ))}
            {!leaveBalance?.length && <p className="text-muted-foreground">Leave balance is not configured for this fiscal year.</p>}
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-xs">
            <span className="font-medium text-foreground">Leave Type</span>
            <select className={input} value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>
              {leaveTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs">
            <span className="font-medium text-foreground">Duration</span>
            <select className={input} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}>
              {leaveDurations.map((duration) => <option key={duration}>{duration}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs">
            <span className="font-medium text-foreground">From Date</span>
            <input className={input} type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} required />
          </label>
          <label className="grid gap-1 text-xs">
            <span className="font-medium text-foreground">To Date</span>
            <input className={input} type="date" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} required />
          </label>
          <label className="grid gap-1 text-xs md:col-span-2">
            <span className="font-medium text-foreground">Reason</span>
            <textarea
              className={input}
              rows="3"
              placeholder="Reason for leave"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              required
            />
          </label>
          <label className="grid min-w-0 gap-1 text-xs">
            <span className="font-medium text-foreground">Attachment</span>
            <input className={`${input} w-full min-w-0`} type="file" onChange={(e) => setForm({ ...form, attachment: e.target.files?.[0] || null })} />
          </label>
          <div className="flex min-w-0 items-end">
            <button disabled={isPending} className="atl-primary w-full rounded-md px-4 py-2 text-xs font-medium disabled:opacity-60">
              {isPending ? "Submitting..." : "Submit Leave Request"}
            </button>
          </div>
        </form>
      </div>
  );
}

function BalanceStat({ label, value }) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{displayText(value)}</p>
    </div>
  );
}

function LeaveRequestsList({ rows, cancelLeaveMutation, onApplyLeave }) {
  return (
    <Panel>
      <SectionTitle
        icon={Umbrella}
        action={
          <button type="button" onClick={onApplyLeave} className="atl-primary rounded-md px-3 py-1.5 text-xs font-medium">
            Apply Leave
          </button>
        }
      >
        Leave Requests
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {["Leave Type", "From-To", "Reason", "Status", "Action"].map((header) => (
                <th key={header} className="px-4 py-2 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.length ? rows.map((leave, index) => {
              const leaveId = leave._id || leave.id;
              const leaveStatus = displayText(leave.leaveStatus || leave.status, "Pending");
              const leaveDays = displayText(leave.leaveDays || leave.totalDays || leave.days);

              return (
                <tr key={leaveId || index} className="border-t border-border align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{displayText(leave.leaveType || leave.type, "Leave Request")}</p>
                    <p className="mt-1 text-muted-foreground">{leaveDays === "--" ? leaveDays : `${leaveDays} Days`}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatShortDate(leave.fromDate || leave.startDate)} - {formatShortDate(leave.toDate || leave.endDate)}
                  </td>
                  <td className="max-w-[260px] px-4 py-3 text-muted-foreground">{displayText(leave.reason, "--")}</td>
                  <td className="px-4 py-3"><StatusPill tone={statusTone(leaveStatus)}>{leaveStatus}</StatusPill></td>
                  <td className="px-4 py-3">
                    {leaveId && leaveStatus === "Pending" ? (
                      <button
                        disabled={cancelLeaveMutation.isPending}
                        onClick={() => cancelLeaveMutation.mutate(leaveId)}
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">No leave requests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
