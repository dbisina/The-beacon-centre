// backend/src/routes/givingWeb.routes.ts
//
// A real, public web page at GET /give — not part of the JSON API, and not a
// way into the admin dashboard.
//
// The dashboard is a separate Next.js application on its own origin
// (beacon-admin, see config/cors.ts); this backend never serves it. What this
// file guarantees is the part that isn't obvious from that separation: even
// though the giving page and the admin API answer on the same host, a visitor
// to /give is given no route, link, form or credential that leads to /api/admin.
//
//   * server.ts mounts this router ahead of cookieParser, so the admin
//     refresh-token cookie is never even parsed on this request; and
//     admin.controller.ts scopes that cookie to /api/admin/auth, so the
//     browser does not send it to /give at all.
//   * The page contains no anchors and no forms, and its CSP is
//     `default-src 'none'` with `form-action 'none'` — there is nothing on it
//     to click through to, and nothing that can post anywhere.
//   * /give is an exact, GET-only endpoint. Anything under /give/... is a flat
//     404 rather than a prefix that resolves onward.
//
// App Store Review Guideline 3.2.2(iv) forbids collecting charitable
// donations inside an app whose organisation is not a Benevity- or
// Candid-approved nonprofit, and permits exactly this instead: "a link to
// your website that launches the default browser or SFSafariViewController
// for users to make a donation". The iOS build's Give tab opens this URL
// (see expo-app/config/giving.ts).
//
// It is served by the backend rather than hard-coded into the church's
// WordPress site for two reasons: the link is then guaranteed to resolve for
// the reviewer, and the bank details come from the same ChurchBankAccount
// rows an admin edits in the dashboard, so the page can never drift out of
// date behind a shipped binary.
import { Router, Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { GivingService } from '../services/giving.service';

const router = Router();

/**
 * Optional dedicated hostname for the giving page, e.g.
 * `GIVING_PUBLIC_ORIGIN=https://give.thebeaconcentre.org`.
 *
 * Mounting the page ahead of cookieParser and scoping the admin cookie stop
 * the credential reaching this page, but they don't change the fact that a
 * page anyone can open shares an origin with the admin API — so a cross-site
 * scripting hole anywhere on that host would still be same-origin with
 * /api/admin. A second hostname closes that: cookies here are host-only (no
 * Domain attribute), so nothing set on the API host is sent to this one, and
 * the guard below leaves the giving host with no API surface to call.
 *
 * Point a second domain at this same service and set the variable. Unset —
 * which is how it ships — nothing below changes any behaviour.
 */
const GIVING_PUBLIC_ORIGIN = process.env.GIVING_PUBLIC_ORIGIN?.trim().replace(/\/+$/, '') || null;

const GIVING_PUBLIC_HOST = (() => {
  if (!GIVING_PUBLIC_ORIGIN) return null;
  try {
    return new URL(GIVING_PUBLIC_ORIGIN).host.toLowerCase();
  } catch {
    // Refuse to boot rather than start up with a security control silently
    // disabled by a typo. A deploy that fails here is visible; one that
    // quietly serves giving from the API origin again is not.
    throw new Error(
      `GIVING_PUBLIC_ORIGIN is not a valid absolute URL: ${process.env.GIVING_PUBLIC_ORIGIN}`
    );
  }
})();

/** True when this request arrived on the dedicated giving hostname. */
export function isGivingHost(req: Request): boolean {
  return !!GIVING_PUBLIC_HOST && req.hostname.toLowerCase() === GIVING_PUBLIC_HOST;
}

/**
 * On the giving hostname, /give is the only thing that exists. Everything
 * else — the whole API, uploads, health — is a flat 404 there, so an attacker
 * who found a way to run script on the giving page would have no admin
 * endpoint on that origin to aim it at.
 *
 * Mount this immediately after the giving router in server.ts.
 */
export function blockApiOnGivingHost(req: Request, res: Response, next: NextFunction): void {
  if (!isGivingHost(req)) {
    next();
    return;
  }
  res.status(404).set('Cache-Control', 'no-store').type('text/plain').send('Not found');
}

/**
 * Send visitors to the canonical giving host once one is configured. An iOS
 * build already in the App Store has the old URL compiled into it, so this
 * redirect is what moves those users onto the isolated origin without waiting
 * for a new binary.
 */
router.use('/give', (req: Request, res: Response, next: NextFunction) => {
  if (!GIVING_PUBLIC_ORIGIN || isGivingHost(req)) {
    next();
    return;
  }
  res.redirect(308, `${GIVING_PUBLIC_ORIGIN}/give`);
});

/** Minimal HTML escaping — every value below is admin-entered free text. */
function esc(value: string | null | undefined): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );
}

function page(body: string, nonce: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Give &middot; The Beacon Centre</title>
<meta name="robots" content="noindex">
<style nonce="${nonce}">
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 28px 20px 56px;
    background: #F3F1EC; color: #12100F;
    font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-text-size-adjust: 100%;
  }
  main { max-width: 560px; margin: 0 auto; }
  .kicker { font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #1C6462; margin: 0; }
  h1 { font-size: clamp(28px, 7vw, 38px); line-height: 1.12; letter-spacing: -.02em; margin: 10px 0 0; }
  .lede { color: #6B665F; margin: 12px 0 0; }
  .card { background: #fff; border-radius: 20px; padding: 22px; margin-top: 18px; box-shadow: 0 1px 2px rgba(18,16,15,.06), 0 8px 24px rgba(18,16,15,.05); }
  .card h2 { font-size: 18px; margin: 0 0 14px; letter-spacing: -.01em; }
  .field { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 0; border-top: 1px solid #F0EDE7; }
  .field:first-of-type { border-top: 0; }
  .label { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #857F77; }
  .value { font-size: 17px; font-weight: 700; margin-top: 3px; word-break: break-word; }
  .value.big { font-size: 22px; letter-spacing: .02em; }
  button.copy {
    flex: none; border: 0; cursor: pointer; font: inherit; font-size: 13px; font-weight: 700;
    color: #04211B; background: #41BBAC; border-radius: 999px; padding: 10px 16px; min-height: 44px;
  }
  button.copy[data-done="1"] { background: #E4F6F3; color: #1C6462; }
  .note { color: #6B665F; font-size: 14px; margin-top: 12px; }
  footer { color: #857F77; font-size: 13px; margin-top: 28px; text-align: center; }
</style>
</head>
<body><main>${body}</main>
<script nonce="${nonce}">
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('button.copy') : null;
    if (!btn) return;
    var text = btn.getAttribute('data-value');
    var done = function () {
      btn.textContent = 'Copied';
      btn.setAttribute('data-done', '1');
      setTimeout(function () { btn.textContent = 'Copy'; btn.removeAttribute('data-done'); }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {});
    }
  });
</script>
</body>
</html>`;
}

/**
 * Headers shared by every response this router produces, including the 404s.
 * `default-src 'none'` means the page may load nothing at all from anywhere —
 * no script, style, image or connection beyond what is nonced inline below.
 */
function harden(res: Response, nonce: string): void {
  res.set(
    'Content-Security-Policy',
    [
      "default-src 'none'",
      `style-src 'nonce-${nonce}'`,
      `script-src 'nonce-${nonce}'`,
      "img-src 'self' data:",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ].join('; ')
  );
  // An admin's dashboard session must never be reachable from a page anyone
  // can open, so nothing here is cached, shared or attributed onward.
  res.set('Cache-Control', 'no-store');
  res.set('Referrer-Policy', 'no-referrer');
  res.set('X-Robots-Tag', 'noindex, nofollow');
  // helmet's app-wide default is SAMEORIGIN; this page is framed by nobody.
  res.set('X-Frame-Options', 'DENY');
}

router.get('/give', async (_req: Request, res: Response) => {
  const result = await GivingService.listBankAccounts();
  const accounts = result.success && result.data ? result.data : [];

  const head = `
    <p class="kicker">The Beacon Centre</p>
    <h1>Give to The Beacon Centre</h1>
    <p class="lede">Tithes, offerings, seed and project giving. Transfer from your bank using the
    details below &mdash; your gift goes straight to the church account.</p>`;

  const body = accounts.length
    ? accounts
        .map(
          (a) => `
    <section class="card">
      <h2>${esc(a.bankName)}</h2>
      <div class="field">
        <div>
          <div class="label">Account number</div>
          <div class="value big">${esc(a.accountNumber)}</div>
        </div>
        <button class="copy" type="button" data-value="${esc(a.accountNumber)}">Copy</button>
      </div>
      <div class="field">
        <div>
          <div class="label">Account name</div>
          <div class="value">${esc(a.accountName)}</div>
        </div>
        <button class="copy" type="button" data-value="${esc(a.accountName)}">Copy</button>
      </div>
      ${a.instructions ? `<p class="note">${esc(a.instructions)}</p>` : ''}
    </section>`
        )
        .join('')
    : `<section class="card">
        <h2>Giving details are being updated</h2>
        <p class="note">Our giving details aren't published right now. Please reach the church
        through the Contact page in the app and we'll send them to you directly.</p>
      </section>`;

  const foot = `<footer>The Beacon Centre &middot; thank you for giving.</footer>`;

  // helmet's default CSP is script-src 'self', which would kill the inline
  // style and copy-button script this page is built from. Replace it for this
  // route with a nonce-based policy rather than loosening it globally.
  const nonce = randomBytes(16).toString('base64');
  harden(res, nonce);
  res.type('html').send(page(head + body + foot, nonce));
});

/**
 * /give is one page, not a directory. Nothing under it exists, and no other
 * verb is accepted — so it can never act as a prefix that walks onward into
 * the API, and it can never receive a submission.
 */
router.all('/give', (_req: Request, res: Response) => {
  harden(res, randomBytes(16).toString('base64'));
  res.status(405).set('Allow', 'GET, HEAD').type('text/plain').send('Method not allowed');
});

router.all('/give/*', (_req: Request, res: Response) => {
  harden(res, randomBytes(16).toString('base64'));
  res.status(404).type('text/plain').send('Not found');
});

export default router;
