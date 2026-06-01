import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api/auth";

const RULES = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  { label: "Uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "Number", test: (p) => /\d/.test(p) },
  { label: "Special character", test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p) },
];

function strengthColor(passed) {
  if (passed < 2) return "bg-[#c5c5d3]";
  if (passed < 4) return "bg-[#0061a2]";
  if (passed < 5) return "bg-[#0d2678]";
  return "bg-[#0d2678]";
}

function strengthLabel(passed) {
  if (passed === 0) return "";
  if (passed < 2) return "Weak";
  if (passed < 4) return "Fair";
  if (passed < 5) return "Good";
  return "Strong";
}

function strengthLabelColor(passed) {
  if (passed < 2) return "text-[#757683]";
  if (passed < 4) return "text-[#0061a2]";
  if (passed < 5) return "text-[#0d2678]";
  return "text-[#0d2678]";
}

function PasswordStrength({ password }) {
  const passed = RULES.filter((r) => r.test(password)).length;
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {RULES.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < passed ? strengthColor(passed) : "bg-[#eae1db]"}`}
          />
        ))}
      </div>
      <div className="flex justify-between items-start gap-2">
        <p className={`text-xs font-semibold ${strengthLabelColor(passed)}`}>
          {strengthLabel(passed)}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 justify-end">
          {RULES.map((r, i) => (
            <span
              key={i}
              className={`text-xs transition-colors ${r.test(password) ? "text-[#454651]" : "text-[#c5c5d3]"}`}
            >
              {r.test(password) ? "✓ " : "· "}{r.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-4 py-3 bg-white/60 border border-[#c5c5d3] rounded-lg text-sm text-[#1f1b17] outline-none transition-all duration-200 focus:border-[#0d2678] focus:ring-2 focus:ring-[#0d2678]/15 placeholder:text-[#757683]";

function ChatIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function EyeIcon({ off }) {
  if (off) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ f_name: "", l_name: "", email: "", password: "", confirm: "", company: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-10"
      style={{
        backgroundColor: "#fff8f5",
        backgroundImage:
          "radial-gradient(at 0% 0%, rgba(13,38,120,0.06) 0px, transparent 55%), radial-gradient(at 100% 100%, rgba(0,97,162,0.06) 0px, transparent 55%)",
      }}
    >
      <div className="w-full max-w-[420px] flex flex-col items-center">
        <header className="mb-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0d2678] flex items-center justify-center mb-4 shadow-lg">
            <ChatIcon />
          </div>
          <h1 className="text-[28px] font-bold text-[#0d2678] leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Create your account
          </h1>
          <p className="text-sm mt-1 text-[#454651]">Join Pai to get started</p>
        </header>

        <section className="glass-panel w-full rounded-xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm bg-[#ffdad6] text-[#ba1a1a] border border-[#ffdad6]">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="block text-sm font-semibold text-[#1f1b17] ml-0.5">First name</label>
                <input
                  type="text"
                  value={form.f_name}
                  onChange={set("f_name")}
                  placeholder="Jane"
                  required
                  autoComplete="given-name"
                  className={inputCls}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="block text-sm font-semibold text-[#1f1b17] ml-0.5">Last name</label>
                <input
                  type="text"
                  value={form.l_name}
                  onChange={set("l_name")}
                  placeholder="Smith"
                  required
                  autoComplete="family-name"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[#1f1b17] ml-0.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className={inputCls}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[#1f1b17] ml-0.5">
                Company{" "}
                <span className="font-normal text-[#757683]">(optional)</span>
              </label>
              <input
                type="text"
                value={form.company}
                onChange={set("company")}
                placeholder="Acme Corp"
                autoComplete="organization"
                className={inputCls}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[#1f1b17] ml-0.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#757683] hover:text-[#1f1b17] transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[#1f1b17] ml-0.5">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={form.confirm}
                  onChange={set("confirm")}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className={`${inputCls} pr-11 ${form.confirm && form.confirm !== form.password ? "border-[#ba1a1a] focus:ring-[#ba1a1a]/15" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#757683] hover:text-[#1f1b17] transition-colors"
                  title={showConfirm ? "Hide password" : "Show password"}
                >
                  <EyeIcon off={showConfirm} />
                </button>
              </div>
              {form.confirm && form.confirm !== form.password && (
                <p className="text-xs mt-1 text-[#ba1a1a]">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg text-white text-sm font-semibold bg-[#0d2678] hover:bg-[#0d2678]/90 active:scale-[0.98] transition-all duration-200 shadow-md disabled:opacity-60 group mt-2"
            >
              {loading ? "Creating account…" : "Create account"}
              {!loading && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              )}
            </button>
          </form>
        </section>

        <footer className="mt-7 text-center">
          <p className="text-sm text-[#454651]">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-bold text-[#0d2678] hover:underline underline-offset-4 ml-0.5"
            >
              Sign in
            </button>
          </p>
        </footer>
      </div>

      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0d2678]/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#0061a2]/8 blur-[100px] rounded-full -z-10 pointer-events-none" />
    </div>
  );
}
