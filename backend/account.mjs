import { accountPasswordHash, openStudyDatabase, setAccount } from './database.mjs';

const email = process.argv[2];
if (!email) {
  process.stderr.write('Usage: node backend/account.mjs user@example.com < password-on-stdin\n');
  process.exitCode = 1;
} else {
  process.stdin.setEncoding('utf8');
  let password = '';
  for await (const part of process.stdin) {
    password += part;
    if (password.length > 260) throw new Error('Password input is too long.');
  }
  const hash = await accountPasswordHash(password.replace(/\r?\n$/, ''));
  const db = openStudyDatabase();
  try {
    setAccount(db, email, hash);
    process.stdout.write('Study account is ready. Existing progress was preserved.\n');
  } finally {
    db.close();
  }
}
