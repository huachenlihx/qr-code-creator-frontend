# QR Code Creator — Instructions

This site creates QR code files on the **Founder Design Group Django API backend** and downloads a complete ZIP package to your browser. You do **not** need an account.

## 1. Choose the QR code type

- **URL** — opens a website or web page.
- **Plain Text** — displays a message, coupon code, serial number, or other text.
- **Wi-Fi Credentials** — shares a network name, security type, and password so compatible phones can offer to join the network.
- **Contact Card (vCard)** — opens a new-contact form with the supplied contact details.
- **Calendar Event** — creates a calendar event with a title, start/end time, location, and description.
- **App Action** — starts a phone call, opens a pre-written SMS/email, or opens a custom app/deep-link URI.

## 2. Complete the form

Fields marked with **\*** are required. Keep QR content as short as practical; very large text can exceed QR capacity or create a dense code that is harder to scan.

For **Calendar Event** fields, date/time values entered without an offset are interpreted using the backend's shared `CUSTOM_TIME_ZONE` setting. The supplied project uses `America/Toronto` by default.

## 3. Choose the package name and quality

- **Full** — recommended; includes web and print sizes.
- **Web** — smaller ZIP for digital use.
- **Print** — higher-resolution output for printed material.

Each ZIP includes QR-only PNG/SVG/PDF files. When **complete exports** are enabled (the QR Creator website always enables them), it also includes website, flyer, poster, business-card, sticker, table-tent, and social-media layouts.

## 4. Complete human verification

Answer the short math question before submitting. The backend validates a signed, time-limited, one-time challenge and applies request-rate limits. In production, the supplied backend requires **Cloudflare Turnstile** by default in addition to the signed challenge. Configure both frontend and backend Turnstile keys before launch.

## 5. Create and download

Select **Create & Download ZIP**. The browser sends an API request to the Django backend, the backend generates the QR package, and the browser downloads the returned ZIP file.

Use **Cancel / Clear** to reset the form.

## Privacy and security notes

The backend records the submitted QR information and the request IP address for audit/abuse prevention. QR input is encrypted at rest in the database. The IP address itself is stored as an IP field because the requested design requires it.

**Wi-Fi passwords are sensitive.** A Wi-Fi QR code necessarily encodes the password inside the QR. Only create or distribute a Wi-Fi QR code when you are authorized to share that network credential.

The generated ZIP does **not** repeat the raw encoded value in its text metadata; it stores only a SHA-256 hash and character count. The QR image itself still contains the encoded data, so treat the ZIP with the same sensitivity as the QR code.

## Buy me a coffee

The support card is optional. The minimum amount is **CAD 5.00**. Clicking the button asks the Django backend to create a one-time Stripe Checkout Session and then redirects the browser to Stripe's hosted checkout page. Card data is not collected by the QR Creator frontend or Django application.

## Main website

Use the **Main website** link at the top or visit `https://founderdesigngroup.ca`.
