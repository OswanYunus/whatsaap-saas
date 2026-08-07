import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "../../components/PasswordInput";

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
      // Redirect to verify email page instead of dashboard
      navigate(`/verify-email?email=${encodeURIComponent(result.email)}`, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
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
          <h1 className="text-lg font-semibold text-ink-800 dark:text-white">Create account</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">Set up your workspace.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-ink-700 dark:text-ink-100">Full Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="input mt-1.5"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-ink-700 dark:text-ink-100">Phone Number</label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+254791584056"
                className="input mt-1.5 font-mono"
              />
              <p className="mt-1 text-xs text-ink-400">Include country code. Used to receive verification codes via WhatsApp.</p>
            </div>

            <div>
              <label className="text-sm font-medium text-ink-700 dark:text-ink-100">Workspace name</label>
              <input
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="My Business"
                className="input mt-1.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700 dark:text-ink-100">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                className="input mt-1.5"
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

            <button type="submit" disabled={isSubmitting || !canSubmit} className="btn-primary w-full">
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-300">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-accent-600 hover:underline dark:text-accent-400">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}