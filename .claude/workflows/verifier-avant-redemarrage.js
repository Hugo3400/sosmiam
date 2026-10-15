export const meta = {
  name: 'verifier-avant-redemarrage',
  description: "Avant de redémarrer l'API : trois vérificateurs en lecture seule (tests et démarrage d'essai, migrations face à la base, ce qui part en ligne) et un verdict « stable »",
  whenToUse: "Juste avant un pm2 restart de sos-miam-api, ou pour savoir si l'API du disque peut être déclarée « stable ». args (facultatif) : une liste de points à vérifier en plus.",
  phases: [
    { title: 'Vérification', detail: 'tests et démarrage, migrations, ce qui part en ligne : en parallèle, en lecture seule' },
  ],
}

// Vérifier avant de redémarrer l'API (pm2 « sos-miam-api ») : trois vérificateurs en parallèle, en lecture seule,
// rendent chacun un verdict. L'API est « stable » quand aucun ne relève de problème bloquant ou important, et
// qu'aucun n'a manqué à l'appel (un verdict absent n'est pas un feu vert).
// Lancement : Workflow({ name: 'verifier-avant-redemarrage' }), ou avec des points en plus :
// Workflow({ name: 'verifier-avant-redemarrage', args: ['le ménage de nuit ne touche pas aux listes', '…'] }).
// Rend { tests, migrations, enLigne, stable }. Le script ne lance rien lui-même : tout passe par les agents.

// Les points en plus : un tableau de textes, un texte seul, ou { points: [...] } (un tableau envoyé en texte JSON
// est relu aussi). Chaque point est donné aux trois vérificateurs, qui prennent ceux de leur angle.
const lirePoints = (a) => {
  if (a === undefined || a === null) return []
  if (typeof a === 'string') {
    const texte = a.trim()
    if (texte.startsWith('[') || texte.startsWith('{')) {
      try { return lirePoints(JSON.parse(texte)) } catch { /* pas du JSON : un point écrit tel quel */ }
    }
    return texte ? [texte] : []
  }
  if (Array.isArray(a)) return a.flatMap((x) => (typeof x === 'string' ? lirePoints(x) : x ? [JSON.stringify(x)] : []))
  if (typeof a === 'object') return lirePoints(a.points)
  return [String(a)]
}
const points = lirePoints(args)
if (args !== undefined && args !== null && !points.length) log('args reçus mais aucun point lu : ' + JSON.stringify(args).slice(0, 200))

const VERDICT = { type: 'object', properties: {
  conforme: { type: 'array', items: { type: 'string' } },
  problemes: { type: 'array', items: { type: 'object', properties: {
    gravite: { type: 'string', enum: ['bloquant', 'important', 'mineur'] }, titre: { type: 'string' }, preuve: { type: 'string' }, correction: { type: 'string' },
  }, required: ['gravite', 'titre', 'preuve', 'correction'] } },
  verifications: { type: 'string' },
}, required: ['conforme', 'problemes', 'verifications'] }

const COMMUN = `Projet SOS Miam, monorepo /var/www/sos-miam. Réponds en français.
VÉRIFICATION AVANT LE REDÉMARRAGE DE L'API. pm2 « sos-miam-api » lance « npm run start » dans apps/api, soit node --env-file-if-exists=.env src/demarrer.ts. Node lance les .ts tels quels depuis le disque : c'est l'état du DISQUE au redémarrage qui part en ligne, pas HEAD. Deux autres vérificateurs travaillent en même temps sur les autres angles : ne refais pas leur travail, sauf pour lever un doute de ton angle.

LECTURE SEULE, sans exception :
- aucun fichier du dépôt modifié, créé ou supprimé (code, docs, package.json, package-lock.json, migrations) ; aucun git add, commit, stash, checkout, reset, restore ni clean ;
- aucun pm2 restart, reload, stop, start, delete ni save ; aucun processus arrêté en dehors de ceux que tu lances toi-même ;
- aucune migration ni écriture en base : ni npm run api:migrer, ni prisma migrate deploy, dev, reset ou resolve, ni prisma db push ou db execute ; en SQL, rien d'autre que SELECT, SHOW et EXPLAIN (jamais EXPLAIN ANALYZE, qui exécute la requête), dans une session en lecture seule, et seulement sur _prisma_migrations, information_schema, pg_catalog, ou en agrégats (count) : jamais une colonne de données d'un compte (e-mail, nom, message…) à l'écran ; ne tente JAMAIS une écriture sur la vraie base, même pour voir le refus : pour prouver la lecture seule, SELECT current_setting('transaction_read_only') doit rendre « on » ;
- aucune installation (npm install, npm ci, npx qui télécharge) : utilise les binaires de node_modules/.bin ;
- aucun .env ni secret lu ou affiché : ni apps/api/.env (pas même un grep dedans), ni /root/sosmiam-compte-revue.txt, ni /root/sos-miam-secrets, ni les clés de /var/lib/sos-miam, ni /root/sos-miam-donnees (inscrits, e-mails), ni /var/backups/sos-miam (sauvegardes). pm2 seulement à travers le filtre jq de l'angle « ce qui part en ligne » (jamais pm2 env, show, describe, prettylist, ni pm2 jlist affiché en entier : ils montrent l'environnement du processus). Prisma jamais lancé depuis apps/api avec sa config, qui charge .env ; seule exception connue : le « prisma generate » de npm run api:verifier, qui le charge dans son propre processus sans rien afficher (dis-le dans verifications) ;
- tes essais et fichiers temporaires vont dans un dossier « verif-avant-redemarrage/<ton angle>/ » de ton dossier de travail temporaire (le scratchpad indiqué dans ton environnement ; à défaut, un dossier créé par mktemp -d), jamais dans le dépôt.
D'autres sessions modifient le disque pendant ce temps, et un processus extérieur commite tout seul sous le nom Hugo3400 : c'est normal, mais ses messages de commit peuvent être faux (juge sur le diff, jamais sur le message). Note HEAD et « GIT_OPTIONAL_LOCKS=0 git status --porcelain -- apps/api packages/commun » au début et à la fin ; si l'un des deux a bougé, relance ce que ces fichiers touchent et dis lesquels.`

const GRAVITES = `Gravité de chaque problème (le verdict « stable » en dépend : ni bloquant, ni important) :
- bloquant : le redémarrage casserait quelque chose tout de suite ou dès la première nuit (l'API ne démarre pas, un import ou un export manque, une migration lue par le code n'est pas appliquée, un test rouge qui montre un vrai défaut, une tâche de nuit qui effacerait des données à tort, une dépendance absente de node_modules) ;
- important : à régler ou à annoncer avant de déclarer l'API « stable » (un format de réponse qui casse l'app installée ou le logiciel installé, une migration destructive, une variable d'environnement nouvelle exigée dont la présence n'est pas prouvée, un doute non levé sur un point qui serait bloquant) ;
- mineur : à noter sans retenir le redémarrage (un texte, un essai périmé, un test de chronométrage qui échoue sous la charge et passe seul, une erreur de typage de l'app qui ne vient pas de packages/commun).
Ne gonfle pas et ne minimise pas. Chaque problème : un titre court, une preuve (fichier:ligne, hash de commit, extrait court de sortie), une correction (quoi faire, et par quelle session ou personne). Dans « conforme » : ce qui est vérifié et juste, avec les chiffres (tests réussis sur le total, nombre de migrations…). Dans « verifications » : les commandes lancées, ce que tu n'as pas pu faire et pourquoi, les fichiers d'essai écrits.`

const TESTS = `Ton angle : TESTS ET DÉMARRAGE.
1. À la racine du dépôt : npm run api:verifier (prisma generate et tsc de l'API, node --test sur apps/api/tests, verifier:lignes) ; puis npm run commun:tester ; puis npm run verifier:lignes seul (résultat exact, avec les avertissements au-dessus de 500 lignes). Rapporte les nombres exacts (tests réussis sur le total, durée). Un test rouge : relance-le seul (même commande que le script « test » de apps/api/package.json, sur ce seul fichier), puis dis s'il vient d'un vrai défaut, d'un chantier en cours d'une autre session (fichier modifié ou non suivi, à citer) ou de la charge de la machine (test de chronométrage : donne la charge avec uptime).
2. À titre d'information : apps/app-mobile/node_modules/.bin/tsc --noEmit -p apps/app-mobile. Ses erreurs ne retiennent pas l'API, sauf si elles viennent d'un fichier de packages/commun (que l'API charge aussi).
3. Imports de demarrer.ts : il écoute un port et lance des minuteurs dès son chargement, ne l'importe donc pas tel quel. Recopie ses déclarations import statiques dans un fichier .ts de ton dossier de travail, en chemins absolus, et exécute-le avec node depuis apps/api, dans le même environnement réduit qu'au point 4 : chaque import doit se lier (aucun ERR_MODULE_NOT_FOUND, aucun export nommé manquant). Puis charge un par un chaque module .ts de apps/api/src (hors demarrer.ts et base-de-donnees/client-genere/) et compte les échecs ; un module qui agit à son chargement (port, minuteur, écriture) : signale-le au lieu de forcer.
4. Démarrage d'essai, comme pm2 mais sans rien de réel. Depuis apps/api, « env -i » avec seulement PATH, HOME, NODE_ENV=production, HOST=127.0.0.1, un PORT d'essai libre (5899 par exemple, vérifie avec ss -ltn), DATABASE_URL=postgresql://rien:rien@127.0.0.1:1/rien (jamais contactée), SCHEMA_BASE=essai_verif_redemarrage (coupe tâches de nuit, courriels, notifications et votes : relis dans demarrer.ts que c'est toujours vrai), et CHAQUE variable de chemin de fichier ou de dossier redirigée vers un dossier vide de ton dossier de travail. Fais la liste à jour avec grep -rnE "process\\.env" apps/api/src (le 15/10/2026 : SOS_MIAM_CLE_DONNEES, FICHIER_GESTION, DOSSIER_SECRETS_PUSH, FICHIER_BOITE_MAIL, FICHIER_CLE_SAUVEGARDES, DOSSIER_SAUVEGARDES, DOSSIER_MEDIAS, DOSSIER_MEDIAS_CHAT, DOSSIER_MAJ, DOSSIER_PRESSE, FICHIER_DESINSCRITS, FICHIER_INSCRITS_CSV) ; pour une variable nouvelle, lis sa valeur par défaut dans le code : si elle pointe vers un vrai fichier ou un vrai dossier, redirige-la aussi. Lance « node src/demarrer.ts » (sans --env-file) en arrière-plan, journal dans ton dossier ; attends « API SOS Miam prête » (30 s au plus) ; interroge GET /app/temps et GET /app/version (200 attendus), GET /inexistant (404 « introuvable ») et POST /app/avis sans session (401) ; vérifie que le processus vit encore ; envoie SIGTERM (comme pm2 reload) : il doit s'arrêter seul, avec le code 0, en moins de 15 s (sinon kill -9, et c'est un problème). Ensuite : aucun fichier écrit hors de ton dossier d'essai (git status inchangé, find dans le dossier d'essai) ; au journal, seuls messages attendus : la clé de chiffrement absente et la base injoignable (P1001) ; tout autre message est à expliquer.
5. Essais sur une vraie base : node -p "require('/var/www/sos-miam/package.json').scripts?.['api:essais-base'] ?? 'absent'".
   - S'il existe, lis d'abord ce qu'il lance : il ne doit toucher qu'une base d'essai (PGlite, ou un schéma d'essai) et ne lire aucun .env. Si c'est le cas, lance npm run api:essais-base à la racine et rapporte, pour chaque essai, le nombre de migrations rejouées et de vérifications. Sinon, ne le lance pas et classe-le « important ».
   - S'il n'existe pas, écris-le seulement dans verifications (« api:essais-base n'existe pas encore dans le package.json racine : essais sur base non lancés »), sans en faire un problème.`

const MIGRATIONS = `Ton angle : MIGRATIONS (dossier apps/api/prisma/migrations, schéma apps/api/prisma/schema, base PostgreSQL « sosmiam » du VPS).
1. Le dossier : chaque migration (dossiers AAAAMMJJHHMMSS_nom, dans l'ordre), avec la somme sha256 de son migration.sql (le « checksum » que Prisma garde en base), son état dans git (suivie, modifiée, non suivie), et les migration.sql modifiés après leur ajout (git log --diff-filter=M --format='%h %cI %s' -- apps/api/prisma/migrations).
2. La base, en LECTURE SEULE, sans mot de passe et sans .env. Depuis un dossier lisible par postgres (cd /) : sudo -u postgres env PGOPTIONS='-c default_transaction_read_only=on' psql -X -d sosmiam -At -v ON_ERROR_STOP=1 -c "SHOW default_transaction_read_only" -c "SELECT migration_name, checksum, finished_at, rolled_back_at, applied_steps_count FROM _prisma_migrations ORDER BY migration_name". La première ligne doit être « on » ; sinon, arrête-toi et dis-le. Compare au dossier :
   - dans le dossier mais pas en base : à appliquer AVANT le redémarrage (npm run api:migrer, par la session qui redémarre, après accord ; pas par toi). Lis son SQL : additive (CREATE TABLE, CREATE INDEX, ADD COLUMN facultative ou avec DEFAULT, clé étrangère) ou destructive (DROP, RENAME, ALTER TYPE, SET NOT NULL, ADD COLUMN NOT NULL sans DEFAULT sur une table qui a des lignes, UPDATE ou DELETE de données : compte les lignes concernées en lecture seule). Si le code du disque lit ce qu'elle crée (grep de la table ou de la colonne dans apps/api/src et dans le schéma) : bloquant tant qu'elle n'est pas appliquée. Destructive : important en plus (sauvegarde avant ?) ;
   - en base mais plus dans le dossier, checksum différent, finished_at vide ou rolled_back_at rempli : important (bloquant pour une migration échouée : prisma migrate deploy refusera tout).
3. Dérive entre les migrations et le schéma du disque, sans la vraie base et sans .env (méthode du 15/10/2026, qui remplace la base fantôme) : rejoue toutes les migration.sql, dans l'ordre, dans une base PGlite en mémoire (modules @electric-sql/pglite et @electric-sql/pglite-socket importés par chemin absolu depuis un script .mts de ton dossier de travail ; pas de chemin en dur : trouve pglite-socket avec find /var/www/sos-miam/apps/api/node_modules -path '*/@electric-sql/pglite-socket/package.json', prends pglite dans le MÊME dossier node_modules et vérifie que sa version est celle que pglite-socket demande ; si apps/api/essais-base/ existe, regarde d'abord comment ses outils créent la base, et réutilise-les) ; sers-la par PGLiteSocketServer sur un port local libre (entre 58000 et 58999, vérifie avec ss -ltn) ; écris dans ton dossier un prisma.config.ts À PART, sans loadEnvFile : export default { schema: "/var/www/sos-miam/apps/api/prisma/schema", migrations: { path: "/var/www/sos-miam/apps/api/prisma/migrations" }, datasource: { url: "postgresql://postgres:postgres@127.0.0.1:<port>/postgres?sslmode=disable" } } ; puis lance, avec cwd = ton dossier et un environnement réduit à PATH et HOME : /var/www/sos-miam/apps/api/node_modules/.bin/prisma migrate diff --config <ce fichier> --from-config-datasource --to-schema /var/www/sos-miam/apps/api/prisma/schema --script. Attendu : « This is an empty migration. ». Tout autre SQL veut dire que le schéma du disque attend des changements qu'aucune migration ne porte : bloquant si le code les lit (le client Prisma régénéré les demandera), important sinon. Une migration qui ne se rejoue pas dans PGlite : dis laquelle et pourquoi (limite de PGlite ou vraie erreur).
4. Le client Prisma généré (apps/api/src/base-de-donnees/client-genere/, ignoré par git : c'est lui que l'API charge). Sa date face à la dernière modification de apps/api/prisma/schema : un schéma plus récent que le client est important (« prisma generate » à relancer ; npm run api:verifier le fait, et l'angle tests le relance pendant ta vérification : relis le client s'il bouge). Puis les tables et colonnes qu'il attend (runtimeDataModel dans client-genere/internal/class.ts : dbName du modèle, sinon son nom ; dbName du champ, sinon son nom ; champs scalaires et enum seulement) face à information_schema.columns de la vraie base (même commande psql en lecture seule) : une colonne attendue qui manque en base est bloquante.`

const EN_LIGNE = `Ton angle : CE QUI PART EN LIGNE.
1. Heure de démarrage de l'API en ligne, par ce seul filtre : pm2 jlist | jq '.[] | select(.name=="sos-miam-api") | {statut: .pm2_env.status, pm_uptime: .pm2_env.pm_uptime, redemarrages: .pm2_env.restart_time, cwd: .pm2_env.pm_cwd, script: .pm2_env.pm_exec_path, args: .pm2_env.args}'. pm_uptime compte des millisecondes depuis 1970, en UTC. Écris l'heure en UTC (date -u -d @<secondes>) ET en heure de Paris (TZ=Europe/Paris date -d @<secondes> +%Y-%m-%dT%H:%M:%S%:z). Un statut autre que « online », ou des redémarrages qui montent pendant ta vérification : l'API plante en boucle, à signaler.
2. PIÈGE DU FUSEAU (relevé le 15/10/2026) : la machine est réglée sur Europe/Paris (vérifie avec timedatectl). Un git log --since="2026-10-14 20:54" sans fuseau est lu en heure de Paris : avec une heure pm2 prise en UTC, on se décale de 2 h l'été (1 h l'hiver) et on compte comme nouveaux des commits déjà chargés au démarrage. Donne donc toujours le fuseau : --since="<heure de Paris>+02:00" (le décalage du jour, tel que date le donne avec %:z) ou --since="<heure UTC>Z", et affiche les dates des commits (--format='%h %cI %s') pour vérifier que le premier est bien postérieur au démarrage. La base de comparaison B est le dernier commit avant le démarrage : git log -1 --until="<le même instant, avec son fuseau>" --format='%H %cI'.
3. Les commits depuis le démarrage : git log --since="<instant avec fuseau>" --format='%h %cI %s' --stat -- apps/api packages/commun apps/api/prisma.
4. Le disque : GIT_OPTIONAL_LOCKS=0 git status --porcelain -- apps/api packages/commun (fichiers modifiés ET non suivis « ?? », qui partent aussi) et git diff --stat B -- apps/api packages/commun (B comparé au disque). C'est un majorant : un fichier modifié sur le disque avant le démarrage mais commité après était déjà chargé ; en cas de doute sur un changement précis, compare l'heure du commit à pm_uptime. Un fichier qui importe un fichier non suivi : à commiter ensemble (mineur). Dépendances : si apps/api/package.json, packages/commun/package.json ou le package.json racine ont changé depuis B, chaque dépendance ajoutée doit être présente dans node_modules (bloquant sinon : il faudra une installation, mais pas par toi).
5. Revue sceptique du diff de B au disque, sur apps/api/src, packages/commun/src et apps/api/prisma (lis le code, pas les messages de commit) :
   - imports : l'angle tests charge tous les modules ; toi, cherche les imports dynamiques (import(...)) et les chemins construits, qui ne se chargent qu'au premier usage ;
   - variables d'environnement nouvelles : git diff B -- apps/api/src packages/commun/src | grep -nE '^[+-].*process\\.env'. Pour chacune : exigée au démarrage (l'API s'arrête sans elle) ou facultative, et sa valeur par défaut. Tu ne peux pas lire .env : une variable exigée est « important », avec la correction « Hugo confirme que X est dans apps/api/.env » ;
   - migrations nécessaires : toute table ou colonne lue par le code nouveau et créée par une migration récente. Vérifie qu'elle est appliquée par le même SELECT en lecture seule que l'angle migrations, depuis cd / : sudo -u postgres env PGOPTIONS='-c default_transaction_read_only=on' psql -X -d sosmiam -At -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY migration_name" ;
   - tâches de nuit (apps/api/src/taches/ et les services de ménage qu'elles appellent) : pour chaque étape changée, les seuils (durées, plafonds), les conditions WHERE (une condition retirée ou inversée efface tout), les statuts visés (jamais une ligne acceptée ou en cours), les fichiers du disque visés (seulement les noms prévus, dans le bon dossier) et les garde-fous (signalement ouvert, délai de contestation). Si besoin, compte ce que chaque requête toucherait cette nuit, en lecture seule (SELECT count(*) dans une session PGOPTIONS en lecture seule ; EXPLAIN sans ANALYZE pour vérifier qu'une requête brute est valide sur le vrai schéma). Dis aussi si le redémarrage déclenche un rattrapage immédiat d'une tâche ;
   - formats de réponse : pour chaque route dont le contrôleur, le présentateur ou le type commun a changé depuis B, cherche les champs retirés ou renommés, un type changé, un code d'erreur qui change de sens, un statut HTTP différent. Compare avec l'app déjà installée sur les téléphones (au plus récent, son code au commit B : git show B:apps/app-mobile/… ; une version compilée peut être plus ancienne) et avec le logiciel de gestion installé (version publiée dans /var/lib/sos-miam/mises-a-jour/latest.json, à relier à son commit par sa pub_date et par git log -- apps/logiciel-gestion/src-tauri/tauri.conf.json ; lis seulement ce manifeste). Un ajout est sans risque ; un retrait ou un changement de sens qu'un client installé lit : important (bloquant s'il le fait planter).
6. Dans verifications, fais la liste des changements de comportement visibles au redémarrage (routes ajoutées ou changées, refus nouveaux, tâches de nuit, notifications…), avec leurs hash de commit.`

const POINTS = points.length
  ? `\n\nPOINTS À VÉRIFIER EN PLUS, demandés pour ce passage :\n${points.map((p, i) => `${i + 1}. ${p}`).join('\n')}\nTraite ceux qui relèvent de ton angle, preuves à l'appui, comme le reste (un défaut trouvé va dans problemes). Ceux qui ne relèvent d'aucun des trois angles (tests et démarrage, migrations, ce qui part en ligne) reviennent à l'angle « ce qui part en ligne ». Dans verifications, dis pour chaque point : traité par toi, ou laissé à quel angle.`
  : ''

const ANGLES = [
  { cle: 'tests', nom: 'Tests et démarrage', consigne: TESTS },
  { cle: 'migrations', nom: 'Migrations', consigne: MIGRATIONS },
  { cle: 'enLigne', nom: 'Ce qui part en ligne', consigne: EN_LIGNE },
]

phase('Vérification')
if (points.length) log(`${points.length} point(s) en plus, donnés aux trois vérificateurs : ${points.join(' ; ')}`)
const verdicts = await parallel(ANGLES.map((a) => () => agent(
  `${COMMUN}\n\n${a.consigne}${POINTS}\n\n${GRAVITES}`,
  { label: `verif:${a.cle}`, phase: 'Vérification', schema: VERDICT },
)))
const [tests, migrations, enLigne] = verdicts

// Le bilan : un verdict absent (agent arrêté ou en échec) compte comme « pas stable », jamais comme un feu vert
const compter = (v, gravite) => (v?.problemes ?? []).filter((p) => p.gravite === gravite).length
const absents = ANGLES.filter((a, i) => !verdicts[i]).map((a) => a.nom)
const aRegler = ANGLES.flatMap((a, i) => (verdicts[i]?.problemes ?? [])
  .filter((p) => p.gravite === 'bloquant' || p.gravite === 'important')
  .map((p) => `[${p.gravite}] ${a.nom} : ${p.titre}`))
const stable = absents.length === 0 && aRegler.length === 0

ANGLES.forEach((a, i) => {
  const v = verdicts[i]
  log(v
    ? `${a.nom} : ${v.conforme.length} point(s) conforme(s), ${compter(v, 'bloquant')} bloquant(s), ${compter(v, 'important')} important(s), ${compter(v, 'mineur')} mineur(s)`
    : `${a.nom} : pas de verdict (agent arrêté ou en échec), à relancer`)
})
if (aRegler.length) log(`À régler avant de redémarrer :\n${aRegler.join('\n')}`)
if (tests && /essais sur base non lancés|api:essais-base n'existe pas/.test(tests.verifications)) log('Attention : les essais sur une vraie base (api:essais-base) n\'ont pas tourné pendant ce passage.')
log(stable
  ? 'Stable : rien de bloquant ni d\'important sur les trois angles. Le redémarrage peut se faire.'
  : `Pas stable : ${aRegler.length} problème(s) bloquant(s) ou important(s)${absents.length ? `, et pas de verdict pour : ${absents.join(', ')}` : ''}. On ne redémarre pas encore.`)

return { tests, migrations, enLigne, stable }
