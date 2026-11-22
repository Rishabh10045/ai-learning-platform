// node checks/java-examples.mjs : every Java program the Study Desk shows (all days: main lesson, DSA lane,
// warm-up) must compile and run on JDK 21, and print its "Expected output" exactly when the lesson shows one.
// JAVA=/path/to/java overrides `java` on PATH.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { S, E, codex, createCodexAdapter } from '../ui/checks/codex-load.mjs';

const java = process.env.JAVA || 'java';
const version = execFileSync(java, ['-version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) || '';
const A = createCodexAdapter({ S, E, codex });
const programs = new Map();
for (const d of codex.days) {
  for (const l of ['main', 'lane', 'warmup'].map(k => A.lessonsByDay[d.number][k]).filter(Boolean)) {
    l.notes.forEach((n, i) => {
      if (n.type !== 'code' || n.lang !== 'java' || !/static\s+void\s+main\s*\(/.test(n.text) || programs.has(n.text)) return;
      const next = l.notes[i + 1];
      const expected = next?.type === 'callout' && next.text.startsWith('Expected output:\n') ? next.text.slice('Expected output:\n'.length) : null;
      const cls = (n.text.match(/(?:public\s+)?(?:final\s+)?class\s+(\w+)/) || [])[1] || 'Main';
      programs.set(n.text, { day: d.number, lesson: l.id, cls, expected });
    });
  }
}
// Expected lines may carry a note such as "finalOwner=U1   (finalOwner may be U2 on another run)":
// such a line is matched by shape (each key=value value is a wildcard); every other line must be identical.
function matches(out, expected) {
  const got = out.replace(/\r/g, '').trim().split('\n'), want = expected.replace(/\r/g, '').trim().split('\n');
  if (got.length !== want.length) return false;
  return want.every((w, i) => {
    const m = w.match(/^(.*?)\s{2,}\((.*)\)\s*$/);
    if (!m) return got[i].trimEnd() === w.trimEnd();
    const esc = m[1].trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/=\S+/g, '=\\S+');
    return new RegExp('^' + esc + '$').test(got[i].trim());
  });
}
const dir = mkdtempSync(join(tmpdir(), 'sd-java-'));
let fails = 0;
try {
  for (const [src, p] of programs) {
    const file = join(dir, 'd' + p.day + '-' + p.lesson.replace(/\W/g, '_'), p.cls + '.java');
    execFileSync('mkdir', ['-p', join(file, '..')]);
    writeFileSync(file, src);
    let out = '', err = '';
    try { out = execFileSync(java, [file], { encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { err = (e.stderr || e.message || '').toString().split('\n').slice(0, 6).join('\n'); }
    const ok = !err && (p.expected == null || matches(out, p.expected));
    if (!ok) fails++;
    console.log((ok ? 'PASS ' : 'FAIL ') + `Day ${p.day} ${p.lesson} ${p.cls}.java` + (p.expected == null ? ' (runs)' : ' (output matches)'));
    if (err) console.log('  ' + err.replace(/\n/g, '\n  '));
    else if (!ok) console.log('  expected:\n' + p.expected + '\n  got:\n' + out);
  }
} finally { rmSync(dir, { recursive: true, force: true }); }
console.log(`\n${programs.size - fails}/${programs.size} Java programs compile and run`);
process.exit(fails ? 1 : 0);
