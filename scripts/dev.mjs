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
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

console.log('[dev] Membangun Cloud Functions sebelum menjalankan emulator...');
const buildFunctions = spawn(npmCmd, ['--workspace=functions', 'run', 'build'], {
  cwd: rootDir,
  env,
  stdio: 'inherit',
  shell: isWin,
});

buildFunctions.on('exit', (code) => {
  if (code !== 0) {
    process.exit(code ?? 1);
  }

  console.log('[dev] Menjalankan Firebase Emulators + Functions watch + Vite...');
  const procs = [
    spawn(npxCmd, ['firebase', 'emulators:start', '--project', 'demo-himasri'], {
      cwd: rootDir,
      env,
      stdio: 'inherit',
      shell: isWin,
    }),
    spawn(npmCmd, ['--workspace=functions', 'run', 'build:watch'], {
      cwd: rootDir,
      env,
      stdio: 'inherit',
      shell: isWin,
    }),
    spawn(npmCmd, ['--workspace=web', 'run', 'dev'], {
      cwd: rootDir,
      env,
      stdio: 'inherit',
      shell: isWin,
    }),
  ];

  const shutdown = () => {
    for (const p of procs) {
      if (!p.killed) {
        p.kill();
      }
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
});
