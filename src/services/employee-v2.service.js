import axios from "axios";
import { config } from "../../config";

export const employeeV2Request = axios.create({
    baseURL: `${config.BACKEND_URL}/v2/api`,
    timeout: 10000,
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

let refreshRequest = null;

employeeV2Request.interceptors.response.use(
    (response) => response,
    async (error) => {
        const requestConfig = error.config;
        const requestUrl = requestConfig?.url || "";
        const shouldRefresh = error.response?.status === 401
            && requestConfig
            && !requestConfig._retry
            && !requestUrl.includes("/auth/login")
            && !requestUrl.includes("/auth/refresh");

        if (!shouldRefresh) return Promise.reject(error);

        requestConfig._retry = true;

        try {
            refreshRequest ??= employeeV2Request.post("/auth/refresh").finally(() => {
                refreshRequest = null;
            });
            await refreshRequest;
            return employeeV2Request(requestConfig);
        } catch (refreshError) {
            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("auth:unauthorized"));
            }
            return Promise.reject(refreshError);
        }
    },
);

const EmployeeV2Service = {
    login: (formData) => employeeV2Request.post("/auth/login", formData),
    refresh: () => employeeV2Request.post("/auth/refresh"),
    logout: () => employeeV2Request.post("/auth/logout"),
    logoutAll: () => employeeV2Request.post("/auth/logout-all"),
    changePassword: (formData) => employeeV2Request.post("/auth/change-password", formData),
    sessions: () => employeeV2Request.get("/auth/session"),

    me: () => employeeV2Request.get("/employees/me"),
    getEmployeeDetail: (employeeId) =>
        employeeV2Request.get(`/employees/${encodeURIComponent(employeeId)}`),
    editEmployee: (employeeId, formData) => employeeV2Request.patch(`/employees/${encodeURIComponent(employeeId)}`, formData),

    getTodayAttendance: () => employeeV2Request.get("/attendance/me/today"),
    getAttendanceSummary: ({ fromDate, toDate } = {}) =>
        employeeV2Request.get("/attendance/me/summary", {
            params: { fromDate, toDate },
        }),
    getAttendanceRecords: ({
        fromDate,
        toDate,
        status,
        dutyType,
        lateEntry,
        payrollLocked,
        page = 1,
        limit = 20,
        sortOrder = "desc",
    } = {}) => employeeV2Request.get("/attendance/me/records", {
        params: {
            fromDate,
            toDate,
            status,
            dutyType,
            lateEntry,
            payrollLocked,
            page,
            limit: Math.min(Number(limit) || 20, 100),
            sortOrder,
        },
    }),
    getAttendanceRecord: (attendanceId) =>
        employeeV2Request.get(`/attendance/me/records/${encodeURIComponent(attendanceId)}`),
    createAttendanceCorrection: ({ targetId, changes, reason } = {}) =>
        employeeV2Request.post("/attendance/corrections", {
            targetType: "Attendance",
            targetId,
            changes,
            reason,
        }),
    getAttendanceCorrections: ({
        status,
        fromDate,
        toDate,
        page = 1,
        limit = 20,
        sortOrder = "desc",
    } = {}) => employeeV2Request.get("/attendance/me/corrections", {
        params: {
            targetType: "Attendance",
            status,
            fromDate,
            toDate,
            page: Math.max(Number(page) || 1, 1),
            limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
            sortOrder,
        },
    }),
    getAttendanceCorrection: (correctionId) =>
        employeeV2Request.get(`/attendance/me/corrections/${encodeURIComponent(correctionId)}`),
    cancelAttendanceCorrection: ({ correctionId, reason } = {}) =>
        employeeV2Request.patch(
            `/attendance/me/corrections/${encodeURIComponent(correctionId)}/cancel`,
            reason === undefined ? {} : { reason },
        ),
    markAttendancePunch: ({ punchType, dutyType, location, notes } = {}) =>
        employeeV2Request.post("/attendance/punches", {
            punchType,
            dutyType,
            location,
            notes,
        }),

    getApplicableLeavePolicies: ({ fiscalYear, leaveType, page = 1, limit = 100 } = {}) =>
        employeeV2Request.get("/leave/me/policies", {
            params: {
                fiscalYear,
                leaveType,
                page: Math.max(Number(page) || 1, 1),
                limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
            },
        }),
    getLeaveBalances: ({ fiscalYear, leaveType } = {}) =>
        employeeV2Request.get("/leave/me/balances", {
            params: {
                fiscalYear,
                leaveType,
            },
        }),
    getMyLeaveRequests: ({ status, leaveType, fromDate, toDate, page = 1, limit = 20, sortOrder = "desc" } = {}) =>
        employeeV2Request.get("/leave/me/requests", {
            params: {
                status,
                leaveType,
                fromDate,
                toDate,
                page: Math.max(Number(page) || 1, 1),
                limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
                sortOrder,
            },
        }),
    getMyLeaveRequestDetail: (requestId) =>
        employeeV2Request.get(`/leave/me/requests/${encodeURIComponent(requestId)}`),
    createLeaveRequest: (payload) =>
        employeeV2Request.post("/leave/requests", payload, {
            headers: { "Content-Type": "application/json" },
        }),
    cancelMyLeaveRequest: ({ leaveRequestId, remarks } = {}) =>
        employeeV2Request.patch(
            `/leave/me/requests/${encodeURIComponent(leaveRequestId)}/cancel`,
            remarks?.trim() ? { remarks: remarks.trim() } : {},
            { headers: { "Content-Type": "application/json" } },
        ),
};

export default EmployeeV2Service;
