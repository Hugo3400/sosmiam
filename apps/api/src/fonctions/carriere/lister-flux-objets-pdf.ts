import { decoderNomPdf } from "./decoder-nom-pdf.ts";

export type FluxObjetsPdf = { debut: number; compresse: boolean };

type Jeton = { sorte: "nom" | "ouvre-tableau" | "ferme-tableau" | "autre"; valeur: string };
type Dictionnaire = { jetons: Jeton[] | null; fin: number };

const BLANCS = new Set(["\x00", "\t", "\n", "\f", "\r", " "]);
const DELIMITEURS = new Set(["(", ")", "<", ">", "[", "]", "{", "}", "/", "%"]);
const MOT_OBJ = /(?<=[\x00\t\n\f\r ()<>[\]{}\/%])obj(?=[\x00\t\n\f\r ()<>[\]{}\/%])/g;
const CLES_D_UN_FLUX_D_OBJETS = ["ObjStm", "N", "First"];
const CLES_ILLISIBLES = ["DecodeParms", "DP", "F", "FFilter", "FDecodeParms"];
const FILTRES_LISIBLES: ReadonlySet<string> = new Set(["FlateDecode", "Fl"]);
const AUTRE: Jeton = { sorte: "autre", valeur: "" };

const estRegulier = (c: string) => !BLANCS.has(c) && !DELIMITEURS.has(c);

function sauterBlancs(t: string, i: number, borne: number): number {
  while (i < borne) {
    if (BLANCS.has(t[i]!)) i++;
    else if (t[i] === "%") while (i < borne && t[i] !== "\r" && t[i] !== "\n") i++;
    else return i;
  }
  return i;
}

function sauterFinDeLigne(t: string, i: number): number {
  while (i < t.length && t[i] !== "\r" && t[i] !== "\n") i++;
  return t.startsWith("\r\n", i) ? i + 2 : Math.min(i + 1, t.length);
}

function finDeChaine(t: string, i: number, borne: number): number {
  let profondeur = 0;
  for (; i < borne; i++) {
    if (t[i] === "\\") i++;
    else if (t[i] === "(") profondeur++;
    else if (t[i] === ")" && --profondeur === 0) return i + 1;
  }
  return -1;
}

function finDeChaineHexa(t: string, i: number, borne: number): number {
  for (i++; i < borne; i++) if (t[i] === ">") return i + 1;
  return -1;
}

function finDeMot(t: string, i: number, borne: number): number {
  while (i < borne && estRegulier(t[i]!)) i++;
  return i;
}

function lireDictionnaire(t: string, debut: number, borne: number): Dictionnaire {
  const jetons: Jeton[] = [];
  let profondeur = 0;
  for (let i = debut; i < borne; i = sauterBlancs(t, i, borne)) {
    if (t.startsWith("<<", i)) {
      profondeur++;
      i += 2;
    } else if (t.startsWith(">>", i)) {
      i += 2;
      if (--profondeur === 0) return { jetons, fin: i };
    } else if (t[i] === "(" || t[i] === "<") {
      const fin = t[i] === "(" ? finDeChaine(t, i, borne) : finDeChaineHexa(t, i, borne);
      if (fin < 0) return { jetons: null, fin: borne };
      jetons.push(AUTRE);
      i = fin;
    } else if (t[i] === "[" || t[i] === "]") {
      jetons.push({ sorte: t[i] === "[" ? "ouvre-tableau" : "ferme-tableau", valeur: t[i]! });
      i++;
    } else if (t[i] === "/") {
      const fin = finDeMot(t, i + 1, borne);
      jetons.push({ sorte: "nom", valeur: decoderNomPdf(t.slice(i + 1, fin)) });
      i = fin;
    } else if (estRegulier(t[i]!)) {
      jetons.push(AUTRE);
      i = finDeMot(t, i, borne);
    } else {
      jetons.push(AUTRE);
      i++;
    }
  }
  return { jetons: null, fin: borne };
}

function lireFiltres(jetons: readonly Jeton[], i: number): string[] | null {
  const valeur = jetons[i + 1];
  if (valeur?.sorte === "nom") return [valeur.valeur];
  if (valeur?.sorte !== "ouvre-tableau") return null;
  const filtres: string[] = [];
  for (const jeton of jetons.slice(i + 2)) {
    if (jeton.sorte === "ferme-tableau") return filtres;
    if (jeton.sorte !== "nom") return null;
    filtres.push(jeton.valeur);
  }
  return null;
}

function lireFluxObjets(jetons: readonly Jeton[]): { compresse: boolean } | "illisible" | null {
  const noms = new Set(jetons.filter((j) => j.sorte === "nom").map((j) => j.valeur));
  if (!CLES_D_UN_FLUX_D_OBJETS.some((cle) => noms.has(cle))) return null;
  if (CLES_ILLISIBLES.some((cle) => noms.has(cle))) return "illisible";
  let compresse = false;
  for (let i = 0; i < jetons.length; i++) {
    if (jetons[i]!.sorte !== "nom" || jetons[i]!.valeur !== "Filter") continue;
    const filtres = lireFiltres(jetons, i);
    if (filtres === null || filtres.length > 1 || !filtres.every((f) => FILTRES_LISIBLES.has(f))) return "illisible";
    compresse ||= filtres.length === 1;
  }
  return { compresse };
}

export function listerFluxObjetsPdf(t: string): FluxObjetsPdf[] | null {
  const flux: FluxObjetsPdf[] = [];
  let budget = 4 * t.length + 65_536;
  const borner = (de: number) => Math.min(t.length, de + Math.max(budget, 0));
  for (const trouve of t.matchAll(MOT_OBJ)) {
    if (budget <= 0) return null;
    const depart = trouve.index + 3;
    const debutDico = sauterBlancs(t, depart, borner(depart));
    budget -= debutDico - depart;
    if (!t.startsWith("<<", debutDico) || budget <= 0) continue;
    const dico = lireDictionnaire(t, debutDico, borner(debutDico));
    budget -= dico.fin - debutDico;
    if (dico.jetons === null) continue;
    const apres = sauterBlancs(t, dico.fin, borner(dico.fin));
    budget -= apres - dico.fin;
    if (!t.startsWith("stream", apres) || (apres + 6 < t.length && estRegulier(t[apres + 6]!))) continue;
    const lu = lireFluxObjets(dico.jetons);
    if (lu === "illisible") return null;
    if (lu !== null) flux.push({ debut: sauterFinDeLigne(t, apres + 6), compresse: lu.compresse });
  }
  return budget > 0 ? flux : null;
}
