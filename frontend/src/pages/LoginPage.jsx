import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";

const inputCls =
  "w-full pl-11 pr-4 py-3.5 bg-white/60 border border-[#c5c5d3] rounded-md text-sm text-[#1f1b17] outline-none transition-all duration-200 focus:border-[#0d2678] focus:ring-2 focus:ring-[#0d2678]/15 placeholder:text-[#757683]";

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
      <div className="w-full max-w-[440px] flex flex-col items-center">
        <header className="mb-9 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-lg bg-[#0d2678] flex items-center justify-center mb-4 shadow-lg">
            <MessageSquare size={28} strokeWidth={2.2} className="text-white" />
          </div>
          <h1 className="text-[28px] font-bold text-[#0d2678] leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Welcome to Pai
          </h1>
          <p className="text-sm mt-1.5 text-[#454651]">Sign in to continue</p>
        </header>

        <section className="glass-panel w-full rounded-lg p-9 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3.5 rounded-md text-sm bg-[#ffdad6] text-[#ba1a1a] border border-[#ffdad6]">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#1f1b17] ml-0.5">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#757683]">
                  <Mail size={16} />
                </div>
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
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-0.5">
                <label className="block text-sm font-semibold text-[#1f1b17]">Password</label>
                <button
                  type="button"
                  className="text-xs text-[#0061a2] hover:text-[#0d2678] transition-colors font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#757683]">
                  <Lock size={16} />
                </div>
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
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-md text-white text-sm font-semibold bg-[#0d2678] hover:bg-[#0d2678]/90 active:scale-[0.99] transition-all duration-200 shadow-md disabled:opacity-60 group"
            >
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight size={16} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />}
            </button>
          </form>
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
