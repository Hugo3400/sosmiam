// Politique de confidentialité : uniquement ce qui est réellement traité au 8 octobre 2026.
// Toute nouveauté (app, pub, cookies de mesure, prestataire d'e-mails, bons solidaires) doit être ajoutée ici AVANT de démarrer.
// Statistiques de visite (8 octobre 2026) : comptage côté serveur, sans cookie, dans les conditions d'exemption de la CNIL
// (apps/api/src/services/mesure.ts, apps/site-web/src/services/mesure.server.ts, page /statistiques pour s'y opposer).
// À CONFIRMER AVEC FEELB AVANT MISE EN LIGNE : le MX de sosmiam.fr est mail.yubox.io (159.100.240.189, Exoscale / Akenes SA,
// Genève, Suisse). Qui exploite ce serveur, et où la boîte bonjour@ est-elle stockée ? Adapter « messagerie » ci-dessous.
// Cloudflare : sous-traitant d'après son contrat de traitement des données (cloudflare.com/cloudflare-customer-dpa), mais sa
// politique de confidentialité indique qu'il tire du trafic des « Network Data » pour la sécurité de son réseau (usage propre).
// Journaux nginx : logrotate « daily / rotate 14 » (par nombre de fichiers) : une ligne vit jusqu'à 15 jours.
import { editeur, hebergeur, prestataires, site } from "~/contenus/legal/informations-legales";
import type { DocumentLegal } from "~/contenus/legal/type-legal";

const lienEmail = `[${site.emailContact}](mailto:${site.emailContact})`;
const lienPolitiqueCloudflare = "[politique de confidentialité](https://www.cloudflare.com/privacypolicy/)";

export const documentConfidentialite: DocumentLegal = {
  titre: "Politique de confidentialité",
  description:
    "Ce que SOS Miam fait de tes données : journaux du serveur, statistiques de visite sans cookie, Cloudflare, e-mails et newsletter. Aucun cookie de pistage, zéro revente, et tes droits en clair.",
  miseAJour: "8 octobre 2026",
  introduction: [
    "Tes données, c'est comme la recette secrète d'un resto de quartier : on en prend soin et on ne la vend à personne. Ici, on t'explique sans jargon ce que SOS Miam collecte aujourd'hui (spoiler : pas grand-chose), pourquoi, combien de temps, et comment tu gardes la main dessus.",
    `Cette politique s'applique au site ${site.adresse} et à ses sous-domaines, ainsi qu'aux e-mails que tu envoies à ${lienEmail}. Elle est rédigée en application du Règlement général sur la protection des données (RGPD, règlement (UE) 2016/679) et de la loi Informatique et Libertés (loi n° 78-17 du 6 janvier 1978).`,
    "SOS Miam est encore en préparation : l'app est en développement, et il n'y a ni compte ni pub pour l'instant. Cette page décrit ce qui se passe **aujourd'hui**, et elle sera mise à jour **avant** chaque nouveauté.",
  ],
  sections: [
    {
      id: "en-bref",
      titre: "En bref",
      blocs: [
        {
          liste: [
            "**Aucun cookie de suivi, aucun pistage, aucune pub.** Seules exceptions possibles, strictement nécessaires : un cookie de sécurité de Cloudflare et, sur le site, la position où tu étais sur la page, gardée dans ton navigateur le temps de ta visite (détails plus bas).",
            "**Les journaux du serveur** gardent une trace technique de tes visites (adresse IP, page demandée…) pendant **15 jours au plus**, pour la sécurité, puis s'effacent tout seuls.",
            "**Des statistiques de visite, sans cookie** : notre serveur compte les pages vues et les visiteurs, sans jamais garder ton adresse IP ni rien qui permette de te reconnaître. Tu peux refuser d'être compté en un clic, sur la page [Tes visites et nos statistiques](/statistiques).",
            "**Cloudflare**, une entreprise américaine, protège le site : tout le trafic passe par ses serveurs, et des données peuvent être traitées hors de l'Union européenne, notamment aux États-Unis, avec les garanties prévues par le RGPD.",
            "**La newsletter** : on te prévient du lancement près de chez toi, puis on continue de te donner des nouvelles tant que tu ne te désinscris pas (un simple mail suffit, même juste « STOP »).",
            "**Le formulaire « J'inscris mon lieu »** : les informations de ton lieu servent à créer sa fiche si on accepte la demande ; ton nom, ton e-mail et ton téléphone servent seulement à te répondre, et ne sont jamais publiés.",
            "**Si tu nous écris** (lieu à inscrire, candidature d'ambassadeur, question), on garde ton message le temps d'y donner suite, et **3 ans au maximum** après ton dernier contact.",
            "**Le formulaire « Préviens-moi »** du site enregistre ton adresse e-mail, ta ville ou ta région, ton téléphone (iPhone ou Android) si tu le dis et tes réponses aux cases bêta et ambassadeur, sur notre serveur en France, pour te prévenir du lancement puis t'envoyer la newsletter. Si tu demandes la bêta, ton adresse est transmise à Google ou à Apple pour t'inviter. Si tu touches le bouton 📍, ta position arrondie sert seulement à trouver ta commune ; notre serveur ne la garde pas. Ton adresse IP sert seulement à freiner les robots : elle n'est jamais enregistrée avec ton inscription.",
            "**On ne vend jamais tes données**, et on ne les loue pas.",
            `**Tu gardes la main** : un mail à ${lienEmail} suffit pour consulter, corriger ou effacer tes données, ou t'opposer à leur utilisation.`,
          ],
        },
      ],
    },
    {
      id: "responsable",
      titre: "Qui s'occupe de tes données",
      blocs: [
        `Le responsable du traitement, c'est-à-dire la personne qui décide de ce qu'on fait de tes données et qui en répond, est **${editeur.nom}**, qui édite SOS Miam en tant que ${editeur.statut}. SOS Miam n'est pas une entreprise : tout y est gratuit et rien n'y est vendu.`,
        `Pour toute question sur tes données, écris à ${lienEmail}.`,
        "Il n'y a pas de délégué à la protection des données (DPO) : la loi ne l'impose pas pour une activité comme celle-ci. C'est l'éditeur lui-même qui te répond.",
        "Les coordonnées de l'hébergeur et les autres informations sur l'éditeur sont dans les [mentions légales](/mentions-legales).",
      ],
    },
    {
      id: "journaux",
      titre: "Les journaux du serveur",
      blocs: [
        "Comme presque tous les sites, notre serveur note chaque page qu'il envoie dans un journal (les « logs »). C'est automatique dès que tu ouvres une page.",
        {
          liste: [
            "**Ce qui est enregistré** : ton adresse IP (transmise par Cloudflare, voir plus bas), la date et l'heure, la page demandée, le code de réponse du serveur, l'adresse de la page d'où tu arrives (le « referer ») et la signature de ton navigateur (le « user-agent » : type de navigateur, système, version). En cas d'erreur, un journal d'erreurs garde aussi ton adresse IP et la page demandée, pour la même durée.",
            "**Pourquoi** : repérer et bloquer les attaques ou les abus, et comprendre une panne quand quelque chose casse. Ces journaux ne servent ni à te suivre, ni à faire des statistiques de visite (celles-ci sont comptées à part, sans garder ton adresse IP : voir la section suivante).",
            "**Base légale** : l'intérêt légitime (article 6.1.f du RGPD). L'intérêt poursuivi : assurer la sécurité et le bon fonctionnement du site.",
            `**Où et qui** : sur notre serveur, loué à ${hebergeur.nom} et situé en France. ${hebergeur.nom} agit comme sous-traitant : il héberge le serveur pour notre compte, et seul l'éditeur consulte ces journaux.`,
            "**Combien de temps** : **15 jours au plus**. Un nouveau journal démarre chaque jour ; on garde les 14 précédents, et le plus ancien est effacé automatiquement.",
            "**Obligatoire ?** Tu n'as rien à fournir : ces informations sont envoyées par ton navigateur dès qu'il demande une page.",
          ],
        },
      ],
    },
    {
      id: "statistiques",
      titre: "Les statistiques de visite",
      blocs: [
        "Pour savoir si SOS Miam intéresse du monde (combien de visites, quelles pages, d'où viennent les visiteurs), notre serveur compte lui-même les pages qu'il envoie. Pas de cookie de mesure, pas de script dans ta page, pas de service extérieur comme Google Analytics : tout se passe sur notre serveur.",
        {
          liste: [
            "**Ce qui est regardé, au moment où tu ouvres une page** : la page demandée, le nom du site d'où tu arrives (par exemple « google.com », jamais l'adresse complète de la page), le nom de la campagne si le lien en porte une (« ?utm_campaign=… », par exemple une vidéo TikTok), la grande famille de ton appareil, de ton navigateur et de ton système (« Mobile, Safari, iOS »), la langue de ton navigateur, le pays et, si Cloudflare les fournit, la région et la ville approximatives qu'il déduit de ton adresse IP, l'heure de ta visite, le temps que met le serveur à répondre, ton adresse IP et la signature de ton navigateur.",
            "**Ce qui est gardé** : uniquement des **totaux** : nombre de pages vues, de visites et de visiteurs par jour, semaine, mois et année ; pages les plus vues, pages d'arrivée et de sortie ; durée moyenne des visites et part des visites d'une seule page ; sites et campagnes d'où l'on arrive ; types d'appareils, navigateurs, systèmes, langues, pays, régions et villes ; jours et heures de visite ; clics sur les boutons de la page [Liens](/liens) ; temps de réponse du serveur ; pages introuvables demandées. **Jamais ton adresse IP**, jamais d'identifiant, jamais l'historique de ta navigation.",
            "**Compter sans reconnaître** : pour savoir combien de personnes différentes sont venues, ton adresse IP et la signature de ton navigateur sont brouillées avec un code secret tiré au hasard (un par jour, un par semaine, un par mois et un par année). L'empreinte obtenue n'est jamais enregistrée : elle fait seulement évoluer un compteur statistique (une « esquisse HyperLogLog ») qui estime le nombre de visiteurs sans garder de liste. Chaque code secret est effacé à la fin de sa période, avec son compteur : après, plus personne ne peut refaire le calcul. Pour regrouper les pages d'une même visite, l'empreinte du jour et le parcours de la visite (page d'arrivée, nombre de pages, dernière page, heure de début) restent en mémoire 30 minutes au plus après ta dernière page, sans jamais être écrits sur le disque ; ensuite, seuls des totaux sont ajoutés (une visite de plus, sa durée, sa page de sortie).",
            "**Pourquoi** : savoir ce qui plaît et améliorer le site. Ces statistiques servent uniquement à SOS Miam : elles ne sont ni vendues, ni transmises, ni croisées avec d'autres données (ton inscription à la newsletter, par exemple), et ne suivent pas ta navigation sur d'autres sites.",
            "**Base légale** : l'intérêt légitime (article 6.1.f du RGPD). L'intérêt poursuivi : mesurer l'audience du site pour l'améliorer. Cette mesure respecte les conditions fixées par la CNIL pour se passer de ton accord : usage réservé à l'éditeur, statistiques anonymes uniquement, aucun croisement ni transmission, codes secrets qui vivent un an au plus.",
            "**Combien de temps** : les codes secrets et les compteurs de visiteurs disparaissent à la fin de chaque période (le jour, la semaine, le mois ou l'année) ; le détail par jour (pages, provenances, appareils, pays…) est effacé au bout de **25 mois**. Seuls restent les totaux de vues, de visites et de visiteurs par période, anonymes.",
            `**Ton choix** : tu peux refuser d'être compté, en un clic, sur la page [Tes visites et nos statistiques](/statistiques). Un petit cookie retient alors ton refus pendant 13 mois, et sert uniquement à ça. Si ton navigateur envoie le signal « Global Privacy Control » ou « Do Not Track », tu n'es pas compté du tout, sans rien faire. Comme on ne garde rien qui permette de te reconnaître, on ne peut pas retrouver ni retirer tes visites passées des totaux.`,
            "**Pas comptés comme visiteurs** : les robots et les outils automatiques (on compte seulement leurs passages, par leur nom : « Google », « Bing »…), les pages préchargées par ton navigateur sans que tu les ouvres, et la version du site en préparation.",
            `**Où et qui** : sur notre serveur, loué à ${hebergeur.nom} et situé en France. Seul l'éditeur consulte ces statistiques.`,
          ],
        },
      ],
    },
    {
      id: "cloudflare",
      titre: "Cloudflare, qui protège le site",
      blocs: [
        `Tout le trafic de ${site.adresse} passe par **${prestataires.reseau.nom}**, une entreprise américaine (${prestataires.reseau.adresse}). Il diffuse le site et le protège : concrètement, il se place entre ton navigateur et notre serveur pour livrer les pages rapidement et arrêter les attaques avant qu'elles n'arrivent jusqu'à nous. Pour faire ce travail, il déchiffre au passage ce qui circule, puis le chiffre à nouveau jusqu'à notre serveur.`,
        {
          liste: [
            "**Ce qui est traité** : ton adresse IP et les données de chaque requête (page demandée, date et heure, informations envoyées par ton navigateur, et ce que tu envoies, par exemple dans un formulaire).",
            "**Pourquoi** : afficher le site rapidement et le protéger, notamment contre les attaques par déni de service et les robots malveillants.",
            "**Base légale** : l'intérêt légitime (article 6.1.f du RGPD). L'intérêt poursuivi : garder le site disponible, rapide et sûr pour tout le monde.",
            `**Qui** : ${prestataires.reseau.nom} agit comme sous-traitant : il traite ces données pour notre compte, dans le cadre de son contrat de traitement des données, sauf pour l'usage décrit juste en dessous.`,
            `**Pour son propre compte** : d'après sa ${lienPolitiqueCloudflare}, Cloudflare tire aussi du trafic qu'il achemine des analyses et des statistiques qui l'aident à repérer et bloquer les activités malveillantes sur son réseau. Pour cet usage, il agit comme responsable distinct, et c'est sa propre politique qui s'applique.`,
            `**Hors de l'Union européenne** : Cloudflare a des serveurs dans le monde entier, et des données peuvent être traitées hors de l'Union européenne, notamment aux États-Unis. Vers les États-Unis, le transfert est encadré par le **Data Privacy Framework UE–États-Unis**, reconnu par une décision d'adéquation de la Commission européenne du 10 juillet 2023 et auquel Cloudflare a adhéré (certification vérifiable sur [dataprivacyframework.gov](https://www.dataprivacyframework.gov/)). Vers les autres pays, ce sont les **clauses contractuelles types** de la Commission européenne, prévues dans son [contrat de traitement des données](https://www.cloudflare.com/cloudflare-customer-dpa/). Tu peux aussi obtenir une copie de ces clauses en nous écrivant à ${lienEmail}.`,
            `**Combien de temps** : pour notre compte, Cloudflare garde ces données le temps nécessaire pour livrer les pages et protéger le site, et au plus jusqu'à la fin de notre contrat avec lui ; son contrat de traitement des données l'oblige ensuite à les effacer ou à nous les rendre. Pour l'usage qu'il fait pour son propre compte, ce sont les durées prévues par sa ${lienPolitiqueCloudflare}.`,
            "**Obligatoire ?** C'est automatique : c'est le chemin par lequel le site arrive jusqu'à toi.",
          ],
        },
        "**Et les cookies ?** Dans certains cas, Cloudflare peut déposer un cookie de sécurité strictement nécessaire, comme « __cf_bm », qui aide à distinguer les humains des robots et expire au bout d'environ 30 minutes. Ce type de cookie indispensable ne nécessite pas ton accord. À ce jour, nos pages n'en déposent aucun : tous les détails sont sur la page [Cookies](/cookies).",
      ],
    },
    {
      id: "newsletter",
      titre: "La newsletter",
      blocs: [
        `Tu peux t'inscrire de deux façons : avec le formulaire « Préviens-moi » du site (détails dans la section suivante), ou en nous écrivant à ${lienEmail}, par exemple avec l'objet « Inscription à la newsletter SOS Miam ». Ce qui suit vaut pour les deux.`,
        {
          liste: [
            "**Ce qu'on reçoit** : par le formulaire, ce qui est décrit dans la section suivante ; par mail, ton adresse e-mail, le nom affiché par ta messagerie, la ville que tu indiques et ce que tu choisis d'ajouter au message.",
            "**Pourquoi** : te prévenir quand SOS Miam se lance près de chez toi, puis te donner des nouvelles (nouveaux lieux, nouvelles villes, BIG SOS…) par la newsletter.",
            "**Base légale** : ton consentement (article 6.1.a du RGPD), que tu donnes en envoyant le formulaire ou le mail, et que tu peux retirer à tout moment.",
            `**Où et qui** : si tu t'inscris par mail, ton mail arrive dans la boîte ${site.emailContact}, fournie par ${prestataires.messagerie.nom} ; il est reçu par un serveur de messagerie situé en Suisse (voir « Qui voit tes données, et où elles sont »). Seul l'éditeur consulte cette boîte.`,
            `**La liste des inscrits** : pour t'envoyer la newsletter, les inscriptions du formulaire et celles reçues par mail sont réunies dans une liste (ton adresse e-mail, ta ville, ton téléphone et ton choix pour la bêta si tu les as donnés dans le formulaire, la date de ton inscription et celle de ton dernier message), gardée sur notre serveur, loué à ${hebergeur.nom} et situé en France. Seul l'éditeur y a accès, et elle suit les mêmes règles de durée : si tu te désinscris, ta ligne est retirée de la liste et effacée de notre base avant tout nouvel envoi, ville comprise.`,
            "**Combien de temps** : tant que tu restes inscrit, tu continues de recevoir la newsletter, même après le lancement. Si on n'a plus aucun message de ta part pendant 3 ans, on te demande si tu veux continuer ; sans réponse, on efface ton adresse. Ton mail d'inscription ou de désinscription reste dans notre boîte comme preuve de ton choix, 3 ans au plus.",
            "**Obligatoire ?** Non, rien ne l'est. Sans adresse e-mail, on ne peut simplement pas te prévenir ; la ville nous aide à le faire au bon moment.",
            `**Te désinscrire** : un simple mail à ${lienEmail} suffit, sans avoir à te justifier ; tu peux aussi répondre « STOP » à une newsletter.`,
          ],
        },
      ],
    },
    {
      id: "formulaire",
      titre: "Le formulaire « Préviens-moi »",
      blocs: [
        "En bas de l'accueil du site, le formulaire « Préviens-moi » te demande ton adresse e-mail et ta ville ou ta région (que tu écris toi-même, avec des suggestions). Il te propose aussi, sans obligation, de dire si tu as un iPhone ou un Android, de tester l'app avant sa sortie (bêta) et de devenir ambassadeur fondateur.",
        {
          liste: [
            "**Ce qu'on enregistre** : ton adresse e-mail, ta ville ou ta région, ton téléphone (iPhone ou Android) si tu l'indiques, tes choix pour les cases bêta et ambassadeur, la date de ta première et de ta dernière inscription, et le fait que l'inscription vient du site. Si tu remplis le formulaire plusieurs fois, on garde une seule ligne, mise à jour.",
            "**Pourquoi** : te prévenir du lancement dans ta ville, puis t'envoyer la newsletter ; savoir sur quel store (App Store d'Apple ou Play Store de Google) publier l'app en premier ; si tu as coché les cases, t'inviter à tester la bêta et te recontacter au sujet du programme des ambassadeurs fondateurs.",
            "**Base légale** : ton consentement (article 6.1.a du RGPD), que tu peux retirer à tout moment.",
            `**Où et qui** : dans une base de données sur notre serveur, loué à ${hebergeur.nom} et situé en France. Seul l'éditeur y a accès.`,
            "**Combien de temps** : comme pour la newsletter, tant que tu restes inscrit ; si tu te désinscris, ta ligne est effacée avant tout nouvel envoi ; après 3 ans sans aucun message de ta part, on te demande si tu veux continuer, sinon on efface.",
            "**Ton adresse IP** : le site la transmet à notre serveur pour limiter le nombre d'envois (5 toutes les 10 minutes), contre les robots. Elle reste seulement en mémoire, une dizaine de minutes, et n'est jamais enregistrée avec ton inscription.",
            "**Ta position, si tu touches le bouton 📍** : ton navigateur te demande d'abord ton accord. Ta position, arrondie à environ 100 mètres, est envoyée à notre serveur, qui demande au service public de l'État geo.api.gouv.fr (géré par la direction interministérielle du numérique) la commune qui s'y trouve, avec son département et sa région ; ta propre adresse IP ne lui est pas transmise. Notre serveur ne garde ni ta position ni la réponse : la commune trouvée remplit juste le champ, et tu peux la changer avant d'envoyer. geo.api.gouv.fr peut, de son côté, garder une trace technique de la demande (la position arrondie, venue de notre serveur), selon ses propres conditions. Pour freiner les abus, ton adresse IP sert aussi à limiter le nombre de recherches (20 toutes les 10 minutes), comme pour le formulaire, sans être enregistrée. Base légale : ton consentement, que tu donnes en touchant le bouton.",
            "**Pour la bêta** : au moment de t'inviter, et seulement si tu as coché la case, on transmet ton adresse e-mail à Apple (TestFlight, si tu es sur iPhone), qui t'envoie l'invitation, ou à Google (liste des testeurs de la Play Console, si tu es sur Android), et on t'envoie alors nous-mêmes le lien pour rejoindre le test. Google et Apple gèrent ensuite l'accès à la version de test, selon leurs propres règles de confidentialité. Sur Android, Google a besoin de l'adresse de ton compte Google. Les cases bêta et ambassadeur, une fois cochées, le restent même si tu renvoies le formulaire sans elles : tu ne veux plus tester, ou plus être ambassadeur ? Un mail suffit, on te retire de la liste.",
            "**Obligatoire ?** Seul l'e-mail est indispensable pour te prévenir. Ta ville ou ta région (qui nous dit quand te prévenir), ton téléphone et les cases bêta et ambassadeur sont facultatifs. Pour la bêta, on a juste besoin de savoir si tu as un iPhone ou un Android.",
          ],
        },
        "Comme toute visite, l'envoi du formulaire passe par Cloudflare et apparaît dans les journaux du serveur. Les journaux notent la page appelée, pas ce que tu as saisi. Cloudflare, lui, voit passer ce que tu envoies, comme pour toute requête.",
      ],
    },
    {
      id: "demande-lieu",
      titre: "Le formulaire « J'inscris mon lieu »",
      blocs: [
        "Sur la page [J'inscris mon lieu](/inscrire-mon-lieu), un lieu peut demander à être sur SOS Miam. La demande arrive dans notre logiciel de gestion, où l'éditeur l'accepte ou la refuse.",
        {
          liste: [
            "**Ce qu'on reçoit sur le lieu** : son nom et sa ville, sa description, et si tu les donnes son type, son adresse, son plat phare, ses horaires, son site web et son compte Instagram. Si la demande est acceptée, ces informations servent à créer la fiche du lieu, qui sera publique.",
            "**Ce qu'on reçoit sur toi** : ton nom, ton e-mail et, si tu le donnes, ton téléphone. Ils ne sont jamais publiés.",
            "**Pourquoi** : étudier la demande, créer la fiche du lieu et te répondre.",
            "**Base légale** : les mesures précontractuelles prises à ta demande (article 6.1.b du RGPD) : tu nous demandes d'inscrire ton lieu, et ces informations sont nécessaires pour le faire.",
            `**Où et qui** : dans une base de données sur notre serveur, loué à ${hebergeur.nom} et situé en France. Seul l'éditeur y a accès.`,
            "**Combien de temps** : tes coordonnées sont effacées quand on n'en a plus besoin pour ta demande, et au plus 3 ans après notre dernier échange ; la demande elle-même suit la même règle. Si elle est acceptée, les informations du lieu deviennent sa fiche, que tu peux faire modifier ou retirer à tout moment par un simple mail.",
            "**Ton adresse IP** : comme pour le formulaire « Préviens-moi », elle sert seulement à limiter le nombre d'envois (3 toutes les 30 minutes) et n'est jamais enregistrée avec ta demande.",
            "**Obligatoire ?** Le nom du lieu, sa ville, sa description, ton nom et ton e-mail : sans eux, on ne peut ni étudier la demande ni te répondre. Le reste est facultatif.",
          ],
        },
      ],
    },
    {
      id: "messages",
      titre: "Tes messages : lieu, ambassadeur, questions",
      blocs: [
        `Tu peux aussi nous écrire à ${lienEmail} pour inscrire ton lieu (le formulaire [J'inscris mon lieu](/inscrire-mon-lieu) est le plus simple), pour devenir ambassadeur fondateur ou simplement pour poser une question.`,
        {
          liste: [
            "**Ce qu'on reçoit** : ton adresse e-mail, le nom affiché par ta messagerie et le contenu de ton message. Pour un lieu : son nom, sa ville et son type (resto, pâtisserie, bar, sortie…). Pour une candidature d'ambassadeur : ton quartier et tes pépites du coin.",
            "**Pourquoi** : te répondre, examiner la demande d'inscription de ton lieu ou ta candidature, et en reparler avec toi.",
            "**Base légale** : l'intérêt légitime (article 6.1.f du RGPD). L'intérêt poursuivi : donner suite aux messages qu'on reçoit, faire connaître des lieux indépendants et réunir les premiers ambassadeurs.",
            `**Où et qui** : dans la boîte ${site.emailContact}, fournie par ${prestataires.messagerie.nom} ; les mails sont reçus par un serveur de messagerie situé en Suisse (voir « Qui voit tes données, et où elles sont »). Seul l'éditeur consulte cette boîte.`,
            "**Combien de temps** : pour une demande de lieu ou une candidature, au plus 3 ans après ton dernier contact. Pour une simple question, le temps de te répondre, puis au plus 3 ans.",
            "**Obligatoire ?** Non. Sans adresse e-mail, on ne peut simplement pas te répondre.",
          ],
        },
        "Pas besoin de nous envoyer d'informations sensibles (santé, opinions, coordonnées bancaires…) : on n'en a pas l'usage.",
      ],
    },
    {
      id: "ce-qu-on-ne-fait-pas",
      titre: "Ce qu'on ne fait pas",
      blocs: [
        {
          liste: [
            "**On ne vend jamais tes données**, on ne les loue pas, et on ne les confie qu'aux prestataires techniques présentés plus bas, pour notre compte (sauf obligation légale).",
            "**Aucun cookie de suivi** : à ce jour, nos pages n'en déposent aucun. Seules exceptions possibles : le cookie de sécurité de Cloudflare présenté plus haut, et le cookie qui retient ton refus d'être compté dans les statistiques, si tu le demandes. Détails sur la page [Cookies](/cookies).",
            "**Presque rien dans ton navigateur** : le site garde seulement, dans le stockage de session de ton navigateur, la position où tu étais sur chaque page, pour t'y ramener quand tu reviens en arrière, et parfois le numéro de version du site après une mise à jour. Aucun identifiant, aucune donnée personnelle, et tout s'efface quand tu fermes l'onglet : c'est strictement nécessaire à la navigation, donc sans demande d'accord.",
            "**Aucun outil de mesure d'audience extérieur** (ni Google Analytics, ni pixel de réseau social) : nos statistiques de visite sont comptées par notre serveur, sans cookie (voir « Les statistiques de visite »). Et **aucune publicité** pour l'instant.",
            "**Aucun contenu tiers intégré** : pas de vidéo, de carte ou de bouton de réseau social qui préviendrait un autre service de ta visite. Même nos polices de caractères sont hébergées avec le site, sur notre serveur chez notre hébergeur.",
            `**Aucune décision automatisée au sens de l'article 22 du RGPD** : aucune décision produisant des effets juridiques te concernant, ou t'affectant de manière significative, n'est prise sur le seul fondement d'un traitement automatisé. Seul le filtrage de sécurité de Cloudflare peut, automatiquement, te demander une vérification ou bloquer une requête jugée malveillante. Si tu es bloqué à tort, écris-nous à ${lienEmail}.`,
          ],
        },
      ],
    },
    {
      id: "destinataires",
      titre: "Qui voit tes données, et où elles sont",
      blocs: [
        "Tes données ne sont consultées que par l'éditeur de SOS Miam. Les prestataires techniques ci-dessous les traitent pour son compte, dans le cadre de leur contrat (ce sont des « sous-traitants » au sens du RGPD) :",
        {
          liste: [
            `**${hebergeur.nom}** (${hebergeur.adresse}) : hébergement du serveur du site, en France.`,
            `**${prestataires.messagerie.nom}** : ${prestataires.messagerie.role} ; les mails sont reçus par un serveur de messagerie situé en Suisse.`,
            `**${prestataires.reseau.nom}** (${prestataires.reseau.adresse}) : ${prestataires.reseau.role}. Pour la sécurité de son propre réseau, il utilise aussi certaines données pour son propre compte (voir « Cloudflare, qui protège le site »).`,
          ],
        },
        "Ces prestataires peuvent eux-mêmes faire appel à d'autres prestataires techniques (des « sous-traitants ultérieurs »), qui doivent respecter les mêmes obligations de protection de tes données.",
        "Seulement si tu as demandé à tester la bêta, ton adresse e-mail est transmise à **Google** (liste de testeurs de la Play Console, pour Android) ou à **Apple** (TestFlight, pour iPhone) au moment de t'inviter. Et seulement si tu touches le bouton 📍 du formulaire, ta position arrondie est envoyée par notre serveur au service public **geo.api.gouv.fr** pour trouver ta commune : notre serveur n'en garde rien.",
        "Si la loi l'impose, certaines données peuvent être communiquées à une autorité qui les demande dans un cadre légal, par exemple sur décision d'un juge. Personne d'autre ne les reçoit.",
        `**Transferts hors de l'Union européenne** : le serveur du site est en France. Les e-mails envoyés à ${site.emailContact} sont reçus par un serveur situé en Suisse : la Suisse bénéficie d'une décision d'adéquation de la Commission européenne (décision 2000/518/CE du 26 juillet 2000), qui reconnaît que tes données y sont aussi bien protégées que dans l'Union européenne. Cloudflare peut traiter des données hors de l'Union européenne, notamment aux États-Unis, avec les garanties décrites dans la partie « Cloudflare, qui protège le site ». Enfin, si tu demandes la bêta, Google ou Apple peuvent traiter ton adresse aux États-Unis : pour Google, le transfert est encadré par le **Data Privacy Framework UE–États-Unis**, auquel Google LLC a adhéré (certification vérifiable sur [dataprivacyframework.gov](https://www.dataprivacyframework.gov/)) ; pour Apple, par les **clauses contractuelles types** de la Commission européenne, comme l'indique sa [politique de confidentialité](https://www.apple.com/fr/legal/privacy/fr-ww/).`,
      ],
    },
    {
      id: "securite",
      titre: "Comment on protège tes données",
      blocs: [
        {
          liste: [
            "**Connexion chiffrée** : tout le site passe en HTTPS. La connexion est chiffrée de ton navigateur jusqu'à Cloudflare, puis de Cloudflare jusqu'à notre serveur ; Cloudflare déchiffre le trafic au passage pour le protéger.",
            "**Un seul administrateur** : l'éditeur est le seul à administrer le serveur et à consulter les journaux et la boîte mail.",
            "**Protection contre les attaques** : Cloudflare filtre le trafic malveillant avant qu'il n'atteigne le serveur.",
            "**Le moins possible, le moins longtemps possible** : on collecte le strict nécessaire, et les journaux s'effacent d'eux-mêmes au bout de 15 jours au plus. Ce qu'on n'a pas ne peut pas fuiter.",
            "**Des sauvegardes chiffrées** : pour ne rien perdre en cas de panne, une copie chiffrée de notre base de données est faite chaque nuit sur notre serveur, en France, et on garde les 30 dernières. Une copie chiffrée peut aussi être gardée sur l'ordinateur de l'éditeur, avec la même règle. Quand une donnée est effacée de la base, elle disparaît des sauvegardes au plus tard 30 jours après.",
          ],
        },
        "Si un incident de sécurité touchait tes données, on le signalerait à la CNIL dans les 72 heures quand la loi l'exige, et on te préviendrait directement si le risque pour toi était élevé.",
      ],
    },
    {
      id: "droits",
      titre: "Tes droits",
      blocs: [
        "Sur les données qui te concernent, tu as le droit de :",
        {
          liste: [
            "**Accès** : savoir si on a des données sur toi, et en recevoir une copie.",
            "**Rectification** : faire corriger ce qui est faux ou incomplet.",
            "**Effacement** : faire effacer tes données, par exemple quand tu retires ton consentement ou qu'elles ne sont plus nécessaires.",
            "**Limitation** : faire geler l'utilisation de tes données pendant un temps, par exemple le temps de vérifier une contestation.",
            "**Opposition** : t'opposer à un traitement fondé sur notre intérêt légitime (voir juste en dessous).",
            "**Portabilité** : recevoir les données que tu nous as fournies avec ton consentement (newsletter, formulaire) dans un format lisible par une machine, ou les faire transmettre à un autre service quand c'est techniquement possible.",
            "**Retrait du consentement** : à tout moment, aussi simplement que tu l'as donné. Ce qui a été fait avant reste valable.",
            "**Directives après ton décès** : nous dire ce que doivent devenir tes données après ta mort (conservation, effacement, communication) et désigner une personne chargée de les faire appliquer, comme le prévoit la loi Informatique et Libertés.",
          ],
        },
        `**Ton droit d'opposition** : pour les journaux du serveur, les statistiques de visite, Cloudflare et tes messages, fondés sur notre intérêt légitime, tu peux t'opposer à tout moment au traitement de tes données pour des raisons tenant à ta situation particulière (article 21 du RGPD). On arrête alors, sauf motif légitime et impérieux qui l'emporte, comme la sécurité du site, ou si ces données sont nécessaires pour faire valoir ou défendre des droits en justice. Écris à ${lienEmail}. Pour les statistiques de visite, c'est encore plus simple : un clic sur la page [Tes visites et nos statistiques](/statistiques).`,
      ],
    },
    {
      id: "exercer-tes-droits",
      titre: "Comment exercer tes droits",
      blocs: [
        {
          liste: [
            `**Écris-nous** à ${lienEmail} en précisant le droit que tu veux exercer. Pour les journaux du serveur, indique aussi ton adresse IP et le moment de ta visite : sans ça, impossible de retrouver les lignes qui te concernent (et elles disparaissent de toute façon au bout de 15 jours au plus).`,
            "**Pour les journaux, une précaution** : une adresse IP pouvant être partagée par plusieurs personnes (box familiale, Wi-Fi public, réseau mobile), on pourra te demander de quoi vérifier qu'elle était bien la tienne à ce moment-là, et on ne te communiquera pas les lignes qui pourraient concerner quelqu'un d'autre.",
            "**On te répond dans un délai d'un mois** au plus. Si ta demande est complexe, ce délai peut être prolongé de deux mois : on te prévient alors dans le premier mois, en t'expliquant pourquoi.",
            "**On ne te demande de prouver ton identité qu'en cas de doute raisonnable**, par exemple si la demande ne vient pas de l'adresse e-mail concernée. Pas de copie de pièce d'identité par principe.",
            "**C'est gratuit.**",
          ],
        },
      ],
    },
    {
      id: "cnil",
      titre: "Réclamation auprès de la CNIL",
      blocs: [
        "Si tu estimes que tes droits ne sont pas respectés, tu peux adresser une réclamation à la CNIL (Commission nationale de l'informatique et des libertés), l'autorité française de protection des données, directement [en ligne](https://www.cnil.fr/fr/plaintes).",
        `Tu peux aussi nous écrire d'abord à ${lienEmail} : on aimerait bien avoir une chance d'arranger les choses.`,
      ],
    },
    {
      id: "mineurs",
      titre: "Les mineurs",
      blocs: [
        "SOS Miam s'adresse à tout le monde, ados compris. En France, la loi Informatique et Libertés permet de consentir seul au traitement de ses données à partir de **15 ans**.",
        "Si tu as moins de 15 ans, il faut l'accord de tes parents (ou de la personne qui a l'autorité parentale), en plus du tien, avant de t'inscrire à la newsletter ou via le formulaire « Préviens-moi ».",
        `Si on apprend qu'un enfant de moins de 15 ans s'est inscrit sans cet accord, on efface ses données. Un parent peut nous le signaler à ${lienEmail}.`,
      ],
    },
    {
      id: "a-venir",
      titre: "Ce qui arrivera plus tard",
      blocs: [
        "SOS Miam va grandir. Voici ce qui est prévu, **mais ne fonctionne pas aujourd'hui** :",
        {
          liste: [
            "**L'app mobile**, avec un compte et, seulement si tu l'autorises, ta position pour te montrer les lieux autour de toi.",
            "**La publicité**, toujours signalée comme telle, et les **vidéos intégrées** : ce qui n'est pas indispensable ne sera activé qu'avec ton accord, recueilli par un bandeau conforme aux règles de la CNIL, et ton choix sera gardé 6 mois.",
            "**L'envoi des e-mails** (comme la newsletter) par un prestataire spécialisé.",
            "**Les bons solidaires**, pour payer à l'avance dans un lieu pendant son BIG SOS. La façon de payer n'est pas encore décidée.",
          ],
        },
        "Avant que chacune de ces nouveautés démarre, cette politique (et la page [Cookies](/cookies) si besoin) sera mise à jour pour dire ce qui est collecté, pourquoi, sur quelle base légale, combien de temps et par quel prestataire.",
      ],
    },
    {
      id: "mises-a-jour",
      titre: "Les mises à jour de cette politique",
      blocs: [
        "Cette politique décrit ce qui se passe à la date indiquée en haut de la page. On la met à jour à chaque changement, et toujours **avant** qu'un nouveau traitement démarre.",
        "Si un changement touche à des données que tu nous as déjà confiées, on te prévient, et on te redemande ton accord quand il le faut.",
      ],
    },
  ],
};
