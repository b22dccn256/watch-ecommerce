# Security Architecture Manual

This manual details the security mechanisms, headers, and protection layers implemented within the Luxury Watch E-Commerce application to ensure production-grade security and defend against vulnerabilities.

---

## 🛡️ Implemented Security Controls

### 1. HTTP Headers & HSTS (Helmet)
We use the **Helmet** middleware to configure security headers that protect against clickjacking, MIME-type sniffing, cross-site scripting (XSS), and session hijacking.
- **X-Frame-Options**: Configured to `SAMEORIGIN` to prevent clickjacking in framing containers.
- **X-Content-Type-Options**: Set to `nosniff` to enforce correct MIME content types.
- **HSTS (HTTP Strict Transport Security)**: In production environments, Helmet enforces HTTPS browsing with a `max-age` of `31,536,000` seconds (1 year) across all subdomains and supports preloading:
```javascript
app.use(helmet({
  hsts: process.env.NODE_ENV === "production"
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false
}));
```

### 2. HTTPS Enforcement Routing
The backend automatically redirects cleartext HTTP requests to secure HTTPS endpoints in production environments:
```javascript
export const forceHttps = (req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
};
```

### 3. API Throttling & Rate Limiting
To defend against automated scans, brute-force credentials attacks, and Denial of Service (DoS):
- **Authentication Routes (`/api/auth/*`)**: Restricted to a maximum of `30 requests per 15 minutes` per IP.
- **General API Routes (`/api/*`)**: Restricted to `300 requests per 15 minutes` in production environments (increased to 10,000 requests in local development).

### 4. CSRF Protection (Double-Submit Cookie)
Mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) are strictly validated against CSRF vulnerabilities using a cookie-based custom verification layer:
- Safe routes (`GET`, webhooks, payment providers IPNs) are exempt.
- Valid requests must match the secure, HttpOnly, SameSite-secured `csrfToken` cookie against the value provided in the client's custom request header: `x-csrf-token`.
- CSRF tokens are retrieved client-side via `GET /api/csrf-token`.

### 5. Deep Input Sanitization
All request parameters (`req.body`, `req.query`, `req.params`) are deeply parsed and cleaned before business execution:
- Removes dangerous **Null Bytes** (`\0`) to avoid path traversal tricks.
- Recursively trims all string variables to clean whitespace.
- Prevents Prototype Pollution attacks by sanitizing payload structures.

### 6. Strict Output Response Sanitization & Log Masking
To prevent the accidental leakage of sensitive credentials:
- **API Responses**: A custom Express interception middleware (`responseSanitizationMiddleware`) scans outgoing JSON bodies and dynamically strips out sensitive key fields like `password`, `accessToken`, `refreshToken`, `stripeSessionId`, `otp`, `secret`, and credit card values.
- **System Logs**: Interceptor log wrappers (`attachSafeRequestLog`) parse requests and redact credentials and parameters in the console and audit logs.

### 7. Strong Hashing Policies
- User passwords are encrypted using **bcryptjs** with a cost factor of **12 salt rounds** (representing an increase from 10 to protect against brute-force off-line calculation).
- Signup password validation requires a strong pattern: at least 8 characters containing an uppercase, lowercase, number, and special character.

### 8. JWT Secret Rotation
The token verification routine supports an atomic multi-secret rotation strategy:
- Validates the token against the active `ACCESS_TOKEN_SECRET`.
- If verification fails (e.g. during secret migration), it falls back to verify against `ACCESS_TOKEN_SECRET_PREVIOUS` before rejecting, ensuring smooth, Zero-Downtime credential rotations.
- Token generation is associated with versioned indicators.
