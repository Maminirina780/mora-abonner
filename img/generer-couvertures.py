# Visuels de couverture pour les cartes Messenger.
#
# Facebook recadre les images du carrousel en 1.91:1 : on dessine donc
# directement dans ce rapport, sinon il rogne le titre. Tout est genere
# a partir de data.js — couleur, titre, prix — pour qu'un changement de
# catalogue ne laisse pas une image qui ment.
import json, math
from PIL import Image, ImageDraw, ImageFont

L, H = 1200, 628

# Quel symbole pour quelle formation. La cle est l identifiant du site,
# ou le champ « sym » pour les formations qui n existent que dans le bot.
SYMBOLES = {
    "hacking":     "bouclier",
    "kali":        "terminal",
    "fullstack":   "crochets",
    "js":          "accolades",
    "trading":     "chandelles",
    "maintenance": "cle",
    "boost":       "fusee",
    "termux":      "telephone",
    "commandes":   "rouage",
    "claude":      "etincelle",
}
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


# =====================================================================
#  UN SYMBOLE PAR FORMATION
# =====================================================================
#  Le client fait defiler son fil : il doit reconnaitre la formation
#  avant de lire le titre. Un symbole fort fait ce travail, le texte ne
#  le fait pas.
#
#  Ces symboles sont DESSINES ici, pas empruntes. Le dragon de Kali, le
#  logo Facebook ou celui de JavaScript sont des marques deposees : les
#  poser sur du materiel de vente expose le proprietaire, et le jour ou
#  il faut les retirer, c est toute la boutique qui change d aspect.
#
#  Ils sont traces sur une toile deux fois plus grande puis reduits :
#  PIL ne lisse pas les traits, et un symbole en escalier ruinerait
#  l effet recherche.
# =====================================================================

def icone(nom, taille, coul):
    Z = 2
    T = taille * Z
    c = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    ep = max(2, round(T * 0.055))
    C = coul + (255,)
    u = lambda v: v * T          # coordonnees en fraction de la boite

    def cadre(x0, y0, x1, y1, r=0.06):
        d.rounded_rectangle([u(x0), u(y0), u(x1), u(y1)], u(r), outline=C, width=ep)

    def trait(pts, w=None):
        d.line([(u(x), u(y)) for x, y in pts], fill=C, width=w or ep, joint="curve")

    if nom == "bouclier":                     # cybersecurite
        d.polygon([(u(.5), u(.08)), (u(.9), u(.24)), (u(.9), u(.56)),
                   (u(.5), u(.93)), (u(.1), u(.56)), (u(.1), u(.24))],
                  outline=C, width=ep)
        d.ellipse([u(.41), u(.38), u(.59), u(.56)], outline=C, width=ep)
        trait([(.5, .54), (.5, .70)], round(ep * 1.3))

    elif nom == "terminal":                   # Kali, pentest
        cadre(.08, .16, .92, .84, .07)
        trait([(.08, .32), (.92, .32)])
        for i, x in enumerate((.17, .23, .29)):
            d.ellipse([u(x - .018), u(.225), u(x + .018), u(.261)], fill=C)
        trait([(.22, .46), (.36, .58), (.22, .70)])
        trait([(.44, .70), (.72, .70)])

    elif nom == "crochets":                   # developpement web
        trait([(.34, .24), (.12, .5), (.34, .76)], round(ep * 1.15))
        trait([(.66, .24), (.88, .5), (.66, .76)], round(ep * 1.15))
        trait([(.58, .17), (.42, .83)], round(ep * 1.15))

    elif nom == "accolades":                  # JavaScript
        # Les deux accolades se lisaient comme un « H ». Un carre avec
        # les lettres JS ne laisse aucun doute — et ces deux lettres ne
        # sont la marque de personne.
        cadre(.08, .08, .92, .92, .12)
        po = ImageFont.truetype(GRAS, round(T * .40))
        tx = "JS"
        bb = d.textbbox((0, 0), tx, font=po)
        d.text((T / 2 - (bb[2] - bb[0]) / 2 - bb[0],
                T / 2 - (bb[3] - bb[1]) / 2 - bb[1]), tx, font=po, fill=C)

    elif nom == "chandelles":                 # trading
        for x, h0, h1, m0, m1 in ((.22, .52, .78, .44, .86), (.40, .34, .60, .26, .70),
                                  (.60, .40, .68, .30, .78), (.78, .16, .44, .10, .52)):
            trait([(x, m0), (x, m1)], max(2, round(ep * .55)))
            d.rounded_rectangle([u(x - .055), u(h0), u(x + .055), u(h1)], u(.015),
                                outline=C, width=ep)
        trait([(.12, .84), (.92, .84)], max(2, round(ep * .7)))

    elif nom == "cle":                        # maintenance
        # Une cle a molette et un tournevis croises. Le premier jet
        # dessinait deux cercles relies : on y lisait une loupe.
        d.pieslice([u(.06), u(.06), u(.40), u(.40)], 120, 45, outline=C, width=ep)
        trait([(.30, .30), (.84, .84)], round(ep * 1.25))
        d.rounded_rectangle([u(.80), u(.80), u(.94), u(.94)], u(.02), outline=C, width=ep)
        trait([(.86, .16), (.40, .66)], round(ep * 1.1))
        trait([(.30, .74), (.40, .66), (.48, .74), (.38, .84)], ep)
        trait([(.24, .80), (.32, .88)], round(ep * 1.4))

    elif nom == "fusee":                      # boost
        # Corps FERME : ouvert, on y voyait une simple fleche.
        d.polygon([(u(.5), u(.05)), (u(.68), u(.34)), (u(.68), u(.64)),
                   (u(.5), u(.74)), (u(.32), u(.64)), (u(.32), u(.34))],
                  outline=C, width=ep)
        d.ellipse([u(.435), u(.28), u(.565), u(.41)], outline=C, width=ep)
        d.polygon([(u(.32), u(.50)), (u(.14), u(.78)), (u(.32), u(.70))],
                  outline=C, width=ep)
        d.polygon([(u(.68), u(.50)), (u(.86), u(.78)), (u(.68), u(.70))],
                  outline=C, width=ep)
        trait([(.5, .78), (.5, .95)], round(ep * 1.3))
        trait([(.40, .84), (.40, .93)], max(2, round(ep * .8)))
        trait([(.60, .84), (.60, .93)], max(2, round(ep * .8)))

    elif nom == "telephone":                  # Termux
        cadre(.26, .06, .74, .94, .10)
        trait([(.34, .30), (.44, .40), (.34, .50)], max(2, round(ep * .85)))
        trait([(.50, .50), (.66, .50)], max(2, round(ep * .85)))
        trait([(.44, .84), (.56, .84)], max(2, round(ep * .9)))

    elif nom == "rouage":                     # commandes sur mesure
        import math as _m
        cx = cy = .5; R = .30
        for k in range(8):
            a = _m.radians(k * 45)
            trait([(cx + _m.cos(a) * R, cy + _m.sin(a) * R),
                   (cx + _m.cos(a) * (R + .13), cy + _m.sin(a) * (R + .13))],
                  round(ep * 1.1))
        d.ellipse([u(cx - R), u(cy - R), u(cx + R), u(cy + R)], outline=C, width=ep)
        d.ellipse([u(cx - .11), u(cy - .11), u(cx + .11), u(cy + .11)], outline=C, width=ep)

    elif nom == "etincelle":                  # abonnement assistant
        trait([(.5, .06), (.5, .94)], round(ep * .9))
        trait([(.06, .5), (.94, .5)], round(ep * .9))
        trait([(.17, .17), (.83, .83)], round(ep * .75))
        trait([(.83, .17), (.17, .83)], round(ep * .75))
        d.ellipse([u(.38), u(.38), u(.62), u(.62)], fill=C)

    return c.resize((taille, taille), Image.LANCZOS)

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

    # A droite, le symbole de la formation. Il prend la place que le
    # logo occupait : deux grands signes se disputeraient le regard, et
    # c est la FORMATION que le client doit reconnaitre en premier. La
    # marque, elle, est signee en tete.
    sym = icone(SYMBOLES.get(f.get("sym") or f["id"], "bouclier"), 330, acc)
    halo = Image.new("RGBA", img.size, (0, 0, 0, 0))
    halo.paste(sym, (L - 400, (H - 330) // 2 + 10), sym)
    img.paste(Image.alpha_composite(img.convert("RGBA"),
              Image.blend(Image.new("RGBA", img.size, (0, 0, 0, 0)), halo, 0.92)
              ).convert("RGB"), (0, 0))
    d = ImageDraw.Draw(img)

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

# Les formations qui n existent que dans le bot. Elles n ont pas de
# fiche sur le site, donc ni couleur ni sous-titre : on les decrit ici.
#
# Elles etaient dans un second script, qui lisait une ancienne copie de
# celui-ci : ses trois couvertures sont restees sans logo ni symbole
# pendant que les sept autres en avaient. Deux scripts pour un meme
# dessin finissent toujours par diverger.
cat += [
  {"id": "termux", "titre": "Base Termux (Android)",
   "sous": "Manomboka amin'ny finday, tsy mila ordinateur",
   "prix": 50000, "acc": "#4ade80"},
  {"id": "commandes", "titre": "Commandes spéciales",
   "sous": "Script sy fitaovana Termux / Kali natao ho anao",
   "prix": 10000, "acc": "#fbbf24"},
  {"id": "claude", "titre": "Abonnement Claude",
   "sous": "Partagé na personnel, araka ny ilainao",
   "prix": 30000, "acc": "#a78bfa"},
]

for f in cat:
    p = couverture(f, f"img/{f['id']}.jpg")
    print(f"{f['id']:<13} {p}")
