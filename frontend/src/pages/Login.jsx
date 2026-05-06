import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";
import api, { getApiErrorMessage } from "../api/api";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const hasGoogleOAuth = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", formData);
      login(res.data);
      navigate("/dashboard");
    } catch (err) {
      setError(getApiErrorMessage(err, "Login failed. Please try again."));
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
          {/* Navigate to Register */}
          <Link
            to="/register"
            title="Go to Register"
            className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-white/70 shadow-md hover:shadow-lg hover:bg-white/90 transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </Link>

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
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-slate-400 hover:text-slate-600 transition focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    /* Eye-off icon */
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a11.72 11.72 0 013.168-4.477M6.343 6.343A9.97 9.97 0 0112 5c5 0 9.27 3.11 11 7.5a11.72 11.72 0 01-4.168 4.477M6.343 6.343L3 3m3.343 3.343l2.829 2.829m4.243 4.243l2.829 2.829M6.343 6.343l11.314 11.314M14.121 14.121A3 3 0 009.879 9.879" />
                    </svg>
                  ) : (
                    /* Eye icon */
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
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

          {/* Divider — only show if Google OAuth is available */}
          {hasGoogleOAuth && (
            <>
              <div className="mt-6 flex items-center gap-3 text-xs text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                <span>Or sign in with</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Google sign-in only */}
              <div className="mt-4 flex justify-center">
                <GoogleSignInButton
                  onLoginSuccess={async (tokenResponse) => {
                    try {
                      setError("");
                      const accessToken = tokenResponse?.access_token;
                      if (!accessToken) {
                        throw new Error("Google did not return an access token.");
                      }

                      const res = await api.post("/auth/oauth/google", {
                        accessToken,
                      });

                      // Backend returns either a real login (token + role)
                      // or { needsRegistration, email, name, registrationToken }
                      // when the Google account is new to our system.
                      if (res.data?.needsRegistration) {
                        navigate("/register", {
                          state: {
                            googleProfile: {
                              email: res.data.email,
                              name: res.data.name,
                              registrationToken: res.data.registrationToken,
                            },
                          },
                        });
                        return;
                      }

                      login(res.data);
                      navigate("/dashboard");
                    } catch (err) {
                      setError(
                        getApiErrorMessage(
                          err,
                          "Google sign-in failed. Please try again."
                        )
                      );
                    }
                  }}
                  onLoginError={() => {
                    setError("Google sign-in failed. Please try again.");
                  }}
                />
              </div>
            </>
          )}

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
