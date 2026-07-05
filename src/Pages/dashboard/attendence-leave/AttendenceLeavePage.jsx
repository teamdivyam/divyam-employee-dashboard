import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AttendanceTable,
  CorrectionForm,
  HeaderActions,
  RightRail,
  SimpleList,
  StatusPill,
  SummaryCard,
  TodayPanel,
  TopTabs,
  displayText,
  formatDisplayDate,
  formatShortDate,
  formatTime,
  statusTone,
  summaryIcons,
} from "./components/AttendanceLeaveComponents";
import EmployeeService from "@/services/employee.service";
import { BriefcaseBusiness, FilePenLine, FileText, Umbrella } from "lucide-react";

const todayIso = new Date().toISOString().slice(0, 10);
const now = new Date();

export default function AttendenceLeavePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("today");
  const [filters] = useState({
    date: todayIso,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const [correctionForm, setCorrectionForm] = useState({
    attendance: "",
    correctionType: "Check_In",
    attendanceDate: todayIso,
    requestedCheckInTime: "",
    requestedCheckOutTime: "",
    requestedStatus: "Present",
    reason: "",
    attachment: null,
  });

  const dashboardQuery = useQuery({
    queryKey: ["finance-attendance-leave", filters],
    queryFn: async () => {
      const response = await EMployeeService.getFinanceAttendanceLeave(filters);
      return response.data?.attendanceLeave || {};
    },
  });

  const monthlyQuery = useQuery({
    queryKey: ["finance-attendance-monthly-report", filters.year, filters.month],
    queryFn: async () => {
      const response = await EMployeeService.getFinanceMonthlyAttendanceReport({
        year: filters.year,
        month: filters.month,
      });
      return response.data?.report || {};
    },
  });

  const leaveBalanceQuery = useQuery({
    queryKey: ["finance-leave-balance"],
    queryFn: async () => {
      const response = await EMployeeService.getFinanceLeaveBalance();
      return response.data?.leaveBalance || [];
    },
  });

  const rulesQuery = useQuery({
    queryKey: ["finance-attendance-rules"],
    queryFn: async () => {
      const response = await EMployeeService.getFinanceAttendanceRules();
      return response.data || {};
    },
  });

  const correctionsQuery = useQuery({
    queryKey: ["finance-attendance-corrections", "Pending"],
    queryFn: async () => {
      const response = await EMployeeService.getFinanceAttendanceCorrections({ status: "Pending" });
      return response.data?.correctionRequests || [];
    },
  });

  const actionMutation = useMutation({
    mutationFn: (action) =>
      action === "checkIn"
        ? EMployeeService.checkInAttendance({
            locationType: "Office",
            locationName: "DIVYAM Office",
            attendanceSource: "Dashboard",
          })
        : EMployeeService.checkOutAttendance({ notes: "Checked out from attendance dashboard" }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Attendance updated");
      queryClient.invalidateQueries({ queryKey: ["finance-attendance-leave"] });
      queryClient.invalidateQueries({ queryKey: ["finance-attendance-monthly-report"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update attendance"),
  });

  const correctionMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      Object.entries(correctionForm).forEach(([key, value]) => {
        if (value) {
          if (key === "requestedCheckInTime" || key === "requestedCheckOutTime") {
            formData.append(key, new Date(value).toISOString());
          } else {
            formData.append(key, value);
          }
        }
      });
      return EMployeeService.submitFinanceAttendanceCorrection({ formData });
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Correction request submitted");
      setCorrectionForm((form) => ({ ...form, reason: "", attachment: null }));
      queryClient.invalidateQueries({ queryKey: ["finance-attendance-corrections"] });
      queryClient.invalidateQueries({ queryKey: ["finance-attendance-leave"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to submit correction"),
  });

  const data = dashboardQuery.data || {};
  const todayAttendance = data.todayAttendance || {};
  const todaysDuty = data.todaysDuty || {};
  const monthlyRows = monthlyQuery.data?.rows?.length ? monthlyQuery.data.rows : data.monthlyAttendance || [];
  const leaveRequests = data.leaveRequests || [];
  const correctionRequests = correctionsQuery.data?.length ? correctionsQuery.data : data.correctionRequests || [];
  const rules = rulesQuery.data?.rules?.length ? rulesQuery.data.rules : data.rules || [];
  const note = rulesQuery.data?.note || data.note;
  const leaveBalance = leaveBalanceQuery.data || [];
  const monthLabel = useMemo(
    () => new Date(filters.year, filters.month - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    [filters.month, filters.year]
  );
  const cards = data.cards || {};
  const summary = monthlyQuery.data?.summary || {};

  const cardConfig = [
    {
      label: "Today Status",
      value: cards.todayStatus || todayAttendance.status || "Present",
      sub: cards.todayStatusSub || "Checked In",
      icon: summaryIcons.status,
      tone: "green",
    },
    {
      label: "Check-In Time",
      value: cards.checkInTime || (todayAttendance.checkInTime ? formatTime(todayAttendance.checkInTime) : "11:05 AM"),
      sub: "Today",
      icon: summaryIcons.checkIn,
      tone: "blue",
    },
    {
      label: "Working Hours",
      value: cards.workingHours || todayAttendance.workingHours || todayAttendance.totalWorkingHours || "7h 20m",
      sub: "Till Now",
      icon: summaryIcons.hours,
      tone: "orange",
    },
    {
      label: "This Month Present",
      value: cards.thisMonthPresent || `${summary.presentDays || 22} Days`,
      sub: cards.workingDays ? `Out of ${cards.workingDays} Days` : "Out of 26 Days",
      icon: summaryIcons.present,
      tone: "green",
    },
    {
      label: "Late / Absent",
      value: cards.lateAbsent || `${summary.lateDays || 3} Late`,
      sub: `${summary.absentDays || 1} Absent`,
      icon: summaryIcons.late,
      tone: "red",
    },
    {
      label: "Leave Balance",
      value: cards.leaveBalance || `${leaveBalance[0]?.remaining ?? 2} Days`,
      sub: `${displayText(leaveBalance[0]?.leaveType, "Paid Leave")} Left`,
      icon: summaryIcons.leave,
      tone: "purple",
    },
  ];

  const submitCorrection = (event) => {
    event.preventDefault();
    correctionMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background px-4 py-4 text-[#07164c] dark:text-foreground">
      <header className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Attendance & Leave</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your attendance, working hours, leave balance, event duty and requests.</p>
        </div>
        <HeaderActions
          isBusy={actionMutation.isPending}
          onCheckIn={() => actionMutation.mutate("checkIn")}
          onCheckOut={() => actionMutation.mutate("checkOut")}
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
            <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading attendance details...</div>
          ) : (
            <>
              {activeTab === "today" && (
                <>
                  <TodayPanel attendance={todayAttendance} duty={todaysDuty} />
                  <AttendanceTable rows={monthlyRows} monthLabel={monthLabel} />
                </>
              )}
              {activeTab === "monthly" && <AttendanceTable rows={monthlyRows} monthLabel={monthLabel} />}
              {activeTab === "leaves" && (
                <SimpleList
                  title="Leave Requests"
                  icon={Umbrella}
                  rows={leaveRequests}
                  emptyText="No leave requests found."
                  renderRow={(leave, index) => (
                    <div key={leave._id || index} className="grid gap-2 p-4 text-xs md:grid-cols-[1fr_130px_120px]">
                      <div>
                        <p className="font-medium text-foreground">{displayText(leave.leaveType || leave.type, "Leave Request")}</p>
                        <p className="text-muted-foreground">{formatShortDate(leave.startDate)} - {formatShortDate(leave.endDate)} • {displayText(leave.reason, "No reason added")}</p>
                      </div>
                      <span>{displayText(leave.totalDays || leave.days)} Days</span>
                      <StatusPill tone={statusTone(displayText(leave.status))}>{displayText(leave.status, "Pending")}</StatusPill>
                    </div>
                  )}
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
                      <p><b className="font-medium">Duty Type:</b> {displayText(duty.dutyType, "Office Duty")}</p>
                      <p><b className="font-medium">Department:</b> {displayText(duty.department)}</p>
                      <p><b className="font-medium">Manager:</b> {displayText(duty.reportingManager)}</p>
                      <p><b className="font-medium">Remarks:</b> {displayText(duty.remarks)}</p>
                    </div>
                  )}
                />
              )}
              {activeTab === "corrections" && (
                <div className="space-y-4">
                  <CorrectionForm
                    form={correctionForm}
                    setForm={setCorrectionForm}
                    onSubmit={submitCorrection}
                    isPending={correctionMutation.isPending}
                  />
                  <SimpleList
                    title="Correction Requests"
                    icon={FilePenLine}
                    rows={correctionRequests}
                    emptyText="No correction requests found."
                    renderRow={(request, index) => (
                      <div key={request._id || index} className="grid gap-2 p-4 text-xs md:grid-cols-[1fr_130px_120px]">
                        <div>
                          <p className="font-medium text-foreground">{displayText(request.correctionType, "Attendance Correction")}</p>
                          <p className="text-muted-foreground">{formatDisplayDate(request.attendanceDate)} • {displayText(request.reason)}</p>
                        </div>
                        <span>{displayText(request.requestedStatus)}</span>
                        <StatusPill tone={statusTone(displayText(request.status))}>{displayText(request.status, "Pending")}</StatusPill>
                      </div>
                    )}
                  />
                </div>
              )}
              {activeTab === "rules" && (
                <SimpleList
                  title="Attendance Rules"
                  icon={FileText}
                  rows={rules}
                  emptyText={note || "No attendance rules available."}
                  renderRow={(rule, index) => (
                    <div key={rule._id || index} className="p-4 text-xs">
                      <p className="font-medium text-foreground">{displayText(rule.title || rule.name, `Rule ${index + 1}`)}</p>
                      <p className="mt-1 text-muted-foreground">{displayText(rule.description || rule.rule || rule.note)}</p>
                    </div>
                  )}
                />
              )}
            </>
          )}
        </main>

        <RightRail
          health={data.attendanceHealth || summary}
          quickActions={data.quickActions}
          alerts={data.alerts}
          note={note}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );
}
