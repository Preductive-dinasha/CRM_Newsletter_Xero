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
  if (passed < 2) return "bg-gray-300";
  if (passed < 4) return "bg-gray-400";
  if (passed < 5) return "bg-gray-500";
  return "bg-black";
}

function strengthLabel(passed) {
  if (passed === 0) return "";
  if (passed < 2) return "Weak";
  if (passed < 4) return "Fair";
  if (passed < 5) return "Good";
  return "Strong";
}

function strengthLabelColor(passed) {
  if (passed < 2) return "text-gray-500";
  if (passed < 4) return "text-gray-600";
  if (passed < 5) return "text-gray-700";
  return "text-black";
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

const inputCls = "w-full px-4 py-3 rounded-[18px] border border-[#E4E4E7] bg-[#F8F8F8] text-sm text-[#111827] outline-none transition duration-150 ease-out focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)]";

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
    <div className="min-h-screen flex items-center justify-center py-10 bg-[#F8F8F8]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[22px] mb-4 bg-black">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-black">Create your account</h1>
          <p className="text-sm mt-1 text-gray-500">Join Preddi to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[28px] shadow-[0_24px_80px_rgba(15,23,42,0.08)] border border-[#E4E4E7] p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1.5 text-black">First name</label>
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
              <label className="block text-sm font-medium mb-1.5 text-black">Last name</label>
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
            <label className="block text-sm font-medium mb-1.5 text-black">Email</label>
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
            <label className="block text-sm font-medium mb-1.5 text-black">
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
            <label className="block text-sm font-medium mb-1.5 text-black">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <PasswordStrength password={form.password} />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5 text-black">Confirm password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirm}
                onChange={set("confirm")}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className={`${inputCls} ${form.confirm && form.confirm !== form.password ? "border-red-300" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {form.confirm && form.confirm !== form.password && (
              <p className="text-xs mt-1 text-red-500">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold bg-black hover:bg-[#27272A] transition duration-150 ease-out disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="text-center text-sm mt-4 text-gray-500">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-medium text-black hover:underline"
            >
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
