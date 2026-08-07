import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, RefreshCw, CheckCircle2, KeyRound, Smartphone } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "../../components/PasswordInput";
import PhoneInput from "../../components/PhoneInput";

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

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await forgotPassword(phoneNumber.trim());
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await verifyResetCode(phoneNumber.trim(), code.trim());
      setStep("newpass");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code.");
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
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          {/* DONE */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 size={48} className="text-green-500" />
              <h1 className="text-lg font-semibold text-ink-800 dark:text-white">Password Reset!</h1>
              <p className="text-sm text-ink-500 dark:text-ink-300">Redirecting to login...</p>
            </div>
          )}

          {/* STEP 1: Phone number */}
          {step === "phone" && (
            <>
              <div className="flex flex-col items-center gap-3 pb-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                  <Smartphone size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-lg font-semibold text-ink-800 dark:text-white">Forgot password?</h1>
                <p className="text-sm text-ink-500 dark:text-ink-300">
                  Enter your phone number and we'll send a reset code via WhatsApp.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSendCode}>
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                  </div>
                )}
                <PhoneInput
                  label="Phone Number"
                  onChange={setPhoneNumber}
                />
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                  {isSubmitting ? <><RefreshCw size={16} className="animate-spin" /> Sending...</> : "Send Reset Code"}
                </button>
              </form>
              <p className="mt-4 text-center text-sm">
                <Link to="/login" className="text-accent-600 hover:underline dark:text-accent-400">Back to login</Link>
              </p>
            </>
          )}

          {/* STEP 2: Enter code */}
          {step === "code" && (
            <>
              <div className="flex flex-col items-center gap-3 pb-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-500/10">
                  <KeyRound size={24} className="text-accent-600 dark:text-accent-400" />
                </div>
                <h1 className="text-lg font-semibold text-ink-800 dark:text-white">Enter Reset Code</h1>
                <p className="text-sm text-ink-500 dark:text-ink-300">
                  Check WhatsApp on <span className="font-medium text-ink-700 dark:text-ink-100">{phoneNumber}</span> for your 6-digit code.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleVerifyCode}>
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-ink-700 dark:text-ink-100">Reset Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="input mt-1.5 text-center text-xl tracking-[0.5em] font-mono"
                    autoFocus
                    required
                  />
                </div>
                <button type="submit" disabled={isSubmitting || code.length !== 6} className="btn-primary w-full flex items-center justify-center gap-2">
                  {isSubmitting ? <><RefreshCw size={16} className="animate-spin" /> Verifying...</> : "Verify Code"}
                </button>
              </form>
            </>
          )}

          {/* STEP 3: New password */}
          {step === "newpass" && (
            <>
              <div className="flex flex-col items-center gap-3 pb-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                  <KeyRound size={24} className="text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-lg font-semibold text-ink-800 dark:text-white">Set New Password</h1>
                <p className="text-sm text-ink-500 dark:text-ink-300">Choose a strong password for your account.</p>
              </div>

              <form className="space-y-4" onSubmit={handleResetPassword}>
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
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
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <><RefreshCw size={16} className="animate-spin" /> Saving...</> : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
