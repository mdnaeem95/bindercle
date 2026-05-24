# website/

Static marketing + legal site for Bindercle. Four pages:

- [`index.html`](index.html) — landing
- [`privacy.html`](privacy.html) — privacy policy
- [`terms.html`](terms.html) — terms of service
- [`support.html`](support.html) — contact + FAQ
- [`styles.css`](styles.css) — shared styles (dark canvas, Geist + Instrument Serif via Google Fonts)

No build step. Pure HTML/CSS. Fonts loaded from Google Fonts CDN.

## Deploy to Cloudflare Pages

1. **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect
   to Git**. Pick `mdnaeem95/bindercle`. Authorize the GitHub app for
   that repo only.
2. **Build settings**: leave the build command empty.
   **Build output directory**: `website`. **Production branch**: `main`.
   Deploy.
3. After the first deploy, **Custom domains → Set up a custom domain**
   → enter `bindercle.app`. CF will tell you to either add DNS records
   at GoDaddy or change your nameservers.
4. **Move DNS to Cloudflare** (recommended). In Cloudflare → Add a Site
   → `bindercle.app` → Free plan. CF scans your current GoDaddy records
   and gives you two nameservers. Go to GoDaddy → **Domain Settings →
   Nameservers → Change → I'll use my own** and paste them. Wait
   ~1 hour for propagation.
5. Once DNS is on Cloudflare, the Pages custom domain provisions
   automatically (apex + `www` redirect). TLS issues in minutes.

## Email — Cloudflare Email Routing

Once DNS is on Cloudflare, you get free forwarding from any address
on `bindercle.app` to your real inbox:

1. Cloudflare dashboard → **Email → Email Routing → Get started**.
2. Add MX + SPF records (one click).
3. Add custom addresses:
   - `pika@bindercle.app → naeemsani95@gmail.com`
   - `privacy@bindercle.app → naeemsani95@gmail.com`
   - `security@bindercle.app → naeemsani95@gmail.com`
   - `abuse@bindercle.app → naeemsani95@gmail.com`
4. Verify your destination inbox via the confirmation email Cloudflare
   sends.

These mailboxes (especially `privacy@` and `pika@`) need to be working
before App Store review — Apple sends test mail to the privacy contact.

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
