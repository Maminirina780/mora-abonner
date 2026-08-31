# Mora Abonner — Site vitrine

Site multi-pages de présentation du catalogue de formations **Mora Abonner**.

> 💻 Fampiofanana Informatika 100% an-tserasera · 🚀🌱 Ho an'ny vao manomboka
> 🎥 Lesona tsotra sy mora arahina · 🤝 Fanohanana · 💰 Vidiny mirary · 🎁 Bonus

## Pages

- **index.html** — accueil : présentation Mora Abonner, catalogue filtrable, calculateur d'espace, livraison, FAQ
- **formation.html?f=ID** — page détail par formation : résumé, langue, ce qu'on apprend, pour qui, prérequis, arborescence complète fichier par fichier

## Fonctionnalités

- **Navbar** avec menu responsive (burger) et **recherche globale** (touche `/` ou `Ctrl/Cmd+K`) sur formations, dossiers et fichiers
- **Langue précisée** pour chaque formation (malgache / français) avec note explicative
- **Boutons de contact uniquement** — le numéro n'est jamais affiché en clair, mais le clic redirige (appel / WhatsApp) normalement
- **Logiciels masqués** — les fichiers .zip/.rar/.7z/.exe/.iso/.apk n'affichent que leur 1re lettre + 🔒 ; leur vrai nom est absent du code et non indexé (introuvable sans achat)
- **Calculateur d'espace** — le client sait si sa clé 8/16/32/64/128 Go suffit
- Responsive 360 px → 1500 px+, thème sombre, animations respectant `prefers-reduced-motion`

## Contact (via boutons)

Appel : 038 15 037 34 · WhatsApp : 033 72 479 42

## Stack

HTML / CSS / JavaScript purs, aucune dépendance.

```
index.html      accueil
formation.html  gabarit page détail
style.css       design + responsive
data.js         catalogue extrait du disque (noms de logiciels retirés)
shared.js       navbar, recherche globale, contact, formatage
app.js          logique de l'accueil
formation.js    logique de la page détail
```
