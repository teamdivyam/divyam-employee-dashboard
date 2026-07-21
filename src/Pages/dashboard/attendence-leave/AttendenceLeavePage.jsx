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
import EmployeeV2Service from "@/services/employee-v2.service";
import {
  HALF_DAY_PERIODS,
  LEAVE_DURATIONS,
  LEAVE_TYPES,
  normalizeLeaveRequest,
} from "./leave.constants";
import {
  ATTENDANCE_DUTY_TYPES,
  CORRECTION_FIELDS,
  CORRECTION_STATUSES,
} from "./attendance.constants";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  Eye,
  FilePenLine,
  FileText,
  Info,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  PencilLine,
  TriangleAlert,
  Tag,
  Umbrella,
  UserRound,
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
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import { Textarea } from "@components/components/ui/textarea";

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
  "Check-in Time": CORRECTION_FIELDS[0],
  "Check-out Time": CORRECTION_FIELDS[1],
  "Duty Type": CORRECTION_FIELDS[2],
  Notes: CORRECTION_FIELDS[3],
};
const leaveCorrectionFields = ["Change Leave Dates", "From Date", "To Date", "Leave Type", "Duration", "Reason", "Work Handover", "Other"];
const correctionTargetTypes = ["Attendance", "Leave"];
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
  requestedFirstCheckIn: "",
  requestedLastCheckOut: "",
  requestedDutyType: "",
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

function normalizeCorrection(correction = {}) {
  const correctionFor = displayText(correction.targetType || correction.correctionFor, "Attendance");
  return {
    ...correction,
    correctionFor,
    attendanceId: correctionFor === "Attendance" ? correction.targetId : correction.attendanceId,
    leaveId: correctionFor === "Leave" ? correction.targetId : correction.leaveId,
    correctionStatus: correction.status,
    reviewedBy: correction.reviewedBy ?? null,
    reviewedAt: correction.reviewedAt ?? null,
    adminRemarks: correction.adminRemarks ?? null,
  };
}

function buildLeaveCorrectionChanges(form) {
  const field = form.whatNeedsToBeChanged;
  const requestedValue = form.requestedCorrection.trim();
  if (!leaveCorrectionFields.includes(field)) {
    throw new Error("Select a supported leave correction field");
  }
  if (!requestedValue) {
    throw new Error("Enter the requested leave correction");
  }
  return [{ field, requestedValue }];
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

function formatCorrectionDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function formatCorrectionValue(field, value) {
  if (value === null) return "Removed";
  if (value === undefined || value === "") return "--";
  if (field === "firstCheckIn" || field === "lastCheckOut") {
    return formatCorrectionDateTime(value);
  }
  return String(value);
}

function buildAttendanceCorrectionChanges(form) {
  const changes = [];
  const addChange = (field, requestedValue) => {
    if (!CORRECTION_FIELDS.includes(field)) {
      throw new Error("Select a supported attendance correction field");
    }
    changes.push({ field, requestedValue });
  };
  const addDateTimeChange = (field, value, currentValue) => {
    if (!value) return;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error("Enter a valid correction date and time");
    if (isSameAttendanceMinute(value, currentValue)) return;
    addChange(field, date.toISOString());
  };

  addDateTimeChange("firstCheckIn", form.requestedFirstCheckIn, form.attendanceRecord?.checkInTime);
  addDateTimeChange("lastCheckOut", form.requestedLastCheckOut, form.attendanceRecord?.checkOutTime);

  if (form.requestedDutyType && form.requestedDutyType !== form.attendanceRecord?.dutyType) {
    if (!ATTENDANCE_DUTY_TYPES.includes(form.requestedDutyType)) {
      throw new Error("Select a valid duty type");
    }
    addChange("dutyType", form.requestedDutyType);
  }

  if (!changes.length) throw new Error("Enter at least one attendance change");
  return changes;
}

function isSameAttendanceMinute(firstValue, secondValue) {
  if (!firstValue || !secondValue) return false;
  const firstDate = new Date(firstValue);
  const secondDate = new Date(secondValue);
  if (Number.isNaN(firstDate.getTime()) || Number.isNaN(secondDate.getTime())) return false;
  return firstDate.getFullYear() === secondDate.getFullYear()
    && firstDate.getMonth() === secondDate.getMonth()
    && firstDate.getDate() === secondDate.getDate()
    && firstDate.getHours() === secondDate.getHours()
    && firstDate.getMinutes() === secondDate.getMinutes();
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
  const [filters, setFilters] = useState({
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
  const [selectedCorrectionDetail, setSelectedCorrectionDetail] = useState(null);
  const [correctionToCancel, setCorrectionToCancel] = useState(null);
  const [cancelCorrectionReason, setCancelCorrectionReason] = useState("");
  const [leaveToCancel, setLeaveToCancel] = useState(null);
  const [cancelLeaveRemarks, setCancelLeaveRemarks] = useState("");
  const [recentCorrectionRequest, setRecentCorrectionRequest] = useState(null);
  const [correctionFilters, setCorrectionFilters] = useState({
    status: "",
    targetType: "Attendance",
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const [correctionPage, setCorrectionPage] = useState(1);
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
        return EmployeeV2Service.createLeaveCorrection({
          targetType: "Leave",
          targetId: correctionForm.leaveId,
          changes: buildLeaveCorrectionChanges(correctionForm),
          reason: correctionForm.reasonForCorrection.trim(),
        });
      }

      return EmployeeV2Service.createAttendanceCorrection({
        targetType: "Attendance",
        targetId: correctionForm.attendanceId,
        changes: buildAttendanceCorrectionChanges(correctionForm),
        reason: correctionForm.reasonForCorrection.trim(),
      });
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Correction request submitted");
      const createdCorrection = response.data?.data?.correction;
      setRecentCorrectionRequest(
        createdCorrection
          ? normalizeCorrection({
            ...createdCorrection,
            targetType: createdCorrection.targetType || correctionForm.correctionFor,
          })
          : null
      );
      setCorrectionForm(defaultCorrectionForm);
      setIsCorrectionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["attendance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-history"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["employee-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["employee-leave-request-detail"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-corrections"] });
    },
    onError: (error) => toast.error(
      error.response?.data?.message || error.response?.data?.msg || error.message || "Unable to process correction request"
    ),
  });

  const cancelCorrectionMutation = useMutation({
    mutationFn: ({ correctionId, reason }) => {
      if (!/^[a-f\d]{24}$/i.test(correctionId)) {
        throw new Error("A valid correction request is required");
      }
      return EmployeeV2Service.cancelAttendanceCorrection({ correctionId, reason });
    },
    onSuccess: (response, variables) => {
      toast.success(response.data?.message || "Correction request cancelled");
      const cancelledCorrection = response.data?.data?.correction;
      if (cancelledCorrection) {
        const normalizedCorrection = normalizeCorrection({
          ...cancelledCorrection,
          targetType: cancelledCorrection.targetType || variables.targetType,
        });
        setRecentCorrectionRequest(normalizedCorrection);
        queryClient.setQueryData(
          ["attendance-correction-detail", normalizedCorrection._id],
          normalizedCorrection
        );
      }
      setCorrectionToCancel(null);
      setCancelCorrectionReason("");
      queryClient.invalidateQueries({ queryKey: ["attendance-corrections"] });
      if (variables.targetType === "Leave") {
        queryClient.invalidateQueries({ queryKey: ["employee-leave-requests"] });
        queryClient.invalidateQueries({ queryKey: ["employee-leave-request-detail"] });
      }
    },
    onError: (error) => toast.error(
      error.response?.data?.message || error.response?.data?.msg || error.message || "Unable to cancel correction request"
    ),
  });

  const correctionsQuery = useQuery({
    queryKey: ["attendance-corrections", correctionFilters, correctionPage, 20, "desc"],
    queryFn: async () => {
      const response = await EmployeeV2Service.getAttendanceCorrections({
        status: correctionFilters.status || undefined,
        targetType: correctionFilters.targetType || undefined,
        fromDate: toDateInputValue(new Date(correctionFilters.year, correctionFilters.month - 1, 1)),
        toDate: toDateInputValue(new Date(correctionFilters.year, correctionFilters.month, 0)),
        page: correctionPage,
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
        throw new Error("A valid correction request is required");
      }

      const response = await EmployeeV2Service.getAttendanceCorrection(correctionId);
      const correctionDetail = normalizeCorrection(response.data?.data?.correction || {});
      if (!getRecordId(correctionDetail)) throw new Error("Correction details were not found");
      return correctionDetail;
    },
    onSuccess: (correction) => {
      queryClient.setQueryData(["attendance-correction-detail", correction._id], correction);
      setSelectedCorrectionDetail(correction);
    },
    onError: (error) => toast.error(
      error.response?.data?.message || error.message || "Unable to load correction request"
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
  const correctionRows = useMemo(
    () => (Array.isArray(correctionRecords) ? correctionRecords.map(normalizeCorrection) : []),
    [correctionRecords]
  );
  const correctionPagination = correctionsQuery.data?.pagination || {
    page: correctionPage,
    limit: 20,
    total: correctionRows.length,
    totalPages: correctionRows.length ? 1 : 0,
  };
  const recentCorrections = useMemo(() => {
    const mergedCorrections = recentCorrectionRequest
      ? [recentCorrectionRequest, ...correctionRows]
      : correctionRows;
    const correctionIds = new Set();

    return mergedCorrections.filter((correction) => {
      const correctionId = getRecordId(correction);
      if (!correctionId || correctionIds.has(correctionId)) return false;
      correctionIds.add(correctionId);
      return true;
    });
  }, [correctionRows, recentCorrectionRequest]);
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
    if (attendance?.payrollLocked) {
      toast.error("Attendance is locked for payroll and cannot be corrected");
      return;
    }
    setCorrectionForm({
      ...defaultCorrectionForm,
      correctionFor: "Attendance",
      attendanceId: getRecordId(attendance),
      attendanceRecord: attendance,
      whatNeedsToBeCorrected: "Check-out Time",
      requestedFirstCheckIn: toAttendanceRequestedDateTime(attendance, attendance?.checkInTime),
      requestedLastCheckOut: toAttendanceRequestedDateTime(attendance, attendance?.checkOutTime),
      requestedDutyType: attendance?.dutyType || "",
    });
    setIsCorrectionDialogOpen(true);
  };

  const openCorrectionDetail = (correction) => {
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

  const openCorrectionCancellation = (correction) => {
    const correctionId = getRecordId(correction);
    if (!isValidObjectId(correctionId)) {
      toast.error("A valid correction request is required.");
      return;
    }
    if (String(correction?.status || correction?.correctionStatus).toLowerCase() !== "pending") {
      toast.error("Only pending corrections can be cancelled.");
      return;
    }
    setCancelCorrectionReason("");
    setCorrectionToCancel(correction);
  };

  const confirmCorrectionCancellation = (event) => {
    event.preventDefault();
    const correctionId = getRecordId(correctionToCancel);
    const reason = cancelCorrectionReason.trim();
    if (!isValidObjectId(correctionId)) {
      toast.error("A valid correction request is required.");
      return;
    }
    if (reason.length > 1000) {
      toast.error("Cancellation reason cannot exceed 1,000 characters.");
      return;
    }
    cancelCorrectionMutation.mutate({
      correctionId,
      reason: reason || undefined,
      targetType: correctionToCancel?.targetType || correctionToCancel?.correctionFor || "Attendance",
    });
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

    if (correctionForm.correctionFor === "Leave" && !isValidObjectId(correctionForm.leaveId)) {
      toast.error("A valid leave request is required!");
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
    const reasonLength = correctionForm.reasonForCorrection.trim().length;
    if (reasonLength < 3 || reasonLength > 200) {
      toast.error("Reason must be between 3 and 200 characters!");
      return;
    }
    if (correctionForm.correctionFor === "Leave") {
      try {
        buildLeaveCorrectionChanges(correctionForm);
      } catch (error) {
        toast.error(error.message);
        return;
      }
    } else {
      try {
        buildAttendanceCorrectionChanges(correctionForm);
      } catch (error) {
        toast.error(error.message);
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

      <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
        <main className="min-w-0 space-y-4">
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
                    monthFilterControl={<MonthFilterControl filters={filters} onFilterChange={setFilters} />}
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
                  monthFilterControl={<MonthFilterControl filters={filters} onFilterChange={setFilters} />}
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
                  rows={correctionRows}
                  filters={correctionFilters}
                  statuses={CORRECTION_STATUSES}
                  targetTypes={correctionTargetTypes}
                  monthFilterControl={(
                    <div className="flex items-center gap-2">
                      <MonthFilterControl
                        filters={correctionFilters}
                        onFilterChange={(updater) => {
                          setCorrectionFilters(updater);
                          setCorrectionPage(1);
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" className="hidden h-8 gap-2 text-xs md:inline-flex">
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                    </div>
                  )}
                  onFilterChange={(field, value) => {
                    setCorrectionFilters((current) => ({ ...current, [field]: value }));
                    setCorrectionPage(1);
                  }}
                  pagination={correctionPagination}
                  onPageChange={setCorrectionPage}
                  isLoading={correctionsQuery.isLoading || correctionsQuery.isFetching}
                  error={correctionsQuery.error}
                  onView={openCorrectionDetail}
                  onCancel={openCorrectionCancellation}
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
        leaveBalance={leaveBalance}
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
      <CorrectionDetailDialog
        open={Boolean(selectedCorrectionDetail)}
        correction={selectedCorrectionDetail}
        onOpenChange={(open) => {
          if (!open) setSelectedCorrectionDetail(null);
        }}
      />
      <CancelCorrectionRequestDialog
        open={Boolean(correctionToCancel)}
        correction={correctionToCancel}
        reason={cancelCorrectionReason}
        setReason={setCancelCorrectionReason}
        onSubmit={confirmCorrectionCancellation}
        isPending={cancelCorrectionMutation.isPending}
        onOpenChange={(open) => {
          if (!open && !cancelCorrectionMutation.isPending) {
            setCorrectionToCancel(null);
            setCancelCorrectionReason("");
          }
        }}
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
      <DialogContent className="atl-card max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-[540px]">
        <DialogHeader className="border-b border-border px-4 py-3.5">
          <DialogTitle className="flex items-start gap-3 text-left">
            <span className="atl-detail-icon-orange grid h-9 w-9 shrink-0 place-items-center rounded-lg">
              <FileText className="h-[18px] w-[18px]" />
            </span>
            <span>
              <span className="block text-base font-semibold text-foreground">Apply for Leave</span>
              <span className="mt-1 block text-xs font-normal text-muted-foreground">Submit your leave request for admin approval.</span>
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

function CancelCorrectionRequestDialog({ open, onOpenChange, correction, reason, setReason, onSubmit, isPending }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="atl-card sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">Cancel Correction Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div className="rounded-md border border-red-200 bg-red-50/50 p-3 text-red-900 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200">
            <p className="font-medium">{getCorrectionField(correction || {})}</p>
            <p className="mt-1 break-all text-[11px]">{displayText(correction?.targetId)}</p>
            <p className="mt-2">Only pending correction requests can be cancelled.</p>
          </div>
          <label className="grid gap-1.5">
            <span className="font-medium text-foreground">Reason <span className="font-normal text-muted-foreground">- Optional</span></span>
            <textarea
              className="atl-input rounded-md border px-3 py-2 text-xs"
              rows="4"
              value={reason}
              maxLength={1000}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why are you cancelling this correction request?"
            />
            <span className="text-right text-[11px] text-muted-foreground">{reason.length}/1000</span>
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
              {isPending ? "Cancelling..." : "Cancel Request"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CorrectionDetailDialog({ open, onOpenChange, correction }) {
  if (!correction) return null;

  const employee = correction.employee && typeof correction.employee === "object" ? correction.employee : null;
  const reviewedBy = correction.reviewedBy && typeof correction.reviewedBy === "object" ? correction.reviewedBy : null;
  const changes = Array.isArray(correction.changes) ? correction.changes : [];
  const correctionStatus = displayText(correction.status || correction.correctionStatus, "Pending");
  const correctionTone = String(correctionStatus).toLowerCase().includes("cancel") ? "red" : statusTone(correctionStatus);
  const correctionType = displayText(correction.targetType || correction.correctionFor, "Attendance");
  const targetId = correction.targetId || correction.attendanceId || correction.leaveId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="atl-card max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-[675px] [&>button]:right-4 [&>button]:top-[17px] [&>button]:grid [&>button]:h-10 [&>button]:w-10 [&>button]:place-items-center [&>button]:rounded-full [&>button]:border [&>button]:border-border [&>button]:bg-background [&>button]:opacity-100">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center justify-between gap-3 pr-14 text-left">
            <span className="flex min-w-0 items-center gap-3">
              <span className="atl-detail-icon-orange grid h-11 w-11 shrink-0 place-items-center rounded-xl">
                <FilePenLine className="h-6 w-6" />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-semibold text-foreground">Correction Details</span>
                <span className="mt-1 block truncate text-xs font-normal text-muted-foreground">{displayText(correction._id)}</span>
              </span>
            </span>
            <StatusPill tone={correctionTone}>{correctionStatus}</StatusPill>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-4 text-xs sm:p-[18px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <CorrectionPersonSummary
              title="Employee"
              person={employee}
              fallbackId={typeof correction.employee === "string" ? correction.employee : ""}
              toneClass="atl-detail-icon-blue"
            />
            <CorrectionPersonSummary
              title="Reviewed By"
              person={reviewedBy}
              fallbackId={typeof correction.reviewedBy === "string" ? correction.reviewedBy : ""}
              emptyText="Not reviewed yet"
              toneClass="atl-detail-icon-violet"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CorrectionMetaCard
              icon={CalendarDays}
              iconClassName="atl-detail-icon-success"
              label="Correction Type"
              value={correctionType}
            />
            <CorrectionMetaCard
              icon={Tag}
              iconClassName="atl-detail-icon-violet"
              label="Target ID"
              value={<span className="break-all">{displayText(targetId)}</span>}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">Requested Changes</p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[540px] table-fixed text-left text-xs">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[35%]" />
                  <col className="w-[35%]" />
                </colgroup>
                <thead className="bg-muted/25">
                  <tr>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Field</th>
                    <th className="px-3 py-3 font-medium">
                      <span className="atl-detail-icon-blue inline-flex rounded-md px-2.5 py-1 text-[11px]">Current Value</span>
                    </th>
                    <th className="px-3 py-3 font-medium">
                      <span className="atl-detail-icon-success inline-flex rounded-md px-2.5 py-1 text-[11px]">Requested Value</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {changes.length ? changes.map((change, index) => (
                    <CorrectionChangeRow key={`${change.field}-${index}`} change={change} />
                  )) : (
                    <tr className="border-t border-border">
                      <td colSpan="3" className="px-4 py-7 text-center text-muted-foreground">No correction changes were included.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CorrectionTextCard
              icon={MessageCircle}
              iconClassName="atl-detail-icon-orange"
              title="Reason"
              value={correction.reasonForCorrection || correction.reason}
            />
            <CorrectionTextCard
              icon={PencilLine}
              iconClassName="atl-detail-icon-violet"
              title="Admin Remarks"
              value={correction.adminRemark || correction.adminRemarks}
            />
          </div>

          <div className="grid overflow-hidden rounded-lg border border-border sm:grid-cols-3">
            <CorrectionTimelineItem
              icon={CalendarClock}
              iconClassName="atl-detail-icon-blue"
              label="Requested At"
              value={formatCorrectionDateTime(correction.requestedAt || correction.createdAt)}
            />
            <CorrectionTimelineItem
              icon={CalendarDays}
              iconClassName="atl-detail-icon-violet"
              label="Reviewed At"
              value={formatCorrectionDateTime(correction.reviewedAt)}
              divided
            />
            <CorrectionTimelineItem
              icon={CalendarClock}
              iconClassName="atl-detail-icon-success"
              label="Last Updated"
              value={formatCorrectionDateTime(correction.updatedAt)}
              divided
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CorrectionPersonSummary({ title, person, fallbackId, emptyText = "Not available", toneClass }) {
  const name = person?.name || person?.fullName;
  const employeeId = person?.employeeId || fallbackId;
  const designation = person?.designation || person?.jobTitle;
  const profileImage = person?.profileImage.smallUrl || person?.profilePicture;
  const initials = String(name || "E")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "E";

  return (
    <div className="min-h-[116px] rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-foreground">{title}</p>
        <span className={`${toneClass} grid h-8 w-8 shrink-0 place-items-center rounded-lg`}>
          <UserRound className="h-4 w-4" />
        </span>
      </div>
      {person || fallbackId ? (
        <div className="mt-2 flex items-center gap-3">
          {profileImage ? (
            <img src={profileImage} alt={name || "Employee"} className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <span className="atl-detail-icon-blue grid h-11 w-11 shrink-0 place-items-center rounded-full font-medium">{initials}</span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{displayText(name, "Employee")}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{displayText(employeeId)}</p>
            {designation && <p className="mt-0.5 truncate text-xs text-muted-foreground">{designation}</p>}
          </div>
        </div>
      ) : (
        <div className="flex min-h-[58px] items-center justify-center text-muted-foreground">{emptyText}</div>
      )}
    </div>
  );
}

function CorrectionMetaCard({ icon: Icon, iconClassName, label, value }) {
  return (
    <div className="flex min-h-[74px] min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
      <span className={`${iconClassName} grid h-9 w-9 shrink-0 place-items-center rounded-lg`}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <div className="mt-1 text-xs font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

function CorrectionChangeRow({ change }) {
  const field = change.field;
  const label = getAttendanceCorrectionFieldLabel(field);
  const isTime = field === "firstCheckIn" || field === "lastCheckOut";
  const isDuty = field === "dutyType";
  const Icon = isTime ? Clock3 : isDuty ? BriefcaseBusiness : FileText;
  const iconClassName = isTime ? "atl-detail-icon-blue" : isDuty ? "atl-detail-icon-violet" : "atl-detail-icon-orange";

  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-3">
          <span className={`${iconClassName} grid h-8 w-8 shrink-0 place-items-center rounded-lg`}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="font-medium text-foreground">{label}</span>
        </div>
      </td>
      <td className="break-words px-3 py-2.5 text-foreground">{formatCorrectionValue(field, change.currentValue)}</td>
      <td className="break-words px-3 py-2.5 text-foreground">{formatCorrectionValue(field, change.requestedValue)}</td>
    </tr>
  );
}

function CorrectionTextCard({ icon: Icon, iconClassName, title, value }) {
  return (
    <div className="flex min-h-[70px] items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
      <span className={`${iconClassName} grid h-8 w-8 shrink-0 place-items-center rounded-lg`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{displayText(value)}</p>
      </div>
    </div>
  );
}

function CorrectionTimelineItem({ icon: Icon, iconClassName, label, value, divided = false }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 p-3 ${divided ? "border-t border-border sm:border-l sm:border-t-0" : ""}`}>
      <span className={`${iconClassName} grid h-8 w-8 shrink-0 place-items-center rounded-lg`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-[11px] font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function CorrectionRequestDialog({ open, onOpenChange, ...props }) {
  const isLeaveCorrection = props.form?.correctionFor === "Leave";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="atl-card max-h-[92vh] overflow-y-auto p-0 sm:max-w-[620px]">
        <DialogHeader className={`px-5 pb-4 pt-5 ${isLeaveCorrection ? "border-b border-border" : ""}`}>
          <DialogTitle className="flex items-start gap-3 text-left">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${isLeaveCorrection ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" : "bg-primary/10 text-primary"}`}>
              {isLeaveCorrection ? <FilePenLine className="h-5 w-5" /> : <CalendarClock className="h-6 w-6" />}
            </span>
            <span className="pt-0.5">
              <span className="block text-base font-semibold text-foreground">
                {isLeaveCorrection ? "Request Leave Correction" : "Request Attendance Correction"}
              </span>
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                {isLeaveCorrection ? "Submit the required changes for your approved leave." : "Submit a correction request for admin review"}
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
  const textarea = "atl-input rounded-lg border px-3 py-2 text-xs";
  const isSubmitDisabled = isPending || (!isLeaveCorrection && (!selectedAttendance || selectedAttendance.payrollLocked)) || (isLeaveCorrection && !form.leaveId);

  return (
    <form onSubmit={onSubmit} className={`space-y-4 px-5 pb-5 ${isLeaveCorrection ? "pt-4" : "pt-2"}`}>
      {isLeaveCorrection ? (
        <LeaveCorrectionCurrentCard leave={selectedLeave} />
      ) : (
        <AttendanceCorrectionCurrentCard attendance={selectedAttendance} />
      )}

      {isLeaveCorrection ? (
        <LeaveCorrectionFields form={form} setForm={setForm} textarea={textarea} />
      ) : (
        <AttendanceCorrectionFields form={form} setForm={setForm} input={input} attendance={selectedAttendance} />
      )}

      {!isLeaveCorrection && (
        <label className="grid gap-2 text-xs">
          <span className="flex items-center gap-2 font-medium text-foreground">
            <PencilLine className="h-3.5 w-3.5 text-muted-foreground" />
            Reason for Correction
          </span>
          <span className="relative">
            <Textarea
              className={`${textarea} min-h-[64px] w-full resize-none pb-7`}
              rows={2}
              placeholder="I forgot to check out before leaving the office."
              value={form.reasonForCorrection}
              onChange={(event) => setForm({ ...form, reasonForCorrection: event.target.value })}
              minLength={3}
              maxLength={200}
              required
            />
            <span className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-muted-foreground">
              {form.reasonForCorrection.length}/200
            </span>
          </span>
        </label>
      )}

      <div className={`atl-correction-notice flex items-start gap-3 rounded-lg border p-3 ${isLeaveCorrection ? "text-[10px]" : "text-xs"}`}>
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
        <span>
          {isLeaveCorrection
            ? "Your currently approved leave will remain unchanged until Admin reviews and approves this correction request."
            : "Admin will review this request and update the attendance record if approved."}
        </span>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-10 px-6 text-xs"
        >
          Cancel
        </Button>
        <Button disabled={isSubmitDisabled} className="h-10 px-8 text-xs">
          {isPending ? "Submitting..." : isLeaveCorrection ? "Submit Correction Request" : "Submit Request"}
        </Button>
      </div>
    </form>
  );
}

function LeaveCorrectionFields({ form, setForm, textarea }) {
  return (
    <div className="space-y-4">
      <label className="grid gap-1.5 text-xs">
        <span className="font-medium text-foreground">What needs to be changed? <span className="text-red-500">*</span></span>
        <Select
          value={form.whatNeedsToBeChanged}
          onValueChange={(value) => setForm({ ...form, whatNeedsToBeChanged: value })}
        >
          <SelectTrigger className="h-10 text-xs">
            <SelectValue placeholder="Select a field" />
          </SelectTrigger>
          <SelectContent>
            {leaveCorrectionFields.map((field) => <SelectItem key={field} value={field}>{field}</SelectItem>)}
          </SelectContent>
        </Select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs">
          <span className="font-medium text-foreground">Requested Correction <span className="text-red-500">*</span></span>
          <Textarea
            className={`${textarea} min-h-[72px] resize-none`}
            rows={2}
            value={form.requestedCorrection}
            onChange={(event) => setForm({ ...form, requestedCorrection: event.target.value })}
            required
          />
        </label>
        <label className="grid gap-1.5 text-xs">
          <span className="font-medium text-foreground">Reason for Correction <span className="text-red-500">*</span></span>
          <Textarea
            className={`${textarea} min-h-[72px] resize-none`}
            rows={2}
            value={form.reasonForCorrection}
            onChange={(event) => setForm({ ...form, reasonForCorrection: event.target.value })}
            required
          />
        </label>
      </div>

      <CorrectionProofUpload
        label="Supporting Document"
        file={form.supportingProof}
        onChange={(file) => setForm({ ...form, supportingProof: file })}
      />
    </div>
  );
}

function toTimeInputValue(value) {
  return String(value || "").match(/T(\d{2}:\d{2})/)?.[1] || "";
}

function toAttendanceRequestedDateTime(attendance, value) {
  if (!value) return "";
  const attendanceDate = toDateInputValue(attendance?.attendanceDate || attendance?.date);
  const valueDate = new Date(value);
  if (!attendanceDate || Number.isNaN(valueDate.getTime())) return "";
  const hours = String(valueDate.getHours()).padStart(2, "0");
  const minutes = String(valueDate.getMinutes()).padStart(2, "0");
  return `${attendanceDate}T${hours}:${minutes}`;
}

function AttendanceCorrectionFields({ form, setForm, input, attendance }) {
  const updateForm = (changes) => setForm({ ...form, ...changes });
  const attendanceDate = toDateInputValue(attendance?.attendanceDate || attendance?.date);
  const updateRequestedTime = (field, time) => updateForm({
    [field]: time && attendanceDate ? `${attendanceDate}T${time}` : "",
  });

  return (
    <div className="space-y-3">
      <CorrectionFormSectionTitle>Requested Changes</CorrectionFormSectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <CorrectionTimeField
          label="Correct Check-in"
          value={toTimeInputValue(form.requestedFirstCheckIn)}
          onChange={(time) => updateRequestedTime("requestedFirstCheckIn", time)}
          inputClassName={input}
        />
        <CorrectionTimeField
          label="Correct Check-out"
          value={toTimeInputValue(form.requestedLastCheckOut)}
          onChange={(time) => updateRequestedTime("requestedLastCheckOut", time)}
          inputClassName={input}
        />
      </div>
      <label className="grid gap-1.5 text-xs">
        <span className="font-medium text-foreground">Duty Type</span>
        <span className="relative">
          <BriefcaseBusiness className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Select
            value={form.requestedDutyType || "no-change"}
            onValueChange={(value) => updateForm({ requestedDutyType: value === "no-change" ? "" : value })}
          >
            <SelectTrigger className={`${input} pl-10`}>
              <SelectValue placeholder="No change" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no-change">No change</SelectItem>
              {ATTENDANCE_DUTY_TYPES.map((dutyType) => (
                <SelectItem key={dutyType} value={dutyType}>{dutyType}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </span>
      </label>
    </div>
  );
}

function CorrectionTimeField({ label, value, onChange, inputClassName }) {
  return (
    <label className="grid gap-1.5 text-xs">
      <span className="font-medium text-foreground">{label}</span>
      <span className="relative">
        {/* <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /> */}
        <Input
          className={`${inputClassName} w-full`}
          type="time"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </label>
  );
}

function CorrectionFormSectionTitle({ children }) {
  return (
    <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
      <span className="h-4 w-0.5 rounded-full bg-primary" />
      {children}
    </p>
  );
}

function AttendanceCorrectionCurrentCard({ attendance }) {
  const status = resolvePresenceStatus(attendance || {});
  const attendanceDate = attendance?.attendanceDate || attendance?.date;
  const attendanceId = getRecordId(attendance);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <AttendanceCorrectionSummaryCard
          icon={BadgeCheck}
          label="Attendance ID"
          value={attendanceId}
          iconClassName="atl-correction-icon-success"
          action={(
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                navigator.clipboard?.writeText(attendanceId);
                toast.success("Attendance ID copied");
              }}
              className="h-8 w-8 shrink-0 text-primary hover:bg-primary/10 hover:text-primary"
              aria-label="Copy attendance ID"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        />
        <AttendanceCorrectionSummaryCard
          icon={CalendarDays}
          label="Attendance Date"
          value={formatShortDate(attendanceDate)}
          iconClassName="bg-primary/10 text-primary"
          action={<CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />}
        />
      </div>
      <div>
        <CorrectionFormSectionTitle>Current Record</CorrectionFormSectionTitle>
        <div className="mt-3 grid overflow-hidden rounded-lg border border-border bg-card text-xs shadow-sm sm:grid-cols-4 sm:divide-x sm:divide-border">
          <AttendanceCurrentRecordStat
            icon={BadgeCheck}
            label="Status"
            value={<StatusPill tone={statusTone(status)}>{status}</StatusPill>}
            iconClassName="atl-correction-icon-success"
          />
          <AttendanceCurrentRecordStat
            icon={Clock3}
            label="Check-in"
            value={formatTime(attendance?.checkInTime)}
            iconClassName="bg-primary/10 text-primary"
          />
          <AttendanceCurrentRecordStat
            icon={TriangleAlert}
            label="Check-out"
            value={attendance?.checkOutTime ? formatTime(attendance.checkOutTime) : <span className="text-orange-600 dark:text-orange-400">Not Recorded</span>}
            iconClassName="atl-correction-icon-warning"
          />
          <AttendanceCurrentRecordStat
            icon={BriefcaseBusiness}
            label="Duty Type"
            value={displayText(attendance?.dutyType)}
            iconClassName="atl-correction-icon-duty"
          />
        </div>
        {attendance?.payrollLocked && <p className="mt-2 text-[11px] text-red-600">This record is payroll locked and cannot be corrected.</p>}
      </div>
    </div>
  );
}

function AttendanceCorrectionSummaryCard({ icon: Icon, label, value, iconClassName, action }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${iconClassName}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-medium text-muted-foreground">{label}</span>
        <span className="mt-1 block truncate text-xs font-semibold text-foreground" title={String(value || "")}>{displayText(value)}</span>
      </span>
      {action}
    </div>
  );
}

function AttendanceCurrentRecordStat({ icon: Icon, label, value, iconClassName }) {
  return (
    <div className="flex min-w-0 items-center gap-2 p-3">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${iconClassName}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-medium text-muted-foreground">{label}</span>
        <span className="mt-1 block truncate text-xs font-semibold text-foreground">{value}</span>
      </span>
    </div>
  );
}

function LeaveCorrectionCurrentCard({ leave }) {
  const leaveStatus = displayText(leave.leaveStatus || leave.status, "Pending");
  const fromDate = leave.fromDate || leave.startDate || leave.leaveDate;
  const toDate = leave.toDate || leave.endDate || leave.leaveDate;
  const dateValue = formatShortDate(fromDate) === formatShortDate(toDate)
    ? formatShortDate(fromDate)
    : `${formatShortDate(fromDate)} - ${formatShortDate(toDate)}`;

  return (
    <div className="atl-leave-correction-summary grid overflow-hidden rounded-lg border text-xs sm:grid-cols-4 sm:divide-x sm:divide-border">
      <div className="p-4">
        <CurrentRecordStat label="Leave Type" value={displayText(leave.leaveType || leave.type, "Leave Request")} />
      </div>
      <div className="p-4">
        <CurrentRecordStat label="Date" value={dateValue} />
      </div>
      <div className="p-4">
        <CurrentRecordStat label="Duration" value={displayText(leave.duration || leave.leaveDuration)} />
      </div>
      <div className="p-4">
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
      <span className="font-medium text-foreground">{label} <span className="font-normal text-muted-foreground">(Optional)</span></span>
      <div className="relative flex h-11 items-center gap-3 rounded-md border border-border bg-background px-3 transition-colors hover:bg-muted/30">
        <Paperclip className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate font-medium text-foreground">{file ? file.name : "Upload file"}</span>
        <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:block">JPG, PNG, PDF (Max. 5 MB)</span>
        <Input
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
  filters,
  statuses,
  targetTypes,
  monthFilterControl,
  onFilterChange,
  pagination,
  onPageChange,
  isLoading,
  error,
  onView,
  onCancel,
  isCancelling,
  isLoadingDetail,
}) {
  const currentPage = Number(pagination?.page) || 1;
  const pageLimit = Number(pagination?.limit) || 20;
  const total = Number(pagination?.total) || 0;
  const totalPages = Number(pagination?.totalPages) || 0;
  const firstRecord = total ? (currentPage - 1) * pageLimit + 1 : 0;
  const lastRecord = total ? Math.min(currentPage * pageLimit, total) : 0;

  return (
    <Panel className="min-w-0 overflow-hidden">
      <SectionTitle icon={FilePenLine} action={monthFilterControl}>Correction Requests</SectionTitle>
      <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2">
        <div className="grid gap-1.5 text-xs">
          <span className="font-medium text-foreground">Status</span>
          <Select
            value={filters.status || "all"}
            onValueChange={(value) => onFilterChange("status", value === "all" ? "" : value)}
          >
            <SelectTrigger className="h-10 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5 text-xs">
          <span className="font-medium text-foreground">Correction Type</span>
          <Select
            value={filters.targetType || "Attendance"}
            onValueChange={(value) => onFilterChange("targetType", value)}
          >
            <SelectTrigger className="h-10 text-xs">
              <SelectValue placeholder="Select correction type" />
            </SelectTrigger>
            <SelectContent>
              {targetTypes.map((targetType) => <SelectItem key={targetType} value={targetType}>{targetType}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="max-w-full overflow-hidden">
        <table className="w-full table-fixed text-left text-xs">
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[14%]" />
            <col className="w-[19%]" />
            <col className="w-[10%]" />
            <col className="w-[17%]" />
            <col className="w-[15%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {["Employee", "Correction Type", "Reason", "Status", "Review", "Requested At", "Action"].map((header) => (
                <th key={header} className="whitespace-nowrap px-3 py-2 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!isLoading && !error && rows?.length ? rows.map((correction, index) => {
              const correctionStatus = displayText(correction.correctionStatus || correction.status, "Pending");
              const canModify = String(correctionStatus).toLowerCase() === "pending";
              const employee = correction.employee && typeof correction.employee === "object" ? correction.employee : null;
              const reviewedBy = correction.reviewedBy && typeof correction.reviewedBy === "object"
                ? correction.reviewedBy.name || correction.reviewedBy.employeeId || correction.reviewedBy._id
                : correction.reviewedBy;
              return (
                <tr key={correction._id || index} className="border-t border-border align-top">
                  <td className="px-3 py-3">
                    <p className="truncate font-medium text-foreground" title={employee?.name || correction.employeeName || "Employee"}>
                      {displayText(employee?.name || correction.employeeName, "Employee")}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="truncate font-medium text-foreground">
                      {displayText(correction.targetType || correction.correctionFor, "Attendance")}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    <p className="line-clamp-2 break-words">{displayText(correction.reasonForCorrection || correction.reason || correction.remarks)}</p>
                  </td>
                  <td className="px-3 py-3"><StatusPill tone={statusTone(correctionStatus)}>{correctionStatus}</StatusPill></td>
                  <td className="px-3 py-3 text-muted-foreground">
                    <p className="line-clamp-2 break-words">{displayText(correction.adminRemark || correction.adminRemarks || correction.adminNote || correction.reviewNote)}</p>
                    {reviewedBy && <p className="mt-1 text-[11px]">By {reviewedBy}</p>}
                    {correction.reviewedAt && <p className="mt-1 text-[11px]">{formatCorrectionDateTime(correction.reviewedAt)}</p>}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{formatCorrectionDateTime(correction.requestedAt || correction.createdAt)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={isLoadingDetail}
                        onClick={() => onView(correction)}
                        className="h-8 w-8"
                        title="View correction details"
                        aria-label="View correction details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canModify && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={isCancelling}
                          onClick={() => onCancel(correction)}
                          className="h-8 w-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10"
                          title="Cancel correction request"
                          aria-label="Cancel correction request"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-muted-foreground">
                  {isLoading
                    ? "Loading correction requests..."
                    : error?.response?.data?.message || error?.message || "No correction request found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>Showing {firstRecord}-{lastRecord} of {total}</span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading || currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="h-8 gap-1 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </Button>
          <span>Page {currentPage} of {Math.max(totalPages, 1)}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading || totalPages === 0 || currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="h-8 gap-1 text-xs"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
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
  leaveBalance,
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
  const input = "h-10 text-xs";
  const textarea = "min-h-[62px] resize-y text-xs";
  const requestRules = selectedLeavePolicy?.requestRules || {};
  const findBalance = (type) => (leaveBalance || []).find((item) => (
    String(item.leaveType || item.leavePolicy?.leaveType || "").toLowerCase().includes(type)
  ));
  const availableBalanceCards = [
    {
      key: "casual",
      label: "Casual Leave",
      record: findBalance("casual"),
      icon: Umbrella,
      cardClassName: "atl-leave-form-casual",
      iconClassName: "atl-detail-icon-violet",
    },
    {
      key: "compensatory",
      label: "Compensatory Leave",
      record: findBalance("compensatory"),
      icon: Clock3,
      cardClassName: "atl-leave-form-compensatory",
      iconClassName: "atl-detail-icon-success",
    },
    {
      key: "emergency",
      label: "Emergency Leave",
      record: findBalance("emergency"),
      icon: BadgeCheck,
      cardClassName: "atl-leave-form-emergency",
      iconClassName: "atl-detail-icon-blue",
    },
  ];
  const requestedDays = calendarSpanDays === null ? null : calendarSpanDays;
  const balanceAfterRequest = selectedLeaveDaysLeft === null || requestedDays === null
    ? null
    : Math.max(0, selectedLeaveDaysLeft - requestedDays);
  const formatDays = (value) => {
    if (value === null || value === undefined) return "--";
    return `${value} Day${Number(value) === 1 ? "" : "s"}`;
  };
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
    <form onSubmit={onSubmit} className="space-y-4 p-4 text-xs">
      <div>
        <p className="mb-2 font-medium text-foreground">Available Leave Balance</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {availableBalanceCards.map((balance) => {
            const Icon = balance.icon;
            const availableDays = getAvailableLeaveDays(balance.record);
            return (
              <div key={balance.key} className={`${balance.cardClassName} flex min-w-0 items-center gap-2.5 rounded-lg border p-2.5`}>
                <span className={`${balance.iconClassName} grid h-9 w-9 shrink-0 place-items-center rounded-full`}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-medium text-muted-foreground" title={balance.label}>{balance.label}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{formatDays(availableDays)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="font-medium text-foreground">Leave Type <span className="text-red-500">*</span></span>
          <Select
            value={form.leavePolicyId}
            onValueChange={updatePolicy}
            disabled={isPoliciesLoading || !leavePolicies.length}
          >
            <SelectTrigger className={input}>
              <SelectValue placeholder={isPoliciesLoading ? "Loading applicable policies..." : "Select leave policy"} />
            </SelectTrigger>
            <SelectContent>
              {leavePolicies.map((policy) => (
                <SelectItem key={policy._id} value={policy._id} disabled={policy.unit !== "Days"}>
                  {policy.name}{policy.unit !== "Days" ? " (Hours - unavailable)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {policiesError && <span className="text-red-600">Unable to load applicable leave policies.</span>}
          {!isPoliciesLoading && !policiesError && !leavePolicies.length && (
            <span className="text-muted-foreground">No active leave policy applies for {getFiscalYear(form.fromDate)}.</span>
          )}
        </div>

        <div className="grid gap-1.5">
          <span className="font-medium text-foreground">Leave Duration <span className="text-red-500">*</span></span>
          <Select value={form.duration} onValueChange={updateDuration}>
            <SelectTrigger className={input}>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {leaveDurations.map((duration) => (
                <SelectItem key={duration} value={duration} disabled={duration === "Half Day" && requestRules.allowHalfDay === false}>
                  {duration}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {form.duration === "Multiple Days" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="font-medium text-foreground">From Date <span className="text-red-500">*</span></span>
            <Input className={input} type="date" value={toDateInputValue(form.fromDate)} onChange={(event) => handleFromDateChange(event.target.value)} required />
          </label>
          <label className="grid gap-1.5">
            <span className="font-medium text-foreground">To Date <span className="text-red-500">*</span></span>
            <Input
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
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="font-medium text-foreground">Leave Date <span className="text-red-500">*</span></span>
            <Input className={input} type="date" value={toDateInputValue(form.fromDate)} onChange={(event) => updateLeaveDate(event.target.value)} required />
          </label>
          {form.duration === "Half Day" && (
            <div className="grid gap-1.5">
              <span className="font-medium text-foreground">Shift <span className="text-red-500">*</span></span>
              <Select value={form.halfDayPeriod} onValueChange={(value) => setForm({ ...form, halfDayPeriod: value })}>
                <SelectTrigger className={input}>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {halfDayPeriods.map((period) => <SelectItem key={period} value={period}>{period}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      <label className="grid gap-1.5">
        <span className="font-medium text-foreground">Reason for Leave <span className="text-red-500">*</span></span>
        <Textarea
          className={textarea}
          rows="2"
          value={form.reason}
          onChange={(event) => setForm({ ...form, reason: event.target.value })}
          minLength={3}
          maxLength={2000}
          placeholder="Brief reason for your leave"
          required
        />
      </label>

      <label className="grid gap-1.5">
        <span className="font-medium text-foreground">Work Handover <span className="font-normal text-muted-foreground">(Optional)</span></span>
        <Textarea
          className={textarea}
          rows="2"
          value={form.workHandover}
          onChange={(event) => setForm({ ...form, workHandover: event.target.value })}
          maxLength={2000}
          placeholder="Hand over your work (if any)"
        />
      </label>

      <div className="atl-leave-form-request-summary grid grid-cols-2 overflow-hidden rounded-lg border py-2.5">
        <div className="flex items-center gap-3 px-4">
          <span className="atl-detail-icon-blue grid h-8 w-8 shrink-0 place-items-center rounded-lg">
            <CalendarDays className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground">Requested Days</p>
            <p className="mt-0.5 text-sm font-semibold text-primary">{formatDays(requestedDays)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-l border-blue-200 px-4 dark:border-blue-400/30">
          <span className="atl-detail-icon-violet grid h-8 w-8 shrink-0 place-items-center rounded-lg">
            <BadgeCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground">Balance After Request</p>
            <p className="mt-0.5 text-sm font-semibold text-primary">{formatDays(balanceAfterRequest)}</p>
          </div>
        </div>
      </div>

      <div className="atl-correction-notice flex items-start gap-3 rounded-lg border p-3">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange-500 text-white">
          <Info className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="font-medium">Your leave is not confirmed until it is approved by Admin.</p>
          <p className="mt-1 text-[11px]">Please continue your assigned responsibilities unless approval is received.</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-0.5">
        <Button type="button" variant="outline" className="h-9 px-5 text-xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-9 px-6 text-xs"
          disabled={isPending || !selectedLeavePolicy || selectedLeavePolicy.unit !== "Days"}
        >
          {isPending ? "Submitting..." : "Submit Leave Request"}
        </Button>
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

function LeaveMetric({ icon: Icon, label, value, toneClassName }) {
  return (
    <div className="flex min-h-[132px] min-w-0 flex-col items-center justify-center px-3 py-4 text-center lg:border-l lg:border-border">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${toneClassName}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="mt-3 min-w-0 max-w-full">
        <span className="block truncate text-xs font-medium text-muted-foreground" title={label}>{label}</span>
        <span className="mt-1.5 block truncate text-lg font-semibold text-foreground">{value}</span>
      </span>
    </div>
  );
}

function LeaveBalanceSummary({
  leaveBalance,
  monthlyLeaveDays,
  filters,
  onFilterChange,
}) {
  const casualLeave = leaveBalance?.find((balance) => balance.leaveType === "Casual Leave");
  const emergencyLeave = leaveBalance?.find((balance) => balance.leaveType === "Emergency Leave");
  const compensatoryLeave = leaveBalance?.find((balance) => (
    String(balance.leaveType || "").toLowerCase().includes("compensatory")
  ));

  return (
    <Panel className="min-w-0 overflow-hidden">
      <div className="grid lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="flex flex-col justify-center border-b border-border p-5 lg:border-b-0">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Umbrella className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold text-foreground">Leave Balance</h2>
          </div>
          <div className="mt-4">
            <MonthFilterControl filters={filters} onFilterChange={onFilterChange} />
          </div>
        </div>
        <div className="grid min-w-0 sm:grid-cols-2 xl:grid-cols-4">
          <LeaveMetric
            icon={CalendarDays}
            label="Casual Leaves"
            value={casualLeave ? displayText(getAvailableLeaveDays(casualLeave)) : "--"}
            toneClassName="atl-leave-metric-casual"
          />
          <LeaveMetric
            icon={TriangleAlert}
            label="Emergency Leaves"
            value={emergencyLeave ? displayText(getAvailableLeaveDays(emergencyLeave)) : "--"}
            toneClassName="atl-leave-metric-emergency"
          />
          <LeaveMetric
            icon={CalendarClock}
            label="Compensatory Leaves"
            value={compensatoryLeave ? displayText(getAvailableLeaveDays(compensatoryLeave)) : "--"}
            toneClassName="atl-leave-metric-compensatory"
          />
          <LeaveMetric
            icon={UserRound}
            label="Used Leaves"
            value={`${monthlyLeaveDays} Days`}
            toneClassName="atl-leave-metric-used"
          />
        </div>
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
    <Panel className="min-w-0 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
          <Umbrella className="h-4 w-4" />
        </span>
        <h2 className="text-base font-semibold text-foreground">Leave Requests - {monthLabel}</h2>
      </div>
      <div className="max-w-full overflow-hidden">
        <table className="w-full table-fixed text-left text-xs">
          <colgroup>
            <col className="w-[17%]" />
            <col className="w-[21%]" />
            <col className="w-[12%]" />
            <col className="w-[15%]" />
            <col className="w-[11%]" />
            <col className="w-[16%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              {["Leave Type", "Date Range", "Duration", "Requested Days", "Status", "Submitted Date", "Action"].map((header) => (
                <th key={header} className="whitespace-nowrap px-3 py-3 font-medium">{header}</th>
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
                <tr key={leaveId || index} className="border-t border-border align-middle transition-colors hover:bg-muted/20">
                  <td className="px-3 py-4">
                    <p className="font-semibold text-foreground">{displayText(leave.leaveType || leave.type, "Leave Request")}</p>
                    <p className="mt-1 text-muted-foreground">{displayText(leave.leavePolicy?.name)}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-muted-foreground">
                    {formatShortDate(leave.fromDate || leave.startDate)} - {formatShortDate(leave.toDate || leave.endDate)}
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">{displayText(leave.duration || leave.leaveDuration)}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-muted-foreground">{leaveDays === "--" ? leaveDays : `${leaveDays} Days`}</td>
                  <td className="px-3 py-4"><StatusPill tone={statusTone(leaveStatus)}>{leaveStatus}</StatusPill></td>
                  <td className="whitespace-nowrap px-3 py-4 text-muted-foreground">{formatShortDate(leave.createdAt)}</td>
                  <td className="px-3 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Leave request actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-xs text-muted-foreground">
        <span>{totalRecords ? `Showing ${rangeStart}-${rangeEnd} of ${totalRecords}` : "No leave requests"}</span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading || currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </Button>
          <span>Page {currentPage} of {Math.max(totalPages, 1)}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading || totalPages === 0 || currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="text-xs"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
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
