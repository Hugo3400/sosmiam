import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const dossierSrc = `${import.meta.dirname}/../src/`;
const racine = pathToFileURL(dossierSrc).href;
registerHooks({
  resolve(specificateur, contexte, suivant) {
    if (!specificateur.startsWith("~/")) return suivant(specificateur, contexte);
    const chemin = specificateur.slice(2);
    return suivant(`${racine}${chemin}${existsSync(`${dossierSrc}${chemin}.tsx`) ? ".tsx" : ".ts"}`, contexte);
  },
});

const { DOCUMENTS_LEGAUX, lireDocumentLegal } = await import("../src/services/documents-legaux.server.ts");
type Document = (typeof DOCUMENTS_LEGAUX)[keyof typeof DOCUMENTS_LEGAUX]["fr"];
type Bloc = Document["introduction"][number];

const MOIS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MOIS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function lireDate(texte: string, mois: string[]) {
  const morceaux = /^(\d{1,2})(?:er)? (\p{L}+) (\d{4})$/u.exec(texte.trim());
  assert.ok(morceaux, `date illisible : « ${texte} »`);
  const numero = mois.indexOf(morceaux[2]);
  assert.ok(numero >= 0, `mois inconnu : « ${texte} »`);
  return `${morceaux[3]}-${numero + 1}-${Number(morceaux[1])}`;
}

function formeDuBloc(bloc: Bloc): string {
  if (typeof bloc === "string") return "texte";
  if ("liste" in bloc) return `liste:${bloc.liste.length}${bloc.numerotee ? ":numerotee" : ""}`;
  return `tableau:${bloc.tableau.colonnes.length}x${bloc.tableau.lignes.length}`;
}

function textesDuBloc(bloc: Bloc): string[] {
  if (typeof bloc === "string") return [bloc];
  if ("liste" in bloc) return [...bloc.liste];
  return [bloc.tableau.legende, ...bloc.tableau.colonnes, ...bloc.tableau.lignes.flat()];
}

function comparerBlocs(francais: readonly Bloc[], anglais: readonly Bloc[], ou: string) {
  assert.deepEqual(anglais.map(formeDuBloc), francais.map(formeDuBloc), `${ou} : pas la même forme`);
  for (const texte of anglais.flatMap(textesDuBloc)) assert.ok(texte.trim().length > 0, `${ou} : texte vide`);
}

test("lireDocumentLegal : le français, et le français aussi tant qu'un document n'a pas sa traduction", () => {
  for (const nom of Object.keys(DOCUMENTS_LEGAUX) as (keyof typeof DOCUMENTS_LEGAUX)[]) {
    assert.deepEqual(lireDocumentLegal(nom, "fr"), { document: DOCUMENTS_LEGAUX[nom].fr, langue: "fr" });
    const anglais = lireDocumentLegal(nom, "en");
    assert.equal(anglais.langue, DOCUMENTS_LEGAUX[nom].en ? "en" : "fr", nom);
    assert.equal(anglais.document, DOCUMENTS_LEGAUX[nom].en ?? DOCUMENTS_LEGAUX[nom].fr, nom);
  }
});

test("documents légaux anglais : mêmes ancres, mêmes chapitres, mêmes blocs, même nombre de puces et même date que le français", () => {
  for (const [nom, { fr, en }] of Object.entries(DOCUMENTS_LEGAUX)) {
    if (!en) continue;
    assert.equal(lireDate(en.miseAJour, MOIS_EN), lireDate(fr.miseAJour, MOIS_FR), `${nom} : date`);
    for (const champ of ["titre", "description"] as const) {
      assert.ok(en[champ].trim().length > 0, `${nom} : ${champ} vide`);
      assert.notEqual(en[champ], fr[champ], `${nom} : ${champ} recopié du français`);
    }
    comparerBlocs(fr.introduction, en.introduction, `${nom} introduction`);
    comparerBlocs(fr.enBref, en.enBref, `${nom} en bref`);
    assert.deepEqual(en.sections.map((section) => section.id), fr.sections.map((section) => section.id), `${nom} : ancres des sections`);
    assert.deepEqual(en.chapitres.map(({ id, sections }) => ({ id, sections })), fr.chapitres.map(({ id, sections }) => ({ id, sections })), `${nom} : chapitres`);
    fr.sections.forEach((section, i) => {
      assert.ok(en.sections[i].titre.trim().length > 0, `${nom} #${section.id} : titre vide`);
      comparerBlocs(section.blocs, en.sections[i].blocs, `${nom} #${section.id}`);
    });
    for (const chapitre of en.chapitres) assert.ok(chapitre.titre.trim().length > 0, `${nom} : chapitre ${chapitre.id} sans titre`);
  }
});
