import { useEffect, useState } from "react";
import { X, Zap, Star, Crown, CheckCircle, Smartphone, Image, RefreshCw, CreditCard } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PhoneInput from "./PhoneInput";

interface PaywallModalProps {
  onClose: () => void;
  onSuccess: () => void;
  canClose?: boolean;
}

const PLANS = [
  {
    key: "BASIC" as const,
    label: "Basic",
    price: 500,
    icon: Zap,
    maxInstances: 1,
    allowImages: false,
    popular: false,
    tagline: "For one active WhatsApp line.",
    features: ["Text-only broadcasts", "Contact import access", "Dashboard messaging"]
  },
  {
    key: "PREMIUM" as const,
    label: "Premium",
    price: 1000,
    icon: Star,
    maxInstances: 5,
    allowImages: false,
    popular: true,
    tagline: "For teams running several lines.",
    features: ["Multi-device operations", "Campaign scheduling", "Recurring follow-ups"]
  },
  {
    key: "PRO" as const,
    label: "Pro",
    price: 1500,
    icon: Crown,
    maxInstances: 10,
    allowImages: true,
    popular: false,
    tagline: "For heavier messaging workflows.",
    features: ["Image-enabled messages", "Developer API access", "Highest device allowance"]
  }
];

export default function PaywallModal({ onClose, onSuccess, canClose = true }: PaywallModalProps) {
  const { workspaceId, accessToken } = useAuth();
  const [selected, setSelected] = useState<typeof PLANS[number] | null>(PLANS[1]);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!selected || !workspaceId || !accessToken) return;
    if (!phone.trim()) {
      setError("Enter your M-Pesa phone number.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setPending(null);
    setPaymentId(null);

    try {
      const res = await apiFetch<{ success: boolean; status?: string; message: string; paymentId?: string }>(
        `/api/workspaces/${workspaceId}/billing/checkout`,
        {
          method: "POST",
          accessToken,
          body: JSON.stringify({ plan: selected.key, phoneNumber: phone.trim() })
        }
      );

      if (res.success) {
        setSuccess(res.message);
        setTimeout(() => onSuccess(), 1200);
      } else if (res.status === "PENDING") {
        setPaymentId(res.paymentId ?? null);
        setPending(res.message || "STK Push sent. Complete payment on your phone to activate this package.");
      } else {
        setError(res.message || "Waiting for M-Pesa confirmation before activating this package.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment could not be started. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async () => {
    if (!workspaceId || !accessToken) return;
    setVerifying(true);
    setError(null);
    try {
      if (paymentId) {
        const payment = await apiFetch<{
          status: "PENDING" | "COMPLETED" | "FAILED";
          resultDescription?: string | null;
          responseDescription?: string | null;
        }>(
          `/api/workspaces/${workspaceId}/billing/payments/${paymentId}`,
          { accessToken }
        );

        if (payment.status === "FAILED") {
          setPending(null);
          setError(payment.resultDescription || payment.responseDescription || "M-Pesa payment was not completed. Try again.");
          return;
        }

        if (payment.status === "PENDING") {
          setPending("Still waiting for M-Pesa confirmation. Complete the STK prompt on your phone, then check again.");
          return;
        }
      }

      const billing = await apiFetch<{ plan: string; expired: boolean }>(
        `/api/workspaces/${workspaceId}/billing`,
        { accessToken }
      );
      if (billing.plan !== "FREE" && !billing.expired) {
        setSuccess("Payment confirmed. Your package is active.");
        setTimeout(() => onSuccess(), 800);
      } else {
        setPending("Still waiting for M-Pesa confirmation. Complete the STK prompt on your phone, then check again.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not verify payment yet.");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (!paymentId || success || error) return;
    const timer = window.setInterval(() => {
      void verifyPayment();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paymentId, success, error]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.28),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.94),rgba(17,24,39,0.9)_48%,rgba(8,47,73,0.88))] p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/18 bg-white/10 text-white shadow-2xl shadow-ink-950/40 backdrop-blur-2xl">
        {canClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-white/12 text-white/75 transition-colors hover:bg-white/20 hover:text-white"
            aria-label="Close package selector"
          >
            <X size={16} />
          </button>
        )}

        <div className="p-6 pb-4">
          <div className="mb-6 pr-10">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/12 px-3 py-1 text-xs font-semibold text-cyan-100">
              <CreditCard size={13} />
              Monthly packages
            </div>
            <h2 className="text-xl font-bold text-white">Choose a Cerebro package</h2>
            <p className="mt-1 max-w-2xl text-sm text-white/72">
              You can browse the dashboard without a package. Connecting devices, importing contacts, campaigns, and API sends require an active subscription.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isSelected = selected?.key === plan.key;
              return (
                <button
                  key={plan.key}
                  onClick={() => { setSelected(plan); setError(null); }}
                  className={`relative rounded-xl border p-4 text-left transition-all focus:outline-none ${isSelected ? "border-cyan-300/70 bg-white/18 shadow-lg shadow-cyan-950/20 ring-2 ring-cyan-300/25" : "border-white/14 bg-white/8 hover:border-white/28 hover:bg-white/12"}`}
                >
                  {plan.popular && <span className="absolute right-3 top-3 rounded-full bg-cyan-300 px-2 py-0.5 text-[10px] font-bold text-slate-950">POPULAR</span>}
                  <Icon size={20} className={`mb-3 ${isSelected ? "text-cyan-200" : "text-white/70"}`} />
                  <div className="font-bold text-white">{plan.label}</div>
                  <p className="mt-1 min-h-9 text-xs leading-5 text-white/64">{plan.tagline}</p>
                  <div className="mb-3 mt-0.5">
                    <span className="text-2xl font-extrabold text-white">Ksh {plan.price.toLocaleString()}</span>
                    <span className="ml-1 text-xs text-white/55">/mo</span>
                  </div>
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-white/12 bg-black/12 px-2.5 py-2">
                      <div className="text-[10px] font-semibold uppercase text-white/48">Devices</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-white">
                        <Smartphone size={12} className="text-cyan-200" />
                        {plan.maxInstances}
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/12 bg-black/12 px-2.5 py-2">
                      <div className="text-[10px] font-semibold uppercase text-white/48">Images</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-white">
                        <Image size={12} className={plan.allowImages ? "text-cyan-200" : "text-white/35"} />
                        {plan.allowImages ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-1.5 text-xs text-white/74">
                        <CheckCircle size={11} className="shrink-0 text-emerald-300" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  {isSelected && <div className="mt-3 text-2xs font-semibold text-cyan-100">Selected</div>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-white/12 bg-black/18 p-6">
          {success ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-300/12 px-4 py-3 text-sm text-emerald-100">
              <CheckCircle size={16} />
              {success}
            </div>
          ) : pending ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-cyan-300/25 bg-cyan-300/12 px-4 py-3 text-sm text-cyan-100">
                <RefreshCw size={16} className="animate-spin" />
                {pending}
              </div>
              <button
                onClick={verifyPayment}
                disabled={verifying}
                className="btn-outline w-full border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
              >
                {verifying ? "Checking payment..." : "Check payment status"}
              </button>
              {error && <p className="text-center text-xs text-rose-200">{error}</p>}
            </div>
          ) : (
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 [&_label]:!text-white">
                <PhoneInput label="M-Pesa Phone Number" value={phone} onChange={setPhone} disabled={loading} />
                {error && <p className="mt-2 text-xs text-rose-200">{error}</p>}
              </div>
              <button
                onClick={handleCheckout}
                disabled={!selected || loading}
                className="btn-accent flex h-10 shrink-0 items-center gap-2 px-5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <><RefreshCw size={14} className="animate-spin" />Processing...</> : <><CreditCard size={14} />Pay {selected ? `Ksh ${selected.price.toLocaleString()}` : ""}</>}
              </button>
            </div>
          )}
          <p className="mt-3 text-center text-[11px] text-white/56">
            Your package activates only after confirmed M-Pesa payment.
          </p>
        </div>
      </div>
    </div>
  );
}
