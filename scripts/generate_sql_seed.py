# scripts/generate_sql_seed.py
import json

INPUT_JSON = "src/constants/panteonDataset.json"
OUTPUT_SQL = "database/seed_data.sql"

def escape_sql(val):
    if val is None:
        return "NULL"
    s = str(val).replace("'", "''").strip()
    return f"'{s}'"

def main():
    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    espacios = data.get("espacios", [])
    movimientos = data.get("movimientosFinancieros", [])
    
    sql_lines = [
        "-- seed_data.sql",
        "-- Carga inicial de datos históricos del Panteón La Soledad",
        "BEGIN;",
        "TRUNCATE TABLE movimientos_financieros, historial_mantenimientos, difuntos, espacios, titulares, cortes_caja RESTART IDENTITY CASCADE;",
        ""
    ]
    
    # 1. Insert Titulares & Espacios
    titular_id_map = {} # Key: (nombre, tel), Value: titular_id
    next_titular_id = 1
    
    print(f"Generating SQL for {len(espacios)} spaces...")
    
    for idx, e in enumerate(espacios, 1):
        t_nombre = e.get("titularNombre") or "Titular No Registrado"
        t_sec = e.get("titularSecundario")
        t_par = e.get("parentesco")
        t_tel = e.get("titularTelefono")
        t_correo = e.get("titularCorreo")
        t_dir = e.get("titularDireccion")
        t_eji = "TRUE" if e.get("esEjidatario") else "FALSE"
        
        titular_key = (t_nombre, t_tel)
        if titular_key not in titular_id_map:
            titular_id_map[titular_key] = next_titular_id
            sql_lines.append(
                f"INSERT INTO titulares (id, nombre_completo, titular_secundario, parentesco, telefono, correo, direccion, es_ejidatario) "
                f"VALUES ({next_titular_id}, {escape_sql(t_nombre)}, {escape_sql(t_sec)}, {escape_sql(t_par)}, {escape_sql(t_tel)}, {escape_sql(t_correo)}, {escape_sql(t_dir)}, {t_eji});"
            )
            next_titular_id += 1
            
        cur_titular_id = titular_id_map[titular_key]
        
        # Espacio
        e_cod = e.get("codigo")
        e_tipo = e.get("tipoEspacio", "Fosa")
        e_sec = e.get("seccionNombre", "Sección 1")
        e_est_ocu = "Ocupado" if e.get("historialDifuntos") else ("Apartado" if "AP-" in e_cod else "Disponible")
        e_est_pago = e.get("estatusPago", "Al Corriente")
        e_obs = e.get("observaciones", "")
        e_coord = e.get("coordenadas", "")
        
        sql_lines.append(
            f"INSERT INTO espacios (id, codigo, tipo, seccion, titular_id, estatus_ocupacion, estatus_pago, coordenadas, observaciones) "
            f"VALUES ({idx}, {escape_sql(e_cod)}, {escape_sql(e_tipo)}, {escape_sql(e_sec)}, {cur_titular_id}, {escape_sql(e_est_ocu)}, {escape_sql(e_est_pago)}, {escape_sql(e_coord)}, {escape_sql(e_obs)});"
        )
        
        # Difuntos
        for d_idx, d in enumerate(e.get("historialDifuntos", []), 1):
            d_nom = d.get("nombre")
            d_curp = d.get("curp")
            d_edad = d.get("edad") or "NULL"
            d_fdef = escape_sql(d.get("fechaDefuncion")) if d.get("fechaDefuncion") else "NULL"
            d_finh = escape_sql(d.get("fechaInhumacion")) if d.get("fechaInhumacion") else "NULL"
            d_cm = d.get("causaMuerte", "Causas naturales")
            
            sql_lines.append(
                f"INSERT INTO difuntos (espacio_id, nombre_completo, curp, edad, fecha_defuncion, fecha_inhumacion, causa_muerte, orden_deposito) "
                f"VALUES ({idx}, {escape_sql(d_nom)}, {escape_sql(d_curp)}, {d_edad}, {d_fdef}, {d_finh}, {escape_sql(d_cm)}, {d_idx});"
            )
            
        # Mantenimientos
        for m in e.get("historialMantenimientos", []):
            m_anio = m.get("anio")
            m_monto = m.get("monto", 250.0)
            m_fecha = escape_sql(m.get("fecha")) if m.get("fecha") else "NULL"
            m_est = m.get("estatus", "Pagado")
            
            sql_lines.append(
                f"INSERT INTO historial_mantenimientos (espacio_id, anio, monto_pagado, fecha_pago, estatus) "
                f"VALUES ({idx}, {m_anio}, {m_monto}, {m_fecha}, {escape_sql(m_est)}) "
                f"ON CONFLICT (espacio_id, anio) DO NOTHING;"
            )

    # Movimientos Financieros Iniciales
    for m in movimientos:
        m_tipo = m.get("tipo")
        m_cat = m.get("categoria")
        m_monto = m.get("monto")
        m_met = m.get("metodoPago", "Efectivo_Caja")
        m_fecha = escape_sql(m.get("fecha"))
        m_con = m.get("concepto")
        m_fol = m.get("folio")
        
        sql_lines.append(
            f"INSERT INTO movimientos_financieros (tipo_movimiento, categoria, monto, metodo_pago, fecha_movimiento, concepto_detalle, folio_comprobante) "
            f"VALUES ({escape_sql(m_tipo)}, {escape_sql(m_cat)}, {m_monto}, {escape_sql(m_met)}, {m_fecha}, {escape_sql(m_con)}, {escape_sql(m_fol)});"
        )

    # Corte de Caja Inicial (Julio 2026)
    sql_lines.append(
        "INSERT INTO cortes_caja (fecha_corte, saldo_inicial_efectivo, total_ingresos_efectivo, total_egresos_efectivo, saldo_final_en_caja, observaciones_arqueo) "
        "VALUES ('2026-07-01', 150000.00, 150000.00, 0.00, 150000.00, 'Apertura de administración con fondo inicial de $150,000.00 a partir de julio de 2026.');"
    )
    
    sql_lines.append("COMMIT;")
    
    with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))
    print(f"Generated {len(sql_lines)} SQL statements in {OUTPUT_SQL}")

if __name__ == "__main__":
    main()
