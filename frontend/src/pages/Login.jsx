import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const hasGoogleOAuth = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/api/auth/login", formData);
      // res.data = { token, email, role }
      login(res.data);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden auth-cloud-bg px-4">
      {/* Soft background circles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-white/40 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-sky-200/60 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mx-auto rounded-3xl border border-white/60 bg-white/70 p-8 shadow-[0_18px_45px_rgba(15,23,42,0.25)] backdrop-blur-2xl">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-white/70 shadow-sm">
            <span className="text-lg">⮕</span>
          </div>

          <h2 className="mb-2 text-center text-2xl font-semibold text-slate-900">
            Sign in with email
          </h2>
          <p className="mb-6 text-center text-sm text-slate-500">
            Login to access your dashboard and manage your college workspace.
          </p>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">
                Email
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 shadow-sm focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300">
                <span className="text-slate-400">✉️</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Email"
                  className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span>Password</span>
                <Link
                  to="/forgot-password"
                  className="text-slate-400 hover:text-slate-600"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 shadow-sm focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300">
                <span className="text-slate-400">🔒</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Primary button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Get Started"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            <span>Or sign in with</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Social buttons */}
          <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
            {hasGoogleOAuth ? (
              <GoogleSignInButton
                onLoginSuccess={async (tokenResponse) => {
                  try {
                    setError("");
                    const res = await axios.post("/api/auth/oauth/google", {
                      accessToken: tokenResponse.access_token,
                    });
                    login(res.data);
                    navigate("/dashboard");
                  } catch (err) {
                    setError(
                      err.response?.data?.message ||
                        err.response?.data ||
                        "Google sign-in failed. Please try again."
                    );
                  }
                }}
                onLoginError={() => {
                  setError("Google sign-in failed. Please try again.");
                }}
              />
            ) : (
              <button
                type="button"
                disabled
                title="Set VITE_GOOGLE_CLIENT_ID in frontend/.env and restart the dev server"
                className="flex items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white/70 px-3 py-3 text-slate-400 shadow-sm opacity-70"
              >
                <span className="sr-only">Google sign-in unavailable</span>
                <span className="text-sm font-semibold">G</span>
              </button>
            )}
            <button
              type="button"
              className="flex items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white/90 px-3 py-3 text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <span className="sr-only">Sign in with Facebook</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-5 w-5"
              >
                <path
                  fill="#1877F2"
                  d="M22 12.07C22 6.5 17.52 2 12 2S2 6.5 2 12.07C2 17.1 5.66 21.24 10.44 22v-7.03H7.9v-2.9h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22C18.34 21.24 22 17.1 22 12.07z"
                />
              </svg>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white/90 px-3 py-3 text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <span className="sr-only">Sign in with Apple</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-5 w-5"
              >
                <path
                  fill="#111827"
                  d="M16.38 2c-.97.07-2.14.68-2.83 1.48-.62.7-1.16 1.82-.95 2.9 1.06.03 2.16-.6 2.82-1.4.64-.77 1.14-1.9.96-2.98zM19.9 8.38c-.06-.12-1.52-.91-2.99-.89-.94.01-1.79.35-2.37.35-.6 0-1.52-.34-2.5-.33-1.28.02-2.46.74-3.12 1.89-1.33 2.3-.34 5.68.94 7.54.62.9 1.35 1.9 2.32 1.86.93-.04 1.28-.6 2.4-.6 1.13 0 1.44.6 2.41.58.99-.02 1.61-.9 2.21-1.8.7-1.03.99-2.03 1-2.08-.02-.01-1.93-.74-1.95-2.94-.02-1.84 1.5-2.72 1.57-2.78z"
                />
              </svg>
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-slate-800 hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
