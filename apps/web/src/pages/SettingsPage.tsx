import { useState } from "react";
import { AlertTriangle, Copy, Plus, Trash2 } from "lucide-react";
import { apiKeys, workspace } from "../lib/mockData";
import { useTheme } from "../context/ThemeContext";

type Tab = "workspace" | "api-keys" | "webhook" | "users" | "billing" | "theme" | "danger";

const TABS: { id: Tab; label: string }[] = [
  { id: "workspace", label: "Workspace" },
  { id: "api-keys", label: "API Keys" },
  { id: "webhook", label: "Webhook" },
  { id: "users", label: "Users" },
  { id: "billing", label: "Billing" },
  { id: "theme", label: "Appearance" },
  { id: "danger", label: "Danger Zone" }
];

function WorkspaceTab() {
  return (
    <div className="max-w-md space-y-4">
      <div>
        <label className="label">Workspace name</label>
        <input defaultValue={workspace.name} className="input mt-1" />
      </div>
      <div>
        <label className="label">Plan</label>
        <p className="mt-1 text-[13px] text-ink-400">{workspace.plan} plan</p>
      </div>
      <button className="btn-primary">Save changes</button>
    </div>
  );
}

function ApiKeysTab() {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[13px] text-ink-400">
          Keys let external systems call the API on your workspace's behalf.
        </p>
        <button className="btn-accent shrink-0">
          <Plus size={14} strokeWidth={1.75} /> New key
        </button>
      </div>
      <div className="card-flat divide-y divide-ink-100/60 dark:divide-white/10">
        {apiKeys.map((key) => (
          <div
            key={key.id}
            className="flex items-center justify-between px-3 py-2.5 transition-colors duration-150 hover:bg-ink-50/50 dark:hover:bg-white/10"
          >
            <div>
              <div className="text-[13px] font-medium text-ink-800 dark:text-white">{key.label}</div>
              <div className="text-2xs text-ink-400">
                Created {key.createdAt} · Last used {key.lastUsed}
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button className="btn-ghost h-7 w-7 p-0" aria-label="Copy key">
                <Copy size={14} strokeWidth={1.75} />
              </button>
              <button
                className="btn-ghost h-7 w-7 p-0 hover:text-red-600 dark:hover:text-red-400"
                aria-label="Revoke key"
              >
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WebhookTab() {
  return (
    <div className="max-w-md space-y-4">
      <div>
        <label className="label">Webhook URL</label>
        <input placeholder="https://yourapp.com/webhooks/waas" className="input mt-1" />
        <p className="mt-1 text-2xs text-ink-400">
          Delivery status updates (sent, delivered, read, failed) will be posted here.
        </p>
      </div>
      <button className="btn-primary">Save webhook</button>
    </div>
  );
}

function UsersTab() {
  return (
    <div className="max-w-2xl">
      <div className="card-flat divide-y divide-ink-100/60 dark:divide-white/10">
        {workspace.members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between px-3 py-2.5 transition-colors duration-150 hover:bg-ink-50/50 dark:hover:bg-white/10"
          >
            <div>
              <div className="text-[13px] font-medium text-ink-800 dark:text-white">{member.name}</div>
              <div className="text-2xs text-ink-400">{member.email}</div>
            </div>
            <span className="rounded px-1.5 py-0.5 text-2xs font-medium bg-ink-100/80 text-ink-500 dark:bg-white/10 dark:text-ink-400">
              {member.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BillingTab() {
  return (
    <div className="max-w-md space-y-3">
      <p className="text-[13px] text-ink-400">
        You're on the{" "}
        <span className="font-medium text-ink-700 dark:text-ink-200">{workspace.plan}</span> plan.
      </p>
      <button className="btn-outline">Manage billing</button>
    </div>
  );
}

function ThemeTab() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="max-w-md">
      <div className="flex items-center justify-between rounded-lg border border-ink-100/80 px-3 py-2.5 dark:border-white/10">
        <div>
          <div className="text-[13px] font-medium text-ink-800 dark:text-white">Dark mode</div>
          <div className="text-2xs text-ink-400">{theme === "dark" ? "Enabled" : "Disabled"}</div>
        </div>
        <button
          onClick={toggleTheme}
          className={`relative h-5 w-9 rounded-full transition-colors duration-150 ${
            theme === "dark" ? "bg-accent-500" : "bg-ink-200 dark:bg-ink-600"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${
              theme === "dark" ? "translate-x-[18px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

function DangerZoneTab() {
  return (
    <div className="max-w-md space-y-3 rounded-lg border border-red-200/80 bg-red-50/50 p-4 dark:border-red-500/20 dark:bg-red-500/5">
      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
        <AlertTriangle size={15} strokeWidth={1.75} />
        <span className="text-[13px] font-medium">Delete workspace</span>
      </div>
      <p className="text-[13px] leading-relaxed text-red-600/80 dark:text-red-300/70">
        This permanently deletes all instances, contacts, campaigns, and message history. This can't be undone.
      </p>
      <button className="btn-danger">Delete workspace</button>
    </div>
  );
}

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
          {activeTab === "api-keys" && <ApiKeysTab />}
          {activeTab === "webhook" && <WebhookTab />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "billing" && <BillingTab />}
          {activeTab === "theme" && <ThemeTab />}
          {activeTab === "danger" && <DangerZoneTab />}
        </div>
      </div>
    </div>
  );
}
