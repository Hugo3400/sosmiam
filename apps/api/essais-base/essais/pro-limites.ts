import "../socle/garde-fou.ts";
import { pageinspect } from "@electric-sql/pglite/contrib/pageinspect";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire({ extensions: { pageinspect } });
await essai.db.exec("CREATE EXTENSION pageinspect");
const { servicesPro } = await import("../../src/services/pro.ts");
const { creerSuggestionLieu } = await import("../../src/services/suggestions-comptes.ts");
const verifications = creerVerifications();
const { egal } = verifications;

const T = new Date("2026-10-09T10:00:00Z");
const ILYA_DEUX_JOURS = new Date(T.getTime() - 48 * 3600_000);
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);
const sql = (texte: string, valeurs: unknown[] = []) => essai.sql(texte, valeurs);
const majeur = () => "majeur" as const;

const compte = (email: string, prenom: string) => inserer("comptes", { email, prenom });
const lieu = (nom: string) => inserer("lieux", { nom, type: "resto", emoji: "🍝", ville: "Montpellier", statut: "publie", horaires: "" });
const MAX = await compte("capitaine@exemple.fr", "Capitaine");
const LEA = await compte("lea@exemple.fr", "Léa");
const LIEU = await lieu("Restaurant du Capitaine Bouiboui");
const AUTRE = await lieu("La Cantine de la Brigade");
const LIEUX_DEMANDES: number[] = [];
for (let i = 0; i < 6; i++) LIEUX_DEMANDES.push(await lieu(`La Guinguette des Miamis ${i + 1}`));
const LIEUX_SUGGESTIONS = [LIEU, AUTRE, LIEUX_DEMANDES[0]!, LIEUX_DEMANDES[1]!];
await inserer("rattachements_lieux", { compte_id: MAX, lieu_id: LIEU, role: "gerant", statut: "valide", preuve: "essai" });
const INVITES: string[] = [];
for (let i = 0; i < 11; i++) {
  INVITES.push(`brigade${i}@exemple.fr`);
  await compte(INVITES[i]!, `Brigade ${i}`);
}
for (let i = 0; i < 30; i++) {
  const membre = await compte(`equipe${i}@exemple.fr`, `Équipe ${i}`);
  await inserer("rattachements_lieux", { compte_id: membre, lieu_id: AUTRE, role: "equipe", statut: "valide", preuve: "essai", cree_le: ILYA_DEUX_JOURS });
}
await compte("dernier@exemple.fr", "Dernier");

const lireVerrou = async (table: string, id: number) => {
  const [ligne] = (await queryReelle(`SELECT h.t_xmax::text = pg_current_xact_id_if_assigned()::text AS "parMoi",
      (h.t_infomask & 128) <> 0 AND (h.t_infomask & 64) <> 0 AS "exclusifSeul", (h.t_infomask2 & 8192) <> 0 AS "surLaCle"
    FROM ${table} x, heap_page_items(get_raw_page('${table}', (x.ctid::text::point)[0]::int)) h
    WHERE h.lp = (x.ctid::text::point)[1]::int AND x.id = $1`, [id])).rows as { parMoi: string; exclusifSeul: string; surLaCle: string }[];
  return ligne ? `${table} ${id} : ${ligne.parMoi === "t" ? "par moi" : "par un autre"}, ${ligne.exclusifSeul === "t" ? "exclusif" : "partagé"}, ${ligne.surLaCle === "t" ? "sur la clé" : "sans la clé"}` : `${table} ${id} : absent`;
};

const etiqueter = (texte: string) => {
  const table = /"public"\."(\w+)"/.exec(texte)?.[1] ?? "";
  if (/^(BEGIN|COMMIT|ROLLBACK)/.test(texte)) return texte.split(" ")[0]!;
  if (/FOR (NO KEY )?UPDATE$/.test(texte)) return texte;
  if (/COUNT\(/.test(texte)) return `compter ${table}`;
  if (/^INSERT/.test(texte)) return `inserer ${table}`;
  if (/^UPDATE/.test(texte)) return `modifier ${table}`;
  return `lire ${table}`;
};

const requetes: string[] = [];
const verrous: string[] = [];
const queryReelle = essai.db.query.bind(essai.db);
essai.db.query = (async (texte: string, valeurs?: unknown[], ...reste: unknown[]) => {
  const resultat = await (queryReelle as (...a: unknown[]) => Promise<unknown>)(texte, valeurs, ...reste);
  const propre = texte.replace(/\s+/g, " ").trim();
  requetes.push(etiqueter(propre));
  const verrou = /^SELECT id FROM (comptes|lieux) WHERE id = \$1 FOR NO KEY UPDATE$/.exec(propre);
  if (verrou) verrous.push(await lireVerrou(verrou[1]!, Number(valeurs?.[0])));
  return resultat;
}) as typeof essai.db.query;

const espionner = async <R>(faire: () => Promise<R>) => {
  requetes.length = 0;
  verrous.length = 0;
  const resultat = await faire();
  return { resultat, requetes: [...requetes], verrous: [...verrous] };
};

const VERROU_COMPTE = "SELECT id FROM comptes WHERE id = $1 FOR NO KEY UPDATE";
const VERROU_LIEU = "SELECT id FROM lieux WHERE id = $1 FOR NO KEY UPDATE";

const premiere = await espionner(() => servicesPro.demanderRattachement(LEA, { lieuId: LIEUX_DEMANDES[0]!, preuve: "Kbis", siret: null }, T));
egal(premiere.resultat.ok, true, "première demande de rattachement acceptée");
egal(premiere.requetes, ["BEGIN", VERROU_COMPTE, "lire lieux", "lire rattachements_lieux", "compter rattachements_lieux", "inserer rattachements_lieux", "COMMIT"],
  "demande : le compte verrouillé avant tout, puis compter et écrire");
egal(premiere.verrous, [`comptes ${LEA} : par moi, exclusif, sans la clé`], "demande : FOR NO KEY UPDATE sur le compte, tenu par la transaction");
for (const lieuId of LIEUX_DEMANDES.slice(1, 5)) {
  egal((await servicesPro.demanderRattachement(LEA, { lieuId, preuve: "Kbis", siret: null }, T)).ok, true, `demande sur le lieu ${lieuId}`);
}
egal(await servicesPro.demanderRattachement(LEA, { lieuId: LIEUX_DEMANDES[5]!, preuve: "Kbis", siret: null }, T), { ok: false, erreur: "trop-de-demandes" },
  "6e demande en 24 h : refusée");
egal(await servicesPro.demanderRattachement(LEA, { lieuId: LIEUX_DEMANDES[0]!, preuve: "Kbis", siret: null }, T), { ok: false, erreur: "deja-demande" },
  "demande déjà en attente");

const invitation = await espionner(() => servicesPro.inviterMembre(LIEU, MAX, INVITES[0]!, T, majeur));
egal(invitation.resultat, { ok: true }, "première invitation acceptée");
egal(invitation.requetes, [
  "BEGIN", "lire comptes", VERROU_COMPTE, VERROU_LIEU, "lire rattachements_lieux", "compter rattachements_lieux", "compter rattachements_lieux",
  "inserer rattachements_lieux", "COMMIT",
], "invitation : le compte invité, puis le lieu, verrouillés avant de compter");
const [invite0] = await sql("SELECT id FROM comptes WHERE email = $1", [INVITES[0]]);
egal(invitation.verrous, [`comptes ${invite0!.id} : par moi, exclusif, sans la clé`, `lieux ${LIEU} : par moi, exclusif, sans la clé`],
  "invitation : FOR NO KEY UPDATE sur le compte puis sur le lieu");
for (const email of INVITES.slice(1, 10)) egal(await servicesPro.inviterMembre(LIEU, MAX, email, T, majeur), { ok: true }, `invitation de ${email}`);
egal(await servicesPro.inviterMembre(LIEU, MAX, INVITES[10]!, T, majeur), { ok: false, erreur: "trop-d-invitations" }, "11e invitation en 24 h : refusée");
egal(await servicesPro.inviterMembre(LIEU, MAX, INVITES[0]!, T, majeur), { ok: false, erreur: "deja-membre" }, "déjà invité");
egal(await servicesPro.inviterMembre(AUTRE, MAX, "dernier@exemple.fr", T, majeur), { ok: false, erreur: "equipe-complete" }, "31e membre : équipe complète");
const inconnu = await espionner(() => servicesPro.inviterMembre(LIEU, MAX, "personne@exemple.fr", T, majeur));
egal([inconnu.resultat, inconnu.verrous], [{ ok: false, erreur: "compte-inconnu" }, []], "compte inconnu : aucun verrou");

const proposer = (lieuId: number, nom: string) => ({ directs: { horaires: `Ouvert ${nom}` }, suggestion: { proposition: { nom }, avant: { nom: "Avant" }, message: null } });
const fiche = await espionner(() => servicesPro.modifierFichePro(MAX, LIEU, proposer(LIEU, "Le Bouiboui"), T));
egal(fiche.resultat.ok, true, "première suggestion du gérant acceptée");
egal(fiche.requetes, ["BEGIN", VERROU_COMPTE, "compter suggestions_lieux", "compter suggestions_lieux", "inserer suggestions_lieux", "modifier lieux", "COMMIT"],
  "fiche : le compte verrouillé avant de compter, le lieu écrit après");
egal(fiche.verrous, [`comptes ${MAX} : par moi, exclusif, sans la clé`], "fiche : FOR NO KEY UPDATE sur le compte");
const directs = await espionner(() => servicesPro.modifierFichePro(MAX, LIEU, { directs: { horaires: "Midi" }, suggestion: null }, T));
egal([directs.resultat, directs.requetes], [{ ok: true, suggestionId: null }, ["BEGIN", "modifier lieux", "COMMIT"]], "champs directs seuls : aucun verrou de plus");
for (let i = 1; i < 3; i++) egal((await servicesPro.modifierFichePro(MAX, LIEU, proposer(LIEU, `Bouiboui ${i}`), T)).ok, true, `suggestion ${i + 1} sur le lieu`);
egal(await servicesPro.modifierFichePro(MAX, LIEU, proposer(LIEU, "Bouiboui 4"), T), { ok: false, erreur: "trop-de-suggestions" }, "4e en attente sur le lieu : refusée");
egal((await sql("SELECT horaires FROM lieux WHERE id = $1", [LIEU]))[0]?.horaires, "Ouvert Bouiboui 2", "refusée : les champs directs ne sont pas écrits");
for (const lieuId of LIEUX_SUGGESTIONS.slice(1)) {
  for (let i = 0; i < (lieuId === LIEUX_SUGGESTIONS[3] ? 1 : 3); i++) {
    egal((await servicesPro.modifierFichePro(MAX, lieuId, proposer(lieuId, `Nom ${i}`), T)).ok, true, `suggestion ${i + 1} sur le lieu ${lieuId}`);
  }
}
egal(await servicesPro.modifierFichePro(MAX, LIEUX_SUGGESTIONS[3]!, proposer(LIEUX_SUGGESTIONS[3]!, "Nom 1"), T), { ok: false, erreur: "trop-de-suggestions" },
  "11e suggestion en 24 h : refusée");

const client = await espionner(() => creerSuggestionLieu(LEA, { lieuId: AUTRE, proposition: { nom: "La Cantine" }, avant: { nom: "Avant" }, message: null }, T));
egal(client.resultat.ok, true, "suggestion d'un client acceptée");
egal(client.requetes, ["BEGIN", VERROU_COMPTE, "compter suggestions_lieux", "compter suggestions_lieux", "inserer suggestions_lieux", "COMMIT"],
  "suggestion d'un client : le compte verrouillé avant de compter");
egal(client.verrous, [`comptes ${LEA} : par moi, exclusif, sans la clé`], "suggestion d'un client : FOR NO KEY UPDATE sur le compte");
for (let i = 0; i < 2; i++) await creerSuggestionLieu(LEA, { lieuId: AUTRE, proposition: { nom: `Cantine ${i}` }, avant: { nom: "Avant" }, message: null }, T);
egal(await creerSuggestionLieu(LEA, { lieuId: AUTRE, proposition: { nom: "Cantine 3" }, avant: { nom: "Avant" }, message: null }, T),
  { ok: false, erreur: "trop-de-suggestions" }, "4e suggestion en attente du client sur le lieu : refusée");

await terminerEssai(import.meta.url, essai, verifications.nombre);
