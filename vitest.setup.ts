import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

// Aísla los datos locales: cada archivo de test usa un directorio temporal
// propio en vez de tocar el data/tickets.json real del proyecto.
const dir = mkdtempSync(path.join(tmpdir(), 'entradasqr-test-'));
process.env.LOCAL_DATA_DIR = dir;