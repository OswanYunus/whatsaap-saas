import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "../../components/PasswordInput";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

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
      workspaceName.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length >= 8 &&
      confirmPassword === password,
    [workspaceName, email, password, confirmPassword]
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
      await register(email, password, workspaceName);
      navigate("/", { replace: true });
    } catch (err) {
      // Surface the real reason instead of a generic message — an
      // ApiError carries the backend's message (e.g. "email already
      // exists"); anything else (TypeError from a failed fetch, a
      // CORS rejection, the API being unreachable) still has a
      // .message worth showing rather than hiding it.
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
          <span className="text-sm font-semibold text-ink-800 dark:text-white">WA Automation</span>
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
              <label className="text-sm font-medium text-ink-700 dark:text-ink-100">Workspace name</label>
              <input
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Musi's Collection"
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