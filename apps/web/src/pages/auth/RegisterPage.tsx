import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import PasswordInput from "../../components/PasswordInput";
import PhoneInput from "../../components/PhoneInput";
import TermsModal from "../../components/TermsModal";
import SpookyCanvas from "../../components/spooky/SpookyCanvas";
import { Sparkles, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== password;
  const passwordTooShort = password.length > 0 && password.length < 8;

  const canSubmit = useMemo(
    () =>
      name.trim().length >= 2 &&
      phoneNumber.trim().length >= 8 &&
      workspaceName.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length >= 8 &&
      confirmPassword === password,
    [name, phoneNumber, workspaceName, email, password, confirmPassword]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register(email, password, workspaceName, name, phoneNumber);
      navigate(`/verify-email?email=${encodeURIComponent(result.email)}`, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-canvas px-4 py-12 dark:bg-canvas-dark overflow-hidden">
      {/* Ambient 60fps Spooky Canvas */}
      <SpookyCanvas />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400 mb-3">
            <Sparkles size={12} className="text-orange-400 animate-spin" />
            <span>Spooky Season Onboarding</span>
          </div>
          <h1
            style={{ letterSpacing: "-0.03em" }}
            className="text-3xl font-extrabold text-ink-900 dark:text-white"
          >
            Tukonnect Digital
          </h1>
          <p className="mt-1 text-xs text-ink-400 dark:text-ink-500 tracking-wider uppercase font-medium">
            WhatsApp Marketing & Automation SaaS
          </p>
        </div>

        {/* Register Card */}
        <div className="rounded-2xl border border-ink-100 bg-surface/95 p-7 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0d0d12]/90 dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
          <div>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white tracking-tight">Create your workspace</h2>
            <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-400">Get started with automated WhatsApp broadcasts.</p>
          </div>

          <form className="mt-5 space-y-3.5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-ink-700 dark:text-ink-200">Full Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="input mt-1 text-xs py-2.5"
              />
            </div>

            <PhoneInput
              label="Phone Number"
              onChange={setPhoneNumber}
            />

            <div>
              <label className="text-xs font-semibold text-ink-700 dark:text-ink-200">Workspace name</label>
              <input
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="My Business"
                className="input mt-1 text-xs py-2.5"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-700 dark:text-ink-200">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                className="input mt-1 text-xs py-2.5"
              />
            </div>

            <PasswordInput
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
              error={passwordTooShort ? "Password must be at least 8 characters." : null}
            />

            <PasswordInput
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter your password"
              required
              autoComplete="new-password"
              error={passwordsMismatch ? "Passwords don't match." : null}
            />

            {/* Terms and Conditions Notice (No Checkbox, Clean Text with Clickable Button) */}
            <div className="pt-1 pb-1">
              <p className="text-[11px] text-ink-400 dark:text-ink-400 leading-normal text-center">
                By clicking <span className="font-semibold text-ink-700 dark:text-ink-200">&quot;Create account&quot;</span>, you agree to our{" "}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="font-semibold text-orange-500 hover:text-orange-400 underline underline-offset-2 transition-colors cursor-pointer inline"
                >
                  Terms of Service & Privacy Policy
                </button>
                .
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 text-xs shadow-md shadow-orange-500/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              <ShieldCheck size={15} />
              <span>{isSubmitting ? "Creating account..." : "Create account"}</span>
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-ink-400 dark:text-ink-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-orange-500 hover:text-orange-400 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Terms of Service & Privacy Policy Modal */}
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
}