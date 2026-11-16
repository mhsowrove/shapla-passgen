# Shapla Passgen

An independent, static password toolkit with an original minimal design, light and dark themes, a slow animated background, reduced-motion support, Shapla water-lily logo, favicon, header and footer.

**Developer credit: MD. SOWORVE HOSSAIN**

Plain HTML, CSS and JavaScript. No backend, database, account, package installation, or build step. Third-party browser libraries and dictionaries are bundled locally. Passwords are never persisted by the app.

## Open or deploy

For a quick look, open `index.html` in a current browser. HTTPS or localhost is recommended: clipboard access, service workers and the optional breach lookup depend on a secure context. If secure randomness is missing, generation fails closed. Automatic clipboard failure opens a manual-copy dialog.

### GitHub Pages

1. Create a repository and upload **all the files and folders inside this project** to its root. Keep `vendor/` and all word-list files together with `index.html`.
2. Open the repository’s **Settings → Pages**.
3. Select **Deploy from a branch**, select your branch (normally `main`), and select **/ (root)**. Save.
4. Open the published URL shown by GitHub after deployment finishes.

Relative paths support both `https://name.github.io/` and `https://name.github.io/repo/`. The `.nojekyll` file avoids Jekyll processing. You do not need a framework or custom build workflow. GitHub’s own publication workflow still runs. Keep attribution and license files when redistributing.

Official reference: [Configure a GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

### Local server (optional)

If Python is installed, run this from the project directory:

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. This is only a local preview helper; deployed visitors need no Python or Node installation.

## Tools

| Tool | Included controls and actions |
| --- | --- |
| Password | 6–256 characters; uppercase, lowercase, digits and symbols; all/common/custom punctuation; look-alikes; exclusions; required types; 1–16 unique results; per-result and copy-all; settings links; private QR; everyday/readable/terminal presets. |
| Passphrase | 3–12 distinct words; seven word-list languages plus short English; fixed/custom separators or random digits; lowercase/title/uppercase; digit and symbol suffixes at random word positions; exact length-limited sampling; 1–16 results; copy, settings links, QR and individual word replacement. |
| Username | Mixed, gamer, fantasy, space, cute, aesthetic, funny and random-word themes; five styles; 15 platform presets including generic; maximum length; included word; optional number; 1–3 random words; more/new names; copy and a session-only shortlist. |
| PIN | 4–12 digits, optional easy-code filter, 1–16 unique results, leading zeros, copy and settings links. |
| Check | Bundled zxcvbn analysis; pattern feedback; optional show/hide; illustrative guessing scenarios at three attacker sizes; explicit optional Have I Been Pwned lookup. |
| Bulk | 1–1,000 accounts or pasted names/emails; five credential styles; domain and unique generated usernames; password preservation for unchanged list rows; four CSV formats; copy; individual copy; printed slips with heading and sign-in location. |
| Wi-Fi | SSID, password, WPA/WPA2/WPA3, legacy WEP/open networks, hidden network; generated password or passphrase; escaped standard QR payload; local PNG/SVG export; on-screen code; full-page, folding table and four-card prints; heading, note and optional translated print labels. |

The app caches only static assets for offline use after a complete visit over HTTPS. Install prompts vary by browser. On iPhone use Safari → Share → Add to Home Screen. The app caches dictionary data and scripts, **never passwords or breach results**. The optional breach lookup always needs internet. Test offline availability before depending on it. When publishing an update, change the cache version in `sw.js`; existing tabs may need to close and reopen before a newly installed worker activates.

Theme, animation preference and shortlisted usernames are deliberately session-only. The background can be paused using the header button; the system’s reduced-motion setting disables it automatically.

## Generation and entropy

Random indices use `crypto.getRandomValues()` and rejection sampling of 32-bit integers. There is no `Math.random()` fallback. Passwords are drawn from disjoint character sets. If every selected type is required, the entire candidate is rejected if it is missing a type, giving a uniform distribution over valid strings. Exact inclusion-exclusion counts that valid space.

The look-alike toggle covers `0 O o 1 I i L l`. Custom symbols accept deduplicated ASCII punctuation; other input is ignored. An empty selected type or invalid length produces an error rather than silently reducing requirements.

Passphrases draw distinct words. Exact integer dynamic programming counts ordered choices under a maximum length; sampling chooses the next word length in proportion to the valid completions, then a uniform unused word of that length. Fixed separators and capitalization add no entropy. Random separators and suffix choices do. Dictionaries are normalized to lowercase ASCII and deduplicated to avoid casing collisions or incompatible keyboard requirements. Individual word replacement hides the estimate because manual selection can introduce bias.

Displayed entropy is `log2(valid output count)`, approximated from leading integer bits and rounded to one decimal. Strength labels are illustrative, with thresholds at 40, 60 and 80 bits. They do not predict account compromise. The checker instead uses zxcvbn’s pattern model; its guesses and the three hardware scenarios are estimates, not guarantees or benchmarks. The checker input is limited to 128 characters to bound analysis work.

Shapla’s PIN filter removes sequences, limited-character codes, mirrors, repeated halves, many dates and years, and selected common codes. It is an independent rule set, not Passgen’s proprietary list. No precise filtered-PIN entropy is claimed. Short PINs and the children’s bulk style are suitable only where attempts are limited.

## Privacy and breach lookup

- No passwords, Wi-Fi credentials, pasted account lists or checked passwords are sent to Shapla or saved in browser storage.
- Only an explicit click on the breach button sends an external request. SHA-1 is computed locally; only its first five hexadecimal characters are sent to `api.pwnedpasswords.com/range/`. The browser requests response padding, omits credentials and referrer, and disables request caching. No request is made for every keystroke. Editing the password aborts an outstanding lookup; stale responses are ignored.
- Have I Been Pwned receives the prefix and ordinary connection metadata such as IP address. A no-match result is not proof of safety. An unavailable or timed-out service is reported as such.
- Settings links contain only generation settings, never generated secrets, nicknames, names, checked passwords or Wi-Fi credentials. Names and account lists are not shareable settings.
- Browser memory, extensions, device compromise, clipboard history, browser session restoration, screenshots, printed cards and downloaded plaintext files are outside the app’s control. JavaScript cannot guarantee secure memory erasure.
- Hosting providers receive normal visits and asset requests. The optional offline cache stores public application files. No analytics, remote fonts or runtime CDN libraries are used.

The meta Content Security Policy permits connections only to this origin and the breach endpoint, and scripts only from this origin. On custom hosting you may additionally set HTTP headers such as `frame-ancestors`, `X-Content-Type-Options` and a Permissions Policy. GitHub Pages does not provide per-project custom response-header configuration.

## CSV and printed credentials

Standard CSV, Microsoft Entra, Google Workspace and Active Directory export layouts are provided. Names that look like spreadsheet formulas are prefixed with an apostrophe in exports, which changes the exported display name. Generated passwords never begin with a spreadsheet formula marker. Do not remove this protection in untrusted data.

Cloud formats require an email address for every account; add a domain when generating usernames. AD export checks collisions after the 20-character `SamAccountName` limit. “Change password at next sign-in” is represented in standard CSV, Google and AD files; Microsoft Entra’s bulk-create template does not offer that setting, so configure it in your administration workflow. Test a small import against the **current template supplied by your organization**, including its password policy, before importing a full batch. This static site cannot validate your organization’s tenant or create accounts.

Reference: [Microsoft bulk-user CSV guidance](https://learn.microsoft.com/en-us/entra/identity/users/users-bulk-add), [Google Workspace CSV guidance](https://support.google.com/a/answer/40057).

Only distribute each person’s own slip, and handle plaintext CSV exports carefully. The QR code itself contains the secret in readable form. Scan-test Wi-Fi codes against your router before printing. The SVG/PNG download is the QR code; use Print → Save as PDF for a complete sign.

## Reference-site differences

All seven tool categories are implemented, with an original design and independent source. Shapla does not copy Passgen.co’s articles, proprietary dictionaries, breach corpus, brand or PIN blacklist.

The interface is English. Word lists support English, German, Spanish, French, Italian, Catalan and Brazilian Portuguese, transliterated to Latin letters; not every reference-site locale is included. The short-English list is filtered from EFF’s long list. Multilingual lists may contain names, dated terms or words unsuitable for some audiences; they are not represented as a child-safe vocabulary. Username themes use original compact English lists, and platform presets are compatibility aids rather than availability checks. Shortlists stay in memory rather than persisting. The checker uses zxcvbn and an optional live breach lookup instead of a bundled million-password breach corpus. Generation uses uniform rejection rather than forced-character shuffling, and speculative cracking times are limited to the checker’s labeled scenarios. Promotional password-manager recommendations, marketing articles and cookie controls are not replicated; Shapla has no cookies.

## Tests

Run the included dependency-free test suite with Node 18 or newer:

```sh
node test.cjs
node --check core.js
node --check app.js
node --check sw.js
```

See `TESTING.md` for completed checks and verification limits. No developer tools or packages are needed to deploy or use the website.

## Customize

- Footer credit: edit `index.html`.
- Colors and motion: edit CSS variables and ambient animation in `style.css`.
- Logo: `logo.svg`; favicon: `favicon.svg` and `favicon-32.png`; installation icons: `icon-192.png` and `icon-512.png`. Interface icons are original inline SVGs in `icons.js`.
- Character sets, PIN policy and username vocabularies: `core.js`.
- Offline asset list and release cache name: `sw.js`.

The original Shapla code is MIT licensed. Third-party data and libraries retain their own licenses; see `THIRD-PARTY.md` and `vendor/`.
