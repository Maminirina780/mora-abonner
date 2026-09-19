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

### 4. Le silence de 30 minutes ne s'armait pas toujours

Quand vous répondez vous-même à un client, le bot doit se taire devant lui —
30 minutes par défaut, réglable. Ce silence s'arme en reconnaissant *qui* a
écrit le message parti de la Page : vous, ou le robot.

La reconnaissance reposait uniquement sur la comparaison des `app_id`. Or
`monAppId()` renvoie `null` dès que Facebook refuse de nous donner notre propre
identifiant d'application. Le code retombait alors sur « pas d'`app_id` = c'est
vous » — vrai depuis l'application Messenger, **faux depuis Meta Business
Suite**, qui est elle-même une application et signe donc avec *son* `app_id`.
Vos réponses y étaient classées « robot », le silence ne s'armait pas, et le
bot continuait de parler par-dessus vous en pleine négociation.

Corrigé par une preuve directe, qui ne dépend plus des `app_id` :

- le bot retient l'identifiant de **chaque** message qu'il envoie (`noterEnvoi`) ;
- l'écho qui revient quelques secondes plus tard porte ce même identifiant :
  c'est la preuve que le message vient du robot ;
- et puisque cet écho vient certainement de nous, l'`app_id` qu'il porte est le
  nôtre — le Worker **l'apprend sur le terrain** et le garde un mois. Un seul
  message du bot suffit donc à rétablir la bonne lecture des réponses envoyées
  depuis Business Suite.

Le repli en cas d'`app_id` encore inconnu reste volontairement l'ancien : se
tromper dans l'autre sens ferait taire le bot devant ses propres messages, et
il n'en sortirait plus jamais.

## Le silence après votre réponse

Réglages déjà présents dans `/admin` → Conversations :

- **interrupteur** : le silence est actif ou non ;
- **compteur principal** : la durée pour tous les clients, de 1 minute à
  12 heures, **30 minutes par défaut** ;
- **réglage individuel** : une durée propre à une conversation, qui remplace
  la valeur générale pour ce client-là.

Ce qui reste servi pendant le silence : **le clic sur un bouton**, et lui seul.
C'est une demande explicite du client, que vous n'avez pas interceptée ; un
bouton qui ne répond pas passe pour une panne. Les mots-clés, eux, se taisent
comme le reste.

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
