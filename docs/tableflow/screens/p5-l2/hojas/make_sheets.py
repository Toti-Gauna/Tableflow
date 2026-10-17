import sys, os
from PIL import Image, ImageDraw, ImageFont
src, out = sys.argv[1], sys.argv[2]
B = {'cafe': ('Cafetería · Ritual Café', ['Barra editorial', 'Kissaten ★ recomendada', 'Merienda retro']),
     'resto': ('Restaurante / bodegón · Mesa Clara', ['Cocina de autor', 'Bodegón contemporáneo ★ recomendada', 'Materia sobria']),
     'hela': ('Heladería · Copo (contenido provisional)', ['Escultórica lúdica ★ recomendada', 'Pop geométrico', 'Pastel sereno']),
     'bar': ('Bar gastronómico · Taberna Compás (contenido provisional)', ['Nocturno sofisticado', 'Neo-brutal gastronómico', 'Compás musical ★ recomendada']),
     'rapida': ('Comida rápida · Brasa Rápida (contenido provisional)', ['Energía brutal ★ recomendada', 'Retro dinámico', 'Contraste mínimo'])}
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
COLW, GAP, PAD = 760, 28, 40
for biz, (title, names) in B.items():
    cols = []
    for n in (1, 2, 3):
        cid = f'{biz}-{n}'
        imgs = [Image.open(os.path.join(src, f'{cid}-publica-{m}.png')).convert('RGB') for m in ('claro', 'oscuro')]
        imgs = [i.resize((COLW, round(i.height * COLW / i.width)), Image.LANCZOS) for i in imgs]
        ph = Image.open(os.path.join(src, f'{cid}-movil.png')).convert('RGB')
        ph = ph.resize((round(ph.width * 0.82), round(ph.height * 0.82)), Image.LANCZOS)
        cols.append((names[n - 1], imgs, ph))
    h_pub = max(c[1][0].height for c in cols); h_dark = max(c[1][1].height for c in cols); h_ph = max(c[2].height for c in cols)
    W = PAD * 2 + COLW * 3 + GAP * 2
    H = PAD + 70 + 50 + h_pub + GAP + 30 + h_dark + GAP + 30 + h_ph + PAD
    sheet = Image.new('RGB', (W, H), (239, 238, 233))
    d = ImageDraw.Draw(sheet)
    d.text((PAD, PAD), title, fill=(27, 27, 26), font=F(34, True))
    d.text((PAD, PAD + 44), 'Propuestas visuales L2 · DEMO · pantalla pública en claro y oscuro, y móvil en el modo principal', fill=(92, 90, 84), font=F(18))
    for i, (name, imgs, ph) in enumerate(cols):
        x = PAD + i * (COLW + GAP); y = PAD + 80
        d.text((x, y), f'{i + 1}. {name}', fill=(27, 27, 26), font=F(24, True)); y += 40
        sheet.paste(imgs[0], (x, y)); y += h_pub + GAP
        d.text((x, y - 4), 'Oscuro', fill=(92, 90, 84), font=F(18, True)); y += 26
        sheet.paste(imgs[1], (x, y)); y += h_dark + GAP
        d.text((x, y - 4), 'Móvil', fill=(92, 90, 84), font=F(18, True)); y += 26
        sheet.paste(ph, (x + (COLW - ph.width) // 2, y))
    sheet.save(os.path.join(out, f'L2-{biz}.jpg'), quality=86, optimize=True)
    print(biz, sheet.size, os.path.getsize(os.path.join(out, f'L2-{biz}.jpg')) // 1024, 'KB')
