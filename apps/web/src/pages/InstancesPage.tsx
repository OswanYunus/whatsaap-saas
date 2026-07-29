import { Link } from "react-router-dom";
import { MoreHorizontal, Plus } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { whatsappInstances } from "../lib/mockData";

export default function InstancesPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="page-header">
          <h1 className="page-title">WhatsApp Instances</h1>
          <p className="page-subtitle">Manage connected devices and sessions.</p>
        </div>
        <Link to="/instances/connect" className="btn-accent shrink-0">
          <Plus size={14} strokeWidth={2} /> Connect device
        </Link>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Business Phone</th>
              <th>Status</th>
              <th>Connected Since</th>
              <th>Messages Sent</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {whatsappInstances.map((instance) => (
              <tr key={instance.id} className="table-row">
                <td>
                  <div className="font-medium text-ink-800 dark:text-white">{instance.businessPhone}</div>
                  <div className="text-2xs text-ink-400">{instance.label}</div>
                </td>
                <td>
                  <StatusBadge status={instance.status} pulse={instance.status === "connecting"} />
                </td>
                <td className="text-ink-500 dark:text-ink-400">{instance.connectedSince ?? "—"}</td>
                <td className="font-mono tabular-nums text-ink-500 dark:text-ink-400">
                  {instance.messagesSent.toLocaleString()}
                </td>
                <td className="text-right">
                  <button className="btn-ghost h-7 w-7 p-0" aria-label="Instance actions">
                    <MoreHorizontal size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
