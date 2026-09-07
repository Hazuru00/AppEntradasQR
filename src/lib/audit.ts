// src/lib/audit.ts
// Registro de auditoría local de acciones administrativas / de consola dev.

import fs from 'fs';
import path from 'path';

const LOG_DIR = process.env.LOCAL_DATA_DIR
  ? path.resolve(process.env.LOCAL_DATA_DIR)
  : path.join(process.cwd(), 'data');
const LOG_FILE = path.join(LOG_DIR, '..', 'logs', 'dev-actions.log');

export type AuditAction =
  | 'UPDATE_TICKET'
  | 'UNREJECT'
  | 'APPROVE'
  | 'REVERT_USED'
  | 'DELETE_TICKET'
  | 'CLEAR_TICKETS'
  | 'MUSIC_UPLOAD'
  | 'MUSIC_DELETE';

function ensureLogFile(): void {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function writeAuditLog(entry: {
  action: AuditAction;
  ticketId?: string;
  details?: string;
}): string {
  try {
    ensureLogFile();
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...entry,
    });
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf-8');
    return LOG_FILE;
  } catch (err) {
    console.error('Error escribiendo auditoría:', err);
    return '';
  }
}