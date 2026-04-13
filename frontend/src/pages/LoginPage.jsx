import { useState } from "react";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F9F9F9" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "#308AD8" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#0A222C" }}>Welcome to Preddi</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#0A222C" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
              style={{
                borderColor: "#e5e7eb",
                color: "#0A222C",
                background: "#fafafa",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#308AD8"; e.target.style.boxShadow = "0 0 0 3px rgba(48,138,216,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#0A222C" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
              style={{
                borderColor: "#e5e7eb",
                color: "#0A222C",
                background: "#fafafa",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#308AD8"; e.target.style.boxShadow = "0 0 0 3px rgba(48,138,216,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
            style={{ background: "#308AD8" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
