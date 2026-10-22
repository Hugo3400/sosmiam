import "../socle/garde-fou.ts";
import { creerAvisRelecture } from "../../src/services/avis-relecture.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { preparerEssaiAvis } from "../preparations/preparer-essai-avis.ts";
import { terminerEssai } from "../socle/verifications.ts";

const { essai, verifications, egal, sql, horloge, AUTEUR, depot, ecrireAvis } = await preparerEssaiAvis();
const relecture = creerAvisRelecture({ depot, chiffrement: null, tirer: () => 7, horloge });
const ambassadeurs = await Promise.all(["hugo", "sam", "nora", "yanis", "lina"].map((nom) => insererLigne(essai.db, "comptes", { email: `${nom}@exemple.fr`, prenom: nom, points: 0, palier: "curieux" })));
const avisId = await ecrireAvis(AUTEUR);

egal(await relecture.relire(ambassadeurs[0]!, avisId, { type: "deporte" }), { ok: true }, "se déporter");
for (const i of [1, 2, 3]) egal(await relecture.relire(ambassadeurs[i]!, avisId, { type: "louche", motif: "faux-avis" }), { ok: true }, `verdict ${i}`);
egal((await relecture.relire(ambassadeurs[4]!, avisId, { type: "ok" })).ok, false, "un 4e verdict « ok » ou « louche » est refusé");
egal((await relecture.listerARelire(ambassadeurs[4]!)).avis.length, 0, "et l'avis a quitté sa liste");
egal((await sql<{ n: number }>(`SELECT count(*)::int AS n FROM relectures_avis WHERE avis_id = $1`, avisId))[0]!.n, 4);

const verrou = await depot.ecrire(async (t) => {
  await t.verrouillerAvis(avisId);
  const [l] = await t.brut!.$queryRawUnsafe<{ parMoi: boolean; seul: boolean; exclusif: boolean; cle: boolean }[]>(`SELECT h.t_xmax::text = pg_current_xact_id_if_assigned()::text AS "parMoi",
      (h.t_infomask & 128) <> 0 AS seul, (h.t_infomask & 64) <> 0 AS exclusif, (h.t_infomask2 & 8192) <> 0 AS cle
    FROM avis a, heap_page_items(get_raw_page('avis', (a.ctid::text::point)[0]::int)) h
    WHERE a.id = $1 AND h.lp = (a.ctid::text::point)[1]::int`, avisId);
  return l;
});
egal(verrou, { parMoi: true, seul: true, exclusif: true, cle: false }, "la ligne de l'avis en FOR NO KEY UPDATE pendant la relecture");

const deuxieme = await ecrireAvis(AUTEUR);
await insererLigne(essai.db, "membres_bandes", { compte_id: ambassadeurs[4]!, pote_id: AUTEUR });
const idsDe = async (ambassadeur: number) => (await relecture.listerARelire(ambassadeur)).avis.map((a) => a.id);
egal((await idsDe(ambassadeurs[4]!)).includes(deuxieme), false, "jamais l'avis d'un pote de sa bande");
egal((await relecture.relire(ambassadeurs[4]!, deuxieme, { type: "ok" })).ok, false, "ni par son adresse directe");
egal((await idsDe(ambassadeurs[3]!)).includes(deuxieme), true, "un ambassadeur qui n'est pas son pote le relit");

await terminerEssai(import.meta.url, essai, verifications.nombre);
