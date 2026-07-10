import React, { lazy, Suspense, useEffect } from "react";
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
import AssignedEventsPage from "../Pages/dashboard/assigned-events/AssignedEventsPage";
import DetailAssignedEventPage from "../Pages/dashboard/assigned-events/DetailAssignedEventPage";
import AssignedClientsPage from "../Pages/dashboard/assigned-clients/AssignedClientsPage";
import FunctionsTimelinePage from "../Pages/dashboard/functions-timeline/FunctionsTimelinePage";
import VendorCoordinationPage from "../Pages/dashboard/vendor-coordination/VendorCoordinationPage";
import InventoryEssentialsPage from "../Pages/dashboard/inventory-essentials/InventoryEssentialsPage";
import DocumentsPage from "../Pages/dashboard/documents/DocumentsPage";
import CommunicationsPage from "../Pages/dashboard/communications/CommunicationsPage";
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
            <Route path="assigned-events" element={<AssignedEventsPage />} />
            <Route path="assigned-events/:eventId" element={<DetailAssignedEventPage />} />
            <Route path="assigned-clients" element={<AssignedClientsPage />} />
            <Route path="assigned-clients/:clientId" element={<DetailAssignedClientPage />} />
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
