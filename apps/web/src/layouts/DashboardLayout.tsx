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
  const [paywallDismissed, setPaywallDismissed] = useState(false);

  const fetchBilling = useCallback(async () => {
    if (user?.isAdmin) {
      setBillingActive(true);
      return;
    }
    if (!workspaceId || !accessToken) return;
    try {
      const b = await apiFetch<{ plan: string; expired: boolean }>(
        `/api/workspaces/${workspaceId}/billing`,
        { accessToken }
      );
      setBillingActive(b.plan !== "FREE" && !b.expired);
    } catch {
      setBillingActive(false);
    }
  }, [workspaceId, accessToken, user]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  useEffect(() => {
    if (!workspaceId) return;
    setPaywallDismissed(window.sessionStorage.getItem(`paywall-dismissed:${workspaceId}`) === "true");
  }, [workspaceId]);

  const dismissPaywall = () => {
    if (workspaceId) {
      window.sessionStorage.setItem(`paywall-dismissed:${workspaceId}`, "true");
    }
    setPaywallDismissed(true);
  };

  return (
    <div className="flex min-h-screen bg-canvas dark:bg-canvas-dark">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="flex-1 overflow-auto p-5 lg:p-6">
          <div className="mx-auto max-w-[1400px] animate-fade-in">
            {billingActive === false && !paywallDismissed && (
              <PaywallModal
                onClose={dismissPaywall}
                onSuccess={() => {
                  setPaywallDismissed(false);
                  fetchBilling();
                }}
                canClose
              />
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
