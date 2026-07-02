export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-display text-2xl font-semibold tracking-tight mb-2">
            WeatherGuard
          </h1>
          <p className="text-sm text-muted">
            Sign in to request access to the alert network.
          </p>
        </div>

        <div className="bg-panel border border-border rounded-lg p-6 space-y-3">
          <a
            href={`${import.meta.env.VITE_API_URL}/auth/google`}
            className="flex items-center justify-center gap-3 w-full rounded-md border border-border bg-bg py-2.5 text-sm font-medium hover:border-cyan/40 hover:text-cyan transition-colors"
          >
            <GoogleIcon />
            Continue with Google
          </a>
          <a
            href={`${import.meta.env.VITE_API_URL}/auth/github`}
            className="flex items-center justify-center gap-3 w-full rounded-md border border-border bg-bg py-2.5 text-sm font-medium hover:border-cyan/40 hover:text-cyan transition-colors"
          >
            <GithubIcon />
            Continue with GitHub
          </a>
        </div>

        <p className="text-xs text-muted text-center mt-6">
          Access is invite-only. An admin reviews every request before alerts
          are enabled.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        fill="#fbbf24"
        d="M21.35 11.1h-9.17v2.95h5.27c-.23 1.46-1.7 4.28-5.27 4.28-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.81 0 3.02.77 3.71 1.43l2.53-2.44C16.84 3.6 14.83 2.7 12.18 2.7 7.1 2.7 3 6.8 3 11.86s4.1 9.16 9.18 9.16c5.3 0 8.82-3.72 8.82-8.96 0-.6-.07-1.06-.15-1.96z"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#e2e8f0">
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.88-2.78.62-3.37-1.2-3.37-1.2-.45-1.18-1.11-1.5-1.11-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.55 2.33 1.1 2.9.84.09-.66.34-1.1.62-1.36-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .85-.28 2.78 1.05a9.4 9.4 0 0 1 5.06 0c1.93-1.33 2.78-1.05 2.78-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.79-4.58 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}
