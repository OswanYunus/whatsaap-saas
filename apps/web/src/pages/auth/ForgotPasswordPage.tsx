import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RefreshCw, CheckCircle2, KeyRound, Smartphone, ArrowLeft, Flame } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "../../components/PasswordInput";
import PhoneInput from "../../components/PhoneInput";
import HalloweenAuthLayout from "../../components/halloween/HalloweenScene";

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
    <HalloweenAuthLayout>
      <div className="w-full max-w-[420px]">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-[#0f0b18]/80 px-3.5 py-1 text-xs font-semibold text-orange-400 shadow-lg shadow-black/50 backdrop-blur-md mb-3">
            <Flame size={13} className="text-orange-400 fill-orange-400/30" />
            <span className="font-mono text-[11px] tracking-wider uppercase text-orange-300">
              Account Recovery
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
          {/* DONE */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 size={44} className="text-orange-400" />
              <h2 className="text-base font-bold text-white">Password Reset!</h2>
              <p className="text-xs text-ink-300">Redirecting to login...</p>
            </div>
          )}

          {/* STEP 1: Phone number */}
          {step === "phone" && (
            <>
              <div className="flex flex-col items-center gap-2 pb-4 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <Smartphone size={20} />
                </div>
                <h2 className="text-base font-bold text-white">Forgot password?</h2>
                <p className="text-xs text-ink-300">
                  Enter your phone number to receive a 6-digit WhatsApp reset code.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSendCode}>
                {error && (
                  <div className="rounded-xl border border-red-500/40 bg-red-950/50 p-3 text-xs text-red-200 backdrop-blur-md">
                    {error}
                  </div>
                )}
                <PhoneInput
                  label="Phone Number"
                  onChange={setPhoneNumber}
                />
                <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 text-xs shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] cursor-pointer">
                  {isSubmitting ? <><RefreshCw size={14} className="animate-spin" /> Sending...</> : "Send Reset Code"}
                </button>
              </form>
              <p className="mt-4 text-center text-xs">
                <Link to="/login" className="text-orange-400 hover:text-orange-300 font-bold hover:underline">Back to login</Link>
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
                <h2 className="text-base font-bold text-white">Enter Reset Code</h2>
                <p className="text-xs text-ink-300">
                  Check WhatsApp on <span className="font-semibold text-orange-400">{phoneNumber}</span> for your code.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleVerifyCode}>
                {error && (
                  <div className="rounded-xl border border-red-500/40 bg-red-950/50 p-3 text-xs text-red-200 backdrop-blur-md">
                    {error}
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-ink-200 mb-1 block">6-Digit Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="input text-center text-lg tracking-[0.4em] font-mono py-2 bg-black/40 border-white/10 text-white focus:border-orange-500"
                    autoFocus
                    required
                  />
                </div>
                <button type="submit" disabled={isSubmitting || code.length !== 6} className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 text-xs shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] cursor-pointer">
                  {isSubmitting ? <><RefreshCw size={14} className="animate-spin" /> Verifying...</> : "Verify Code"}
                </button>
              </form>

              <div className="mt-5 text-center text-xs space-y-2.5">
                <p className="text-ink-400">
                  Didn&apos;t get the code?{" "}
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isSubmitting}
                    className="font-bold text-orange-400 hover:text-orange-300 hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}
                  </button>
                </p>
                <div>
                  <Link to="/login" className="inline-flex items-center gap-1 font-medium text-ink-400 hover:text-white">
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
                <h2 className="text-base font-bold text-white">Set New Password</h2>
                <p className="text-xs text-ink-300">Choose a secure password for your account.</p>
              </div>

              <form className="space-y-4" onSubmit={handleResetPassword}>
                {error && (
                  <div className="rounded-xl border border-red-500/40 bg-red-950/50 p-3 text-xs text-red-200 backdrop-blur-md">
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
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 text-xs shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {isSubmitting ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </HalloweenAuthLayout>
  );
}
