import { useState } from "react";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";

const inputCls = "w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-[#fafafa] text-sm text-[#0A222C] outline-none transition-all focus:border-[#308AD8] focus:shadow-[0_0_0_3px_rgba(48,138,216,0.1)]";

export default function LoginPage({ onSignUp }) {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-[#308AD8]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#0A222C]">Welcome to Preddi</h1>
          <p className="text-sm mt-1 text-gray-500">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5 text-[#0A222C]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className={inputCls}
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium mb-1.5 text-[#0A222C]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className={inputCls}
            />
          </div>

          <div className="flex justify-end mb-6">
            <button
              type="button"
              className="text-xs text-[#308AD8] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold bg-[#308AD8] hover:bg-[#2677c4] transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-center text-sm mt-4 text-gray-500">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onSignUp}
              className="font-medium text-[#308AD8] hover:underline"
            >
              Sign up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
