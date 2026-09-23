import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LoginForm from "../Pages/auth/Login";
import Register from "../Pages/auth/Register";
import ResetPassword from "../Pages/auth/ResetPassword";
import { ForgetPasswordPage } from "../Pages/auth/ForgetPasswordPage";
import Layout from "../Pages/dashboard/Layout"; 
import ProtectedRoute from "./ProtectedRoute";
import SuspenseLoader from "../components/components/SuspenseLoader";
import { useSelector } from "react-redux";
import DashboardPage from "../Pages/dashboard/dashboard/DashboardPage";
import MyProfilePage from "../Pages/dashboard/my-profile/MyProfilePage";
import MyTasksPage from "../Pages/dashboard/my-tasks/MyTasksPage";
import AssignedClientsPage from "../Pages/dashboard/assigned-clients/AssignedClientsPage";
import EventBookingDashboardPage from "../Pages/dashboard/event-booking-workspace/EventBookingDashboardPage";
import EventOverviewPage from "../Pages/dashboard/event-booking-workspace/EventOverviewModernPage";
import EventFunctionsPage from "../Pages/dashboard/event-booking-workspace/EventFunctionsAdminPage";
import EventServicesPage from "../Pages/dashboard/event-booking-workspace/EventServicesAdminPage";
import EventGuestsPage from "../Pages/dashboard/event-booking-workspace/EventGuestsPage";
import EventGuestListPage from "../Pages/dashboard/event-booking-workspace/EventGuestListPage";
import EventAccommodationPage from "../Pages/dashboard/event-booking-workspace/EventAccommodationPage";
import EventTransportPage from "../Pages/dashboard/event-booking-workspace/EventTransportPage";
import EventHospitalityPage from "../Pages/dashboard/event-booking-workspace/EventHospitalityPage";
import EventVisualPreferencesPage from "../Pages/dashboard/event-booking-workspace/EventVisualPreferencesPage";
import EventClientApprovalsPage from "../Pages/dashboard/event-booking-workspace/EventClientApprovalsPage";
import EventOperationsPage from "../Pages/dashboard/event-booking-workspace/EventOperationsPage";
import EventVendorsPage from "../Pages/dashboard/event-booking-workspace/EventVendorsPage";
import EventInventoryPage from "../Pages/dashboard/event-booking-workspace/EventInventoryPage";
import EventLogisticsPage from "../Pages/dashboard/event-booking-workspace/EventLogisticsPage";
import EventRunSheetPage from "../Pages/dashboard/event-booking-workspace/EventRunSheetPage";
import EventRolesResponsibilitiesPage from "../Pages/dashboard/event-booking-workspace/EventRolesResponsibilitiesPage";
import EventFinancePage from "../Pages/dashboard/event-booking-workspace/EventFinancePage";
import EventActivityPage from "../Pages/dashboard/event-booking-workspace/EventActivityPage";
import EventBookingLayout from "../Pages/dashboard/event-booking-workspace/EventBookingLayout";
import VendorCoordinationPage from "../Pages/dashboard/vendor-coordination/VendorCoordinationPage";
import InventoryEssentialsPage from "../Pages/dashboard/inventory-essentials/InventoryEssentialsPage";
import DocumentsPage from "../Pages/dashboard/documents/DocumentsPage";
import MyExpensesPage from "../Pages/dashboard/my-expenses/MyExpensesPage";
import MyRequestsApprovalPage from "../Pages/dashboard/my-requests-approvals/MyRequestsApprovalPage";
import AttendenceLeavePage from "../Pages/dashboard/attendence-leave/AttendenceLeavePage";
import MyReportsPage from "../Pages/dashboard/my-reports/MyReportsPage";
import Logout from "../Pages/dashboard/LogoutPage";
import DetailAssignedClientPage from "../Pages/dashboard/assigned-clients/DetailAssignedClientPage";
import DetailVendorCoordinationPage from "../Pages/dashboard/vendor-coordination/DetailVendorCoordinationPage";
import ScorecardPage from "../Pages/dashboard/knowledge-base-sop/ScorecardPage";
import DetailPayrollSalaryPage from "../Pages/dashboard/payroll-&-salary/PayrollSalaryPage";

const NotFoundPage = lazy(() => import("../Pages/dashboard/NotFoundPage"));

const DashBoardRoutes = () => {
  const theme = useSelector((state) => state.theme);

  useEffect(() => {
    if (!["light", "dark"].includes(theme)) return;

    document.documentElement.classList.toggle(
      "dark",
      theme === "dark"
    );

    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <Router>
      {/* 3. SUSPENSE WRAPPER (Handles fallback loading screen for lazy items) */}
      <Suspense fallback={<SuspenseLoader />}>
        <Routes>
          {/* Auth Routes (Static) */}
          <Route path="/" element={<LoginForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/forget-password" element={<ForgetPasswordPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/loader" element={<SuspenseLoader />} />

          {/* Dashboard Protected Context */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Lazy Dashboard Sub-Routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="my-tasks" element={<MyTasksPage />} />
            <Route path="assigned-events" element={<EventBookingDashboardPage />} />
            <Route path="assigned-events/:eventId" element={<EventBookingLayout />}>
              <Route index element={<EventOverviewPage />} />
              <Route path="plan/functions" element={<EventFunctionsPage />} />
              <Route path="plan/services" element={<EventServicesPage />} />
              <Route path="plan/guests" element={<EventGuestsPage />} />
              <Route path="plan/guests/list" element={<EventGuestListPage />} />
              <Route path="plan/guests/accommodation" element={<EventAccommodationPage />} />
              <Route path="plan/guests/transport" element={<EventTransportPage />} />
              <Route path="plan/guests/hospitality" element={<EventHospitalityPage />} />
              <Route path="plan/preferences" element={<EventVisualPreferencesPage />} />
              <Route path="plan/approvals" element={<EventClientApprovalsPage />} />
              <Route path="operations" element={<EventOperationsPage />} />
              <Route path="operations/vendors" element={<EventVendorsPage />} />
              <Route path="operations/inventory" element={<EventInventoryPage />} />
              <Route path="operations/logistics" element={<EventLogisticsPage />} />
              <Route path="operations/run-sheet" element={<EventRunSheetPage />} />
              <Route path="operations/roles-responsibilities" element={<EventRolesResponsibilitiesPage />} />
              <Route path="finance" element={<EventFinancePage />} />
              <Route path="finance/:section" element={<EventFinancePage />} />
              <Route path="activity" element={<EventActivityPage />} />
            </Route>
            <Route path="assigned-clients" element={<AssignedClientsPage />} />
            <Route path="assigned-clients/:clientId" element={<DetailAssignedClientPage />} />
            <Route
              path="assigned-clients/:clientId/events/:eventId"
              element={<EventOverviewPage />}
            />
            <Route path="vendor-coordination" element={<VendorCoordinationPage />} />
            <Route path="vendor-coordination/:vendorId/:assignmentId" element={<DetailVendorCoordinationPage />} />
            <Route path="inventory-essentials" element={<InventoryEssentialsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="expenses" element={<MyExpensesPage />} />
            <Route path="requests-approvals" element={<MyRequestsApprovalPage />} />
            <Route path="attendence-&-leave" element={<AttendenceLeavePage />} />
            <Route path="reports" element={<MyReportsPage />} />
            <Route path="scorecard" element={<ScorecardPage />} />
            <Route path="profile" element={<MyProfilePage />} />
            <Route path="payroll-&-salary" element={<DetailPayrollSalaryPage />} />

            <Route path="/dashboard/logout" element={<Logout />} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
};

export default DashBoardRoutes;
