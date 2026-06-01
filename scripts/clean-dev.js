#!/usr/bin/env node
// scripts/clean-dev.js
// Kill processes listening on ports 5173 and 5000 (cross-platform best-effort)
import { execSync } from 'child_process';
import os from 'os';

const ports = [5173, 5000];

function killPid(pid) {
  try {
    if (os.platform().startsWith('win')) {
      execSync(`taskkill /PID ${pid} /F /T`, { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGKILL');
    }
    console.log(`Killed PID ${pid}`);
  } catch (e) {
    // ignore
  }
}

function findAndKill(port) {
  try {
    if (os.platform().startsWith('win')) {
      const out = execSync(`netstat -ano | findstr :${port}`).toString();
      const lines = out.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        const parts = line.split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(Number(pid))) {
          killPid(pid);
        }
      }
    } else {
      const out = execSync(`lsof -i :${port} -t || true`).toString();
      const pids = out.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const pid of pids) {
        killPid(pid);
      }
    }
  } catch (e) {
    // ignore
  }
}

for (const p of ports) {
  console.log(`Cleaning port ${p}...`);
  findAndKill(p);
}

console.log('clean-dev finished');
