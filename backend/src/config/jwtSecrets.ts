// backend/src/config/jwtSecrets.ts
//
// The one place JWT secrets are read.
//
// The admin middleware already refused to boot in production without its
// secrets, but the member-auth paths (appUserAuth.service.ts, which signs member
// tokens, and user.middleware.ts, which verifies them) each read JWT_SECRET
// themselves with their own hardcoded fallback. They happened to be safe only
// because the admin middleware is imported first and would have thrown - an
// accident of import order, not a guarantee. Reading the secrets here, once,
// makes the guard apply to every signer and verifier.
//
// Locally the dev literals keep `npm run dev` working with no .env; they can
// never sign a production token.

const isProduction = process.env.NODE_ENV === 'production';

function readSecret(name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET', devFallback: string): string {
  const value = process.env[name];
  if (value) return value;
  if (isProduction) {
    throw new Error(`${name} must be set in production`);
  }
  return devFallback;
}

/** Signs and verifies admin access tokens and member tokens. */
export const JWT_SECRET = readSecret('JWT_SECRET', 'beacon-centre-dev-secret-key');

/** Signs and verifies admin refresh tokens. */
export const JWT_REFRESH_SECRET = readSecret('JWT_REFRESH_SECRET', 'beacon-centre-dev-refresh-secret');
