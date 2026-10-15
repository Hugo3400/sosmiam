import "../socle/garde-fou.ts";
import { creerCloche } from "../../src/services/cloche.ts";
import { creerRelationsSociales } from "../../src/services/relations-sociales.ts";
import { lirePoulsSocial } from "../../src/services/social-pouls.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { base } = essai;
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);
const verifications = creerVerifications();
const { egal, vrai } = verifications;
const cloche = creerCloche(creerRelationsSociales(base), base);

const T = new Date("2026-10-14T10:00:00Z");
const heure = (h: number) => new Date(T.getTime() + h * 3600_000);

let numero = 0;
async function creerCompte(avecProfil = true): Promise<number> {
  numero += 1;
  const id = await inserer("comptes", { email: `cloche${numero}@exemple.fr`, prenom: `Miami${numero}`, pseudo: `cloche.${numero}` });
  if (avecProfil) await inserer("profils_sociaux", { compte_id: id, id_public: `clo${String(numero).padStart(7, "a")}` });
  return id;
}
const moi = await creerCompte();
const autre = await creerCompte();
const lea = await creerCompte();
const bloque = await creerCompte();
const sansProfil = await creerCompte(false);

const lignes = async (compteId: number) =>
  (await base.notificationCloche.findMany({ where: { compteId }, orderBy: { id: "asc" }, select: { id: true, type: true, acteurId: true, creeLe: true } }))
    .map((l) => ({ ...l, creeLe: l.creeLe.toISOString() }));

await cloche.noter([
  { compteId: moi, type: "nouvel-abonne", acteurId: lea },
  { compteId: moi, type: "nouvel-abonne", acteurId: bloque },
  { compteId: autre, type: "nouvel-abonne", acteurId: lea },
], heure(0));
await cloche.noter([{ compteId: moi, type: "signalement-decide", acteurId: null, cible: { type: "signalement", id: "31" }, detail: "retenu" }], heure(1));
await cloche.noter([{ compteId: moi, type: "liste-coauteur", acteurId: lea, cible: { type: "liste", id: "5" } }], heure(2));
await inserer("blocages", { bloqueur_id: moi, bloque_id: bloque });
const [deAutre] = await lignes(autre);
const deBloque = (await lignes(moi)).find((l) => l.acteurId === bloque)!;

egal(await cloche.effacerLues(moi, null, heure(3)), 0, "profil sans vuesLe : rien n'est lu");
egal(await cloche.effacerLues(moi, heure(48), heure(3)), 0, "ni avec une date du téléphone");
egal((await cloche.marquerVu(moi, heure(1), heure(3))).toISOString(), heure(1).toISOString());
egal(await cloche.effacerLues(moi, heure(0), heure(3)), 1, "jusqua resserre : celle de Léa seulement, jamais celle d'un bloqué");
egal(await cloche.effacerLues(moi, heure(48), heure(3)), 1, "jusqu'à vuesLe compris, rien de plus récent");
egal((await lignes(moi)).map((l) => [l.acteurId, l.creeLe]), [[bloque, heure(0).toISOString()], [lea, heure(2).toISOString()]]);
egal((await lignes(autre)).length, 1, "jamais la cloche d'un autre");
egal((await lirePoulsSocial(base, moi, heure(3))).cloche.nonVues, 1, "le pouls compte encore la non-vue");

const listee = (await lignes(moi)).find((l) => l.type === "liste-coauteur")!;
egal(await cloche.effacer(moi, deAutre!.id), false, "celle d'un autre");
egal(await cloche.effacer(moi, deBloque.id), false, "celle d'une personne bloquée");
egal(await cloche.effacer(moi, 999_999), false, "inconnue");
egal(await cloche.effacer(moi, listee.id), true);
egal(await cloche.effacer(moi, listee.id), false, "déjà effacée");
const pouls = await lirePoulsSocial(base, moi, heure(3));
egal([pouls.cloche.nonVues, pouls.cloche.signature], [0, "0:0:"], "le bloqué ne compte pas, la non-vue effacée non plus");
egal((await lignes(autre)).length, 1);

await cloche.noter([{ compteId: moi, type: "liste-coauteur", acteurId: lea, cible: { type: "liste", id: "5" } }], heure(4));
const neuve = (await lignes(moi)).filter((l) => l.type === "liste-coauteur");
egal(neuve.length, 1, "après effacement, une seule ligne neuve");
vrai(neuve[0]!.id > listee.id);
await cloche.noter([{ compteId: moi, type: "liste-coauteur", acteurId: lea, cible: { type: "liste", id: "5" } }], heure(5));
egal((await lignes(moi)).filter((l) => l.type === "liste-coauteur").map((l) => [l.id, l.creeLe]), [[neuve[0]!.id, heure(5).toISOString()]], "puis remontée, jamais en double");

const decision = (id: string, quand: Date) =>
  cloche.noter([{ compteId: sansProfil, type: "signalement-decide", acteurId: null, cible: { type: "signalement", id }, detail: "rejete" }], quand);
await decision("41", heure(0));
await decision("42", heure(1));
egal(await cloche.effacerLues(sansProfil, null, heure(2)), 0, "sans profil ni date du téléphone : rien");
egal(await cloche.effacerLues(sansProfil, heure(0), heure(2)), 1);
egal(await cloche.effacerLues(sansProfil, heure(48), new Date(heure(1).getTime() - 1)), 0, "jamais plus récent que maintenant");
egal(await cloche.effacerLues(sansProfil, heure(48), heure(2)), 1);
egal(await lignes(sansProfil), []);
egal(await base.profilSocial.count({ where: { compteId: sansProfil } }), 0, "aucun profil social créé");

await terminerEssai(import.meta.url, essai, verifications.nombre);
