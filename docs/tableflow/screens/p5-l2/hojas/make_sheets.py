"""Hojas comparativas de L2b: una por identidad (pública claro/oscuro, móvil, comercio y confirmación).
Uso: python3 -I make_sheets.py <carpeta de capturas> <carpeta de salida>"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont

src, out = sys.argv[1], sys.argv[2]
NAMES = {
    'cafe': 'Ritual Café · confitería notable porteña',
    'hela': 'Copo · heladería: la vitrina es el menú',
    'resto': 'Mesa Clara · bodegón de pizarra y pingüino',
    'bar': 'Taberna Compás · club de jazz y tapas',
    'rapida': 'Brasa Rápida · brasa a la vista',
}
font = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
for biz, title in NAMES.items():
    get = lambda n: Image.open(os.path.join(src, f'{biz}-{n}.png')).convert('RGB')
    big = get('publica-claro' if biz in ('hela', 'resto', 'rapida') else 'publica-oscuro')
    alt = get('publica-oscuro' if biz in ('hela', 'resto', 'rapida') else 'publica-claro')
    W = 1500
    big = big.resize((W, round(big.height * W / big.width)))
    side_w = 700
    alt = alt.resize((side_w, round(alt.height * side_w / alt.width)))
    phone = get('movil')
    phone = phone.resize((round(phone.width * 0.9), round(phone.height * 0.9)))
    ops = get('comercio')
    ops = ops.resize((side_w, round(ops.height * side_w / ops.width)))
    sig = get('confirmacion')
    sig = sig.resize((W + side_w + 40, round(sig.height * (W + side_w + 40) / sig.width)))
    right_h = alt.height + 30 + phone.height + 30 + ops.height
    H = 110 + max(big.height, right_h) + 40 + sig.height + 40
    sheet = Image.new('RGB', (W + side_w + 120, H), (236, 235, 230))
    d = ImageDraw.Draw(sheet)
    d.text((40, 30), title, fill=(22, 22, 21), font=font(40, True))
    d.text((40, 80), 'L2b · DEMO · pantalla pública en ambos modos, móvil propio, comercio y animación de confirmación', fill=(90, 88, 82), font=font(20))
    sheet.paste(big, (40, 120))
    x = 40 + W + 40
    y = 120
    sheet.paste(alt, (x, y)); y += alt.height + 30
    sheet.paste(phone, (x + (side_w - phone.width) // 2, y)); y += phone.height + 30
    sheet.paste(ops, (x, y))
    sheet.paste(sig, (40, 120 + max(big.height, right_h) + 40))
    sheet.save(os.path.join(out, f'L2b-{biz}.jpg'), quality=84, optimize=True)
    print(biz, sheet.size, os.path.getsize(os.path.join(out, f'L2b-{biz}.jpg')) // 1024, 'KB')
