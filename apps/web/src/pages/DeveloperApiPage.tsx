import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Code2, KeyRound, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";
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

const jsExample = `const response = await fetch("https://your-domain.com/api/v1/messages/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "wak_your_api_key"
  },
  body: JSON.stringify({
    recipient: "2547XXXXXXXX",
    message: "Hello from Cerebro"
  })
});

console.log(await response.json());`;

const pythonExample = `import requests

response = requests.post(
    "https://your-domain.com/api/v1/messages/send",
    headers={"X-API-Key": "wak_your_api_key"},
    json={
        "recipient": "2547XXXXXXXX",
        "message": "Hello from Cerebro",
    },
)

print(response.json())`;

const phpExample = `<?php
$payload = json_encode([
  "recipient" => "2547XXXXXXXX",
  "message" => "Hello from Cerebro"
]);

$ch = curl_init("https://your-domain.com/api/v1/messages/send");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    "Content-Type: application/json",
    "X-API-Key: wak_your_api_key"
  ],
  CURLOPT_POSTFIELDS => $payload,
  CURLOPT_RETURNTRANSFER => true
]);

echo curl_exec($ch);`;

function CodeBlock({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="rounded-lg border border-ink-100/80 dark:border-white/10">
      <div className="flex items-center justify-between border-b border-ink-100/80 px-3 py-2 dark:border-white/10">
        <div className="flex items-center gap-2 text-[13px] font-medium text-ink-800 dark:text-white">
          <Code2 size={14} />
          {title}
        </div>
        <button onClick={copy} className="btn-ghost h-8 w-8 p-0" title="Copy example">
          {copied ? <Check size={14} /> : <Clipboard size={14} />}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-ink-600 dark:text-ink-200">
        <code>{code}</code>
      </pre>
    </div>
  );
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
        <p className="page-subtitle">API keys, integration endpoints, and request examples.</p>
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
            Reference
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
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card-flat p-4">
          <h2 className="text-sm font-semibold text-ink-800 dark:text-white">Endpoints</h2>
          <div className="mt-3 space-y-2 text-[13px] text-ink-600 dark:text-ink-300">
            <p><code>POST /messages/send</code> sends one WhatsApp message immediately.</p>
            <p><code>POST /messages/schedule</code> queues one message for a future ISO timestamp.</p>
            <p><code>POST /campaigns</code> creates a campaign using existing contacts, scheduling, and recurring options.</p>
            <p><code>GET /messages/:id</code> returns delivery status for a public message ID.</p>
            <p><code>GET /health</code> returns <code>{'{"status":"ok"}'}</code>.</p>
          </div>
        </div>

        <div className="card-flat p-4">
          <h2 className="text-sm font-semibold text-ink-800 dark:text-white">Responses</h2>
          <div className="mt-3 space-y-2 text-[13px] text-ink-600 dark:text-ink-300">
            <p>Accepted message: <code>{'{"id":"msg_xxx","status":"QUEUED","recipient":"2547XXXXXXXX"}'}</code></p>
            <p>Status lookup: <code>{'{"id":"msg_xxx","status":"SENT","sentAt":"..."}'}</code></p>
            <p>Invalid key: <code>401 Unauthorized</code></p>
            <p>Rate limit: <code>429 RATE_LIMIT_EXCEEDED</code></p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <CodeBlock title="JavaScript" code={jsExample} />
        <CodeBlock title="Python" code={pythonExample} />
        <CodeBlock title="PHP" code={phpExample} />
      </section>
    </div>
  );
}
