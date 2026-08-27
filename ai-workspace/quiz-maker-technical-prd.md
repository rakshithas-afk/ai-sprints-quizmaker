Date created: 2026-08-24
Date last modified: 2026-08-25 (Sprint 0 authentication implemented and deployed)

# Quiz Maker — Technical PRD (Sprint 0: Authentication)

---

## Project Overview

Quiz Maker is a web application that will allow users to create quizzes, manage quizzes, attempt quizzes, and view their results. The long-term product serves educators, students, and administrators who need a centralized platform for quiz-based learning and assessment.

Quiz Maker is a web application deployed on Cloudflare Workers. **Sprint 0 authentication is implemented and live.** Users can register, sign in, maintain a JWT session, access a protected dashboard, and sign out. Quiz creation, attempts, and results are not yet built.

This Technical PRD defines the **authentication module** — the foundation that all future Quiz Maker features will depend on. It records both the original requirements and the current implemented state as of 2026-08-25.

**Production URL:** https://ai-sprints-quizmaker.rakshitha-quizmaker-rs.workers.dev

---

## Business Goal

We believe that providing a secure, reliable, and easy-to-use authentication experience will enable users to safely access Quiz Maker and establish the trust required for future features such as quiz creation, quiz attempts, and result tracking.

The business value of Sprint 0 is not feature delivery for quizzes themselves, but **establishing identity and access control** so that:

- Each user has a unique account tied to their activity.
- Only authenticated users can reach application areas that require a logged-in identity.
- User credentials and sessions are handled according to industry security standards.
- Future sprints can build quiz features on a stable authentication foundation.

---

## Sprint Goal

**Sprint 0** delivered the authentication module end-to-end. Requirements were defined in the initial PRD; implementation and deployment were completed on 2026-08-25.

This sprint covers:

- User Sign Up ✅
- User Sign In ✅
- Sign Out ✅
- JWT-based session management (encrypted JWT in HttpOnly cookie) ✅
- Protected Routes ✅
- Basic authentication flow ✅

Quiz features remain out of scope and are planned for future sprints.

---

## User Flow

### New user (registration)

1. User opens the Sign Up page (`/signup`).
2. User enters Full Name, Email Address, Password, and Confirm Password.
3. User submits the form.
4. System validates all fields.
5. If validation fails, errors are shown on the form; the user corrects input and resubmits.
6. If the email is already registered, the system shows an appropriate error.
7. On successful registration, the system confirms success and redirects the user to the **Sign In** page (`/signin`).
8. User signs in with their new credentials.

### Returning user (sign in)

1. User opens the Sign In page (`/signin`).
2. User enters Email and Password.
3. User submits the form.
4. System validates input and verifies credentials.
5. If credentials are invalid, a meaningful error message is displayed.
6. On successful sign in, the system issues an encrypted JWT stored in an HttpOnly cookie and redirects the user to the **Dashboard** with a welcome message.
7. User remains signed in across page navigation and browser refresh until they log out or the JWT expires (**15 minutes** from sign in).

### Authenticated user (session and logout)

1. Signed-in user navigates to protected pages (e.g., `/dashboard`).
2. User can access protected content without re-entering credentials while the JWT is valid (within 15 minutes of sign in).
3. User selects **Sign Out** on the Dashboard.
4. System clears the JWT cookie (via Server Action).
5. User is redirected to `/signin?signedOut=1` with an empty sign-in form (autofill disabled).
6. Attempting to access a protected page with an expired or invalid JWT redirects to `/signin` (cookie is not modified during page render; stale cookies are ignored until sign-out).

### Unauthenticated user (protected route access)

1. User attempts to open a protected page without a valid JWT cookie.
2. System verifies the JWT on the request; if missing, expired, or invalid, access is denied.
3. User is redirected to `/signin`.
4. After successful sign in, the user is redirected to `/dashboard` (default).

---

## User Stories

### Sign Up

| ID | Story | Priority |
|----|-------|----------|
| US-01 | As a new user, I want to create an account with my full name, email, and password so that I can access Quiz Maker. | Must have |
| US-02 | As a new user, I want to see clear validation errors when my input is invalid so that I can fix mistakes before submitting. | Must have |
| US-03 | As a new user, I want to be notified if my email is already registered so that I know to sign in instead. | Must have |
| US-04 | As a new user, I want to be redirected to the Sign In page after successful registration so that I can log in with my new account. | Must have |

### Sign In

| ID | Story | Priority |
|----|-------|----------|
| US-05 | As a registered user, I want to sign in with my email and password so that I can access my account. | Must have |
| US-06 | As a registered user, I want to see a meaningful error when my credentials are wrong so that I know sign in failed. | Must have |
| US-07 | As a signed-in user, I want to stay logged in for up to 15 minutes so that I can use the app without re-entering credentials on every page. | Must have |
| US-08 | As a signed-in user, I want to be redirected to the Dashboard with a welcome message after login so that I know I am signed in. | Must have |

### Logout and session

| ID | Story | Priority |
|----|-------|----------|
| US-09 | As a signed-in user, I want to sign out so that my JWT session ends on shared or public devices. | Must have |
| US-10 | As a signed-in user, I want to be redirected to `/signin` after sign out so that I have a clear next step. | Must have |

### Protected routes

| ID | Story | Priority |
|----|-------|----------|
| US-11 | As a signed-in user, I want to access protected pages such as the Dashboard without being asked to sign in again. | Must have |
| US-12 | As an unauthenticated user, I want to be redirected to Sign In when I try to access a protected page so that I can authenticate first. | Must have |

---

## Functional Requirements

### FR-01: User registration (Sign Up)

The system shall allow a new user to register an account using:

- Full Name
- Email Address
- Password
- Confirm Password

All fields are required. Upon successful registration, the user shall be redirected to `/signin`. The system shall not automatically sign the user in or issue a JWT after registration.

### FR-02: User authentication (Sign In)

The system shall allow a registered user to sign in using:

- Email Address
- Password

Upon successful authentication, the system shall issue an encrypted JWT in an HttpOnly cookie and redirect the user to `/dashboard` with a welcome message displaying the user's full name.

### FR-03: JWT session management

The system shall maintain authenticated state using a **stateless encrypted JWT** stored in an HttpOnly cookie. There is **no server-side session store** and **no refresh token**.

| Setting | Value |
|---------|-------|
| JWT expiration | **15 minutes** (fixed, from sign-in time) |
| Cookie expiration | **15 minutes** (same as JWT) |
| Refresh token | **None** |
| Remember me | **Not supported** |
| Expiry type | **Fixed** — does not extend on user activity |

The JWT shall persist across page navigation and full page reloads within the 15-minute window. After expiry, the user must sign in again.

### FR-04: Sign Out

The system shall provide a **Sign Out** action on the Dashboard that:

- Clears the JWT cookie completely.
- Redirects the user to `/signin`.

After sign out, the user shall not be able to access protected pages without signing in again. No server-side JWT revocation list is required for this sprint (cookie removal is sufficient).

### FR-05: Protected routes

The system shall restrict access to protected pages so that only users with a **valid, non-expired JWT** can view them.

Protected pages for this sprint include at minimum:

- **`/dashboard`** — authenticated landing page with welcome message, Sign Out button, and placeholder text for future quiz features.

**On every protected request**, the system shall:

1. Read the JWT from the HttpOnly cookie.
2. Verify and decrypt the JWT.
3. If valid and not expired → allow access.
4. If missing, expired, or invalid → redirect to `/signin`.

Unauthenticated or expired users attempting to access any protected page shall be redirected to `/signin`.

### FR-06: Input validation

The system shall validate all Sign Up and Sign In inputs on the server before processing. Client-side validation may supplement server validation but shall not replace it.

### FR-07: Error handling

The system shall display clear, user-friendly error messages for validation failures, duplicate email registration, and invalid login credentials without exposing sensitive system details.

### FR-08: Success feedback

The system shall provide appropriate success feedback or navigation after successful registration and sign in, as defined in the UI Requirements section.

---

## Non-Functional Requirements

### Security

- Passwords must never be stored in plain text.
- Passwords must be hashed using an industry-standard, server-side algorithm designed specifically for password storage (e.g., Argon2id or bcrypt). General-purpose hashes such as SHA-256 must not be used for password storage.
- Passwords and password hashes must never be logged or returned in application responses.
- The JWT must be stored in an **HttpOnly, Secure, SameSite=Lax** cookie and must **not** be accessible to client-side JavaScript (`document.cookie`, `sessionStorage`, or `localStorage`).
- The JWT must be **encrypted** (JWE — JSON Web Encryption), not merely signed, so token payload is not readable if intercepted.
- JWT and cookie expiration must both be **15 minutes**, fixed from sign-in time.
- No refresh token and no "Remember me" functionality.
- Invalid login attempts must not reveal whether an email address is registered (use a generic error message such as "Invalid email or password").
- All authentication communication must occur over HTTPS in production.
- On logout or JWT expiry, the cookie must be cleared immediately.

### Performance

- Sign Up and Sign In form submission should provide user feedback (loading state) within one interaction cycle.
- Authentication operations should complete within a reasonable time under normal load (target: under 3 seconds for sign in under typical conditions; exact thresholds to be validated during implementation).
- JWT verification for protected routes should not noticeably delay page rendering.

### Scalability

- Authentication design should support growth in user volume without requiring a fundamental redesign.
- Stateless JWT authentication (no server-side session store) is compatible with a serverless/edge deployment model (Cloudflare Workers).

### Accessibility

- Sign Up and Sign In forms must be usable with keyboard navigation only.
- Form fields must have associated labels readable by screen readers.
- Error messages must be announced to assistive technologies (e.g., via appropriate ARIA roles or live regions).
- Color must not be the only means of conveying error state.
- Focus order must follow a logical sequence through form fields and actions.

### Responsive design

- Sign Up, Sign In, and Dashboard placeholder pages must render correctly on desktop, tablet, and mobile screen sizes.
- Form layouts must remain usable on viewports from 320px width upward.
- Touch targets for buttons and links must meet minimum size guidelines for mobile usability.

### Maintainability

- Authentication logic should be organized so that validation rules, session handling, and credential verification can be updated independently.
- Error messages and validation rules should be defined in a single, consistent manner to avoid duplication and drift.
- The authentication module should be documented so future developers and AI agents can extend it without re-reading the entire codebase.

### Clean architecture

- Separation of concerns: presentation (pages/forms), application logic (authentication and JWT operations), and persistence (user storage) should be clearly distinguished during implementation.
- Business rules (validation, session policy) must not be duplicated across unrelated layers.
- The authentication module should expose clear boundaries so future quiz features do not embed auth logic directly in unrelated features.

---

## UI Requirements

### Sign Up page (`/signup`)

**Purpose:** Allow new users to create an account.

**Input fields**

| Field | Control type | Required |
|-------|--------------|----------|
| Full Name | Text input | Yes |
| Email Address | Email input | Yes |
| Password | Password input (masked) | Yes |
| Confirm Password | Password input (masked) | Yes |

**Actions**

- Primary: Submit / Sign Up
- Secondary: Link to `/signin` (e.g., "Already have an account? Sign In")

**Layout expectations**

- Form centered or clearly grouped on the page.
- Page title indicating registration (e.g., "Sign Up" or "Create Account").
- Visible loading or disabled state on the submit button while registration is processing.

---

### Sign In page (`/signin`)

**Purpose:** Allow registered users to authenticate.

**Input fields**

| Field | Control type | Required |
|-------|--------------|----------|
| Email Address | Email input | Yes |
| Password | Password input (masked) | Yes |

**Actions**

- Primary: Submit / Sign In
- Secondary: Link to `/signup` (e.g., "Don't have an account? Sign Up")

**Layout expectations**

- Form centered or clearly grouped on the page.
- Page title indicating sign in (e.g., "Sign In" or "Log In").
- Visible loading or disabled state on the submit button while authentication is processing.

---

### Dashboard (`/dashboard`) — protected

**Purpose:** Landing page for authenticated users until quiz features are implemented.

**Content (required)**

- **Welcome message** displaying the user's full name (e.g., "Welcome, Jane Smith!").
- Statement that quiz creation, management, attempts, and reports will be available in future sprints.
- **Sign Out** button — clears JWT cookie and redirects to `/signin`.

**Access:** Authenticated users with a valid JWT only.

---

### Field validation rules

#### Sign Up

| Field | Rules |
|-------|-------|
| Full Name | Required. Must not be empty or whitespace only. Reasonable maximum length (recommended: 100 characters). |
| Email Address | Required. Must be a valid email format. Must be unique across all registered users (case-insensitive comparison recommended). |
| Password | Required. Minimum 8 characters. Must contain at least one uppercase letter, one lowercase letter, one number, and one special character. |
| Confirm Password | Required. Must exactly match the Password field. |

#### Sign In

| Field | Rules |
|-------|-------|
| Email Address | Required. Must be a valid email format. |
| Password | Required. Must not be empty. |

Validation must run on the server for all rules above. Client-side validation may provide immediate feedback but must mirror server rules.

---

### Error messages

Error messages must be written in plain, professional English. They must be specific enough for the user to correct input, except where security requires a generic message.

#### Sign Up — field validation

| Condition | Error message (or equivalent) |
|-----------|-------------------------------|
| Full Name empty | "Full name is required." |
| Email empty | "Email address is required." |
| Email invalid format | "Please enter a valid email address." |
| Email already registered | "An account with this email already exists. Please sign in." |
| Password empty | "Password is required." |
| Password too short | "Password must be at least 8 characters." |
| Password missing uppercase | "Password must contain at least one uppercase letter." |
| Password missing lowercase | "Password must contain at least one lowercase letter." |
| Password missing number | "Password must contain at least one number." |
| Password missing special character | "Password must contain at least one special character." |
| Confirm Password empty | "Please confirm your password." |
| Confirm Password mismatch | "Passwords do not match." |
| Multiple validation errors | Display all applicable field errors simultaneously. |
| Unexpected server failure | "Something went wrong. Please try again later." |

#### Sign In

| Condition | Error message (or equivalent) |
|-----------|-------------------------------|
| Email empty | "Email address is required." |
| Email invalid format | "Please enter a valid email address." |
| Password empty | "Password is required." |
| Invalid credentials (wrong email or password) | "Invalid email or password." |
| Unexpected server failure | "Something went wrong. Please try again later." |

**Security note:** The invalid credentials message must be the same whether the email does not exist or the password is wrong, to reduce user enumeration.

---

### Success messages and navigation

| Event | Behavior |
|-------|----------|
| Successful Sign Up | Redirect to `/signin`. Optional brief success message on Sign In page (e.g., "Account created successfully. Please sign in."). No JWT issued. |
| Successful Sign In | Redirect to `/dashboard` with welcome message showing user's full name (e.g., "Welcome, {Full Name}!"). |
| Successful Sign Out | Clear JWT cookie via Server Action; redirect to `/signin?signedOut=1` with empty form. |
| JWT expired on protected page | Redirect to `/signin`. |

---

### Navigation flow

```
[/signup]
    │
    ├─ Submit (success) ──► [/signin]
    ├─ Submit (failure) ──► [/signup] (with errors)
    └─ "Sign In" link ─────► [/signin]

[/signin]
    │
    ├─ Submit (success) ──► [/dashboard] (welcome message + Sign Out)
    ├─ Submit (failure) ──► [/signin] (with errors)
    └─ "Sign Up" link ─────► [/signup]

[/dashboard] (protected — JWT required)
    │
    ├─ Sign Out ─────────────► [/signin?signedOut=1] (cookie cleared via Server Action)
    └─ Invalid/expired JWT ──► [/signin] (redirect only)

[Any Protected Page]
    │
    └─ Invalid/missing JWT ──► [/signin] (redirect only)
```

---

## Authentication Flow

### Registration flow

1. User completes the Sign Up form and submits.
2. System validates all fields per Field Validation Rules.
3. If validation fails, return field-level errors; user remains on Sign Up page.
4. If email is already registered, return duplicate email error; user remains on Sign Up page.
5. If validation passes, system securely hashes the password and persists the new user record.
6. System redirects user to `/signin` (no JWT issued; user is not automatically authenticated).

### Sign In flow

1. User completes the Sign In form and submits.
2. System validates email format and required fields.
3. System looks up the user by email and verifies the password against the stored hash.
4. If verification fails, display generic "Invalid email or password" error; user remains on `/signin`.
5. If verification succeeds, system generates an **encrypted JWT** (15-minute expiry) containing at minimum: user ID, email, full name, issued-at, and expiration.
6. System sets the JWT in an **HttpOnly, Secure, SameSite=Lax** cookie with **15-minute Max-Age**.
7. System redirects user to `/dashboard` with welcome message.

### JWT lifecycle

1. After successful sign in, an encrypted JWT is stored in the auth cookie.
2. On **every request to a protected route**, the system reads, decrypts, and verifies the JWT.
3. If the JWT is valid and not expired → allow access.
4. If the JWT is missing, expired, or invalid → redirect to `/signin`.
5. JWT persists across navigation and page refresh until **15 minutes after sign in**, sign out, or invalidation.
6. There is **no refresh token** and **no sliding expiration** — the 15-minute window is fixed from sign-in time.

### Sign Out flow

1. User clicks **Sign Out** on the Dashboard.
2. System clears the JWT cookie (set expired / Max-Age=0).
3. System redirects user to `/signin`.
4. No server-side JWT revocation list is maintained (accepted tradeoff for simplicity).

### Protected route flow

1. User requests a protected page (e.g., `/dashboard`).
2. System reads JWT from HttpOnly cookie.
3. System decrypts and verifies JWT signature, encryption, and `exp` claim.
4. If valid → render page (Dashboard shows welcome message with full name from JWT or user record).
5. If invalid or expired → redirect to `/signin`.

---

## JWT Token Strategy

This section defines the agreed authentication mechanism for Quiz Maker. It replaces any prior generic "session" language with concrete JWT requirements.

### Architecture: stateless JWT in encrypted cookie

| Decision | Value |
|----------|-------|
| Token type | Encrypted JWT (JWE) |
| Storage | HttpOnly, Secure, SameSite=Lax cookie |
| Server-side session store | **None** — stateless |
| Browser sessionStorage / localStorage | **Not used** for auth tokens |
| Refresh token | **None** |
| Remember me | **Not supported** |
| JWT expiration | **15 minutes** (fixed from sign-in) |
| Cookie expiration | **15 minutes** (must match JWT `exp`) |
| Expiry behavior | **Fixed** — does not extend on activity |

### Cookie specification

| Attribute | Value |
|-----------|-------|
| Name | `auth_token` |
| HttpOnly | `true` |
| Secure | `true` in production; `false` acceptable for local HTTP dev |
| SameSite | `Lax` |
| Path | `/` |
| Max-Age | `900` seconds (15 minutes) |

### JWT payload (minimum claims)

| Claim | Purpose |
|-------|---------|
| `sub` | User ID |
| `email` | User email |
| `name` | Full name (for Dashboard welcome message) |
| `iat` | Issued at |
| `exp` | Expiration (15 minutes from `iat`) |

The JWT must be **encrypted (JWE)** so claims are not readable in plaintext. A signing key / encryption secret (`JWT_SECRET`) must be stored in environment secrets (`.dev.vars` locally, `wrangler secret put` in production).

### Protected request handling

On **every protected request**:

1. Extract JWT from cookie.
2. Decrypt and verify JWT.
3. **Valid** → proceed with request.
4. **Expired or invalid** → redirect to `/signin`. (Cookie is cleared only via the Sign Out Server Action; Next.js does not allow cookie mutation during Server Component render.)

### Logout behavior

- Clear the auth cookie on the client response.
- No server-side token blocklist required for this sprint.
- **Note:** A cleared cookie prevents further use in the browser, but a stolen JWT could still be used until its 15-minute expiry if not blocklisted. This is an accepted tradeoff for a simple, production-ready first release.

---

## Authentication Requirements

### Sign Up

| Requirement | Detail |
|-------------|--------|
| Fields | Full Name, Email Address, Password, Confirm Password |
| All fields required | Yes |
| Email uniqueness | Yes — duplicate emails rejected |
| Email format | Valid email format enforced |
| Password complexity | Minimum 8 characters; at least one uppercase, one lowercase, one number, one special character |
| Confirm Password | Must match Password |
| Post-registration redirect | `/signin` |
| JWT issued on registration | No |
| Auto sign-in after registration | No |

### Sign In

| Requirement | Detail |
|-------------|--------|
| Fields | Email Address, Password |
| Credential validation | Yes — verify against stored user record |
| Invalid login messaging | Generic: "Invalid email or password" |
| Post-login redirect | `/dashboard` with welcome message |
| JWT issued on login | Yes — encrypted JWT in HttpOnly cookie |
| JWT / cookie expiration | 15 minutes, fixed |
| Refresh token | No |
| Remember me | No |

### Sign Out

| Requirement | Detail |
|-------------|--------|
| JWT cookie cleared | Yes — on Sign Out |
| Post-sign-out redirect | `/signin` |
| Server-side token revocation | No (cookie clear only) |

### Protected routes

| Requirement | Detail |
|-------------|--------|
| Authenticated access only | Yes — valid JWT required for `/dashboard` and future protected pages |
| Unauthenticated / expired redirect | `/signin` (cookie cleared) |
| JWT verification | Required on **every** protected request |

---

## Security Requirements

| ID | Requirement |
|----|-------------|
| SEC-01 | Passwords must be hashed before storage using bcrypt (`bcryptjs`, 10 rounds). |
| SEC-02 | Plain-text passwords must never be stored, logged, or transmitted in responses. |
| SEC-03 | Password hashes must never be exposed through APIs or UI. |
| SEC-04 | Sign In errors must use a generic message that does not reveal whether an email is registered. |
| SEC-05 | JWT cookie must be cleared immediately on sign out. |
| SEC-06 | JWT and cookie expiration must be **15 minutes**, fixed from sign-in time. No refresh token. No sliding expiration. |
| SEC-07 | JWT must be stored in an **HttpOnly, Secure, SameSite=Lax** cookie. Must not be stored in `sessionStorage`, `localStorage`, or accessible via JavaScript. |
| SEC-08 | JWT must be **encrypted (JWE)**, not merely signed, so payload claims are not readable in plaintext. |
| SEC-09 | All authentication forms must be processed server-side; client-side validation alone is insufficient. |
| SEC-10 | On every protected request, verify JWT. If expired or invalid, redirect to `/signin`. Cookie clearing happens on sign-out only. |
| SEC-11 | Rate limiting or brute-force protection should be considered during implementation (may be deferred to a hardening sprint). |
| SEC-12 | HTTPS must be enforced in production environments. |
| SEC-13 | `JWT_SECRET` (or equivalent) must be stored in environment secrets, never committed to the repository. |

### JWT authentication — design decision (confirmed)

Authentication state is maintained via a **stateless encrypted JWT in an HttpOnly cookie**. There is no server-side session table, no refresh token, and no "Remember me" option. This approach is simple, production-ready, and compatible with Cloudflare Workers. Users must re-authenticate after 15 minutes or after signing out.

---

## Acceptance Criteria

### Sign Up

- [x] A new user can register with Full Name, Email, Password, and Confirm Password.
- [x] All required-field validations are enforced.
- [x] Invalid email format is rejected with an appropriate error.
- [x] Password complexity rules are enforced (8+ chars, uppercase, lowercase, number, special character).
- [x] Confirm Password mismatch is rejected.
- [x] Duplicate email registration is rejected with an appropriate error.
- [x] Password is stored hashed; plain-text password is never persisted.
- [x] On success, user is redirected to `/signin`.
- [x] No JWT is issued after registration.

### Sign In

- [x] A registered user can sign in with Email and Password.
- [x] Invalid credentials show "Invalid email or password" (generic message).
- [x] Successful sign in issues an encrypted JWT in an HttpOnly cookie (15-minute expiry).
- [x] Successful sign in redirects to `/dashboard` with welcome message showing full name (e.g., "Welcome, Jane Smith!").
- [x] JWT persists across page navigation and browser refresh within the 15-minute window.

### Sign Out

- [x] Sign Out button on Dashboard clears the JWT cookie.
- [x] After sign out, user is redirected to `/signin?signedOut=1`.
- [x] After sign out, protected pages are inaccessible without signing in again.

### Protected routes

- [x] Authenticated users with valid JWT can access `/dashboard`.
- [x] Unauthenticated users are redirected to `/signin` when accessing `/dashboard`.
- [x] Expired JWT redirects to `/signin`.
- [x] Invalid JWT redirects to `/signin`.
- [x] Dashboard displays welcome message, Sign Out button, and placeholder content for future quiz features.

### JWT-specific

- [x] JWT expiration is 15 minutes (fixed, not sliding).
- [x] Cookie expiration matches JWT expiration (15 minutes).
- [x] No refresh token is issued.
- [x] JWT is encrypted (JWE), not stored in sessionStorage/localStorage.
- [x] JWT is verified on every protected request.

### Non-functional

- [x] Sign Up and Sign In pages are responsive on desktop and mobile.
- [x] Forms are keyboard-accessible and screen-reader friendly.
- [x] No passwords or password hashes appear in logs or API responses.
- [x] Authentication module is structured for maintainability and future extension.

---

## Assumptions

1. **Application platform:** Quiz Maker is built on Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, deployed on Cloudflare Workers via OpenNext.
2. **Authentication is implemented:** Sign up, sign in, sign out, JWT sessions, and protected routes are live in production.
3. **Database:** Cloudflare D1 database `quizmaker-db` stores user records. Local and remote databases are separate instances.
4. **Email as primary identifier:** Users sign in with email (not username). Full Name is stored for display purposes only.
5. **Dashboard is a placeholder:** `/dashboard` is the authenticated landing page with welcome message and Sign Out until quiz features are built.
6. **Post-registration redirect to Sign In:** Users must explicitly sign in after registration at `/signin`; no JWT is issued on sign up.
7. **JWT authentication:** Stateless encrypted JWT in HttpOnly cookie; 15-minute fixed expiry; no refresh token; no Remember me; no server-side session store.
8. **Routes:** `/` (home), `/signup`, `/signin`, `/dashboard` are the canonical auth routes.
9. **Single role:** All authenticated users have the same access level in this sprint; role-based access control is out of scope.
10. **No email verification:** Email format is validated, but sending a verification email is out of scope.
11. **Post-login redirect:** Default redirect after sign in is `/dashboard` with welcome message.
12. **JWT secret:** `JWT_SECRET` in `.dev.vars` locally and Wrangler secret in production.

---

## Out of Scope

The following are explicitly **not** part of Sprint 0 or the authentication module defined here:

- Quiz creation
- Quiz management (edit, delete, publish)
- Quiz attempts or taking quizzes
- Quiz results, reports, or analytics
- User profile editing UI
- Password reset / forgot password
- Email verification / account activation emails
- Remember me / extended sessions
- Refresh tokens
- Server-side session store or JWT revocation blocklist
- OAuth or social login (Google, GitHub, etc.)
- Multi-factor authentication (MFA)
- Role-based or permission-based access control
- Admin user management
- User impersonation
- Account deletion
- API design and database schema (deferred to future quiz sprints)
- Automated test implementation (deferred to future sprints)

---

## Future Enhancements

| Enhancement | Description |
|-------------|-------------|
| Forgot password / reset flow | Allow users to recover access via email link |
| Email verification | Confirm email ownership before full account activation |
| Refresh token / silent renewal | Extend sessions without re-login (explicitly rejected for v1) |
| OAuth / social login | Sign in with Google, Microsoft, or other providers |
| Multi-factor authentication | Additional verification step for high-security accounts |
| Role-based access | Separate roles for quiz creators, students, and administrators |
| Profile management | Allow users to update name, email, and password |
| Session management UI | View and revoke active sessions |
| Rate limiting and CAPTCHA | Protect against brute-force and automated abuse |
| Audit logging | Track sign in, sign out, and failed login events |

---

## Risks and Open Questions

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| 15-minute JWT expiry | Users must re-login frequently | Accepted product decision; refresh tokens explicitly out of scope |
| No JWT revocation blocklist | Stolen JWT valid until expiry (max 15 min) | Short TTL limits exposure; blocklist deferred to future hardening |
| Password hashing on edge runtime | Some algorithms may have CPU constraints on Cloudflare Workers | **Mitigated — bcrypt (10 rounds) validated on Workers runtime** |
| User enumeration via Sign Up | Duplicate email error reveals registered emails | Acceptable tradeoff for registration UX; Sign In uses generic errors |
| Brute-force login attacks | Account compromise | Plan rate limiting in implementation or hardening sprint |
| Scope creep into quiz features | Sprint delays | Strictly enforce Out of Scope; Dashboard remains placeholder only |

### Open questions

| # | Question | Status |
|---|----------|--------|
| OQ-01 | JWT / cookie lifetime | **Closed — 15 minutes, fixed, no refresh** |
| OQ-02 | Return URL after login | **Closed — default `/dashboard` with welcome message** |
| OQ-03 | Password hashing algorithm on Workers | **Closed — bcrypt (bcryptjs, 10 rounds)** |
| OQ-04 | Remember me | **Closed — not supported** |
| OQ-05 | Full Name vs First/Last split | Open — single Full Name field for now |
| OQ-06 | Rate limiting strategy | Open — decide during hardening sprint |
| OQ-07 | JWT encryption library on Cloudflare Workers | **Closed — `jose` (EncryptJWT / jwtDecrypt, dir/A256GCM)** |

---

## Success Metrics

| Metric | Target | How measured |
|--------|--------|--------------|
| Registration completion rate | Users who submit valid Sign Up reach Sign In redirect | Manual / analytics on Sign Up funnel |
| Sign In success rate | Valid credentials result in `/dashboard` with welcome message | Test cases + manual QA |
| JWT persistence | Valid JWT survives refresh and navigation within 15 minutes | Manual / automated test |
| JWT expiry | After 15 minutes, protected access redirects to `/signin` | Manual / automated test |
| Protected route enforcement | 100% of invalid/missing JWT access attempts redirect to `/signin` | Test cases |
| Security compliance | Zero plain-text passwords in storage or logs | Security review / audit checklist |
| Accessibility | Sign Up and Sign In pass basic keyboard and screen reader checks | Manual accessibility review |

---

## Dependencies

| Dependency | Purpose | Status |
|------------|---------|--------|
| Cloudflare D1 (`quizmaker-db`) | Store registered user records and password hashes | ✅ Provisioned (local + remote) |
| `jose` | Generate, encrypt, and verify JWT tokens (JWE) | ✅ Installed |
| `bcryptjs` | Password hashing and verification | ✅ Installed |
| `zod` | Server-side input validation | ✅ Installed |
| `JWT_SECRET` | Secret key for JWT encryption (`.dev.vars` / Wrangler secrets) | ✅ Configured |
| HTTPS / TLS | Secure transport in production | ✅ Cloudflare Workers |
| Application hosting (Cloudflare Workers) | Runtime for auth logic and protected routes | ✅ Deployed |
| UI component library (shadcn/ui) | Form and page presentation | ✅ In use |

No external third-party authentication provider is required. No server-side session store is required.

---

## Implementation Phases

### Phase 1: Foundation — ✅ COMPLETE

**Delivered:** D1 database binding, `users` table migration, password hashing (`bcryptjs`), JWT module (`jose`), `JWT_SECRET` configuration.

### Phase 2: Authentication logic — ✅ COMPLETE

**Delivered:** Server Actions for sign up, sign in, sign out; Zod validation; credential verification; JWT issuance and verification.

### Phase 3: UI and protected routes — ✅ COMPLETE

**Delivered:** `/signup`, `/signin`, `/dashboard`, home page with auth links; Dashboard welcome message and Sign Out; redirect guards.

### Phase 4: Verification and deployment — ✅ COMPLETE

**Delivered:** Lint and build pass; remote D1 migration applied; production deployment to Cloudflare Workers; `JWT_SECRET` set as Wrangler secret.

---

## Notes for AI Agents

When extending Quiz Maker beyond authentication:

1. Read the full **Out of Scope** section — quiz features are not yet built.
2. Follow project conventions in `AGENTS.md` and `.cursor/rules/`.
3. **Do not auto-sign-in after registration** — redirect to `/signin`.
4. Use generic login error messages per SEC-04.
5. **JWT is mandatory** — encrypted JWT in HttpOnly cookie; 15-minute fixed expiry; no refresh token.
6. Cookie mutation is only allowed in Server Actions or Route Handlers — not during Server Component render.
7. D1 queries belong in `src/lib/services/`; access via `getDb()` from `src/lib/db.ts`.
8. Ask before adding new dependencies.
9. Update this document when auth behavior or deployment details change.

---

## Technical Implementation Details

### Routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Dynamic | Home page; links to sign in, sign up, or dashboard based on session |
| `/signup` | Dynamic | Registration form; redirects authenticated users to dashboard |
| `/signin` | Dynamic | Login form; supports `?registered=1` and `?signedOut=1` query params |
| `/dashboard` | Protected | Authenticated landing page with welcome message and sign out |

### Key modules

| Path | Purpose |
|------|---------|
| `src/lib/actions/auth-actions.ts` | Server Actions: `signUpAction`, `signInAction`, `signOutAction` |
| `src/lib/auth/jwt.ts` | JWE token create/verify (`jose`, cookie name `auth_token`) |
| `src/lib/auth/cookies.ts` | HttpOnly cookie set/clear/read |
| `src/lib/auth/session.ts` | `getSession`, `requireAuth`, `redirectIfAuthenticated` |
| `src/lib/services/user-service.ts` | D1 user CRUD and credential verification |
| `src/lib/validation/auth-schemas.ts` | Zod schemas for sign up and sign in |
| `src/lib/db.ts` | D1 access via `getCloudflareContext()` with dev fallback |
| `src/lib/password.ts` | bcrypt hash/verify (10 rounds) |

### Database schema (D1)

**Database:** `quizmaker-db` (binding: `DB`)  
**Migration:** `migrations/0001_create_users.sql`

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_users_email ON users(email);
```

### Deployment

| Item | Value |
|------|-------|
| Worker name | `ai-sprints-quizmaker` |
| Production URL | https://ai-sprints-quizmaker.rakshitha-quizmaker-rs.workers.dev |
| Deploy command | `npm run deploy` |
| Local dev | `npm run dev` (D1 via Wrangler platform proxy fallback) |
| Local D1 migrations | `npx wrangler d1 migrations apply quizmaker-db --local` |
| Remote D1 migrations | `npx wrangler d1 migrations apply quizmaker-db --remote` |

### Dependencies added for auth

- `jose` — JWT encryption/decryption
- `bcryptjs` — password hashing
- `zod` — validation
- `server-only` — guard server modules

---

## Current Status

**Last Updated:** 2026-08-25  
**Sprint:** Sprint 0 — Authentication  
**Status:** ✅ COMPLETE (implemented and deployed)  
**Auth mechanism:** Encrypted JWT (JWE) in HttpOnly cookie, 15-minute fixed expiry, no refresh token  
**Production URL:** https://ai-sprints-quizmaker.rakshitha-quizmaker-rs.workers.dev  
**Next Steps:** Begin Sprint 1 — quiz creation and management features per product roadmap
