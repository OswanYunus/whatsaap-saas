import { useMemo, useState } from "react";
import { Download, Filter, Search, Upload, Users } from "lucide-react";
import { contacts, contactGroups } from "../lib/mockData";

export default function ContactsPage() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const matchesGroup = group === "All" || c.group === group;
      const matchesQuery =
        query.trim() === "" ||
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.includes(query);
      return matchesGroup && matchesQuery;
    });
  }, [query, group]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="page-header">
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">
            {contacts.length.toLocaleString()} contacts · {contactGroups.length - 1} groups
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="btn-outline">
            <Upload size={14} strokeWidth={1.75} /> Import
          </button>
          <button className="btn-outline">
            <Download size={14} strokeWidth={1.75} /> Export
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative w-full max-w-[260px]">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or phone"
            className="input pl-8"
          />
        </div>

        <div className="segmented">
          {contactGroups.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`segmented-item ${group === g ? "segmented-item-active" : "segmented-item-inactive"}`}
            >
              {g}
            </button>
          ))}
        </div>

        <button className="btn-ghost ml-auto">
          <Filter size={14} strokeWidth={1.75} /> Filters
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Group</th>
              <th>Added</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="table-row">
                <td className="font-medium text-ink-800 dark:text-white">{c.name}</td>
                <td className="font-mono tabular-nums text-ink-500 dark:text-ink-400">{c.phone}</td>
                <td className="text-ink-500 dark:text-ink-400">{c.group}</td>
                <td className="text-ink-400">{c.addedAt}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <Users size={16} strokeWidth={1.75} />
                    </div>
                    <p className="empty-state-title">No contacts found</p>
                    <p className="empty-state-desc">Try adjusting your search or filter criteria.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
