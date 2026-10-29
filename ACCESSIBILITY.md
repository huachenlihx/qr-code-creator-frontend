# Accessibility implementation notes

The frontend has been improved with WCAG 2.2 AA as the target, **not certified** as fully conformant.

## Changes
- Keyboard skip link to the main content.
- Visible high-contrast keyboard focus indicator and reduced-motion preferences.
- QR type and donation preset choices expose pressed state.
- Help and Contact modals move focus inside, contain Tab navigation, return focus to their triggers, and respond to Escape.
- Form errors and status messages provide assistive-technology announcements.
- Human-verification refresh and file attachment input have explicit accessible names.
- Forced-colors support for selected states.

## Manual verification still required
- Test every flow with keyboard only, at 200% and 400% zoom, and on a narrow viewport.
- Test with VoiceOver on macOS/iOS and NVDA on Windows, including modal focus and form validation.
- Audit actual rendered foreground/background contrast, including placeholders and disabled controls.
- Test third-party Cloudflare Turnstile and Stripe-hosted pages separately.
- Run axe DevTools or Lighthouse accessibility checks against the deployed site and resolve verified findings.

The target is WCAG 2.2 Level AA; these source changes alone do **not** establish full conformance.
