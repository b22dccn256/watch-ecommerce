import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'backend', 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'payment-alerts.log');

export function alertPaymentIssue({ level = 'warn', type = 'vnpay', message = '', meta = {} } = {}) {
  const ts = new Date().toISOString();
  const line = `${ts} [${level.toUpperCase()}] ${type} - ${message} | ${JSON.stringify(meta)}\n`;
  try {
    fs.appendFileSync(logFile, line);
  } catch (err) {
    console.error('Failed to write payment alert:', err.message);
  }
  // Also log to console for immediate visibility
  if (level === 'error') console.error(line);
  else console.warn(line);
}
