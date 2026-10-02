import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "../../components/PasswordInput";
import ShimmerButton from "../../components/ui/ShimmerButton";
import SpookyCanvas from "../../components/spooky/SpookyCanvas";
import { MessageCircle, Zap, Shield, BarChart3, Sparkles } from "lucide-react";

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
    <div className="relative flex min-h-screen bg-canvas dark:bg-canvas-dark overflow-hidden">
      {/* Spooky 60fps Ambient Particles */}
      <SpookyCanvas />

      {/* Left decorative panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col overflow-hidden bg-ink-900 dark:bg-ink-900">
        {/* Background gradient with eerie purple/orange touch */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950" />
        {/* Orange glow orb */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-orange-500/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-purple-500/20 blur-[100px]" />
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
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 shadow-lg shadow-orange-500/30">
              <span className="text-lg">🎃</span>
            </div>
            <div>
              <p className="text-[15px] font-bold text-white flex items-center gap-1.5" style={{ letterSpacing: "-0.02em" }}>
                Tukonnect
                <span className="rounded-full border border-orange-400/40 bg-orange-500/20 px-2 py-0.5 text-[9px] font-semibold text-orange-300">
                  Spooky Edition 🦇
                </span>
              </p>
              <p className="text-[10px] font-medium tracking-widest text-white/40 uppercase">Digital SaaS</p>
            </div>
          </div>

          {/* Hero copy */}
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold text-orange-300">
              <Sparkles size={13} className="animate-spin text-orange-400" />
              Spooky Season Supercharged Broadcasts
            </div>
            <h1
              className="text-4xl xl:text-5xl font-bold text-white leading-[1.1]"
              style={{ letterSpacing: "-0.03em" }}
            >
              Automate your<br />
              <span className="text-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]">WhatsApp</span><br />
              marketing.
            </h1>
            <p className="mt-5 text-base text-white/60 leading-relaxed max-w-sm">
              Send bulk campaigns, connect unlimited lines, and track real-time deliverability with spectral precision.
            </p>

            {/* Feature list */}
            <ul className="mt-10 space-y-3.5">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 border border-orange-500/20">
                    <Icon size={14} className="text-orange-400" strokeWidth={2} />
                  </div>
                  <span className="text-sm text-white/70">{text}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/developer-docs"
              className="mt-8 inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-white"
            >
              View Developer API docs →
            </Link>
          </div>

          {/* Footer */}
          <p className="text-xs text-white/30">© {new Date().getFullYear()} Tukonnect Digital • Spooky Season Edition</p>
        </div>
      </div>

      {/* Right login form panel */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12">
        {/* Mobile logo */}
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 shadow-lg shadow-orange-500/30 mb-3">
            <span className="text-2xl">🎃</span>
          </div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white flex items-center gap-1.5" style={{ letterSpacing: "-0.025em" }}>
            Tukonnect Digital
            <span className="text-sm">🦇</span>
          </h1>
        </div>

        <div className="w-full max-w-[400px] rounded-3xl border border-ink-100 bg-surface/90 p-8 shadow-2xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-surface-dark/90 dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
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
                      className="font-semibold text-orange-600 hover:underline dark:text-orange-400"
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
                  className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline dark:text-orange-400"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <ShimmerButton type="submit" loading={isSubmitting} className="w-full mt-2 py-3 !bg-orange-600 hover:!bg-orange-500">
              Sign in 🎃
            </ShimmerButton>
          </form>

          <p className="mt-6 text-center text-sm text-ink-400 dark:text-ink-500">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-orange-600 hover:underline dark:text-orange-400">
              Create one
            </Link>
          </p>
          <p className="mt-3 text-center text-sm">
            <Link to="/developer-docs" className="font-semibold text-ink-500 hover:text-ink-800 hover:underline dark:text-ink-400 dark:hover:text-ink-200">
              View Developer API documentation
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}
