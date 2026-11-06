"""Iconos de la app en cada acento de la vista movil.

    python3 scripts/generar-iconos-acento.py

Lee los acentos de src/mobile/accent.ts y pinta la marca PH (la mascara de
public/icons/icon-512.png) con el degradado del acento (light -> fill ->
deep, como el «+») sobre el negro de la app con un brillo del acento.

Salidas:
- public/icons/acento/<acento>-180.png        iPhone (apple-touch-icon)
- public/icons/acento/<acento>-512.png        icono normal
- public/icons/acento/<acento>-maskable.png   con margen de zona segura
- android/app/src/main/res/mipmap-*/ic_<acento>.png y
  ic_<acento>_foreground.png                  los del APK (si existe android/)
"""

import re
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
FONDO = (7, 7, 8)


def acentos():
    texto = (RAIZ / "src/mobile/accent.ts").read_text()
    bloque = texto[texto.index("MOBILE_ACCENTS = {") :]
    out = {}
    for m in re.finditer(r"\n  (\w+): \{(.*?)\n  \}", bloque, re.S):
        campos = dict(re.findall(r'(\w+): "(#[0-9A-Fa-f]{6})"', m.group(2)))
        out[m.group(1)] = campos
    return out


def hexa(c):
    return tuple(int(c[i : i + 2], 16) for i in (1, 3, 5))


def degradado(size, a, b, c):
    """Diagonal de arriba-izquierda (a) a abajo-derecha (c), b al centro."""
    g = Image.new("RGB", (size, size))
    px = g.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            if t < 0.5:
                k, p, q = t / 0.5, a, b
            else:
                k, p, q = (t - 0.5) / 0.5, b, c
            px[x, y] = tuple(round(p[i] + (q[i] - p[i]) * k) for i in range(3))
    return g


MASCARA = Image.open(RAIZ / "public/icons/icon-512.png").convert("RGBA").split()[3]


def marca(size, acc):
    m = MASCARA.resize((size, size), Image.LANCZOS)
    pintura = degradado(size, hexa(acc["light"]), hexa(acc["fill"]), hexa(acc["deep"]))
    capa = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    capa.paste(pintura, (0, 0), m)
    return capa


def icono(size, acc, escala, fondo=True):
    """La marca ocupando `escala` del lado, centrada."""
    lienzo = Image.new("RGBA", (size, size), FONDO + (255,) if fondo else (0, 0, 0, 0))
    if fondo:
        brillo = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        r = int(size * 0.42)
        d = ImageDraw.Draw(brillo)
        d.ellipse(
            (size // 2 - r, size // 2 - r, size // 2 + r, size // 2 + r),
            fill=hexa(acc["fill"]) + (60,),
        )
        brillo = brillo.filter(ImageFilter.GaussianBlur(size * 0.12))
        lienzo = Image.alpha_composite(lienzo, brillo)
    lado = int(size * escala)
    m = marca(lado, acc)
    o = (size - lado) // 2
    lienzo.alpha_composite(m, (o, o))
    return lienzo


def main():
    dest = RAIZ / "public/icons/acento"
    dest.mkdir(parents=True, exist_ok=True)
    android = RAIZ / "android/app/src/main/res"
    densidades = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}
    for nombre, acc in acentos().items():
        icono(180, acc, 0.66).convert("RGB").save(dest / f"{nombre}-180.png")
        icono(512, acc, 0.66).save(dest / f"{nombre}-512.png")
        icono(512, acc, 0.5).save(dest / f"{nombre}-maskable.png")
        if android.exists():
            for d, k in densidades.items():
                carpeta = android / f"mipmap-{d}"
                carpeta.mkdir(exist_ok=True)
                icono(round(48 * k), acc, 0.66).save(carpeta / f"ic_{nombre}.png")
                # Adaptativo: 108 dp, con la marca dentro de los 66 dp seguros.
                icono(round(108 * k), acc, 0.42, fondo=False).save(
                    carpeta / f"ic_{nombre}_foreground.png"
                )
        print(nombre)


if __name__ == "__main__":
    main()
