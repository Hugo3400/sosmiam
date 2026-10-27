import "../socle/garde-fou.ts";

import type { NouvelleNotificationCloche } from "../../src/services/effets-sociaux-regles.ts";
import { creerActusAuteur } from "../../src/services/actus-auteur.ts";
import { creerActusLecture } from "../../src/services/actus-lecture.ts";
import { creerActusPro } from "../../src/services/actus-pro.ts";
import { ajouterPointsDans } from "../../src/services/comptes.ts";
import { listerActusARelire } from "../../src/services/gestion/actus-a-relire.ts";
import { brancherActusGestion, creerActusGestion } from "../../src/services/gestion/actus-gestion.ts";
import { deciderSignalement } from "../../src/services/gestion/moderation.ts";
import { creerPhotosActus } from "../../src/services/photos-actus.ts";
import { creerStockagePhotosAvisEnMemoire } from "../../src/services/stockage-photos-avis.ts";
import type { CorpsArticleActus } from "../../src/fonctions/actus/lire-corps-article-actus.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);
const verifications = creerVerifications();
const { egal, vrai } = verifications;
const base = essai.baseDeDonnees;

const MAINTENANT = Date.parse("2026-10-27T10:00:00Z");
const horloge = () => MAINTENANT;

const ZOE = await inserer("comptes", { email: "zoe@exemple.fr", prenom: "Zoé", avatar: "miami:beret", points: 0, palier: "curieux" });
const LEA = await inserer("comptes", { email: "lea@exemple.fr", prenom: "Léa", points: 0, palier: "curieux" });
const GERANT = await inserer("comptes", { email: "capitaine@exemple.fr", prenom: "Capitaine", points: 0, palier: "curieux" });
await inserer("ambassadeurs", { compte_id: ZOE, statut: "actif", ville: "Montpellier" });
const RESTO = await inserer("lieux", { nom: "Restaurant du Capitaine Bouiboui", type: "resto", emoji: "🍝", quartier: "Écusson", ville: "Montpellier", statut: "publie" });
const BAR = await inserer("lieux", { nom: "Le Verre du Capitaine", type: "bar", emoji: "🍹", quartier: "Canal", ville: "Sète", statut: "publie" });
const BROUILLON = await inserer("lieux", { nom: "Pas encore là", type: "resto", emoji: "🥟", quartier: "Centre", ville: "Lyon", statut: "brouillon" });
await inserer("rattachements_lieux", { lieu_id: RESTO, compte_id: GERANT, role: "gerant", statut: "valide" });

const stockage = creerStockagePhotosAvisEnMemoire({ horloge });
const deposer = async (compteId: number, deposeLe = new Date(MAINTENANT)) => {
  const nom = stockage.tirerNom();
  await stockage.ecrire(nom, Buffer.from([0xff, 0xd8, 0xff, 0xe0]), { compteId, deposeLe });
  return nom;
};

const cloches: NouvelleNotificationCloche[] = [];
const photos = creerPhotosActus(stockage, base, horloge);
const auteur = creerActusAuteur(photos, base, horloge);
const lecture = creerActusLecture(base, horloge);
const roleDe = async (compteId: number, lieuId: number) => (compteId === GERANT && lieuId === RESTO ? "gerant" : null);
const pro = creerActusPro(roleDe, base, horloge);
const gestion = creerActusGestion({ ajouterPointsDans, cloche: { noter: async (n) => void cloches.push(...n) }, base, horloge });
brancherActusGestion(gestion);

const TEXTE = `${"Une matinée au bord de l'eau, des huîtres et une terrasse au soleil. ".repeat(5)}\n\n${"Et une tarte aux figues pour finir en beauté. ".repeat(3)}`;
const corps = async (o: Partial<CorpsArticleActus> = {}): Promise<CorpsArticleActus> => ({
  rubrique: "portrait", titre: "Le Capitaine nous ouvre sa cuisine", accroche: "Des huîtres du matin et une terrasse au soleil.",
  texte: TEXTE, citation: "", couverture: await deposer(ZOE), photos: [await deposer(ZOE)], lieux: [RESTO], collaboration: false, finLe: null, ...o,
});

const premier = await auteur.envoyer(ZOE, await corps());
vrai(premier.ok, "un portrait complet part en relecture");
const ID1 = premier.ok ? premier.id : 0;
egal((await base.articleActus.findUniqueOrThrow({ where: { id: ID1 }, select: { statut: true, texte: true } })).statut, "en-relecture", "il attend la Brigade");

egal(await auteur.envoyer(ZOE, await corps({ lieux: [BROUILLON] })), { ok: false, erreur: "lieu-inconnu" }, "un lieu en brouillon ne se cite pas");
egal(await auteur.envoyer(ZOE, await corps({ couverture: await deposer(LEA) })), { ok: false, erreur: "photo-actus-introuvable" }, "la photo d'un autre compte est refusée");
egal(await auteur.envoyer(ZOE, await corps({ couverture: await deposer(ZOE, new Date(MAINTENANT - 25 * 3600_000)) })), { ok: false, erreur: "photo-actus-introuvable" }, "une photo de plus de 24 h est refusée");
const reprise = await corps();
egal(await auteur.envoyer(ZOE, { ...reprise, couverture: (await base.articleActus.findUniqueOrThrow({ where: { id: ID1 } })).couverture }), { ok: false, erreur: "photo-actus-introuvable" }, "une photo déjà citée par un autre article est refusée");
egal(await auteur.envoyer(GERANT, await corps({ couverture: await deposer(GERANT), photos: [] })), { ok: false, erreur: "membre-du-lieu" }, "un gérant n'écrit pas sur son lieu");
const court = await auteur.envoyer(ZOE, await corps({ texte: "Trop court." }));
egal(court, { ok: false, erreur: "article-invalide", champs: ["texte"] }, "un texte trop court est refusé, champ par champ");

egal((await lecture.lister({ rubrique: null, ville: null, curseur: null, avecAlcool: false, compteId: null })).articles.length, 0, "rien de publié avant la Brigade");
egal(await lecture.lire(ID1, true, null), null, "un article en relecture ne se lit pas");

const deuxieme = await auteur.envoyer(ZOE, await corps({ rubrique: "top-quartier", titre: "Trois adresses du centre", lieux: [RESTO, BAR], photos: [] }));
egal(deuxieme, { ok: false, erreur: "article-invalide", champs: ["lieux"] }, "un top 5 demande au moins 3 lieux");
const bar = await auteur.envoyer(ZOE, await corps({ titre: "Un verre au bord du canal, vraiment", lieux: [BAR], photos: [] }));
vrai(bar.ok, "un portrait de bar part en relecture");
const ID2 = bar.ok ? bar.id : 0;
const troisieme = await auteur.envoyer(ZOE, await corps({ titre: "La crème brûlée du jeudi soir", photos: [] }));
const ID3 = troisieme.ok ? troisieme.id : 0;
egal(await auteur.envoyer(ZOE, await corps({ titre: "Un quatrième dans la semaine" })), { ok: false, erreur: "limite-actus-semaine" }, "pas plus de 3 articles par semaine");
egal((await auteur.mesArticles(ZOE)).envoyesCetteSemaine, 3, "Mes articles compte les 3 de la semaine");
egal((await base.articleActus.findUniqueOrThrow({ where: { id: ID2 }, select: { alcool: true } })).alcool, true, "citer un bar coche l'alcool");

egal(await gestion.publier(ID1, { aLaUne: true, alcool: false }), { ok: true }, "la Brigade publie, à la une");
egal(await gestion.publier(ID1, { aLaUne: false, alcool: false }), { ok: false, erreur: "deja-decide" }, "une seule décision");
const zoe = await base.compte.findUniqueOrThrow({ where: { id: ZOE }, select: { points: true } });
egal(zoe.points, 20, "+20 points à la publication");
egal((await base.journalPoints.findMany({ where: { compteId: ZOE }, select: { raison: true, detail: true } })), [{ raison: "article-actus", detail: `article ${ID1}` }], "journal des points");
egal((await base.badgeCompte.findMany({ where: { compteId: ZOE }, select: { badge: true } })).map((b) => b.badge), ["premier-reportage"], "badge Premier reportage");
egal(cloches.map((c) => [c.compteId, c.type]), [[ZOE, "actu-publiee"], [GERANT, "actu-lieu-cite"]], "cloche : l'autrice et le gérant du lieu cité");

egal(await gestion.publier(ID2, { aLaUne: false, alcool: false }), { ok: true }, "le portrait du bar est publié");
const sansCompte = await lecture.lister({ rubrique: null, ville: null, curseur: null, avecAlcool: false, compteId: null });
egal(sansCompte.articles.map((a) => a.id), [ID1], "sans compte : jamais un article sur un bar");
egal(sansCompte.articles[0]?.aime, undefined, "sans compte : pas de « aime »");
egal(sansCompte.articles[0]?.auteur, { id: 0, prenom: "Zoé", avatar: "miami:beret", ambassadeur: true }, "l'autrice, sans son identifiant");
egal(sansCompte.articles[0]?.lieux.map((l) => [l.id, l.type, l.verifie]), [[RESTO, "resto", true]], "le lieu cité, vérifié");
egal(sansCompte.articles[0]?.couverture.startsWith("/app/actus/images/"), true, "adresse publique de la couverture");
egal(await lecture.lire(ID2, false, null), null, "sans compte, l'article du bar ne se lit pas");
vrai(await lecture.lire(ID2, true, LEA), "avec un compte (majeur), il se lit");
const avecCompte = await lecture.lister({ rubrique: null, ville: null, curseur: null, avecAlcool: true, compteId: LEA });
egal(avecCompte.articles.map((a) => a.id), [ID1, ID2], "avec un compte : la une d'abord, puis le reste");
egal(await lecture.villes(false), [{ ville: "Montpellier", articles: 1 }], "villes sans compte");
egal((await lecture.lister({ rubrique: null, ville: "Sète", curseur: null, avecAlcool: true, compteId: LEA })).articles.map((a) => a.id), [ID2], "filtre par ville");

egal(await lecture.aimer(LEA, ID1, true), { jaime: 1, aime: true }, "J'aime");
egal(await lecture.aimer(LEA, ID1, true), { jaime: 1, aime: true }, "deux J'aime comptent pour un");
egal((await lecture.lire(ID1, true, LEA))?.aime, true, "l'article dit qu'on l'aime");
egal(await lecture.aimer(LEA, ID1, false), { jaime: 0, aime: false }, "on retire son J'aime");
egal(await lecture.aimer(LEA, ID3, true), null, "pas de J'aime sur un article en relecture");

const couverture1 = (await base.articleActus.findUniqueOrThrow({ where: { id: ID1 } })).couverture;
const couverture3 = (await base.articleActus.findUniqueOrThrow({ where: { id: ID3 } })).couverture;
vrai(await photos.lirePublique(couverture1), "la couverture d'un article publié est publique");
egal(await photos.lirePublique(couverture3), null, "celle d'un article en relecture ne l'est pas");
vrai(await photos.lireGestion(couverture3), "la Brigade la voit");
vrai(await photos.lireDuCompte(couverture3, ZOE), "l'autrice la voit");
egal(await photos.lireDuCompte(couverture3, LEA), null, "personne d'autre");

egal(await gestion.retoucher(ID3, "Coche « Le lieu t'a offert quelque chose ? »"), { ok: true }, "à retoucher");
const retouche = await auteur.lireBrouillon(ZOE, ID3);
egal(retouche?.retouche, "Coche « Le lieu t'a offert quelque chose ? »", "le message de la Brigade arrive avec le brouillon");
egal(retouche?.adresses.couverture.startsWith("/app/actus/miens/medias/"), true, "les photos se relisent par l'adresse de l'autrice");
egal(await auteur.retoucher(LEA, ID3, { ...retouche!, collaboration: true }), { ok: false, erreur: "introuvable" }, "seule l'autrice retouche");
egal(await auteur.retoucher(ZOE, ID3, { ...retouche!, collaboration: true }), { ok: true }, "retouché avec ses photos d'origine");
const renvoye = await base.articleActus.findUniqueOrThrow({ where: { id: ID3 }, select: { statut: true, renvoye: true, collaboration: true } });
egal(renvoye, { statut: "en-relecture", renvoye: true, collaboration: true }, "de retour en relecture, marqué renvoyé");
egal(await auteur.retoucher(ZOE, ID3, { ...retouche!, collaboration: true }), { ok: false, erreur: "transition-interdite" }, "on ne retouche que ce que la Brigade a renvoyé");

egal(await gestion.refuser(ID3, "vie-privee", "Le texte nomme une serveuse sans son accord."), { ok: true }, "refusé avec un motif");
const decision = await base.signalement.findFirstOrThrow({ where: { cible: "article-actu", cibleId: String(ID3) } });
egal([decision.statut, decision.motif, decision.auteurContenuId, decision.source], ["retenu", "vie-privee", ZOE, "equipe"], "la décision est écrite, contestable");
const mien = (await auteur.mesArticles(ZOE)).articles.find((a) => a.id === ID3);
egal(mien?.refus?.motif, "vie-privee", "Mes articles montre le motif");
egal(cloches.at(-1)?.type, "actu-refusee", "la cloche prévient l'autrice");

await essai.sql("UPDATE signalements SET conteste_le = $1, contestation = $2 WHERE id = $3", [new Date(MAINTENANT), "La serveuse m'a donné son accord.", decision.id]);
const reexamen = await deciderSignalement(decision.id, { decision: "rejete", note: null, motif: null, motivation: "Accord vérifié." }, undefined, new Date(MAINTENANT));
vrai(reexamen && reexamen !== "deja-decide", "réexamen : on donne raison à l'autrice");
const aRelire = await listerActusARelire(base);
const revenu = aRelire.articles.find((a) => a.id === ID3);
egal([revenu?.statut, revenu?.refus?.contestation], ["en-relecture", "La serveuse m'a donné son accord."], "il revient en relecture avec la contestation visible");

const citant = await pro.lister(GERANT, RESTO);
egal(citant.ok ? citant.articles.map((a) => [a.id, a.reponse]) : null, [[ID1, null]], "le gérant voit l'article qui cite son lieu");
egal(await pro.lister(LEA, RESTO), { ok: false, erreur: "role-requis" }, "pas un membre du lieu : rien");
egal(await pro.repondre(GERANT, RESTO, ID1, "Merci Zoé ! On t'attend jeudi pour la marée."), { ok: true }, "réponse du lieu envoyée");
egal(await pro.repondre(GERANT, RESTO, ID1, "Une deuxième ?"), { ok: false, erreur: "reponse-deja-donnee" }, "une seule réponse");
egal(await pro.repondre(GERANT, BAR, ID2, "Pas mon lieu"), { ok: false, erreur: "role-requis" }, "seul le gérant du lieu répond");
const reponse = await base.reponseLieuActus.findFirstOrThrow({ where: { articleId: ID1 } });
egal(await gestion.refuserReponse(reponse.id, "pub-cachee", "Pas de promo dans une réponse."), { ok: true }, "réponse refusée");
egal(await pro.repondre(GERANT, RESTO, ID1, "Merci Zoé, et à jeudi pour le vin blanc !"), { ok: true }, "une réécriture permise après un refus");
egal(await pro.repondre(GERANT, RESTO, ID1, "Encore une"), { ok: false, erreur: "reponse-deja-donnee" }, "une seule réécriture");
egal(await gestion.publierReponse(reponse.id), { ok: true }, "la Brigade publie la réponse");
const lue = await lecture.lire(ID1, true, null);
egal(lue?.reponsesLieux.map((r) => [r.lieuId, r.texte]), [[RESTO, "Merci Zoé, et à jeudi pour le vin blanc !"]], "la réponse s'affiche sous l'article");
egal(lue?.alcool, true, "une réponse qui parle d'alcool coche l'alcool de l'article");
egal(await lecture.lire(ID1, false, null), null, "et l'article sort des lectures sans compte");

const bonPlan = await auteur.envoyer(LEA, await corps({ rubrique: "bon-plan", titre: "La formule du midi jusqu'à fin novembre", couverture: await deposer(LEA), photos: [], finLe: "2026-11-30" }));
const ID4 = bonPlan.ok ? bonPlan.id : 0;
await gestion.publier(ID4, { aLaUne: false, alcool: false });
await essai.sql("UPDATE articles_actus SET fin_le = '2026-10-20' WHERE id = $1", [ID4]);
egal((await lecture.lister({ rubrique: "bon-plan", ville: null, curseur: null, avecAlcool: true, compteId: null })).articles.length, 0, "un bon plan terminé se range tout seul");
vrai(await lecture.lire(ID4, true, null), "mais reste lisible par son adresse");
egal(await gestion.compter(), 1, "compteur du logiciel : l'article revenu en relecture");

const citees = new Set((await base.articleActus.findMany({ select: { couverture: true, photos: true } })).flatMap((a) => [a.couverture, ...a.photos]));
const avantMenage = stockage.fichiers.size;
const effacees = await photos.menager(new Date(MAINTENANT + 30 * 3600_000));
egal(effacees, avantMenage - citees.size, "ménage : les photos jamais citées partent après 25 h");
egal([...stockage.fichiers.keys()].sort(), [...citees].sort(), "et toutes les photos des articles restent");

await terminerEssai(import.meta.url, essai, verifications.nombre);
