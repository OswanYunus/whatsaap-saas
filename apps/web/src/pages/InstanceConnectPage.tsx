import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, QrCode, Phone, RefreshCw, Sparkles, CheckCircle2, AlertCircle, ChevronDown, Search } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { name: "Afghanistan", code: "AF", dialCode: "93", flag: "🇦🇫" },
  { name: "Albania", code: "AL", dialCode: "355", flag: "🇦🇱" },
  { name: "Algeria", code: "DZ", dialCode: "213", flag: "🇩🇿" },
  { name: "Andorra", code: "AD", dialCode: "376", flag: "🇦🇩" },
  { name: "Angola", code: "AO", dialCode: "244", flag: "🇦🇴" },
  { name: "Argentina", code: "AR", dialCode: "54", flag: "🇦🇷" },
  { name: "Australia", code: "AU", dialCode: "61", flag: "🇦🇺" },
  { name: "Austria", code: "AT", dialCode: "43", flag: "🇦🇹" },
  { name: "Bahrain", code: "BH", dialCode: "973", flag: "🇧🇭" },
  { name: "Bangladesh", code: "BD", dialCode: "880", flag: "🇧🇩" },
  { name: "Belgium", code: "BE", dialCode: "32", flag: "🇧🇪" },
  { name: "Bolivia", code: "BO", dialCode: "591", flag: "🇧🇴" },
  { name: "Brazil", code: "BR", dialCode: "55", flag: "🇧🇷" },
  { name: "Canada", code: "CA", dialCode: "1", flag: "🇨🇦" },
  { name: "Chile", code: "CL", dialCode: "56", flag: "🇨🇱" },
  { name: "China", code: "CN", dialCode: "86", flag: "🇨🇳" },
  { name: "Colombia", code: "CO", dialCode: "57", flag: "🇨🇴" },
  { name: "Costa Rica", code: "CR", dialCode: "506", flag: "🇨🇷" },
  { name: "Croatia", code: "HR", dialCode: "385", flag: "🇭🇷" },
  { name: "Denmark", code: "DK", dialCode: "45", flag: "🇩🇰" },
  { name: "Egypt", code: "EG", dialCode: "20", flag: "🇪🇬" },
  { name: "Finland", code: "FI", dialCode: "358", flag: "🇫🇮" },
  { name: "France", code: "FR", dialCode: "33", flag: "🇫🇷" },
  { name: "Germany", code: "DE", dialCode: "49", flag: "🇩🇪" },
  { name: "Ghana", code: "GH", dialCode: "233", flag: "🇬🇭" },
  { name: "Greece", code: "GR", dialCode: "30", flag: "🇬🇷" },
  { name: "Hong Kong", code: "HK", dialCode: "852", flag: "🇭🇰" },
  { name: "Hungary", code: "HU", dialCode: "36", flag: "🇭🇺" },
  { name: "India", code: "IN", dialCode: "91", flag: "🇮🇳" },
  { name: "Indonesia", code: "ID", dialCode: "62", flag: "🇮🇩" },
  { name: "Ireland", code: "IE", dialCode: "353", flag: "🇮🇪" },
  { name: "Israel", code: "IL", dialCode: "972", flag: "🇮🇱" },
  { name: "Italy", code: "IT", dialCode: "39", flag: "🇮🇹" },
  { name: "Japan", code: "JP", dialCode: "81", flag: "🇯🇵" },
  { name: "Jordan", code: "JO", dialCode: "962", flag: "🇯🇴" },
  { name: "Kenya", code: "KE", dialCode: "254", flag: "🇰🇪" },
  { name: "Kuwait", code: "KW", dialCode: "965", flag: "🇰🇼" },
  { name: "Malaysia", code: "MY", dialCode: "60", flag: "🇲🇾" },
  { name: "Mexico", code: "MX", dialCode: "52", flag: "🇲🇽" },
  { name: "Morocco", code: "MA", dialCode: "212", flag: "🇲🇦" },
  { name: "Netherlands", code: "NL", dialCode: "31", flag: "🇳🇱" },
  { name: "New Zealand", code: "NZ", dialCode: "64", flag: "🇳🇿" },
  { name: "Nigeria", code: "NG", dialCode: "234", flag: "🇳🇬" },
  { name: "Norway", code: "NO", dialCode: "47", flag: "🇳🇴" },
  { name: "Oman", code: "OM", dialCode: "968", flag: "🇴🇲" },
  { name: "Pakistan", code: "PK", dialCode: "92", flag: "🇵🇰" },
  { name: "Peru", code: "PE", dialCode: "51", flag: "🇵🇪" },
  { name: "Philippines", code: "PH", dialCode: "63", flag: "🇵🇭" },
  { name: "Poland", code: "PL", dialCode: "48", flag: "🇵🇱" },
  { name: "Portugal", code: "PT", dialCode: "351", flag: "🇵🇹" },
  { name: "Qatar", code: "QA", dialCode: "974", flag: "🇶🇦" },
  { name: "Romania", code: "RO", dialCode: "40", flag: "🇷🇴" },
  { name: "Russia", code: "RU", dialCode: "7", flag: "🇷🇺" },
  { name: "Saudi Arabia", code: "SA", dialCode: "966", flag: "🇸🇦" },
  { name: "Singapore", code: "SG", dialCode: "65", flag: "🇸🇬" },
  { name: "South Africa", code: "ZA", dialCode: "27", flag: "🇿🇦" },
  { name: "South Korea", code: "KR", dialCode: "82", flag: "🇰🇷" },
  { name: "Spain", code: "ES", dialCode: "34", flag: "🇪🇸" },
  { name: "Sri Lanka", code: "LK", dialCode: "94", flag: "🇱🇰" },
  { name: "Sweden", code: "SE", dialCode: "46", flag: "🇸🇪" },
  { name: "Switzerland", code: "CH", dialCode: "41", flag: "🇨🇭" },
  { name: "Taiwan", code: "TW", dialCode: "886", flag: "🇹🇼" },
  { name: "Tanzania", code: "TZ", dialCode: "255", flag: "🇹🇿" },
  { name: "Thailand", code: "TH", dialCode: "66", flag: "🇹🇭" },
  { name: "Turkey", code: "TR", dialCode: "90", flag: "🇹🇷" },
  { name: "Uganda", code: "UG", dialCode: "256", flag: "🇺🇬" },
  { name: "Ukraine", code: "UA", dialCode: "380", flag: "🇺🇦" },
  { name: "United Arab Emirates", code: "AE", dialCode: "971", flag: "🇦🇪" },
  { name: "United Kingdom", code: "GB", dialCode: "44", flag: "🇬🇧" },
  { name: "United States", code: "US", dialCode: "1", flag: "🇺🇸" },
  { name: "Uruguay", code: "UY", dialCode: "598", flag: "🇺🇾" },
  { name: "Venezuela", code: "VE", dialCode: "58", flag: "🇻🇪" },
  { name: "Vietnam", code: "VN", dialCode: "84", flag: "🇻🇳" },
  { name: "Zimbabwe", code: "ZW", dialCode: "263", flag: "🇿🇼" }
].sort((a, b) => a.name.localeCompare(b.name));

export default function InstanceConnectPage() {
  const { workspaceId, accessToken } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [instanceName, setInstanceName] = useState("");
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [method, setMethod] = useState<"qr" | "phone">("qr");
  
  // Country Selector State
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    COUNTRIES.find((c) => c.code === "KE") || COUNTRIES[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Phone input (only the remainder of the number)
  const [phoneNumberRest, setPhoneNumberRest] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  // Live state from SSE
  const [status, setStatus] = useState<string>("PENDING");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sseRef = useRef<AbortController | null>(null);

  // Handle outside clicks to close country dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered countries for dropdown search
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES;
    const query = searchQuery.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.dialCode.includes(query) ||
        c.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Create Instance Record
  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceName.trim() || !workspaceId || !accessToken) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const data = await apiFetch<{ id: string }>("/api/whatsapp/instances", {
        method: "POST",
        accessToken,
        body: JSON.stringify({
          workspaceId,
          name: instanceName.trim()
        })
      });
      setInstanceId(data.id);
      setStep(2);
    } catch (err) {
      setError((err as Error).message || "Failed to create instance");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start Live Events connection
  const startSSE = async (id: string) => {
    // Abort previous connection if exists
    if (sseRef.current) {
      sseRef.current.abort();
    }

    const abortController = new AbortController();
    sseRef.current = abortController as any;

    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/instances/${id}/events?token=${accessToken}`, {
        signal: abortController.signal,
        headers: {
          "ngrok-skip-browser-warning": "true"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) return;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.status) {
                setStatus(data.status);
              }
              if (data.qrCodeString) {
                setQrCodeUrl(data.qrCodeString);
              }
              if (data.qrExpiresAt) {
                setQrExpiresAt(data.qrExpiresAt);
              }
              if (data.pairingCode) {
                setPairingCode(data.pairingCode);
              }
              if (data.status === "CONNECTED") {
                abortController.abort();
                navigate("/instances");
              }
            } catch (err) {
              console.error("Failed to parse SSE event", err);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn("SSE disconnected, error:", err);
      }
    }
  };

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.abort();
      }
    };
  }, []);

  // Initiate linking method
  const handleSelectMethod = (selectedMethod: "qr" | "phone") => {
    setMethod(selectedMethod);
    if (instanceId) {
      startSSE(instanceId);
      if (selectedMethod === "qr") {
        setStep(3);
      }
    }
  };

  // Request Phone Pairing Code
  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumberRest.trim() || !instanceId || !accessToken) return;

    // Combine dialCode with the remainder input
    const fullPhoneNumber = `${selectedCountry.dialCode}${phoneNumberRest.replace(/\D/g, "")}`;

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Connect SSE first to capture pairing code update
      startSSE(instanceId);
      
      const data = await apiFetch<{ code: string }>(`/api/whatsapp/instances/${instanceId}/pairing-code`, {
        method: "POST",
        accessToken,
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber
        })
      });
      setPairingCode(data.code);
      setStep(3);
    } catch (err) {
      setError((err as Error).message || "Failed to generate pairing code");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Force refresh QR / Reconnect
  const handleRefreshQR = async () => {
    if (!instanceId || !accessToken) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await apiFetch(`/api/whatsapp/instances/${instanceId}/reconnect`, {
        method: "POST",
        accessToken
      });
    } catch (err) {
      setError((err as Error).message || "Failed to refresh connection");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Timer for QR code expiration
  useEffect(() => {
    if (!qrExpiresAt) return;
    
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((new Date(qrExpiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [qrExpiresAt]);

  const isQrExpired = timeLeft === 0 && qrCodeUrl !== null;

  return (
    <div className="mx-auto max-w-md space-y-5">
      <Link
        to="/instances"
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-400 transition-colors duration-150 hover:text-ink-600 dark:hover:text-ink-200"
      >
        <ArrowLeft size={14} strokeWidth={1.75} /> Back to instances
      </Link>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-[13px] text-red-600 dark:text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Name the instance */}
      {step === 1 && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="empty-state-icon m-0">
              <Sparkles size={18} className="text-accent-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink-800 dark:text-white">Connect new device</h2>
              <p className="text-2xs text-ink-400">Start by giving this instance a descriptive name.</p>
            </div>
          </div>

          <form onSubmit={handleCreateInstance} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="instanceName" className="label">Instance Name</label>
              <input
                id="instanceName"
                type="text"
                placeholder="e.g. Sales Support, Marketing Line"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                className="input"
                required
                disabled={isSubmitting}
                maxLength={50}
              />
            </div>
            <button
              type="submit"
              className="btn-accent w-full flex items-center justify-center gap-1.5"
              disabled={isSubmitting || !instanceName.trim()}
            >
              {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : "Continue"}
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: Choose pairing method */}
      {step === 2 && (
        <div className="card p-6 space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-base font-semibold text-ink-800 dark:text-white">Choose connection method</h2>
            <p className="text-2xs text-ink-400">Select how you want to link your WhatsApp phone.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSelectMethod("qr")}
              className="card-flat p-4 text-center hover:border-accent-500 hover:bg-accent-500/5 transition-all space-y-2.5 flex flex-col items-center justify-center cursor-pointer"
            >
              <div className="h-10 w-10 rounded-full bg-accent-500/10 text-accent-600 dark:bg-accent-500/20 dark:text-accent-400 flex items-center justify-center">
                <QrCode size={20} />
              </div>
              <div>
                <div className="text-xs font-semibold text-ink-800 dark:text-white">Scan QR Code</div>
                <div className="text-3xs text-ink-400 mt-0.5">Quickly scan using phone's camera.</div>
              </div>
            </button>

            <button
              onClick={() => handleSelectMethod("phone")}
              className="card-flat p-4 text-center hover:border-accent-500 hover:bg-accent-500/5 transition-all space-y-2.5 flex flex-col items-center justify-center cursor-pointer"
            >
              <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center">
                <Phone size={20} />
              </div>
              <div>
                <div className="text-xs font-semibold text-ink-800 dark:text-white">Pairing Code</div>
                <div className="text-3xs text-ink-400 mt-0.5">Type an alphanumeric code on phone.</div>
              </div>
            </button>
          </div>

          {method === "phone" && (
            <form onSubmit={handleRequestPairingCode} className="space-y-4 border-t border-ink-100/60 dark:border-white/10 pt-4 animate-slide-down">
              
              {/* Telegram-style Country Code Selector */}
              <div className="space-y-1.5" ref={dropdownRef}>
                <label className="label">Country</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between rounded-md border border-ink-200/80 bg-white px-2.5 py-2 text-[13px] text-ink-800 focus:outline-none dark:border-white/10 dark:bg-surface-raised-dark dark:text-ink-100"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base select-none">{selectedCountry.flag}</span>
                      <span className="font-medium">{selectedCountry.name}</span>
                      <span className="text-ink-400">(+{selectedCountry.dialCode})</span>
                    </span>
                    <ChevronDown size={14} className="text-ink-400" />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-30 mt-1 w-full rounded-md border border-ink-200/80 bg-white shadow-lg dark:border-white/10 dark:bg-surface-dark">
                      <div className="flex items-center gap-1.5 border-b border-ink-100/60 dark:border-white/10 px-2.5 py-2">
                        <Search size={14} className="text-ink-400" />
                        <input
                          type="text"
                          placeholder="Search country or code..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full border-0 bg-transparent p-0 text-[13px] text-ink-800 focus:outline-none focus:ring-0 dark:text-ink-100"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto py-1">
                        {filteredCountries.length === 0 ? (
                          <div className="px-3 py-2 text-2xs text-ink-400 text-center">No countries found</div>
                        ) : (
                          filteredCountries.map((country) => (
                            <button
                              key={`${country.code}-${country.dialCode}`}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(country);
                                setIsDropdownOpen(false);
                                setSearchQuery("");
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-[13px] hover:bg-ink-50 dark:hover:bg-white/5 transition-colors"
                            >
                              <span className="text-base select-none">{country.flag}</span>
                              <span className="font-medium text-ink-800 dark:text-ink-200 grow">{country.name}</span>
                              <span className="text-ink-400 font-mono">+{country.dialCode}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Split Phone Field */}
              <div className="space-y-1.5">
                <label htmlFor="phoneNumberRest" className="label">Phone Number</label>
                <div className="flex gap-2">
                  <div className="w-20 select-none flex items-center justify-center rounded-md border border-ink-200/80 bg-ink-50/50 px-2.5 py-1.5 text-[13px] font-mono text-ink-500 dark:border-white/10 dark:bg-white/5 dark:text-ink-400">
                    +{selectedCountry.dialCode}
                  </div>
                  <input
                    id="phoneNumberRest"
                    type="text"
                    placeholder="e.g. 791584056"
                    value={phoneNumberRest}
                    onChange={(e) => setPhoneNumberRest(e.target.value.replace(/\D/g, ""))}
                    className="input grow font-mono"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-3xs text-ink-400">Enter the remaining phone digits without country code or spaces.</p>
              </div>

              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-1.5"
                disabled={isSubmitting || !phoneNumberRest.trim()}
              >
                {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : "Generate Pairing Code"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* STEP 3: Real-time link view */}
      {step === 3 && (
        <div className="card p-6 text-center space-y-5">
          <div className="flex justify-between items-center px-2">
            <span className="text-2xs font-semibold text-ink-400">LINK METHOD: {method.toUpperCase()}</span>
            <StatusBadge status={status} pulse={status !== "CONNECTED"} />
          </div>

          {/* QR Code Layout */}
          {method === "qr" && (
            <div className="space-y-4 flex flex-col items-center">
              <div className="relative border border-ink-100 dark:border-white/10 rounded-xl p-3 bg-white w-56 h-56 flex items-center justify-center">
                {qrCodeUrl ? (
                  <>
                    <img src={qrCodeUrl} alt="WhatsApp Pairing QR Code" className={`w-full h-full rounded-md ${isQrExpired ? "opacity-10" : ""}`} />
                    {isQrExpired && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 dark:bg-canvas-dark/95 p-4 rounded-xl">
                        <AlertCircle size={24} className="text-red-500 mb-2" />
                        <span className="text-xs font-semibold text-ink-800 dark:text-white">QR Code Expired</span>
                        <button onClick={handleRefreshQR} className="btn-accent text-3xs py-1 px-2.5 mt-2.5">
                          Refresh Code
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-ink-400 space-y-2">
                    <RefreshCw size={24} className="animate-spin text-accent-500" />
                    <span className="text-3xs">Generating QR code...</span>
                  </div>
                )}
              </div>

              {qrCodeUrl && !isQrExpired && (
                <div className="space-y-1">
                  <div className="w-56 progress-track mx-auto">
                    <div className="progress-fill" style={{ width: `${(timeLeft / 40) * 100}%` }} />
                  </div>
                  <span className="text-3xs text-ink-400">QR refreshes in {timeLeft} seconds.</span>
                </div>
              )}

              <p className="max-w-xs text-2xs leading-relaxed text-ink-400 mt-2">
                Open WhatsApp on your phone → <span className="font-semibold text-ink-600 dark:text-ink-300">Settings → Linked Devices → Link a Device</span>, then scan this QR code.
              </p>
            </div>
          )}

          {/* Pairing Code Layout */}
          {method === "phone" && (
            <div className="space-y-5 flex flex-col items-center">
              <div className="border border-ink-100 dark:border-white/10 rounded-xl p-4 bg-ink-50/50 dark:bg-white/5 w-64 text-center">
                {pairingCode ? (
                  <div className="space-y-2.5">
                    <div className="text-[26px] tracking-[6px] font-mono font-bold text-accent-600 dark:text-accent-400">
                      {pairingCode}
                    </div>
                    <div className="text-3xs text-ink-400">Use this code on your mobile device.</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-ink-400 py-3 space-y-2">
                    <RefreshCw size={20} className="animate-spin text-accent-500" />
                    <span className="text-3xs">Generating code...</span>
                  </div>
                )}
              </div>

              <p className="max-w-xs text-2xs leading-relaxed text-ink-400 text-left">
                1. Open WhatsApp on your phone.<br />
                2. Tap <span className="font-semibold">Linked Devices → Link a Device → Link with phone number instead</span>.<br />
                3. Enter the 8-character code shown above.
              </p>
            </div>
          )}

          {status === "CONNECTED" ? (
            <div className="flex items-center justify-center gap-1.5 text-accent-600 dark:text-accent-400 text-xs font-semibold py-2">
              <CheckCircle2 size={16} /> Device connected successfully! Redirecting...
            </div>
          ) : (
            <div className="text-3xs text-ink-400 flex items-center justify-center gap-1 animate-pulse">
              <RefreshCw size={10} className="animate-spin" /> Waiting for connection confirmation...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

