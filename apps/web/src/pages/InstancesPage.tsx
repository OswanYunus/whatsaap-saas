import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, RefreshCw, AlertCircle, Wifi, User } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface InstanceData {
  id: string;
  name: string;
  phoneNumber: string | null;
  displayName: string | null;
  status: string;
  lastSeenAt: string | null;
  lastError: string | null;
}

export default function InstancesPage() {
  const { workspaceId, accessToken } = useAuth();
  const [instances, setInstances] = useState<InstanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstances = useCallback(async () => {
    if (!workspaceId || !accessToken) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiFetch<InstanceData[]>(`/api/whatsapp/instances?workspaceId=${workspaceId}`, {
        accessToken
      });
      setInstances(data);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to load instances");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, accessToken]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const handleDisconnect = async (id: string) => {
    if (!accessToken) return;
    if (!confirm("Are you sure you want to delete and disconnect this WhatsApp instance? All session data will be permanently wiped.")) {
      return;
    }

    try {
      await apiFetch(`/api/whatsapp/instances/${id}`, {
        method: "DELETE",
        accessToken
      });
      setInstances((prev) => prev.filter((inst) => inst.id !== id));
    } catch (err) {
      alert((err as Error).message || "Failed to disconnect instance");
    }
  };

  const handleForceReconnect = async (id: string) => {
    if (!accessToken) return;
    try {
      await apiFetch(`/api/whatsapp/instances/${id}/reconnect`, {
        method: "POST",
        accessToken
      });
      fetchInstances();
    } catch (err) {
      alert((err as Error).message || "Failed to trigger reconnection");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="page-header">
          <h1 className="page-title">WhatsApp Instances</h1>
          <p className="page-subtitle">Manage connected WhatsApp accounts and devices.</p>
        </div>
        <Link to="/instances/connect" className="btn-accent shrink-0 flex items-center gap-1">
          <Plus size={14} strokeWidth={2} /> Connect device
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-[13px] text-red-600 dark:text-red-400">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={fetchInstances} className="ml-auto flex items-center gap-1 text-2xs hover:underline">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="card p-10 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="animate-spin text-accent-500" size={24} />
          <p className="text-[13px] text-ink-400">Fetching active devices...</p>
        </div>
      ) : instances.length === 0 ? (
        <div className="card empty-state p-10">
          <div className="empty-state-icon">
            <Wifi size={24} />
          </div>
          <h3 className="empty-state-title">No WhatsApp instances connected</h3>
          <p className="empty-state-desc">
            Connect a device using QR code or a phone pairing code to start sending campaign messages.
          </p>
          <Link to="/instances/connect" className="btn-primary mt-4">
            Connect first device
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Instance Details</th>
                <th>Status</th>
                <th>Phone Number</th>
                <th>Last Active</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((instance) => {
                const isConnecting = ["CONNECTING", "RECONNECTING", "QR_WAITING", "PAIRING_CODE"].includes(instance.status);
                
                return (
                  <tr key={instance.id} className="table-row">
                    <td>
                      <div className="font-semibold text-ink-800 dark:text-white flex items-center gap-1.5">
                        {instance.name}
                        {instance.displayName && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-ink-100 dark:bg-white/10 px-2 py-0.5 text-3xs font-medium text-ink-600 dark:text-ink-300">
                            <User size={10} />
                            {instance.displayName}
                          </span>
                        )}
                      </div>
                      <div className="text-2xs text-ink-400">ID: {instance.id}</div>
                      {instance.lastError && (
                        <div className="mt-1 text-3xs text-red-500 font-mono flex items-center gap-0.5">
                          <AlertCircle size={10} />
                          {instance.lastError}
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={instance.status} pulse={isConnecting} />
                    </td>
                    <td className="font-mono text-ink-500 dark:text-ink-400">
                      {instance.phoneNumber ? `+${instance.phoneNumber}` : "—"}
                    </td>
                    <td className="text-ink-500 dark:text-ink-400 text-xs">
                      {instance.lastSeenAt ? new Date(instance.lastSeenAt).toLocaleString() : "—"}
                    </td>
                    <td className="text-right space-x-1.5">
                      {instance.status !== "CONNECTED" && (
                        <button
                          onClick={() => handleForceReconnect(instance.id)}
                          className="btn-outline h-7 px-2.5 py-1 text-2xs"
                          title="Reconnect or refresh pairing session"
                        >
                          <RefreshCw size={12} className="inline mr-1" /> Reconnect
                        </button>
                      )}
                      <button
                        onClick={() => handleDisconnect(instance.id)}
                        className="btn-danger h-7 w-7 p-0 inline-flex items-center justify-center"
                        title="Disconnect and delete session data"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
