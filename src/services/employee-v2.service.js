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
    login: (formData) => employeeV2Request.post("/auth/loginAndRedirect", formData),
    refresh: () => employeeV2Request.post("/auth/refresh"),
    logout: () => employeeV2Request.post("/auth/logout"),
    logoutAll: () => employeeV2Request.post("/auth/logout-all"),
    changePassword: (formData) => employeeV2Request.patch("/auth/change-password", formData),
    sessions: () => employeeV2Request.get("/auth/session"),

    me: () => employeeV2Request.get("/employees/me"),
    getMyAssets: ({ status, page = 1, limit = 25 } = {}) =>
        employeeV2Request.get("/employees/me/assets", {
            params: {
                ...(status ? { status } : {}),
                page: Math.max(Number(page) || 1, 1),
                limit: Math.min(Math.max(Number(limit) || 25, 1), 100),
            },
        }),
    getMyDocuments: (params = {}) => employeeV2Request.get("/employees/me/documents", { params }),
    uploadMyDocument: (formData) =>
        employeeV2Request.post("/employees/me/documents", formData, {
            headers: { "Content-Type": undefined },
        }),
    deleteMyDocument: (documentId) =>
        employeeV2Request.delete(`/employees/me/documents/${encodeURIComponent(documentId)}`),
    updateMyProfile: (formData) => employeeV2Request.patch(
        "/employees/me",
        formData,
        formData instanceof FormData
            ? { headers: { "Content-Type": "multipart/form-data" } }
            : undefined,
    ),
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
    createAttendanceCorrection: ({ targetType = "Attendance", targetId, changes, reason } = {}) =>
        employeeV2Request.post("/attendance/corrections", {
            targetType,
            targetId,
            changes,
            reason,
        }),
    createLeaveCorrection: ({ targetType = "Leave", targetId, changes, reason } = {}) =>
        employeeV2Request.post("/leave/corrections", {
            targetType,
            targetId,
            changes,
            reason,
        }),
    getAttendanceCorrections: ({
        status,
        targetType,
        fromDate,
        toDate,
        page = 1,
        limit = 20,
        sortOrder = "desc",
    } = {}) => employeeV2Request.get("/attendance/me/corrections", {
        params: {
            status,
            targetType,
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

    getEmployeePaymentProfile: () =>
        employeeV2Request.get(`/employees/me/payment-profile`),
    saveEmployeePaymentProfile: (formData) =>
        employeeV2Request.put(`/employees/me/payment-profile`, formData),
    getMyPayrollSalary: ({ month } = {}) =>
        employeeV2Request.get("/employees/me/payroll-salary", {
            params: { month },
        }),
    createMyPayrollQuery: ({ employeePayrollId, queryType, subject, message, attachment } = {}) => {
        const formData = new FormData();
        if (employeePayrollId) formData.append("employeePayrollId", employeePayrollId);
        formData.append("queryType", queryType);
        formData.append("subject", subject.trim());
        formData.append("message", message.trim());
        if (attachment) formData.append("attachment", attachment);

        return employeeV2Request.post("/payroll/me/queries", formData, {
            headers: { "Content-Type": undefined },
        });
    },
    getMyPayrollQueries: ({ page = 1, limit = 20, period } = {}) =>
        employeeV2Request.get("/payroll/me/queries", {
            params: {
                page: Math.max(Number(page) || 1, 1),
                limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
                ...(period ? { period } : {}),
            },
        }),
    replyToMyPayrollQuery: ({ queryId, message } = {}) =>
        employeeV2Request.patch(
            `/payroll/me/queries/${encodeURIComponent(queryId)}`,
            { message: message.trim() },
        ),
    getMyLoans: ({ page = 1, limit = 20, status, issuedPeriod } = {}) =>
        employeeV2Request.get("/payroll/me/loans", {
            params: {
                page: Math.max(Number(page) || 1, 1),
                limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
                ...(status ? { status } : {}),
                ...(issuedPeriod ? { issuedPeriod } : {}),
            },
        }),
    getMyLoan: (loanId) =>
        employeeV2Request.get(`/payroll/me/loans/${encodeURIComponent(loanId)}`),

    getMyAdvanceRequests: ({ requestMonth, status, page = 1, limit = 20 } = {}) =>
        employeeV2Request.get("/payroll/me/advance-requests", {
            params: {
                requestMonth,
                page: Math.max(Number(page) || 1, 1),
                limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
                ...(status ? { status } : {}),
            },
        }),
    createAdvanceRequest: ({ requestMonth, requestedAmount, reason, supportingNote, attachments = [] } = {}) => {
        const formData = new FormData();
        formData.append("requestMonth", requestMonth);
        formData.append("requestedAmount", String(requestedAmount));
        formData.append("reason", reason.trim());
        if (supportingNote?.trim()) formData.append("supportingNote", supportingNote.trim());
        attachments.forEach((file) => formData.append("attachments", file));

        return employeeV2Request.post("/payroll/me/advance-requests", formData, {
            headers: { "Content-Type": undefined },
        });
    },
    respondToAdvanceClarification: ({ requestId, clarificationId, response, attachments = [] } = {}) => {
        const formData = new FormData();
        formData.append("response", response.trim());
        attachments.forEach((file) => formData.append("attachments", file));

        return employeeV2Request.patch(
            `/payroll/me/advance-requests/${encodeURIComponent(requestId)}/clarifications/${encodeURIComponent(clarificationId)}/respond`,
            formData,
            { headers: { "Content-Type": undefined } },
        );
    },
    deleteAdvanceRequest: (requestId) =>
        employeeV2Request.delete(`/payroll/me/advance-requests/${encodeURIComponent(requestId)}`),

    getMyAllowanceRequests: ({ requestMonth, status, page = 1, limit = 20 } = {}) =>
        employeeV2Request.get("/payroll/me/allowance-requests", {
            params: {
                requestMonth,
                page: Math.max(Number(page) || 1, 1),
                limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
                ...(status ? { status } : {}),
            },
        }),
    createAllowanceRequest: ({ requestMonth, requestedAmount, reason, supportingNote, attachments = [] } = {}) => {
        const formData = new FormData();
        formData.append("requestMonth", requestMonth);
        formData.append("requestedAmount", String(requestedAmount));
        formData.append("reason", reason.trim());
        if (supportingNote?.trim()) formData.append("supportingNote", supportingNote.trim());
        attachments.forEach((file) => formData.append("attachments", file));

        return employeeV2Request.post("/payroll/me/allowance-requests", formData, {
            headers: { "Content-Type": undefined },
        });
    },
    respondToAllowanceClarification: ({ requestId, clarificationId, response, attachments = [] } = {}) => {
        const formData = new FormData();
        formData.append("response", response.trim());
        attachments.forEach((file) => formData.append("attachments", file));

        return employeeV2Request.patch(
            `/payroll/me/allowance-requests/${encodeURIComponent(requestId)}/clarifications/${encodeURIComponent(clarificationId)}/respond`,
            formData,
            { headers: { "Content-Type": undefined } },
        );
    },
    deleteAllowanceRequest: (requestId) =>
        employeeV2Request.delete(`/payroll/me/allowance-requests/${encodeURIComponent(requestId)}`),

    getTaskAssignmentEmployees: ({ search, limit = 25 } = {}) =>
        employeeV2Request.get("/tasks/employees", {
            params: { search, limit },
        }),
    createTask: ({
        taskType = "Self Task",
        taskTitle,
        description,
        relatedTo,
        dueDate,
        dueTime,
        priority,
        visibility,
        requestTo,
        acceptanceRequired,
    } = {}) =>
        employeeV2Request.post("/tasks", {
            taskType,
            taskTitle,
            description,
            relatedTo,
            dueDate,
            dueTime,
            priority,
            visibility,
            requestTo,
            acceptanceRequired,
        }),
    createTaskBatch: ({ payload, attachmentsByClientId = {} } = {}) => {
        const formData = new FormData();
        formData.append("payload", JSON.stringify(payload));
        Object.entries(attachmentsByClientId).forEach(([clientId, files]) => {
            files.forEach((file) => formData.append(`attachments_${clientId}`, file));
        });
        return employeeV2Request.post("/tasks/batch", formData, {
            headers: { "Content-Type": undefined },
        });
    },
    getMyTasksV2: ({ scope, status, priority, search, relatedType, taskType, page = 1, limit = 25, sortBy, sortOrder } = {}) =>
        employeeV2Request.get("/tasks", {
            params: { scope, status, priority, search, relatedType, taskType, page, limit, sortBy, sortOrder },
        }),
    getMyTaskV2Detail: (taskId) =>
        employeeV2Request.get(`/tasks/${encodeURIComponent(taskId)}`),
    getTaskAnalyticsV2: () =>
        employeeV2Request.get("/tasks/analytics"),
    updateTaskProgress: ({ taskId, status, progressPercent, priority, note, attachments = [] } = {}) => {
        if (!attachments.length) {
            return employeeV2Request.patch(`/tasks/${encodeURIComponent(taskId)}/progress`, {
                status,
                progressPercent,
                priority,
                note,
            });
        }

        const formData = new FormData();
        if (status) formData.append("status", status);
        if (progressPercent !== undefined) formData.append("progressPercent", String(progressPercent));
        if (priority) formData.append("priority", priority);
        if (note) formData.append("note", note);
        attachments.forEach((file) => formData.append("attachments", file));

        return employeeV2Request.patch(`/tasks/${encodeURIComponent(taskId)}/progress`, formData, {
            headers: { "Content-Type": undefined },
        });
    },
    updateTaskChecklistItem: ({ taskId, itemId, isCompleted } = {}) =>
        employeeV2Request.patch(
            `/tasks/${encodeURIComponent(taskId)}/checklist/${encodeURIComponent(itemId)}`,
            { isCompleted },
        ),
    updateTaskDetails: ({ taskId, taskTitle, description, instructions, expectedOutcome, relatedTo, dueDate, dueTime, priority, visibility, referenceAttachments = [], removedReferenceAttachmentIds = [] } = {}) => {
        const formData = new FormData();
        formData.append("payload", JSON.stringify({
            taskTitle,
            description,
            instructions,
            expectedOutcome,
            relatedTo,
            dueDate,
            dueTime,
            priority,
            visibility,
            removedReferenceAttachmentIds,
        }));
        referenceAttachments.forEach((file) => formData.append("referenceAttachments", file));
        return employeeV2Request.patch(`/tasks/${encodeURIComponent(taskId)}/details`, formData, {
            headers: { "Content-Type": undefined },
        });
    },
    respondToWorkRequest: ({ taskId, action, note } = {}) =>
        employeeV2Request.patch(`/tasks/${encodeURIComponent(taskId)}/respond`, { action, note }),
    reviewTask: ({ taskId, decision } = {}) =>
        employeeV2Request.patch(`/tasks/${encodeURIComponent(taskId)}/review`, { decision }),
    requestDueDateChange: ({ taskId, requestedDueDate, reason } = {}) =>
        employeeV2Request.patch(`/tasks/${encodeURIComponent(taskId)}/due-date-change`, { requestedDueDate, reason }),
    respondToDueDateChange: ({ taskId, action, note } = {}) =>
        employeeV2Request.patch(`/tasks/${encodeURIComponent(taskId)}/due-date-change/respond`, { action, note }),
    withdrawWorkRequest: (taskId) =>
        employeeV2Request.patch(`/tasks/${encodeURIComponent(taskId)}/withdraw`),
    sendTaskReminder: (taskId) =>
        employeeV2Request.patch(`/tasks/${encodeURIComponent(taskId)}/reminder`),
    addTaskDiscussionMessage: ({ taskId, message, attachments = [] } = {}) => {
        const formData = new FormData();
        if (message) formData.append("message", message);
        attachments.forEach((file) => formData.append("attachments", file));

        return employeeV2Request.post(`/tasks/${encodeURIComponent(taskId)}/discussion`, formData, {
            headers: { "Content-Type": undefined },
        });
    },
    markTaskDiscussionRead: (taskId) =>
        employeeV2Request.patch(`/tasks/${encodeURIComponent(taskId)}/discussion/read`),
    escalateTask: ({ taskId, escalationType, requestedAction, priority, reason } = {}) =>
        employeeV2Request.patch(`/tasks/${encodeURIComponent(taskId)}/escalate`, { escalationType, requestedAction, priority, reason }),

    getMyNotifications: ({ isRead, page = 1, limit = 20, category = "all" } = {}) =>
        employeeV2Request.get("/notifications", {
            params: { isRead, page, limit, category },
        }),
    markNotificationRead: (notificationId) =>
        employeeV2Request.patch(`/notifications/${encodeURIComponent(notificationId)}/read`),
    markAllNotificationsRead: (category = "all") =>
        employeeV2Request.patch("/notifications/read-all", null, { params: { category } }),
    clearAllNotifications: (category = "all") =>
        employeeV2Request.delete("/notifications/clear-all", { params: { category } }),
};

export default EmployeeV2Service;
