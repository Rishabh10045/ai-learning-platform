// node checks/sql-fixtures.mjs [--write-expected] : runs every PostgreSQL lab of the main lessons (main-labs.js).
//  1. Starts a throwaway PostgreSQL cluster (initdb + pg_ctl from PG_BIN or /usr/lib/postgresql/<newest>/bin),
//     listening on 127.0.0.1 and a private socket directory, trust auth, deleted at the end.
//  2. SQL fixtures: for each one, a fresh database runs booking/sql/schema.sql, helpers.sql and the scenario with
//     psql -X -q -v ON_ERROR_STOP=1 -tA -F ' | ', and stdout must equal booking/sql/expected/<scenario>.out.
//  3. JDBC labs (booking/jdbc/*.java): downloads the pinned PostgreSQL JDBC driver (sha256-checked) and runs
//     `java -cp <driver> <file>` with BOOKING_DB_URL set; stdout must equal the lab's expected output in main-labs.js.
// Without PostgreSQL server binaries the run is SKIPPED (exit 0) locally, and FAILS when CI=true or REQUIRE_PG=1.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mainLabs } from '../main-labs.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const java = process.env.JAVA || 'java';
const write = process.argv.includes('--write-expected');
const required = process.env.CI === 'true' || process.env.REQUIRE_PG === '1';
export const PGJDBC = { version: '42.7.4', sha256: '188976721ead8e8627eb6d8389d500dccc0c9bebd885268a3047180274a6031e',
  url: 'https://repo1.maven.org/maven2/org/postgresql/postgresql/42.7.4/postgresql-42.7.4.jar' };

function pgBin() {
  if (process.env.PG_BIN) return process.env.PG_BIN;
  const base = '/usr/lib/postgresql';
  if (!existsSync(base)) return null;
  const versions = readdirSync(base).filter(v => existsSync(join(base, v, 'bin', 'initdb'))).sort((a, b) => b - a);
  return versions.length ? join(base, versions[0], 'bin') : null;
}
const freePort = () => new Promise(res => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });

async function driverJar() {
  const dir = process.env.PGJDBC_DIR || join(tmpdir(), 'study-desk-pgjdbc');
  const jar = join(dir, 'postgresql-' + PGJDBC.version + '.jar');
  const ok = () => existsSync(jar) && createHash('sha256').update(readFileSync(jar)).digest('hex') === PGJDBC.sha256;
  if (!ok()) {
    mkdirSync(dir, { recursive: true });
    const r = await fetch(PGJDBC.url);
    if (!r.ok) throw new Error('driver download failed: HTTP ' + r.status + ' ' + PGJDBC.url);
    writeFileSync(jar, Buffer.from(await r.arrayBuffer()));
    if (!ok()) throw new Error('driver sha256 mismatch for ' + jar);
  }
  return jar;
}

const bin = pgBin();
if (!bin) {
  console.log((required ? 'FAIL' : 'SKIPPED') + ': no PostgreSQL server binaries (set PG_BIN to the directory with initdb and pg_ctl).');
  process.exit(required ? 1 : 0);
}
const labs = Object.values(mainLabs);
const fixtures = labs.flatMap(l => (l.sql || []).map(file => ({ day: l.day, file })));
const jdbc = labs.filter(l => l.runner === 'postgres');
const work = mkdtempSync(join(tmpdir(), 'sd-pg-'));
const data = join(work, 'data'), port = await freePort();
const pgVersion = execFileSync(join(bin, 'postgres'), ['--version'], { encoding: 'utf8' }).trim();
let fails = 0, ran = 0;
try {
  execFileSync(join(bin, 'initdb'), ['-D', data, '-U', 'postgres', '-A', 'trust', '--no-sync', '-E', 'UTF8', '--locale=C'], { stdio: 'pipe' });
  execFileSync(join(bin, 'pg_ctl'), ['-D', data, '-w', '-l', join(work, 'server.log'), '-o',
    `-p ${port} -k ${work} -c listen_addresses=127.0.0.1 -c fsync=off -c max_connections=40`, 'start'], { stdio: 'pipe' });
  console.log(`${pgVersion} on 127.0.0.1:${port} (throwaway cluster in ${work})`);
  const psql = (db, args, input) => spawnSync(join(bin, 'psql'), ['-h', work, '-p', String(port), '-U', 'postgres', '-X', '-q', '-v', 'ON_ERROR_STOP=1', ...args, db], { encoding: 'utf8', input });
  let dbn = 0;
  const freshDb = () => { const name = 'lab' + (++dbn); const r = psql('postgres', ['-c', 'CREATE DATABASE ' + name]); if (r.status) throw new Error(r.stderr); return name; };

  for (const f of fixtures) {
    const name = f.file.split('/').pop().replace(/\.sql$/, '');
    const expectedFile = join(root, 'booking/sql/expected', name + '.out');
    const r = psql(freshDb(), ['-tA', '-F', ' | ', '-f', join(root, 'booking/sql/schema.sql'), '-f', join(root, 'booking/sql/helpers.sql'), '-f', join(root, f.file)]);
    ran++;
    if (write && r.status === 0) writeFileSync(expectedFile, r.stdout);
    const expected = existsSync(expectedFile) ? readFileSync(expectedFile, 'utf8') : null;
    const ok = r.status === 0 && expected === r.stdout;
    if (!ok) fails++;
    console.log(`${ok ? 'PASS' : 'FAIL'} Day ${f.day} ${f.file} (psql, output matches booking/sql/expected/${name}.out)`);
    if (!ok) console.log('  stderr: ' + (r.stderr || '').trim().split('\n').slice(0, 5).join('\n  ') + (expected == null ? '\n  missing expected file' : '\n  got:\n' + r.stdout));
  }
  if (jdbc.length) {
    const jar = await driverJar();
    for (const l of jdbc) {
      const db = freshDb();
      const r = spawnSync(java, ['-cp', jar, join(root, l.file)], { encoding: 'utf8', timeout: 120000,
        env: { ...process.env, BOOKING_DB_URL: `jdbc:postgresql://127.0.0.1:${port}/${db}?user=postgres` } });
      ran++;
      const ok = r.status === 0 && r.stdout.replace(/\r/g, '').trim() === l.output.trim();
      if (!ok) fails++;
      console.log(`${ok ? 'PASS' : 'FAIL'} Day ${l.day} ${l.file} (JDBC ${PGJDBC.version}, output matches the lesson)`);
      if (!ok) console.log('  stderr: ' + (r.stderr || r.error?.message || '').trim().split('\n').slice(0, 6).join('\n  ') + '\n  expected:\n' + l.output + '\n  got:\n' + r.stdout);
    }
  }
} finally {
  spawnSync(join(bin, 'pg_ctl'), ['-D', data, '-m', 'immediate', 'stop'], { stdio: 'ignore' });
  rmSync(work, { recursive: true, force: true });
}
console.log(`\n${ran - fails}/${ran} PostgreSQL labs pass (${fixtures.length} SQL fixtures, ${jdbc.length} JDBC programs) on ${pgVersion}`);
process.exit(fails ? 1 : 0);
