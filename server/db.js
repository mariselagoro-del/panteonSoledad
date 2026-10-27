import process from 'node:process';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool, Client } = pg;

const targetDb = process.env.PGDATABASE || 'PanteonLaSoledad';
const user = process.env.PGUSER || 'postgres';
const password = process.env.PGPASSWORD || 'postgres';
const host = process.env.PGHOST || 'localhost';
const port = parseInt(process.env.PGPORT || '5432', 10);

const isCloudDb = Boolean(process.env.DATABASE_URL);

/**
 * Crea la base de datos en PostgreSQL si no existe (solo en entorno local).
 */
async function asegurarBaseDeDatosExiste() {
  if (isCloudDb) {
    // En la nube (Render, Neon, Supabase, Railway) la base de datos ya está creada por el proveedor
    return;
  }

  const adminClient = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres'
  });

  try {
    await adminClient.connect();
    const res = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDb]
    );

    if (res.rows.length === 0) {
      console.log(`[PostgreSQL] Creando base de datos "${targetDb}"...`);
      await adminClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`[PostgreSQL] Base de datos "${targetDb}" creada con éxito.`);
    }
  } catch (err) {
    console.warn(`[PostgreSQL] Nota al verificar base de datos:`, err.message);
  } finally {
    try {
      await adminClient.end();
    } catch (closeErr) {
      if (closeErr) { /* conexión finalizada */ }
    }
  }
}

// En Render, las conexiones internas (red privada dpg-...) no usan SSL; conexiones externas sí
const useSsl = isCloudDb && (
  process.env.DATABASE_URL.includes('.render.com') ||
  process.env.DATABASE_URL.includes('neon.tech') ||
  process.env.DATABASE_URL.includes('supabase.co') ||
  process.env.DATABASE_URL.includes('sslmode=require')
);

// Configuración del Pool principal (Soporta DATABASE_URL en la nube o variables individuales en local)
export const pool = new Pool(
  isCloudDb
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : {
        host,
        port,
        database: targetDb,
        user,
        password,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
);

/**
 * Inicializa las tablas del sistema en PostgreSQL si no existen aún.
 */
export async function initDb() {
  try {
    await asegurarBaseDeDatosExiste();

    const client = await pool.connect();
    console.log(
      isCloudDb
        ? `[PostgreSQL] Conectado exitosamente a la base de datos en la nube (DATABASE_URL).`
        : `[PostgreSQL] Conectado exitosamente a la base de datos local: ${targetDb}`
    );

    await client.query(`
      -- 1. Tabla de Titulares
      CREATE TABLE IF NOT EXISTS titulares (
          id SERIAL PRIMARY KEY,
          nombre_completo VARCHAR(255) NOT NULL,
          titular_secundario VARCHAR(255),
          parentesco VARCHAR(100),
          telefono VARCHAR(50),
          correo VARCHAR(150),
          direccion TEXT,
          es_ejidatario BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. Tabla de Espacios
      CREATE TABLE IF NOT EXISTS espacios (
          id SERIAL PRIMARY KEY,
          codigo VARCHAR(50) UNIQUE NOT NULL,
          tipo VARCHAR(30) NOT NULL DEFAULT 'Fosa',
          seccion VARCHAR(50) NOT NULL,
          numero_fosa VARCHAR(50),
          fila INTEGER DEFAULT 1,
          columna INTEGER DEFAULT 1,
          titular_id INTEGER REFERENCES titulares(id) ON DELETE SET NULL,
          estatus_ocupacion VARCHAR(30) DEFAULT 'Disponible',
          estatus_pago VARCHAR(30) DEFAULT 'Al Corriente',
          coordenadas VARCHAR(100),
          observaciones TEXT,
          tipo_construccion VARCHAR(30) DEFAULT 'Sencilla',
          fecha_sellado DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. Tabla de Difuntos
      CREATE TABLE IF NOT EXISTS difuntos (
          id SERIAL PRIMARY KEY,
          espacio_id INTEGER NOT NULL REFERENCES espacios(id) ON DELETE CASCADE,
          nombre_completo VARCHAR(255) NOT NULL,
          curp VARCHAR(25),
          edad INTEGER,
          fecha_defuncion DATE,
          fecha_inhumacion DATE,
          causa_muerte TEXT,
          orden_deposito INTEGER DEFAULT 1,
          observaciones TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 4. Tabla de Documentos e Imágenes del Expediente Electrónico
      CREATE TABLE IF NOT EXISTS documentos_expediente (
          id SERIAL PRIMARY KEY,
          espacio_id INTEGER REFERENCES espacios(id) ON DELETE CASCADE,
          codigo_espacio VARCHAR(50) NOT NULL,
          doc_id VARCHAR(100) NOT NULL,
          titulo VARCHAR(255) NOT NULL,
          categoria VARCHAR(50) DEFAULT 'general',
          nombre_archivo VARCHAR(255) NOT NULL,
          tipo_mime VARCHAR(100) NOT NULL,
          tamano_formateado VARCHAR(50),
          tamano_bytes BIGINT DEFAULT 0,
          data_url TEXT NOT NULL,
          titular_nombre VARCHAR(255),
          difunto_nombre VARCHAR(255),
          fecha_subida DATE NOT NULL DEFAULT CURRENT_DATE,
          hora_subida VARCHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_espacio_doc UNIQUE (codigo_espacio, doc_id)
      );

      -- 5. Historial de Mantenimientos y Refrendos
      CREATE TABLE IF NOT EXISTS historial_mantenimientos (
          id SERIAL PRIMARY KEY,
          espacio_id INTEGER NOT NULL REFERENCES espacios(id) ON DELETE CASCADE,
          anio INTEGER NOT NULL,
          monto_pagado NUMERIC(10,2) DEFAULT 0,
          fecha_pago DATE,
          folio_recibo VARCHAR(100),
          estatus VARCHAR(30) DEFAULT 'Pendiente',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_espacio_anio UNIQUE (espacio_id, anio)
      );

      -- 6. Tabla de Movimientos Financieros
      CREATE TABLE IF NOT EXISTS movimientos_financieros (
          id SERIAL PRIMARY KEY,
          espacio_id INTEGER REFERENCES espacios(id) ON DELETE SET NULL,
          tipo_movimiento VARCHAR(20) NOT NULL,
          categoria VARCHAR(50) NOT NULL,
          monto NUMERIC(12,2) NOT NULL,
          metodo_pago VARCHAR(30) NOT NULL DEFAULT 'Efectivo_Caja',
          fecha_movimiento DATE NOT NULL DEFAULT CURRENT_DATE,
          concepto_detalle TEXT NOT NULL,
          folio_comprobante VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 7. Arqueos y Cortes de Caja
      CREATE TABLE IF NOT EXISTS cortes_caja (
          id SERIAL PRIMARY KEY,
          fecha_corte DATE NOT NULL DEFAULT CURRENT_DATE,
          saldo_inicial_efectivo NUMERIC(12,2) NOT NULL DEFAULT 0,
          total_ingresos_efectivo NUMERIC(12,2) NOT NULL DEFAULT 0,
          total_egresos_efectivo NUMERIC(12,2) NOT NULL DEFAULT 0,
          saldo_final_en_caja NUMERIC(12,2) NOT NULL DEFAULT 0,
          observaciones_arqueo TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Índices para optimización
      CREATE INDEX IF NOT EXISTS idx_espacios_codigo ON espacios(codigo);
      CREATE INDEX IF NOT EXISTS idx_documentos_codigo ON documentos_expediente(codigo_espacio);
      CREATE INDEX IF NOT EXISTS idx_documentos_doc_id ON documentos_expediente(doc_id);

      -- Migración continua de campos: Sellado / Construcción
      ALTER TABLE espacios ADD COLUMN IF NOT EXISTS tipo_construccion VARCHAR(30) DEFAULT 'Sencilla';
      ALTER TABLE espacios ADD COLUMN IF NOT EXISTS fecha_sellado DATE;
    `);

    client.release();
    console.log('[PostgreSQL] Tablas e índices listos y verificados en PostgreSQL.');
    return true;
  } catch (err) {
    console.error('[PostgreSQL] Error al inicializar base de datos:', err.message);
    return false;
  }
}
