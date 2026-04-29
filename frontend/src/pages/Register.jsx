import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // If we arrived here from a Google sign-in that found no matching account,
  // the Login page passes { email, name, registrationToken } via router state.
  // We pre-fill + lock the email/name and skip the password field. As a
  // fallback (handy for local manual QA) we also accept the same payload via
  // ?googleEmail=&googleName=&googleTicket= URL params.
  const initialGoogleProfile = (() => {
    if (location.state?.googleProfile) return location.state.googleProfile;
    const params = new URLSearchParams(location.search);
    const ticket = params.get("googleTicket");
    if (!ticket) return null;
    return {
      email: params.get("googleEmail") || "",
      name: params.get("googleName") || "",
      registrationToken: ticket,
    };
  })();

  const [googleProfile, setGoogleProfile] = useState(initialGoogleProfile);
  const [formData, setFormData] = useState({
    name: initialGoogleProfile?.name || "",
    email: initialGoogleProfile?.email || "",
    password: "",
    role: "STUDENT",
    rollNo: "",
    branch: "",
    facultyId: "",
    adminId: "",
    groupId: "",
  });
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isGoogleSignup = Boolean(googleProfile?.registrationToken);

  useEffect(() => {
    axios.get("/api/groups")
      .then((res) => setGroups(res.data))
      .catch(() => {});
  }, []);

  // Clear the router state / URL params so a hard refresh doesn't keep the
  // locked fields around forever — but only after we've captured them into
  // our own state.
  useEffect(() => {
    if (initialGoogleProfile) {
      window.history.replaceState({}, document.title, "/register");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        groupId: formData.groupId || null,
      };
      // Strip password for Google signups — backend will generate one.
      if (isGoogleSignup) {
        payload.registrationToken = googleProfile.registrationToken;
        delete payload.password;
      }
      await axios.post("/api/auth/register", payload);
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
          {/* Navigate to Login */}
          <Link
            to="/login"
            title="Go to Login"
            className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-white/70 shadow-md hover:shadow-lg hover:bg-white/90 transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </Link>

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

          {isGoogleSignup && (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Signed in with Google as <strong>{googleProfile.email}</strong>.
              Pick your role and fill in the role-specific details to finish
              creating your account.
            </div>
          )}

          {hasGoogleOAuth && !isGoogleSignup && (
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
                      const res = await axios.post("/api/auth/oauth/google", {
                        accessToken: tokenResponse.access_token,
                      });

                      // Existing account → just log them in.
                      if (!res.data?.needsRegistration) {
                        login(res.data);
                        navigate("/dashboard");
                        return;
                      }

                      // New account → pre-fill + lock name/email, switch
                      // form into "Google signup" mode.
                      setGoogleProfile({
                        email: res.data.email,
                        name: res.data.name,
                        registrationToken: res.data.registrationToken,
                      });
                      setFormData((prev) => ({
                        ...prev,
                        email: res.data.email || prev.email,
                        name: res.data.name || prev.name,
                        password: "",
                      }));
                    } catch (err) {
                      setError(
                        err.response?.data?.message ||
                          err.response?.data ||
                          "Google sign-up failed. Please try again."
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
              <label className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span>Full Name</span>
                {isGoogleSignup && (
                  <span className="text-[10px] uppercase tracking-wide text-emerald-600">
                    From Google
                  </span>
                )}
              </label>
              <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 shadow-sm focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300 ${isGoogleSignup ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white/80"}`}>
                <span className="text-slate-400">👤</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  readOnly={isGoogleSignup}
                  placeholder="Name"
                  className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 read-only:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span>Email</span>
                {isGoogleSignup && (
                  <span className="text-[10px] uppercase tracking-wide text-emerald-600">
                    Verified by Google
                  </span>
                )}
              </label>
              <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 shadow-sm focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300 ${isGoogleSignup ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white/80"}`}>
                <span className="text-slate-400">✉️</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  readOnly={isGoogleSignup}
                  placeholder="Email"
                  className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 read-only:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password — hidden when continuing a Google signup */}
            {!isGoogleSignup && (
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-slate-600">
                Password
              </label>
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a11.72 11.72 0 013.168-4.477M6.343 6.343A9.97 9.97 0 0112 5c5 0 9.27 3.11 11 7.5a11.72 11.72 0 01-4.168 4.477M6.343 6.343L3 3m3.343 3.343l2.829 2.829m4.243 4.243l2.829 2.829M6.343 6.343l11.314 11.314M14.121 14.121A3 3 0 009.879 9.879" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            )}

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

            {/* Group selection — for Students and Mentors */}
            {(isStudent || isMentor) && groups.length > 0 && (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-slate-600">
                  Group (Class / Batch)
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 shadow-sm focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <select
                    name="groupId"
                    value={formData.groupId}
                    onChange={handleChange}
                    className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none"
                  >
                    <option value="">— Select Group (Optional) —</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}{g.mentorName ? ` (Mentor: ${g.mentorName})` : ""}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

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
                {loading
                  ? "Creating account..."
                  : isGoogleSignup
                    ? "Finish Google Signup"
                    : "Create Account"}
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
