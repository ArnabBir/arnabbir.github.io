// Run on Linux only. No package installation, privilege change, or network access.
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { labNames } from '../src/content/linux/curriculum.mjs';

if (process.platform !== 'linux') {
  console.error('Linux required: no compilation or runtime verification performed.');
  process.exitCode = 1;
} else {
  const directory = await mkdtemp(path.join(tmpdir(), 'linux-companion-labs-'));
  const source = fileURLToPath(new URL('../src/content/linux/labs/', import.meta.url));
  const execute = (command, args, timeout) => {
    const result = spawnSync(command, args, { timeout, encoding:'utf8', maxBuffer:65536 });
    if (result.error || result.status !== 0) throw Error(`${command}: ${result.error?.message || result.signal || result.status}\n${result.stderr || result.stdout}`);
    return result.stdout.trim();
  };
  try {
    for (const name of labNames) {
      const binary = path.join(directory, name);
      execute(process.env.CC || 'cc', ['-std=c11', '-Wall', '-Wextra', '-Werror', '-O2', '-pthread', path.join(source, `${name}.c`), '-o', binary], 15000);
      const output = execute(binary, [], 5000);
      console.log(`PASS ${name}: ${output}`);
    }
    console.log('All 10 labs compiled and ran successfully on this Linux host.');
  } finally { await rm(directory, { recursive:true, force:true }); }
}
