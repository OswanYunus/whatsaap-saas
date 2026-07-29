import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import InstancesPage from "./pages/InstancesPage";
import ContactsPage from "./pages/ContactsPage";
import CampaignsPage from "./pages/CampaignsPage";
import MessagesPage from "./pages/MessagesPage";
import SettingsPage from "./pages/SettingsPage";

/**
 * Route tree. Auth pages are outside DashboardLayout (no sidebar);
 * everything else is nested under it. Route-level auth guarding
 * (redirect to /login when unauthenticated) will be added once the
 * login flow is implemented — intentionally left out at this stage.
 */
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<DashboardLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/instances" element={<InstancesPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}