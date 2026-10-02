import { X, ShieldCheck, FileText, Lock, AlertTriangle, Scale, Bell } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-[#0d0d12] text-ink-100 shadow-2xl shadow-black/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Scale size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Terms of Service & Privacy Policy</h2>
              <p className="text-xs text-ink-400">Last updated: October 2026 • Tukonnect Digital SaaS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-ink-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-xs text-ink-300 space-y-5 leading-relaxed font-sans">
          
          {/* Summary Box */}
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.04] p-4 text-ink-200">
            <div className="flex items-center gap-2 font-semibold text-orange-400 text-xs mb-1">
              <ShieldCheck size={15} />
              <span>Important Summary for Account Owners</span>
            </div>
            <p className="text-[11px] text-ink-300 leading-normal">
              By creating an account on Tukonnect Digital, you acknowledge that platform administrators monitor account activity and email addresses for security and compliance. Your private customer data and phone numbers will strictly never be shared with third parties.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="text-orange-400 font-mono">1.</span> Acceptance of Terms & Service Scope
            </h3>
            <p>
              By accessing, registering, or using the Tukonnect Digital SaaS platform (&quot;Service&quot;), you (&quot;User&quot;, &quot;Customer&quot;, or &quot;Subscriber&quot;) agree to be legally bound by these Terms of Service. If you do not agree to all terms, you must immediately discontinue using this application.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Lock size={14} className="text-orange-400" />
              <span className="text-orange-400 font-mono">2.</span> Account Monitoring, Data Collection & Privacy Protection
            </h3>
            <p>
              <strong>2.1 Administrative Monitoring:</strong> To maintain system uptime, security, and spam prevention, platform administrators actively monitor registered user account details, including verified email addresses, registration phone numbers, API request volumes, campaign delivery rates, and device connection telemetry.
            </p>
            <p>
              <strong>2.2 Absolute Data Privacy:</strong> We strictly adhere to data minimization and protection laws. <strong>Under no circumstances will user email addresses, personal credentials, imported contact lists, or message records be sold, rented, leased, or disclosed to third-party marketing entities or advertisers.</strong> All stored data is utilized exclusively for service execution and billing authentication.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle size={14} className="text-orange-400" />
              <span className="text-orange-400 font-mono">3.</span> Meta / WhatsApp Independent Third-Party Disclaimer
            </h3>
            <p>
              <strong>3.1 No Affiliation:</strong> Tukonnect Digital is an independent third-party automation and messaging tool. It is neither affiliated with, sponsored by, nor endorsed by Meta Platforms, Inc., WhatsApp LLC, or any of their subsidiaries.
            </p>
            <p>
              <strong>3.2 User Responsibility & Account Ban Liability:</strong> WhatsApp enforces strict anti-spam and automated messaging heuristics. You are exclusively responsible for obtaining explicit opt-in consent from all message recipients and properly warming up connected WhatsApp instances. <strong>Tukonnect Digital and its developers bear zero liability for WhatsApp account bans, phone number restrictions, delivery throttles, or account suspensions imposed by Meta Platforms.</strong>
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText size={14} className="text-orange-400" />
              <span className="text-orange-400 font-mono">4.</span> Anti-Spam, Fair Use & Zero-Tolerance Policy
            </h3>
            <p>
              You agree NOT to use the Service for:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-ink-300">
              <li>Transmitting unsolicited promotional material (spam) to individuals without prior documented consent.</li>
              <li>Financial fraud, phishing scams, impersonation of financial institutions, or deceptive schemes.</li>
              <li>Hate speech, defamatory messages, illegal drugs, weapons, harassment, or adult material.</li>
              <li>Attempting to reverse-engineer, exploit, DDoS, or overwhelm the backend API infrastructure.</li>
            </ul>
            <p>
              Violation of this policy will result in immediate and permanent account termination without prior notice and without refund.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Bell size={14} className="text-orange-400" />
              <span className="text-orange-400 font-mono">5.</span> Billing, Payments & No-Refund Policy
            </h3>
            <p>
              All subscription packages (Basic, Premium, Pro) are billed in Kenya Shillings (KES) via M-Pesa / Tuma payment gateway. Due to the immediate provisioning of computing resources and WhatsApp instance workers, <strong>all subscription payments are final and strictly non-refundable</strong> once processed.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Scale size={14} className="text-orange-400" />
              <span className="text-orange-400 font-mono">6.</span> Limitation of Liability & Full Legal Indemnification
            </h3>
            <p>
              <strong>6.1 Disclaimer of Warranties:</strong> The Service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot;. We do not guarantee error-free or uninterrupted operation.
            </p>
            <p>
              <strong>6.2 Maximum Liability:</strong> To the maximum extent permitted by applicable law, in no event shall Tukonnect Digital, its owners, founders, developers, or contractors be liable for any indirect, punitive, incidental, special, consequential, or exemplary damages, including lost profits, loss of data, or business interruption. Total cumulative liability shall never exceed the amount paid by you in the single month immediately preceding the event.
            </p>
            <p>
              <strong>6.3 Indemnification:</strong> You agree to defend, indemnify, and hold harmless Tukonnect Digital and its administrators against any and all legal claims, fines, regulatory penalties, damages, or liabilities arising from your campaigns, contacts, or message broadcasts.
            </p>
          </section>

        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/10 px-6 py-4 bg-white/[0.02] flex items-center justify-between">
          <span className="text-[11px] text-ink-400">Tukonnect Digital • Strict Data Protection</span>
          <button
            onClick={onClose}
            className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all active:scale-95"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
}
