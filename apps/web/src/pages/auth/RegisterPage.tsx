import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import PasswordInput from "../../components/PasswordInput";
import PhoneInput from "../../components/PhoneInput";
import TermsModal from "../../components/TermsModal";
import HalloweenAuthLayout from "../../components/halloween/HalloweenScene";
import { Flame, ShieldCheck } from "lucide-react";

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
    <HalloweenAuthLayout>
      <div className="w-full max-w-[440px]">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-[#0f0b18]/80 px-3.5 py-1 text-xs font-semibold text-orange-400 shadow-lg shadow-black/50 backdrop-blur-md mb-3">
            <Flame size={13} className="text-orange-400 fill-orange-400/30" />
            <span className="font-mono text-[11px] tracking-wider uppercase text-orange-300">
              Spooky Season Onboarding
            </span>
          </div>
          <h1
            style={{ letterSpacing: "-0.03em" }}
            className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
          >
            Tukonnect Digital
          </h1>
          <p className="mt-1 text-xs text-orange-200/70 tracking-widest uppercase font-medium drop-shadow-md">
            WhatsApp Marketing & Automation SaaS
          </p>
        </div>

        {/* Register Card */}
        <div className="rounded-2xl border border-orange-500/30 bg-[#0c0816]/85 p-7 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(249,115,22,0.12)] backdrop-blur-2xl">
          <div className="mb-5 text-center">
            <h2 className="text-xl font-bold text-white tracking-tight">Create your workspace</h2>
            <p className="mt-1 text-xs text-ink-300">Get started with automated WhatsApp broadcasts.</p>
          </div>

          <form className="space-y-3.5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/50 p-3 text-xs text-red-200 backdrop-blur-md">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-ink-200 mb-1 block">Full Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="input text-xs py-2.5 bg-black/40 border-white/10 text-white placeholder:text-ink-500 focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>

            <PhoneInput
              label="Phone Number"
              onChange={setPhoneNumber}
            />

            <div>
              <label className="text-xs font-semibold text-ink-200 mb-1 block">Workspace name</label>
              <input
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="My Business"
                className="input text-xs py-2.5 bg-black/40 border-white/10 text-white placeholder:text-ink-500 focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-200 mb-1 block">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                className="input text-xs py-2.5 bg-black/40 border-white/10 text-white placeholder:text-ink-500 focus:border-orange-500 focus:ring-orange-500/20"
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

            {/* Terms of Service Notice (No Checkbox Required, Button Link to Modal) */}
            <div className="pt-1 pb-1">
              <p className="text-[11px] text-ink-300 leading-normal text-center">
                By clicking <span className="font-semibold text-white">&quot;Create account&quot;</span>, you agree to our{" "}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="font-bold text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors cursor-pointer inline"
                >
                  Terms of Service & Privacy Policy
                </button>
                .
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 text-xs shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] cursor-pointer"
            >
              <ShieldCheck size={16} />
              <span>{isSubmitting ? "Creating workspace..." : "Create account"}</span>
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-ink-300">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-orange-400 hover:text-orange-300 hover:underline">
              Log in
            </Link>
          </p>
        </div>

        {/* Terms & Conditions Full Modal */}
        <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      </div>
    </HalloweenAuthLayout>
  );
}