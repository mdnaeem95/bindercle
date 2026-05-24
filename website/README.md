# website/

Static marketing + legal site for Bindercle. Four pages:

- [`index.html`](index.html) — landing
- [`privacy.html`](privacy.html) — privacy policy
- [`terms.html`](terms.html) — terms of service
- [`support.html`](support.html) — contact + FAQ
- [`styles.css`](styles.css) — shared styles (dark canvas, Geist + Instrument Serif via Google Fonts)

No build step. Pure HTML/CSS. Fonts loaded from Google Fonts CDN.

## Deploy to GitHub Pages

The fastest free path:

1. Push this repo (already on GitHub at `mdnaeem95/foilio` — rename to
   `bindercle` first via `gh repo rename bindercle` if you haven't).
2. In the GitHub repo settings → **Pages** → set **Source** to `Deploy
   from a branch`, **Branch** to `main`, **Folder** to `/website`. Save.
3. Wait ~30 sec. You'll get a URL like
   `https://mdnaeem95.github.io/bindercle/`.
4. (Optional) Point the `bindercle.app` domain at it:
   - In your domain registrar, add a CNAME record pointing
     `bindercle.app` (or `www.bindercle.app`) to `mdnaeem95.github.io`.
   - In GitHub Pages settings, add `bindercle.app` as the custom domain
     and enable "Enforce HTTPS."
   - GitHub provisions a Let's Encrypt cert automatically; wait ~10 min.

## Deploy to Cloudflare Pages (alternative)

If you'd rather have a real edge CDN (faster, more headroom):

1. Cloudflare Dashboard → Workers & Pages → Create → connect this repo.
2. Build command: leave empty. Output directory: `website`.
3. Set custom domain `bindercle.app` in Pages settings.
4. CF auto-issues TLS, edge-caches globally, no rate limit.

## Before going live

These docs reference your real email addresses. They're set up in the
HTML to point at:

- `pika@bindercle.app`
- `privacy@bindercle.app`
- `security@bindercle.app`
- `abuse@bindercle.app`
- `pika@bindercle.app`

You'll need at least `support@` and `privacy@` working before App Store
review (Apple checks). Easiest path: set up email forwarding from your
domain registrar (Namecheap, Porkbun, Cloudflare all offer this free) to
your real inbox.

## Honest disclosure

The Privacy Policy and Terms of Service here were drafted as starter
templates tuned to what Bindercle specifically does — they're more
accurate than generic generated docs but they aren't legal advice. If
you can afford a 30-min review with a lawyer in your jurisdiction
(Singapore for you), do it. If not, cross-check against:

- Apple's [App Store Review Guidelines §1.2](https://developer.apple.com/app-store/review/guidelines/#user-generated-content) (UGC requirements)
- Singapore PDPA (Personal Data Protection Act)
- [Termly's template](https://termly.io/products/privacy-policy-generator/) as a sanity check

The "Last updated" dates are set to 24 May 2026. Update them whenever
you make material changes to the policies.
