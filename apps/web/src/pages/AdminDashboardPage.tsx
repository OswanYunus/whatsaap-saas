import { useState, useEffect, useCallback } from "react";
import { Shield, ShieldCheck, Ban, CheckCircle, RefreshCw, Users } from "lucide-react";
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
}

export default function AdminDashboardPage() {
  const { accessToken, user } = useAuth();
  const token = accessToken ?? undefined;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
      <div className="grid grid-cols-3 gap-3">
        <div className="card-flat p-4 text-center">
          <div className="text-2xl font-bold text-ink-800 dark:text-white">{users.length}</div>
          <div className="mt-1 text-xs text-ink-400 flex items-center justify-center gap-1"><Users size={12} /> Total Accounts</div>
        </div>
        <div className="card-flat p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{users.filter((u) => u.isVerified).length}</div>
          <div className="mt-1 text-xs text-ink-400 flex items-center justify-center gap-1"><CheckCircle size={12} /> Verified</div>
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
                  <th className="px-4 py-3 text-left font-medium text-ink-400">Joined</th>
                  <th className="px-4 py-3 text-right font-medium text-ink-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.email === user?.email;
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
                          {u.isAdmin && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent-500/10 px-2 py-0.5 text-2xs font-semibold text-accent-600 dark:text-accent-400">
                              <ShieldCheck size={10} /> Admin
                            </span>
                          )}
                          {u.isVerified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-2xs font-semibold text-green-600 dark:text-green-400">
                              <CheckCircle size={10} /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-2xs font-semibold text-amber-600 dark:text-amber-400">
                              Unverified
                            </span>
                          )}
                          {u.isBlocked && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-2xs font-semibold text-red-600 dark:text-red-400">
                              <Ban size={10} /> Blocked
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-400">
                        {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        {!isSelf && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => toggleElevate(u.id)}
                              disabled={actionLoading === `elevate-${u.id}`}
                              title={u.isAdmin ? "Remove admin" : "Make admin"}
                              className={`flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium transition-colors ${
                                u.isAdmin
                                  ? "bg-accent-500/10 text-accent-600 hover:bg-accent-500/20 dark:text-accent-400"
                                  : "bg-ink-100 text-ink-500 hover:bg-ink-200 dark:bg-white/10 dark:text-ink-300 dark:hover:bg-white/20"
                              }`}
                            >
                              {actionLoading === `elevate-${u.id}` ? (
                                <RefreshCw size={10} className="animate-spin" />
                              ) : (
                                <ShieldCheck size={10} />
                              )}
                              {u.isAdmin ? "Revoke" : "Elevate"}
                            </button>
                            <button
                              onClick={() => toggleBlock(u.id)}
                              disabled={actionLoading === `block-${u.id}`}
                              title={u.isBlocked ? "Unblock account" : "Block account"}
                              className={`flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium transition-colors ${
                                u.isBlocked
                                  ? "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400"
                                  : "bg-ink-100 text-ink-500 hover:bg-red-100 hover:text-red-600 dark:bg-white/10 dark:text-ink-300 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                              }`}
                            >
                              {actionLoading === `block-${u.id}` ? (
                                <RefreshCw size={10} className="animate-spin" />
                              ) : (
                                <Ban size={10} />
                              )}
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
    </div>
  );
}
