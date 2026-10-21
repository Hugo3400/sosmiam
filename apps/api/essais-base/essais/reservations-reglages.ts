import "../socle/garde-fou.ts";
import { pageinspect } from "@electric-sql/pglite/contrib/pageinspect";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire({ extensions: { pageinspect } });
await essai.db.exec("CREATE EXTENSION pageinspect");
const { creerDepotVisites } = await import("../../src/services/visites.ts");
const { creerReservationsClient } = await import("../../src/services/reservations-client.ts");
const { creerReservationsPro } = await import("../../src/services/reservations-pro.ts");
const { creerReglagesReservations } = await import("../../src/services/reglages-reservations.ts");
const verifications = creerVerifications();
const { egal, vrai } = verifications;

const T = new Date("2026-10-09T10:00:00Z");
const maintenant = T.getTime();
const iso = (heure: string, jour = "2026-10-09") => new Date(`${jour}T${heure}:00+02:00`).toISOString();
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);
const sql = (texte: string, valeurs: unknown[] = []) => essai.sql(texte, valeurs);

const compte = (email: string, prenom: string) => inserer("comptes", { email, prenom, email_verifie_le: T });
const [LEA, SAM, ZOE, MAX, NINA, PAUL] = [
  await compte("lea@exemple.fr", "Léa"), await compte("sam@exemple.fr", "Sam"), await compte("zoe@exemple.fr", "Zoé"),
  await compte("capitaine@exemple.fr", "Capitaine"), await compte("nina@exemple.fr", "Nina"), await compte("paul@exemple.fr", "Paul"),
];
const OUVERTURE = [{ jours: [0, 1, 2, 3, 4, 5, 6], de: "19:00", a: "23:00" }];
const lieu = (nom: string) => inserer("lieux", { nom, type: "resto", emoji: "🍝", ville: "Montpellier", statut: "publie", reservable: true, ouverture: OUVERTURE });
const LIEU = await lieu("Restaurant du Capitaine Bouiboui");
const AUTRE = await lieu("La Cantine de la Brigade");
for (const [compteId, lieuId, role, statut] of [[MAX, LIEU, "gerant", "valide"], [NINA, LIEU, "equipe", "valide"], [PAUL, LIEU, "equipe", "en-attente"], [MAX, AUTRE, "gerant", "valide"]] as const) {
  await inserer("rattachements_lieux", { compte_id: compteId, lieu_id: lieuId, role, statut, preuve: "essai" });
}

const depot = creerDepotVisites();
const roleDe = async (compteId: number, lieuId: number) =>
  ((await sql("SELECT role FROM rattachements_lieux WHERE compte_id = $1 AND lieu_id = $2 AND statut = 'valide'", [compteId, lieuId]))[0]?.role as "gerant" | "equipe" | undefined) ?? null;
let tirage = 1234;
const contexte = { depot, chiffrement: null, signerQr: () => "", tirer: () => tirage++, horloge: () => maintenant, roleDe };
const client = creerReservationsClient(contexte);
const pro = creerReservationsPro(contexte);
const reglages = creerReglagesReservations(contexte);

const requetes: string[] = [];
const queryReelle = essai.db.query.bind(essai.db);
essai.db.query = ((texte: string, ...reste: unknown[]) => {
  requetes.push(texte.replace(/\s+/g, " "));
  return (queryReelle as (...a: unknown[]) => unknown)(texte, ...reste);
}) as typeof essai.db.query;
const espionner = async <R>(faire: () => Promise<R>): Promise<{ resultat: R; verrous: string[] }> => {
  requetes.length = 0;
  const resultat = await faire();
  const verrous = requetes.filter((q) => /FOR (NO KEY )?UPDATE|^UPDATE "public"\."reservations"/.test(q))
    .map((q) => (/^UPDATE/.test(q) ? (/"statut" = \$\d+/.test(q.split("WHERE")[1] ?? "") ? "update-si-demandee" : "update") : q));
  return { resultat, verrous };
};

const SOIR = { jours: [0, 1, 2, 3, 4, 5, 6], premier: "19:00", dernier: "21:30", pas: 30, couvertsParService: 6, couvertsParCreneau: 4 };
const ligneReglages = async (lieuId: number) => {
  const [l] = await sql("SELECT services::text AS services, acceptation, delai, jours_fermes::text AS jours FROM reglages_reservations WHERE lieu_id = $1", [lieuId]);
  return l ? { ...l, services: JSON.parse(String(l.services)) } : null;
};

const regle = await reglages.regler(MAX, LIEU, { services: [SOIR], acceptation: "automatique", delai: "1-h", joursFermes: ["2026-10-20"] });
vrai(regle.ok && regle.regle, "le gérant enregistre ses réglages");
egal(await ligneReglages(LIEU), { services: [SOIR], acceptation: "automatique", delai: "1-h", jours: "{}" },
  "services en JSON, jours fermés jamais écrits par le PUT");
egal((await reglages.regler(NINA, LIEU, { services: [], acceptation: "manuelle", delai: "1-h" })).ok, false, "l'équipe ne règle pas");
const ferme = await reglages.fermerJour(NINA, LIEU, "2026-10-12", true);
egal(ferme.ok && ferme.reglages.joursFermes, ["2026-10-12"], "l'équipe ferme un jour");
await reglages.regler(MAX, LIEU, { services: [SOIR], acceptation: "automatique", delai: "1-h", joursFermes: [] });
egal((await ligneReglages(LIEU))?.jours, "{2026-10-12}", "un nouveau PUT ne rouvre pas le jour");
await sql(`UPDATE reglages_reservations SET services = '[{"jours":"tous"}]' WHERE lieu_id = $1`, [LIEU]);
const abime = await reglages.fermerJour(NINA, LIEU, "2026-10-13", true);
egal(abime.ok && [abime.reglages.services, abime.reglages.acceptation], [[], "manuelle"], "une ligne abîmée se lit avec prudence");
egal(await ligneReglages(LIEU), { services: [{ jours: "tous" }], acceptation: "automatique", delai: "1-h", jours: "{2026-10-12,2026-10-13}" },
  "fermer un jour n'écrit que la colonne des jours fermés");
await reglages.regler(MAX, LIEU, { services: [SOIR], acceptation: "automatique", delai: "1-h" });
const sansLigne = await reglages.fermerJour(MAX, AUTRE, "2026-10-14", true);
egal(sansLigne.ok && [sansLigne.regle, sansLigne.reglages.services, sansLigne.reglages.acceptation], [true, [], "manuelle"], "sans ligne : créée avec les défauts");

const demande = (heure: string, personnes: number, autresHeures?: string[]) => ({ lieuId: LIEU, personnes, jour: "2026-10-09", heure, autresHeures, message: null });
const { resultat: auto, verrous: verrousDemande } = await espionner(() => client.reserver(LEA, demande("20:00", 4, ["20:30"])));
vrai(auto.ok, JSON.stringify(auto));
if (!auto.ok) throw new Error("réservation refusée");
egal([auto.reservation.statut, auto.reservation.automatique, auto.reservation.creneau, auto.reservation.creneauxProposes, auto.nouvelleTable.equipe],
  ["acceptee", true, iso("20:00"), [iso("20:00"), iso("20:30")], [MAX, NINA]], "acceptée toute seule ; l'équipe validée seulement");
egal(verrousDemande, ["SELECT id FROM comptes WHERE id = $1 FOR UPDATE", "SELECT id FROM lieux WHERE id = $1 FOR NO KEY UPDATE"], "réserver : le compte, puis le lieu");
egal(await sql("SELECT automatique, creneaux_proposes::text AS proposes, code FROM reservations WHERE id = $1", [auto.reservation.id]),
  [{ automatique: "t", proposes: `{"${"2026-10-09 18:00:00+00"}","${"2026-10-09 18:30:00+00"}"}`, code: "1234" }], "écrite telle quelle");
const complet = await client.reserver(SAM, demande("20:00", 4, ["20:30"]));
egal(complet.ok ? complet.reservation.statut : complet.erreur, "creneau-complet", "plus que 2 couverts au service");
const planB = await client.reserver(SAM, demande("20:00", 2, ["20:30"]));
egal(planB.ok && planB.reservation.creneau, iso("20:30"), "20 h n'a plus d'arrivées : le plan B");

await reglages.regler(MAX, LIEU, { services: [{ ...SOIR, couvertsParService: 8 }], acceptation: "manuelle", delai: "30-min" });
const aLaMain = await client.reserver(ZOE, { ...demande("21:30", 2, ["21:00"]), message: "Une table au calme ?" });
if (!aLaMain.ok) throw new Error(aLaMain.erreur);
const baisse = await reglages.regler(MAX, LIEU, { services: [SOIR], acceptation: "manuelle", delai: "30-min" });
egal(baisse.ok && baisse.aRevoir, [], "une demande n'occupe rien : rien à revoir");
egal([aLaMain.reservation.statut, aLaMain.reservation.creneau], ["demandee", iso("21:00")], "à la main : le plus tôt des horaires");
const liste = await pro.lister(NINA, LIEU);
egal(liste.ok && liste.reservations.find((r) => r.id === aLaMain.reservation.id)?.propositions.map((p) => [p.creneau, p.places]),
  [[iso("21:30"), 0], [iso("21:00"), 0]], "le comptoir voit les places restantes de chaque horaire");
const refus = await pro.accepter(NINA, aLaMain.reservation.id, { creneau: iso("21:30"), depasser: false });
egal(refus.ok ? "ok" : [refus.erreur, refus.details], ["capacite-depassee", { places: 0 }], "complet : il faut confirmer");
const { resultat: acceptee, verrous: verrousAccepter } = await espionner(() => pro.accepter(NINA, aLaMain.reservation.id, { creneau: iso("21:30"), depasser: true }));
egal(acceptee.ok && [acceptee.reservation.statut, acceptee.reservation.creneau], ["acceptee", iso("21:30")], "acceptée quand même, à l'horaire choisi");
egal(verrousAccepter, [
  "SELECT id FROM comptes WHERE id = $1 FOR UPDATE", "SELECT id FROM reservations WHERE id = $1 FOR UPDATE", "SELECT id FROM lieux WHERE id = $1 FOR NO KEY UPDATE",
  "update-si-demandee",
], "accepter : compte, réservation, lieu, puis l'écriture seulement si elle est encore demandée");
egal(await sql("SELECT statut, repondu_par_id, creneau FROM reservations WHERE id = $1", [aLaMain.reservation.id]),
  [{ statut: "acceptee", repondu_par_id: String(NINA), creneau: "2026-10-09 19:30:00+00" }]);
const encore = await pro.accepter(MAX, aLaMain.reservation.id, { creneau: null, depasser: false });
egal(encore.ok ? "ok" : encore.erreur, "transition-interdite", "déjà acceptée");

const ancienne = await inserer("reservations", { compte_id: SAM, lieu_id: AUTRE, personnes: 2, creneau: new Date(T.getTime() + 25 * 60_000), statut: "demandee", cree_le: T });
await sql("UPDATE reservations SET creneaux_proposes = NULL WHERE id = $1", [ancienne]);
const ici = await inserer("reservations", { compte_id: LEA, lieu_id: LIEU, personnes: 2, creneau: new Date(T.getTime() + 25 * 60_000), statut: "demandee", cree_le: T });
const lue = await depot.lire((t) => t.lireReservation(ancienne));
egal([lue?.creneauxProposes, lue?.automatique], [[], false], "une ligne d'avant (creneaux_proposes NULL) se lit [creneau]");
egal((await depot.ecrire((t) => t.expirerReservations(T))).map((r) => r.id), [ancienne], "30 min de marge sans réglage ; 10 min ici (à la main, 30 min de délai)");
egal((await depot.ecrire((t) => t.expirerReservations(new Date(T.getTime() + 15 * 60_000), { compteId: LEA }))).map((r) => r.id), [ici], "15 min plus tard : à 10 min");

const lireVerrou = async (table: "reservations" | "lieux", id: number) => (await essai.db.query(`SELECT h.t_xmax::text = pg_current_xact_id_if_assigned()::text AS "parMoi",
    (h.t_infomask & 128) <> 0 AND (h.t_infomask & 64) <> 0 AS "exclusifSeul", (h.t_infomask2 & 8192) <> 0 AS "surLaCle"
  FROM ${table} x, heap_page_items(get_raw_page('${table}', (x.ctid::text::point)[0]::int)) h WHERE h.lp = (x.ctid::text::point)[1]::int AND x.id = $1`, [id])).rows[0];
const verrousTenus = await depot.ecrire(async (t) => {
  await t.verrouillerReservation(ici);
  await t.verrouillerLieu(LIEU);
  return { reservation: await lireVerrou("reservations", ici), lieu: await lireVerrou("lieux", LIEU) };
});
egal(verrousTenus, { reservation: { parMoi: "t", exclusifSeul: "t", surLaCle: "t" }, lieu: { parMoi: "t", exclusifSeul: "t", surLaCle: "f" } },
  "la réservation en FOR UPDATE, le lieu en FOR NO KEY UPDATE (les clés étrangères des autres tables passent)");
egal(await depot.lire(async (t) => {
  requetes.length = 0;
  await t.verrouillerReservation(ici);
  await t.verrouillerLieu(LIEU);
  return requetes.length;
}), 0, "hors transaction : aucun verrou");

await terminerEssai(import.meta.url, essai, verifications.nombre);
