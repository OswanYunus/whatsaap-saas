import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, Copy, Plus, Trash2, Check,
  Eye, EyeOff, Loader2, Save
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

type Tab = "workspace" | "cerebro" | "api-keys" | "appearance" | "danger";

const TABS: { id: Tab; label: string }[] = [
  { id: "workspace", label: "Workspace" },
  { id: "cerebro", label: "Cerebro" },
  { id: "api-keys", label: "API Keys" },
  { id: "appearance", label: "Appearance" },
  { id: "danger", label: "Danger Zone" }
];

/* ─── Workspace Tab ─── */
function WorkspaceTab() {
  const { workspaceId, workspaces, accessToken } = useAuth();
  const token = accessToken ?? undefined;
  const [name, setName] = useState(workspaces[0]?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!workspaceId || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
        accessToken: token
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md space-y-4">
      <div>
        <label className="label">Workspace name</label>
        <input
          className="input mt-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Workspace"
        />
      </div>
      <div>
        <label className="label">Workspace ID</label>
        <div className="mt-1 flex items-center gap-2">
          <input className="input flex-1 font-mono text-2xs" value={workspaceId ?? ""} readOnly />
          <button
            onClick={() => navigator.clipboard.writeText(workspaceId ?? "")}
            className="btn-ghost h-9 w-9 p-0"
            title="Copy ID"
          >
            <Copy size={14} />
          </button>
        </div>
        <p className="mt-1 text-2xs text-ink-400">Used when calling the API directly.</p>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button onClick={handleSave} disabled={saving} className="btn-primary gap-2">
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
        {saved ? "Saved!" : "Save changes"}
      </button>
    </div>
  );
}

/* ─── Cerebro Settings Tab ─── */
function CerebroTab() {
  const { workspaceId, accessToken } = useAuth();
  const token = accessToken ?? undefined;
  const [softwareName, setSoftwareName] = useState("Cerebro");
  const [footerEnabled, setFooterEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    apiFetch<{ softwareName: string; footerEnabled: boolean }>(
      `/api/workspace-settings?workspaceId=${workspaceId}`,
      { accessToken: token }
    )
      .then((data) => {
        setSoftwareName(data.softwareName);
        setFooterEnabled(data.footerEnabled);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId, token]);

  const handleSave = async () => {
    if (!workspaceId) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/workspace-settings", {
        method: "PATCH",
        body: JSON.stringify({ workspaceId, softwareName, footerEnabled }),
        accessToken: token
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-ink-400"><Loader2 size={14} className="animate-spin" /> Loading…</div>;
  }

  return (
    <div className="max-w-md space-y-5">
      <div>
        <label className="label">Software name</label>
        <input
          className="input mt-1"
          value={softwareName}
          onChange={(e) => setSoftwareName(e.target.value)}
          maxLength={50}
          placeholder="Cerebro"
        />
        <p className="mt-1 text-2xs text-ink-400">
          Appears in message footers: <em>Sent via {softwareName || "Cerebro"}</em>.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-ink-100/80 px-3 py-2.5 dark:border-white/10">
        <div>
          <div className="text-[13px] font-medium text-ink-800 dark:text-white">Append footer to messages</div>
          <div className="mt-0.5 text-2xs text-ink-400 italic">
            _Sent via {softwareName || "Cerebro"} on behalf of your business._
          </div>
        </div>
        <button
          onClick={() => setFooterEnabled((v) => !v)}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ${footerEnabled ? "bg-accent-500" : "bg-ink-200 dark:bg-ink-600"}`}
          role="switch"
          aria-checked={footerEnabled}
        >
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${footerEnabled ? "translate-x-[18px]" : "translate-x-0.5"}`} />
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button onClick={handleSave} disabled={saving} className="btn-primary gap-2">
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
        {saved ? "Saved!" : "Save settings"}
      </button>
    </div>
  );
}

/* ─── API Keys Tab ─── */
interface ApiKey {
  id: string;
  label: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

function ApiKeysTab() {
  const { workspaceId, accessToken } = useAuth();
  const token = accessToken ?? undefined;
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const fetchKeys = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const data = await apiFetch<ApiKey[]>(`/api/workspace-api-keys?workspaceId=${workspaceId}`, { accessToken: token });
      setKeys(data);
    } catch {}
    finally { setLoading(false); }
  }, [workspaceId, token]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = async () => {
    if (!workspaceId || !newLabel.trim()) return;
    setCreating(true);
    try {
      const res = await apiFetch<{ rawKey: string } & ApiKey>("/api/workspace-api-keys", {
        method: "POST",
        body: JSON.stringify({ workspaceId, label: newLabel.trim() }),
        accessToken: token
      });
      setRawKey(res.rawKey);
      setNewLabel("");
      setShowCreate(false);
      await fetchKeys();
    } catch (err: any) {
      alert(err.message ?? "Failed to create key");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string, label: string) => {
    if (!confirm(`Revoke key "${label}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/workspace-api-keys/${id}`, { method: "DELETE", accessToken: token });
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err: any) {
      alert(err.message ?? "Failed to revoke");
    }
  };

  const copyKey = () => {
    if (!rawKey) return;
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[13px] text-ink-400">
          API keys let external systems call Cerebro on your workspace's behalf.
          The full key is shown <strong>only once</strong> at creation time.
        </p>
        <button onClick={() => setShowCreate((v) => !v)} className="btn-accent shrink-0">
          <Plus size={14} /> New key
        </button>
      </div>

      {/* New key revealed banner */}
      {rawKey && (
        <div className="rounded-lg border border-green-200 bg-green-50/60 p-3 dark:border-green-500/20 dark:bg-green-500/5">
          <div className="mb-1 text-sm font-medium text-green-700 dark:text-green-400">
            ✅ Key created — copy it now, it won't be shown again.
          </div>
          <div className="flex items-center gap-2">
            <code className={`flex-1 overflow-x-auto rounded bg-white/60 px-2 py-1 font-mono text-xs dark:bg-black/20 ${showKey ? "" : "blur-sm select-none"}`}>
              {rawKey}
            </code>
            <button onClick={() => setShowKey((v) => !v)} className="btn-ghost h-8 w-8 p-0">
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button onClick={copyKey} className="btn-ghost h-8 w-8 p-0">
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
          <button onClick={() => setRawKey(null)} className="mt-2 text-2xs text-ink-400 underline">Dismiss</button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="flex items-center gap-2 rounded-lg border border-ink-100/80 p-3 dark:border-white/10">
          <input
            className="input flex-1"
            placeholder="Key label (e.g. Production)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            maxLength={60}
            autoFocus
          />
          <button onClick={handleCreate} disabled={creating || !newLabel.trim()} className="btn-accent gap-1.5 disabled:opacity-40">
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create
          </button>
          <button onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink-400"><Loader2 size={14} className="animate-spin" /> Loading…</div>
      ) : keys.length === 0 ? (
        <div className="rounded-lg border border-ink-100/80 py-8 text-center text-sm text-ink-400 dark:border-white/10">
          No API keys yet.
        </div>
      ) : (
        <div className="card-flat divide-y divide-ink-100/60 dark:divide-white/10">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-ink-50/50 dark:hover:bg-white/10">
              <div>
                <div className="text-[13px] font-medium text-ink-800 dark:text-white">{key.label}</div>
                <div className="text-2xs text-ink-400">
                  <code className="font-mono">{key.keyPrefix}…</code>
                  {" · "}Created {new Date(key.createdAt).toLocaleDateString()}
                  {key.lastUsedAt && ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                </div>
              </div>
              <button
                onClick={() => handleRevoke(key.id, key.label)}
                className="btn-ghost h-7 w-7 p-0 hover:text-red-600 dark:hover:text-red-400"
                title="Revoke key"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Appearance Tab ─── */
function AppearanceTab() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="max-w-md space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-ink-100/80 px-3 py-2.5 dark:border-white/10">
        <div>
          <div className="text-[13px] font-medium text-ink-800 dark:text-white">Dark mode</div>
          <div className="text-2xs text-ink-400">{theme === "dark" ? "Enabled" : "Disabled"}</div>
        </div>
        <button
          onClick={toggleTheme}
          className={`relative h-5 w-9 rounded-full transition-colors duration-150 ${theme === "dark" ? "bg-accent-500" : "bg-ink-200 dark:bg-ink-600"}`}
          role="switch"
          aria-checked={theme === "dark"}
        >
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${theme === "dark" ? "translate-x-[18px]" : "translate-x-0.5"}`} />
        </button>
      </div>
    </div>
  );
}

/* ─── Danger Zone Tab ─── */
function DangerZoneTab() {
  const { workspaceId, accessToken, logout } = useAuth();
  const token = accessToken ?? undefined;
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm !== "DELETE") return;
    setDeleting(true);
    try {
      await apiFetch(`/api/workspaces/${workspaceId}`, { method: "DELETE", accessToken: token });
      logout();
    } catch (err: any) {
      alert(err.message ?? "Failed to delete workspace");
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-md space-y-4 rounded-lg border border-red-200/80 bg-red-50/50 p-4 dark:border-red-500/20 dark:bg-red-500/5">
      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
        <AlertTriangle size={15} strokeWidth={1.75} />
        <span className="text-[13px] font-medium">Delete workspace</span>
      </div>
      <p className="text-[13px] leading-relaxed text-red-600/80 dark:text-red-300/70">
        This permanently deletes all instances, contacts, campaigns, and message history. This cannot be undone.
      </p>
      <div>
        <label className="label text-red-600 dark:text-red-400">
          Type <code className="font-mono">DELETE</code> to confirm
        </label>
        <input
          className="input mt-1 border-red-200 dark:border-red-500/30"
          placeholder="DELETE"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <button
        onClick={handleDelete}
        disabled={confirm !== "DELETE" || deleting}
        className="btn-danger gap-2 disabled:opacity-40"
      >
        {deleting ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
        Delete workspace permanently
      </button>
    </div>
  );
}

/* ─── Main Page ─── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("workspace");

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Workspace, credentials, and preferences.</p>
      </div>

      <div className="flex gap-8">
        <nav className="w-40 shrink-0 space-y-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`settings-tab ${activeTab === tab.id ? "settings-tab-active" : "settings-tab-inactive"}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1 animate-fade-in">
          {activeTab === "workspace" && <WorkspaceTab />}
          {activeTab === "cerebro" && <CerebroTab />}
          {activeTab === "api-keys" && <ApiKeysTab />}
          {activeTab === "appearance" && <AppearanceTab />}
          {activeTab === "danger" && <DangerZoneTab />}
        </div>
      </div>
    </div>
  );
}
