-- schema.sql
-- Base de datos para el Sistema de Administración Catastral y Financiera del Panteón La Soledad (1908)

-- 1. Tabla de Titulares y Responsables
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

-- 2. Tabla de Espacios (Fosas, Nichos, Capilla, Andadores)
CREATE TABLE IF NOT EXISTS espacios (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('Fosa', 'Nicho', 'Gaveta', 'Capilla', 'Infraestructura')),
    seccion VARCHAR(50) NOT NULL,
    numero_fosa VARCHAR(50),
    fila INTEGER DEFAULT 1,
    columna INTEGER DEFAULT 1,
    titular_id INTEGER REFERENCES titulares(id) ON DELETE SET NULL,
    estatus_ocupacion VARCHAR(30) DEFAULT 'Disponible' CHECK (estatus_ocupacion IN ('Disponible', 'Ocupado', 'Apartado', 'Mantenimiento')),
    estatus_pago VARCHAR(30) DEFAULT 'Al Corriente' CHECK (estatus_pago IN ('Al Corriente', 'Con Adeudo', 'Exento')),
    coordenadas VARCHAR(100),
    observaciones TEXT,
    tipo_construccion VARCHAR(30) DEFAULT 'Sencilla' CHECK (tipo_construccion IN ('Sencilla', 'Sellada')),
    fecha_sellado DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Difuntos (1 a N difuntos por espacio/fosa)
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

-- 4. Tabla de Expediente Electrónico Digital y Archivos Adjuntos (Imágenes y Documentos)
CREATE TABLE IF NOT EXISTS documentos_expediente (
    id SERIAL PRIMARY KEY,
    espacio_id INTEGER REFERENCES espacios(id) ON DELETE CASCADE,
    codigo_espacio VARCHAR(50) NOT NULL,
    doc_id VARCHAR(100) NOT NULL, -- 'acta_defuncion', 'certificado_medico', 'ine_difunto', 'acta_nacimiento_difunto', 'ine_titular', 'acta_nacimiento_titular', 'adicional'
    titulo VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) DEFAULT 'general' CHECK (categoria IN ('difunto', 'titular', 'adicional', 'general')),
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL, -- 'image/jpeg', 'image/png', 'image/webp', 'application/pdf'
    tamano_formateado VARCHAR(50),
    tamano_bytes BIGINT DEFAULT 0,
    data_url TEXT NOT NULL, -- Base64 DataURL de la imagen o archivo digitalizado
    fecha_subida DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_subida VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_espacio_doc UNIQUE (codigo_espacio, doc_id)
);

-- 5. Historial de Mantenimientos y Refrendos Anuales
CREATE TABLE IF NOT EXISTS historial_mantenimientos (
    id SERIAL PRIMARY KEY,
    espacio_id INTEGER NOT NULL REFERENCES espacios(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL,
    monto_pagado NUMERIC(10,2) DEFAULT 0,
    fecha_pago DATE,
    folio_recibo VARCHAR(100),
    estatus VARCHAR(30) DEFAULT 'Pendiente' CHECK (estatus IN ('Pagado', 'Pendiente', 'Condonado')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_espacio_anio UNIQUE (espacio_id, anio)
);

-- 6. Movimientos Financieros (Ingresos, Egresos, Nómina, Servicios, Caja Chica)
CREATE TABLE IF NOT EXISTS movimientos_financieros (
    id SERIAL PRIMARY KEY,
    espacio_id INTEGER REFERENCES espacios(id) ON DELETE SET NULL,
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('Ingreso', 'Egreso')),
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN (
        'Refrendo', 'Mantenimiento', 'Venta_Fosa', 'Venta_Nicho', 
        'Derechos_Inhumacion', 'Barda_Losa', 'Aportacion_Ejidal', 
        'Nomina', 'Servicios_Luz_Agua', 'Obras_Terreno', 
        'Insumos_Herramientas', 'Caja_Chica', 'Otros'
    )),
    monto NUMERIC(12,2) NOT NULL,
    metodo_pago VARCHAR(30) NOT NULL DEFAULT 'Efectivo_Caja' CHECK (metodo_pago IN ('Efectivo_Caja', 'Transferencia', 'Deposito_Bancario')),
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

-- Índices para optimizar búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_espacios_codigo ON espacios(codigo);
CREATE INDEX IF NOT EXISTS idx_espacios_seccion ON espacios(seccion);
CREATE INDEX IF NOT EXISTS idx_difuntos_nombre ON difuntos(nombre_completo);
CREATE INDEX IF NOT EXISTS idx_titulares_nombre ON titulares(nombre_completo);
CREATE INDEX IF NOT EXISTS idx_documentos_codigo ON documentos_expediente(codigo_espacio);
CREATE INDEX IF NOT EXISTS idx_documentos_doc_id ON documentos_expediente(doc_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_financieros(fecha_movimiento);

