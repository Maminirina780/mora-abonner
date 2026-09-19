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


# Le logo Mora Abonner, redessine a partir de logo.svg.
# Deux traces : le M cyan, le A vert. Les memes coordonnees que le SVG
# (zone 128x112), mises a l echelle — si le logo du site change, ces
# chiffres sont les seuls a reprendre.
M_TRACE = [(22, 92), (22, 30), (52, 74), (82, 30)]
A_TRACES = [[(82, 30), (110, 92)], [(60, 63), (97, 63)]]
CYAN, VERT = (34, 211, 238), (74, 222, 128)

def logo_sur(img, x, y, taille, opacite=255):
    """Dessine le logo. Sur son propre calque, pour pouvoir l attenuer
    sans toucher au reste : un filigrane trop present mangerait le titre."""
    e = taille / 128.0
    ep = max(2, round(16 * e))
    calque = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(calque)
    pt = lambda p: (x + p[0] * e, y + p[1] * e)

    d.line([pt(p) for p in M_TRACE], fill=CYAN + (opacite,), width=ep, joint="curve")
    for t in A_TRACES:
        d.line([pt(p) for p in t], fill=VERT + (opacite,), width=ep)
    # Les extremites arrondies du SVG : PIL ne les fait pas, on les pose.
    for p in [M_TRACE[0], M_TRACE[-1]] + [q for t in A_TRACES for q in t]:
        cx, cy = pt(p); r = ep / 2
        coul = VERT if any(p in t for t in A_TRACES) else CYAN
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=coul + (opacite,))

    img.alpha_composite(calque) if img.mode == "RGBA" else \
        img.paste(Image.alpha_composite(img.convert("RGBA"), calque).convert("RGB"), (0, 0))

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

    # Le logo en grand, a droite : c est la premiere chose que le
    # client voit dans son fil, avant meme de lire le titre.
    logo_sur(img, L - 455, H - 500, 430, 78)

    # Et net, en tete, avec le nom : le filigrane donne la presence, la
    # signature donne le nom.
    logo_sur(img, 64, 38, 68, 255)
    marque = ImageFont.truetype(GRAS, 30)
    d = ImageDraw.Draw(img)
    d.text((156, 56), "MORA ABONNER", font=marque, fill=(236, 243, 255))

    titre = ImageFont.truetype(GRAS, 68)
    # Le titre ne descend jamais dans la zone du logo : deux elements
    # qui se chevauchent donnent une image bricolee, et c est exactement
    # l inverse de ce qu on cherche ici.
    ls = lignes(f["titre"], titre, L - 470, d)[:3]
    y = 168
    for l in ls:
        d.text((64, y), l, font=titre, fill=(245, 248, 255)); y += 84

    if f.get("sous"):
        sous = ImageFont.truetype(NORM, 32)
        for l in lignes(f["sous"], sous, L - 450, d)[:2]:
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
