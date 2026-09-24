// Creates (or resets) the App Review demo account.
//
// App Store Review Guideline 2.1(a) - Information Needed: the reviewer needs
// working credentials for every account type in the app. Ours has exactly one
// member role, so one account covers it. Run this before each submission so
// the credentials in App Store Connect's "App Review Information" section are
// guaranteed live, rather than an account someone created by hand months ago
// and has since deleted.
//
//   cd backend &&
//   REVIEW_PASSCODE=<4-6 digits> npx tsx scripts/seed-review-account.ts
//
// The passcode has no default on purpose: this repository is public, and a
// default here would publish the reviewer's credentials. Keep it in the team
// password manager and in App Store Connect only - the two must always match.
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/database';

const EMAIL = (process.env.REVIEW_EMAIL ?? 'appreview@thebeaconcentre.org').toLowerCase();
const PASSCODE = process.env.REVIEW_PASSCODE ?? '';
const NAME = 'App Review';

async function main() {
  if (!/^\d{4,6}$/.test(PASSCODE)) {
    throw new Error('REVIEW_PASSCODE must be 4-6 digits, to match the app\'s passcode rule');
  }

  const passcodeHash = await bcrypt.hash(PASSCODE, 10);

  // Upsert rather than create: re-running must reset the passcode of an
  // existing reviewer account, not fail on the unique email.
  const user = await prisma.appUser.upsert({
    where: { email: EMAIL },
    update: { displayName: NAME, passcodeHash, lastSeenAt: new Date() },
    create: { email: EMAIL, displayName: NAME, passcodeHash, lastSeenAt: new Date() },
  });

  console.log('App Review account ready');
  console.log(`  id:       ${user.id}`);
  console.log(`  email:    ${EMAIL}`);
  console.log('\nPut these in App Store Connect > App Review Information > Sign-In Required.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
