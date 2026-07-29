import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, QrCode, RefreshCw } from "lucide-react";

/**
 * QR pairing screen. The QR grid below is a static placeholder pattern
 * — there is no real Baileys session behind it yet (see
 * WhatsAppService.createInstance on the backend). Once Baileys is
 * wired up, this page should subscribe to the instance's
 * `connection.update` events (via WebSocket or polling
 * `GET /api/whatsapp/instances/:id/status`) and swap the placeholder
 * for the real QR payload, then redirect to /instances on `CONNECTED`.
 */
function PlaceholderQrGrid() {
  // Deterministic pseudo-random pattern so the placeholder looks like
  // a QR code without pretending to encode anything real.
  const cells = useMemo(() => {
    let seed = 42;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    return Array.from({ length: 25 * 25 }, () => rand() > 0.55);
  }, []);

  return (
    <div
      className="grid gap-[1.5px] rounded-md bg-white p-2.5"
      style={{ gridTemplateColumns: "repeat(25, minmax(0, 1fr))" }}
    >
      {cells.map((filled, i) => (
        <div key={i} className={`aspect-square ${filled ? "bg-ink-800" : "bg-transparent"}`} />
      ))}
    </div>
  );
}

export default function InstanceConnectPage() {
  const [refreshedAt, setRefreshedAt] = useState(Date.now());

  return (
    <div className="mx-auto max-w-sm space-y-5">
      <Link
        to="/instances"
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-400 transition-colors duration-150 hover:text-ink-600 dark:hover:text-ink-200"
      >
        <ArrowLeft size={14} strokeWidth={1.75} /> Back to instances
      </Link>

      <div className="card p-5 text-center">
        <div className="empty-state-icon mx-auto">
          <QrCode size={18} strokeWidth={1.75} />
        </div>
        <h1 className="text-[17px] font-semibold tracking-tight text-ink-800 dark:text-white">
          Link a device
        </h1>
        <p className="mx-auto mt-1 max-w-xs text-[13px] leading-relaxed text-ink-400">
          Open WhatsApp →{" "}
          <span className="font-medium text-ink-600 dark:text-ink-300">
            Settings → Linked Devices → Link a Device
          </span>
          , then scan this code.
        </p>

        <div className="mx-auto mt-5 w-56 rounded-lg border border-ink-100/80 p-2 dark:border-white/10">
          <PlaceholderQrGrid key={refreshedAt} />
        </div>

        <button onClick={() => setRefreshedAt(Date.now())} className="btn-outline mt-4">
          <RefreshCw size={13} strokeWidth={1.75} /> Refresh code
        </button>

        <p className="mt-4 text-2xs leading-relaxed text-ink-400">
          Placeholder code — a real scannable QR will appear once the WhatsApp integration is connected.
        </p>
      </div>
    </div>
  );
}
