import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function poblarBaseDeDatos() {
  const client = await pool.connect();
  try {
    const checkRes = await client.query('SELECT COUNT(*) FROM espacios');
    const totalActual = parseInt(checkRes.rows[0].count, 10);
    console.log(`[Seed] Total de espacios actuales en PostgreSQL: ${totalActual}`);

    if (totalActual < 100) {
      console.log('[Seed] Poblando base de datos desde seed_data.sql...');
      const sqlPath = path.join(__dirname, '../database/seed_data.sql');
      if (fs.existsSync(sqlPath)) {
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sqlContent);
        console.log('[Seed] ¡Base de datos poblada exitosamente con todos los registros históricos!');
      }
    }
  } catch (err) {
    console.error('[Seed] Error al poblar base de datos:', err);
  } finally {
    client.release();
  }
}
