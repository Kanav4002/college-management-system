import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api, { getApiErrorMessage } from "../api/api";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function ResetPassword() {
  const query = useQuery();
  const navigate = useNavigate();
  const token = query.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Reset link is invalid or missing.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        token,
        newPassword: password,
      });
      setMessage(res.data || "Password updated successfully.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Could not reset password. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden auth-cloud-bg px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-white/40 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-sky-200/60 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mx-auto rounded-3xl border border-white/60 bg-white/70 p-8 shadow-[0_18px_45px_rgba(15,23,42,0.25)] backdrop-blur-2xl">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-white/70 shadow-sm">
            <span className="text-lg">🔒</span>
          </div>

          <h2 className="mb-2 text-center text-2xl font-semibold text-slate-900">
            Reset password
          </h2>
          <p className="mb-6 text-center text-sm text-slate-500">
            Choose a new password for your account.
          </p>

          {message && (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">
                New password
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 shadow-sm focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300">
                <span className="text-slate-400">🔑</span>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">
                Confirm password
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 shadow-sm focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300">
                <span className="text-slate-400">✅</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating password..." : "Update password"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Back to{" "}
            <Link
              to="/login"
              className="font-medium text-slate-800 hover:underline"
            >
              login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
