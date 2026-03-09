import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import GoogleSignInButton from "../components/GoogleSignInButton";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
    // Student fields
    rollNo: "",
    branch: "",
    // Mentor field
    facultyId: "",
    // Admin field
    adminId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post("/api/auth/register", formData);
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const isStudent = formData.role === "STUDENT";
  const isMentor = formData.role === "MENTOR";
  const isAdmin = formData.role === "ADMIN";
  const hasGoogleOAuth = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden auth-cloud-bg px-4">
      {/* Soft background circles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-white/40 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-sky-200/60 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="mx-auto rounded-3xl border border-white/60 bg-white/70 p-8 shadow-[0_18px_45px_rgba(15,23,42,0.25)] backdrop-blur-2xl">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-white/70 shadow-sm">
            <span className="text-lg">✚</span>
          </div>

          <h2 className="mb-2 text-center text-2xl font-semibold text-slate-900">
            Create your account
          </h2>
          <p className="mb-6 text-center text-sm text-slate-500">
            Sign up with your college email and choose your role to get started.
          </p>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {hasGoogleOAuth && (
            <>
              <div className="mb-4 flex items-center gap-3 text-xs text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                <span>Or sign up with</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="mb-6 flex justify-center">
                <GoogleSignInButton
                  onLoginSuccess={async (tokenResponse) => {
                    try {
                      setError("");
                      const profileRes = await axios.get(
                        "https://www.googleapis.com/oauth2/v3/userinfo",
                        {
                          headers: {
                            Authorization: `Bearer ${tokenResponse.access_token}`,
                          },
                        }
                      );

                      const { email, name } = profileRes.data || {};

                      setFormData((prev) => ({
                        ...prev,
                        email: email || prev.email,
                        name: name || prev.name,
                      }));
                    } catch (err) {
                      setError(
                        "Could not fetch Google profile. Please fill your details manually."
                      );
                    }
                  }}
                  onLoginError={() =>
                    setError("Google sign-up failed. Please try again.")
                  }
                />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            {/* Full name */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-slate-600">
                Full Name
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 shadow-sm focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300">
                <span className="text-slate-400">👤</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5 md:col-span-2">
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
                  placeholder="you@example.com"
                  className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-slate-600">
                Password
              </label>
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

            {/* Role */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-slate-600">
                Role
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 shadow-sm focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300">
                <span className="text-slate-400">🎓</span>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none"
                >
                  <option value="STUDENT">Student</option>
                  <option value="MENTOR">Mentor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            {/* Student-specific fields */}
            {isStudent && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">
                    Roll No
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 shadow-sm focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300">
                    <span className="text-slate-400">#</span>
                    <input
                      type="text"
                      name="rollNo"
                      value={formData.rollNo}
                      onChange={handleChange}
                      required={isStudent}
                      placeholder="e.g. 2024CS001"
                      className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">
                    Branch
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 shadow-sm focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300">
                    <span className="text-slate-400">🏫</span>
                    <input
                      type="text"
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      required={isStudent}
                      placeholder="e.g. Computer Science"
                      className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Mentor-specific field */}
            {isMentor && (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-slate-600">
                  Faculty ID
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 shadow-sm focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300">
                  <span className="text-slate-400">🧑‍🏫</span>
                  <input
                    type="text"
                    name="facultyId"
                    value={formData.facultyId}
                    onChange={handleChange}
                    required={isMentor}
                    placeholder="e.g. FAC001"
                    className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Admin-specific field */}
            {isAdmin && (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-slate-600">
                  Admin ID
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 shadow-sm focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300">
                  <span className="text-slate-400">⭐</span>
                  <input
                    type="text"
                    name="adminId"
                    value={formData.adminId}
                    onChange={handleChange}
                    required={isAdmin}
                    placeholder="e.g. ADM001"
                    className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Primary button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-slate-800 hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
