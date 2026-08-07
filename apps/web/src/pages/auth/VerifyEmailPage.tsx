import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MessageCircle, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

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

  // If no email param, redirect to register
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
      // Auto-redirect after short delay
      setTimeout(() => navigate("/", { replace: true }), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid code. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResendMessage(null);
    setIsResending(true);
    try {
      await resendVerification(email);
      setResendMessage("A new verification code has been sent!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  // Auto-verify when code reaches 6 digits
  useEffect(() => {
    if (code.length === 6 && !verified && !isSubmitting) {
      handleVerify();
    }
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 dark:bg-canvas-dark">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink-800 text-white dark:bg-accent-500 dark:text-ink-900">
            <MessageCircle size={16} strokeWidth={2.5} />
          </span>
          <span className="text-sm font-semibold text-ink-800 dark:text-white">Tukonnect digital</span>
        </div>

        <div className="card p-8">
          {verified ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 size={48} className="text-green-500" />
              <h1 className="text-lg font-semibold text-ink-800 dark:text-white">Email Verified!</h1>
              <p className="text-sm text-ink-500 dark:text-ink-300">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-3 pb-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-500/10">
                  <ShieldCheck size={24} className="text-accent-600 dark:text-accent-400" />
                </div>
                <h1 className="text-lg font-semibold text-ink-800 dark:text-white">Verify your account</h1>
                <p className="text-sm text-ink-500 dark:text-ink-300">
                  We sent a 6-digit code to{" "}
                  <span className="font-medium text-ink-700 dark:text-ink-100">{email}</span>
                  {" "}via WhatsApp / server logs.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleVerify}>
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                  </div>
                )}

                {resendMessage && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400">
                    {resendMessage}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-ink-700 dark:text-ink-100">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="input mt-1.5 text-center text-xl tracking-[0.5em] font-mono"
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || code.length !== 6}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Account"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-xs space-y-2">
                <p className="text-ink-400 dark:text-ink-500">
                  Didn't get a code?{" "}
                  <button
                    onClick={handleResend}
                    disabled={isResending}
                    className="font-semibold text-accent-600 hover:underline dark:text-accent-400 disabled:opacity-50"
                  >
                    {isResending ? "Resending..." : "Resend Code"}
                  </button>
                </p>
                <p>
                  <a href="/register" className="text-ink-400 hover:underline dark:text-ink-500">
                    Register again
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
