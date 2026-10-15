import "../socle/garde-fou.ts";
import { servicesMiamSafe } from "../../src/services/miam-safe.ts";
import { prevenirEquipeMiamSafe } from "../../src/services/notifications/prevenir-equipe-miam-safe.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);
const verifications = creerVerifications();
const { egal } = verifications;

let numero = 0;
const creerCompte = () => {
  numero += 1;
  return inserer("comptes", { email: `miami${numero}@exemple.fr`, prenom: `Miami${numero}` });
};
const creerLieu = (statut = "publie") => inserer("lieux", { type: "resto", ville: "Montpellier", statut });
const visiter = (compteId: number, lieuId: number, statut: string) => inserer("visites", { compte_id: compteId, lieu_id: lieuId, mode: "comptoir", statut });
const repondreSansVisite = (compteId: number, lieuId: number, oui: boolean) => inserer("reponses_senti_bien", { compte_id: compteId, lieu_id: lieuId, oui });
const compterReponses = (lieuId: number) => essai.base.reponseSentiBien.count({ where: { lieuId } });

const lieu = await creerLieu();
const voisin = await creerLieu();
const brouillon = await creerLieu("brouillon");

egal(await servicesMiamSafe.lireLieu(lieu), { engage: false, repere: false }, "lieu publié sans charte ni réponse");
egal(await servicesMiamSafe.lireLieu(brouillon), null, "lieu pas publié : inconnu");

const sansVisite = await creerCompte();
egal(await servicesMiamSafe.repondreSentiBien({ lieuId: lieu, compteId: sansVisite, oui: true }), "visite-requise", "aucune visite : refusé");
const demandee = await creerCompte();
await visiter(demandee, lieu, "demandee");
egal(await servicesMiamSafe.repondreSentiBien({ lieuId: lieu, compteId: demandee, oui: true }), "visite-requise", "visite seulement demandée : refusé");
const refusee = await creerCompte();
await visiter(refusee, lieu, "refusee");
egal(await servicesMiamSafe.repondreSentiBien({ lieuId: lieu, compteId: refusee, oui: true }), "visite-requise", "visite refusée : refusé");
const ailleurs = await creerCompte();
await visiter(ailleurs, voisin, "validee");
egal(await servicesMiamSafe.repondreSentiBien({ lieuId: lieu, compteId: ailleurs, oui: true }), "visite-requise", "visite validée dans un autre lieu : refusé");
egal(await compterReponses(lieu), 0, "aucune réponse refusée n'est gardée");
egal(await servicesMiamSafe.repondreSentiBien({ lieuId: brouillon, compteId: ailleurs, oui: true }), "lieu-inconnu", "lieu pas publié : lieu-inconnu");

const visiteurs: number[] = [];
for (let i = 0; i < 19; i++) {
  const compte = await creerCompte();
  await visiter(compte, lieu, "validee");
  visiteurs.push(compte);
  egal(await servicesMiamSafe.repondreSentiBien({ lieuId: lieu, compteId: compte, oui: true }), "ok", `visiteur ${i + 1} : accepté`);
}
egal(await servicesMiamSafe.repondreSentiBien({ lieuId: lieu, compteId: visiteurs[0]!, oui: true }), "ok", "même visiteur : sa réponse est remplacée");
egal(await compterReponses(lieu), 19, "une ligne par visiteur");

for (let i = 0; i < 25; i++) await repondreSansVisite(await creerCompte(), lieu, true);
await repondreSansVisite(ailleurs, lieu, true);
egal(await compterReponses(lieu), 45, "45 lignes, dont 26 sans visite validée ici");
egal(await servicesMiamSafe.lireLieu(lieu), { engage: false, repere: false }, "19 oui après visite : pas de repère, les 26 sans visite ne comptent pas");

const vingtieme = await creerCompte();
await visiter(vingtieme, lieu, "validee");
egal(await servicesMiamSafe.repondreSentiBien({ lieuId: lieu, compteId: vingtieme, oui: true }), "ok", "vingtième visiteur");
egal(await servicesMiamSafe.lireLieu(lieu), { engage: false, repere: true }, "20 oui sur 20 après visite : repère, charte ou pas");

for (let i = 0; i < 2; i++) {
  const compte = await creerCompte();
  await visiter(compte, lieu, "validee");
  await servicesMiamSafe.repondreSentiBien({ lieuId: lieu, compteId: compte, oui: false });
}
egal(await servicesMiamSafe.lireLieu(lieu), { engage: false, repere: true }, "20 oui sur 22 : 90,9 %, repère");
for (let i = 0; i < 4; i++) await repondreSansVisite(await creerCompte(), lieu, false);
egal(await servicesMiamSafe.lireLieu(lieu), { engage: false, repere: true }, "des non sans visite ne comptent pas non plus");
const dernier = await creerCompte();
await visiter(dernier, lieu, "validee");
await servicesMiamSafe.repondreSentiBien({ lieuId: lieu, compteId: dernier, oui: false });
egal(await servicesMiamSafe.lireLieu(lieu), { engage: false, repere: false }, "20 oui sur 23 après visite : 87 %, plus de repère");

await inserer("chartes_miam_safe", { lieu_id: voisin, signee_le: new Date() });
egal(await servicesMiamSafe.lireLieu(voisin), { engage: true, repere: false }, "charte signée : badge, sans repère");
await essai.sql("UPDATE chartes_miam_safe SET retiree_le = now() WHERE lieu_id = $1", [voisin]);
egal(await servicesMiamSafe.lireLieu(voisin), { engage: false, repere: false }, "charte retirée : plus de badge");

const gerant = await creerCompte();
const serveuse = await creerCompte();
const ancien = await creerCompte();
const client = await creerCompte();
await inserer("rattachements_lieux", { lieu_id: voisin, compte_id: gerant, role: "gerant", statut: "valide" });
await inserer("rattachements_lieux", { lieu_id: voisin, compte_id: serveuse, role: "membre", statut: "valide" });
await inserer("rattachements_lieux", { lieu_id: voisin, compte_id: ancien, role: "membre", statut: "en-attente" });
let jeton = 0;
const telephone = async (compteId: number, valeurs: Record<string, unknown> = {}) => {
  jeton += 1;
  const session = await inserer("sessions_comptes", { compte_id: compteId, empreinte: `${jeton}`.padStart(64, "0") });
  return inserer("appareils_push", { jeton: `jeton-${jeton}`, plateforme: "ios", compte_id: compteId, session_id: session, actif: true, ...valeurs });
};
const alerte = (compteId: number) => ({ lieuId: voisin, compteId, prenom: "Léa", endroit: "salle", detail: "" });
const envois: string[] = [];
const envoyer = async (appareil: { jeton: string }) => {
  envois.push(appareil.jeton);
  return "envoyee" as const;
};
const attendreEnvois = () => new Promise((fini) => setTimeout(fini, 50));

egal(await prevenirEquipeMiamSafe(alerte(client), envoyer), 0, "aucun téléphone de l'équipe : 0");
await telephone(gerant);
await telephone(gerant);
await telephone(serveuse);
await telephone(serveuse, { actif: false });
await telephone(serveuse, { session_id: null });
await telephone(ancien);
await telephone(client);
egal(await prevenirEquipeMiamSafe(alerte(client), envoyer), 3, "deux du gérant et un de la serveuse : ni l'inactif, ni le déconnecté, ni le membre en attente, ni le client");
await attendreEnvois();
egal(envois.length, 3, "les trois envois partent");
egal(await prevenirEquipeMiamSafe(alerte(serveuse), envoyer), 2, "la serveuse alerte : jamais sur son propre téléphone");

await terminerEssai(import.meta.url, essai, verifications.nombre);
