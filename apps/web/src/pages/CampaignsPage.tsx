import { useState } from "react";
import { Megaphone, Pause, Play, Plus, Trash2 } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { campaigns as initialCampaigns, type CampaignRow } from "../lib/mockData";

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-track w-28">
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>(initialCampaigns);

  const toggleStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "running" ? "paused" : c.status === "paused" ? "running" : c.status }
          : c
      )
    );
  };

  const removeCampaign = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="page-header">
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">Create and monitor bulk message campaigns.</p>
        </div>
        <button className="btn-accent shrink-0">
          <Plus size={14} strokeWidth={2} /> New campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="card-flat">
          <div className="empty-state py-16">
            <div className="empty-state-icon">
              <Megaphone size={16} strokeWidth={1.75} />
            </div>
            <p className="empty-state-title">No campaigns yet</p>
            <p className="empty-state-desc">Create your first campaign to start sending messages.</p>
            <button className="btn-accent mt-4">
              <Plus size={14} strokeWidth={2} /> New campaign
            </button>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Recipients</th>
                <th>Status</th>
                <th>Created</th>
                <th>Progress</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="table-row">
                  <td className="font-medium text-ink-800 dark:text-white">{c.name}</td>
                  <td className="font-mono tabular-nums text-ink-500 dark:text-ink-400">
                    {c.recipients.toLocaleString()}
                  </td>
                  <td>
                    <StatusBadge status={c.status} pulse={c.status === "running"} />
                  </td>
                  <td className="text-ink-400">{c.createdAt}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={c.progress} />
                      <span className="font-mono text-2xs tabular-nums text-ink-400">{c.progress}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-0.5">
                      {(c.status === "running" || c.status === "paused") && (
                        <button
                          onClick={() => toggleStatus(c.id)}
                          className="btn-ghost h-7 w-7 p-0"
                          aria-label={c.status === "running" ? "Pause campaign" : "Resume campaign"}
                        >
                          {c.status === "running" ? (
                            <Pause size={14} strokeWidth={1.75} />
                          ) : (
                            <Play size={14} strokeWidth={1.75} />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => removeCampaign(c.id)}
                        className="btn-ghost h-7 w-7 p-0 hover:text-red-600 dark:hover:text-red-400"
                        aria-label="Delete campaign"
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
