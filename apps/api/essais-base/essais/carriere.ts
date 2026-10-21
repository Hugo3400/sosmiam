import "../socle/garde-fou.ts";
import { creerChiffrementCarriere } from "../../src/services/chiffrement-carriere.ts";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerStockageCandidaturesEnMemoire } from "../../src/services/stockage-candidatures.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { baseDeDonnees } = essai;
const { creerDepotCarriere } = await import("../../src/services/carriere-base.ts");
const { creerCarriere } = await import("../../src/services/carriere-services.ts");
const verifications = creerVerifications();
const { egal, vrai } = verifications;

const JOUR = 86_400_000;
const T = Date.parse("2026-10-21T10:00:00Z");
const horloge = { maintenant: T };
const cle1 = new Uint8Array(32).fill(4);
const pdf = (texte: string) => Buffer.from(`%PDF-1.7\n% ${texte}\ntrailer << >>\n%%EOF\n`, "latin1");
const depot = creerDepotCarriere(baseDeDonnees);
const stockage = creerStockageCandidaturesEnMemoire({ horloge: () => horloge.maintenant });
const servicesAvec = (chiffrement: ReturnType<typeof creerChiffrementCarriere>) => creerCarriere({ depot, stockage, chiffrement, horloge: () => horloge.maintenant });
const carriere = servicesAvec(creerChiffrementCarriere(creerChiffrementDonnees(cle1)));

const brouillons = await carriere.listerOffresGestion();
egal(brouillons.length, 5, "la migration pose 5 offres");
egal(brouillons.every((o) => o.publieeLe === null && o.fermeeLe === null), true, "toutes en brouillon");
egal(new Set(brouillons.map((o) => o.titre)), new Set(["Modération avec la Brigade", "Réseaux sociaux : TikTok, Instagram et Discord", "Graphisme et illustration", "Vidéo et montage", "Développement web et mobile"]));
egal(brouillons.filter((o) => o.type === "benevolat").map((o) => o.domaine).sort(), ["moderation", "reseaux-sociaux"]);
egal(brouillons.filter((o) => o.type === "freelance").map((o) => o.domaine).sort(), ["developpement", "graphisme", "video"]);
egal(brouillons.every((o) => o.lieu === "À distance, partout en France" && o.profil[0] === "Dès 18 ans, où que tu sois en France"), true);
const benevolat = brouillons.find((o) => o.domaine === "moderation")!;
egal(benevolat.enEchange.length, 3, "badge et rôle, attestation, générique");
vrai(benevolat.resume.includes("à ton rythme"));
egal(brouillons.filter((o) => o.type === "freelance").every((o) => o.enEchange.length === 1 && o.enEchange[0]!.includes("sur devis")), true);
egal(brouillons.every((o) => o.missions.length >= 3 && o.description.length >= 20), true);
egal(await carriere.listerOffresPubliees(), [], "aucune n'est publiée par la migration");

const publiee = await carriere.publierOffre(benevolat.id, new Date(T - JOUR));
egal(publiee?.publieeLe, new Date(T - JOUR).toISOString());
const video = brouillons.find((o) => o.domaine === "video")!;
await carriere.publierOffre(video.id, new Date(T - 60_000));
egal((await carriere.listerOffresPubliees()).map((o) => o.id), [video.id, benevolat.id], "les plus récentes d'abord");
egal((await carriere.lireOffrePubliee(benevolat.id))?.enEchange, benevolat.enEchange);
egal(await carriere.lireOffrePubliee(brouillons.find((o) => o.domaine === "graphisme")!.id), null, "brouillon invisible");

const candidature = (email: string, avecCv = true) => ({
  nom: "Zoé Martin", email, message: "Je modère avec le sourire, même un dimanche soir.", lien: "https://exemple.fr/zoe", majeur: true as const,
  cv: avecCv ? { nomFichier: "zoe.pdf", base64: pdf(email).toString("base64") } : null,
});
egal(await carriere.deposerCandidature(benevolat.id, candidature("zoe@exemple.fr")), { ok: true });
egal(await carriere.deposerCandidature(benevolat.id, candidature("Zoe@Exemple.fr ", false)), { ok: true });
egal(await carriere.deposerCandidature(video.id, candidature("zoe@exemple.fr")), { ok: true });
const refus = await carriere.deposerCandidature(video.id, candidature("zoe@exemple.fr"));
egal(refus, { ok: false, erreur: "trop-de-demandes", reessayerDans: 86_400 }, "3 par jour et par e-mail, comptés dans la base");

const lignes = await essai.sql("SELECT id, nom_chiffre, email_chiffre, message_chiffre, lien_chiffre, cv_fichier, email_empreinte FROM candidatures_carriere");
egal(lignes.length, 3);
egal(lignes.every((l) => String(l.message_chiffre).startsWith("v1:") && String(l.nom_chiffre).startsWith("v1:") && String(l.lien_chiffre).startsWith("v1:")), true, "chiffrés dans la base");
egal(lignes.some((l) => JSON.stringify(l).includes("Zoé") || JSON.stringify(l).toLowerCase().includes("zoe@")), false, "rien en clair");
egal(new Set(lignes.map((l) => l.email_empreinte)).size, 1, "même empreinte quelle que soit la casse");

const gestion = await carriere.listerOffresGestion();
egal([gestion.find((o) => o.id === benevolat.id)?.candidatures, gestion.find((o) => o.id === benevolat.id)?.nouvelles], [2, 2]);
const liste = await carriere.listerCandidatures({ offreId: benevolat.id });
egal(liste.map((c) => [c.nom, c.email, c.offreTitre]), [["Zoé Martin", "zoe@exemple.fr", benevolat.titre], ["Zoé Martin", "zoe@exemple.fr", benevolat.titre]]);
const avecCv = liste.find((c) => c.aUnCv)!;
egal(await carriere.lireCvCandidature(avecCv.id), pdf("zoe@exemple.fr"), "CV déchiffré depuis la base et le stockage");
egal(await carriere.changerStatutCandidature(avecCv.id, "lue"), { ok: true });
vrai((await essai.sql("SELECT lue_le FROM candidatures_carriere WHERE id = $1", [avecCv.id]))[0]?.lue_le, "lue_le posée");
egal((await carriere.listerOffresGestion()).find((o) => o.id === benevolat.id)?.nouvelles, 1);
egal((await carriere.listerCandidatures({ statut: "lue" })).map((c) => c.id), [avecCv.id]);

const anciensFichiers = new Set(lignes.flatMap((l) => (l.cv_fichier ? [String(l.cv_fichier)] : [])));
egal(await depot.listerCvCites([...anciensFichiers, "0f2b8c1e-7a4b-4c1d-9e2f-3a4b5c6d7e8f.bin"]), anciensFichiers);
const parId = await depot.listerCandidaturesApres(null, 2);
egal(parId.length, 2);
egal((await depot.listerCandidaturesApres(parId[1]!.id, 10)).length, 1, "pages suivantes par id");

const cle2 = new Uint8Array(32).fill(5);
const pendant = servicesAvec(creerChiffrementCarriere(creerChiffrementDonnees(cle2, { version: 2, anciennes: [{ version: 1, cle: cle1 }] })));
const nuit = await pendant.menager();
egal([nuit.rechiffrees, nuit.illisibles, nuit.candidatures], [3, 0, 0], "changement de clé : tout est rechiffré");
const apres = await essai.sql("SELECT message_chiffre, cv_fichier FROM candidatures_carriere");
egal(apres.every((l) => String(l.message_chiffre).startsWith("v2:")), true);
egal(apres.some((l) => l.cv_fichier !== null && anciensFichiers.has(String(l.cv_fichier))), false, "les CV ont un nouveau nom");
egal([...anciensFichiers].some((f) => stockage.fichiers.has(f)), false, "les anciens fichiers sont partis");
const seule2 = servicesAvec(creerChiffrementCarriere(creerChiffrementDonnees(cle2, { version: 2 })));
egal((await seule2.listerCandidatures({ offreId: benevolat.id }))[0]?.nom, "Zoé Martin", "lisible sans l'ancienne clé");

horloge.maintenant = T + 183 * JOUR + 1000;
const fichiersVideo = (await essai.sql("SELECT cv_fichier FROM candidatures_carriere WHERE offre_id = $1", [Number(video.id)])).map((l) => String(l.cv_fichier));
egal(await seule2.supprimerOffre(video.id), true);
egal(fichiersVideo.some((f) => stockage.fichiers.has(f)), false, "offre supprimée : ses candidatures et leurs CV partent (cascade)");
const bilan = await seule2.menager();
egal([bilan.candidatures, bilan.cv], [2, 1], "6 mois après l'envoi, effacées avec leur CV");
egal(await baseDeDonnees.candidatureCarriere.count(), 0);
egal(stockage.fichiers.size, 0);
egal((await essai.sql("SELECT count(*) AS n FROM offres_carriere"))[0]?.n, "4", "l'offre reste, seules les candidatures partent");

await terminerEssai(import.meta.url, essai, verifications.nombre);
