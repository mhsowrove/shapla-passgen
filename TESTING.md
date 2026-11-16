# Verification record

Verified on 16 November 2026.

## Automated checks

The included dependency-free `node test.cjs` suite covers:

1. 1,000 generated passwords at minimum, normal and maximum lengths; selected types, exclusions and uniqueness.
2. Invalid settings and missing cryptographic randomness fail closed.
3. Deterministic 32-bit rejection sampling checks for modulo bias.
4. Whole-candidate rejection when a required type is absent.
5. Exact inclusion-exclusion password counts.
6. Length-limited passphrase counts checked against exhaustive small-set permutations.
7. Passphrase length limits, no repeated words, capitalization and random suffixes.
8. PIN filtering and preservation of leading zeros.
9. Unique batches of up to 1,000 passwords and exhausted-space behavior.
10. Username themes, styles, included words and maximum lengths.
11. Wi-Fi escaping, open networks and invalid SSID/password handling.
12. CSV escaping and spreadsheet-formula protection.
13. Local QR rendering and zxcvbn pattern detection.
14. All six additional multilingual dictionaries: normalized unique entries and length-limited generation.

JavaScript syntax checks also passed for the application, core generator, service worker and dictionary data.

A separate development-only jsdom harness simulated 13 interaction groups: initial state and range synchronization; character validation; QR dialogs and secret clearing; passphrase options and replacement; PIN batches; username shortlists and platform presets; strength checking; bulk parsing, duplicates, preservation and four CSV layouts; all five bulk credential styles; Wi-Fi escaping, redaction, print-card construction and invalidation; theme and motion controls; accessible form labels; clipboard interaction; settings links excluding secrets; and mocked breach requests containing only five hash characters. Related checks are grouped together in the harness output. No real user passwords were used or logged.

The test harness lives outside the downloadable project so the production site remains dependency-free. The included core suite is independently runnable without installing any packages.

## Verification limits

The browser preview tool could not connect to the local HTTP server (connection timeout). Real browser visual QA, mobile rendering, system clipboard permission flows, native print layout, SVG-to-PNG export, actual service-worker offline installation, mobile-camera QR scans and live breach-service CORS behavior were not verified. The simulated DOM checks do not establish these behaviors. No cloud administration import was performed; check exported CSV columns against your organization’s latest template before use.

## Manual release checklist

- Open over HTTPS in current Chromium, Firefox and Safari, and check for console/CSP errors.
- Check light, dark and system themes at 320px, 390px, tablet and desktop widths.
- Test keyboard navigation, visible focus, dialog Escape behavior and screen-reader labels. Test reduced motion and the pause control.
- Generate 256-character passwords, several results and a length-limited passphrase; verify text wraps and copying preserves exact contents.
- Test clipboard success and denial/manual copy. Verify no generated secret appears in a settings link.
- Decode a password QR and a Wi-Fi QR, including Unicode SSIDs and punctuation in credentials. Compare with source settings. Set the router credentials separately.
- Try SVG and PNG exports; print the full-page, table and four-card layouts on A4 and Letter.
- Inspect all four CSV formats in a plain-text editor and validate a small test import against the actual cloud or directory template.
- Use only a synthetic test password for a live breach lookup. Confirm that a five-character hash prefix is the only credential-derived data sent.
- Load fully over HTTPS, close/reopen as needed, disconnect and test each generator plus the installed app. The live breach lookup should report its network dependency.
- Publish an updated cache version and verify an existing installation can receive the new static files.
