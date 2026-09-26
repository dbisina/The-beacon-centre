// backend/src/routes/accountDeletionWeb.routes.ts
//
// A public web page at /delete-account where a member can delete their account
// without the app.
//
// Google Play's User Data policy requires apps that let people create an
// account to also give them a web link where they can have it deleted - for
// someone who has already uninstalled the app, "open Settings -> Delete
// account" isn't an answer. This is that link (it goes in Play Console ->
// Data safety -> Delete account URL). Play also requires the page to name the
// app as its store listing does - "TBC online" - so that name appears on it;
// keep it in step with the listing. Deleting in the app still works exactly
// as before; both paths end in AppUserAuthService.deleteAccount, so they
// delete the same things.
//
// The page takes the same email + passcode as the app's sign-in, so it must not
// become a way around sign-in's protections:
//
//   * Credentials are checked by AppUserAuthService.login - the same code the
//     app uses - and every wrong passcode counts against the shared per-email
//     lockout (passcodeThrottle), so failures here and in the app add up.
//   * A per-IP limiter covers one passcode sprayed across many emails.
//   * Nothing here sets or reads a cookie. It's mounted ahead of cookieParser
//     like /give, so the admin refresh cookie is never parsed on this path, and
//     there's no session for a cross-site form to ride on.
//   * CSP allows no script at all and posts only back to this page; the page
//     can't be framed.
//   * Wrong email and wrong passcode give the same answer, so the form can't be
//     used to find out who has an account.
import { Router, Request, Response, NextFunction, urlencoded } from 'express';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';
import { AppUserAuthService, INVALID_CREDENTIALS } from '../services/appUserAuth.service';
import { passcodeThrottle, throttleKey } from '../middleware/loginThrottle';

const router = Router();

function esc(value: string | null | undefined): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );
}

function harden(res: Response, nonce: string): void {
  res.set(
    'Content-Security-Policy',
    [
      "default-src 'none'",
      `style-src 'nonce-${nonce}'`,
      "base-uri 'none'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );
  res.set('Cache-Control', 'no-store');
  res.set('Referrer-Policy', 'no-referrer');
  res.set('X-Frame-Options', 'DENY');
}

function send(res: Response, status: number, body: string): void {
  const nonce = randomBytes(16).toString('base64');
  harden(res, nonce);
  res.status(status).type('html').send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Delete your TBC online account &middot; The Beacon Centre</title>
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
  h1 { font-size: clamp(28px, 7vw, 36px); line-height: 1.12; letter-spacing: -.02em; margin: 10px 0 0; }
  .lede, .note { color: #6B665F; }
  .lede { margin: 12px 0 0; }
  .note { font-size: 14px; }
  .card { background: #fff; border-radius: 20px; padding: 22px; margin-top: 18px; box-shadow: 0 1px 2px rgba(18,16,15,.06), 0 8px 24px rgba(18,16,15,.05); }
  .card h2 { font-size: 18px; margin: 0 0 10px; letter-spacing: -.01em; }
  ul { margin: 0; padding-left: 20px; }
  li { margin: 4px 0; }
  label { display: block; font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #857F77; margin-top: 16px; }
  input[type=email], input[type=password] {
    display: block; width: 100%; margin-top: 6px; font: inherit; font-size: 17px; color: #12100F;
    padding: 12px 14px; min-height: 48px; border: 1px solid #E2DDD5; border-radius: 12px; background: #FBFAF7;
  }
  form > label:first-child { margin-top: 0; }
  .check { display: flex; gap: 10px; align-items: flex-start; text-transform: none; letter-spacing: 0; font-size: 15px; font-weight: 400; color: #12100F; margin-top: 18px; }
  .check input { width: 20px; height: 20px; margin: 2px 0 0; flex: none; }
  button {
    display: block; width: 100%; margin-top: 20px; border: 0; cursor: pointer; font: inherit; font-size: 16px; font-weight: 700;
    color: #fff; background: #B3261E; border-radius: 999px; padding: 12px 18px; min-height: 48px;
  }
  .error { background: #FCEBEA; color: #8C1D18; border-radius: 12px; padding: 12px 14px; margin-top: 18px; font-size: 15px; }
  footer { color: #857F77; font-size: 13px; margin-top: 28px; text-align: center; }
</style>
</head>
<body><main>
  <p class="kicker">TBC online &middot; The Beacon Centre app</p>
  ${body}
  <footer>The Beacon Centre</footer>
</main></body>
</html>`);
}

const WHAT_GOES = `
  <section class="card">
    <h2>What gets deleted</h2>
    <ul>
      <li>Your account: name, email and passcode</li>
      <li>Saved messages, devotionals and notes, and where you stopped listening</li>
      <li>Your CSG memberships and join requests, including the date of birth and address you gave</li>
      <li>Event RSVPs and registration answers</li>
      <li>Prayer requests and messages you sent while signed in</li>
      <li>Notification settings for your account</li>
    </ul>
    <p class="note">Deletion is immediate and can't be undone. If you gave through the Android app,
    the giving records stay for the church's financial accounts &mdash; amount, date, purpose and the
    receipt email &mdash; but are no longer linked to an account.</p>
    <p class="note">Still have the app? You can also do this in <strong>Settings &rarr; Delete account</strong>.</p>
  </section>`;

function formPage(res: Response, status: number, opts: { email?: string; error?: string } = {}): void {
  send(
    res,
    status,
    `<h1>Delete your account</h1>
  <p class="lede">Sign in with the email and passcode you use in the TBC online app to permanently delete your
  account and everything linked to it.</p>
  <section class="card">
    <form method="post" action="/delete-account" autocomplete="on">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" required maxlength="254" autocomplete="email" value="${esc(opts.email)}">
      <label for="passcode">Passcode</label>
      <input id="passcode" name="passcode" type="password" required inputmode="numeric" pattern="[0-9]{4,6}" maxlength="6" autocomplete="current-password">
      <label class="check"><input type="checkbox" name="confirm" value="yes" required>
        <span>I understand my account and data will be deleted permanently.</span></label>
      ${opts.error ? `<p class="error" role="alert">${esc(opts.error)}</p>` : ''}
      <button type="submit">Delete my account</button>
    </form>
  </section>
  ${WHAT_GOES}`
  );
}

// Per IP: one passcode tried against many emails. Only failures count, so a
// member who gets it right first time is never slowed down.
const perIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req: Request, res: Response) =>
    formPage(res, 429, { error: 'Too many attempts from this network. Please try again in 15 minutes.' }),
});

router.get('/delete-account', (_req: Request, res: Response) => formPage(res, 200));

router.post(
  '/delete-account',
  perIpLimiter,
  // Parsed here, not app-wide: this page sits in front of the global body
  // parsers, and two short fields never need more than this.
  urlencoded({ extended: false, limit: '2kb', parameterLimit: 5 }),
  async (req: Request, res: Response) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.slice(0, 254) : '';
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.slice(0, 32) : '';

    if (req.body?.confirm !== 'yes') {
      return formPage(res, 400, { email, error: 'Tick the box to confirm you want to delete your account.' });
    }

    const key = throttleKey(email);
    const wait = passcodeThrottle.retryAfterSeconds(key);
    if (wait > 0) {
      res.set('Retry-After', String(wait));
      return formPage(res, 429, {
        email,
        error: `Too many wrong passcodes for this email. Try again in ${Math.ceil(wait / 60)} minute${wait > 60 ? 's' : ''}.`,
      });
    }

    const auth = await AppUserAuthService.login(email, passcode);
    if (!auth.success) {
      if (auth.error === INVALID_CREDENTIALS) {
        passcodeThrottle.recordFailure(key);
        return formPage(res, 401, { email, error: "That email and passcode don't match an account." });
      }
      // Missing fields, or the database is down: not a guess, so not counted.
      const missing = !email.trim() || !passcode;
      return formPage(res, missing ? 400 : 503, {
        email,
        error: missing ? 'Enter your email and passcode.' : 'Something went wrong on our side. Please try again shortly.',
      });
    }
    passcodeThrottle.reset(key);

    const deleted = await AppUserAuthService.deleteAccount(auth.data.user.id);
    if (!deleted.success) {
      return formPage(res, 503, { email, error: 'Something went wrong on our side and nothing was deleted. Please try again shortly.' });
    }

    send(
      res,
      200,
      `<h1>Your account has been deleted</h1>
  <p class="lede">Your account and the data linked to it have been removed. If the app is still
  signed in on a phone, sign out in Settings &mdash; you can keep using the app as a guest.</p>`
    );
  }
);

router.all('/delete-account', (_req: Request, res: Response) => {
  harden(res, randomBytes(16).toString('base64'));
  res.status(405).set('Allow', 'GET, HEAD, POST').type('text/plain').send('Method not allowed');
});

router.all('/delete-account/*', (_req: Request, res: Response, _next: NextFunction) => {
  harden(res, randomBytes(16).toString('base64'));
  res.status(404).type('text/plain').send('Not found');
});

export default router;
