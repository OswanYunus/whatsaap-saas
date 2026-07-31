import { useEffect, useState, useCallback } from "react";
import { Download, Search, Upload, Users, Plus, Edit2, Trash2, Archive, CheckCircle2, AlertCircle, RefreshCw, X, Tag, FileText } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface Contact {
  id: string;
  fullName: string;
  phoneNumber: string;
  groupName: string | null;
  tags: string[];
  notes: string | null;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
}

interface ImportReport {
  imported: number;
  duplicates: number;
  invalid: number;
  skipped: number;
  submitted: number;
}

export default function ContactsPage() {
  const { workspaceId, accessToken } = useAuth();

  // List & Filter States
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Loading & Errors
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
  // Single Contact Form State
  const [formFullName, setFormFullName] = useState("");
  const [formPhoneNumber, setFormPhoneNumber] = useState("");
  const [formGroupName, setFormGroupName] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formTags, setFormTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    if (!workspaceId || !accessToken) return;
    try {
      const data = await apiFetch<{ groups: string[] }>(`/api/contacts/groups?workspaceId=${workspaceId}`, {
        accessToken
      });
      // Add "All" option to groups list
      setGroups(["All", ...data.groups]);
    } catch (err) {
      console.error("Failed to load contact groups", err);
    }
  }, [workspaceId, accessToken]);

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    if (!workspaceId || !accessToken) return;
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        workspaceId,
        page: page.toString(),
        pageSize: pageSize.toString(),
        status: statusFilter,
        ...(selectedGroup !== "All" ? { groupName: selectedGroup } : {}),
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {})
      });

      const data = await apiFetch<{
        contacts: Contact[];
        pagination: { total: number; totalPages: number };
      }>(`/api/contacts?${queryParams.toString()}`, {
        accessToken
      });

      setContacts(data.contacts);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to load contacts");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, accessToken, page, pageSize, selectedGroup, searchQuery, statusFilter]);

  // Trigger loading on filter changes
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups, contacts]); // reload groups list if contacts are added/updated

  // Reset page when queries change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedGroup, statusFilter]);

  // Single Edit / Create Submission
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !accessToken || !formFullName.trim() || !formPhoneNumber.trim()) return;

    try {
      setIsSaving(true);
      setError(null);

      const payload = {
        fullName: formFullName.trim(),
        phoneNumber: formPhoneNumber.trim(),
        groupName: formGroupName.trim() || null,
        notes: formNotes.trim() || null,
        tags: formTags.split(",").map(t => t.trim()).filter(Boolean)
      };

      if (editingContact) {
        // Edit flow
        await apiFetch(`/api/contacts/${editingContact.id}`, {
          method: "PATCH",
          accessToken,
          body: JSON.stringify(payload)
        });
      } else {
        // Create flow
        await apiFetch("/api/contacts", {
          method: "POST",
          accessToken,
          body: JSON.stringify({
            workspaceId,
            ...payload,
            status: "ACTIVE"
          })
        });
      }

      setIsEditorOpen(false);
      fetchContacts();
    } catch (err) {
      alert((err as Error).message || "Failed to save contact");
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateModal = () => {
    setEditingContact(null);
    setFormFullName("");
    setFormPhoneNumber("");
    setFormGroupName("");
    setFormNotes("");
    setFormTags("");
    setIsEditorOpen(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setFormFullName(contact.fullName);
    setFormPhoneNumber(contact.phoneNumber);
    setFormGroupName(contact.groupName || "");
    setFormNotes(contact.notes || "");
    setFormTags(contact.tags.join(", "));
    setIsEditorOpen(true);
  };

  // Archive flow
  const handleToggleArchive = async (contact: Contact) => {
    if (!accessToken) return;
    const nextStatus = contact.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    try {
      await apiFetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        accessToken,
        body: JSON.stringify({ status: nextStatus })
      });
      fetchContacts();
    } catch (err) {
      alert((err as Error).message || "Failed to update contact status");
    }
  };

  // Delete flow
  const handleDeleteContact = async (id: string) => {
    if (!accessToken || !confirm("Are you sure you want to permanently delete this contact?")) return;
    try {
      await apiFetch(`/api/contacts/${id}`, {
        method: "DELETE",
        accessToken
      });
      fetchContacts();
    } catch (err) {
      alert((err as Error).message || "Failed to delete contact");
    }
  };

  // CSV & VCF Import Handler
  const handleImportFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !workspaceId || !accessToken) return;

    setIsImporting(true);
    setError(null);
    setImportReport(null);

    const isVcard = csvFile.name.endsWith(".vcf") || csvFile.name.endsWith(".vcard");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      let parsedContacts: any[] = [];

      if (isVcard) {
        // Parse VCF
        const cards = text.split("BEGIN:VCARD");
        for (const card of cards) {
          if (!card.includes("END:VCARD")) continue;

          let fullName = "";
          let phoneNumber = "";
          let groupName: string | null = null;

          const lines = card.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (/^FN[;:]/i.test(trimmed)) {
              const parts = trimmed.split(":");
              if (parts.length >= 2) fullName = parts.slice(1).join(":").trim();
            } else if (/^N[;:]/i.test(trimmed) && !fullName) {
              const parts = trimmed.split(":");
              if (parts.length >= 2) {
                const nameParts = parts.slice(1).join(":").split(";").map(n => n.trim()).filter(Boolean);
                if (nameParts.length >= 2) {
                  fullName = `${nameParts[1]} ${nameParts[0]}`;
                } else if (nameParts.length === 1) {
                  fullName = nameParts[0];
                }
              }
            } else if (/^TEL[;:]/i.test(trimmed)) {
              const parts = trimmed.split(":");
              if (parts.length >= 2) phoneNumber = parts.slice(1).join(":").trim();
            } else if (/^CATEGORIES[;:]/i.test(trimmed)) {
              const parts = trimmed.split(":");
              if (parts.length >= 2) {
                const cats = parts[1].split(",").map(c => c.trim()).filter(Boolean);
                if (cats.length > 0) groupName = cats[0];
              }
            }
          }

          if (fullName && phoneNumber) {
            parsedContacts.push({
              name: fullName,
              phone: phoneNumber,
              groupName: groupName || "VCF Import"
            });
          }
        }
      } else {
        // Parse CSV
        const lines = text.split(/\r?\n/);
        if (lines.length <= 1) {
          alert("The CSV file is empty or missing content.");
          setIsImporting(false);
          return;
        }

        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        const nameIdx = headers.indexOf("name");
        const phoneIdx = headers.indexOf("phone");
        const groupIdx = headers.indexOf("group");

        if (nameIdx === -1 || phoneIdx === -1) {
          alert("Invalid CSV format. Columns 'Name' and 'Phone' are required.");
          setIsImporting(false);
          return;
        }

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const cols = line.split(",").map(c => c.trim().replace(/^["']|["']$/g, ""));
          if (cols.length <= Math.max(nameIdx, phoneIdx)) continue;

          parsedContacts.push({
            name: cols[nameIdx],
            phone: cols[phoneIdx],
            groupName: groupIdx !== -1 ? cols[groupIdx] || null : null
          });
        }
      }

      if (parsedContacts.length === 0) {
        alert("No valid contacts could be parsed from the file.");
        setIsImporting(false);
        return;
      }

      try {
        const report = await apiFetch<ImportReport>("/api/contacts/bulk", {
          method: "POST",
          accessToken,
          body: JSON.stringify({
            workspaceId,
            contacts: parsedContacts
          })
        });
        setImportReport(report);
        fetchContacts();
      } catch (err) {
        alert((err as Error).message || "Import failed");
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(csvFile);
  };

  const handleExportCsv = () => {
    // Generate a downloadable CSV representing the current loaded contacts
    if (contacts.length === 0) return;
    const header = "Name,Phone,Group,Tags,Notes,Status\n";
    const rows = contacts
      .map(c => `"${c.fullName}","+${c.phoneNumber}","${c.groupName || ""}","${c.tags.join(";")}","${c.notes || ""}","${c.status}"`)
      .join("\n");
    
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `contacts_export_${statusFilter.toLowerCase()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="page-header">
          <h1 className="page-title">Contacts Manager</h1>
          <p className="page-subtitle">
            {totalCount.toLocaleString()} {statusFilter.toLowerCase()} contacts loaded · {Math.max(0, groups.length - 1)} groups
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setCsvFile(null); setImportReport(null); setIsImporterOpen(true); }} className="btn-outline">
            <Upload size={14} strokeWidth={1.75} /> Import CSV
          </button>
          <button onClick={handleExportCsv} className="btn-outline" disabled={contacts.length === 0}>
            <Download size={14} strokeWidth={1.75} /> Export
          </button>
          <button onClick={openCreateModal} className="btn-accent flex items-center gap-1">
            <Plus size={14} strokeWidth={2} /> Add Contact
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-[13px] text-red-600 dark:text-red-400">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Query Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-full max-w-[260px]">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or phone..."
            className="input pl-8"
          />
        </div>

        {/* Group Filter (Dynamic tabs) */}
        {groups.length > 1 && (
          <div className="segmented overflow-x-auto max-w-full">
            {groups.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className={`segmented-item shrink-0 ${selectedGroup === g ? "segmented-item-active" : "segmented-item-inactive"}`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {/* Status Toggle (Active vs Archived) */}
        <div className="segmented ml-auto">
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`segmented-item ${statusFilter === "ACTIVE" ? "segmented-item-active" : "segmented-item-inactive"}`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter("ARCHIVED")}
            className={`segmented-item ${statusFilter === "ARCHIVED" ? "segmented-item-active" : "segmented-item-inactive"}`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="card p-12 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="animate-spin text-accent-500" size={24} />
          <p className="text-[13px] text-ink-400">Loading contacts list...</p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="card empty-state p-12">
          <div className="empty-state-icon">
            <Users size={20} />
          </div>
          <h3 className="empty-state-title">No contacts found</h3>
          <p className="empty-state-desc">
            Try adjusting your search criteria, changing groups, or import a new CSV list.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Phone Number</th>
                  <th>Group</th>
                  <th>Tags & Notes</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="table-row">
                    <td>
                      <div className="font-semibold text-ink-800 dark:text-white">{contact.fullName}</div>
                      <div className="text-3xs text-ink-400">Added on: {new Date(contact.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="font-mono tabular-nums text-ink-600 dark:text-ink-300">
                      +{contact.phoneNumber}
                    </td>
                    <td>
                      {contact.groupName ? (
                        <span className="inline-flex items-center rounded-full bg-accent-500/10 px-2.5 py-0.5 text-2xs font-medium text-accent-700 dark:bg-accent-500/15 dark:text-accent-400">
                          {contact.groupName}
                        </span>
                      ) : (
                        <span className="text-ink-400 font-mono">—</span>
                      )}
                    </td>
                    <td className="max-w-xs">
                      {contact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {contact.tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-0.5 text-3xs font-medium bg-ink-100 dark:bg-white/10 text-ink-600 dark:text-ink-300 rounded px-1 py-0.5">
                              <Tag size={8} /> {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {contact.notes ? (
                        <div className="text-3xs text-ink-500 dark:text-ink-400 truncate" title={contact.notes}>
                          {contact.notes}
                        </div>
                      ) : (
                        contact.tags.length === 0 && <span className="text-ink-400 font-mono">—</span>
                      )}
                    </td>
                    <td className="text-right space-x-1.5">
                      <button onClick={() => openEditModal(contact)} className="btn-ghost h-7 w-7 p-0" title="Edit Contact">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleToggleArchive(contact)} className="btn-ghost h-7 w-7 p-0 text-amber-500 hover:text-amber-600" title={contact.status === "ACTIVE" ? "Archive Contact" : "Unarchive Contact"}>
                        <Archive size={13} />
                      </button>
                      <button onClick={() => handleDeleteContact(contact.id)} className="btn-ghost h-7 w-7 p-0 text-red-500 hover:text-red-600" title="Delete Contact">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-ink-100/60 dark:border-white/10 pt-4 px-2">
              <span className="text-2xs text-ink-400">
                Page {page} of {totalPages} ({totalCount} total contacts)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-outline py-1 px-3 disabled:opacity-40 disabled:pointer-events-none"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-outline py-1 px-3 disabled:opacity-40 disabled:pointer-events-none"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE & EDIT MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 backdrop-blur-sm p-4">
          <div className="card max-w-sm w-full p-5 space-y-4 animate-slide-down relative">
            <button onClick={() => setIsEditorOpen(false)} className="absolute right-4 top-4 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200">
              <X size={16} />
            </button>
            <h2 className="text-sm font-bold text-ink-800 dark:text-white">
              {editingContact ? "Edit Contact" : "Create Contact"}
            </h2>

            <form onSubmit={handleSaveContact} className="space-y-3">
              <div className="space-y-1">
                <label className="label" htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={formFullName}
                  onChange={e => setFormFullName(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="label" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="text"
                  placeholder="e.g. 254712345678"
                  value={formPhoneNumber}
                  onChange={e => setFormPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  className="input"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="label" htmlFor="group">Group Name (Optional)</label>
                <input
                  id="group"
                  type="text"
                  placeholder="e.g. Wifi Clients, VIP"
                  value={formGroupName}
                  onChange={e => setFormGroupName(e.target.value)}
                  className="input"
                />
              </div>

              <div className="space-y-1">
                <label className="label" htmlFor="tags">Tags (Comma-separated, optional)</label>
                <input
                  id="tags"
                  type="text"
                  placeholder="e.g. lead, premium, retail"
                  value={formTags}
                  onChange={e => setFormTags(e.target.value)}
                  className="input"
                />
              </div>

              <div className="space-y-1">
                <label className="label" htmlFor="notes">Notes (Optional)</label>
                <textarea
                  id="notes"
                  placeholder="Additional contact details..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="input min-h-[60px] max-h-[120px] resize-y"
                  maxLength={500}
                />
              </div>

              <button type="submit" className="btn-accent w-full py-2 flex items-center justify-center gap-1.5" disabled={isSaving}>
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : "Save Contact"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONTACTS IMPORT MODAL */}
      {isImporterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 backdrop-blur-sm p-4">
          <div className="card max-w-md w-full p-5 space-y-4 animate-slide-down relative">
            <button onClick={() => { setIsImporterOpen(false); setCsvFile(null); setImportReport(null); }} className="absolute right-4 top-4 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200">
              <X size={16} />
            </button>
            <h2 className="text-sm font-bold text-ink-800 dark:text-white">Import Contacts</h2>

            {!importReport ? (
              <form onSubmit={handleImportFile} className="space-y-4">
                <div className="border-2 border-dashed border-ink-200/80 dark:border-white/10 rounded-lg p-6 text-center hover:border-accent-500 transition-colors flex flex-col items-center">
                  <FileText size={32} className="text-ink-400 mb-2" />
                  <input
                    type="file"
                    accept=".csv,.vcf,.vcard"
                    onChange={e => setCsvFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="csv-file-upload"
                    required
                  />
                  <label htmlFor="csv-file-upload" className="btn-outline py-1 px-3 cursor-pointer mb-2">
                    Choose CSV or VCF File
                  </label>
                  <span className="text-3xs text-ink-400">
                    {csvFile ? csvFile.name : "Ensure columns match: 'Name', 'Phone' (CSV), or select a standard VCF card file."}
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn-accent w-full py-2 flex items-center justify-center gap-1.5"
                  disabled={isImporting || !csvFile}
                >
                  {isImporting ? <RefreshCw size={14} className="animate-spin" /> : "Start Import"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-accent-700 dark:text-accent-400 font-semibold text-xs border-b border-ink-100/60 dark:border-white/10 pb-2">
                  <CheckCircle2 size={16} /> Import Completed Successfully
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="card-flat p-3 text-center">
                    <div className="text-2xs text-ink-400">Imported</div>
                    <div className="text-base font-bold text-accent-600 dark:text-accent-400">{importReport.imported}</div>
                  </div>
                  <div className="card-flat p-3 text-center">
                    <div className="text-2xs text-ink-400">Submitted</div>
                    <div className="text-base font-bold text-ink-700 dark:text-white">{importReport.submitted}</div>
                  </div>
                  <div className="card-flat p-3 text-center">
                    <div className="text-2xs text-ink-400">Duplicates (Skipped)</div>
                    <div className="text-base font-bold text-amber-500">{importReport.duplicates}</div>
                  </div>
                  <div className="card-flat p-3 text-center">
                    <div className="text-2xs text-ink-400">Invalid Rows (Skipped)</div>
                    <div className="text-base font-bold text-red-500">{importReport.invalid}</div>
                  </div>
                </div>

                <button
                  onClick={() => { setIsImporterOpen(false); setCsvFile(null); setImportReport(null); }}
                  className="btn-primary w-full py-2"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
