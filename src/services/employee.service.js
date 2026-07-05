import axiosRequest from "../utils/axios";

const EmployeeService = {
  // -------------------- Authentication Service --------------------
  register: ({
    avatar,
    fullName,
    email,
    password,
    confirmPassword,
    mobileNum,
  }) =>
    axiosRequest.post("/register", {
      avatar,
      fullName,
      email,
      password,
      confirmPassword,
      mobileNum,
    }),

  login: ({ email, password, recaptchaToken }) =>
    axiosRequest.post("/login", {
      email,
      password,
      recaptchaToken,
    }),

  me: () => axiosRequest.get("/me"),

  analytics: () => axiosRequest.get("/analytics"),

  // Employee Profile Dashboard
  getEmployeeProfile: () => axiosRequest.get("/profile"),

  updateEmployeeProfile: ({ formData }) =>
    axiosRequest.patch("/profile", formData),

  changeEmployeePassword: ({ currentPassword, newPassword }) =>
    axiosRequest.patch("/profile/change-password", {
      currentPassword,
      newPassword,
    }),

  uploadEmployeeProfileImage: ({ formData }) =>
    axiosRequest.patch("/profile/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getEmployeeQuickActions: () => axiosRequest.get("/profile/quick-actions"),

  getEmployeeIdCard: () => axiosRequest.get("/profile/id-card"),

  // Employee Assigned Events
  getAssignedEventAnalytics: () => axiosRequest.get("/assigned-events/analytics"),

  getAssignedEvents: ({ page = 1, limit = 10, search, status, city, role, view }) =>
    axiosRequest.get("/assigned-events", {
      params: { page, limit, search, status, city, role, view },
    }),

  getAssignedEventDetail: ({ eventId }) =>
    axiosRequest.get(`/assigned-events/${eventId}`),

  updateAssignedEventTaskStatus: ({ eventId, taskId, status, note }) =>
    axiosRequest.patch(`/assigned-events/${eventId}/tasks/${taskId}/status`, {
      status,
      note,
    }),

  uploadAssignedEventTaskProof: ({ eventId, taskId, formData }) =>
    axiosRequest.patch(`/assigned-events/${eventId}/tasks/${taskId}/proof`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  raiseAssignedEventIssue: ({ eventId, issueType, description }) =>
    axiosRequest.post(`/assigned-events/${eventId}/issues`, {
      issueType,
      description,
    }),

  updateAssignedEventDutyAttendance: ({ eventId, action, notes }) =>
    axiosRequest.patch(`/assigned-events/${eventId}/duty-attendance`, {
      action,
      notes,
    }),

  // Employee My Tasks
  getMyTaskAnalytics: () => axiosRequest.get("/my-tasks/analytics"),

  getMyTasks: ({
    page = 1,
    limit = 8,
    search,
    status,
    priority,
    relatedType,
    view,
    sortBy,
    sortOrder,
  }) =>
    axiosRequest.get("/my-tasks", {
      params: {
        page,
        limit,
        search,
        status,
        priority,
        relatedType,
        view,
        sortBy,
        sortOrder,
      },
    }),

  getMyTaskDetail: ({ taskId }) => axiosRequest.get(`/my-tasks/${taskId}`),

  updateMyTaskStatus: ({ taskId, action, status, note }) =>
    axiosRequest.patch(`/my-tasks/${taskId}/status`, {
      action,
      status,
      note,
    }),

  uploadMyTaskProof: ({ taskId, formData }) =>
    axiosRequest.patch(`/my-tasks/${taskId}/proof`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Employee Attendance / Leave
  getAttendanceLeaveDashboard: ({ year, month }) =>
    axiosRequest.get("/attendance-leave/dashboard", {
      params: { year, month },
    }),

  checkInAttendance: ({
    locationType,
    locationName,
    locationAddress,
    latitude,
    longitude,
    attendanceSource,
    notes,
  }) =>
    axiosRequest.post("/attendance-leave/check-in", {
      locationType,
      locationName,
      locationAddress,
      latitude,
      longitude,
      attendanceSource,
      notes,
    }),

  checkOutAttendance: ({ notes }) =>
    axiosRequest.patch("/attendance-leave/check-out", { notes }),

  getAttendanceHistory: ({ page = 1, limit = 25, status, startDate, endDate }) =>
    axiosRequest.get("/attendance-leave/history", {
      params: { page, limit, status, startDate, endDate },
    }),

  submitLeaveRequest: ({ formData }) =>
    axiosRequest.post("/attendance-leave/leave-requests", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getLeaveRequests: ({ page = 1, limit = 25, leaveStatus, leaveType }) =>
    axiosRequest.get("/attendance-leave/leave-requests", {
      params: { page, limit, leaveStatus, leaveType },
    }),

  getLeaveRequestDetail: ({ leaveId }) =>
    axiosRequest.get(`/attendance-leave/leave-requests/${leaveId}`),

  cancelLeaveRequest: ({ leaveId, reason }) =>
    axiosRequest.patch(`/attendance-leave/leave-requests/${leaveId}/cancel`, {
      reason,
    }),

  getLeaveBalance: ({ year }) =>
    axiosRequest.get("/attendance-leave/leave-balance", {
      params: { year },
    }),

  // Employee My Reports
  getMyReportAnalytics: () => axiosRequest.get("/my-reports/analytics"),

  getMyReports: ({
    page = 1,
    limit = 8,
    status,
    reportType,
    relatedTo,
    search,
  }) =>
    axiosRequest.get("/my-reports", {
      params: { page, limit, status, reportType, relatedTo, search },
    }),

  getMyReportDetail: ({ reportId }) =>
    axiosRequest.get(`/my-reports/${reportId}`),

  submitMyReport: ({ formData }) =>
    axiosRequest.post("/my-reports", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateMyReport: ({ reportId, formData }) =>
    axiosRequest.patch(`/my-reports/${reportId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  resubmitMyReport: ({ reportId, data }) =>
    axiosRequest.patch(`/my-reports/${reportId}/resubmit`, data),

  getMyReportEmployees: ({ search, limit = 50 }) =>
    axiosRequest.get("/my-reports/select/employees", {
      params: { search, limit },
    }),

  getMyReportEvents: ({ search, limit = 50 }) =>
    axiosRequest.get("/my-reports/select/events", {
      params: { search, limit },
    }),

  // Employee My Requests / Approvals
  getMyRequestAnalytics: () => axiosRequest.get("/my-requests/analytics"),

  getMyRequests: ({
    page = 1,
    limit = 8,
    search,
    status,
    requestType,
    priority,
    eventId,
  }) =>
    axiosRequest.get("/my-requests", {
      params: {
        page,
        limit,
        search,
        status,
        requestType,
        priority,
        eventId,
      },
    }),

  getMyRequestDetail: ({ requestId }) =>
    axiosRequest.get(`/my-requests/${requestId}`),

  submitMyRequest: ({ formData }) =>
    axiosRequest.post("/my-requests", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateMyRequest: ({ requestId, formData }) =>
    axiosRequest.patch(`/my-requests/${requestId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Employee My Expenses
  getMyExpenseAnalytics: () => axiosRequest.get("/my-expenses/analytics"),

  getMyExpenses: ({
    page = 1,
    limit = 8,
    search,
    status,
    category,
    expenseType,
    startDate,
    endDate,
  }) =>
    axiosRequest.get("/my-expenses", {
      params: {
        page,
        limit,
        search,
        status,
        category,
        expenseType,
        startDate,
        endDate,
      },
    }),

  getMyExpenseDetail: ({ expenseId }) =>
    axiosRequest.get(`/my-expenses/${expenseId}`),

  submitMyExpense: ({ formData }) =>
    axiosRequest.post("/my-expenses", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateMyExpense: ({ expenseId, formData }) =>
    axiosRequest.patch(`/my-expenses/${expenseId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  cancelMyExpense: ({ expenseId, reason }) =>
    axiosRequest.patch(`/my-expenses/${expenseId}/cancel`, { reason }),

  // Employee Vendor Coordination
  getVendorCoordinationAnalytics: () =>
    axiosRequest.get("/vendor-coordination/analytics"),

  getVendorCoordinations: ({
    page = 1,
    limit = 8,
    search,
    status,
    confirmationStatus,
    category,
    city,
    eventId,
    startDate,
    endDate,
  }) =>
    axiosRequest.get("/vendor-coordination", {
      params: {
        page,
        limit,
        search,
        status,
        confirmationStatus,
        category,
        city,
        eventId,
        startDate,
        endDate,
      },
    }),

  getVendorCoordinationDetail: ({ vendorId, assignmentId }) =>
    axiosRequest.get(`/vendor-coordination/${vendorId}/${assignmentId}`),

  updateVendorCoordinationStatus: ({
    vendorId,
    assignmentId,
    status,
    confirmationStatus,
    note,
  }) =>
    axiosRequest.patch(`/vendor-coordination/${vendorId}/${assignmentId}/status`, {
      status,
      confirmationStatus,
      note,
    }),

  uploadVendorCoordinationProof: ({ vendorId, assignmentId, formData }) =>
    axiosRequest.patch(`/vendor-coordination/${vendorId}/${assignmentId}/proof`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  raiseVendorCoordinationIssue: ({ vendorId, assignmentId, formData }) =>
    axiosRequest.post(`/vendor-coordination/${vendorId}/${assignmentId}/issues`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  addVendorCoordinationNote: ({ vendorId, assignmentId, note }) =>
    axiosRequest.post(`/vendor-coordination/${vendorId}/${assignmentId}/notes`, { note }),

  // Package
  getAllPackage: ({ page, limit }) =>
    axiosRequest.get("/package", { page, limit }),

  getSinglePackage: ({ permalink }) =>
    axiosRequest.get(`/package/${permalink}`),

  addNewPackage: ({
    name,
    description,
    capacity,
    price,
    notes,
    policy,
    packageListTextItems,
    productBannerImgArr,
    productMainImgArr,
    rating,
  }) =>
    axiosRequest.post("/package", {
      name,
      description,
      capacity,
      price,
      notes,
      policy,
      packageListTextItems,
      productBannerImgArr,
      productMainImgArr,
      rating,
    }),

  updatePackage: ({ permalink }) => axiosRequest.patch(`/package/${permalink}`),

  deletePackage: ({ packageId }) =>
    axiosRequest.delete(`/package/${packageId}`),

  // Orders
  getNewOrders: () => axiosRequest.get("/order-new"),

  getAllOrders: () => axiosRequest.get("/orders"),

  getBookings: ({ bookingId }) =>
    axiosRequest.get(`/order/booking/${bookingId}`),

  getAllBookings: () => axiosRequest.get("/order/success"),

  getSingleOrder: ({ orderId }) => axiosRequest.get(`/order/${orderId}`),

  getFilterOrder: () => axiosRequest.get("/order-filter"),

  changeOrderStatus: ({ orderId }) => axiosRequest.patch(`/order/${orderId}`),

  // User
  getAllUser: () => axiosRequest.get("/users"),

  getSingleUser: ({ userId }) => axiosRequest.get(`/user/${userId}`),

  deleteUser: ({ userId }) => axiosRequest.delete(`/user/${userId}`),

  // Admin
  getAdminProfile: () => axiosRequest.get("/profile"),

  changePassword: () => axiosRequest.post("/change-password"),

  // Area Zones
  getAllAreaZones: () => axiosRequest.get("/areas-zone"),

  getSingleAreaZone: ({ areaZoneId }) =>
    axiosRequest.get(`/areas-zone/${areaZoneId}`),

  getAllPinCodes: () => axiosRequest.get("/areas"),

  addNewAreaZone: ({ areaPinCode, state, district, startDate, endDate }) =>
    axiosRequest.post("/areas-zone", {
      areaPinCode,
      state,
      district,
      startDate,
      endDate,
    }),

  updateAreaZone: ({
    areaZoneId,
    state,
    district,
    areaPinCode,
    startDate,
    endDate,
    isAvailable,
  }) =>
    axiosRequest.patch(`/area-zone/${areaZoneId}`, {
      state,
      district,
      areaPinCode,
      startDate,
      endDate,
      isAvailable,
    }),

  // -------------------- Stock Service ----------------------
  getStocks: ({
    page,
    searchTerm,
    limit,
    category,
    status
  }) => axiosRequest.get("/stock", {
    params: {
      page,
      searchTerm,
      limit,
      category,
      status
    }
  }),

  getLatestCreatedStock: () => axiosRequest.get("/latest-stock"),

  getSingleStock: ({ sku }) => axiosRequest.get(`/stock/${sku}`),

  getStockMetrics: () => axiosRequest.get("/stock-metrics"),

  getStockVariantOptions: () => axiosRequest.get("/stock-variant-options"),

  createStock: ({
    formData,
  }) =>
    axiosRequest.post(
      "/create-stock",
      { ...formData },
    ),

  createStockVariant: ({
    formData,
  }) =>
    axiosRequest.post(
      "/create-stock-variant",
      { ...formData },
    ),

  editParentStock: ({ sku, status, name, category, remarks }) => axiosRequest.patch(`stock/edit-parent/${sku}`, { status, name, category, remarks }),
  editVariantStock: ({ sku, formData }) => axiosRequest.patch(`stock/edit-variant/${sku}`, { ...formData }),

  updateSingleStock: ({ sku, formData }) =>
    axiosRequest.patch(`/stock/edit-variant/${sku}`, formData),

  inwardStock: ({ action, stockId, quantity, inwardQtyId, notes, supplier }) =>
    axiosRequest.patch(`/stock/inward/${stockId}`, { quantity, notes, supplier }, {
      params: {
        action,
        inwardQtyId
      }
    }),

  lossStock: ({ action, stockId, quantity, lossQtyId, notes }) =>
    axiosRequest.patch(`/stock/loss/${stockId}`, { quantity, notes }, {
      params: {
        action,
        lossQtyId
      }
    }),

  repairStock: ({ action, stockId, quantity, repairedQtyId, notes, repairShopName, returnDate }) =>
    axiosRequest.patch(`/stock/repair/${stockId}`, { quantity, notes, repairShopName, returnDate }, {
      params: {
        action,
        repairedQtyId
      }
    }),

  damageStock: ({ action, stockId, quantity, damageQtyId, notes }) =>
    axiosRequest.patch(`/stock/damage/${stockId}`, { quantity, notes }, {
      params: {
        action,
        damageQtyId
      }
    }),

  deleteSingleStock: ({ sku }) => axiosRequest.delete(`/stock/${sku}`),
  deleteVariantStock: ({ sku }) => axiosRequest.delete(`/stock/delete-variant/${sku}`),

  // --------------------- Product Service ------------------------
  getProducts: ({ page, searchTerm, limit, category, status }) =>
    axiosRequest.get("/product", {
      params: { page, searchTerm, limit, category, status },
    }),
  getProductMetrics: () => axiosRequest.get("/product/metrics"),

  getProductOption: () => axiosRequest.get("/product-option"),

  getSingleProductDetail: ({ productId }) =>
    axiosRequest.get(`/product/${productId}`),

  getProductForEdit: ({ productId }) =>
    axiosRequest.get(`/product/edit/${productId}`),

  createProduct: ({ formData }) =>
    axiosRequest.post("/create-product", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  editProduct: ({ productId, formData }) =>
    axiosRequest.patch(`/product/${productId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  deleteProduct: ({ productId }) =>
    axiosRequest.delete(`/product/${productId}`),

  deleteProductImage: ({ productId, imageURL, imgId }) =>
    axiosRequest.delete(`/delete-product-image/${productId}`, {
      params: { imageURL, imgId },
    }),

  // ------------------ Package Service ---------------------
  getPackages: ({ page, limit, searchTerm }) =>
    axiosRequest.get("/packages", { params: { page, limit, searchTerm } }),

  getPackageDetail: ({ packageId }) =>
    axiosRequest.get(`/packages/${packageId}`),

  getSinglePackageForEdit: ({ packageId }) =>
    axiosRequest.get(`/edit-package-data/${packageId}`),

  getPackageProduct: (packageId) =>
    axiosRequest.get(`/package/${packageId}/products`),

  createPackage: ({ formData }) =>
    axiosRequest.post("/create-package", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updatePackage: ({ packageId, formData }) =>
    axiosRequest.patch(`/package/${packageId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updatePackageV2: ({ packageId, formData }) =>
    axiosRequest.patch(`/package/${packageId}/detail`, formData),

  updatePackageCateringInfo: ({ packageId, formData }) =>
    axiosRequest.patch(`/package/${packageId}/catering-info`, formData),

  updatePackageProduct: ({ packageId, productId, action }) =>
    axiosRequest.patch(`/package/${packageId}/product`, {
      productId, action
    }),

  deletePackage: ({ packageId }) =>
    axiosRequest.delete(`/packages/${packageId}`),

  deletePackageImage: ({ packageId, imageType, imageURL }) =>
    axiosRequest.delete(`/delete-package-image/${packageId}`, {
      params: { imageType, imageURL },
    }),

  // --------------------- Product Category Service ------------------------
  getProductCategory: () => axiosRequest.get("/category"),
  postProductCategory: ({ name }) => axiosRequest.post("/category", { name }),
  patchProductCategory: ({ id, name }) =>
    axiosRequest.patch(`/category/${id}`, { name }),
  deleteProductCategory: ({ id }) => axiosRequest.delete(`/category/${id}`),

  // --------------------- Package Class Service ---------------------------
  getPackageClass: () => axiosRequest.get("/package-class"),
  postPackageClass: ({ name }) => axiosRequest.post("/package-class", { name }),
  patchPackageClass: ({ id, name }) =>
    axiosRequest.patch(`/package-class/${id}`, { name }),
  deletePackageClass: ({ id }) => axiosRequest.delete(`/package-class/${id}`),

  // --------------------- Package Size Service ----------------------------
  getPackageSize: () => axiosRequest.get("/package-size"),
  postPackageSize: ({ size }) => axiosRequest.post("/package-size", { size }),
  patchPackageSize: ({ id, size }) =>
    axiosRequest.patch(`/package-size/${id}`, { size }),
  deletePackageSize: ({ id }) => axiosRequest.delete(`/package-size/${id}`),

  //---------------------Customer--------------------------------
  getAssignedClient: ({ page, limit, search, isGST, leadStatus, proposalStatus, employeeId }) =>
    axiosRequest.get("/customer", { params: { page, limit, search, isGST, leadStatus, proposalStatus, employeeId } }),
  createCustomer: (formData) => axiosRequest.post("/customer", formData),
  getEmployee: ({ page, limit, search }) => axiosRequest.get("/employee", { params: { page, limit, search } }),
  getCustomerDetail: ({ id }) => axiosRequest.get(`/customer/${id}`),
  addNoteCustomer: ({ customerId, date, note }) => axiosRequest.patch(`/customer/${customerId}/note`, { date, note }),
  updateCustomerTask: ({ customerId, action, taskId, ...formData }) =>
    axiosRequest.patch(`/customer/${customerId}/task`, formData, {
      params: {
        action,
        ...(taskId ? { taskId } : {}),
      },
    }),
  updateCustomerCrmStatus: ({ customerId, status }) =>
    axiosRequest.patch(`/customer/${customerId}/crm-status`, { status }),
  updateCustomer: ({ id, ...formData }) => axiosRequest.patch(`/customer/${id}/edit`, formData),

};




export default EmployeeService;
