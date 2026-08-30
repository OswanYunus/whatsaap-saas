import { useEffect, useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import PaywallModal from "../components/PaywallModal";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

export default function DashboardLayout() {
  const { workspaceId, accessToken, user } = useAuth();
  const [billingActive, setBillingActive] = useState<boolean | null>(null);

  const fetchBilling = useCallback(async () => {
    if (user?.isAdmin) {
      setBillingActive(true);
      return;
    }
    if (!workspaceId || !accessToken) return;
    try {
      const b = await apiFetch<{ success: boolean; expired: boolean }>(
        `/api/workspaces/${workspaceId}/billing`,
        { accessToken }
      );
      setBillingActive(b.success && !b.expired);
    } catch {
      setBillingActive(false);
    }
  }, [workspaceId, accessToken, user]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  return (
    <div className="flex min-h-screen bg-canvas dark:bg-canvas-dark">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="flex-1 overflow-auto p-5 lg:p-6">
          <div className="mx-auto max-w-[1400px] animate-fade-in">
            {billingActive === false && (
              <PaywallModal
                onClose={() => {}}
                onSuccess={() => fetchBilling()}
                canClose={false}
              />
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
