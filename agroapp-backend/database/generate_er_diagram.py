#!/usr/bin/env python3
"""Genera turpial_dorado_er.svg — diagrama ER del esquema SQL."""

TABLES = {
    "usuarios": {
        "x": 80, "y": 80, "w": 340,
        "color": "#1a3d2e",
        "cols": [
            ("PK", "cedula", "VARCHAR(20)"),
            ("", "nombre", "VARCHAR(100)"),
            ("", "apellido", "VARCHAR(100)"),
            ("", "password_hash", "VARCHAR(255)"),
            ("", "rol", "ENUM(admin, trabajador)"),
            ("", "activo", "TINYINT(1)"),
            ("", "creado_en", "DATETIME(3)"),
            ("", "actualizado_en", "DATETIME(3)"),
        ],
    },
    "sesiones": {
        "x": 80, "y": 420, "w": 340,
        "color": "#2d5a45",
        "cols": [
            ("PK", "id", "CHAR(36)"),
            ("FK", "usuario_cedula", "VARCHAR(20) → usuarios"),
            ("", "token_hash", "VARCHAR(255)"),
            ("", "expira_en", "DATETIME(3)"),
            ("", "creado_en", "DATETIME(3)"),
        ],
    },
    "empresa_config": {
        "x": 520, "y": 80, "w": 380,
        "color": "#b8922f",
        "cols": [
            ("PK", "id", "TINYINT (singleton=1)"),
            ("", "nombre_principal", "VARCHAR(80)"),
            ("", "nombre_secundario", "VARCHAR(80)"),
            ("", "color_nombre_principal", "CHAR(7)"),
            ("", "color_nombre_secundario", "CHAR(7)"),
            ("", "eslogan", "VARCHAR(160)"),
            ("", "logo_principal", "MEDIUMTEXT"),
            ("", "logo_sidebar", "MEDIUMTEXT"),
            ("", "color_verde_oscuro … bordes", "12 × CHAR(7)"),
            ("", "actualizado_en", "DATETIME(3)"),
        ],
    },
    "producciones": {
        "x": 980, "y": 80, "w": 360,
        "color": "#1a3d2e",
        "cols": [
            ("PK", "id", "CHAR(36)"),
            ("UQ", "secuencia", "INT UNSIGNED"),
            ("UQ", "codigo", "CHAR(5)"),
            ("", "desde_cama", "INT UNSIGNED"),
            ("", "hasta_cama", "INT UNSIGNED"),
            ("", "cantidad_plantas", "INT UNSIGNED NULL"),
            ("", "finalizada", "TINYINT(1)"),
            ("", "creado_en", "DATETIME(3)"),
            ("", "fecha_finalizacion", "DATETIME(3) NULL"),
        ],
    },
    "produccion_cortes": {
        "x": 980, "y": 430, "w": 360,
        "color": "#2d5a45",
        "cols": [
            ("PK", "id", "CHAR(36)"),
            ("FK", "produccion_id", "CHAR(36) → producciones"),
            ("UQ", "secuencia", "INT UNSIGNED"),
            ("", "cantidad", "INT UNSIGNED"),
            ("", "fecha", "DATETIME(3)"),
        ],
    },
    "ventas": {
        "x": 1420, "y": 80, "w": 380,
        "color": "#1a3d2e",
        "cols": [
            ("PK", "id", "CHAR(36)"),
            ("UQ", "secuencia", "INT UNSIGNED"),
            ("", "cliente", "VARCHAR(200)"),
            ("", "tipo_flor", "ENUM(export, nacional)"),
            ("", "moneda", "ENUM(cop, usd)"),
            ("", "precio_venta", "DECIMAL(14,2)"),
            ("FK", "produccion_id", "CHAR(36) NULL → producciones"),
            ("", "produccion_etiqueta", "VARCHAR(120)"),
            ("", "comprobante_pago", "MEDIUMTEXT"),
            ("", "comprobante_nombre", "VARCHAR(255)"),
            ("", "pago_confirmado", "TINYINT(1)"),
            ("", "creado_en", "DATETIME(3)"),
            ("", "fecha_pago_confirmado", "DATETIME(3) NULL"),
        ],
    },
    "venta_variedades": {
        "x": 1420, "y": 520, "w": 380,
        "color": "#2d5a45",
        "cols": [
            ("PK", "id", "CHAR(36)"),
            ("FK", "venta_id", "CHAR(36) → ventas"),
            ("UQ", "orden", "INT UNSIGNED"),
            ("", "nombre", "VARCHAR(120)"),
            ("", "tallos", "INT UNSIGNED"),
            ("", "precio_por_unidad", "DECIMAL(14,2)"),
        ],
    },
    "inventario_productos": {
        "x": 80, "y": 780, "w": 400,
        "color": "#1a3d2e",
        "cols": [
            ("PK", "id", "CHAR(36)"),
            ("UQ", "codigo", "VARCHAR(10) Q1/A1/H1"),
            ("", "nombre", "VARCHAR(200)"),
            ("", "categoria", "ENUM(quimico, abono, herramienta)"),
            ("", "unidad", "VARCHAR(40)"),
            ("", "stock", "INT UNSIGNED"),
            ("", "descripcion", "TEXT"),
            ("", "creado_en", "DATETIME(3)"),
            ("FK", "creado_por_cedula", "VARCHAR(20) → usuarios"),
            ("", "creado_por_nombre", "VARCHAR(200)"),
            ("", "creado_por_rol", "ENUM(admin, trabajador)"),
        ],
    },
    "inventario_movimientos": {
        "x": 560, "y": 780, "w": 420,
        "color": "#2d5a45",
        "cols": [
            ("PK", "id", "CHAR(36)"),
            ("", "tipo", "ENUM(ingreso, salida)"),
            ("FK", "producto_id", "CHAR(36) → inventario_productos"),
            ("", "producto_codigo", "VARCHAR(10)"),
            ("", "producto_nombre", "VARCHAR(200)"),
            ("", "categoria", "ENUM(quimico, abono, herramienta)"),
            ("", "cantidad", "INT UNSIGNED"),
            ("", "unidad", "VARCHAR(40)"),
            ("", "stock_resultante", "INT UNSIGNED"),
            ("", "nota", "VARCHAR(500)"),
            ("", "fecha", "DATETIME(3)"),
            ("FK", "usuario_cedula", "VARCHAR(20) → usuarios"),
            ("", "usuario_nombre", "VARCHAR(200)"),
            ("", "usuario_rol", "ENUM(admin, trabajador)"),
        ],
    },
}

RELATIONS = [
    ("usuarios", "sesiones", "1 ──< N", "cedula → usuario_cedula"),
    ("producciones", "produccion_cortes", "1 ──< N", "id → produccion_id"),
    ("producciones", "ventas", "1 ──< 0..N", "id → produccion_id"),
    ("ventas", "venta_variedades", "1 ──< N", "id → venta_id"),
    ("usuarios", "inventario_productos", "1 ──< 0..N", "cedula → creado_por_cedula"),
    ("inventario_productos", "inventario_movimientos", "1 ──< N", "id → producto_id"),
    ("usuarios", "inventario_movimientos", "1 ──< 0..N", "cedula → usuario_cedula"),
]

ROW_H = 22
HEADER_H = 36
PAD = 8


def table_height(t):
    return HEADER_H + len(t["cols"]) * ROW_H + PAD


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def badge_color(key):
    if key == "PK":
        return "#d4a843", "#1a3d2e"
    if key == "FK":
        return "#e8c468", "#1a3d2e"
    if key == "UQ":
        return "#c8d8ce", "#1a3d2e"
    return None, None


def draw_table(name, t):
    w = t["w"]
    h = table_height(t)
    x, y = t["x"], t["y"]
    lines = []
    lines.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="#fafaf8" stroke="#1a3d2e" stroke-width="2"/>')
    lines.append(f'<rect x="{x}" y="{y}" width="{w}" height="{HEADER_H}" rx="8" fill="{t["color"]}"/>')
    lines.append(f'<rect x="{x}" y="{y + HEADER_H - 8}" width="{w}" height="8" fill="{t["color"]}"/>')
    lines.append(f'<text x="{x + w/2}" y="{y + 24}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="700" fill="#ffffff">{esc(name)}</text>')

    cy = y + HEADER_H + 4
    for key, col, typ in t["cols"]:
        bg, fg = badge_color(key)
        if key:
            lines.append(f'<rect x="{x + 8}" y="{cy + 2}" width="28" height="16" rx="3" fill="{bg}"/>')
            lines.append(f'<text x="{x + 22}" y="{cy + 14}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="9" font-weight="700" fill="{fg}">{key}</text>')
        else:
            lines.append(f'<rect x="{x + 8}" y="{cy + 2}" width="28" height="16" rx="3" fill="transparent"/>')
        lines.append(f'<text x="{x + 42}" y="{cy + 14}" font-family="Consolas, monospace" font-size="11" font-weight="600" fill="#1a2e24">{esc(col)}</text>')
        lines.append(f'<text x="{x + w - 10}" y="{cy + 14}" text-anchor="end" font-family="Consolas, monospace" font-size="10" fill="#6b7c72">{esc(typ)}</text>')
        cy += ROW_H

    t["_cx"] = x + w / 2
    t["_cy"] = y + h / 2
    t["_top"] = y
    t["_bottom"] = y + h
    t["_left"] = x
    t["_right"] = x + w
    return "\n".join(lines)


def connect(from_t, to_t, label, card):
    fx, fy = from_t["_cx"], from_t["_bottom"]
    tx, ty = to_t["_cx"], to_t["_top"]
    # route from bottom of from to top of to
    if from_t["x"] + from_t["w"] < to_t["x"]:
        fx = from_t["_right"]
        fy = from_t["_cy"]
        tx = to_t["_left"]
        ty = to_t["_cy"]
    mid_y = (fy + ty) / 2
    path = f'M {fx} {fy} C {fx} {mid_y}, {tx} {mid_y}, {tx} {ty}'
    if abs(fx - tx) < 20:
        path = f'M {fx} {from_t["_bottom"]} L {tx} {to_t["_top"]}'

    return f'''
<path d="{path}" fill="none" stroke="#d4a843" stroke-width="2.5" marker-end="url(#arrow)"/>
<text x="{(fx+tx)/2}" y="{(fy+ty)/2 - 8}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="600" fill="#1a3d2e">{esc(card)}</text>
<text x="{(fx+tx)/2}" y="{(fy+ty)/2 + 10}" text-anchor="middle" font-family="Consolas, monospace" font-size="9" fill="#6b7c72">{esc(label)}</text>
'''


def main():
    max_y = max(t["y"] + table_height(t) for t in TABLES.values()) + 120
    width = 1900
    height = max(max_y, 1300)

    parts = [
        f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="#d4a843"/>
    </marker>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f8f6f0"/>
      <stop offset="100%" stop-color="#f5f0e6"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <text x="{width/2}" y="42" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="800" fill="#1a3d2e">AgroApp — Diagrama ER (Clever Cloud MySQL)</text>
  <text x="{width/2}" y="66" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="13" fill="#6b7c72">MySQL 8 · Clever Cloud · PK = Primary Key · FK = Foreign Key · UQ = Unique</text>
''',
    ]

    # Legend
    lx, ly = 980, max_y - 90
    parts.append(f'''
  <rect x="{lx}" y="{ly}" width="820" height="70" rx="8" fill="#ffffff" stroke="#d8e0da"/>
  <rect x="{lx+12}" y="{ly+14}" width="28" height="16" rx="3" fill="#d4a843"/><text x="{lx+26}" y="{ly+26}" text-anchor="middle" font-size="9" font-weight="700" fill="#1a3d2e">PK</text><text x="{lx+48}" y="{ly+26}" font-size="11" fill="#1a2e24">Primary Key</text>
  <rect x="{lx+160}" y="{ly+14}" width="28" height="16" rx="3" fill="#e8c468"/><text x="{lx+174}" y="{ly+26}" text-anchor="middle" font-size="9" font-weight="700" fill="#1a3d2e">FK</text><text x="{lx+196}" y="{ly+26}" font-size="11" fill="#1a2e24">Foreign Key</text>
  <rect x="{lx+310}" y="{ly+14}" width="28" height="16" rx="3" fill="#c8d8ce"/><text x="{lx+324}" y="{ly+26}" text-anchor="middle" font-size="9" font-weight="700" fill="#1a3d2e">UQ</text><text x="{lx+346}" y="{ly+26}" font-size="11" fill="#1a2e24">Unique</text>
  <text x="{lx+12}" y="{ly+52}" font-size="11" fill="#6b7c72">Vistas: v_producciones_activas · v_producciones_historial · v_ventas_activas · v_ventas_historial · v_inventario_stock</text>
''')

    for name, t in TABLES.items():
        parts.append(draw_table(name, t))

    for a, b, card, label in RELATIONS:
        parts.append(connect(TABLES[a], TABLES[b], label, card))

    parts.append("</svg>")

    from pathlib import Path
    out = str(Path(__file__).resolve().parent / "agroapp_er.svg")
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(parts))
    print(f"Generated {out}")


if __name__ == "__main__":
    main()
