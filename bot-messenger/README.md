# Bot Messenger — Mora Abonner (Cloudflare Worker)

Code du Worker Cloudflare **`bot-mora-abonner`**, qui fait tourner l'agent IA
de la Page Facebook. Jusqu'ici ce code n'existait que déployé sur Cloudflare,
sans aucune sauvegarde. Il est désormais versionné ici.

- `worker.js` — le Worker complet, **corrigé** (voir plus bas)
- `CORRECTIFS.diff` — le détail exact des corrections, ligne par ligne

## Ce qui était cassé

### 1. Les messages n'arrivaient plus complets

Facebook **refuse en bloc** tout message de plus de 2000 caractères : il ne le
raccourcit pas, il le rejette (erreur #100). Or `morceaux()`, qui découpe un
message en plusieurs bulles, ne plafonnait jamais une bulle à cette limite.
Une fiche un peu longue — ou sa traduction, toujours plus longue que
l'original — n'était donc **pas envoyée du tout**.

Aggravant : dans `envoyerHumain()`, la première bulle refusée faisait abandonner
**toutes les suivantes**. Le client recevait un début de réponse, puis plus rien.

Corrigé par :
- une fonction `tailler()` qui coupe à la frontière la plus naturelle encore
  disponible (fin de paragraphe, fin de phrase, fin de ligne, espace — jamais
  en plein mot), appliquée en garde-fou final de `morceaux()` ;
- `envoyerHumain()` qui poursuit l'envoi des bulles restantes, et ne s'arrête
  que sur une panne qui condamne aussi la suite (jeton invalide, permission
  retirée, fenêtre de 24 h fermée) ;
- le texte d'un « button template » plafonné à 640 caractères **après**
  traduction, et les titres de cartes du carrousel à 80.

### 2. L'assistant répondait coupé, ou pas du tout

`gemini-flash-latest` est un **alias** : Google le fait pointer vers ses modèles
récents, qui *réfléchissent* avant de répondre et facturent cette réflexion sur
`maxOutputTokens`. Le budget de 2000 partait dans la réflexion interne, et la
réponse arrivait tronquée — ou vide (`MAX_TOKENS` atteint avant le premier mot),
auquel cas le client ne recevait que le message de secours.

Corrigé par `thinkingConfig: { thinkingBudget: 0 }`, avec repli automatique et
mémorisé pour les modèles qui refusent ce réglage (pour ne pas consommer deux
appels de quota par message). En prime, une réponse malgré tout tronquée
s'arrête maintenant à la dernière phrase terminée.

### 3. L'assistant restait muet alors qu'un moteur était disponible

`iaDoitRepondre()` exigeait `GEMINI_API_KEY`. Si cette clé manquait, l'assistant
était éteint **en entier** — alors que la clé n°2 ou le secours Cloudflare
Workers AI, tous deux prêts, auraient répondu. Le bot se taisait donc sur tout
ce que les mots-clés ne couvrent pas, c'est-à-dire sur l'essentiel d'une
conversation de vente.

Corrigé : il suffit maintenant qu'**un** moteur soit disponible.

## Déploiement

Ce Worker se gère depuis l'éditeur Cloudflare (un seul fichier) :

1. Cloudflare → Workers & Pages → `bot-mora-abonner` → Edit code
2. Remplacer tout le contenu par `worker.js`
3. Deploy

Les réglages (textes, formations, boutons, mots-clés) ne sont **pas** dans ce
fichier : ils vivent dans KV et se modifient sur `/admin`. Ce déploiement ne
les touche pas.

## Réglage à vérifier dans /admin

Le code ne peut pas décider à votre place si l'assistant doit parler.
Si le bot « n'agit pas dans le cadre de la vente », c'est que l'assistant est
réglé sur **« Ne répondre que si je suis absent »** avec l'interrupteur éteint :
il ne répond alors qu'aux mots-clés exacts et se tait sur tout le reste.

→ `/admin` → Assistant IA → Réglages → **« Toujours répondre »**
