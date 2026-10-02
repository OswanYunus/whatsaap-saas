import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, RefreshCw, ShieldCheck, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import SpookyCanvas from "../../components/spooky/SpookyCanvas";

export default function VerifyEmailPage() {
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email = searchParams.get("email") || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!email) navigate("/register", { replace: true });
  }, [email, navigate]);

  const handleVerify = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!code.trim() || code.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setError(null);
    setResendMessage(null);
    setIsSubmitting(true);
    try {
      await verifyEmail(email, code.trim());
      setVerified(true);
      setTimeout(() => navigate("/", { replace: true }), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid code. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setError(null);
    setResendMessage(null);
    setIsResending(true);
    try {
      await resendVerification(email);
      setResendMessage("A new verification code has been sent!");
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    if (code.length === 6 && !verified && !isSubmitting) {
      handleVerify();
    }
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-canvas px-4 py-12 dark:bg-canvas-dark overflow-hidden">
      <SpookyCanvas />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1
            style={{ letterSpacing: "-0.03em" }}
            className="text-3xl font-extrabold text-ink-900 dark:text-white"
          >
            Tukonnect
          </h1>
          <p className="mt-1 text-xs text-ink-400 dark:text-ink-500 tracking-wider uppercase font-medium">
            Account Verification
          </p>
        </div>

        <div className="rounded-2xl border border-ink-100 bg-surface/95 p-7 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0d0d12]/90 dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
          {verified ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 size={44} className="text-orange-500" />
              <h2 className="text-base font-bold text-ink-800 dark:text-white">Email Verified!</h2>
              <p className="text-xs text-ink-500 dark:text-ink-300">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2 pb-4 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-base font-bold text-ink-800 dark:text-white">Verify your account</h2>
                <p className="text-xs text-ink-500 dark:text-ink-300">
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-ink-700 dark:text-ink-100">{email}</span>
                  {" "}via WhatsApp & email.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleVerify}>
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                  </div>
                )}

                {resendMessage && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 text-xs text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400">
                    {resendMessage}
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-ink-700 dark:text-ink-200">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="input mt-1 text-center text-lg tracking-[0.4em] font-mono py-2"
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || code.length !== 6}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 text-xs shadow-md shadow-orange-500/20 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Account"
                  )}
                </button>
              </form>

              <div className="mt-5 text-center text-xs space-y-2.5">
                <p className="text-ink-400 dark:text-ink-500">
                  Didn&apos;t get a code?{" "}
                  <button
                    onClick={handleResend}
                    disabled={isResending || resendCooldown > 0}
                    className="font-semibold text-orange-500 hover:text-orange-400 hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {isResending ? "Resending..." : resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}
                  </button>
                </p>
                <div className="flex items-center justify-center gap-4 text-ink-400 dark:text-ink-500">
                  <Link to="/login" className="inline-flex items-center gap-1 hover:underline">
                    <ArrowLeft size={12} /> Back to login
                  </Link>
                  <span>·</span>
                  <Link to="/register" className="hover:underline">
                    Register again
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
