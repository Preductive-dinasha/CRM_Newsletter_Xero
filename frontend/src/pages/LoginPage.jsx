import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Eye, EyeOff, ArrowRight } from "lucide-react";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";

const inputCls =
  "w-full px-4 py-3.5 bg-white/50 border border-[#c5c5d3] rounded-lg text-sm text-[#1f1b17] outline-none transition-all duration-200 focus:border-[#0d2678] focus:ring-2 focus:ring-[#0d2678]/20 placeholder:text-[#757683]";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      setUser(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-10 font-body"
      style={{
        backgroundColor: "#fff8f5",
        backgroundImage:
          "radial-gradient(at 0% 0%, rgba(13,38,120,0.06) 0px, transparent 55%), radial-gradient(at 100% 100%, rgba(0,97,162,0.06) 0px, transparent 55%)",
      }}
    >
      <div className="w-full max-w-[440px] flex flex-col items-center fade-up">
        <header className="mb-9 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-[32px] bg-[#0d2678] flex items-center justify-center mb-4 shadow-lg">
            <MessageSquare size={32} strokeWidth={2.2} className="text-white" />
          </div>
          <h1 className="text-[28px] font-bold text-[#0d2678] leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Welcome to Pai
          </h1>
          <p className="text-sm mt-1.5 text-[#454651]">Sign in to continue</p>
        </header>

        <section className="glass-panel w-full rounded-2xl p-9 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3.5 rounded-md text-sm bg-[#ffdad6] text-[#ba1a1a] border border-[#ffdad6]">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[13px] font-bold text-[#1f1b17] ml-0.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                autoComplete="email"
                className={inputCls}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-0.5">
                <label className="block text-[13px] font-bold text-[#1f1b17]">Password</label>
                <button
                  type="button"
                  className="text-xs text-[#0061a2] hover:text-[#0d2678] transition-colors font-bold uppercase tracking-wider"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[#757683] hover:text-[#1f1b17] hover:bg-[#f0e6e0] transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg text-white text-sm font-semibold bg-[#0d2678] hover:bg-[#0d2678]/90 active:scale-[0.98] transition-all duration-200 shadow-md disabled:opacity-60 group"
            >
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight size={16} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-[#eae1db]" />
            <span className="text-[11px] font-bold text-[#757683] uppercase tracking-[0.08em]">or continue with</span>
            <div className="flex-1 h-px bg-[#eae1db]" />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-transparent border border-[#c5c5d3] text-[13px] font-semibold text-[#1f1b17] hover:bg-white/80 transition-all duration-150"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-transparent border border-[#c5c5d3] text-[13px] font-semibold text-[#1f1b17] hover:bg-white/80 transition-all duration-150"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d2678" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
              SSO
            </button>
          </div>
        </section>

        <footer className="mt-8 text-center">
          <p className="text-sm text-[#454651]">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="font-bold text-[#0d2678] hover:underline underline-offset-4 ml-0.5"
            >
              Sign up
            </button>
          </p>
        </footer>
      </div>

      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0d2678]/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#0061a2]/8 blur-[100px] rounded-full -z-10 pointer-events-none" />
    </div>
  );
}
