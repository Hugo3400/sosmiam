# Bot Discord de SOS Miam

Présente SOS Miam, répond à la FAQ, explique le BIG SOS, recueille les propositions de lieux et accueille les nouveaux membres.

## Commandes
| Commande | Qui | Ce qu'elle fait |
|---|---|---|
| `/sosmiam` | tout le monde | SOS Miam en 30 secondes |
| `/faq` | tout le monde | une question de la FAQ, avec suggestions pendant la frappe |
| `/big-sos` | tout le monde | l'alerte rouge expliquée |
| `/proposer-lieu` | tout le monde | formulaire, puis la pépite est postée dans le salon des propositions (avec 😋 pour voter) |
| `/contact` | tout le monde | comment écrire à l'équipe |
| `/config` | gestion du serveur | salons d'accueil et de propositions |
| `/publier` | gestion du serveur | publie le règlement ou la présentation dans le salon courant |

Les commandes sont enregistrées sur chaque serveur au démarrage du bot : elles apparaissent tout de suite.

## Mise en route
1. **Jeton** : [portail Discord](https://discord.com/developers/applications) > l'application > **Bot** > **Reset Token**.
   Copie `.env.exemple` en `.env` et colle le jeton après `DISCORD_JETON=`. Le `.env` n'est jamais commité.
2. **Accueil des nouveaux** (facultatif) : même onglet **Bot**, active **Server Members Intent**, puis mets `INTENT_MEMBRES=1`.
3. **Lancement** sur le VPS :
   ```bash
   pm2 start npm --name sos-miam-bot-discord --cwd /var/www/sos-miam/apps/bot-discord -- start
   pm2 logs sos-miam-bot-discord   # affiche le lien d'invitation
   ```
4. **Invitation** : ouvre le lien d'invitation affiché dans les journaux et choisis le serveur.
5. **Sur Discord** : `/config propositions #salon`, `/config bienvenue #salon`, puis `/publier reglement` dans le salon du règlement.

Après une modification : `pm2 restart sos-miam-bot-discord`.

## Développement
- `npm run dev` : relance le bot à chaque modification (Node lance les `.ts` tels quels, sans compilation).
- `npm run typecheck` et `npm test` (ou `npm run bot:verifier` depuis la racine).
- Les textes de `/faq` reprennent la FAQ du site (`apps/site-web/src/contenus/faq/`) : une réponse change là-bas, on la change ici aussi.
