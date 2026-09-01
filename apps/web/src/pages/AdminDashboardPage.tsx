import { useState, useEffect, useCallback } from "react";
import { Shield, ShieldCheck, Ban, CheckCircle, RefreshCw, Users, Key, X, Package, Clock } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  isVerified: boolean;
  isAdmin: boolean;
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  workspaceId: string | null;
  plan: string;
  subscriptionExpiresAt: string | null;
  subscriptionCancelAt: string | null;
  workspaceName: string;
}

type GrantPlan = "FREE" | "BASIC" | "PREMIUM" | "PRO";

export default function AdminDashboardPage() {
  const { accessToken, user } = useAuth();
  const token = accessToken ?? undefined;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Password reset modal states
  const [resettingUser, setResettingUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);
  const [grantingUser, setGrantingUser] = useState<AdminUser | null>(null);
  const [grantPlan, setGrantPlan] = useState<GrantPlan>("PREMIUM");
  const [grantDays, setGrantDays] = useState(30);
  const [grantError, setGrantError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch<AdminUser[]>("/api/admin/users", { accessToken: token });
      setUsers(data);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleElevate = async (userId: string) => {
    if (!token) return;
    setActionLoading(`elevate-${userId}`);
    try {
      const res = await apiFetch<{ success: boolean; isAdmin: boolean }>(
        `/api/admin/users/${userId}/elevate`,
        { method: "POST", accessToken: token }
      );
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isAdmin: res.isAdmin } : u));
    } catch {
      /* silently fail */
    } finally {
      setActionLoading(null);
    }
  };

  const toggleBlock = async (userId: string) => {
    if (!token) return;
    setActionLoading(`block-${userId}`);
    try {
      const res = await apiFetch<{ success: boolean; isBlocked: boolean }>(
        `/api/admin/users/${userId}/block`,
        { method: "POST", accessToken: token }
      );
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isBlocked: res.isBlocked } : u));
    } catch {
      /* silently fail */
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !token) return;
    setActionLoading(`reset-${resettingUser.id}`);
    setResetError(null);
    setResetSuccess(false);
    try {
      await apiFetch<{ success: boolean }>(
        `/api/admin/users/${resettingUser.id}/reset-password`,
        {
          method: "POST",
          accessToken: token,
          body: JSON.stringify({ password: newPassword })
        }
      );
      setResetSuccess(true);
      setNewPassword("");
      setTimeout(() => {
        setResettingUser(null);
        setResetSuccess(false);
      }, 1500);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGrantPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantingUser || !token) return;
    setActionLoading(`grant-${grantingUser.id}`);
    setGrantError(null);
    try {
      const res = await apiFetch<{
        success: boolean;
        plan: string;
        subscriptionExpiresAt: string | null;
        subscriptionCancelAt: string | null;
      }>(
        `/api/admin/users/${grantingUser.id}/package`,
        {
          method: "POST",
          accessToken: token,
          body: JSON.stringify({ plan: grantPlan, days: grantDays })
        }
      );
      setUsers((prev) => prev.map((u) => u.id === grantingUser.id ? {
        ...u,
        plan: res.plan,
        subscriptionExpiresAt: res.subscriptionExpiresAt,
        subscriptionCancelAt: res.subscriptionCancelAt
      } : u));
      setGrantingUser(null);
    } catch (err) {
      setGrantError(err instanceof Error ? err.message : "Failed to grant package");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="page-header">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-accent-500" />
            <h1 className="page-title">Admin Dashboard</h1>
          </div>
          <p className="page-subtitle">
            Manage all registered accounts. Logged in as{" "}
            <span className="font-medium text-accent-600 dark:text-accent-400">{user?.email}</span>
          </p>
        </div>
        <button onClick={fetchUsers} className="btn-ghost h-8 w-8 p-0" title="Refresh">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-flat p-4 text-center">
          <div className="text-2xl font-bold text-ink-800 dark:text-white">{users.length}</div>
          <div className="mt-1 text-xs text-ink-400 flex items-center justify-center gap-1"><Users size={12} /> Total Accounts</div>
        </div>
        <div className="card-flat p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{users.filter((u) => u.isVerified).length}</div>
          <div className="mt-1 text-xs text-ink-400 flex items-center justify-center gap-1"><CheckCircle size={12} /> Verified</div>
        </div>
        <div className="card-flat p-4 text-center">
          <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">
            {users.filter((u) => u.plan && u.plan !== "FREE" && u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt) > new Date()).length}
          </div>
          <div className="mt-1 text-xs text-ink-400 flex items-center justify-center gap-1"><Package size={12} /> Active Plans</div>
        </div>
        <div className="card-flat p-4 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{users.filter((u) => u.isBlocked).length}</div>
          <div className="mt-1 text-xs text-ink-400 flex items-center justify-center gap-1"><Ban size={12} /> Blocked</div>
        </div>
      </div>

      {/* Users table */}
      <div className="card-flat overflow-hidden">
        <div className="p-4 border-b border-ink-100/60 dark:border-white/10">
          <h2 className="section-title flex items-center gap-2"><Users size={14} /> Registered Accounts</h2>
        </div>
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-md bg-ink-100/80 dark:bg-white/10" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-ink-400">No accounts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-ink-100/60 dark:border-white/10">
                  <th className="px-4 py-3 text-left font-medium text-ink-400">User</th>
                  <th className="px-4 py-3 text-left font-medium text-ink-400">Phone</th>
                  <th className="px-4 py-3 text-left font-medium text-ink-400">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-ink-400">Plan</th>
                  <th className="px-4 py-3 text-left font-medium text-ink-400"><span className="flex items-center gap-1"><Clock size={11} />Last Login</span></th>
                  <th className="px-4 py-3 text-left font-medium text-ink-400"><span className="flex items-center gap-1"><Clock size={11} />Last Active</span></th>
                  <th className="px-4 py-3 text-right font-medium text-ink-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.email === user?.email;
                  const planActive = u.plan && u.plan !== "FREE" && u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt) > new Date();
                  const planColor = u.isAdmin ? "text-accent-600 dark:text-accent-400" : planActive ? "text-green-600 dark:text-green-400" : "text-ink-400";
                  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
                  return (
                    <tr key={u.id} className="border-b border-ink-100/40 dark:border-white/5 hover:bg-ink-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-white dark:bg-accent-500 dark:text-ink-900">
                            {(u.name?.[0] || u.email[0]).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-ink-800 dark:text-ink-100">
                              {u.name || "—"} {isSelf && <span className="ml-1 text-2xs text-accent-500">(you)</span>}
                            </div>
                            <div className="truncate text-ink-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-ink-500 dark:text-ink-400">{u.phoneNumber || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.isAdmin && <span className="inline-flex items-center gap-1 rounded-full bg-accent-500/10 px-2 py-0.5 text-2xs font-semibold text-accent-600 dark:text-accent-400"><ShieldCheck size={10} /> Admin</span>}
                          {u.isVerified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-2xs font-semibold text-green-600 dark:text-green-400"><CheckCircle size={10} /> Verified</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-2xs font-semibold text-amber-600 dark:text-amber-400">Unverified</span>
                          )}
                          {u.isBlocked && <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-2xs font-semibold text-red-600 dark:text-red-400"><Ban size={10} /> Blocked</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${planColor}`}>
                          {u.isAdmin ? "Admin (Free)" : u.plan || "FREE"}
                        </span>
                        {!u.isAdmin && u.subscriptionExpiresAt && (
                          <div className="text-[10px] text-ink-400 mt-0.5">
                            {planActive ? `Expires ${new Date(u.subscriptionExpiresAt).toLocaleDateString()}` : "Expired"}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-400 text-xs whitespace-nowrap">{fmtDate(u.lastLoginAt)}</td>
                      <td className="px-4 py-3 text-ink-400 text-xs whitespace-nowrap">{fmtDate(u.lastActiveAt)}</td>
                      <td className="px-4 py-3">
                        {!isSelf && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => { setResettingUser(u); setNewPassword(""); setResetError(null); setResetSuccess(false); }} title="Reset Password" className="flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium bg-ink-100 text-ink-500 hover:bg-ink-200 dark:bg-white/10 dark:text-ink-300 dark:hover:bg-white/20 transition-colors">
                              <Key size={10} /> Password
                            </button>
                            <button onClick={() => { setGrantingUser(u); setGrantPlan((u.plan === "BASIC" || u.plan === "PREMIUM" || u.plan === "PRO") ? u.plan : "PREMIUM"); setGrantDays(30); setGrantError(null); }} title="Grant package" className="flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-1 text-2xs font-medium text-green-700 transition-colors hover:bg-green-500/20 dark:text-green-400">
                              <Package size={10} /> Package
                            </button>
                            <button onClick={() => toggleElevate(u.id)} disabled={actionLoading === `elevate-${u.id}`} title={u.isAdmin ? "Remove admin" : "Make admin"} className={`flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium transition-colors ${u.isAdmin ? "bg-accent-500/10 text-accent-600 hover:bg-accent-500/20 dark:text-accent-400" : "bg-ink-100 text-ink-500 hover:bg-ink-200 dark:bg-white/10 dark:text-ink-300 dark:hover:bg-white/20"}`}>
                              {actionLoading === `elevate-${u.id}` ? <RefreshCw size={10} className="animate-spin" /> : <ShieldCheck size={10} />}
                              {u.isAdmin ? "Revoke" : "Elevate"}
                            </button>
                            <button onClick={() => toggleBlock(u.id)} disabled={actionLoading === `block-${u.id}`} title={u.isBlocked ? "Unblock account" : "Block account"} className={`flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium transition-colors ${u.isBlocked ? "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400" : "bg-ink-100 text-ink-500 hover:bg-red-100 hover:text-red-600 dark:bg-white/10 dark:text-ink-300 dark:hover:bg-red-500/20 dark:hover:text-red-400"}`}>
                              {actionLoading === `block-${u.id}` ? <RefreshCw size={10} className="animate-spin" /> : <Ban size={10} />}
                              {u.isBlocked ? "Unblock" : "Block"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Package grant modal overlay */}
      {grantingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-sm space-y-4 p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-800 dark:text-white">
                <Package size={16} className="text-green-600 dark:text-green-400" />
                Grant Package
              </h3>
              <button
                onClick={() => setGrantingUser(null)}
                className="btn-ghost h-7 w-7 p-0"
                aria-label="Close grant package modal"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-ink-400">
              Assign a package to <span className="font-medium text-ink-700 dark:text-ink-200">{grantingUser.email}</span> for testing or support.
            </p>

            <form onSubmit={handleGrantPackage} className="space-y-4">
              {grantError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                  {grantError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-700 dark:text-ink-200">Package</label>
                <select
                  value={grantPlan}
                  onChange={(e) => setGrantPlan(e.target.value as GrantPlan)}
                  className="input"
                  disabled={actionLoading === `grant-${grantingUser.id}`}
                >
                  <option value="FREE">Free / remove package</option>
                  <option value="BASIC">Basic - 1 device</option>
                  <option value="PREMIUM">Premium - 5 devices</option>
                  <option value="PRO">Pro - 10 devices + images</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-700 dark:text-ink-200">Access duration</label>
                <input
                  type="number"
                  min={1}
                  max={366}
                  value={grantDays}
                  onChange={(e) => setGrantDays(Number(e.target.value))}
                  className="input"
                  disabled={grantPlan === "FREE" || actionLoading === `grant-${grantingUser.id}`}
                />
                <p className="text-2xs text-ink-400">
                  Paid packages expire after this number of days. Free removes paid access.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGrantingUser(null)}
                  className="btn-outline px-3 py-1.5 text-xs"
                  disabled={actionLoading === `grant-${grantingUser.id}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-accent flex items-center gap-1 px-3 py-1.5 text-xs"
                  disabled={actionLoading === `grant-${grantingUser.id}`}
                >
                  {actionLoading === `grant-${grantingUser.id}` ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save package"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password reset modal overlay */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-800 dark:text-white flex items-center gap-2">
                <Key size={16} className="text-accent-500" />
                Change Password
              </h3>
              <button
                onClick={() => setResettingUser(null)}
                className="btn-ghost h-7 w-7 p-0"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <p className="text-xs text-ink-400">
                Update the password for user: <span className="font-medium text-ink-700 dark:text-ink-200">{resettingUser.email}</span>
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              {resetError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400">
                  Password updated successfully!
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-700 dark:text-ink-200">New Password</label>
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  required
                  minLength={8}
                  disabled={actionLoading === `reset-${resettingUser.id}`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="btn-outline text-xs px-3 py-1.5"
                  disabled={actionLoading === `reset-${resettingUser.id}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-accent text-xs px-3 py-1.5 flex items-center gap-1"
                  disabled={actionLoading === `reset-${resettingUser.id}` || newPassword.length < 8}
                >
                  {actionLoading === `reset-${resettingUser.id}` ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
