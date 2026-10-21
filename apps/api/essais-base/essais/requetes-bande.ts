// Essai sur base (PGlite, toutes les migrations du dépôt) des requêtes de la bande (lot L3, services/bande-activite.ts) par
// le VRAI client Prisma : « Quoi de neuf » (seulement les potes qui partagent leur activité, sans blocage, sur 30 jours, lieux
// publiés, sans la ligne retirée de ma vue ni la liste signalée par moi ou suspendue) et le classement du mois de Paris
// (points nets du journal, rescousses ; moi d'abord). Puis les mêmes par les fonctions de l'API (lireActiviteBande,
// lireClassementBande), avec les vraies relations sociales. Porté du scratchpad (essai-l3). Aucune vraie base.
import "../socle/garde-fou.ts";
import { construireRequeteActivite, construireRequeteClassement, lireActiviteBande, lireClassementBande } from "../../src/services/bande-activite.ts";
import { creerRelationsSociales } from "../../src/services/relations-sociales.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { base, db } = essai;
const verifications = creerVerifications();
const { egal, vrai } = verifications;
const creer = (table: string, valeurs: Record<string, unknown> = {}) => insererLigne(db, table, valeurs);

let n = 0;
const personne = async (pseudo: string, o: { partage?: boolean } = {}) => {
  n += 1;
  const id = await creer("comptes", { email: `p${n}@essai.fr`, prenom: pseudo, mot_de_passe: "x", cgu_version: "2026-10-08", pseudo });
  await creer("profils_sociaux", { compte_id: id, id_public: `essai${String(n).padStart(5, "a")}`.slice(0, 10), activite_partagee: o.partage ?? true });
  return id;
};
const potes = async (a: number, b: number, quand: Date) => {
  await creer("membres_bandes", { compte_id: a, pote_id: b, cree_le: quand });
  await creer("membres_bandes", { compte_id: b, pote_id: a, cree_le: quand });
};

const maintenant = new Date("2026-10-31T23:30:00Z");
const ilYa = (jours: number) => new Date(maintenant.getTime() - jours * 86_400_000);
const moi = await personne("moi");
const lea = await personne("lea");
const sam = await personne("sam", { partage: false });
const zoe = await personne("zoe");
const inconnu = await personne("inconnu");
await potes(moi, lea, ilYa(3));
await potes(moi, sam, ilYa(2));
await potes(moi, zoe, ilYa(1));
await creer("blocages", { bloqueur_id: zoe, bloque_id: moi }); // un blocage restant (la bande aurait dû partir) : Zoé est cachée
const lieu = await creer("lieux", { nom: "Le Capitaine Bouiboui", statut: "publie" });
const lieuRetire = await creer("lieux", { nom: "Brouillon", statut: "brouillon" });
const r1 = await creer("rescousses", { compte_id: lea, lieu_id: lieu, semaine: "2026-S44", cree_le: ilYa(1) });
await creer("rescousses", { compte_id: lea, lieu_id: lieuRetire, semaine: "2026-S44", cree_le: ilYa(1) });
await creer("rescousses", { compte_id: lea, lieu_id: lieu, semaine: "2026-S40", cree_le: ilYa(40) });
for (const qui of [sam, zoe, inconnu]) await creer("rescousses", { compte_id: qui, lieu_id: lieu, semaine: "2026-S44", cree_le: ilYa(1) });
await creer("lieux_gardes", { compte_id: lea, lieu_id: lieu, cree_le: ilYa(2) });
const jourBadges = new Date(ilYa(4));
jourBadges.setUTCHours(10, 0, 0, 0);
const badge = await creer("badges_comptes", { compte_id: lea, badge: "premier-sauveteur", obtenu_le: jourBadges });
await creer("badges_comptes", { compte_id: lea, badge: "premiere-rescousse", obtenu_le: new Date(jourBadges.getTime() - 3_600_000) });
await creer("badges_comptes", { compte_id: lea, badge: "fureteur", obtenu_le: new Date(jourBadges.getTime() - 7_200_000) });
const liste = await creer("listes_lieux", { auteur_id: lea, titre: "Pizzas du jeudi", emoji: "🍕", cree_le: ilYa(5) });
const signalee = await creer("listes_lieux", { auteur_id: lea, titre: "Signalée", emoji: "🍕", cree_le: ilYa(5) });
await creer("listes_lieux", { auteur_id: lea, titre: "Suspendue", emoji: "🍕", cree_le: ilYa(5), suspendue_le: ilYa(1) });
await creer("signalements", { cible: "liste", cible_id: String(signalee), raison: "autre", source: "app", signale_par_id: moi });
const idLea = String((await essai.sql("SELECT id_public FROM profils_sociaux WHERE compte_id = $1", [lea]))[0]!.id_public);
const lieuMasque = await creer("lieux", { nom: "Masqué", statut: "publie" });
await creer("lieux_gardes", { compte_id: lea, lieu_id: lieuMasque, cree_le: ilYa(2) });
await creer("elements_masques", { compte_id: moi, cible: "activite", cible_id: `garde:${idLea}:${lieuMasque}` });

type Ligne = { id: string; type: string; compteId: number; lieuId: number | null; detail: string | null; listeId: number | null; date: Date };
const activite = await base.$queryRaw<Ligne[]>(construireRequeteActivite(moi, ilYa(30)));
egal(activite.map((l) => l.id), [`rescousse:${r1}`, `garde:${idLea}:${lieu}`, `badge:${badge}`, `liste:${liste}`],
  "Quoi de neuf : Léa seulement, fenêtre de 30 jours, lieux publiés, un seul badge par jour (le dernier), sans le masqué ni la liste signalée ou suspendue");
egal(activite.map((l) => l.type), ["rescousse", "garde", "badge", "liste"]);
egal(activite[0]!.compteId, lea);
egal(activite[0]!.lieuId, lieu);
egal(activite[2]!.detail, "premier-sauveteur");
egal([activite[3]!.detail, activite[3]!.listeId], ["Pizzas du jeudi", liste]);
vrai(activite[0]!.date instanceof Date);

// Classement : le mois de Paris commence le 31 octobre à 23 h UTC (déjà le 1er novembre à Paris)
const debutMois = new Date("2026-10-31T23:00:00Z");
await creer("journal_points", { compte_id: moi, points: 5, raison: "visite", cree_le: new Date("2026-10-31T23:10:00Z") });
await creer("journal_points", { compte_id: moi, points: 50, raison: "visite", cree_le: new Date("2026-10-31T22:50:00Z") });
await creer("journal_points", { compte_id: lea, points: 8, raison: "visite", cree_le: new Date("2026-10-31T23:20:00Z") });
await creer("journal_points", { compte_id: lea, points: -3, raison: "equipe", cree_le: new Date("2026-10-31T23:21:00Z") });
await creer("rescousses", { compte_id: moi, lieu_id: lieu, semaine: "2026-S45", cree_le: new Date("2026-10-31T23:05:00Z") });
egal(await base.$queryRaw(construireRequeteClassement(moi, debutMois)), [
  { compteId: moi, pointsDuMois: 5, rescoussesDuMois: 1 },
  { compteId: lea, pointsDuMois: 5, rescoussesDuMois: 0 },
], "moi d'abord, puis Léa (Sam ne partage pas, Zoé est cachée) ; points nets du mois de Paris");

// Par les fonctions de l'API : les mêmes lignes, présentées avec la personne (son identifiant public, jamais son id)
const relations = creerRelationsSociales(base);
const vue = await lireActiviteBande(base, relations, moi, maintenant);
egal(vue.map((a) => a.id), activite.map((l) => l.id), "lireActiviteBande : les mêmes lignes");
egal([...new Set(vue.map((a) => a.personne.id))], [idLea], "chaque ligne présente Léa par son identifiant public");
const classement = await lireClassementBande(base, relations, moi, maintenant);
egal(classement.mois, "2026-11", "le mois de Paris (déjà novembre à 0 h 30)");
egal(classement.places.map((p) => [p.personne.id, p.pointsDuMois, p.rescoussesDuMois, p.estMoi]).sort(),
  [[idLea, 5, 0, false], [(await essai.sql("SELECT id_public FROM profils_sociaux WHERE compte_id = $1", [moi]))[0]!.id_public, 5, 1, true]].sort());
await terminerEssai(import.meta.url, essai, verifications.nombre);
