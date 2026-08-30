import { useState } from "react";
import { X, Zap, Star, Crown, CheckCircle, Smartphone, Image, RefreshCw, CreditCard } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface PaywallModalProps { onClose: () => void; onSuccess: () => void; }
const PLANS = [
  { key: "BASIC" as const, label: "Basic", price: 500, icon: Zap, maxInstances: 1, allowImages: false, popular: false, features: ["1 WhatsApp device","Unlimited text campaigns","Contact management","Basic analytics"] },
  { key: "PREMIUM" as const, label: "Premium", price: 1000, icon: Star, maxInstances: 5, allowImages: false, popular: true, features: ["Up to 5 devices","Unlimited text campaigns","Contact management","Advanced analytics","Recurring campaigns"] },
  { key: "PRO" as const, label: "Pro", price: 1500, icon: Crown, maxInstances: 10, allowImages: true, popular: false, features: ["Up to 10 devices","Unlimited text campaigns","Image/media messages","Advanced analytics","Recurring campaigns","Developer API"] },
];
export default function PaywallModal({ onClose, onSuccess }: PaywallModalProps) {
  const { workspaceId, accessToken } = useAuth();
  const [selected, setSelected] = useState<typeof PLANS[number] | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const handleCheckout = async () => {
    if (!selected || !workspaceId || !accessToken) return;
    if (!phone.trim()) { setError("Enter your M-Pesa phone number."); return; }
    setLoading(true); setError(null);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>(`/api/workspaces/${workspaceId}/billing/checkout`, { method: "POST", accessToken, body: JSON.stringify({ plan: selected.key, phoneNumber: phone.trim() }) });
      setSuccess(res.message);
      setTimeout(() => onSuccess(), 2000);
    } catch (e) { setError(e instanceof Error ? e.message : "Payment failed. Try again."); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl rounded-2xl border border-ink-200/60 dark:border-white/10 bg-white dark:bg-ink-950 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 hover:bg-ink-200 dark:bg-white/10 dark:hover:bg-white/20 text-ink-500 transition-colors z-10"><X size={16} /></button>
        <div className="p-6 pb-4">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-500/10 mb-3"><CreditCard size={22} className="text-accent-500" /></div>
            <h2 className="text-xl font-bold text-ink-900 dark:text-white">Choose a Package</h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Connecting devices requires an active subscription.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLANS.map(plan => {
              const Icon = plan.icon;
              const isSelected = selected?.key === plan.key;
              return (
                <button key={plan.key} onClick={() => { setSelected(plan); setError(null); }} className={`relative rounded-xl border-2 p-4 text-left transition-all focus:outline-none ${isSelected ? "border-accent-500 bg-accent-500/5 dark:bg-accent-500/10 shadow-md" : "border-ink-200/60 dark:border-white/10 hover:border-ink-300 dark:hover:border-white/20 bg-ink-50/50 dark:bg-white/5"}`}>
                  {plan.popular && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-accent-500 text-ink-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full">POPULAR</span>}
                  <Icon size={20} className={`mb-3 ${isSelected ? "text-accent-500" : "text-ink-400 dark:text-ink-500"}`} />
                  <div className="font-bold text-ink-900 dark:text-white">{plan.label}</div>
                  <div className="mt-0.5 mb-3"><span className="text-2xl font-extrabold text-ink-800 dark:text-white">Ksh {plan.price.toLocaleString()}</span><span className="text-xs text-ink-400 ml-1">/mo</span></div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-ink-600 dark:text-ink-300"><Smartphone size={11} className="text-accent-500 shrink-0" />Up to {plan.maxInstances} device{plan.maxInstances > 1 ? "s" : ""}</div>
                    {plan.allowImages && <div className="flex items-center gap-1.5 text-xs text-ink-600 dark:text-ink-300"><Image size={11} className="text-purple-500 shrink-0" />Image messages</div>}
                    {plan.features.map(f => <div key={f} className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400"><CheckCircle size={11} className="text-green-500 shrink-0" />{f}</div>)}
                  </div>
                  {isSelected && <div className="mt-2 text-2xs font-semibold text-accent-600 dark:text-accent-400 flex items-center gap-1"><CheckCircle size={10} />Selected</div>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="border-t border-ink-100/60 dark:border-white/10 p-6">
          {success ? (
            <div className="flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-700 dark:text-green-400"><CheckCircle size={16} />{success}</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-ink-700 dark:text-ink-300">M-Pesa Phone Number</label>
                <input type="tel" placeholder="e.g. 0712 345678" value={phone} onChange={e => setPhone(e.target.value)} className="input h-10 text-sm" disabled={loading} />
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              </div>
              <button onClick={handleCheckout} disabled={!selected || loading} className="btn-accent h-10 px-5 flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <><RefreshCw size={14} className="animate-spin" />Processing...</> : <><CreditCard size={14} />Pay {selected ? `Ksh ${selected.price.toLocaleString()}` : "—"}</>}
              </button>
            </div>
          )}
          <p className="mt-3 text-center text-[11px] text-ink-400 dark:text-ink-500">STK Push sent to your phone. Billed monthly, cancel anytime.</p>
        </div>
      </div>
    </div>
  );
}
