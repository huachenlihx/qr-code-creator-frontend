# QR Code Creator — React / Next.js Frontend

A responsive, production-deployed QR code creation interface built with **Next.js, React, and TypeScript**. The application collects QR code details, integrates with a separate Django REST API, and downloads a generated ZIP package directly in the browser.

**Live demo:** https://qrcode.founderdesigngroup.ca/  
**Repository:** https://github.com/huachenlihx/qr-code-creator-frontend

> This repository contains the **frontend only**. QR code generation, ZIP packaging, verification validation, and Stripe Checkout session creation are handled by a separate backend service, which is not included here.

## What the application does

Users can create QR codes for six content types:

| Type | Purpose |
| --- | --- |
| URL | Open a website or web page |
| Plain text | Encode a message, serial number, or other text |
| Wi-Fi | Share network credentials with compatible devices |
| Contact card | Encode contact details as a vCard |
| Calendar event | Encode event title, timing, location, and description |
| App action | Open a phone dialer, SMS, email, or custom URI |

The interface also provides:

- **React-based forms** with conditional fields and client-side validation appropriate to the selected QR type.
- **Quality choices** for full, web, or print-oriented output, with an optional ZIP filename.
- **REST API integration** using Axios, including loading indicators, error handling, and ZIP downloads.
- **Human verification** using a backend-issued math challenge, with optional Cloudflare Turnstile when required by the backend.
- **Download handling** for binary responses and filenames returned through `Content-Disposition`.
- **Responsive layouts** and reusable interface components, including help and contact modals.
- **Optional support payments** that redirect to Stripe Checkout through a backend-created session. Card information is not collected by this frontend.
- **Search-engine metadata**, including canonical URL, Open Graph metadata, `robots.txt`, and `sitemap.xml`.

## Technology stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** CSS
- **HTTP requests:** Axios
- **Icons:** Lucide React
- **Help content:** React Markdown and remark-gfm
- **Backend integration:** Separate Django REST Framework API
- **Optional verification:** Cloudflare Turnstile, coordinated with the backend
- **Payments:** Stripe Checkout through backend endpoints
- **Testing:** Vitest, React Testing Library, jsdom, and V8 code coverage

## Application architecture

```text
Browser / React frontend
    |
    |-- GET  /api/anti-bot/challenge/
    |-- POST /api/qr/create-package/  ---> ZIP file download
    |-- GET  /api/support/config/
    |-- POST /api/support/checkout-session/ ---> Stripe-hosted checkout
    |
    v
Separate Django REST API
```

The frontend is configured for a **static Next.js export** (`output: 'export'`). It can be hosted as static files, while dynamic operations are sent to the backend API.

## Local development

### Prerequisites

- Node.js and npm compatible with the project's Next.js version
- Access to a compatible QR Code Creator backend API for operations that require the server

### 1. Clone the repository

```bash
git clone https://github.com/huachenlihx/qr-code-creator-frontend.git
cd qr-code-creator-frontend
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```dotenv
# URL of your own compatible Django REST API (no trailing slash)
NEXT_PUBLIC_API_BASE_URL=

# Optional: use only if the backend requires Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

Set `NEXT_PUBLIC_API_BASE_URL` to the address of a compatible backend before testing features that make API requests.

**Important:** In the current source, `lib/api.ts` includes a production API URL as a fallback when `NEXT_PUBLIC_API_BASE_URL` is empty. For an independent deployment, explicitly set your own backend URL **and replace or remove that fallback**. An empty variable alone does not disable the fallback.

Do not commit `.env.local`, private tokens, or other secrets. `NEXT_PUBLIC_` variables are exposed to the browser and must not hold secrets. Cloudflare's **secret key belongs only on the backend**.

### 4. Run the development server

```bash
npm run dev
```

Open http://localhost:3000.

### 5. Build the static frontend

```bash
npm run build
```

The build is configured to generate a static site in `out/`, and the `postbuild` script performs additional output preparation.

To preview the static build:

```bash
npm start
```

## Project structure

```text
app/
  layout.tsx                # Root layout and SEO metadata
  page.tsx                  # Main entry page
  globals.css               # Global and responsive styles
components/
  QRCodeCreator.tsx         # QR types, forms, validation, API submission
  AntiBotVerification.tsx   # Math challenge / optional Turnstile
  CoffeeCard.tsx            # Optional support payment UI
  ContactModal.tsx          # Contact form/modal
  HelpModal.tsx             # Help modal
lib/
  api.ts                    # Axios client and API base URL
  download.ts               # Browser ZIP download helpers
tests/
  download.test.ts          # ZIP and download utility tests (14)
  components/
    HelpModal.test.tsx      # Help modal tests (5)
    ContactModal.test.tsx   # Contact form tests (9)
vitest.config.mts           # Vitest configuration
public/
  help/                     # QR Code Creator usage guide
  robots.txt
  sitemap.xml
scripts/
  postbuild.sh              # Post-build preparation
```

## Frontend engineering highlights

- **Reusable components:** QR forms, verification UI, contact/help dialogs, and support payments are separated into focused components.
- **State-driven interface:** The selected QR type controls which fields appear and whether form submission is enabled.
- **API error handling:** The ZIP endpoint returns binary data on success; the frontend also handles error details received as a Blob.
- **Browser downloads:** The app extracts a server-provided filename when available, creates an object URL, and releases it after triggering the download.
- **Payment return experience:** Stripe return parameters are handled in the browser, a temporary success/cancel message is shown, and the return parameters are removed from the URL.
- **Static deployment:** The UI uses Next.js static export while keeping dynamic processing in a separate API.

## Security and privacy notes

- Sensitive verification, QR generation, and payment processing are performed by the backend.
- The frontend does not collect card details; payment is completed on Stripe-hosted pages.
- Wi-Fi QR codes contain the encoded Wi-Fi credentials; only distribute those codes when authorized.
- The frontend's API address and Turnstile site key are public configuration values, not secrets.
- Do not publish `.env.local` or backend credentials.

## Live application

Try the deployed frontend at **https://qrcode.founderdesigngroup.ca/**.

The associated backend implementation is separate from this public frontend repository.

## Author

**Hua Chen**  
GitHub: https://github.com/huachenlihx

## Automated testing

The frontend uses **Vitest** for TypeScript unit tests and **React Testing Library** with **jsdom** for React component tests. Tests use mocks for API calls and human verification, so the test suite does not require access to the live Django backend or Cloudflare Turnstile.

The latest verified local run completed **28 tests across 3 files, all passing**:

| Test file | Tests | Areas covered |
| --- | ---: | --- |
| `tests/download.test.ts` | 14 | ZIP signatures, failed HTTP responses, JSON/HTML errors, filename parsing, and browser download cleanup |
| `tests/components/HelpModal.test.tsx` | 5 | Opening/closing, Markdown loading and errors, Escape key, backdrop interaction |
| `tests/components/ContactModal.test.tsx` | 9 | Required fields, category loading, contact submission, API errors, attachment limits, clearing and closing |
| **Total** | **28** | **3 test files** |

### Run tests

Install dependencies first:

```bash
npm ci
```

Run all tests once:

```bash
npm test
```

Run tests in watch mode while developing:

```bash
npm run test:watch
```

Generate a code coverage report:

```bash
npm run test:coverage
```

Vitest writes coverage reports to the generated `coverage/` directory. When an HTML report is available, view it on macOS with:

```bash
open coverage/index.html
```

The `coverage/` directory is generated output and should be excluded from Git through `.gitignore`.

Before deployment, run both the tests and the production build:

```bash
npm test
npm run build
```

### Testing scope and regression prevention

The ZIP download tests verify that the frontend rejects non-ZIP responses, including JSON/HTML error payloads and invalid ZIP signatures, rather than downloading them as corrupted files. The modal tests cover user-facing interactions with mocked external dependencies.

**Passing tests are not the same as full application coverage.** The current suite does not claim comprehensive coverage of `QRCodeCreator.tsx`, `AntiBotVerification.tsx`, or real-browser end-to-end workflows.

---

*This README documents the frontend implementation in this repository; server-side details are described only to clarify the frontend's API integration.*
