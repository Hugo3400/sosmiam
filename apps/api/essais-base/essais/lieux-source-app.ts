import "../socle/garde-fou.ts";
import { creerLieuxApp } from "../../src/services/lieux-app.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);
const verifications = creerVerifications();
const { egal } = verifications;
const maintenant = new Date("2026-10-23T10:00:00Z");

const lieu = (nom: string, note: string | null, texte: string) => inserer("lieux", { nom, type: "resto", ville: "Marseille", statut: "publie", note, texte });
const marseille = await lieu("Importé de Marseille", "(fiche 4521) https://www.marseille-tourisme.com/fr/offres/x Prix ESTIMÉ, à revoir", "Une cuisine du marché.");
const data = await lieu("Importé de DATAtourisme", "(fiche 77) https://data.datatourisme.fr/13/abc", "Un bistrot de quartier.");
const maison = await lieu("Proposé par un ambassadeur", "Proposé par Marie, rappeler lundi", "Le meilleur kebab du coin.");

const lieux = creerLieuxApp();
const lus = new Map((await lieux.listerLieux(null, maintenant)).map((l) => [l.id, l]));
egal(lus.get(marseille)?.texte, "Une cuisine du marché.\n\n📚 Texte et infos : l'office de tourisme de Marseille (marseille-tourisme.com).", "la source citée à la fin du texte, que toute version de l'app montre");
egal(lus.get(data)?.texte, "Un bistrot de quartier.\n\n📚 Texte et infos : DATAtourisme (datatourisme.fr), sous Licence Ouverte 2.0.", "avec la licence de DATAtourisme");
egal(lus.get(maison)?.texte, "Le meilleur kebab du coin.", "sans source connue : le texte tel quel");
egal([lus.get(marseille)?.source?.nom, lus.get(data)?.source?.licence?.nom, "source" in lus.get(maison)!], ["l'office de tourisme de Marseille", "Licence Ouverte 2.0", false], "la source aussi en champ, pour la 1.0.2");
egal((await lieux.lireLieu(marseille, maintenant))?.texte, lus.get(marseille)?.texte, "une fiche seule : pareil");
const tout = JSON.stringify([...lus.values()]);
egal(["fiche 4521", "Prix ESTIMÉ", "rappeler lundi", "Proposé par Marie", "\"note\""].filter((bout) => tout.includes(bout)), [], "jamais rien de la note interne");

await terminerEssai(import.meta.url, essai, verifications.nombre);
