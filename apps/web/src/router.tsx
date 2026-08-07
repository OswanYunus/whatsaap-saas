import { Routes, Route } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "./components/RouteGuards";
import DashboardLayout from "./layouts/DashboardLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import InstancesPage from "./pages/InstancesPage";
import InstanceConnectPage from "./pages/InstanceConnectPage";
import ContactsPage from "./pages/ContactsPage";
import CampaignsPage from "./pages/CampaignsPage";
import CampaignCreatePage from "./pages/CampaignCreatePage";
import CampaignDetailPage from "./pages/CampaignDetailPage";
import QueueMonitorPage from "./pages/QueueMonitorPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import DeveloperApiPage from "./pages/DeveloperApiPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

export default function AppRouter() {
  return (
    <Routes>
      {/* Public-only routes (unauthenticated) */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Verification page — accessible without being fully logged in */}
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Protected dashboard routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/instances" element={<InstancesPage />} />
          <Route path="/instances/connect" element={<InstanceConnectPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/campaigns/new" element={<CampaignCreatePage />} />
          <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="/queue" element={<QueueMonitorPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/developer-api" element={<DeveloperApiPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
