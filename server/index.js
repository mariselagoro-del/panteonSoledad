import process from 'node:process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool, initDb } from './db.js';
import { poblarBaseDeDatos } from './seed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// 1. Healthcheck
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', database: 'connected', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: err.message });
  }
});

// 2. Obtener todos los espacios con sus difuntos y documentos
app.get('/api/espacios', async (req, res) => {
  try {
    const espaciosRes = await pool.query(`
      SELECT e.*, t.nombre_completo AS titular_nombre_completo, t.telefono AS titular_telefono, 
             t.correo AS titular_correo, t.direccion AS titular_direccion
      FROM espacios e
      LEFT JOIN titulares t ON e.titular_id = t.id
      ORDER BY e.id ASC
    `);

    if (espaciosRes.rows.length === 0) {
      return res.json([]);
    }

    const difuntosRes = await pool.query('SELECT * FROM difuntos ORDER BY id ASC');
    const docsRes = await pool.query('SELECT * FROM documentos_expediente ORDER BY id ASC');

    const difuntosPorEspacio = new Map();
    for (const d of difuntosRes.rows) {
      if (!difuntosPorEspacio.has(d.espacio_id)) {
        difuntosPorEspacio.set(d.espacio_id, []);
      }
      difuntosPorEspacio.get(d.espacio_id).push({
        id: d.id,
        nombre: d.nombre_completo,
        curp: d.curp || '',
        edad: d.edad,
        fechaDefuncion: d.fecha_defuncion,
        fechaInhumacion: d.fecha_inhumacion,
        causaMuerte: d.causa_muerte || '',
        observaciones: d.observaciones || ''
      });
    }

    const docsPorCodigo = new Map();
    for (const doc of docsRes.rows) {
      const cod = (doc.codigo_espacio || '').toUpperCase();
      if (!docsPorCodigo.has(cod)) {
        docsPorCodigo.set(cod, {});
      }
      docsPorCodigo.get(cod)[doc.doc_id] = {
        id: doc.doc_id,
        docId: doc.doc_id,
        codigo: doc.codigo_espacio,
        titulo: doc.titulo,
        categoria: doc.categoria,
        nombre: doc.nombre_archivo,
        tipo: doc.tipo_mime,
        tamano: doc.tamano_formateado,
        tamanoBytes: parseInt(doc.tamano_bytes || '0', 10),
        dataUrl: doc.data_url,
        titularNombre: doc.titular_nombre,
        difuntoNombre: doc.difunto_nombre,
        fechaSubida: doc.fecha_subida,
        horaSubida: doc.hora_subida,
        adjuntado: true
      };
    }

    const espaciosCompletos = espaciosRes.rows.map(row => {
      const codUpper = (row.codigo || '').toUpperCase();
      const docs = docsPorCodigo.get(codUpper) || {};

      return {
        id: row.id,
        codigo: row.codigo,
        tipoEspacio: row.tipo,
        seccionNombre: row.seccion,
        numeroEspacio: row.numero_fosa,
        titularNombre: row.titular_nombre_completo || '',
        titularTelefono: row.titular_telefono || '',
        titularCorreo: row.titular_correo || '',
        titularDireccion: row.titular_direccion || '',
        estatusOcupacion: row.estatus_ocupacion,
        estatusPago: row.estatus_pago,
        coordenadas: row.coordenadas,
        observaciones: row.observaciones,
        historialDifuntos: difuntosPorEspacio.get(row.id) || [],
        expediente: {
          documentos: docs,
          ultimaActualizacion: row.created_at
        }
      };
    });

    res.json(espaciosCompletos);
  } catch (err) {
    console.error('Error al obtener espacios:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Guardar o actualizar un espacio completo
app.post('/api/espacios', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const espacio = req.body;
    const codigoUpper = (espacio.codigo || '').trim().toUpperCase();

    if (!codigoUpper) {
      throw new Error('El código de espacio es requerido');
    }

    // 1. Titular (Crear o actualizar)
    let titularId = null;
    if (espacio.titularNombre) {
      const espActual = await client.query('SELECT titular_id FROM espacios WHERE UPPER(TRIM(codigo)) = $1', [codigoUpper]);
      if (espActual.rows.length > 0 && espActual.rows[0].titular_id) {
        titularId = espActual.rows[0].titular_id;
        await client.query(
          `UPDATE titulares SET nombre_completo = $1, telefono = $2, correo = $3, direccion = $4 WHERE id = $5`,
          [espacio.titularNombre, espacio.titularTelefono || '', espacio.titularCorreo || '', espacio.titularDireccion || '', titularId]
        );
      } else {
        const titRes = await client.query(
          `INSERT INTO titulares (nombre_completo, telefono, correo, direccion)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [espacio.titularNombre, espacio.titularTelefono || '', espacio.titularCorreo || '', espacio.titularDireccion || '']
        );
        titularId = titRes.rows[0].id;
      }
    }

    // 2. Espacio
    const espRes = await client.query(
      `INSERT INTO espacios (codigo, tipo, seccion, numero_fosa, titular_id, estatus_ocupacion, estatus_pago, coordenadas, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (codigo) DO UPDATE SET
         tipo = EXCLUDED.tipo,
         seccion = EXCLUDED.seccion,
         numero_fosa = EXCLUDED.numero_fosa,
         titular_id = COALESCE(EXCLUDED.titular_id, espacios.titular_id),
         estatus_ocupacion = EXCLUDED.estatus_ocupacion,
         estatus_pago = EXCLUDED.estatus_pago,
         observaciones = EXCLUDED.observaciones
       RETURNING id`,
      [
        codigoUpper,
        espacio.tipoEspacio || 'Fosa',
        espacio.seccionNombre || 'Sección 1',
        espacio.numeroEspacio || '',
        titularId,
        espacio.estatusOcupacion || 'Disponible',
        espacio.estatusPago || 'Al Corriente',
        espacio.coordenadas || '',
        espacio.observaciones || ''
      ]
    );

    const espacioDbId = espRes.rows[0].id;

    // 3. Difuntos (Sincronizar historial completo)
    await client.query('DELETE FROM difuntos WHERE espacio_id = $1', [espacioDbId]);
    if (Array.isArray(espacio.historialDifuntos) && espacio.historialDifuntos.length > 0) {
      for (const dif of espacio.historialDifuntos) {
        if (dif.nombre && dif.nombre.trim()) {
          await client.query(
            `INSERT INTO difuntos (espacio_id, nombre_completo, curp, edad, fecha_defuncion, fecha_inhumacion, causa_muerte)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              espacioDbId,
              dif.nombre.trim(),
              dif.curp ? dif.curp.trim() : '',
              dif.edad && !isNaN(parseInt(dif.edad, 10)) ? parseInt(dif.edad, 10) : null,
              dif.fechaDefuncion || null,
              dif.fechaInhumacion || null,
              dif.causaMuerte ? dif.causaMuerte.trim() : ''
            ]
          );
        }
      }
    }

    // 4. Documentos del expediente si vienen adjuntos
    const docs = espacio.expediente?.documentos || espacio.documentos;
    if (docs && typeof docs === 'object') {
      for (const [docId, doc] of Object.entries(docs)) {
        if (doc && (doc.dataUrl || doc.adjuntado)) {
          await client.query(
            `INSERT INTO documentos_expediente 
             (espacio_id, codigo_espacio, doc_id, titulo, categoria, nombre_archivo, tipo_mime, tamano_formateado, tamano_bytes, data_url, titular_nombre, difunto_nombre, fecha_subida, hora_subida)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (codigo_espacio, doc_id) DO UPDATE SET
               titulo = EXCLUDED.titulo,
               categoria = EXCLUDED.categoria,
               nombre_archivo = EXCLUDED.nombre_archivo,
               tipo_mime = EXCLUDED.tipo_mime,
               tamano_formateado = EXCLUDED.tamano_formateado,
               tamano_bytes = EXCLUDED.tamano_bytes,
               data_url = EXCLUDED.data_url,
               titular_nombre = EXCLUDED.titular_nombre,
               difunto_nombre = EXCLUDED.difunto_nombre,
               fecha_subida = EXCLUDED.fecha_subida,
               hora_subida = EXCLUDED.hora_subida`,
            [
              espacioDbId,
              codigoUpper,
              docId,
              doc.titulo || docId,
              doc.categoria || 'general',
              doc.nombre || 'archivo.jpg',
              doc.tipo || 'image/jpeg',
              doc.tamano || 'N/D',
              doc.tamanoBytes || 0,
              doc.dataUrl || '',
              espacio.titularNombre || doc.titularNombre || '',
              espacio.historialDifuntos?.[0]?.nombre || doc.difuntoNombre || '',
              doc.fechaSubida || new Date().toISOString().split('T')[0],
              doc.horaSubida || ''
            ]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, codigo: codigoUpper, id: espacioDbId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al guardar espacio:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 4. Obtener archivos adjuntos de un espacio
app.get('/api/espacios/:codigo/adjuntos', async (req, res) => {
  try {
    const { codigo } = req.params;
    const codigoUpper = (codigo || '').trim().toUpperCase();

    const result = await pool.query(
      `SELECT * FROM documentos_expediente WHERE UPPER(TRIM(codigo_espacio)) = $1 ORDER BY id ASC`,
      [codigoUpper]
    );

    const adjuntos = result.rows.map(row => ({
      id: row.doc_id,
      docId: row.doc_id,
      codigo: row.codigo_espacio,
      titulo: row.titulo,
      categoria: row.categoria,
      nombre: row.nombre_archivo,
      tipo: row.tipo_mime,
      tamano: row.tamano_formateado,
      tamanoBytes: parseInt(row.tamano_bytes || '0', 10),
      dataUrl: row.data_url,
      titularNombre: row.titular_nombre,
      difuntoNombre: row.difunto_nombre,
      fechaSubida: row.fecha_subida,
      horaSubida: row.hora_subida,
      adjuntado: true
    }));

    res.json(adjuntos);
  } catch (err) {
    console.error('Error al obtener adjuntos:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Guardar o actualizar un archivo adjunto individual en PostgreSQL
app.post('/api/espacios/:codigo/adjuntos', async (req, res) => {
  try {
    const { codigo } = req.params;
    const codigoUpper = (codigo || '').trim().toUpperCase();
    const { docId, titulo, categoria, nombre, tipo, tamano, tamanoBytes, dataUrl, titularNombre, difuntoNombre, fechaSubida, horaSubida } = req.body;

    if (!codigoUpper || !docId || !dataUrl) {
      return res.status(400).json({ error: 'codigo, docId y dataUrl son requeridos' });
    }

    // Buscar espacio_id si existe
    const espRes = await pool.query('SELECT id FROM espacios WHERE UPPER(TRIM(codigo)) = $1', [codigoUpper]);
    const espacioId = espRes.rows.length > 0 ? espRes.rows[0].id : null;

    const query = `
      INSERT INTO documentos_expediente 
      (espacio_id, codigo_espacio, doc_id, titulo, categoria, nombre_archivo, tipo_mime, tamano_formateado, tamano_bytes, data_url, titular_nombre, difunto_nombre, fecha_subida, hora_subida)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (codigo_espacio, doc_id) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        categoria = EXCLUDED.categoria,
        nombre_archivo = EXCLUDED.nombre_archivo,
        tipo_mime = EXCLUDED.tipo_mime,
        tamano_formateado = EXCLUDED.tamano_formateado,
        tamano_bytes = EXCLUDED.tamano_bytes,
        data_url = EXCLUDED.data_url,
        titular_nombre = EXCLUDED.titular_nombre,
        difunto_nombre = EXCLUDED.difunto_nombre,
        fecha_subida = EXCLUDED.fecha_subida,
        hora_subida = EXCLUDED.hora_subida
      RETURNING *
    `;

    const values = [
      espacioId,
      codigoUpper,
      docId,
      titulo || docId,
      categoria || 'general',
      nombre || 'archivo.jpg',
      tipo || 'image/jpeg',
      tamano || 'N/D',
      tamanoBytes || 0,
      dataUrl,
      titularNombre || '',
      difuntoNombre || '',
      fechaSubida || new Date().toISOString().split('T')[0],
      horaSubida || new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    ];

    const result = await pool.query(query, values);
    res.json({ success: true, documento: result.rows[0] });
  } catch (err) {
    console.error('Error al guardar adjunto en PostgreSQL:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Eliminar un archivo adjunto
app.delete('/api/espacios/:codigo/adjuntos/:docId', async (req, res) => {
  try {
    const { codigo, docId } = req.params;
    const codigoUpper = (codigo || '').trim().toUpperCase();

    await pool.query(
      `DELETE FROM documentos_expediente WHERE UPPER(TRIM(codigo_espacio)) = $1 AND doc_id = $2`,
      [codigoUpper, docId]
    );

    res.json({ success: true, mensaje: 'Adjunto eliminado de PostgreSQL' });
  } catch (err) {
    console.error('Error al eliminar adjunto:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Movimientos Financieros
app.get('/api/movimientos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movimientos_financieros ORDER BY fecha_movimiento DESC, id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/movimientos', async (req, res) => {
  try {
    const mov = req.body;
    const result = await pool.query(
      `INSERT INTO movimientos_financieros (tipo_movimiento, categoria, monto, metodo_pago, fecha_movimiento, concepto_detalle, folio_comprobante)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        mov.tipo || mov.tipoMovimiento || 'Ingreso',
        mov.categoria || 'Otros',
        mov.monto || 0,
        mov.metodoPago || 'Efectivo_Caja',
        mov.fecha || mov.fechaMovimiento || new Date().toISOString().split('T')[0],
        mov.concepto || mov.conceptoDetalle || '',
        mov.folio || mov.folioComprobante || ''
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Servir archivos estáticos del frontend de producción (dist/) con control de caché optimizado
app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    // index.html y sw.js nunca deben ser almacenados en caché persistente para asegurar actualizaciones en tiempo real
    if (filePath.endsWith('index.html') || filePath.endsWith('sw.js') || filePath.endsWith('registerSW.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (filePath.includes('/assets/') || filePath.includes('\\assets\\')) {
      // Los archivos versionados con hash en dist/assets pueden cachearse con seguridad
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Redirigir cualquier ruta que no sea /api al index.html de React (SPA Fallback compatible con Express 5)
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.sendFile(indexPath);
  }
  return res.status(200).send('API de Panteón La Soledad activa. Para cargar la interfaz web, compila con "npm run build".');
});

// Iniciar servidor tras conectar a la base de datos
async function startServer() {
  try {
    await initDb();
    await poblarBaseDeDatos();
  } catch (err) {
    console.warn('[Server] Nota durante inicialización de base de datos:', err.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[API Server] Servidor backend escuchando en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Server] Error crítico en startServer:', err);
});
