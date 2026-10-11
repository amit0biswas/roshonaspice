# Roshona — The Art of Spice

A responsive React/Vite storefront and a separate Express/Mongoose API for the Roshona spice shop. The storefront uses the supplied Roshona logo and product photography in `Shopcollection/`.

## Requirements

- Node.js 20 or newer and npm
- A MongoDB Atlas database (or another MongoDB deployment that supports transactions)
- SMTP credentials to enable password-reset email

## Run locally

1. Rotate the MongoDB credential that was pasted into the original project request. Create a database user with a new password, restrict its Atlas network access, and use the new URI only in a local environment file or deployment secret. Do not paste it into chat or commit it.
2. Copy `backend/.env.example` to `backend/.env` and fill in `MONGODB_URI`, a random `JWT_SECRET` of at least 32 characters, and `FRONTEND_ORIGIN=http://localhost:5173`. The backend loads this file by its own location, even when started from the workspace root. Copy `frontend/.env.example` to `frontend/.env`; set `VITE_API_URL` to the API origin (or leave it blank to use the Vite `/api` proxy) and set the Firebase `VITE_FIREBASE_*` client configuration values. Firebase web configuration is public; restrict the Firebase API key to your deployed domains in Google Cloud Console. Never place database credentials or backend secrets in frontend variables.
3. Install workspace dependencies at the repository root:

   ```sh
   npm install
   ```

4. Start both the API and storefront from the repository root (not from `frontend/`):

   ```sh
   npm run dev
   ```

   The storefront is at `http://localhost:5173`; the API is at `http://localhost:4000`.
   Both processes must stay running while using the storefront. Starting only the frontend leaves its `/api` proxy without a backend and produces an API-unavailable message. On startup, the API also removes the obsolete unique `orders.reference` index from earlier schema versions; it does not delete order records. If login reports an API/server error, open `http://localhost:5173/api/health`; the response should show `"status":"ok"` and `"database":"connected"`. Restart `npm run dev` from the project root if the API is unavailable.
5. Set up an administrator using one of these options:

   ```sh
   npm run admin:create -w backend
   ```

   For a new administrator, set `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` in the environment for the command; the password must be at least 12 characters. If you already registered the account you want to use, instead set `ADMIN_EMAIL` to that exact account email and set `CONFIRM_ADMIN_PROMOTION=YES`, then run `npm run admin:promote -w backend`. This one-time local command changes only that account's role; its existing password is unchanged. The create command refuses to promote an existing account. Keep all credentials out of source control and do not add a public self-service admin promotion route.
6. Open `/admin`. Admin email and password are entered on that page; it no longer redirects to the customer account screen. If a customer session is already active, enter the admin credentials to switch accounts or use **Sign out of customer account** first. Successful administrator sign-in opens the dashboard. Customer accounts remain limited to the storefront. Product records are seeded on API startup without replacing existing catalog edits. Only Garam Masala (৳149/100g) and Turmeric Powder (৳100/100g) receive seeded prices; the other three prices remain unset.

### Administrator password and password-reset email

- For a new admin account, set `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` in your terminal environment, then run `npm run admin:create -w backend`. Choose a unique password with at least 12 characters. The script stores only a bcrypt hash in MongoDB. Do not put these values in frontend environment variables or commit them.
- To use an account you already registered, set `ADMIN_EMAIL` and `CONFIRM_ADMIN_PROMOTION=YES`, then run `npm run admin:promote -w backend`. Its password is unchanged; use that password to sign in.
- Password reset email requires `SMTP_HOST`, `SMTP_PORT`, and `EMAIL_FROM` in `backend/.env`; add `SMTP_USER` and `SMTP_PASSWORD` when your provider requires authenticated SMTP. For a Gmail mailbox, use `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, your complete Gmail address for `SMTP_USER`, a Google **App Password** for `SMTP_PASSWORD` (enable 2-Step Verification to create one), and that mailbox as `EMAIL_FROM`. Do not use your regular Gmail password. For other mail providers, use their authenticated SMTP host, port, mailbox and app/API password, and an authorized sender address.
- Restart the backend after changing `backend/.env`. Use **Forgot your password?** on sign-in to verify delivery. Password-reset links expire after one hour. If email is not configured, recovery remains unavailable and the API explains this when a reset is requested.

On Windows PowerShell, a new admin can be created without echoing the password as you type:

```powershell
# Create backend\.env from the example only if it does not already exist:
if (-not (Test-Path .\backend\.env)) { Copy-Item .\backend\.env.example .\backend\.env }
notepad .\backend\.env
# In Notepad, set MONGODB_URI to your NEW rotated Atlas URI and save the file.

$env:ADMIN_EMAIL = Read-Host "Admin email"
$env:ADMIN_NAME = Read-Host "Admin name"
$securePassword = Read-Host "Admin password (12+ characters)" -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $securePassword).Password
npm.cmd run admin:create -w backend
Remove-Item Env:ADMIN_EMAIL, Env:ADMIN_NAME, Env:ADMIN_PASSWORD
```

To promote an existing registered account in PowerShell, set `$env:ADMIN_EMAIL` to its exact email address and `$env:CONFIRM_ADMIN_PROMOTION = "YES"`, run `npm.cmd run admin:promote -w backend`, then remove both environment variables. The admin account email/password are for signing in; SMTP credentials are only for sending password-reset messages.

## Build and check

```sh
npm run build
npm audit --omit=dev
```

The frontend and backend build independently with `npm run build:frontend` and `npm run build:backend`. The production dependency audit is clean at the time this version was installed. No connected-database or end-to-end order test has been run in this workspace.

## Configure before accepting orders

- Sign in to `/admin` and open **Store settings**. Enter the confirmed standard delivery fee. Optionally set a subtotal threshold for free delivery. Checkout remains paused until this configuration is saved; the server calculates and persists the final delivery amount.
- VAT is off by default. Enter the confirmed percentage and enable it only after confirming the applicable tax treatment. When enabled, VAT is calculated on the product subtotal and added to the order total; its rate and amount are recorded with each order.
- Add confirmed prices and actual stock quantities through the admin product panel. Seeded inventory is zero to avoid claiming stock that has not been verified. Customers must sign in to place an order.
- Configure SMTP (`SMTP_HOST`, `SMTP_PORT`, optional `SMTP_USER` and `SMTP_PASSWORD`, and `EMAIL_FROM`) to enable one-hour, single-use password-reset links. Without it, the reset request returns an explicit service-unavailable error.
- Confirm delivery coverage, delivery estimates, return/cancellation terms, and the privacy notice before publishing. Disclose Firebase Analytics and configure consent as required for your users and jurisdictions. The current information pages explicitly say where those business details are not yet confirmed.
- Cash on delivery is the only active payment method. SSLCommerz, bKash, and Nagad are not live until merchant accounts/credentials and secure server-side payment initialization, verification, callback, and failure handling are configured. Do not put gateway secrets in the frontend.

## Deploy

Deployment is prepared for a Vercel-hosted Vite frontend, a Render-hosted Express API, and MongoDB Atlas. No deployment or live-database write is performed by these instructions. The project uses its own backend customer/admin authentication with bcrypt password hashes and HTTP-only JWT cookies. Firebase is currently used for Analytics only; Firebase Authentication is not wired into account sign-in.

### 1. Build locally on Windows before publishing

Open PowerShell in the project root:

```powershell
Set-Location D:\roshonaspice
npm.cmd ci
npm.cmd run build
```

There are no automated test files in the current repository. These production builds type-check and compile the backend and frontend. Do not use an order-placement request as a deployment smoke test against the live store; it creates an order and changes inventory.

### 2. Prepare MongoDB Atlas without exposing credentials

1. Rotate any database password that has previously been shared. Use a dedicated Atlas database user with only the permissions the application requires.
2. Create or select the production database, and copy its connection string directly into the Render secret field in the next step. Do not put it in frontend variables, source files, PowerShell command history, or Git.
3. Configure Atlas Network Access for the Render service's current outbound IP addresses or a private-network option available to your hosting plan. Avoid `0.0.0.0/0`; do not change an existing live Atlas network policy without reviewing and approving the impact.
4. The API's startup seed is idempotent and preserves catalog edits, but startup connects to the configured database and may seed baseline catalog records. Point the first deployment at the intended database and review that effect before deploying.

### 3. Create the Render API

1. In Render, create a **Web Service** from the repository and use the repository root as its Root Directory so the npm workspace lockfile is available.
2. Use the checked-in `render.yaml` Blueprint settings, or set:
   - Build command: `npm ci --include=dev && npm ls -w backend @types/express @types/express-serve-static-core typescript && npm run build -w backend`
   - Start command: `npm run start -w backend`
   - Health check path: `/api/health`
3. Add these service environment variables in Render. Never commit their values:

   | Variable | Required | Value |
   | --- | --- | --- |
   | `NODE_ENV` | Yes | `production` |
   | `MONGODB_URI` | Yes | Rotated Atlas connection string; keep as a Render secret |
   | `JWT_SECRET` | Yes | Generate a unique random secret of at least 32 characters; do not reuse a password |
   | `FRONTEND_ORIGIN` | Yes | Exact Vercel site origin, e.g. `https://roshona.vercel.app`; multiple exact origins may be comma-separated |
   | `SMTP_HOST` | Optional | SMTP host for password-reset email |
   | `SMTP_PORT` | Optional | Usually `587` for STARTTLS |
   | `SMTP_USER` | Optional | SMTP username, if required |
   | `SMTP_PASSWORD` | Optional | SMTP app/API password, if required; keep secret |
   | `EMAIL_FROM` | Optional | Authorized sender address |
   | `COOKIE_DOMAIN` | Optional | Usually leave unset for Vercel/Render; set only when using a shared custom parent domain |

   Render supplies `PORT`; do not hardcode it. Production CORS rejects a missing frontend origin and requires HTTPS origins. The session cookie is HTTP-only, secure, and uses `SameSite=None` for cross-origin Vercel/Render hosting. If using your own domain, configure the exact frontend origin in `FRONTEND_ORIGIN`.
4. Wait for the service to deploy. Copy its HTTPS origin, for example `https://roshona-api.onrender.com`. Check `https://<your-render-service>.onrender.com/api/health`; the response must be HTTP 200 with `{"status":"ok","database":"connected"}`. A disconnected database returns HTTP 503.

### 4. Create the Vercel frontend

1. Import the same repository into Vercel. Set **Root Directory** to the repository root and leave the option to include files outside the root enabled.
2. Use the checked-in `vercel.json` settings:
   - Install command: `npm ci`
   - Build command: `npm run build:frontend`
   - Output directory: `frontend/dist`
3. Add these environment variables for **Production** (and Preview only if preview origins are also allowlisted in Render):

   | Variable | Required | Value |
   | --- | --- | --- |
   | `VITE_API_URL` | Yes | Render API HTTPS origin only, e.g. `https://roshona-api.onrender.com` (no `/api` path) |
   | `VITE_FIREBASE_API_KEY` | Optional | Firebase web-app config for Analytics |
   | `VITE_FIREBASE_AUTH_DOMAIN` | Optional | Firebase web-app config for Analytics |
   | `VITE_FIREBASE_PROJECT_ID` | Optional | Firebase web-app config for Analytics |
   | `VITE_FIREBASE_STORAGE_BUCKET` | Optional | Firebase web-app config for Analytics |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional | Firebase web-app config for Analytics |
   | `VITE_FIREBASE_APP_ID` | Optional | Firebase web-app config for Analytics |
   | `VITE_FIREBASE_MEASUREMENT_ID` | Optional | Firebase web-app config for Analytics |

   `VITE_*` values are embedded in the browser bundle and must never contain database credentials, JWT secrets, SMTP credentials, or payment secrets. The Firebase web-app config is public client config; restrict its API key to the production site and enable only the Firebase services you use.
4. Deploy and copy the exact Vercel origin, then set it as `FRONTEND_ORIGIN` on Render. If this changes, redeploy the API. Redeploy Vercel after changing its environment variables.

### 5. PowerShell production build and health checks

After configuring the deployment variables in the provider dashboards, these local commands verify the production bundle wiring without contacting MongoDB or changing live data:

```powershell
Set-Location D:\roshonaspice
$env:VITE_API_URL = "https://roshona-api.onrender.com"
npm.cmd run build
Remove-Item Env:VITE_API_URL
```

Replace the example API origin with your real Render origin. Production builds fail early if `VITE_API_URL` is missing, non-HTTPS, or contains an API path. Check the deployed API and storefront:

```powershell
Invoke-RestMethod "https://roshona-api.onrender.com/api/health"
Start-Process "https://roshona.vercel.app"
```

The browser should load the storefront and its products; account sign-in should use the backend API. Do not test checkout or admin-write actions against production without an explicit approval and a controlled test plan.

### 6. Create the first production administrator only when approved

Admin provisioning writes an account into the configured database. It has deliberately not been run as part of deployment preparation. After reviewing and explicitly approving that live-data change, run the following from PowerShell, entering secrets at the prompts rather than in the command:

```powershell
Set-Location D:\roshonaspice
$secureUri = Read-Host "Rotated production MongoDB URI" -AsSecureString
$env:MONGODB_URI = [System.Net.NetworkCredential]::new("", $secureUri).Password
$env:ADMIN_EMAIL = Read-Host "Admin email"
$env:ADMIN_NAME = Read-Host "Admin display name"
$securePassword = Read-Host "Unique admin password (12+ characters)" -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $securePassword).Password
try {
    npm.cmd run admin:create -w backend
} finally {
    Remove-Item Env:MONGODB_URI, Env:ADMIN_EMAIL, Env:ADMIN_NAME, Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
}
```

The script creates only a new administrator and refuses to promote an existing account. Do not run `admin:promote` unless that specific role change has also been approved. Sign-in checks the account role from MongoDB on every authenticated request; admin API routes require both a valid session and the admin role.

## Storefront and admin scope

Implemented storefront routes: home, shop/category filtering, product details, search, cart, cash-on-delivery checkout, account registration/sign-in/sign-out, password reset, editable profile, saved delivery addresses, product and recipe wishlists, order history, order tracking, About, Contact, FAQ, delivery/returns/privacy/terms information, database-backed recipes and recipe details, verified customer reviews, and not-found. The homepage recipe cards and review carousel use public API data; customer reviews are displayed only after admin approval. Signed-in customers can open a product's review form from a delivered order in their account or from its product page. Reviews can be submitted only for a delivered purchase and await admin approval before publication.

Implemented admin route: `/admin`. The role-protected workspace provides order/revenue/customer/product summary cards; product creation, editing and storefront visibility controls; category create/rename/removal (removal is blocked while products use a category); recipe creation, editing and publication controls; order search, status filtering, delivery details and status updates; review moderation; customer listing; contact-message search and status management; and generic database-backed store settings.

Coupons, dedicated homepage content editing, downloadable reports, charted/date-filtered analytics, customer account editing/deletion, email verification, and online payment are not implemented. Recipe image licensing and attribution are documented in [docs/IMAGE-CREDITS.md](docs/IMAGE-CREDITS.md).

## Project layout

- `frontend/` — React, TypeScript, Vite and responsive brand UI.
- `backend/` — Express REST API, Mongoose models, validation, authentication, and transactional order/inventory handling.
- `Shopcollection/` — supplied original brand and product images.
- `docs/API.md` — API route reference.
- `render.yaml`, `vercel.json` — deployment starting points.
