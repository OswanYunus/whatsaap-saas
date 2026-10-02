import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, RefreshCw, ShieldCheck, ArrowLeft, Flame } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import HalloweenAuthLayout from "../../components/halloween/HalloweenScene";

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
    <HalloweenAuthLayout>
      <div className="w-full max-w-[420px]">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-[#0f0b18]/80 px-3.5 py-1 text-xs font-semibold text-orange-400 shadow-lg shadow-black/50 backdrop-blur-md mb-3">
            <Flame size={13} className="text-orange-400 fill-orange-400/30" />
            <span className="font-mono text-[11px] tracking-wider uppercase text-orange-300">
              Account Verification
            </span>
          </div>
          <h1
            style={{ letterSpacing: "-0.03em" }}
            className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
          >
            Tukonnect Digital
          </h1>
        </div>

        <div className="rounded-2xl border border-orange-500/30 bg-[#0c0816]/85 p-8 shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(249,115,22,0.12)] backdrop-blur-2xl">
          {verified ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 size={44} className="text-orange-400" />
              <h2 className="text-base font-bold text-white">Email Verified!</h2>
              <p className="text-xs text-ink-300">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2 pb-4 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-base font-bold text-white">Verify your account</h2>
                <p className="text-xs text-ink-300">
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-orange-400">{email}</span>
                  {" "}via WhatsApp & email.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleVerify}>
                {error && (
                  <div className="rounded-xl border border-red-500/40 bg-red-950/50 p-3 text-xs text-red-200 backdrop-blur-md">
                    {error}
                  </div>
                )}

                {resendMessage && (
                  <div className="rounded-xl border border-green-500/40 bg-green-950/50 p-3 text-xs text-green-200 backdrop-blur-md">
                    {resendMessage}
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-ink-200 mb-1 block">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="input text-center text-lg tracking-[0.4em] font-mono py-2 bg-black/40 border-white/10 text-white focus:border-orange-500"
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || code.length !== 6}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 text-xs shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] cursor-pointer"
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
                <p className="text-ink-400">
                  Didn&apos;t get a code?{" "}
                  <button
                    onClick={handleResend}
                    disabled={isResending || resendCooldown > 0}
                    className="font-bold text-orange-400 hover:text-orange-300 hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {isResending ? "Resending..." : resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}
                  </button>
                </p>
                <div className="flex items-center justify-center gap-4 text-ink-400">
                  <Link to="/login" className="inline-flex items-center gap-1 hover:text-white">
                    <ArrowLeft size={12} /> Back to login
                  </Link>
                  <span>·</span>
                  <Link to="/register" className="hover:text-white">
                    Register again
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </HalloweenAuthLayout>
  );
}
