import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function withJavaPath(env = process.env) {
  const candidates = [
    env.JAVA_HOME ? path.join(env.JAVA_HOME, 'bin') : null,
    'C:\\Android studio1\\jbr\\bin',
    'C:\\Program Files\\Android\\Android Studio\\jbr\\bin',
  ].filter(Boolean);

  const existing = candidates.find((dir) => fs.existsSync(path.join(dir, 'java.exe')) || fs.existsSync(path.join(dir, 'java')));
  const nextEnv = { ...env };
  if (existing) {
    nextEnv.JAVA_HOME = path.dirname(existing);
    nextEnv.PATH = `${existing}${path.delimiter}${nextEnv.PATH || ''}`;
  }
  return nextEnv;
}

const env = withJavaPath();
const isWin = process.platform === 'win32';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

const testCmd = isWin
  ? '"npx vitest run firebase/tests/rules.test.ts"'
  : 'npx vitest run firebase/tests/rules.test.ts';

const child = spawn(
  npxCmd,
  [
    'firebase',
    'emulators:exec',
    '--only',
    'firestore,storage',
    '--project',
    'demo-himasri',
    testCmd,
  ],
  {
    cwd: rootDir,
    env,
    stdio: 'inherit',
    shell: isWin,
  },
);

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
