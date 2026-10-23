import "../socle/garde-fou.ts";
import { listerLieuxDuPlan, lireFichePublique } from "../../src/services/lieux-publics.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);
const verifications = creerVerifications();
const { egal } = verifications;

const gerant = await inserer("comptes", { email: "gerant@exemple.fr", prenom: "Gérant" });
const lieu = (nom: string, note: string | null, statut = "publie") =>
  inserer("lieux", { nom, type: "resto", ville: "Marseille", statut, note });

const importe = await lieu("Importé", "(fiche 4521) https://www.marseille-tourisme.com/fr/offres/x Prix ESTIMÉ");
const importeVerifie = await lieu("Importé puis vérifié", "(fiche 77) https://data.datatourisme.fr/13/abc");
const propre = await lieu("Proposé par un ambassadeur", "Proposé par Marie");
const sansNote = await lieu("Sans note", null);
const brouillon = await lieu("Brouillon", "(fiche 9) https://www.lilletourism.com/x", "brouillon");
const enAttente = await lieu("Rattachement en attente", "(fiche 10) https://www.visiterlyon.com/x");
await inserer("rattachements_lieux", { lieu_id: importeVerifie, compte_id: gerant, role: "gerant", preuve: "Kbis", statut: "valide" });
await inserer("rattachements_lieux", { lieu_id: enAttente, compte_id: gerant, role: "gerant", preuve: "Kbis", statut: "en-attente" });

const plan = await listerLieuxDuPlan();
egal(plan.map(({ id, indexable }) => [id, indexable]), [[importe, false], [importeVerifie, true], [propre, true], [sansNote, true], [enAttente, false]], "plan : le brouillon n'y est pas ; importé non vérifié et rattachement en attente : pas indexables");
egal(plan.every(({ modifieLe }) => modifieLe instanceof Date), true, "plan : modifieLe reste une date");

const fiche = await lireFichePublique(importe);
egal(fiche?.source, { nom: "l'office de tourisme de Marseille", site: "marseille-tourisme.com", adresse: "https://www.marseille-tourisme.com", licence: null }, "fiche importée : la source, jamais la note");
egal(fiche !== null && "note" in fiche, false, "fiche importée : pas de note");
egal(fiche?.estVerifie, false, "fiche importée : non vérifiée");
const ficheVerifiee = await lireFichePublique(importeVerifie);
egal([ficheVerifiee?.estVerifie, ficheVerifiee?.source?.nom, ficheVerifiee?.source?.licence?.nom], [true, "DATAtourisme", "Licence Ouverte 2.0"], "fiche DATAtourisme vérifiée : source et licence");
egal((await lireFichePublique(propre))?.source, null, "fiche sans adresse de source : null");
egal((await lireFichePublique(sansNote))?.source, null, "fiche sans note : null");
egal(await lireFichePublique(brouillon), null, "brouillon : pas de fiche");

await terminerEssai(import.meta.url, essai, verifications.nombre);
