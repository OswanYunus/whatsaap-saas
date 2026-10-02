import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "../../components/PasswordInput";
import ShimmerButton from "../../components/ui/ShimmerButton";
import HalloweenAuthLayout from "../../components/halloween/HalloweenScene";
import { Flame, ShieldCheck } from "lucide-react";

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
    <HalloweenAuthLayout>
      <div className="w-full max-w-[420px]">
        {/* Brand Header with Glowing Emblem */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-[#0f0b18]/80 px-3.5 py-1 text-xs font-semibold text-orange-400 shadow-lg shadow-black/50 backdrop-blur-md mb-3">
            <Flame size={13} className="text-orange-400 fill-orange-400/30" />
            <span className="font-mono text-[11px] tracking-wider uppercase text-orange-300">
              Spooky Season Edition
            </span>
          </div>
          <h1
            style={{ letterSpacing: "-0.03em" }}
            className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
          >
            Tukonnect Digital
          </h1>
          <p className="mt-1 text-xs text-orange-200/70 tracking-widest uppercase font-medium drop-shadow-md">
            Automated WhatsApp Marketing Infrastructure
          </p>
        </div>

        {/* Theatrical Elevated Glassmorphic Card */}
        <div className="rounded-2xl border border-orange-500/30 bg-[#0c0816]/85 p-8 shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(249,115,22,0.12)] backdrop-blur-2xl">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Sign In to Your Workspace
            </h2>
            <p className="mt-1 text-xs text-ink-300">
              Manage instances, multi-device broadcasts & campaigns.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/50 p-3 text-xs text-red-200 backdrop-blur-md">
                <span>{error}</span>
                {error.includes("verified") && (
                  <div className="mt-2 pt-2 border-t border-red-500/30">
                    <Link
                      to={`/verify-email?email=${encodeURIComponent(email)}`}
                      className="font-semibold text-orange-400 hover:underline"
                    >
                      Click here to verify your account →
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-ink-200 mb-1.5 block">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                className="input text-xs py-2.5 bg-black/40 border-white/10 text-white placeholder:text-ink-500 focus:border-orange-500 focus:ring-orange-500/20"
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
                  className="text-xs font-medium text-orange-400 hover:text-orange-300 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <ShimmerButton
              type="submit"
              loading={isSubmitting}
              className="w-full mt-2 py-3 !bg-orange-500 hover:!bg-orange-600 font-bold text-xs tracking-wide shadow-lg shadow-orange-500/25"
            >
              Sign In to Dashboard
            </ShimmerButton>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center space-y-2">
            <p className="text-xs text-ink-300">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-bold text-orange-400 hover:text-orange-300 hover:underline">
                Create workspace
              </Link>
            </p>
            <p className="text-xs">
              <Link to="/developer-docs" className="text-ink-400 hover:text-ink-200 transition-colors">
                View Developer API documentation →
              </Link>
            </p>
          </div>
        </div>

        {/* Subtle Trust Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-orange-200/50 drop-shadow">
          <ShieldCheck size={13} className="text-orange-400/80" />
          <span>Encrypted Baileys Engine • 99.9% WhatsApp Delivery</span>
        </div>
      </div>
    </HalloweenAuthLayout>
  );
}
