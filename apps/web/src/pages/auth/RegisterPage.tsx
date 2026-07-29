import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

/**
 * Kept intentionally simple: no submit handler wired up yet — this
 * posts nowhere until it calls POST /api/auth/register via apiFetch.
 */
export default function RegisterPage() {
  return (
    <div className="auth-shell">
      <div className="w-full max-w-[360px]">
        <div className="mb-5 flex items-center justify-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-800 text-white dark:bg-accent-500 dark:text-ink-900">
            <MessageCircle size={14} strokeWidth={2.5} />
          </span>
          <span className="text-[13px] font-semibold tracking-tight text-ink-800 dark:text-white">
            WA Automation
          </span>
        </div>

        <div className="auth-card">
          <h1 className="text-[17px] font-semibold tracking-tight text-ink-800 dark:text-white">
            Create account
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-400">Set up your workspace in seconds.</p>

          <form className="mt-5 space-y-3.5">
            <div>
              <label className="label">Workspace name</label>
              <input placeholder="Musi's Collection" className="input mt-1" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" placeholder="you@business.com" className="input mt-1" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" placeholder="At least 8 characters" className="input mt-1" />
            </div>
            <button type="submit" className="btn-primary mt-1 w-full">
              Create account
            </button>
          </form>

          <p className="mt-5 text-center text-[13px] text-ink-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-ink-700 transition-colors hover:text-ink-900 dark:text-ink-200 dark:hover:text-white"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
