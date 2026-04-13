import { useState } from "react";
import { register } from "../api/auth";

const RULES = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  { label: "Uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "Number", test: (p) => /\d/.test(p) },
  { label: "Special character", test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p) },
];

function PasswordStrength({ password }) {
  const passed = RULES.filter((r) => r.test(password)).length;
  const pct = password.length === 0 ? 0 : passed / RULES.length;
  const color =
    pct < 0.4 ? "#ef4444" : pct < 0.7 ? "#f59e0b" : pct < 1 ? "#3b82f6" : "#22c55e";
  const label =
    pct === 0 ? "" : pct < 0.4 ? "Weak" : pct < 0.7 ? "Fair" : pct < 1 ? "Good" : "Strong";

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {RULES.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < passed ? color : "#e5e7eb" }}
          />
        ))}
      </div>
      <div className="flex justify-between items-start gap-2">
        <p className="text-xs font-medium" style={{ color }}>{label}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 justify-end">
          {RULES.map((r, i) => (
            <span
              key={i}
              className="text-xs transition-colors"
              style={{ color: r.test(password) ? "#6b7280" : "#d1d5db" }}
            >
              {r.test(password) ? "✓ " : "· "}{r.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SignupPage({ onSignIn }) {
  const [form, setForm] = useState({ f_name: "", l_name: "", email: "", password: "", confirm: "", company: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.f_name.trim() || !form.l_name.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    const allRulesPassed = RULES.every((r) => r.test(form.password));
    if (!allRulesPassed) {
      setError("Password does not meet strength requirements.");
      return;
    }

    setLoading(true);
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        f_name: form.f_name.trim(),
        l_name: form.l_name.trim(),
        company: form.company.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all";
  const inputStyle = { borderColor: "#e5e7eb", color: "#0A222C", background: "#fafafa" };
  const focusStyle = { borderColor: "#308AD8", boxShadow: "0 0 0 3px rgba(48,138,216,0.1)" };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F9F9F9" }}>
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: "#22c55e" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#0A222C" }}>Account created!</h2>
          <p className="text-sm mb-6" style={{ color: "#6b7280" }}>You can now sign in with your new account.</p>
          <button
            onClick={onSignIn}
            className="px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all"
            style={{ background: "#308AD8" }}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8" style={{ background: "#F9F9F9" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "#308AD8" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#0A222C" }}>Create your account</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Join Preddi to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#0A222C" }}>First name</label>
              <input
                type="text"
                value={form.f_name}
                onChange={set("f_name")}
                placeholder="Jane"
                required
                className={inputClass}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#0A222C" }}>Last name</label>
              <input
                type="text"
                value={form.l_name}
                onChange={set("l_name")}
                placeholder="Smith"
                required
                className={inputClass}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#0A222C" }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="you@example.com"
              required
              className={inputClass}
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, focusStyle)}
              onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#0A222C" }}>Company <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
            <input
              type="text"
              value={form.company}
              onChange={set("company")}
              placeholder="Acme Corp"
              className={inputClass}
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, focusStyle)}
              onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#0A222C" }}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder="••••••••"
              required
              className={inputClass}
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, focusStyle)}
              onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
            />
            <PasswordStrength password={form.password} />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#0A222C" }}>Confirm password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={set("confirm")}
              placeholder="••••••••"
              required
              className={inputClass}
              style={{
                ...inputStyle,
                borderColor: form.confirm && form.confirm !== form.password ? "#fca5a5" : "#e5e7eb",
              }}
              onFocus={(e) => Object.assign(e.target.style, focusStyle)}
              onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
            />
            {form.confirm && form.confirm !== form.password && (
              <p className="text-xs mt-1" style={{ color: "#ef4444" }}>Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
            style={{ background: "#308AD8" }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="text-center text-sm mt-4" style={{ color: "#6b7280" }}>
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSignIn}
              className="font-medium hover:underline"
              style={{ color: "#308AD8" }}
            >
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
