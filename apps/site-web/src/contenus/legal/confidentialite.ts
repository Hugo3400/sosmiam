// Politique de confidentialité : uniquement ce qui est réellement traité au 8 octobre 2026.
// Toute nouveauté (app, pub, mesure d'audience, prestataire d'e-mails, bons solidaires) doit être ajoutée ici AVANT de démarrer.
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
    "Ce que SOS Miam fait de tes données : journaux du serveur, Cloudflare, e-mails et newsletter. Aucun cookie de pistage, zéro revente, et tes droits en clair.",
  miseAJour: "8 octobre 2026",
  introduction: [
    "Tes données, c'est comme la recette secrète d'un resto de quartier : on en prend soin et on ne la vend à personne. Ici, on t'explique sans jargon ce que SOS Miam collecte aujourd'hui (spoiler : pas grand-chose), pourquoi, combien de temps, et comment tu gardes la main dessus.",
    `Cette politique s'applique au site ${site.adresse} et à ses sous-domaines, ainsi qu'aux e-mails que tu envoies à ${lienEmail}. Elle est rédigée en application du Règlement général sur la protection des données (RGPD, règlement (UE) 2016/679) et de la loi Informatique et Libertés (loi n° 78-17 du 6 janvier 1978).`,
    "SOS Miam est encore en préparation : pas d'app, pas de compte, pas de pub pour l'instant. Cette page décrit ce qui se passe **aujourd'hui**, et elle sera mise à jour **avant** chaque nouveauté.",
  ],
  sections: [
    {
      id: "en-bref",
      titre: "En bref",
      blocs: [
        {
          liste: [
            "**Aucun cookie de notre part, aucun pistage, aucune pub, aucune mesure d'audience.** Seules exceptions possibles, strictement nécessaires : un cookie de sécurité de Cloudflare et, sur le site en préparation, la position où tu étais sur la page, gardée dans ton navigateur le temps de ta visite (détails plus bas).",
            "**Les journaux du serveur** gardent une trace technique de tes visites (adresse IP, page demandée…) pendant **15 jours au plus**, pour la sécurité, puis s'effacent tout seuls.",
            "**Cloudflare**, une entreprise américaine, protège le site : tout le trafic passe par ses serveurs, et des données peuvent être traitées hors de l'Union européenne, notamment aux États-Unis, avec les garanties prévues par le RGPD.",
            "**La newsletter** : on te prévient du lancement près de chez toi, puis on continue de te donner des nouvelles tant que tu ne te désinscris pas (un simple mail suffit).",
            "**Si tu nous écris** (lieu à inscrire, candidature d'ambassadeur, question), on garde ton message le temps d'y donner suite, et **3 ans au maximum** après ton dernier contact.",
            "**Le formulaire « Préviens-moi »** du site en préparation n'enregistre encore rien ; quand il le fera, ce sera pour te prévenir du lancement puis t'envoyer la newsletter (et te parler du programme des ambassadeurs fondateurs si tu coches la case), avec ton accord.",
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
            "**Pourquoi** : repérer et bloquer les attaques ou les abus, et comprendre une panne quand quelque chose casse. Ces journaux ne servent ni à te suivre, ni à faire des statistiques de visite.",
            "**Base légale** : l'intérêt légitime (article 6.1.f du RGPD). L'intérêt poursuivi : assurer la sécurité et le bon fonctionnement du site.",
            `**Où et qui** : sur notre serveur, loué à ${hebergeur.nom} et situé en France. ${hebergeur.nom} agit comme sous-traitant : il héberge le serveur pour notre compte, et seul l'éditeur consulte ces journaux.`,
            "**Combien de temps** : **15 jours au plus**. Un nouveau journal démarre chaque jour ; on garde les 14 précédents, et le plus ancien est effacé automatiquement.",
            "**Obligatoire ?** Tu n'as rien à fournir : ces informations sont envoyées par ton navigateur dès qu'il demande une page.",
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
        `Sur la page d'attente de ${site.adresse}, le bouton « Je m'inscris à la newsletter » ouvre ta propre messagerie avec un mail tout prêt pour ${site.emailContact}. La page elle-même ne collecte rien : c'est toi qui envoies le mail, si tu le veux, depuis ta messagerie (qui applique sa propre politique de confidentialité).`,
        {
          liste: [
            "**Ce qu'on reçoit** : ton adresse e-mail, le nom affiché par ta messagerie, la ville que tu indiques, et ce que tu choisis d'ajouter au message.",
            "**Pourquoi** : te prévenir quand SOS Miam se lance près de chez toi, puis te donner des nouvelles (nouveaux lieux, nouvelles villes, BIG SOS…) par la newsletter.",
            "**Base légale** : ton consentement (article 6.1.a du RGPD), que tu donnes en envoyant le mail et que tu peux retirer à tout moment.",
            `**Où et qui** : ton mail arrive dans la boîte ${site.emailContact}, fournie par ${prestataires.messagerie.nom} ; il est reçu par un serveur de messagerie situé en Suisse (voir « Qui voit tes données, et où elles sont »). Seul l'éditeur consulte cette boîte.`,
            `**La liste des inscrits** : pour t'envoyer la newsletter, ton adresse e-mail, ta ville, la date de ton inscription et celle de ton dernier message sont recopiées dans une liste gardée sur notre serveur, loué à ${hebergeur.nom} et situé en France. Seul l'éditeur y a accès, et elle suit les mêmes règles de durée : si tu te désinscris, ta ligne est retirée avant tout nouvel envoi, et ta ville est oubliée.`,
            "**Combien de temps** : tant que tu restes inscrit, tu continues de recevoir la newsletter, même après le lancement. Si on n'a plus aucun message de ta part pendant 3 ans, on te demande si tu veux continuer ; sans réponse, on efface ton adresse. Ton mail d'inscription ou de désinscription reste dans notre boîte comme preuve de ton choix, 3 ans au plus.",
            "**Obligatoire ?** Non, rien ne l'est. Sans adresse e-mail, on ne peut simplement pas te prévenir ; la ville nous aide à le faire au bon moment.",
            `**Te désinscrire** : un simple mail à ${lienEmail} suffit, sans avoir à te justifier.`,
          ],
        },
      ],
    },
    {
      id: "formulaire",
      titre: "Le formulaire « Préviens-moi »",
      blocs: [
        "La version complète du site, encore en préparation, propose un formulaire « Préviens-moi » : ton adresse e-mail, ta ville (choisie dans une liste) et une case facultative « Je veux devenir ambassadeur fondateur ».",
        "**Pour l'instant, ce formulaire n'enregistre rien** : il n'est pas encore relié au serveur qui gardera les inscriptions, donc ce que tu y saisis n'est conservé nulle part. Quand il le sera, voici comment ça marchera :",
        {
          liste: [
            "**Pourquoi** : te prévenir du lancement dans ta ville, puis t'envoyer la newsletter, et, si tu as coché la case, te recontacter au sujet du programme des ambassadeurs fondateurs.",
            "**Base légale** : ton consentement (article 6.1.a du RGPD), que tu peux retirer à tout moment.",
            `**Où et qui** : sur notre serveur, hébergé par ${hebergeur.nom} en France. Seul l'éditeur consultera ces inscriptions.`,
            "**Combien de temps** : comme pour la newsletter, tant que tu restes inscrit ; après 3 ans sans aucun message de ta part, on te demande si tu veux continuer, sinon on efface.",
            "**Obligatoire ?** L'e-mail est indispensable pour te prévenir et la ville nous dit où ; la case ambassadeur est facultative.",
          ],
        },
        "Comme toute visite, l'envoi du formulaire passe par Cloudflare et apparaît dans les journaux du serveur. Les journaux notent la page appelée, pas ce que tu as saisi. Cloudflare, lui, voit passer ce que tu envoies, comme pour toute requête.",
      ],
    },
    {
      id: "messages",
      titre: "Tes messages : lieu, ambassadeur, questions",
      blocs: [
        `Tu peux aussi nous écrire à ${lienEmail} pour inscrire ton lieu (bouton « J'inscris mon lieu »), pour devenir ambassadeur fondateur (bouton « Je deviens ambassadeur ») ou simplement pour poser une question.`,
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
            "**Aucun cookie de notre part** : à ce jour, nos pages n'en déposent aucun (seule exception possible : le cookie de sécurité de Cloudflare présenté plus haut). Détails sur la page [Cookies](/cookies).",
            "**Presque rien dans ton navigateur** : la page d'attente n'y enregistre rien. Le site en préparation et les pages légales gardent seulement, dans le stockage de session de ton navigateur, la position où tu étais sur chaque page, pour t'y ramener quand tu reviens en arrière, et parfois le numéro de version du site après une mise à jour. Aucun identifiant, aucune donnée personnelle, et tout s'efface quand tu fermes l'onglet : c'est strictement nécessaire à la navigation, donc sans demande d'accord.",
            "**Aucune mesure d'audience**, aucune statistique de visite et **aucune publicité** pour l'instant.",
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
        "Si la loi l'impose, certaines données peuvent être communiquées à une autorité qui les demande dans un cadre légal, par exemple sur décision d'un juge. Personne d'autre ne les reçoit.",
        `**Transferts hors de l'Union européenne** : le serveur du site est en France. Les e-mails envoyés à ${site.emailContact} sont reçus par un serveur situé en Suisse : la Suisse bénéficie d'une décision d'adéquation de la Commission européenne (décision 2000/518/CE du 26 juillet 2000), qui reconnaît que tes données y sont aussi bien protégées que dans l'Union européenne. Enfin, Cloudflare peut traiter des données hors de l'Union européenne, notamment aux États-Unis, avec les garanties décrites dans la partie « Cloudflare, qui protège le site ».`,
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
        `**Ton droit d'opposition** : pour les journaux du serveur, Cloudflare et tes messages, fondés sur notre intérêt légitime, tu peux t'opposer à tout moment au traitement de tes données pour des raisons tenant à ta situation particulière (article 21 du RGPD). On arrête alors, sauf motif légitime et impérieux qui l'emporte, comme la sécurité du site, ou si ces données sont nécessaires pour faire valoir ou défendre des droits en justice. Écris à ${lienEmail}.`,
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
            "**La publicité**, toujours signalée comme telle, ainsi que la **mesure d'audience** et les **vidéos intégrées** : ce qui n'est pas indispensable ne sera activé qu'avec ton accord, recueilli par un bandeau conforme aux règles de la CNIL, et ton choix sera gardé 6 mois.",
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
