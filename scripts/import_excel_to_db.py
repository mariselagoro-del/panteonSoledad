# scripts/import_excel_to_db.py
import zipfile
import xml.etree.ElementTree as ET
import datetime
import json
import re

EXCEL_PATH = "docs/SistemaPSoledad.xlsx"
OUTPUT_JSON_PATH = "src/constants/panteonDataset.json"

def excel_serial_to_date(serial):
    if not serial:
        return None
    s = str(serial).strip()
    # 1. Try float / serial number
    try:
        val = float(s.replace(',', '.'))
        if val > 1000: # Excel date serial
            dt = datetime.datetime(1899, 12, 30) + datetime.timedelta(days=val)
            if 1900 <= dt.year <= 2100:
                return dt.strftime("%Y-%m-%d")
    except Exception:
        pass

    # 2. Try common string date formats
    for fmt in ["%d/%m/%Y", "%d/%m/%y", "%Y-%m-%d", "%d-%m-%Y", "%d-%m-%y", "%m/%d/%Y"]:
        try:
            dt = datetime.datetime.strptime(s, fmt)
            if 1900 <= dt.year <= 2100:
                return dt.strftime("%Y-%m-%d")
        except Exception:
            pass

    # 3. Regex search for DD/MM/YY or DD/MM/YYYY
    m = re.match(r'^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$', s)
    if m:
        d, m_mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if y < 100:
            y += 2000 if y < 50 else 1900
        if 1 <= m_mo <= 12 and 1 <= d <= 31 and 1900 <= y <= 2100:
            try:
                dt = datetime.datetime(y, m_mo, d)
                return dt.strftime("%Y-%m-%d")
            except Exception:
                pass
    return None

def clean_str(val):
    if val is None:
        return ""
    s = str(val).strip()
    if s.lower() in ["sin datos", "sin responsable", "sin determinar", "0.0", "0", "-", "none"]:
        return ""
    return s

def clean_phone(val):
    if not val:
        return ""
    s = str(val).strip()
    if "E" in s or "e" in s:
        try:
            f = float(s)
            return str(int(f))
        except Exception:
            pass
    s = re.sub(r'[^\d\s\-\(\)\+]', '', s).strip()
    return s if len(s) >= 7 else ""

def roman_to_num(sec_str):
    s = str(sec_str).strip().upper()
    if s in ["I", "1", "1.0", "SECCION I", "SECCION 1", "SECCIÓN 1", "SECCIÓN I"]:
        return "Sección 1", "1"
    if s in ["II", "2", "2.0", "SECCION II", "SECCION 2", "SECCIÓN 2", "SECCIÓN II"]:
        return "Sección 2", "2"
    if s in ["III", "3", "3.0", "SECCION III", "SECCION 3", "SECCIÓN 3", "SECCIÓN III"]:
        return "Sección 3", "3"
    if s in ["IV", "4", "4.0", "SECCION IV", "SECCION 4", "SECCIÓN 4", "SECCIÓN IV"]:
        return "Sección 4", "4"
    if s in ["V", "5", "5.0", "SECCION V", "SECCION 5", "SECCIÓN 5", "SECCIÓN V"]:
        return "Sección 5", "5"
    if "NICHO" in s:
        return "Zona de Nichos", "N"
    return "Sección 1", "1"

def read_excel_raw():
    z = zipfile.ZipFile(EXCEL_PATH)
    shared_strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        ss_xml = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in ss_xml.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
            t = si.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
            if t is not None and t.text:
                shared_strings.append(t.text)
            else:
                t_elems = si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                shared_strings.append(''.join([te.text or '' for te in t_elems]))

    wb_xml = ET.fromstring(z.read('xl/workbook.xml'))
    sheet_elems = wb_xml.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet')
    
    sheets_data = {}
    for idx, s in enumerate(sheet_elems, 1):
        name = s.attrib['name']
        sheet_xml = ET.fromstring(z.read(f'xl/worksheets/sheet{idx}.xml'))
        rows = sheet_xml.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')
        
        parsed_rows = []
        for r in rows:
            row_dict = {}
            for c in r.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                r_coord = c.attrib.get('r', '')
                col_letters = "".join([ch for ch in r_coord if ch.isalpha()])
                t_attr = c.attrib.get('t')
                v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                val = v.text if v is not None else ''
                if t_attr == 's' and val.isdigit():
                    val = shared_strings[int(val)]
                row_dict[col_letters] = val
            parsed_rows.append(row_dict)
        sheets_data[name] = parsed_rows
    return sheets_data

def process_all_sheets():
    print("Leyendo hojas de cálculo del archivo:", EXCEL_PATH)
    raw_sheets = read_excel_raw()
    
    espacios_map = {} # Key: codigo, Value: Espacio Dict
    
    # 1. Procesar Hoja 'Nuevo'
    nuevo_rows = raw_sheets.get('Nuevo', [])
    print(f"Procesando hoja 'Nuevo' ({len(nuevo_rows)} filas)...")
    
    m_cols = ['S','T','U','V','W','X','Y','Z','AA','AB','AC','AD','AE','AF','AG']
    f_cols = ['AH','AI','AJ','AK','AL','AM','AN','AO','AP','AQ','AR','AS','AT','AU','AV']
    
    for r in nuevo_rows[1:]:
        num_raw = r.get('A', '')
        sec_raw = r.get('B', '')
        difunto_raw = clean_str(r.get('C', ''))
        fecha_def_raw = r.get('D', '')
        edad_raw = r.get('E', '')
        dir_difunto = clean_str(r.get('F', ''))
        titular_raw = clean_str(r.get('G', ''))
        parentesco = clean_str(r.get('H', ''))
        telefono = clean_phone(r.get('I', ''))
        dir_titular = clean_str(r.get('J', ''))
        aportacion = clean_str(r.get('K', ''))
        ejidatario_flag = clean_str(r.get('M', '')).lower() == 'o'
        causa_muerte = clean_str(r.get('AX', '')) or clean_str(r.get('AY', '')) or clean_str(r.get('AZ', ''))
        
        if not num_raw and not sec_raw and not difunto_raw and not titular_raw:
            continue
            
        try:
            num_int = int(float(str(num_raw).replace(',', '.')))
        except Exception:
            num_int = 1
            
        seccion_nombre, sec_prefix = roman_to_num(sec_raw)
        codigo = f"F{sec_prefix}-{str(num_int).zfill(3)}"
        
        nombre_titular = titular_raw or "Titular No Registrado"
        if not titular_raw and parentesco and "titular es" in parentesco.lower():
            nombre_titular = parentesco
            
        # Parse Mantenimientos M2016-M2030 (Cols S to AG) y Folios (Cols AH to AV)
        mantenimientos = []
        pagos_al_corriente = False
        es_abandonada = False
        
        for yr_idx in range(15):
            yr = 2016 + yr_idx
            m_val = clean_str(r.get(m_cols[yr_idx], ''))
            f_val = clean_str(r.get(f_cols[yr_idx], ''))
            
            if m_val.lower() == 'abandonada' or f_val.lower() == 'abandonada':
                es_abandonada = True
                continue
                
            m_date = excel_serial_to_date(m_val)
            f_date = excel_serial_to_date(f_val)
            
            # Detectar si el pago fue registrado
            esta_pagado = False
            fecha_pago = None
            folio_pago = f"REF-{yr}"
            
            if m_date:
                esta_pagado = True
                fecha_pago = m_date
            elif f_date:
                esta_pagado = True
                fecha_pago = f_date
            elif m_val and m_val.lower() not in ['x', 'o', 'no aplica', 'sin pagos', 'abandonada']:
                esta_pagado = True
                fecha_pago = f"{yr}-01-15"
            elif f_val and f_val.lower() not in ['x', 'o', 'no aplica', 'sin pagos', 'abandonada']:
                esta_pagado = True
                fecha_pago = f"{yr}-01-15"
                
            if esta_pagado:
                if f_val and f_val.lower() not in ['x', 'o', 'no aplica', 'sin pagos', 'abandonada']:
                    folio_pago = f_val
                elif m_val and not m_date and m_val.lower() not in ['x', 'o', 'no aplica']:
                    folio_pago = m_val
                    
                mantenimientos.append({
                    "anio": yr,
                    "monto": 250.0,
                    "fecha": fecha_pago or f"{yr}-01-15",
                    "folio": folio_pago,
                    "estatus": "Pagado"
                })
                if yr >= 2024:
                    pagos_al_corriente = True

        # Crear o actualizar espacio
        if codigo not in espacios_map:
            espacios_map[codigo] = {
                "id": len(espacios_map) + 1,
                "codigo": codigo,
                "seccionNombre": seccion_nombre,
                "tipoEspacio": "Fosa",
                "titularNombre": nombre_titular,
                "titularTelefono": telefono,
                "titularCorreo": "",
                "titularDireccion": dir_titular or dir_difunto,
                "parentesco": parentesco,
                "esEjidatario": ejidatario_flag,
                "historialDifuntos": [],
                "historialMantenimientos": mantenimientos,
                "historialPagos": [],
                "estatusPago": "Abandonada" if es_abandonada else ("Al Corriente" if (pagos_al_corriente or not mantenimientos) else "Con Adeudo"),
                "observaciones": f"Aportación: {aportacion}" if aportacion else ("Tumba en estado de abandono." if es_abandonada else "Registro regularizado."),
                "coordenadas": f"19.54{len(espacios_map)%90:02d}, -99.23{len(espacios_map)%90:02d}"
            }
        else:
            # Fusionar mantenimientos por año sin duplicar
            existentes_anios = {m["anio"] for m in espacios_map[codigo]["historialMantenimientos"]}
            for m in mantenimientos:
                if m["anio"] not in existentes_anios:
                    espacios_map[codigo]["historialMantenimientos"].append(m)
                    existentes_anios.add(m["anio"])
                    if m["anio"] >= 2024:
                        espacios_map[codigo]["estatusPago"] = "Al Corriente"
                        
            # Si el titular no estaba completo y este registro lo tiene, complementar
            if (not espacios_map[codigo]["titularNombre"] or espacios_map[codigo]["titularNombre"] == "Titular No Registrado") and nombre_titular:
                espacios_map[codigo]["titularNombre"] = nombre_titular
            if not espacios_map[codigo]["titularTelefono"] and telefono:
                espacios_map[codigo]["titularTelefono"] = telefono
            if not espacios_map[codigo]["titularDireccion"] and (dir_titular or dir_difunto):
                espacios_map[codigo]["titularDireccion"] = dir_titular or dir_difunto
        
        # Agregar difunto si está presente
        if difunto_raw:
            edad_num = None
            try:
                edad_num = int(float(str(edad_raw).replace(',', '.')))
            except Exception:
                pass
                
            fecha_def = excel_serial_to_date(fecha_def_raw)
            # Evitar difuntos duplicados con mismo nombre en la fosa
            nombres_existentes = [d["nombre"].lower() for d in espacios_map[codigo]["historialDifuntos"]]
            if difunto_raw.lower() not in nombres_existentes:
                difunto_obj = {
                    "id": len(espacios_map[codigo]["historialDifuntos"]) + 1,
                    "nombre": difunto_raw,
                    "curp": "",
                    "edad": edad_num,
                    "fechaDefuncion": fecha_def or "",
                    "fechaInhumacion": fecha_def or "2020-01-01",
                    "causaMuerte": causa_muerte or "Causas naturales",
                    "direccion": dir_difunto
                }
                espacios_map[codigo]["historialDifuntos"].append(difunto_obj)

    # 2. Procesar Hoja 'Nichos'
    nichos_rows = raw_sheets.get('Nichos', [])
    print(f"Procesando hoja 'Nichos' ({len(nichos_rows)} filas)...")
    nichos_m_cols = [('O', 2023), ('P', 2024), ('Q', 2025), ('R', 2026), ('S', 2027), ('T', 2028)]
    
    for r in nichos_rows[1:]:
        tumba_raw = r.get('A', '')
        cenizas_raw = clean_str(r.get('C', ''))
        fecha_def_raw = r.get('D', '')
        edad_raw = r.get('E', '')
        dir_raw = clean_str(r.get('F', ''))
        titular_raw = clean_str(r.get('G', ''))
        parentesco = clean_str(r.get('H', ''))
        telefono = clean_phone(r.get('I', ''))
        causa_muerte = clean_str(r.get('V', '')) or clean_str(r.get('U', ''))
        
        if not tumba_raw and not cenizas_raw and not titular_raw:
            continue
            
        try:
            num_int = int(float(str(tumba_raw).replace(',', '.')))
        except Exception:
            num_int = len(espacios_map) + 1
            
        codigo = f"N-{str(num_int).zfill(3)}"
        
        difuntos_nicho = []
        if cenizas_raw:
            edad_num = None
            try:
                edad_num = int(float(str(edad_raw).replace(',', '.')))
            except Exception:
                pass
            difuntos_nicho.append({
                "id": 1,
                "nombre": cenizas_raw,
                "curp": "",
                "edad": edad_num,
                "fechaDefuncion": excel_serial_to_date(fecha_def_raw) or "",
                "fechaInhumacion": excel_serial_to_date(fecha_def_raw) or "2023-01-01",
                "causaMuerte": causa_muerte or "Cenizas depositadas",
                "direccion": dir_raw
            })
            
        # Extraer mantenimientos de nichos
        mants_nicho = []
        for col_l, yr_n in nichos_m_cols:
            val_col = clean_str(r.get(col_l, ''))
            d_pago = excel_serial_to_date(val_col)
            if d_pago or (val_col and val_col.lower() not in ['x', 'o', 'no aplica', 'sin pagos']):
                mants_nicho.append({
                    "anio": yr_n,
                    "monto": 250.0,
                    "fecha": d_pago or f"{yr_n}-01-15",
                    "folio": val_col if not d_pago else f"REF-N-{yr_n}",
                    "estatus": "Pagado"
                })
            
        espacios_map[codigo] = {
            "id": len(espacios_map) + 1,
            "codigo": codigo,
            "seccionNombre": "Zona de Nichos",
            "tipoEspacio": "Nicho",
            "titularNombre": titular_raw or "Titular de Nicho",
            "titularTelefono": telefono,
            "titularCorreo": "",
            "titularDireccion": dir_raw,
            "parentesco": parentesco,
            "esEjidatario": False,
            "historialDifuntos": difuntos_nicho,
            "historialMantenimientos": mants_nicho,
            "historialPagos": [],
            "estatusPago": "Al Corriente",
            "observaciones": "Zona de nichos y cenizas.",
            "coordenadas": f"19.54{len(espacios_map)%90:02d}, -99.23{len(espacios_map)%90:02d}"
        }

    # 3. Procesar Hoja 'Apartado'
    apartado_rows = raw_sheets.get('Apartado', [])
    print(f"Procesando hoja 'Apartado' ({len(apartado_rows)} filas)...")
    ap_m_cols = [
        ('L', 2011), ('M', 2012), ('N', 2013), ('O', 2014), ('P', 2015),
        ('Q', 2016), ('R', 2017), ('S', 2018), ('T', 2019), ('U', 2020),
        ('V', 2021), ('W', 2022), ('X', 2023), ('Y', 2024), ('Z', 2025),
        ('AA', 2026), ('AB', 2027), ('AC', 2028), ('AD', 2029)
    ]
    
    for r in apartado_rows[1:]:
        cons_raw = r.get('A', '')
        titular1 = clean_str(r.get('B', ''))
        titular2 = clean_str(r.get('C', ''))
        direccion = clean_str(r.get('D', ''))
        telefono = clean_phone(r.get('E', ''))
        barda_pago = clean_str(r.get('F', ''))
        obs = clean_str(r.get('AX', '')) or clean_str(r.get('AY', '')) or clean_str(r.get('AW', ''))
        
        if not cons_raw and not titular1:
            continue
            
        try:
            cons_int = int(float(str(cons_raw).replace(',', '.')))
        except Exception:
            cons_int = len(espacios_map) + 1
            
        codigo_ap = f"AP-{str(cons_int).zfill(3)}"
        
        mants_ap = []
        pagos_ap_recientes = False
        for col_l, yr_a in ap_m_cols:
            val_col = clean_str(r.get(col_l, ''))
            d_pago = excel_serial_to_date(val_col)
            if d_pago or (val_col and val_col.lower() not in ['x', 'o', 'no aplica', 'sin pagos']):
                mants_ap.append({
                    "anio": yr_a,
                    "monto": 250.0,
                    "fecha": d_pago or f"{yr_a}-01-15",
                    "folio": val_col if not d_pago else f"REF-AP-{yr_a}",
                    "estatus": "Pagado"
                })
                if yr_a >= 2024:
                    pagos_ap_recientes = True
        
        if codigo_ap not in espacios_map:
            espacios_map[codigo_ap] = {
                "id": len(espacios_map) + 1,
                "codigo": codigo_ap,
                "seccionNombre": "Sección 2",
                "tipoEspacio": "Fosa",
                "titularNombre": titular1 or "Titular Apartado",
                "titularSecundario": titular2,
                "titularTelefono": telefono,
                "titularCorreo": "",
                "titularDireccion": direccion,
                "parentesco": "Titular",
                "esEjidatario": False,
                "historialDifuntos": [],
                "historialMantenimientos": mants_ap,
                "historialPagos": [],
                "estatusPago": "Al Corriente" if (pagos_ap_recientes or not mants_ap) else "Con Adeudo",
                "observaciones": f"Apartado. Barda: {barda_pago}. {obs}".strip(),
                "coordenadas": f"19.54{len(espacios_map)%90:02d}, -99.23{len(espacios_map)%90:02d}"
            }

    # 4. Generar Apertura Contable a partir de Julio 2026 ($150,000.00 MXN)
    print("Configurando corte financiero oficial (Julio 2026)...")
    movimientos_oficiales = [
        {
            "id": 1,
            "tipo": "Ingreso",
            "categoria": "Apertura_Caja",
            "monto": 150000.0,
            "metodoPago": "Efectivo_Caja",
            "fecha": "2026-07-01",
            "concepto": "Apertura de Administración - Saldo Inicial en Caja",
            "folio": "APERTURA-2026-07",
            "observaciones": "Fondo inicial entregado a cuenta de $150,000.00 MXN para el inicio formal de la administración a partir de julio de 2026."
        }
    ]

    # Normalización del estatus financiero de cada espacio
    for esp in espacios_map.values():
        es_ab = esp.get("estatusPago") == "Abandonada" or "abandonada" in esp.get("observaciones", "").lower()
        if es_ab:
            esp["estatusPago"] = "Abandonada"
            continue
            
        # Revisar si tiene pagos recientes en 2024, 2025 o 2026
        mants = esp.get("historialMantenimientos", [])
        anios_pagados = {m.get("anio") for m in mants if m.get("estatus") == "Pagado"}
        tiene_reciente = any(yr in anios_pagados for yr in [2024, 2025, 2026])
        
        # Fosa vacía/disponible sin difuntos ni titular asignado
        tiene_difuntos = len(esp.get("historialDifuntos", [])) > 0
        titular = esp.get("titularNombre", "").strip()
        es_vacia = (not tiene_difuntos) and (not titular or titular in ["Titular No Registrado", "Disponible", "Sin titular"])
        
        if tiene_reciente or es_vacia:
            esp["estatusPago"] = "Al Corriente"
        else:
            esp["estatusPago"] = "Con Adeudo"

    dataset_list = list(espacios_map.values())
    print(f"Total de espacios unificados procesados: {len(dataset_list)}")
    
    total_difuntos = sum(len(e["historialDifuntos"]) for e in dataset_list)
    print(f"Total de difuntos vinculados: {total_difuntos}")
    
    output_data = {
        "metadata": {
            "panteonNombre": "Panteón La Soledad",
            "ubicacion": "San Francisco Tepojaco, Cuautitlán Izcalli, Edo. Méx.",
            "fundacion": 1908,
            "totalEspacios": len(dataset_list),
            "totalDifuntos": total_difuntos,
            "fechaGeneracion": datetime.datetime.now().isoformat(),
            "corteContable": "2026-07-01",
            "saldoInicial": 150000.0,
            "versionDataset": "2026.10-limpio-oficial"
        },
        "espacios": dataset_list,
        "movimientosFinancieros": movimientos_oficiales
    }
    
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    print(f"Dataset definitivo guardado exitosamente en: {OUTPUT_JSON_PATH}")

if __name__ == "__main__":
    process_all_sheets()
