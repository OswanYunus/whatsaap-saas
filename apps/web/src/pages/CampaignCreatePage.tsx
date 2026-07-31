import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Globe, Users, Tag, Check,
  AlertCircle, Info, Clock, Send, Zap, MessageSquare,
  Settings2, Eye, Loader2, HelpCircle, Repeat
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

/* ─────────────────────────── Types ─────────────────────────── */

interface Instance {
  id: string;
  name: string;
  status: string;
  phoneNumber?: string;
}

interface AudiencePreview {
  total: number;
  sampleNames: string[];
  invalidCount: number;
  duplicatesCount: number;
}

interface FormData {
  name: string;
  notes: string;
  instanceId: string;
  audienceType: "ALL" | "GROUP" | "TAGS";
  audienceGroupName: string;
  audienceTags: string[];
  messageTemplate: string;
  footerEnabled: boolean;
  sendMode: "now" | "scheduled";
  scheduledAt: string;
  timezone: string;
  minDelaySeconds: number;
  maxDelaySeconds: number;
  maxPerMinute: number;
}

const STEPS = [
  { id: 1, label: "General", icon: Settings2 },
  { id: 2, label: "Audience", icon: Users },
  { id: 3, label: "Message", icon: MessageSquare },
  { id: 4, label: "Schedule", icon: Clock },
  { id: 5, label: "Review", icon: Eye }
];

const AUDIENCE_OPTIONS = [
  { type: "ALL" as const, icon: Globe, label: "All contacts", desc: "Every active contact in your workspace" },
  { type: "GROUP" as const, icon: Users, label: "By group", desc: "Target a specific contact group" },
  { type: "TAGS" as const, icon: Tag, label: "By tag", desc: "Filter contacts by one or more tags" }
];

const TIMEZONES = [
  "UTC", "Africa/Nairobi", "Africa/Lagos", "Africa/Cairo",
  "America/New_York", "America/Los_Angeles", "America/Chicago",
  "Europe/London", "Europe/Paris", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo"
];

const VARIABLE_HINTS = [
  { key: "{{name}}", desc: "Contact's full name" },
  { key: "{{phone}}", desc: "Contact's phone number" }
];

/* ─────────────────────────── Step indicator ─────────────────────────── */

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const done = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 ${
                  done
                    ? "bg-accent-500 text-white"
                    : active
                    ? "bg-accent-500/15 text-accent-600 ring-2 ring-accent-500/40 dark:text-accent-400"
                    : "bg-ink-100/80 text-ink-400 dark:bg-white/10 dark:text-ink-500"
                }`}
              >
                {done ? <Check size={14} strokeWidth={2.5} /> : <Icon size={14} strokeWidth={1.75} />}
              </div>
              <span
                className={`hidden text-2xs sm:block ${
                  active ? "font-medium text-accent-600 dark:text-accent-400" : "text-ink-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`mb-4 h-px w-12 transition-colors duration-200 sm:w-16 ${
                  done ? "bg-accent-500" : "bg-ink-100 dark:bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex cursor-default">
      <HelpCircle size={12} className="text-ink-300 dark:text-ink-500" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-48 -translate-x-1/2 rounded-lg bg-ink-800 px-2.5 py-1.5 text-2xs text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 dark:bg-ink-700">
        {text}
      </span>
    </span>
  );
}

/* ─────────────────────────── Main Page ─────────────────────────── */

export default function CampaignCreatePage() {
  const { accessToken, workspaceId, workspaces } = useAuth();
  const navigate = useNavigate();
  const token = accessToken ?? undefined;

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [instances, setInstances] = useState<Instance[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const workspaceName = workspaces[0]?.name ?? "";

  const [form, setForm] = useState<FormData>({
    name: "",
    notes: "",
    instanceId: "",
    audienceType: "ALL",
    audienceGroupName: "",
    audienceTags: [],
    messageTemplate: "",
    footerEnabled: true,
    sendMode: "now",
    scheduledAt: "",
    timezone: "UTC",
    minDelaySeconds: 4,
    maxDelaySeconds: 9,
    maxPerMinute: 12
  });

  // Load instances and contact metadata
  useEffect(() => {
    if (!workspaceId) return;

    apiFetch<Instance[]>(`/api/whatsapp/instances?workspaceId=${workspaceId}`, { accessToken: token })
      .then((data) => {
        const connected = data.filter((i) => i.status === "CONNECTED");
        setInstances(connected);
        if (connected.length === 1) {
          setForm((f) => ({ ...f, instanceId: connected[0].id }));
        }
      })
      .catch(() => {});

    // Load groups and tags in parallel from their correct endpoints
    Promise.all([
      apiFetch<{ groups: string[] }>(`/api/contacts/groups?workspaceId=${workspaceId}`, { accessToken: token }),
      apiFetch<{ tags: string[] }>(`/api/contacts/tags?workspaceId=${workspaceId}`, { accessToken: token })
    ])
      .then(([groupsData, tagsData]) => {
        setGroups(groupsData.groups ?? []);
        setAllTags(tagsData.tags ?? []);
      })
      .catch(() => {});
  }, [workspaceId, token]);

  const fetchPreview = useCallback(async () => {
    if (!workspaceId) return;
    setPreviewLoading(true);
    setPreview(null);
    try {
      const params = new URLSearchParams({ workspaceId, audienceType: form.audienceType });
      if (form.audienceType === "GROUP" && form.audienceGroupName) {
        params.set("audienceGroupName", form.audienceGroupName);
      }
      if (form.audienceType === "TAGS" && form.audienceTags.length > 0) {
        params.set("audienceTags", form.audienceTags.join(","));
      }
      const data = await apiFetch<AudiencePreview>(`/api/campaigns/audience-preview?${params}`, { accessToken: token });
      setPreview(data);
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [workspaceId, token, form.audienceType, form.audienceGroupName, form.audienceTags]);

  useEffect(() => {
    if (step === 2) fetchPreview();
  }, [step, fetchPreview]);

  const setField = (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = (e.target as HTMLInputElement).type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
      setForm((f) => ({ ...f, [key]: value }));
    };

  const setNum = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: Number(e.target.value) }));

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !form.audienceTags.includes(t)) {
      setForm((f) => ({ ...f, audienceTags: [...f.audienceTags, t] }));
    }
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    setForm((f) => ({ ...f, audienceTags: f.audienceTags.filter((t) => t !== tag) }));

  const canNext = (): boolean => {
    if (step === 1) return form.name.trim().length > 0 && !!form.instanceId;
    if (step === 2) {
      if (form.audienceType === "GROUP") return !!form.audienceGroupName;
      if (form.audienceType === "TAGS") return form.audienceTags.length > 0;
      return true;
    }
    if (step === 3) return form.messageTemplate.trim().length > 0;
    if (step === 4) {
      if (form.sendMode === "scheduled" && !form.scheduledAt) return false;
      return form.minDelaySeconds <= form.maxDelaySeconds;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!workspaceId) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        workspaceId,
        instanceId: form.instanceId,
        name: form.name.trim(),
        notes: form.notes.trim() || null,
        messageTemplate: form.messageTemplate,
        audienceType: form.audienceType,
        audienceGroupName: form.audienceGroupName || null,
        audienceTags: form.audienceTags,
        footerEnabled: form.footerEnabled,
        minDelaySeconds: form.minDelaySeconds,
        maxDelaySeconds: form.maxDelaySeconds,
        maxPerMinute: form.maxPerMinute,
        isRecurring: false
      };

      if (form.sendMode === "scheduled" && form.scheduledAt) {
        payload.scheduledAt = new Date(form.scheduledAt).toISOString();
        payload.timezone = form.timezone;
      }

      const campaign = await apiFetch<{ id: string }>("/api/campaigns", {
        method: "POST",
        body: JSON.stringify(payload),
        accessToken: token
      });

      if (form.sendMode === "now") {
        await apiFetch(`/api/campaigns/${campaign.id}/dispatch`, {
          method: "POST",
          accessToken: token
        });
      }

      navigate(`/campaigns/${campaign.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedInstance = instances.find((i) => i.id === form.instanceId);
  const charCount = form.messageTemplate.length;
  const avgDelay = (form.minDelaySeconds + form.maxDelaySeconds) / 2;
  const estMinutes = preview ? Math.round((preview.total * avgDelay) / 60) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => (step > 1 ? setStep((s) => s - 1) : navigate("/campaigns"))}
          className="btn-ghost h-8 w-8 p-0"
        >
          <ChevronLeft size={16} />
        </button>
        <div>
          <h1 className="page-title">New Campaign</h1>
          <p className="page-subtitle">
            Step {step} of {STEPS.length} — {STEPS[step - 1].label}
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <StepIndicator current={step} />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/60 px-3 py-2.5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Step content */}
      <div className="card-flat p-5 animate-fade-in">

        {/* ── Step 1: General ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="label">Campaign Name <span className="text-red-500">*</span></label>
              <input
                id="campaign-name"
                className="input mt-1"
                placeholder="e.g. Ramadan Promotion 2025"
                value={form.name}
                onChange={setField("name")}
                maxLength={120}
              />
              <p className="mt-1 text-2xs text-ink-400">Internal name — not visible to recipients.</p>
            </div>

            <div>
              <label className="label">Internal Notes (optional)</label>
              <textarea
                id="campaign-notes"
                className="input mt-1 h-20 resize-none"
                placeholder="Add any internal notes about this campaign…"
                value={form.notes}
                onChange={setField("notes")}
                maxLength={500}
              />
            </div>

            <div>
              <label className="label">WhatsApp Instance <span className="text-red-500">*</span></label>
              {instances.length === 0 ? (
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2.5 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-400">
                  <Info size={14} />
                  No connected WhatsApp instances. Please connect one first.
                </div>
              ) : (
                <select id="campaign-instance" className="input mt-1" value={form.instanceId} onChange={setField("instanceId")}>
                  <option value="">Select instance…</option>
                  {instances.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}{i.phoneNumber ? ` (${i.phoneNumber})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Audience ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="label mb-2 block">Audience type</label>
              <div className="grid grid-cols-3 gap-2">
                {AUDIENCE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = form.audienceType === opt.type;
                  return (
                    <button
                      key={opt.type}
                      onClick={() =>
                        setForm((f) => ({ ...f, audienceType: opt.type, audienceGroupName: "", audienceTags: [] }))
                      }
                      className={`flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all duration-150 ${
                        active
                          ? "border-accent-500 bg-accent-500/5 dark:bg-accent-500/10"
                          : "border-ink-100/80 hover:border-ink-200 dark:border-white/10 dark:hover:border-white/20"
                      }`}
                    >
                      <div className={`flex h-7 w-7 items-center justify-center rounded-md ${active ? "bg-accent-500 text-white" : "bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-400"}`}>
                        <Icon size={13} strokeWidth={2} />
                      </div>
                      <div>
                        <div className={`text-[13px] font-medium ${active ? "text-accent-600 dark:text-accent-400" : "text-ink-700 dark:text-ink-200"}`}>
                          {opt.label}
                        </div>
                        <div className="text-2xs text-ink-400">{opt.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {form.audienceType === "GROUP" && (
              <div>
                <label className="label">Group name <span className="text-red-500">*</span></label>
                <select className="input mt-1" value={form.audienceGroupName} onChange={setField("audienceGroupName")}>
                  <option value="">Select group…</option>
                  {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                  {groups.length === 0 && <option disabled>No groups — import contacts with group names first</option>}
                </select>
              </div>
            )}

            {form.audienceType === "TAGS" && (
              <div>
                <label className="label">Tags <span className="text-red-500">*</span></label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {form.audienceTags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-accent-500/10 px-2 py-0.5 text-2xs font-medium text-accent-700 dark:text-accent-300">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="ml-0.5 text-accent-500 hover:text-accent-700">×</button>
                    </span>
                  ))}
                </div>
                <div className="mt-1.5 flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Type a tag and press Enter…"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
                  />
                </div>
                {allTags.filter((t) => !form.audienceTags.includes(t)).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {allTags.filter((t) => !form.audienceTags.includes(t)).slice(0, 12).map((t) => (
                      <button key={t} onClick={() => addTag(t)} className="rounded-full border border-ink-100 px-2 py-0.5 text-2xs text-ink-500 transition-colors hover:border-accent-400 hover:text-accent-600 dark:border-white/10 dark:text-ink-400">
                        + {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Audience preview */}
            <div className={`rounded-lg border p-3 transition-all duration-200 ${preview ? "border-green-200 bg-green-50/50 dark:border-green-500/20 dark:bg-green-500/5" : "border-ink-100/80 bg-ink-50/50 dark:border-white/10 dark:bg-white/5"}`}>
              {previewLoading ? (
                <div className="flex items-center gap-2 text-sm text-ink-400">
                  <Loader2 size={14} className="animate-spin" /> Computing audience…
                </div>
              ) : preview ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                    <Check size={14} strokeWidth={2.5} />
                    {preview.total.toLocaleString()} recipients selected
                  </div>
                  {preview.sampleNames.length > 0 && (
                    <p className="text-2xs text-ink-400">
                      e.g. {preview.sampleNames.join(", ")}{preview.total > 5 ? ` and ${preview.total - 5} more…` : ""}
                    </p>
                  )}
                  {(preview.invalidCount > 0 || preview.duplicatesCount > 0) && (
                    <div className="flex items-center gap-1.5 text-2xs text-amber-600 dark:text-amber-400">
                      <AlertCircle size={11} />
                      {preview.invalidCount > 0 && `${preview.invalidCount} invalid numbers excluded. `}
                      {preview.duplicatesCount > 0 && `${preview.duplicatesCount} duplicates detected.`}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-ink-400">Select an audience to preview recipients.</p>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Message ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="label">Message Body <span className="text-red-500">*</span></label>
                <span className={`text-2xs tabular-nums ${charCount > 3800 ? "text-red-500" : "text-ink-400"}`}>
                  {charCount}/4096
                </span>
              </div>
              <textarea
                id="campaign-message"
                className="input mt-1 h-48 resize-none font-mono text-sm"
                placeholder="Hello {{name}}, we have an exciting offer just for you…"
                value={form.messageTemplate}
                onChange={setField("messageTemplate")}
                maxLength={4096}
              />
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-500/20 dark:bg-blue-500/5">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                <Zap size={12} /> Personalisation variables
              </div>
              <div className="flex flex-wrap gap-3">
                {VARIABLE_HINTS.map((v) => (
                  <div key={v.key} className="flex items-center gap-1.5">
                    <code
                      onClick={() => setForm((f) => ({ ...f, messageTemplate: f.messageTemplate + v.key }))}
                      className="cursor-pointer rounded bg-blue-100 px-1.5 py-0.5 text-2xs font-mono text-blue-800 transition-colors hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-300"
                    >
                      {v.key}
                    </code>
                    <span className="text-2xs text-ink-400">{v.desc}</span>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-2xs text-ink-400">Click a variable to insert it. Substituted at send time.</p>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border border-ink-100/80 p-3 dark:border-white/10">
              <div>
                <div className="text-[13px] font-medium text-ink-800 dark:text-white">
                  Append Cerebro footer
                  <Tooltip text="Adds a small footer to every message." />
                </div>
                {form.footerEnabled && (
                  <p className="mt-0.5 font-mono text-2xs text-ink-400 italic">
                    _Sent via Cerebro on behalf of {workspaceName || "your business"}._
                  </p>
                )}
              </div>
              <button
                onClick={() => setForm((f) => ({ ...f, footerEnabled: !f.footerEnabled }))}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ${form.footerEnabled ? "bg-accent-500" : "bg-ink-200 dark:bg-ink-600"}`}
                role="switch"
                aria-checked={form.footerEnabled}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${form.footerEnabled ? "translate-x-[18px]" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Schedule & Safety ── */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <label className="label mb-2 block">Send mode</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { mode: "now" as const, icon: Send, label: "Send immediately", desc: "Dispatch as soon as campaign is created" },
                  { mode: "scheduled" as const, icon: Clock, label: "Schedule", desc: "Send at a specific date and time" }
                ]).map((opt) => {
                  const Icon = opt.icon;
                  const active = form.sendMode === opt.mode;
                  return (
                    <button
                      key={opt.mode}
                      onClick={() => setForm((f) => ({ ...f, sendMode: opt.mode }))}
                      className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                        active
                          ? "border-accent-500 bg-accent-500/5 dark:bg-accent-500/10"
                          : "border-ink-100/80 hover:border-ink-200 dark:border-white/10"
                      }`}
                    >
                      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded ${active ? "bg-accent-500 text-white" : "bg-ink-100 text-ink-400 dark:bg-white/10"}`}>
                        <Icon size={12} />
                      </div>
                      <div>
                        <div className={`text-[13px] font-medium ${active ? "text-accent-600 dark:text-accent-400" : "text-ink-700 dark:text-ink-200"}`}>{opt.label}</div>
                        <div className="text-2xs text-ink-400">{opt.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {form.sendMode === "scheduled" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date & Time <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    className="input mt-1"
                    value={form.scheduledAt}
                    onChange={setField("scheduledAt")}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div>
                  <label className="label">Timezone</label>
                  <select className="input mt-1" value={form.timezone} onChange={setField("timezone")}>
                    {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-ink-100/80 p-4 dark:border-white/10">
              <div className="mb-3 text-[13px] font-medium text-ink-700 dark:text-ink-200">
                Sending safety settings
                <Tooltip text="Random delays between messages reduce the risk of WhatsApp rate-limiting." />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-2xs text-ink-500">Min delay (seconds)</label>
                    <span className="font-mono text-2xs font-medium text-ink-700 dark:text-ink-300">{form.minDelaySeconds}s</span>
                  </div>
                  <input type="range" min={1} max={60} step={1} value={form.minDelaySeconds} onChange={setNum("minDelaySeconds")} className="w-full accent-accent-500" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-2xs text-ink-500">Max delay (seconds)</label>
                    <span className="font-mono text-2xs font-medium text-ink-700 dark:text-ink-300">{form.maxDelaySeconds}s</span>
                  </div>
                  <input type="range" min={1} max={120} step={1} value={form.maxDelaySeconds} onChange={setNum("maxDelaySeconds")} className="w-full accent-accent-500" />
                  {form.minDelaySeconds > form.maxDelaySeconds && (
                    <p className="mt-1 text-2xs text-red-500">Max delay must be ≥ min delay</p>
                  )}
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-2xs text-ink-500">
                      Max messages per minute
                      <Tooltip text="Hard rate-limit ceiling." />
                    </label>
                    <span className="font-mono text-2xs font-medium text-ink-700 dark:text-ink-300">{form.maxPerMinute}/min</span>
                  </div>
                  <input type="number" min={1} max={1000} className="input" value={form.maxPerMinute} onChange={setNum("maxPerMinute")} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Review & Launch ── */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 rounded-lg bg-ink-50/60 p-3 dark:bg-white/5">
                <div className="text-2xs text-ink-400">Campaign name</div>
                <div className="mt-0.5 text-[13px] font-medium text-ink-800 dark:text-white">{form.name}</div>
                {form.notes && <div className="mt-1 text-2xs text-ink-400 italic">{form.notes}</div>}
              </div>

              <div className="rounded-lg bg-ink-50/60 p-3 dark:bg-white/5">
                <div className="text-2xs text-ink-400">Instance</div>
                <div className="mt-0.5 text-[13px] font-medium text-ink-800 dark:text-white">
                  {selectedInstance?.name ?? "—"}
                </div>
              </div>

              <div className="rounded-lg bg-ink-50/60 p-3 dark:bg-white/5">
                <div className="text-2xs text-ink-400">Audience</div>
                <div className="mt-0.5 text-[13px] font-medium text-ink-800 dark:text-white">
                  {form.audienceType === "GROUP"
                    ? `Group: ${form.audienceGroupName}`
                    : form.audienceType === "TAGS"
                    ? `Tags: ${form.audienceTags.join(", ")}`
                    : "All contacts"}
                </div>
              </div>

              {preview && (
                <div className="rounded-lg border border-green-200 bg-green-50/50 p-3 dark:border-green-500/20 dark:bg-green-500/5">
                  <div className="text-2xs text-ink-400">Recipients</div>
                  <div className="mt-0.5 text-lg font-semibold tabular-nums text-green-700 dark:text-green-400">
                    {preview.total.toLocaleString()}
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-ink-50/60 p-3 dark:bg-white/5">
                <div className="text-2xs text-ink-400">Send mode</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-ink-800 dark:text-white">
                  {form.sendMode === "now" ? (
                    <><Send size={12} className="text-green-500" /> Send immediately</>
                  ) : (
                    <><Clock size={12} className="text-amber-500" /> {form.scheduledAt ? new Date(form.scheduledAt).toLocaleString() : "—"} ({form.timezone})</>
                  )}
                </div>
              </div>

              {preview && estMinutes > 0 && (
                <div className="col-span-2 rounded-lg bg-ink-50/60 p-3 dark:bg-white/5">
                  <div className="text-2xs text-ink-400">Estimated send duration</div>
                  <div className="mt-0.5 text-[13px] font-medium text-ink-800 dark:text-white">
                    ~{estMinutes < 60 ? `${estMinutes}m` : `${Math.floor(estMinutes / 60)}h ${estMinutes % 60}m`}
                  </div>
                  <div className="mt-0.5 text-2xs text-ink-400">Based on {form.minDelaySeconds}–{form.maxDelaySeconds}s delays</div>
                </div>
              )}
            </div>

            <div>
              <div className="mb-1.5 text-2xs text-ink-400">Message preview</div>
              <div className="rounded-lg bg-ink-800/5 p-3 dark:bg-white/5">
                <pre className="whitespace-pre-wrap font-sans text-sm text-ink-700 dark:text-ink-200">
                  {form.messageTemplate}
                </pre>
                {form.footerEnabled && (
                  <p className="mt-2 border-t border-ink-100/60 pt-2 font-mono text-2xs text-ink-400 italic dark:border-white/10">
                    _Sent via Cerebro on behalf of {workspaceName || "your business"}._
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => (step > 1 ? setStep((s) => s - 1) : navigate("/campaigns"))}
          className="btn-outline"
        >
          <ChevronLeft size={14} /> {step === 1 ? "Cancel" : "Back"}
        </button>

        {step < 5 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
            className="btn-accent disabled:opacity-40"
          >
            Next <ChevronRight size={14} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-accent gap-2 disabled:opacity-40"
          >
            {submitting ? (
              <><Loader2 size={14} className="animate-spin" /> Creating…</>
            ) : form.sendMode === "now" ? (
              <><Send size={14} /> Launch Campaign</>
            ) : (
              <><Repeat size={14} /> Schedule Campaign</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
