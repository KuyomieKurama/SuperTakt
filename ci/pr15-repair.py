from pathlib import Path
import runpy
import subprocess

runpy.run_path(str(Path(__file__).with_name('pr15-base.py')), run_name='__main__')

p = Path('apps/local-api/scripts/proof-access.mjs')
s = p.read_text()
old = "    const farMiss = `takt_Z${real.slice(6)}`;"
assert s.count(old) == 1
s = s.replace(old, "    const farMiss = `takt_${real[5] === 'A' ? 'B' : 'A'}${real.slice(6)}`;", 1)
start = s.index('    const measure = (candidate) => {')
end = s.index('    const spread = Math.max(near, far, empty)', start)
s = s[:start] + '''    const candidates = [nearMiss, farMiss, ''];
    check(
      'Alle drei Timing-Kandidaten sind tatsächlich ungültig',
      candidates.every((candidate) => !verifyCredential(candidate, active, nodeSecretDigest).ok),
    );

    // Alle Fälle gemeinsam aufwärmen, auch den leeren Wert. Die bisherigen
    // getrennten Messblöcke verglichen verschiedene JIT-/Lastphasen; damit
    // wurde auf CI wiederholt nur der zuerst gemessene Fall langsamer.
    for (let round = 0; round < 10_000; round += 1) {
      for (const candidate of candidates) verifyCredential(candidate, active, nodeSecretDigest);
    }

    // Pro Runde jeden Fall einmal messen, die Reihenfolge rotieren lassen.
    // Gleiche Stichprobengröße und derselbe Aufrufort für alle Kandidaten;
    // kein Wiederholen bis grün und keine gelockerte 25-Prozent-Grenze.
    const sampleCount = 6000;
    const samples = candidates.map(() => []);
    for (let round = 0; round < sampleCount; round += 1) {
      for (let offset = 0; offset < candidates.length; offset += 1) {
        const index = (round + offset) % candidates.length;
        const t0 = process.hrtime.bigint();
        verifyCredential(candidates[index], active, nodeSecretDigest);
        samples[index].push(Number(process.hrtime.bigint() - t0));
      }
    }
    check(
      'Die Timing-Messung erfasst jeden Fall gleich oft und vollständig',
      samples.length === 3 && samples.every((values) => values.length === sampleCount && values.every((value) => value > 0)),
    );
    const [near, far, empty] = samples.map((values) => {
      values.sort((a, b) => a - b);
      return values[Math.floor(values.length / 2)];
    });
''' + s[end:]
p.write_text(s)
subprocess.run(['git', 'add', str(p)], check=True)
print('Timing-Probe: gemeinsame Aufwärmphase, verschachtelte Messungen, unveränderte Sicherheitsgrenze.')
