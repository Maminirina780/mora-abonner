# Visuels de couverture pour les cartes Messenger.
#
# Facebook recadre les images du carrousel en 1.91:1 : on dessine donc
# directement dans ce rapport, sinon il rogne le titre. Tout est genere
# a partir de data.js — couleur, titre, prix — pour qu'un changement de
# catalogue ne laisse pas une image qui ment.
import json, math
from PIL import Image, ImageDraw, ImageFont

L, H = 1200, 628
GRAS = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
NORM = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def melange(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))

def lignes(texte, police, largeur, dessin):
    out, ligne = [], ""
    for mot in texte.split():
        essai = (ligne + " " + mot).strip()
        if dessin.textlength(essai, font=police) <= largeur:
            ligne = essai
        else:
            if ligne: out.append(ligne)
            ligne = mot
    if ligne: out.append(ligne)
    return out

def couverture(f, chemin):
    acc = rgb(f["acc"])
    fond = (11, 18, 32)                      # le bleu nuit du site
    img = Image.new("RGB", (L, H), fond)
    d = ImageDraw.Draw(img)

    # Halo diagonal aux couleurs de la formation : la meme identite que
    # la fiche du site, sans copier une photo dont on n'a pas les droits.
    for y in range(H):
        for x in range(0, L, 4):
            t = max(0.0, 1 - math.hypot(x - L * 0.78, y - H * 0.28) / (L * 0.62))
            if t > 0:
                d.rectangle([x, y, x + 3, y], fill=melange(fond, acc, t * t * 0.42))

    # Trame technique, discrete
    for x in range(0, L, 48): d.line([(x, 0), (x, H)], fill=melange(fond, acc, .07))
    for y in range(0, H, 48): d.line([(0, y), (L, y)], fill=melange(fond, acc, .07))

    d.rectangle([0, 0, L, 8], fill=acc)

    marque = ImageFont.truetype(GRAS, 30)
    d.text((64, 56), "MORA ABONNER", font=marque, fill=melange(fond, acc, .92))

    titre = ImageFont.truetype(GRAS, 68)
    ls = lignes(f["titre"], titre, L - 128, d)[:3]
    y = 168
    for l in ls:
        d.text((64, y), l, font=titre, fill=(245, 248, 255)); y += 84

    if f.get("sous"):
        sous = ImageFont.truetype(NORM, 32)
        for l in lignes(f["sous"], sous, L - 128, d)[:2]:
            d.text((64, y + 10), l, font=sous, fill=(168, 182, 205)); y += 44

    # Le prix, recopie du catalogue, jamais recalcule.
    px = ImageFont.truetype(GRAS, 46)
    txt = f"{f['prix']:,}".replace(",", ".") + " Ar"
    w = d.textlength(txt, font=px)
    d.rounded_rectangle([64, H - 132, 64 + w + 56, H - 44], 20, fill=acc)
    d.text((92, H - 118), txt, font=px, fill=(8, 14, 26))

    img.save(chemin, "JPEG", quality=88, optimize=True)
    return chemin

# Le catalogue du site est la seule source : couleur, titre, prix.
# Regenerer apres un changement de catalogue evite qu'une image affiche
# un prix que le site ne pratique plus.
#
#   node -e "const s=require('fs').readFileSync('data.js','utf8');
#     console.log(s.slice(s.indexOf('['), s.lastIndexOf(']')+1))" > /tmp/cat.json
#   python3 img/generer-couvertures.py
cat = json.load(open("/tmp/cat.json"))
for f in cat:
    p = couverture(f, f"img/{f['id']}.jpg")
    print(f"{f['id']:<13} {p}")
