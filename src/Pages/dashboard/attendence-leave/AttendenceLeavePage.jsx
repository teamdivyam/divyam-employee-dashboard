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
import EmployeeV2Service from "@/services/employee-v2.service";
import {
  HALF_DAY_PERIODS,
  LEAVE_DURATIONS,
  LEAVE_TYPES,
  normalizeLeaveRequest,
} from "./leave.constants";
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePenLine,
  FileText,
  MoreHorizontal,
  Pencil,
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
  leavePolicyId: "",
  leaveType: "",
  fromDate: todayIso,
  toDate: todayIso,
  duration: "Full Day",
  halfDayPeriod: "First Half",
  reason: "",
  workHandover: "",
};

const attendanceCorrectionFieldMap = {
  "Check-in Time": "firstCheckIn",
  "Check-out Time": "lastCheckOut",
  "Duty Type": "dutyType",
  Notes: "notes",
};
const attendanceCorrectionFields = Object.keys(attendanceCorrectionFieldMap);
const attendanceDutyTypes = ["Office Duty", "Event Duty", "Field Duty", "Remote Duty", "Work From Home", "Other"];
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

function getFiscalYear(dateValue) {
  const date = dateValue ? new Date(dateValue) : new Date();
  const validDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const startYear = validDate.getMonth() + 1 >= 4 ? validDate.getFullYear() : validDate.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
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
  if (form.duration === "Half Day") return form.fromDate ? 0.5 : null;
  if (form.duration === "Full Day") return form.fromDate ? 1 : null;
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
    balance.currentBalance,
    balance.available,
    balance.closingBalance,
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

function formatWorkingMinutes(minutes) {
  if (minutes === null || minutes === undefined || !Number.isFinite(Number(minutes))) return "";
  const totalMinutes = Number(minutes);
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

function normalizeAttendanceRecord(record = {}) {
  const punches = Array.isArray(record.punches) ? record.punches : [];
  const latestPunch = punches.at(-1);
  const location = latestPunch?.location || null;

  return {
    ...record,
    date: record.workDate,
    attendanceDate: record.workDate,
    checkInTime: record.firstCheckIn,
    checkOutTime: record.lastCheckOut,
    workingHours: formatWorkingMinutes(record.workingMinutes),
    punches,
    location,
    locationType: location?.type,
    locationName: location?.name,
    locationAddress: location?.address,
    latitude: location?.latitude,
    longitude: location?.longitude,
    attendanceSource: latestPunch?.source,
  };
}

async function loadAttendanceRecordDetail(attendanceId) {
  const response = await EmployeeV2Service.getAttendanceRecord(attendanceId);
  return normalizeAttendanceRecord(response.data?.data?.record || {});
}

function getRecordId(record) {
  if (!record) return "";
  if (typeof record === "string") return record;
  return record._id || record.id || "";
}

function isValidObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || ""));
}

function getAttendanceCorrectionFieldLabel(field) {
  return Object.entries(attendanceCorrectionFieldMap).find(([, value]) => value === field)?.[0] || field;
}

function normalizeAttendanceCorrection(correction = {}) {
  return {
    ...correction,
    correctionFor: "Attendance",
    attendanceId: correction.targetId,
    correctionStatus: correction.status,
    reviewedBy: correction.reviewedBy ?? null,
    reviewedAt: correction.reviewedAt ?? null,
    adminRemarks: correction.adminRemarks ?? null,
  };
}

function getCorrectionField(correction = {}) {
  if (Array.isArray(correction.changes) && correction.changes.length) {
    return correction.changes.map((change) => getAttendanceCorrectionFieldLabel(change.field)).join(", ");
  }

  return displayText(
    correction.whatNeedsToBeCorrected || correction.whatNeedsToBeChanged || correction.correctionType,
    "Correction Request"
  );
}

function requestsNullCorrection(value) {
  return /^(null|remove|clear)(\b.*)?$/i.test(String(value || "").trim());
}

function parseCorrectionDateTime(value, attendanceDate) {
  const rawValue = String(value || "").trim();
  if (requestsNullCorrection(rawValue)) return null;

  const directDate = new Date(rawValue);
  if (!Number.isNaN(directDate.getTime()) && /\d{4}-\d{2}-\d{2}/.test(rawValue)) {
    return directDate.toISOString();
  }

  const isoValue = rawValue.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?/)?.[0];
  if (isoValue) {
    const isoDate = new Date(isoValue);
    if (!Number.isNaN(isoDate.getTime())) return isoDate.toISOString();
  }

  const timeMatch = rawValue.match(/(?:^|\s)(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\b/i);
  const dateValue = toDateInputValue(attendanceDate);
  if (!timeMatch || !dateValue) {
    throw new Error("Enter the requested punch time, for example 7:30 PM, or provide an ISO timestamp");
  }

  let hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2] || 0);
  const meridiem = timeMatch[3]?.toUpperCase();
  if (minutes > 59 || (meridiem && (hours < 1 || hours > 12)) || (!meridiem && hours > 23)) {
    throw new Error("Enter a valid requested punch time");
  }
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
}

function buildAttendanceCorrectionChange(form) {
  const field = attendanceCorrectionFieldMap[form.whatNeedsToBeCorrected];
  const rawValue = form.requestedCorrection.trim();
  if (!field) throw new Error("Select a supported attendance correction field");

  if (field === "firstCheckIn" || field === "lastCheckOut") {
    return {
      field,
      requestedValue: parseCorrectionDateTime(
        rawValue,
        form.attendanceRecord?.workDate || form.attendanceRecord?.attendanceDate || form.attendanceRecord?.date
      ),
    };
  }

  if (field === "dutyType") {
    const dutyType = attendanceDutyTypes.find((value) => value.toLowerCase() === rawValue.toLowerCase());
    if (!dutyType) throw new Error(`Duty type must be one of: ${attendanceDutyTypes.join(", ")}`);
    return { field, requestedValue: dutyType };
  }

  return { field, requestedValue: requestsNullCorrection(rawValue) ? null : rawValue };
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
          type: "Corporate Office",
          name: "Office",
          address: `${latitude}, ${longitude}`,
          latitude,
          longitude,
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
  const [leavePage, setLeavePage] = useState(1);
  const [leaveForm, setLeaveForm] = useState(defaultLeaveForm);
  const [correctionForm, setCorrectionForm] = useState(defaultCorrectionForm);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isCorrectionDialogOpen, setIsCorrectionDialogOpen] = useState(false);
  const [leaveToCancel, setLeaveToCancel] = useState(null);
  const [cancelLeaveRemarks, setCancelLeaveRemarks] = useState("");
  const [recentCorrectionRequest, setRecentCorrectionRequest] = useState(null);
  const [correctionTypeFilter, setCorrectionTypeFilter] = useState("All");
  const leaveFiscalYear = useMemo(() => getFiscalYear(leaveForm.fromDate), [leaveForm.fromDate]);

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
      fromDate: toDateInputValue(new Date(filters.year, filters.month - 1, 1)),
      toDate: toDateInputValue(new Date(filters.year, filters.month, 0)),
      sortOrder: "desc",
    }),
    [filters.month, filters.year]
  );

  const summaryQuery = useQuery({
    queryKey: ["attendance-summary", historyFilters.fromDate, historyFilters.toDate],
    queryFn: async () => {
      const response = await EmployeeV2Service.getAttendanceSummary({
        fromDate: historyFilters.fromDate,
        toDate: historyFilters.toDate,
      });
      return response.data?.data?.summary || {};
    },
  });

  const todayAttendanceQuery = useQuery({
    queryKey: ["attendance-me-today"],
    queryFn: async () => {
      const response = await EmployeeV2Service.getTodayAttendance();
      return response.data?.data || {};
    },
  });

  const historyQuery = useQuery({
    queryKey: ["attendance-leave-history", historyFilters],
    queryFn: async () => {
      const response = await EmployeeV2Service.getAttendanceRecords(historyFilters);
      return response.data?.data || {};
    },
  });

  const leavePoliciesQuery = useQuery({
    queryKey: ["employee-leave-policies", leaveFiscalYear],
    queryFn: async () => {
      const response = await EmployeeV2Service.getApplicableLeavePolicies({
        fiscalYear: leaveFiscalYear,
        page: 1,
        limit: 100,
      });
      return response.data?.data || {};
    },
  });

  const leaveBalanceQuery = useQuery({
    queryKey: ["employee-leave-balances", leaveFiscalYear],
    queryFn: async () => {
      const response = await EmployeeV2Service.getLeaveBalances({
        fiscalYear: leaveFiscalYear,
      });
      return response.data?.data || {};
    },
  });

  const leaveRequestFilters = useMemo(() => {
    const isAllMonths = leaveFilters.month === "All";
    return {
      fromDate: toDateInputValue(new Date(leaveFilters.year, isAllMonths ? 0 : leaveFilters.month - 1, 1)),
      toDate: toDateInputValue(new Date(leaveFilters.year, isAllMonths ? 12 : leaveFilters.month, 0)),
      page: leavePage,
      limit: 20,
      sortOrder: "desc",
    };
  }, [leaveFilters.month, leaveFilters.year, leavePage]);

  const leaveRequestsQuery = useQuery({
    queryKey: ["employee-leave-requests", leaveRequestFilters],
    queryFn: async () => {
      const response = await EmployeeV2Service.getMyLeaveRequests(leaveRequestFilters);
      return response.data?.data || {};
    },
  });

  const leavePolicies = useMemo(() => {
    const policies = leavePoliciesQuery.data?.policies;
    return Array.isArray(policies) ? policies : [];
  }, [leavePoliciesQuery.data?.policies]);

  useEffect(() => {
    if (!leavePolicies.length) return;

    setLeaveForm((current) => {
      const currentPolicy = leavePolicies.find((policy) => policy._id === current.leavePolicyId);
      if (currentPolicy) {
        return current.leaveType === currentPolicy.leaveType
          ? current
          : { ...current, leaveType: currentPolicy.leaveType };
      }

      const firstDayPolicy = leavePolicies.find((policy) => policy.unit === "Days") || leavePolicies[0];
      return {
        ...current,
        leavePolicyId: firstDayPolicy._id,
        leaveType: firstDayPolicy.leaveType,
        duration: firstDayPolicy.requestRules?.allowHalfDay === false && current.duration === "Half Day"
          ? "Full Day"
          : current.duration,
      };
    });
  }, [leavePolicies]);

  const actionMutation = useMutation({
    mutationFn: async (action) => {
      const location = await getCurrentLocationPayload();
      const isCheckIn = action === "checkIn";

      return EmployeeV2Service.markAttendancePunch({
        punchType: isCheckIn ? "Check_In" : "Check_Out",
        ...(isCheckIn ? { dutyType: "Office Duty" } : {}),
        location,
        notes: null,
      });
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Attendance updated");
      const punchData = response.data?.data || {};
      queryClient.setQueryData(["attendance-me-today"], (current = {}) => ({
        ...current,
        attendanceRecord: punchData.attendanceRecord || current.attendanceRecord || null,
        punches: punchData.punch ? [...(current.punches || []), punchData.punch] : current.punches || [],
      }));
      queryClient.invalidateQueries({ queryKey: ["attendance-me-today"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-history"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-balance"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || "Unable to update attendance"),
  });

  const leaveMutation = useMutation({
    mutationFn: () => EmployeeV2Service.createLeaveRequest({
      leavePolicyId: leaveForm.leavePolicyId,
      leaveType: leaveForm.leaveType,
      fromDate: toDateInputValue(leaveForm.fromDate),
      toDate: toDateInputValue(leaveForm.toDate),
      duration: leaveForm.duration,
      ...(leaveForm.duration === "Half Day" ? { halfDayPeriod: leaveForm.halfDayPeriod } : {}),
      reason: leaveForm.reason.trim(),
      workHandover: leaveForm.workHandover.trim(),
    }),
    onSuccess: (response) => {
      const responseData = response.data?.data || {};
      const createdRequest = responseData.request ? normalizeLeaveRequest(responseData.request) : null;
      const requestedDays = createdRequest?.requestedDays;
      const chargeableDates = Array.isArray(responseData.chargeableDates) ? responseData.chargeableDates : [];

      toast.success(response.data?.message || "Leave request submitted", {
        description: requestedDays == null
          ? undefined
          : `${requestedDays} day${requestedDays === 1 ? "" : "s"} requested${chargeableDates.length ? ` across ${chargeableDates.length} chargeable date${chargeableDates.length === 1 ? "" : "s"}` : ""}.`,
      });

      setLeaveForm(defaultLeaveForm);
      setIsLeaveDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["attendance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["employee-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["employee-leave-request-detail"] });
      queryClient.invalidateQueries({ queryKey: ["employee-leave-balances"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || "Unable to submit leave request"),
  });

  const cancelLeaveMutation = useMutation({
    mutationFn: ({ leaveRequestId, remarks }) =>
      EmployeeV2Service.cancelMyLeaveRequest({ leaveRequestId, remarks }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Leave request cancelled");
      setLeaveToCancel(null);
      setCancelLeaveRemarks("");
      queryClient.invalidateQueries({ queryKey: ["attendance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-me-today"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-history"] });
      queryClient.invalidateQueries({ queryKey: ["employee-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["employee-leave-request-detail"] });
      queryClient.invalidateQueries({ queryKey: ["employee-leave-balances"] });
      queryClient.invalidateQueries({ queryKey: ["employee-leave-ledger"] });
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

      return EmployeeV2Service.createAttendanceCorrection({
        targetId: correctionForm.attendanceId,
        changes: [buildAttendanceCorrectionChange(correctionForm)],
        reason: correctionForm.reasonForCorrection.trim(),
      });
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Correction request submitted");
      const createdCorrection = response.data?.data?.correction;
      setRecentCorrectionRequest(
        correctionForm.correctionFor === "Attendance" && createdCorrection
          ? normalizeAttendanceCorrection(createdCorrection)
          : null
      );
      setCorrectionForm(defaultCorrectionForm);
      setIsCorrectionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["attendance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-history"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-corrections"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || "Unable to submit correction request"),
  });

  const cancelCorrectionMutation = useMutation({
    mutationFn: (correctionId) => {
      if (!/^[a-f\d]{24}$/i.test(correctionId)) {
        throw new Error("A valid attendance correction is required");
      }
      return EmployeeV2Service.cancelAttendanceCorrection({ correctionId });
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Attendance correction cancelled");
      const cancelledCorrection = response.data?.data?.correction;
      if (cancelledCorrection) {
        const normalizedCorrection = normalizeAttendanceCorrection(cancelledCorrection);
        setRecentCorrectionRequest(normalizedCorrection);
        queryClient.setQueryData(
          ["attendance-correction-detail", normalizedCorrection._id],
          normalizedCorrection
        );
      }
      queryClient.invalidateQueries({ queryKey: ["attendance-corrections"] });
    },
    onError: (error) => toast.error(
      error.response?.data?.message || error.message || "Unable to cancel attendance correction"
    ),
  });

  const correctionsQuery = useQuery({
    queryKey: ["attendance-corrections", 1, 20, "desc"],
    queryFn: async () => {
      const response = await EmployeeV2Service.getAttendanceCorrections({
        page: 1,
        limit: 20,
        sortOrder: "desc",
      });
      return response.data?.data || {};
    },
  });

  const correctionDetailMutation = useMutation({
    mutationFn: async (correction) => {
      const correctionId = getRecordId(correction);
      if (!/^[a-f\d]{24}$/i.test(correctionId)) {
        throw new Error("A valid attendance correction is required");
      }

      const response = await EmployeeV2Service.getAttendanceCorrection(correctionId);
      const correctionDetail = normalizeAttendanceCorrection(response.data?.data?.correction || {});
      if (!/^[a-f\d]{24}$/i.test(correctionDetail.targetId || "")) {
        throw new Error("The correction does not reference a valid attendance record");
      }

      const attendanceRecord = await loadAttendanceRecordDetail(correctionDetail.targetId);
      return { correction: correctionDetail, attendanceRecord };
    },
    onSuccess: ({ correction, attendanceRecord }) => {
      const firstChange = Array.isArray(correction.changes) ? correction.changes[0] : null;
      queryClient.setQueryData(["attendance-correction-detail", correction._id], correction);
      setCorrectionForm({
        ...defaultCorrectionForm,
        correctionId: correction._id,
        correctionFor: "Attendance",
        attendanceId: correction.targetId,
        attendanceRecord,
        whatNeedsToBeCorrected: getAttendanceCorrectionFieldLabel(firstChange?.field) || "Notes",
        requestedCorrection: firstChange
          ? (firstChange.requestedValue === null ? "null" : String(firstChange.requestedValue))
          : "",
        reasonForCorrection: correction.reason || "",
      });
      setIsCorrectionDialogOpen(true);
    },
    onError: (error) => toast.error(
      error.response?.data?.message || error.message || "Unable to load attendance correction"
    ),
  });

  const summary = summaryQuery.data || {};
  const todayData = todayAttendanceQuery.data || {};
  const todayAttendance = todayData.attendanceRecord || {};
  const punches = Array.isArray(todayData.punches) ? todayData.punches : [];
  const lastPunch = punches.at(-1);
  const punchLocation = lastPunch?.location || punches[0]?.location || null;
  const workSchedule = todayData.workSchedule || {};
  const normalizedTodayAttendance = {
    ...todayAttendance,
    date: todayData.workDate,
    attendanceDate: todayData.workDate,
    status: todayAttendance.status || (todayData.holiday ? "Holiday" : "Not Marked"),
    checkInTime: todayAttendance.firstCheckIn,
    checkOutTime: todayAttendance.lastCheckOut,
    workingMinutes: todayAttendance.workingMinutes,
    workingHours: formatWorkingMinutes(todayAttendance.workingMinutes),
    location: punchLocation,
    locationType: punchLocation?.type,
    locationName: punchLocation?.name,
    locationAddress: punchLocation?.address,
    latitude: punchLocation?.latitude,
    longitude: punchLocation?.longitude,
    attendanceSource: lastPunch?.source,
    notes: lastPunch?.notes,
    workSchedule,
  };
  const resolvedTodayStatus = resolvePresenceStatus({
    ...normalizedTodayAttendance,
  });
  const hasCheckInPunch = punches.some((punch) => punch.punchType === "Check_In");
  const hasCheckOutPunch = punches.some((punch) => punch.punchType === "Check_Out");
  const attendanceLocked = todayAttendance.payrollLocked === true;
  const visibleAttendanceAction = hasCheckOutPunch ? "hidden" : hasCheckInPunch ? "checkOut" : "checkIn";
  const todaysDuty = todayAttendance.dutyType ? { dutyType: todayAttendance.dutyType } : {};
  const attendanceRecords = historyQuery.data?.records;
  const monthlyRows = useMemo(
    () => (Array.isArray(attendanceRecords) ? attendanceRecords.map(normalizeAttendanceRecord) : []),
    [attendanceRecords]
  );
  const correctionAttendanceRows = monthlyRows.length
    ? monthlyRows
    : normalizedTodayAttendance._id
      ? [normalizedTodayAttendance]
      : [];
  const attendanceRules = [];
  const correctionRecords = correctionsQuery.data?.corrections;
  const recentCorrections = useMemo(() => {
    const listedCorrections = Array.isArray(correctionRecords)
      ? correctionRecords.map(normalizeAttendanceCorrection)
      : [];
    const mergedCorrections = recentCorrectionRequest
      ? [recentCorrectionRequest, ...listedCorrections]
      : listedCorrections;
    const correctionIds = new Set();

    return mergedCorrections.filter((correction) => {
      const correctionId = getRecordId(correction);
      if (!correctionId || correctionIds.has(correctionId)) return false;
      correctionIds.add(correctionId);
      return true;
    });
  }, [correctionRecords, recentCorrectionRequest]);
  const filteredCorrections = recentCorrections.filter((correction) => (
    correctionTypeFilter === "All" ||
    getCorrectionField(correction) === correctionTypeFilter ||
    correction.changes?.some((change) => getAttendanceCorrectionFieldLabel(change.field) === correctionTypeFilter)
  ));
  const leaveRequestRecords = leaveRequestsQuery.data?.leaveRequests || leaveRequestsQuery.data?.requests;
  const leaveRequests = useMemo(
    () => (Array.isArray(leaveRequestRecords) ? leaveRequestRecords.map(normalizeLeaveRequest) : []),
    [leaveRequestRecords]
  );
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
  const monthlyLeaveRequests = leaveRequests;
  const leaveRequestPagination = leaveRequestsQuery.data?.pagination || {
    page: leavePage,
    limit: 20,
    total: 0,
    totalPages: 0,
  };
  const leaveBalanceResponse = leaveBalanceQuery.data || {};
  const leaveBalanceRecords = leaveBalanceResponse.balances || leaveBalanceResponse.leaveBalances || leaveBalanceResponse.leaveBalance;
  const leaveBalance = useMemo(() => {
    const balances = Array.isArray(leaveBalanceRecords) ? leaveBalanceRecords : [];
    return leavePolicies.map((policy) => {
      const policyBalance = balances.find((balance) => (
        balance.leavePolicy?._id === policy._id ||
        balance.leavePolicyId === policy._id ||
        balance.policyId === policy._id ||
        balance.leaveType === policy.leaveType
      ));
      return {
        ...policy,
        ...(policyBalance || {}),
        leavePolicy: policyBalance?.leavePolicy || policy,
        leaveType: policy.leaveType,
      };
    });
  }, [leaveBalanceRecords, leavePolicies]);
  const leaveDurationOptions = LEAVE_DURATIONS;
  const halfDayPeriodOptions = HALF_DAY_PERIODS;
  const hasLeaveBalanceData = leaveBalance.some((item) => getAvailableLeaveDays(item) !== null);
  const totalLeaveBalance = leaveBalance.reduce((total, item) => total + (getAvailableLeaveDays(item) || 0), 0);
  const selectedLeavePolicy = leavePolicies.find((policy) => policy._id === leaveForm.leavePolicyId) || null;
  const selectedLeaveBalance = leaveBalance.find((item) => item._id === leaveForm.leavePolicyId || item.leavePolicy?._id === leaveForm.leavePolicyId);
  const selectedLeaveDaysLeft = getAvailableLeaveDays(selectedLeaveBalance);
  const selectedRequestRules = selectedLeavePolicy?.requestRules || {};
  const calendarSpanDays = getRequestedLeaveDays(leaveForm);
  const monthLabel = useMemo(
    () => new Date(filters.year, filters.month - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    [filters.month, filters.year]
  );
  const leaveMonthLabel = useMemo(
    () => leaveFilters.month === "All"
      ? String(leaveFilters.year)
      : new Date(leaveFilters.year, leaveFilters.month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    [leaveFilters.month, leaveFilters.year]
  );
  const monthlyLeaveDays = monthlyLeaveRequests.reduce(
    (total, leave) => total + (Number(leave.requestedDays || leave.leaveDays || leave.totalDays || leave.days) || 0),
    0
  );
  const attendanceHealth = {
    presentDays: summary.presentDays,
    absentDays: summary.absentDays,
    leaveDays: Number(summary.paidLeaveDays || 0) + Number(summary.unpaidLeaveDays || 0),
  };
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
    correctionDetailMutation.mutate(correction);
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

  const openCancelLeaveDialog = (leave) => {
    const leaveId = getRecordId(leave);
    const leaveStatus = leave?.status || leave?.leaveStatus;
    if (!isValidObjectId(leaveId)) {
      toast.error("A valid leave request is required.");
      return;
    }
    if (leaveStatus !== "Pending" && leaveStatus !== "Approved") {
      toast.error("Only pending or approved leave requests can be cancelled.");
      return;
    }
    setCancelLeaveRemarks("");
    setLeaveToCancel(leave);
  };

  const confirmLeaveCancellation = (event) => {
    event.preventDefault();
    const leaveRequestId = getRecordId(leaveToCancel);
    const remarks = cancelLeaveRemarks.trim();
    if (!isValidObjectId(leaveRequestId)) {
      toast.error("A valid leave request is required.");
      return;
    }
    if (remarks.length > 1000) {
      toast.error("Cancellation remarks cannot exceed 1000 characters.");
      return;
    }
    cancelLeaveMutation.mutate({ leaveRequestId, remarks });
  };

  const submitLeave = (event) => {
    event.preventDefault();
    if (!selectedLeavePolicy || !leaveForm.leavePolicyId) {
      toast.error("Select an applicable leave policy.");
      return;
    }
    if (selectedLeavePolicy.unit !== "Days") {
      toast.error("Only day-based leave policies can currently be submitted.");
      return;
    }
    if (!LEAVE_TYPES.includes(leaveForm.leaveType) || leaveForm.leaveType !== selectedLeavePolicy.leaveType) {
      toast.error("The selected leave type does not match the leave policy.");
      return;
    }
    const reason = leaveForm.reason.trim();
    const workHandover = leaveForm.workHandover.trim();
    if (reason.length < 3 || reason.length > 2000) {
      toast.error("Reason for leave must be between 3 and 2000 characters.");
      return;
    }
    if (workHandover.length > 2000) {
      toast.error("Work handover cannot exceed 2000 characters.");
      return;
    }
    if (!leaveDurationOptions.includes(leaveForm.duration)) {
      toast.error("Select a valid leave duration.");
      return;
    }
    if (leaveForm.duration === "Half Day" && selectedRequestRules.allowHalfDay === false) {
      toast.error("The selected policy does not allow half-day leave.");
      return;
    }
    if (leaveForm.duration === "Half Day" && !halfDayPeriodOptions.includes(leaveForm.halfDayPeriod)) {
      toast.error("Select a valid half-day period.");
      return;
    }
    if (calendarSpanDays === null || !leaveForm.fromDate || !leaveForm.toDate) {
      toast.error("To date cannot be before from date.");
      return;
    }

    const fromDate = toDateInputValue(leaveForm.fromDate);
    const toDate = toDateInputValue(leaveForm.toDate);
    if (leaveForm.duration === "Multiple Days" && fromDate === toDate) {
      toast.error("Multiple-day leave must span more than one calendar date.");
      return;
    }
    if (leaveForm.duration !== "Multiple Days" && fromDate !== toDate) {
      toast.error(`${leaveForm.duration} requests must use the same from and to date.`);
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
    if (correctionForm.correctionFor !== "Leave" && !/^[a-f\d]{24}$/i.test(correctionForm.attendanceId)) {
      toast.error("A valid attendance record is required!");
      return;
    }
    if (correctionForm.correctionFor !== "Leave" && correctionForm.attendanceRecord?.payrollLocked) {
      toast.error("Attendance is locked for payroll and cannot be corrected");
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
    if (correctionForm.correctionFor !== "Leave") {
      const reasonLength = correctionForm.reasonForCorrection.trim().length;
      if (reasonLength < 3 || reasonLength > 1000) {
        toast.error("Reason must be between 3 and 1,000 characters!");
        return;
      }
    }

    correctionMutation.mutate();
  };

  const submitAttendanceAction = (action) => {
    if (attendanceLocked) {
      toast.error("Attendance is locked for payroll");
      return;
    }

    if (visibleAttendanceAction === "hidden") {
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
      sub: summary.totalRecords === null || summary.totalRecords === undefined ? "--" : `Out of ${summary.totalRecords} Days`,
      icon: summaryIcons.present,
      tone: "green",
    },
    {
      label: "Late / Absent",
      value: summary.lateEntries === null || summary.lateEntries === undefined ? "--" : `${summary.lateEntries} Late`,
      sub: summary.absentDays === null || summary.absentDays === undefined ? "--" : `${summary.absentDays} Absent`,
      icon: summaryIcons.late,
      tone: "red",
    },
    {
      label: "Total Leave Balance",
      value: hasLeaveBalanceData ? `${totalLeaveBalance} Days` : "--",
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
          isBusy={actionMutation.isPending || todayAttendanceQuery.isPending || todayAttendanceQuery.isError || attendanceLocked}
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
          {summaryQuery.isLoading || historyQuery.isLoading || todayAttendanceQuery.isLoading ? (
            <div className="atl-card p-8 text-center text-sm text-muted-foreground">Loading attendance details...</div>
          ) : (
            <>
              {activeTab === "today" && (
                <>
                  <TodayPanel attendance={normalizedTodayAttendance} duty={todaysDuty} />
                  <AttendanceTable
                    rows={latestAttendanceRows}
                    monthLabel={monthLabel}
                    loadAttendanceDetail={loadAttendanceRecordDetail}
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
                  loadAttendanceDetail={loadAttendanceRecordDetail}
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
                    onFilterChange={(updater) => {
                      setLeaveFilters(updater);
                      setLeavePage(1);
                    }}
                  />
                  <LeaveRequestsList
                    rows={monthlyLeaveRequests}
                    pagination={leaveRequestPagination}
                    onPageChange={setLeavePage}
                    isLoading={leaveRequestsQuery.isLoading || leaveRequestsQuery.isFetching}
                    onCancelLeave={openCancelLeaveDialog}
                    isCancelling={cancelLeaveMutation.isPending}
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
                  onCancel={(correction) => {
                    const correctionId = correction._id || correction.id;
                    if (correctionId) cancelCorrectionMutation.mutate(correctionId);
                  }}
                  isCancelling={cancelCorrectionMutation.isPending}
                  isLoadingDetail={correctionDetailMutation.isPending}
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
          alerts={requestNotifications}
          setActiveTab={setActiveTab}
        />
      </div>
      <LeaveRequestDialog
        open={isLeaveDialogOpen}
        onOpenChange={setIsLeaveDialogOpen}
        form={leaveForm}
        setForm={setLeaveForm}
        leavePolicies={leavePolicies}
        leaveDurations={leaveDurationOptions}
        halfDayPeriods={halfDayPeriodOptions}
        selectedLeavePolicy={selectedLeavePolicy}
        selectedLeaveDaysLeft={selectedLeaveDaysLeft}
        calendarSpanDays={calendarSpanDays}
        isPoliciesLoading={leavePoliciesQuery.isLoading}
        policiesError={leavePoliciesQuery.error}
        onSubmit={submitLeave}
        isPending={leaveMutation.isPending}
      />
      <CancelLeaveRequestDialog
        open={Boolean(leaveToCancel)}
        onOpenChange={(open) => {
          if (!open && !cancelLeaveMutation.isPending) {
            setLeaveToCancel(null);
            setCancelLeaveRemarks("");
          }
        }}
        leave={leaveToCancel}
        remarks={cancelLeaveRemarks}
        setRemarks={setCancelLeaveRemarks}
        onSubmit={confirmLeaveCancellation}
        isPending={cancelLeaveMutation.isPending}
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

function CancelLeaveRequestDialog({ open, onOpenChange, leave, remarks, setRemarks, onSubmit, isPending }) {
  const leaveStatus = displayText(leave?.status || leave?.leaveStatus);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="atl-card sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">Cancel Leave Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div className="rounded-md border border-orange-200 bg-orange-50/50 p-3 text-orange-900 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-200">
            <p className="font-medium">{displayText(leave?.leaveType, "Leave Request")} · {leaveStatus}</p>
            <p className="mt-1">{formatShortDate(leave?.fromDate)} - {formatShortDate(leave?.toDate)}</p>
            {leaveStatus === "Approved" && (
              <p className="mt-2">Cancelling approved leave reverses its ledger and attendance entries. Payroll-locked attendance may prevent cancellation.</p>
            )}
          </div>
          <label className="grid gap-1.5">
            <span className="font-medium text-foreground">Remarks <span className="font-normal text-muted-foreground">- Optional</span></span>
            <textarea
              className="atl-input rounded-md border px-3 py-2 text-xs"
              rows="4"
              value={remarks}
              maxLength={1000}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Why are you cancelling this leave request?"
            />
            <span className="text-right text-[11px] text-muted-foreground">{remarks.length}/1000</span>
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              className="rounded-md border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              Keep Request
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md border border-red-200 bg-red-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              {isPending ? "Cancelling..." : "Confirm Cancellation"}
            </button>
          </div>
        </form>
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
  const attendanceCorrectionPlaceholder = {
    "Check-in Time": "Enter a time such as 9:45 AM, an ISO timestamp, or 'remove'.",
    "Check-out Time": "Enter a time such as 7:30 PM, an ISO timestamp, or 'remove'.",
    "Duty Type": `Enter one of: ${attendanceDutyTypes.join(", ")}.`,
    Notes: "Enter the corrected attendance notes, or 'remove' to clear them.",
  }[form.whatNeedsToBeCorrected];

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
          placeholder={isLeaveCorrection ? "Please change my approved leave dates from 15-17 July 2026 to 16-17 July 2026." : attendanceCorrectionPlaceholder}
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
  onCancel,
  isCancelling,
  isLoadingDetail,
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
                        disabled={isLoadingDetail || !canModify}
                        onClick={() => onEdit(correction)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        title={canModify ? "Edit correction request" : "Only pending correction requests can be edited"}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isCancelling || !canModify}
                        onClick={() => onCancel(correction)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        title={canModify ? "Cancel correction request" : "Only pending correction requests can be cancelled"}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Cancel
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
  leavePolicies,
  leaveDurations,
  halfDayPeriods,
  selectedLeavePolicy,
  selectedLeaveDaysLeft,
  calendarSpanDays,
  isPoliciesLoading,
  policiesError,
  onSubmit,
  onCancel,
  isPending,
}) {
  const input = "atl-input h-11 rounded-md border px-3 text-xs";
  const textarea = "atl-input rounded-md border px-3 py-2 text-xs";
  const requestRules = selectedLeavePolicy?.requestRules || {};
  const selectedBalanceText = selectedLeaveDaysLeft !== null
    ? `${selectedLeaveDaysLeft} ${displayText(selectedLeavePolicy?.leaveType)} available`
    : "Balance is not available for the selected policy.";
  const updatePolicy = (leavePolicyId) => {
    const policy = leavePolicies.find((item) => item._id === leavePolicyId);
    if (!policy) return;

    setForm({
      ...form,
      leavePolicyId,
      leaveType: policy.leaveType,
      duration: policy.requestRules?.allowHalfDay === false && form.duration === "Half Day"
        ? "Full Day"
        : form.duration,
    });
  };
  const updateDuration = (duration) => {
    const nextForm = {
      ...form,
      duration,
    };

    if (duration === "Multiple Days") {
      nextForm.fromDate = toDateInputValue(form.fromDate || todayIso);
      nextForm.toDate = form.toDate && !isDateBefore(form.toDate, nextForm.fromDate) ? toDateInputValue(form.toDate) : nextForm.fromDate;
    } else {
      nextForm.fromDate = form.fromDate || todayIso;
      nextForm.toDate = nextForm.fromDate;
      if (duration === "Half Day" && !halfDayPeriods.includes(form.halfDayPeriod)) {
        nextForm.halfDayPeriod = halfDayPeriods[0] || "First Half";
      }
    }

    setForm(nextForm);
  };
  const updateLeaveDate = (fromDate) => {
    setForm({
      ...form,
      fromDate,
      toDate: fromDate,
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
            <p className="text-xl font-semibold text-foreground">
              {selectedLeaveDaysLeft === null ? "--" : selectedLeaveDaysLeft} Days
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{selectedBalanceText}</p>
          </div>
        </div>
        {selectedLeavePolicy && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-orange-200 pt-3 text-xs dark:border-orange-400/30 sm:grid-cols-4">
            <span><b className="block font-medium text-foreground">Leave Type</b>{displayText(selectedLeavePolicy.leaveType)}</span>
            <span><b className="block font-medium text-foreground">Payment</b>{selectedLeavePolicy.isPaidLeave ? "Paid" : "Unpaid"}</span>
            <span><b className="block font-medium text-foreground">Request Limit</b>{requestRules.maximumAmountPerRequest == null ? "--" : `${requestRules.maximumAmountPerRequest} Days`}</span>
            <span><b className="block font-medium text-foreground">Notice</b>{`${Number(requestRules.minimumNoticeDays) || 0} Days`}</span>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        <label className="grid gap-1.5 text-xs">
          <span className="font-medium text-foreground">Leave Policy <span className="text-red-500">*</span></span>
          <select
            className={input}
            value={form.leavePolicyId}
            onChange={(event) => updatePolicy(event.target.value)}
            disabled={isPoliciesLoading || !leavePolicies.length}
            required
          >
            <option value="">{isPoliciesLoading ? "Loading applicable policies..." : "Select leave policy"}</option>
            {leavePolicies.map((policy) => (
              <option key={policy._id} value={policy._id} disabled={policy.unit !== "Days"}>
                {policy.name}{policy.unit !== "Days" ? " (Hours - unavailable)" : ""}
              </option>
            ))}
          </select>
          {policiesError && <span className="text-red-600">Unable to load applicable leave policies.</span>}
          {!isPoliciesLoading && !policiesError && !leavePolicies.length && (
            <span className="text-muted-foreground">No active leave policy applies for {getFiscalYear(form.fromDate)}.</span>
          )}
        </label>

        <label className="grid gap-1.5 text-xs">
          <span className="font-medium text-foreground">Leave Duration <span className="text-red-500">*</span></span>
          <select className={input} value={form.duration} onChange={(event) => updateDuration(event.target.value)}>
            {leaveDurations.map((duration) => (
              <option key={duration} disabled={duration === "Half Day" && requestRules.allowHalfDay === false}>
                {duration}
              </option>
            ))}
          </select>
        </label>

        {form.duration === "Multiple Days" ? (
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
          <div className={`grid gap-4 ${form.duration === "Half Day" ? "md:grid-cols-2" : ""}`}>
            <label className="grid gap-1.5 text-xs">
              <span className="font-medium text-foreground">Leave Date <span className="text-red-500">*</span></span>
              <input className={input} type="date" value={toDateInputValue(form.fromDate)} onChange={(event) => updateLeaveDate(event.target.value)} required />
            </label>
            {form.duration === "Half Day" && (
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

        <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-foreground">
          <div className="flex items-center justify-between gap-3">
            <span>Calendar Span</span>
            <span className="font-semibold">
              {calendarSpanDays === null
                ? "--"
                : form.duration === "Half Day"
                  ? "Half Day"
                  : `${calendarSpanDays} Day${calendarSpanDays === 1 ? "" : "s"}`}
            </span>
          </div>
          {selectedLeaveDaysLeft !== null && (
            <div className="mt-1 flex items-center justify-between gap-3 text-muted-foreground">
              <span>Available</span>
              <span>{selectedLeaveDaysLeft} Days</span>
            </div>
          )}
          <p className="mt-1 text-[11px] text-muted-foreground">
            Final requested days are calculated by the backend after weekly offs and mandatory holidays are excluded.
          </p>
          {selectedLeaveDaysLeft !== null && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Ledger balance excludes pending requests; final availability is checked when you submit.
            </p>
          )}
        </div>

        <label className="grid gap-1.5 text-xs">
          <span className="font-medium text-foreground">Reason for Leave <span className="text-red-500">*</span></span>
          <textarea
            className={textarea}
            rows="3"
            value={form.reason}
            onChange={(event) => setForm({ ...form, reason: event.target.value })}
            minLength={3}
            maxLength={2000}
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
            maxLength={2000}
          />
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
        <button
          disabled={isPending || !selectedLeavePolicy || selectedLeavePolicy.unit !== "Days"}
          className="atl-primary rounded-md px-8 py-2.5 text-xs font-medium disabled:opacity-60"
        >
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
        <LeaveMetric label="Casual Leaves" value={casualLeave ? displayText(getAvailableLeaveDays(casualLeave)) : "--"} tone="blue" />
        <LeaveMetric label="Emergency Leaves" value={emergencyLeave ? displayText(getAvailableLeaveDays(emergencyLeave)) : "--"} tone="orange" />
        <LeaveMetric label="Used Leaves" value={`${monthlyLeaveDays} Days`} tone="purple" />
        <LeaveMetric label="Pending Leaves" value={pendingLeaves} tone="gray" />
      </div>
    </Panel>
  );
}

function LeaveRequestsList({
  rows,
  pagination,
  onPageChange,
  isLoading,
  onCancelLeave,
  isCancelling,
  monthLabel,
  onAddCorrection,
}) {
  const [selectedLeaveId, setSelectedLeaveId] = useState("");
  const currentPage = Number(pagination?.page) || 1;
  const pageSize = Number(pagination?.limit) || 20;
  const totalRecords = Number(pagination?.total) || 0;
  const totalPages = Number(pagination?.totalPages) || 0;
  const rangeStart = totalRecords ? (currentPage - 1) * pageSize + 1 : 0;
  const rangeEnd = totalRecords ? Math.min(currentPage * pageSize, totalRecords) : 0;

  return (
    <Panel>
      <SectionTitle icon={Umbrella}>
        Leave Requests - {monthLabel}
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {["Leave Type", "Date Range", "Duration", "Requested Days", "Status", "Submitted Date", "Action"].map((header) => (
                <th key={header} className="px-4 py-2 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-muted-foreground">Loading leave requests...</td>
              </tr>
            ) : rows?.length ? rows.map((leave, index) => {
              const leaveId = leave._id || leave.id;
              const leaveStatus = displayText(leave.leaveStatus || leave.status, "Pending");
              const leaveDays = displayText(leave.requestedDays || leave.leaveDays || leave.totalDays || leave.days);
              const canCancel = leaveStatus === "Pending" || leaveStatus === "Approved";

              return (
                <tr key={leaveId || index} className="border-t border-border align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{displayText(leave.leaveType || leave.type, "Leave Request")}</p>
                    <p className="mt-1 text-muted-foreground">{displayText(leave.leavePolicy?.name)}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatShortDate(leave.fromDate || leave.startDate)} - {formatShortDate(leave.toDate || leave.endDate)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{displayText(leave.duration || leave.leaveDuration)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{leaveDays === "--" ? leaveDays : `${leaveDays} Days`}</td>
                  <td className="px-4 py-3"><StatusPill tone={statusTone(leaveStatus)}>{leaveStatus}</StatusPill></td>
                  <td className="px-4 py-3 text-muted-foreground">{formatShortDate(leave.createdAt)}</td>
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
                        <DropdownMenuItem onClick={() => setSelectedLeaveId(leaveId)}>
                          <Eye className="h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddCorrection(leave)}>
                          <FilePenLine className="h-4 w-4" />
                          Add Correction
                        </DropdownMenuItem>
                        {leaveId && canCancel && (
                          <DropdownMenuItem
                            disabled={isCancelling}
                            onClick={() => onCancelLeave(leave)}
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
                <td colSpan="7" className="px-4 py-8 text-center text-muted-foreground">No leave requests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span>{totalRecords ? `Showing ${rangeStart}-${rangeEnd} of ${totalRecords}` : "No leave requests"}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isLoading || currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-foreground hover:bg-muted disabled:opacity-50"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </button>
          <span>Page {currentPage} of {Math.max(totalPages, 1)}</span>
          <button
            type="button"
            disabled={isLoading || totalPages === 0 || currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-foreground hover:bg-muted disabled:opacity-50"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <LeaveRequestDetailDialog
        requestId={selectedLeaveId}
        onOpenChange={(open) => !open && setSelectedLeaveId("")}
        onCancelLeave={onCancelLeave}
        isCancelling={isCancelling}
      />
    </Panel>
  );
}

function LeaveRequestDetailDialog({ requestId, onOpenChange, onCancelLeave, isCancelling }) {
  const open = Boolean(requestId);
  const validRequestId = isValidObjectId(requestId);
  const detailQuery = useQuery({
    queryKey: ["employee-leave-request-detail", requestId],
    queryFn: async () => {
      const response = await EmployeeV2Service.getMyLeaveRequestDetail(requestId);
      return normalizeLeaveRequest(response.data?.data?.request || {});
    },
    enabled: open && validRequestId,
  });
  const leave = detailQuery.data;
  const leaveStatus = displayText(leave?.status, "Pending");
  const canCancel = leaveStatus === "Pending" || leaveStatus === "Approved";
  const approvalHistory = leave?.approvalHistory || [];
  const attachments = leave?.attachments || [];
  const requestedAt = leave?.createdAt;
  const dateTimeText = (value) => value
    ? `${formatShortDate(value)} ${formatTime(value)}`
    : "--";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="atl-card max-h-[85vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3 pr-6 text-base font-semibold text-foreground">
            <span>Leave Request Detail</span>
            {leave && <StatusPill tone={statusTone(leaveStatus)}>{leaveStatus}</StatusPill>}
          </DialogTitle>
        </DialogHeader>

        {!validRequestId ? (
          <p className="rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200">
            A valid leave request ID is required.
          </p>
        ) : detailQuery.isLoading ? (
          <p className="p-6 text-center text-xs text-muted-foreground">Loading leave request detail...</p>
        ) : detailQuery.isError ? (
          <p className="rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200">
            {detailQuery.error?.response?.data?.message || "Unable to load leave request detail."}
          </p>
        ) : leave ? (
          <div className="space-y-4 text-xs">
            <section className="rounded-md border border-border p-3">
              <p className="mb-3 font-medium text-foreground">Leave Policy</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><span className="text-muted-foreground">Policy</span><p className="mt-1 font-medium text-foreground">{displayText(leave.leavePolicy?.name)}</p></div>
                <div><span className="text-muted-foreground">Policy Code</span><p className="mt-1 font-medium text-foreground">{displayText(leave.leavePolicy?.policyCode)}</p></div>
                <div><span className="text-muted-foreground">Leave Type</span><p className="mt-1 font-medium text-foreground">{displayText(leave.leaveType)}</p></div>
                <div>
                  <span className="text-muted-foreground">Payment</span>
                  <p className="mt-1"><StatusPill tone={leave.leavePolicy?.isPaidLeave ? "green" : "gray"}>{leave.leavePolicy?.isPaidLeave ? "Paid" : "Unpaid"}</StatusPill></p>
                </div>
              </div>
            </section>

            <section className="rounded-md border border-border p-3">
              <p className="mb-3 font-medium text-foreground">Request Information</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><span className="text-muted-foreground">Date Range</span><p className="mt-1 font-medium text-foreground">{formatShortDate(leave.fromDate)} - {formatShortDate(leave.toDate)}</p></div>
                <div><span className="text-muted-foreground">Requested Days</span><p className="mt-1 font-medium text-foreground">{leave.requestedDays == null ? "--" : `${leave.requestedDays} Days`}</p></div>
                <div><span className="text-muted-foreground">Duration</span><p className="mt-1 font-medium text-foreground">{displayText(leave.duration)}</p></div>
                <div><span className="text-muted-foreground">Half-day Period</span><p className="mt-1 font-medium text-foreground">{displayText(leave.halfDayPeriod)}</p></div>
                <div className="sm:col-span-2"><span className="text-muted-foreground">Reason</span><p className="mt-1 whitespace-pre-wrap font-medium text-foreground">{displayText(leave.reason)}</p></div>
                <div className="sm:col-span-2"><span className="text-muted-foreground">Work Handover</span><p className="mt-1 whitespace-pre-wrap font-medium text-foreground">{displayText(leave.workHandover)}</p></div>
                <div><span className="text-muted-foreground">Submitted</span><p className="mt-1 font-medium text-foreground">{dateTimeText(requestedAt)}</p></div>
                <div><span className="text-muted-foreground">Last Updated</span><p className="mt-1 font-medium text-foreground">{dateTimeText(leave.updatedAt)}</p></div>
              </div>
            </section>

            <section className="rounded-md border border-border p-3">
              <p className="mb-3 font-medium text-foreground">Approval Timeline</p>
              {approvalHistory.length ? (
                <ol className="space-y-3">
                  {approvalHistory.map((history, index) => (
                    <li key={history._id || index} className="border-l-2 border-border pl-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <StatusPill tone={statusTone(history.action)}>{displayText(history.action)}</StatusPill>
                        <span className="text-muted-foreground">{dateTimeText(history.actionAt)}</span>
                      </div>
                      <p className="mt-1 font-medium text-foreground">{displayText(history.actionBy?.name, "System")}</p>
                      <p className="mt-1 text-muted-foreground">{displayText(history.remarks, "No remarks")}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-muted-foreground">No approval action has been recorded.</p>
              )}
            </section>

            <section className="rounded-md border border-border p-3">
              <p className="mb-3 font-medium text-foreground">Attachments</p>
              {attachments.length ? (
                <ul className="space-y-2">
                  {attachments.map((attachment, index) => {
                    const attachmentUrl = typeof attachment === "string"
                      ? attachment
                      : attachment?.url || attachment?.originalUrl || attachment?.fileUrl;
                    const attachmentName = typeof attachment === "string"
                      ? attachment.split("/").at(-1)
                      : attachment?.name || attachment?.originalName || attachment?.fileName || attachment?.fileId || `Attachment ${index + 1}`;
                    return (
                      <li key={attachment?._id || attachment?.fileId || index} className="rounded-md bg-muted/60 px-3 py-2">
                        {attachmentUrl ? (
                          <a className="font-medium text-primary hover:underline" href={attachmentUrl} target="_blank" rel="noreferrer">{attachmentName}</a>
                        ) : (
                          <span className="font-medium text-foreground">{attachmentName}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground">No attachments.</p>
              )}
            </section>

            {canCancel && (
              <div className="flex justify-end border-t border-border pt-4">
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => {
                    onOpenChange(false);
                    onCancelLeave(leave);
                  }}
                  className="rounded-md border border-red-200 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-400/10"
                >
                  Cancel Leave Request
                </button>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
