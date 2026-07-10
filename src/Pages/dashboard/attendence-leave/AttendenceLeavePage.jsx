/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
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
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePenLine,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  Umbrella,
  UploadCloud,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/components/ui/dropdown-menu";

function toDateInputValue(value = new Date()) {
  if (typeof value === "string") {
    const datePart = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if (datePart) return datePart;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const todayIso = toDateInputValue();
const now = new Date();

const defaultLeaveForm = {
  leaveType: "Casual Leave",
  leaveDate: todayIso,
  fromDate: todayIso,
  toDate: todayIso,
  leaveDuration: "Full Day",
  halfDayPeriod: "First Half",
  reasonForLeave: "",
  workHandover: "",
  supportingDocument: null,
};

const defaultLeaveTypes = ["Casual Leave", "Sick Leave", "Emergency Leave", "Compensatory Off", "Unpaid Leave", "Other"];
const defaultLeaveDurations = ["Full Day", "Half Day", "Multiple Days"];
const defaultHalfDayPeriods = ["First Half", "Second Half"];
const attendanceCorrectionFields = [
  "Check-in Time",
  "Check-out Time",
  "Both Check-in & Check-out",
  "Attendance Status",
  "Working Hours",
  "Event Duty /Field Duty",
  "Other",
];
const leaveCorrectionFields = ["Change Leave Dates", "From Date", "To Date", "Leave Type", "Duration", "Reason", "Work Handover", "Other"];
const attendanceTabStorageKey = "attendance-leave-active-tab";
const attendanceTabIds = ["today", "monthly", "leaves", "duty", "corrections", "rules"];

const defaultCorrectionForm = {
  correctionId: "",
  correctionFor: "Attendance",
  attendanceId: "",
  attendanceRecord: null,
  leaveId: "",
  leaveRecord: null,
  whatNeedsToBeCorrected: "Check-in Time",
  whatNeedsToBeChanged: "Change Leave Dates",
  requestedCorrection: "",
  reasonForCorrection: "",
  supportingProof: null,
};

function getFiscalYearStartYear(dateValue) {
  const date = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().getFullYear();
  return date.getMonth() + 1 >= 4 ? date.getFullYear() : date.getFullYear() - 1;
}

function parseDateOnly(value) {
  if (!value) return null;
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function isDateBefore(dateValue, compareDateValue) {
  const date = parseDateOnly(dateValue);
  const compareDate = parseDateOnly(compareDateValue);
  return Boolean(date && compareDate && date < compareDate);
}

function getLeaveDaysEstimate(fromDate, toDate) {
  const start = parseDateOnly(fromDate);
  const end = parseDateOnly(toDate);
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  return Math.floor((end - start) / 86400000) + 1;
}

function getRequestedLeaveDays(form) {
  if (form.leaveDuration === "Half Day") return form.leaveDate ? 0.5 : null;
  if (form.leaveDuration === "Full Day") return form.leaveDate ? 1 : null;
  return getLeaveDaysEstimate(form.fromDate, form.toDate);
}

function parseBalanceValue(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const number = Number.parseFloat(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : null;
}

function getAvailableLeaveDays(balance) {
  if (!balance) return null;
  const balanceFields = [
    balance.balance,
    balance.availableBalance,
    balance.availableLeaves,
    balance.availableLeaveDays,
    balance.remainingLeaves,
    balance.remainingDays,
    balance.daysLeft,
    balance.leaveDaysLeft,
  ];

  for (const field of balanceFields) {
    const parsedBalance = parseBalanceValue(field);
    if (parsedBalance !== null) return parsedBalance;
  }

  return null;
}

function getRecordId(record) {
  if (!record) return "";
  if (typeof record === "string") return record;
  return record._id || record.id || "";
}

function getCorrectionField(correction = {}) {
  return displayText(
    correction.whatNeedsToBeCorrected || correction.whatNeedsToBeChanged || correction.correctionType,
    "Correction Request"
  );
}

function isDateInMonth(value, year, month) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() === year && date.getMonth() + 1 === month;
}

function isDateInYear(value, year) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() === year;
}

function isLeaveInPeriod(leave, year, month) {
  if (month === "All") {
    return (
      isDateInYear(leave.fromDate || leave.startDate, year) ||
      isDateInYear(leave.toDate || leave.endDate, year) ||
      isDateInYear(leave.createdAt || leave.requestedAt || leave.submittedAt, year)
    );
  }

  return (
    isDateInMonth(leave.fromDate || leave.startDate, year, month) ||
    isDateInMonth(leave.toDate || leave.endDate, year, month) ||
    isDateInMonth(leave.createdAt || leave.requestedAt || leave.submittedAt, year, month)
  );
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
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === "undefined") return "today";
    try {
      const storedTab = window.localStorage.getItem(attendanceTabStorageKey);
      return attendanceTabIds.includes(storedTab) ? storedTab : "today";
    } catch {
      return "today";
    }
  });
  const [filters] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const [leaveFilters, setLeaveFilters] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const [leaveForm, setLeaveForm] = useState(defaultLeaveForm);
  const [correctionForm, setCorrectionForm] = useState(defaultCorrectionForm);
  const [attendanceAction, setAttendanceAction] = useState(null);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isCorrectionDialogOpen, setIsCorrectionDialogOpen] = useState(false);
  const [recentCorrectionRequest, setRecentCorrectionRequest] = useState(null);
  const [correctionTypeFilter, setCorrectionTypeFilter] = useState("All");
  const leaveFiscalYearStartYear = useMemo(() => getFiscalYearStartYear(leaveForm.fromDate), [leaveForm.fromDate]);

  useEffect(() => {
    try {
      window.localStorage.setItem(attendanceTabStorageKey, activeTab);
    } catch {
      // Ignore storage failures so tab changes still work normally.
    }
  }, [activeTab]);

  const historyFilters = useMemo(
    () => ({
      page: 1,
      limit: 25,
      status: "All",
      startDate: toDateInputValue(new Date(filters.year, filters.month - 1, 1)),
      endDate: toDateInputValue(new Date(filters.year, filters.month, 0)),
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
      const formData = new FormData();
      formData.append("leaveType", leaveForm.leaveType);
      formData.append("leaveDuration", leaveForm.leaveDuration);
      formData.append("requestedLeaveDays", String(estimatedLeaveDays));
      formData.append("reasonForLeave", leaveForm.reasonForLeave.trim());
      if (leaveForm.workHandover.trim()) formData.append("workHandover", leaveForm.workHandover.trim());

      if (leaveForm.leaveDuration === "Multiple Days") {
        formData.append("fromDate", leaveForm.fromDate);
        formData.append("toDate", leaveForm.toDate);
      } else {
        formData.append("leaveDate", leaveForm.leaveDate);
        if (leaveForm.leaveDuration === "Half Day") formData.append("halfDayPeriod", leaveForm.halfDayPeriod);
      }

      if (leaveForm.supportingDocument) formData.append("supportingDocument", leaveForm.supportingDocument);

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
      if (correctionForm.correctionFor === "Leave") {
        const payload = {
          whatNeedsToBeChanged: correctionForm.whatNeedsToBeChanged,
          requestedCorrection: correctionForm.requestedCorrection.trim(),
          reasonForCorrection: correctionForm.reasonForCorrection.trim(),
        };

        if (correctionForm.supportingProof) {
          const formData = new FormData();
          Object.entries(payload).forEach(([key, value]) => formData.append(key, value));
          formData.append("supportingProof", correctionForm.supportingProof);
          return EmployeeService.submitLeaveCorrection({
            leaveId: correctionForm.leaveId,
            data: formData,
          });
        }

        return EmployeeService.submitLeaveCorrection({
          leaveId: correctionForm.leaveId,
          data: payload,
        });
      }

      const payload = {
        whatNeedsToBeCorrected: correctionForm.whatNeedsToBeCorrected,
        requestedCorrection: correctionForm.requestedCorrection.trim(),
        reasonForCorrection: correctionForm.reasonForCorrection.trim(),
      };

      if (correctionForm.supportingProof) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => formData.append(key, value));
        formData.append("supportingProof", correctionForm.supportingProof);
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
      setRecentCorrectionRequest(null);
      setCorrectionForm(defaultCorrectionForm);
      setIsCorrectionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-history"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-requests"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to submit correction request"),
  });

  const deleteCorrectionMutation = useMutation({
    mutationFn: (correctionId) => EmployeeService.deleteAttendanceCorrection({ correctionId }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Correction request deleted");
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-history"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to delete correction request"),
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
  const attendanceRule = data.attendanceRule || {};
  const attendanceRules = attendanceRule.effectiveAttendanceRule?.length
    ? attendanceRule.effectiveAttendanceRule
    : [
        ...(attendanceRule.globalAttendanceRule || []),
        ...(attendanceRule.individualAttendanceRule || []),
      ];
  const recentCorrections = recentCorrectionRequest
    ? [recentCorrectionRequest]
    : Array.isArray(dashboardCorrections)
      ? dashboardCorrections
      : dashboardCorrections
        ? [dashboardCorrections]
        : [];
  const filteredCorrections = recentCorrections.filter((correction) => (
    correctionTypeFilter === "All" || getCorrectionField(correction) === correctionTypeFilter
  ));
  const leaveRequests = leaveRequestsQuery.data?.leaveRequests?.length
    ? leaveRequestsQuery.data.leaveRequests
    : data.myLeaveRequests || [];
  const requestNotifications = useMemo(() => {
    const getTime = (item) => {
      const value = item.requestedAt || item.submittedAt || item.createdAt || item.updatedAt || item.actionAt || item.fromDate || item.attendanceDate;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    };

    const leaveNotifications = (leaveRequests || []).map((leave) => {
      const leaveStatus = displayText(leave.leaveStatus || leave.status, "Pending");
      const leaveType = displayText(leave.leaveType || leave.type, "Leave Request");
      const date = leave.requestedAt || leave.submittedAt || leave.createdAt || leave.fromDate || leave.startDate;

      return {
        title: `${leaveType} - ${leaveStatus}`,
        description: `${formatShortDate(leave.fromDate || leave.startDate)} to ${formatShortDate(leave.toDate || leave.endDate)} • ${formatShortDate(date)}`,
        status: leaveStatus,
        time: getTime(leave),
      };
    });

    const correctionNotifications = (recentCorrections || []).map((correction) => {
      const correctionStatus = displayText(correction.correctionStatus || correction.status, "Pending");
      const correctionType = getCorrectionField(correction);
      const date = correction.requestedAt || correction.createdAt || correction.updatedAt || correction.attendanceDate;

      return {
        title: `${correctionType} Correction - ${correctionStatus}`,
        description: `${formatShortDate(correction.attendanceDate || date)} • ${formatShortDate(date)}`,
        status: correctionStatus,
        time: getTime(correction),
      };
    });

    return [...leaveNotifications, ...correctionNotifications]
      .sort((a, b) => b.time - a.time)
      .slice(0, 5)
      .sort((a, b) => a.time - b.time);
  }, [leaveRequests, recentCorrections]);
  const monthlyLeaveRequests = useMemo(
    () => leaveRequests.filter((leave) => isLeaveInPeriod(leave, leaveFilters.year, leaveFilters.month)),
    [leaveFilters.month, leaveFilters.year, leaveRequests]
  );
  const currentMonthLeaveRequests = useMemo(
    () => leaveRequests.filter((leave) => isLeaveInPeriod(leave, filters.year, filters.month)),
    [filters.month, filters.year, leaveRequests]
  );
  const leaveBalanceResponse = leaveBalanceQuery.data || {};
  const leaveBalance = leaveBalanceResponse.leaveBalance || [];
  const leaveMeta = data.meta || leaveRequestsQuery.data?.meta || {};
  const leaveTypeOptions = leaveMeta.leaveTypes?.length ? leaveMeta.leaveTypes : defaultLeaveTypes;
  const leaveDurationOptions = leaveMeta.leaveDurations?.length ? leaveMeta.leaveDurations : defaultLeaveDurations;
  const halfDayPeriodOptions = leaveMeta.halfDayPeriods?.length ? leaveMeta.halfDayPeriods : defaultHalfDayPeriods;
  const totalLeaveBalance = leaveBalance.reduce((total, item) => total + (getAvailableLeaveDays(item) || 0), 0);
  const selectedLeaveBalance = leaveBalance.find((item) => item.leaveType === leaveForm.leaveType);
  const selectedLeaveDaysLeft = getAvailableLeaveDays(selectedLeaveBalance);
  const estimatedLeaveDays = getRequestedLeaveDays(leaveForm);
  const exceedsLeaveBalance =
    selectedLeaveDaysLeft !== null && estimatedLeaveDays !== null && estimatedLeaveDays > selectedLeaveDaysLeft;
  const monthLabel = useMemo(
    () => new Date(filters.year, filters.month - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    [filters.month, filters.year]
  );
  const leaveMonthLabel = useMemo(
    () => String(leaveFilters.year),
    [leaveFilters.year]
  );
  const summary = data.monthlySummary || {};
  const monthlyLeaveDays = monthlyLeaveRequests.reduce(
    (total, leave) => total + (Number(leave.leaveDays || leave.totalDays || leave.days) || 0),
    0
  );
  const currentMonthLeaveDays = currentMonthLeaveRequests.reduce(
    (total, leave) => total + (Number(leave.leaveDays || leave.totalDays || leave.days) || 0),
    0
  );
  const attendanceHealth = useMemo(() => {
    const rowCounts = monthlyRows.reduce(
      (counts, attendance) => {
        const rowStatus = resolvePresenceStatus(attendance);
        if (rowStatus === "Present") counts.presentDays += 1;
        if (rowStatus === "Absent") counts.absentDays += 1;
        return counts;
      },
      { presentDays: 0, absentDays: 0 }
    );

    return {
      presentDays: summary.presentDays ?? rowCounts.presentDays,
      absentDays: summary.absentDays ?? rowCounts.absentDays,
      leaveDays: data.leavesTakenThisMonth ?? summary.leaveDays ?? summary.leavesTaken ?? currentMonthLeaveDays,
    };
  }, [currentMonthLeaveDays, data.leavesTakenThisMonth, monthlyRows, summary.absentDays, summary.leaveDays, summary.leavesTaken, summary.presentDays]);
  const latestAttendanceRows = useMemo(
    () => [...monthlyRows]
      .sort((a, b) => new Date(b.attendanceDate || b.date || 0) - new Date(a.attendanceDate || a.date || 0))
      .slice(0, 5),
    [monthlyRows]
  );

  const openCorrectionDialogForAttendance = (attendance) => {
    setCorrectionForm({
      ...defaultCorrectionForm,
      correctionFor: "Attendance",
      attendanceId: getRecordId(attendance),
      attendanceRecord: attendance,
      whatNeedsToBeCorrected: "Check-out Time",
    });
    setIsCorrectionDialogOpen(true);
  };

  const openCorrectionDialogForRequest = (correction) => {
    const attendance = correction.attendance || correction.attendanceId || {};
    setCorrectionForm({
      ...defaultCorrectionForm,
      correctionId: getRecordId(correction),
      correctionFor: correction.correctionFor || "Attendance",
      attendanceId: getRecordId(attendance),
      attendanceRecord: typeof attendance === "object" ? attendance : null,
      whatNeedsToBeCorrected: correction.whatNeedsToBeCorrected || correction.correctionType || "Other",
      whatNeedsToBeChanged: correction.whatNeedsToBeChanged || "Other",
      requestedCorrection: correction.requestedCorrection || correction.remarks || "",
      reasonForCorrection: correction.reasonForCorrection || correction.reason || "",
    });
    setIsCorrectionDialogOpen(true);
  };

  const openLeaveCorrectionDialog = (leave) => {
    setCorrectionForm({
      ...defaultCorrectionForm,
      correctionFor: "Leave",
      leaveId: getRecordId(leave),
      leaveRecord: leave,
      whatNeedsToBeChanged: "Change Leave Dates",
    });
    setIsCorrectionDialogOpen(true);
  };

  const submitLeave = (event) => {
    event.preventDefault();
    if (!leaveForm.leaveType || !leaveForm.reasonForLeave.trim()) {
      toast.error("Leave type and reason for leave are required!");
      return;
    }
    if (!leaveDurationOptions.includes(leaveForm.leaveDuration)) {
      toast.error("Invalid leave duration!");
      return;
    }
    if (leaveForm.leaveDuration === "Half Day" && !halfDayPeriodOptions.includes(leaveForm.halfDayPeriod)) {
      toast.error("Select a valid half day period!");
      return;
    }
    if (estimatedLeaveDays === null) {
      toast.error(leaveForm.leaveDuration === "Multiple Days" ? "To date cannot be before from date!" : "Leave date is required!");
      return;
    }
    if (exceedsLeaveBalance) {
      toast.error(`Requested leave days cannot exceed ${selectedLeaveDaysLeft} days left for ${leaveForm.leaveType}.`);
      return;
    }
    leaveMutation.mutate();
  };

  const submitCorrection = (event) => {
    event.preventDefault();

    if (correctionForm.correctionFor === "Leave" && !correctionForm.leaveId) {
      toast.error("Leave request is required!");
      return;
    }
    if (correctionForm.correctionFor !== "Leave" && !correctionForm.attendanceId) {
      toast.error("Attendance record is required!");
      return;
    }
    if (correctionForm.correctionFor === "Leave" && !leaveCorrectionFields.includes(correctionForm.whatNeedsToBeChanged)) {
      toast.error("Select what needs to be changed!");
      return;
    }
    if (correctionForm.correctionFor !== "Leave" && !attendanceCorrectionFields.includes(correctionForm.whatNeedsToBeCorrected)) {
      toast.error("Select what needs to be corrected!");
      return;
    }
    if (!correctionForm.requestedCorrection.trim() || !correctionForm.reasonForCorrection.trim()) {
      toast.error("Requested correction and reason are required!");
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
      label: "Total Leave Balance",
      value: leaveBalance.length ? `${totalLeaveBalance} Days` : "--",
      sub: "Leaves Left",
      icon: summaryIcons.leave,
      tone: "purple",
    },
  ];
  const correctionFilterOptions = [...attendanceCorrectionFields, ...leaveCorrectionFields.filter((field) => !attendanceCorrectionFields.includes(field))];

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
                  <AttendanceTable
                    rows={latestAttendanceRows}
                    monthLabel={monthLabel}
                    showFullReportButton
                    onViewFullReport={() => setActiveTab("monthly")}
                    onAddCorrection={openCorrectionDialogForAttendance}
                  />
                </>
              )}
              {activeTab === "monthly" && (
                <AttendanceTable
                  rows={monthlyRows}
                  monthLabel={monthLabel}
                  onAddCorrection={openCorrectionDialogForAttendance}
                />
              )}
              {activeTab === "leaves" && (
                <div className="space-y-4">
                  <LeaveBalanceSummary
                    leaveBalance={leaveBalance}
                    totalLeaveBalance={totalLeaveBalance}
                    monthlyLeaveDays={monthlyLeaveDays}
                    monthlyLeaveRequests={monthlyLeaveRequests}
                    monthLabel={leaveMonthLabel}
                    filters={leaveFilters}
                    onFilterChange={setLeaveFilters}
                  />
                  <LeaveRequestsList
                    rows={monthlyLeaveRequests}
                    cancelLeaveMutation={cancelLeaveMutation}
                    monthLabel={leaveMonthLabel}
                    onAddCorrection={openLeaveCorrectionDialog}
                  />
                </div>
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
                  rows={filteredCorrections}
                  typeFilter={correctionTypeFilter}
                  onTypeFilterChange={setCorrectionTypeFilter}
                  correctionTypes={correctionFilterOptions}
                  onEdit={openCorrectionDialogForRequest}
                  onDelete={(correction) => {
                    const correctionId = correction._id || correction.id;
                    if (correctionId) deleteCorrectionMutation.mutate(correctionId);
                  }}
                  isDeleting={deleteCorrectionMutation.isPending}
                />
              )}
              {activeTab === "rules" && (
                <AttendanceRulesList rows={attendanceRules} />
              )}
            </>
          )}
        </main>

        <RightRail
          health={attendanceHealth}
          monthLabel={monthLabel}
          quickActions={data.quickActions}
          alerts={requestNotifications}
          note={data.note}
          setActiveTab={setActiveTab}
        />
      </div>
      <LeaveRequestDialog
        open={isLeaveDialogOpen}
        onOpenChange={setIsLeaveDialogOpen}
        form={leaveForm}
        setForm={setLeaveForm}
        leaveTypes={leaveTypeOptions}
        leaveDurations={leaveDurationOptions}
        halfDayPeriods={halfDayPeriodOptions}
        leaveBalance={leaveBalance}
        fiscalYear={leaveBalanceResponse.fiscalYear}
        selectedLeaveBalance={selectedLeaveBalance}
        selectedLeaveDaysLeft={selectedLeaveDaysLeft}
        totalLeaveBalance={totalLeaveBalance}
        estimatedLeaveDays={estimatedLeaveDays}
        exceedsLeaveBalance={exceedsLeaveBalance}
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
      <DialogContent className="atl-card max-h-[90vh] overflow-y-auto p-0 sm:max-w-[690px]">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-start gap-3 text-left">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-orange-50 text-[#f97316] dark:bg-orange-400/10">
              <FileText className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-semibold text-foreground">Apply for Leave</span>
              <span className="mt-1 block text-xs font-normal text-muted-foreground">Submit your leave request for Admin approval.</span>
            </span>
          </DialogTitle>
        </DialogHeader>
        <LeaveRequestForm {...props} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CorrectionRequestDialog({ open, onOpenChange, ...props }) {
  const isLeaveCorrection = props.form?.correctionFor === "Leave";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="atl-card max-h-[90vh] overflow-y-auto p-0 sm:max-w-[680px]">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-start gap-3 text-left">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-orange-50 text-[#f97316] dark:bg-orange-400/10">
              <FilePenLine className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-semibold text-foreground">
                {isLeaveCorrection ? "Request Leave Correction" : "Request Attendance Correction"}
              </span>
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                {isLeaveCorrection ? "Submit the required changes for your approved leave." : "Submit the correction details for Admin review."}
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>
        <CorrectionRequestForm {...props} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CorrectionRequestForm({ form, setForm, attendanceRows, onSubmit, onCancel, isPending }) {
  const isLeaveCorrection = form.correctionFor === "Leave";
  const selectedAttendance = form.attendanceRecord || attendanceRows.find((attendance) => (attendance._id || attendance.id) === form.attendanceId);
  const selectedLeave = form.leaveRecord || {};
  const input = "atl-input h-11 rounded-md border px-3 text-xs";
  const textarea = "atl-input rounded-md border px-3 py-2 text-xs";
  const isSubmitDisabled = isPending || (!isLeaveCorrection && !selectedAttendance) || (isLeaveCorrection && !form.leaveId);

  return (
    <form onSubmit={onSubmit} className="space-y-4 p-5">
      {isLeaveCorrection ? (
        <LeaveCorrectionCurrentCard leave={selectedLeave} />
      ) : (
        <AttendanceCorrectionCurrentCard attendance={selectedAttendance} />
      )}

      <label className="grid gap-1.5 text-xs">
        <span className="font-medium text-foreground">
          {isLeaveCorrection ? "What needs to be changed?" : "What needs to be corrected?"} <span className="text-red-500">*</span>
        </span>
        <select
          className={input}
          value={isLeaveCorrection ? form.whatNeedsToBeChanged : form.whatNeedsToBeCorrected}
          onChange={(event) => setForm({
            ...form,
            [isLeaveCorrection ? "whatNeedsToBeChanged" : "whatNeedsToBeCorrected"]: event.target.value,
          })}
          required
        >
          {(isLeaveCorrection ? leaveCorrectionFields : attendanceCorrectionFields).map((field) => (
            <option key={field}>{field}</option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-xs">
        <span className="font-medium text-foreground">Requested Correction <span className="text-red-500">*</span></span>
        <textarea
          className={textarea}
          rows="3"
          placeholder={isLeaveCorrection ? "Please change my approved leave dates from 15-17 July 2026 to 16-17 July 2026." : "Check-out time should be 7:30 PM. I forgot to check out after completing office work."}
          value={form.requestedCorrection}
          onChange={(event) => setForm({ ...form, requestedCorrection: event.target.value })}
          required
        />
      </label>

      <label className="grid gap-1.5 text-xs">
        <span className="font-medium text-foreground">Reason for Correction <span className="text-red-500">*</span></span>
        <textarea
          className={textarea}
          rows="3"
          placeholder={isLeaveCorrection ? "My personal work has been rescheduled." : "I forgot to check out before leaving the office."}
          value={form.reasonForCorrection}
          onChange={(event) => setForm({ ...form, reasonForCorrection: event.target.value })}
          required
        />
      </label>

      <CorrectionProofUpload
        label={isLeaveCorrection ? "Supporting Document" : "Supporting Proof"}
        file={form.supportingProof}
        onChange={(file) => setForm({ ...form, supportingProof: file })}
      />

      <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-3 text-xs text-orange-900 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-200">
        {isLeaveCorrection
          ? "Your currently approved leave will remain unchanged until Admin reviews and approves this correction request."
          : "Admin will review this request and manually update the attendance record, if approved."}
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-6 py-2.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          Cancel
        </button>
        <button disabled={isSubmitDisabled} className="atl-primary rounded-md px-8 py-2.5 text-xs font-medium disabled:opacity-60">
          {isPending ? "Submitting..." : "Submit Correction Request"}
        </button>
      </div>
    </form>
  );
}

function AttendanceCorrectionCurrentCard({ attendance }) {
  const status = resolvePresenceStatus(attendance || {});
  const attendanceDate = attendance?.attendanceDate || attendance?.date;

  return (
    <div className="space-y-3">
      <label className="grid max-w-[310px] gap-1.5 text-xs">
        <span className="font-medium text-foreground">Attendance Date</span>
        <input className="atl-input h-11 rounded-md border px-3 text-xs" type="text" value={formatShortDate(attendanceDate)} disabled readOnly />
      </label>
      <div>
        <p className="mb-2 text-xs font-medium text-foreground">Current Record</p>
        <div className="grid gap-3 rounded-lg border border-orange-200 bg-orange-50/25 p-3 text-xs dark:border-orange-400/30 dark:bg-orange-400/10 sm:grid-cols-4">
          <CurrentRecordStat label="Status" value={<StatusPill tone={statusTone(status)}>{status}</StatusPill>} />
          <CurrentRecordStat label="Check-in" value={formatTime(attendance?.checkInTime)} />
          <CurrentRecordStat label="Check-out" value={attendance?.checkOutTime ? formatTime(attendance.checkOutTime) : <span className="text-red-600">Not Recorded</span>} />
          <CurrentRecordStat label="Working Hours" value={displayText(attendance?.workingHours || attendance?.totalWorkingHours)} />
        </div>
      </div>
    </div>
  );
}

function LeaveCorrectionCurrentCard({ leave }) {
  const leaveStatus = displayText(leave.leaveStatus || leave.status, "Pending");
  const leaveDays = displayText(leave.leaveDays || leave.totalDays || leave.days || leave.requestedLeaveDays);

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50/25 p-4 text-xs dark:border-orange-400/30 dark:bg-orange-400/10">
      <p className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
        <FileText className="h-4 w-4 text-[#f97316]" />
        Current Approved Leave
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <CurrentRecordStat label="Leave Type" value={displayText(leave.leaveType || leave.type, "Leave Request")} />
        <CurrentRecordStat label="From" value={formatShortDate(leave.fromDate || leave.startDate || leave.leaveDate)} />
        <CurrentRecordStat label="To" value={formatShortDate(leave.toDate || leave.endDate || leave.leaveDate)} />
      </div>
      <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
        <CurrentRecordStat label="Duration" value={leaveDays === "--" ? displayText(leave.leaveDuration || leave.duration) : `${leaveDays} Days`} />
        <CurrentRecordStat label="Status" value={<StatusPill tone={statusTone(leaveStatus)}>{leaveStatus}</StatusPill>} />
      </div>
    </div>
  );
}

function CurrentRecordStat({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 truncate text-xs font-semibold text-foreground">{value}</div>
    </div>
  );
}

function CorrectionProofUpload({ label, file, onChange }) {
  return (
    <label className="grid gap-1.5 text-xs">
      <span className="font-medium text-foreground">{label} <span className="font-normal text-muted-foreground">- Optional</span></span>
      <div className="relative rounded-md border border-dashed border-border bg-background p-5 text-center hover:bg-muted/30">
        <UploadCloud className="mx-auto h-7 w-7 text-foreground" />
        <p className="mt-2 text-xs font-medium text-foreground">
          {file ? file.name : "Click to upload or drag and drop"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or PDF (Max. 5 MB)</p>
        <input
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={(event) => onChange(event.target.files?.[0] || null)}
        />
      </div>
    </label>
  );
}

function RecentCorrectionsList({
  rows,
  typeFilter,
  onTypeFilterChange,
  correctionTypes,
  onEdit,
  onDelete,
  isDeleting,
}) {
  return (
    <Panel>
      <SectionTitle
        icon={FilePenLine}
        action={
          <select
            value={typeFilter}
            onChange={(event) => onTypeFilterChange(event.target.value)}
            className="atl-input rounded-md border px-3 py-1.5 text-xs"
          >
            <option value="All">All Types</option>
            {correctionTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        }
      >
        Correction Requests
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {["Date", "Type", "Reason", "Admin Remark", "Status", "Requested At", "Action"].map((header) => (
                <th key={header} className="px-4 py-2 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.length ? rows.map((correction, index) => {
              const correctionStatus = displayText(correction.correctionStatus || correction.status, "Pending");
              const canModify = String(correctionStatus).toLowerCase() === "pending";
              return (
                <tr key={correction._id || index} className="border-t border-border align-top">
                  <td className="px-4 py-3">{formatShortDate(correction.attendanceDate || correction.createdAt)}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{getCorrectionField(correction)}</td>
                  <td className="max-w-[320px] px-4 py-3 text-muted-foreground">{displayText(correction.reasonForCorrection || correction.reason || correction.remarks)}</td>
                  <td className="max-w-[260px] px-4 py-3 text-muted-foreground">
                    {displayText(correction.adminRemark || correction.adminRemarks || correction.adminNote || correction.reviewNote)}
                  </td>
                  <td className="px-4 py-3"><StatusPill tone={statusTone(correctionStatus)}>{correctionStatus}</StatusPill></td>
                  <td className="px-4 py-3 text-muted-foreground">{formatShortDate(correction.requestedAt || correction.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!canModify}
                        onClick={() => onEdit(correction)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        title={canModify ? "Edit correction request" : "Only pending correction requests can be edited"}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting || !canModify}
                        onClick={() => onDelete(correction)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        title={canModify ? "Delete correction request" : "Only pending correction requests can be deleted"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-muted-foreground">No correction request found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function AttendanceRulesList({ rows }) {
  const safeRows = rows?.length ? rows : [];

  return (
    <Panel>
      <SectionTitle icon={FileText}>Attendance Rules</SectionTitle>
      <div className="divide-y divide-border">
        {safeRows.length ? safeRows.map((rule, index) => {
          const points = Array.isArray(rule.points) ? rule.points.filter(Boolean) : [];

          return (
            <div key={rule._id || index} className="p-4 text-xs">
              <p className="font-medium text-foreground">{displayText(rule.heading, "Attendance Rule")}</p>
              {points.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {points.map((point, pointIndex) => (
                    <li key={`${rule._id || index}-${pointIndex}`}>{displayText(point)}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-muted-foreground">No rule points available.</p>
              )}
            </div>
          );
        }) : (
          <p className="p-5 text-center text-xs text-muted-foreground">No attendance rules available.</p>
        )}
      </div>
    </Panel>
  );
}

function LeaveRequestForm({
  form,
  setForm,
  leaveTypes,
  leaveDurations,
  halfDayPeriods,
  selectedLeaveBalance,
  selectedLeaveDaysLeft,
  totalLeaveBalance,
  estimatedLeaveDays,
  exceedsLeaveBalance,
  onSubmit,
  onCancel,
  isPending,
}) {
  const input = "atl-input h-11 rounded-md border px-3 text-xs";
  const textarea = "atl-input rounded-md border px-3 py-2 text-xs";
  const selectedBalanceText = selectedLeaveBalance
    ? `${displayText(selectedLeaveDaysLeft ?? selectedLeaveBalance.balance)} ${displayText(selectedLeaveBalance.leaveType)} left`
    : "Balance is tracked for eligible leave types.";
  const updateDuration = (leaveDuration) => {
    const nextForm = {
      ...form,
      leaveDuration,
    };

    if (leaveDuration === "Multiple Days") {
      nextForm.fromDate = toDateInputValue(form.fromDate || form.leaveDate || todayIso);
      nextForm.toDate = form.toDate && !isDateBefore(form.toDate, nextForm.fromDate) ? toDateInputValue(form.toDate) : nextForm.fromDate;
    } else {
      nextForm.leaveDate = form.leaveDate || form.fromDate || todayIso;
      nextForm.fromDate = nextForm.leaveDate;
      nextForm.toDate = nextForm.leaveDate;
      if (leaveDuration === "Half Day" && !halfDayPeriods.includes(form.halfDayPeriod)) {
        nextForm.halfDayPeriod = halfDayPeriods[0] || "First Half";
      }
    }

    setForm(nextForm);
  };
  const updateLeaveDate = (leaveDate) => {
    setForm({
      ...form,
      leaveDate,
      fromDate: leaveDate,
      toDate: leaveDate,
    });
  };
  const handleFromDateChange = (fromDate) => {
    const currentToDate = parseDateOnly(form.toDate);
    const nextFromDate = parseDateOnly(fromDate);
    const shouldSyncToDate = !currentToDate || !nextFromDate || currentToDate < nextFromDate;
    setForm({
      ...form,
      fromDate,
      toDate: shouldSyncToDate ? fromDate : form.toDate,
    });
  };
  const handleToDateChange = (toDate) => {
    setForm({
      ...form,
      toDate: isDateBefore(toDate, form.fromDate) ? form.fromDate : toDate,
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 p-5">
      <div className="rounded-lg border border-orange-200 bg-orange-50/30 p-4 dark:border-orange-400/30 dark:bg-orange-400/10">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300">
            <Umbrella className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-medium text-foreground">Available Leave Balance</p>
            <p className="text-xl font-semibold text-foreground">{displayText(totalLeaveBalance)} Days</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{selectedBalanceText}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-1.5 text-xs">
          <span className="font-medium text-foreground">Leave Type <span className="text-red-500">*</span></span>
          <select className={input} value={form.leaveType} onChange={(event) => setForm({ ...form, leaveType: event.target.value })}>
            {leaveTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>

        <label className="grid gap-1.5 text-xs">
          <span className="font-medium text-foreground">Leave Duration <span className="text-red-500">*</span></span>
          <select className={input} value={form.leaveDuration} onChange={(event) => updateDuration(event.target.value)}>
            {leaveDurations.map((duration) => <option key={duration}>{duration}</option>)}
          </select>
        </label>

        {form.leaveDuration === "Multiple Days" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-xs">
              <span className="font-medium text-foreground">From Date <span className="text-red-500">*</span></span>
              <input className={input} type="date" value={toDateInputValue(form.fromDate)} onChange={(event) => handleFromDateChange(event.target.value)} required />
            </label>
            <label className="grid gap-1.5 text-xs">
              <span className="font-medium text-foreground">To Date <span className="text-red-500">*</span></span>
              <input
                className={input}
                type="date"
                min={toDateInputValue(form.fromDate)}
                value={toDateInputValue(form.toDate)}
                onChange={(event) => handleToDateChange(event.target.value)}
                required
              />
            </label>
          </div>
        ) : (
          <div className={`grid gap-4 ${form.leaveDuration === "Half Day" ? "md:grid-cols-2" : ""}`}>
            <label className="grid gap-1.5 text-xs">
              <span className="font-medium text-foreground">Leave Date <span className="text-red-500">*</span></span>
              <input className={input} type="date" value={toDateInputValue(form.leaveDate)} onChange={(event) => updateLeaveDate(event.target.value)} required />
            </label>
            {form.leaveDuration === "Half Day" && (
              <label className="grid gap-1.5 text-xs">
                <span className="font-medium text-foreground">Shift <span className="text-red-500">*</span></span>
                <select
                  className={input}
                  value={form.halfDayPeriod}
                  onChange={(event) => setForm({ ...form, halfDayPeriod: event.target.value })}
                  required
                >
                  {halfDayPeriods.map((period) => <option key={period}>{period}</option>)}
                </select>
              </label>
            )}
          </div>
        )}

        <div className={`rounded-md px-3 py-2 text-xs ${exceedsLeaveBalance ? "border border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200" : "bg-muted/60 text-foreground"}`}>
          <div className="flex items-center justify-between gap-3">
            <span>Requested Leave</span>
            <span className="font-semibold">{estimatedLeaveDays === null ? "--" : `${estimatedLeaveDays} Days`}</span>
          </div>
          {selectedLeaveDaysLeft !== null && (
            <div className="mt-1 flex items-center justify-between gap-3 text-muted-foreground">
              <span>Available</span>
              <span>{selectedLeaveDaysLeft} Days</span>
            </div>
          )}
          {exceedsLeaveBalance && (
            <p className="mt-1 text-[11px] font-medium">Requested days cannot be greater than available leave balance.</p>
          )}
        </div>

        <label className="grid gap-1.5 text-xs">
          <span className="font-medium text-foreground">Reason for Leave <span className="text-red-500">*</span></span>
          <textarea
            className={textarea}
            rows="3"
            value={form.reasonForLeave}
            onChange={(event) => setForm({ ...form, reasonForLeave: event.target.value })}
            required
          />
        </label>

        <label className="grid gap-1.5 text-xs">
          <span className="font-medium text-foreground">Work Handover <span className="font-normal text-muted-foreground">- Optional</span></span>
          <textarea
            className={textarea}
            rows="3"
            value={form.workHandover}
            onChange={(event) => setForm({ ...form, workHandover: event.target.value })}
          />
        </label>

        <label className="grid gap-1.5 text-xs">
          <span className="font-medium text-foreground">Supporting Document <span className="font-normal text-muted-foreground">- Optional</span></span>
          <div className="relative rounded-md border border-dashed border-border bg-background p-5 text-center hover:bg-muted/30">
            <UploadCloud className="mx-auto h-7 w-7 text-foreground" />
            <p className="mt-2 text-xs font-medium text-foreground">
              {form.supportingDocument ? form.supportingDocument.name : "Click to upload or drag and drop"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or PDF (Max. 5 MB)</p>
            <input
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(event) => setForm({ ...form, supportingDocument: event.target.files?.[0] || null })}
            />
          </div>
        </label>

        <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-3 text-xs text-orange-900 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-200">
          <p className="font-medium">Your leave is not confirmed until it is approved by Admin.</p>
          <p className="mt-1">Please continue your assigned responsibilities unless approval is received.</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-6 py-2.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          Cancel
        </button>
        <button disabled={isPending || exceedsLeaveBalance} className="atl-primary rounded-md px-8 py-2.5 text-xs font-medium disabled:opacity-60">
          {isPending ? "Submitting..." : "Submit Leave Request"}
        </button>
      </div>
    </form>
  );
}

function MonthFilterControl({ filters, onFilterChange }) {
  const label = useMemo(
    () => {
      if (filters.month === "All") return `All ${filters.year}`;
      return new Date(filters.year, filters.month - 1, 1).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });
    },
    [filters.month, filters.year]
  );

  const shiftMonth = (direction) => {
    const baseMonth = filters.month === "All" ? now.getMonth() : filters.month - 1;
    const date = new Date(filters.year, baseMonth + direction, 1);
    onFilterChange((current) => ({
      ...current,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    }));
  };

  return (
    <div className="flex h-8 overflow-hidden rounded-md border border-border bg-background text-xs">
      <button
        type="button"
        onClick={() => shiftMonth(-1)}
        className="grid w-8 place-items-center text-foreground hover:bg-muted"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <span className="grid min-w-[104px] place-items-center border-x border-border px-3 text-xs font-medium text-foreground">
        {label}
      </span>
      <button
        type="button"
        onClick={() => shiftMonth(1)}
        className="grid w-8 place-items-center text-foreground hover:bg-muted"
        aria-label="Next month"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function LeaveMetric({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background p-0.5 text-xs">
      <span className="truncate px-1 text-muted-foreground">{label}</span>
      <StatusPill tone={tone}>{value}</StatusPill>
    </div>
  );
}

function LeaveBalanceSummary({
  leaveBalance,
  monthlyLeaveDays,
  monthlyLeaveRequests,
  monthLabel,
  filters,
  onFilterChange,
}) {
  const casualLeave = leaveBalance?.find((balance) => balance.leaveType === "Casual Leave");
  const emergencyLeave = leaveBalance?.find((balance) => balance.leaveType === "Emergency Leave");
  const pendingLeaves = (monthlyLeaveRequests || []).filter(
    (leave) => String(displayText(leave.leaveStatus || leave.status, "Pending")).toLowerCase() === "pending"
  ).length;

  return (
    <Panel>
      <SectionTitle
        icon={Umbrella}
        action={<MonthFilterControl filters={filters} onFilterChange={onFilterChange} />}
      >
        Leave Balance - {monthLabel}
      </SectionTitle>
      <div className="grid gap-2 p-2 sm:grid-cols-2 xl:grid-cols-4">
        <LeaveMetric label="Casual Leaves" value={casualLeave ? `${displayText(casualLeave.balance)}` : "--"} tone="blue" />
        <LeaveMetric label="Emergency Leaves" value={emergencyLeave ? `${displayText(emergencyLeave.balance)}` : "--"} tone="orange" />
        <LeaveMetric label="Used Leaves" value={`${monthlyLeaveDays} Days`} tone="purple" />
        <LeaveMetric label="Pending Leaves" value={pendingLeaves} tone="gray" />
      </div>
    </Panel>
  );
}

function LeaveRequestsList({
  rows,
  cancelLeaveMutation,
  monthLabel,
  onAddCorrection,
}) {
  const [selectedLeave, setSelectedLeave] = useState(null);

  return (
    <Panel>
      <SectionTitle icon={Umbrella}>
        Leave Requests - {monthLabel}
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-xs">
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
                  <td className="max-w-[260px] px-4 py-3 text-muted-foreground">{displayText(leave.reasonForLeave || leave.reason, "--")}</td>
                  <td className="px-4 py-3"><StatusPill tone={statusTone(leaveStatus)}>{leaveStatus}</StatusPill></td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted"
                          aria-label="Leave request actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => setSelectedLeave(leave)}>
                          <Eye className="h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddCorrection(leave)}>
                          <FilePenLine className="h-4 w-4" />
                          Add Correction
                        </DropdownMenuItem>
                        {leaveId && leaveStatus === "Pending" && (
                          <DropdownMenuItem
                            disabled={cancelLeaveMutation.isPending}
                            onClick={() => cancelLeaveMutation.mutate(leaveId)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
      <LeaveRequestDetailDialog leave={selectedLeave} onOpenChange={(open) => !open && setSelectedLeave(null)} />
    </Panel>
  );
}

function LeaveRequestDetailDialog({ leave, onOpenChange }) {
  const open = Boolean(leave);
  if (!leave) return null;

  const leaveStatus = displayText(leave.leaveStatus || leave.status, "Pending");
  const leaveDays = displayText(leave.leaveDays || leave.totalDays || leave.days);
  const details = [
    ["Leave Type", displayText(leave.leaveType || leave.type, "Leave Request")],
    ["Status", <StatusPill key="status" tone={statusTone(leaveStatus)}>{leaveStatus}</StatusPill>],
    ["From Date", formatShortDate(leave.fromDate || leave.startDate)],
    ["To Date", formatShortDate(leave.toDate || leave.endDate)],
    ["Duration", displayText(leave.leaveDuration || leave.duration)],
    ["Leave Days", leaveDays === "--" ? leaveDays : `${leaveDays} Days`],
    ["Reason", displayText(leave.reasonForLeave || leave.reason)],
    ["Work Handover", displayText(leave.workHandover)],
    ["Admin Remark", displayText(leave.approval?.remarks || leave.adminRemark || leave.adminRemarks || leave.adminNote || leave.adminNotes || leave.reviewNote)],
    // ["Admin Notes", displayText(leave.notes || leave.remark || leave.remarks)],
    ["Requested At", formatShortDate(leave.requestedAt || leave.submittedAt || leave.createdAt)],
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="atl-card max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">Leave Request Detail</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 text-xs">
          {details.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[130px_1fr] gap-3 rounded-md border border-border px-3 py-2">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
