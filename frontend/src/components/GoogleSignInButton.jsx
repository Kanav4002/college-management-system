import { useGoogleLogin } from "@react-oauth/google";

function GoogleSignInButton({ onLoginSuccess, onLoginError }) {
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      await onLoginSuccess(tokenResponse);
    },
    onError: () => {
      onLoginError?.();
    },
  });

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      className="flex items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white/90 px-3 py-3 text-slate-700 shadow-sm hover:bg-slate-50"
    >
      <span className="sr-only">Sign in with Google</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        className="h-5 w-5"
      >
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6 1.54 7.38 2.83l5.42-5.42C33.64 4.04 29.27 2 24 2 14.82 2 7.14 7.64 4.24 15.5l6.79 5.27C12.3 14.41 17.62 9.5 24 9.5z"
        />
        <path
          fill="#34A853"
          d="M46.5 24.5c0-1.6-.15-3.13-.43-4.5H24v9h12.65c-.55 2.84-2.23 5.24-4.74 6.86l7.35 5.7C43.9 38.14 46.5 31.9 46.5 24.5z"
        />
        <path
          fill="#4A90E2"
          d="M10.94 28.73A14.5 14.5 0 0 1 9.5 24c0-1.64.28-3.22.78-4.7l-6.79-5.27A21.914 21.914 0 0 0 2 24c0 3.53.84 6.87 2.33 9.84l6.61-5.11z"
        />
        <path
          fill="#FBBC05"
          d="M24 46c5.94 0 10.93-1.96 14.57-5.3l-7.35-5.7C29.51 36.35 26.96 37.5 24 37.5c-6.38 0-11.71-4.91-12.97-11.27l-6.79 5.27C7.14 40.36 14.82 46 24 46z"
        />
      </svg>
    </button>
  );
}

export default GoogleSignInButton;

