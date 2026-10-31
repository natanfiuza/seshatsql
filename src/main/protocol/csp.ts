/**
 * Content-Security-Policy for production: no inline or remote scripts, no eval,
 * no blob workers. Monaco workers are served from the app:// origin itself.
 *
 * style-src still allows 'unsafe-inline' because Monaco and AG Grid inject
 * stylesheets at runtime; the residual risk is documented in ADR 0015.
 */
export const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'"
].join('; ')

/**
 * Development keeps the same policy and only adds the Vite HMR WebSocket.
 * ws://localhost:* is used by the dev server; production never contains it.
 */
export const DEV_CSP = PRODUCTION_CSP.replace(
  "connect-src 'self'",
  "connect-src 'self' ws://localhost:*"
)
