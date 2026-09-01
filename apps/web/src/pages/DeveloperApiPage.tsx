import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clipboard, ExternalLink, KeyRound, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface ApiKey {
  id: string;
  name: string;
  maskedKey: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
}

export default function DeveloperApiPage() {
  const { workspaceId, accessToken } = useAuth();
  const token = accessToken ?? undefined;
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const baseUrl = useMemo(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    return `${apiBase.replace(/\/$/, "")}/api/v1`;
  }, []);

  const fetchKeys = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ keys: ApiKey[] }>(
        `/api/workspace-api-keys?workspaceId=${workspaceId}`,
        { accessToken: token }
      );
      setKeys(data.keys);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, token]);

  useEffect(() => {
    fetchKeys().catch(() => setLoading(false));
  }, [fetchKeys]);

  const createKey = async () => {
    if (!workspaceId || !name.trim()) return;
    setCreating(true);
    try {
      const created = await apiFetch<ApiKey & { rawKey: string }>("/api/workspace-api-keys", {
        method: "POST",
        body: JSON.stringify({ workspaceId, name: name.trim() }),
        accessToken: token
      });
      setRawKey(created.rawKey);
      setName("");
      await fetchKeys();
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (key: ApiKey) => {
    if (!confirm(`Revoke "${key.name}"? Existing integrations using it will stop working.`)) return;
    await apiFetch(`/api/workspace-api-keys/${key.id}/revoke`, {
      method: "POST",
      accessToken: token
    });
    await fetchKeys();
  };

  const copyRawKey = async () => {
    if (!rawKey) return;
    await navigator.clipboard.writeText(rawKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 1600);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Developer API</h1>
        <p className="page-subtitle">Generate API keys for external integrations.</p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="card-flat p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-800 dark:text-white">
            <KeyRound size={16} />
            API keys
          </div>

          {rawKey && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50/70 p-3 dark:border-green-500/20 dark:bg-green-500/10">
              <div className="text-[13px] font-medium text-green-700 dark:text-green-300">Copy this key now. It will not be shown again.</div>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 overflow-x-auto rounded bg-white px-2 py-1.5 font-mono text-xs dark:bg-black/20">
                  {rawKey}
                </code>
                <button onClick={copyRawKey} className="btn-ghost h-8 w-8 p-0" title="Copy key">
                  {copiedKey ? <Check size={14} /> : <Clipboard size={14} />}
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              className="input sm:max-w-xs"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Production, billing system, CRM"
              maxLength={60}
            />
            <button onClick={createKey} disabled={creating || !name.trim()} className="btn-accent gap-2 disabled:opacity-50">
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Generate API Key
            </button>
          </div>

          <div className="mt-4 divide-y divide-ink-100/70 dark:divide-white/10">
            {loading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-ink-400">
                <Loader2 size={14} className="animate-spin" />
                Loading keys...
              </div>
            ) : keys.length === 0 ? (
              <div className="py-6 text-sm text-ink-400">No API keys have been generated yet.</div>
            ) : keys.map((key) => (
              <div key={key.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-ink-800 dark:text-white">{key.name}</div>
                  <div className="mt-0.5 text-2xs text-ink-400">
                    <code>{key.maskedKey}</code>
                    {" | "}Created {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsedAt ? ` | Last used ${new Date(key.lastUsedAt).toLocaleString()}` : " | Never used"}
                    {key.revokedAt ? " | Revoked" : ""}
                  </div>
                </div>
                <button
                  onClick={() => revokeKey(key)}
                  disabled={Boolean(key.revokedAt)}
                  className="btn-ghost h-8 w-8 p-0 hover:text-red-600 disabled:opacity-40 dark:hover:text-red-400"
                  title="Revoke key"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card-flat p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-800 dark:text-white">
            <ShieldCheck size={16} />
            Developer docs
          </div>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div>
              <dt className="text-ink-400">Base URL</dt>
              <dd className="mt-1 font-mono text-ink-700 dark:text-ink-200">{baseUrl}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Authentication</dt>
              <dd className="mt-1 font-mono text-ink-700 dark:text-ink-200">X-API-Key: wak_your_api_key</dd>
            </div>
            <div>
              <dt className="text-ink-400">Rate limit</dt>
              <dd className="mt-1 text-ink-700 dark:text-ink-200">100 requests per minute per API key</dd>
            </div>
          </dl>
          <div className="mt-5 rounded-lg border border-accent-500/20 bg-accent-500/10 p-3 text-[13px] leading-6 text-ink-700 dark:text-ink-200">
            The full integration guide is public, so client developers can read it without signing in.
          </div>
          <Link to="/developer-docs" className="btn-accent mt-4 w-full gap-2">
            <ExternalLink size={14} />
            Open API documentation
          </Link>
        </div>
      </section>
    </div>
  );
}
