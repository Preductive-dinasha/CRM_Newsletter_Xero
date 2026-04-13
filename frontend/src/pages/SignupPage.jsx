import { useState } from "react";
import { register } from "../api/auth";

const RULES = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  { label: "Uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "Number", test: (p) => /\d/.test(p) },
  { label: "Special character", test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p) },
];

function strengthColor(passed) {
  if (passed < 2) return "bg-red-500";
  if (passed < 4) return "bg-amber-500";
  if (passed < 5) return "bg-blue-500";
  return "bg-green-500";
}

function strengthLabel(passed) {
  if (passed === 0) return "";
  if (passed < 2) return "Weak";
  if (passed < 4) return "Fair";
  if (passed < 5) return "Good";
  return "Strong";
}

function strengthLabelColor(passed) {
  if (passed < 2) return "text-red-500";
  if (passed < 4) return "text-amber-500";
  if (passed < 5) return "text-blue-500";
  return "text-green-500";
}

function PasswordStrength({ password }) {
  const passed = RULES.filter((r) => r.test(password)).length;
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {RULES.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < passed ? strengthColor(passed) : "bg-gray-200"}`}
          />
        ))}
      </div>
      <div className="flex justify-between items-start gap-2">
        <p className={`text-xs font-medium ${strengthLabelColor(passed)}`}>
          {strengthLabel(passed)}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 justify-end">
          {RULES.map((r, i) => (
            <span
              key={i}
              className={`text-xs transition-colors ${r.test(password) ? "text-gray-500" : "text-gray-300"}`}
            >
              {r.test(password) ? "✓ " : "· "}{r.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full px-4 py-3 rounded-xl border border-[#e5e7eb] bg-[#fafafa] text-sm text-[#0A222C] outline-none transition-all focus:border-[#308AD8] focus:shadow-[0_0_0_3px_rgba(48,138,216,0.1)]";

export default function SignupPage({ onSignIn }) {
  const [form, setForm] = useState({ f_name: "", l_name: "", email: "", password: "", confirm: "", company: "" });
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
      onSignIn();
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 bg-[#F9F9F9]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-[#308AD8]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#0A222C]">Create your account</h1>
          <p className="text-sm mt-1 text-gray-500">Join Preddi to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1.5 text-[#0A222C]">First name</label>
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
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1.5 text-[#0A222C]">Last name</label>
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

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5 text-[#0A222C]">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className={inputCls}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5 text-[#0A222C]">
              Company{" "}
              <span className="font-normal text-gray-400">(optional)</span>
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

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5 text-[#0A222C]">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className={inputCls}
            />
            <PasswordStrength password={form.password} />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5 text-[#0A222C]">Confirm password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={set("confirm")}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className={`${inputCls} ${form.confirm && form.confirm !== form.password ? "border-red-300" : ""}`}
            />
            {form.confirm && form.confirm !== form.password && (
              <p className="text-xs mt-1 text-red-500">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold bg-[#308AD8] hover:bg-[#2677c4] transition-colors disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="text-center text-sm mt-4 text-gray-500">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSignIn}
              className="font-medium text-[#308AD8] hover:underline"
            >
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
