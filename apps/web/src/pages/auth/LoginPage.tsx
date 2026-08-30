import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "../../components/PasswordInput";
import ShimmerButton from "../../components/ui/ShimmerButton";
import { MessageCircle, Zap, Shield, BarChart3 } from "lucide-react";

const features = [
  { icon: Zap, text: "Bulk WhatsApp campaigns" },
  { icon: MessageCircle, text: "Multi-device management" },
  { icon: BarChart3, text: "Real-time analytics" },
  { icon: Shield, text: "Secure & compliant" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-canvas dark:bg-canvas-dark">

      {/* ── Left decorative panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col overflow-hidden bg-ink-900 dark:bg-ink-900">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-800 to-[#0d1a12]" />
        {/* Green glow orb */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-accent-500/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-accent-500/10 blur-[80px]" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(to right, rgb(255 255 255) 1px, transparent 1px)`,
            backgroundSize: "40px 40px"
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col justify-between p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-500 shadow-lg shadow-accent-500/30">
              <MessageCircle size={20} strokeWidth={2.5} className="text-white" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-white" style={{ letterSpacing: "-0.02em" }}>
                Tukonnect
              </p>
              <p className="text-[10px] font-medium tracking-widest text-white/40 uppercase">Digital</p>
            </div>
          </div>

          {/* Hero copy */}
          <div>
            <h1
              className="text-4xl xl:text-5xl font-bold text-white leading-[1.1]"
              style={{ letterSpacing: "-0.03em" }}
            >
              Automate your<br />
              <span className="text-accent-400">WhatsApp</span><br />
              marketing.
            </h1>
            <p className="mt-5 text-base text-white/50 leading-relaxed max-w-sm">
              Send campaigns, manage contacts, and track delivery — all from one powerful platform.
            </p>

            {/* Feature list */}
            <ul className="mt-10 space-y-3.5">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-500/15">
                    <Icon size={14} className="text-accent-400" strokeWidth={2} />
                  </div>
                  <span className="text-sm text-white/60">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <p className="text-xs text-white/25">© {new Date().getFullYear()} Tukonnect Digital</p>
        </div>
      </div>

      {/* ── Right login form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12">
        {/* Mobile logo */}
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500 shadow-lg shadow-accent-500/25 mb-3">
            <MessageCircle size={22} strokeWidth={2.5} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white" style={{ letterSpacing: "-0.025em" }}>
            Tukonnect Digital
          </h1>
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-ink-900 dark:text-white" style={{ letterSpacing: "-0.025em" }}>
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-ink-400 dark:text-ink-500">
              Sign in to your account to continue.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                <span>{error}</span>
                {error.includes("verified") && (
                  <div className="mt-2 pt-2 border-t border-red-200/50 dark:border-red-500/20">
                    <Link
                      to={`/verify-email?email=${encodeURIComponent(email)}`}
                      className="font-semibold text-accent-700 hover:underline dark:text-accent-400"
                    >
                      Click here to verify your account →
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                className="input"
              />
            </div>

            <div>
              <PasswordInput
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <div className="mt-2 flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-accent-600 hover:text-accent-700 hover:underline dark:text-accent-400"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <ShimmerButton type="submit" loading={isSubmitting} className="w-full mt-2 py-3">
              Sign in
            </ShimmerButton>
          </form>

          <p className="mt-6 text-center text-sm text-ink-400 dark:text-ink-500">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-accent-600 hover:underline dark:text-accent-400">
              Create one
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}