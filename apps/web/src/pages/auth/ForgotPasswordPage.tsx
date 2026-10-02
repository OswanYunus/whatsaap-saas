import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RefreshCw, CheckCircle2, KeyRound, Smartphone, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "../../components/PasswordInput";
import PhoneInput from "../../components/PhoneInput";
import SpookyCanvas from "../../components/spooky/SpookyCanvas";

type Step = "phone" | "code" | "newpass" | "done";

export default function ForgotPasswordPage() {
  const { forgotPassword, verifyResetCode, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await forgotPassword(phoneNumber.trim());
      setStep("code");
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await forgotPassword(phoneNumber.trim());
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await verifyResetCode(phoneNumber.trim(), code.trim());
      setStep("newpass");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid reset code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await resetPassword(phoneNumber.trim(), code.trim(), newPassword);
      setStep("done");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Account Recovery
          </p>
        </div>

        <div className="rounded-2xl border border-ink-100 bg-surface/95 p-7 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0d0d12]/90 dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
          {/* DONE */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 size={44} className="text-orange-500" />
              <h2 className="text-base font-bold text-ink-800 dark:text-white">Password Reset!</h2>
              <p className="text-xs text-ink-500 dark:text-ink-300">Redirecting to login...</p>
            </div>
          )}

          {/* STEP 1: Phone number */}
          {step === "phone" && (
            <>
              <div className="flex flex-col items-center gap-2 pb-4 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <Smartphone size={20} />
                </div>
                <h2 className="text-base font-bold text-ink-800 dark:text-white">Forgot password?</h2>
                <p className="text-xs text-ink-500 dark:text-ink-300">
                  Enter your phone number to receive a 6-digit WhatsApp reset code.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSendCode}>
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                  </div>
                )}
                <PhoneInput
                  label="Phone Number"
                  onChange={setPhoneNumber}
                />
                <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 text-xs shadow-md shadow-orange-500/20 transition-all active:scale-[0.98] cursor-pointer">
                  {isSubmitting ? <><RefreshCw size={14} className="animate-spin" /> Sending...</> : "Send Reset Code"}
                </button>
              </form>
              <p className="mt-4 text-center text-xs">
                <Link to="/login" className="text-orange-500 hover:text-orange-400 font-semibold hover:underline">Back to login</Link>
              </p>
            </>
          )}

          {/* STEP 2: Enter code */}
          {step === "code" && (
            <>
              <div className="flex flex-col items-center gap-2 pb-4 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <KeyRound size={20} />
                </div>
                <h2 className="text-base font-bold text-ink-800 dark:text-white">Enter Reset Code</h2>
                <p className="text-xs text-ink-500 dark:text-ink-300">
                  Check WhatsApp on <span className="font-semibold text-ink-700 dark:text-ink-100">{phoneNumber}</span> for your code.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleVerifyCode}>
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-ink-700 dark:text-ink-200">6-Digit Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="input mt-1 text-center text-lg tracking-[0.4em] font-mono py-2"
                    autoFocus
                    required
                  />
                </div>
                <button type="submit" disabled={isSubmitting || code.length !== 6} className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 text-xs shadow-md shadow-orange-500/20 transition-all active:scale-[0.98] cursor-pointer">
                  {isSubmitting ? <><RefreshCw size={14} className="animate-spin" /> Verifying...</> : "Verify Code"}
                </button>
              </form>

              <div className="mt-5 text-center text-xs space-y-2.5">
                <p className="text-ink-400 dark:text-ink-500">
                  Didn&apos;t get the code?{" "}
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isSubmitting}
                    className="font-semibold text-orange-500 hover:text-orange-400 hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}
                  </button>
                </p>
                <div>
                  <Link to="/login" className="inline-flex items-center gap-1 font-medium text-ink-400 hover:text-ink-200">
                    <ArrowLeft size={12} /> Back to login
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* STEP 3: New password */}
          {step === "newpass" && (
            <>
              <div className="flex flex-col items-center gap-2 pb-4 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <KeyRound size={20} />
                </div>
                <h2 className="text-base font-bold text-ink-800 dark:text-white">Set New Password</h2>
                <p className="text-xs text-ink-500 dark:text-ink-300">Choose a secure password for your account.</p>
              </div>

              <form className="space-y-4" onSubmit={handleResetPassword}>
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                  </div>
                )}
                <PasswordInput
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  error={newPassword.length > 0 && newPassword.length < 8 ? "Password must be at least 8 characters." : null}
                />
                <PasswordInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Re-enter password"
                  required
                  autoComplete="new-password"
                  error={confirmPassword.length > 0 && confirmPassword !== newPassword ? "Passwords don't match." : null}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || newPassword.length < 8 || newPassword !== confirmPassword}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 text-xs shadow-md shadow-orange-500/20 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {isSubmitting ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
