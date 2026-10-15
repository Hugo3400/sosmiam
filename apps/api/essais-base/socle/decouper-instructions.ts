// Un fichier SQL découpé en instructions, comme PostgreSQL le lit : un « ; » ne coupe ni dans un texte ('…', E'…'), ni dans
// un nom entre guillemets ("…"), ni dans un bloc $$…$$ (ou $balise$…$balise$, le corps d'une fonction), ni dans un
// commentaire (-- … ou /* … */, imbriqués). Sert à nommer l'instruction fautive quand PostgreSQL ne donne pas de position.

export type Instruction = {
  /** Le texte de l'instruction, sans le « ; » final ni les blancs autour */
  texte: string;
  /** Sa place dans le fichier (indice du premier caractère utile, commentaires de tête sautés) */
  debut: number;
  /** Sa ligne dans le fichier (1 pour la première) */
  ligne: number;
};

const CARACTERE_DE_NOM = /[A-Za-z0-9_$\u0080-￿]/;

/** Fin (exclue) du morceau qui commence en i : texte, nom, bloc $…$ ou commentaire ; i + 1 pour un caractère ordinaire */
function sauterMorceau(sql: string, i: number): number {
  const c = sql[i]!;
  const suivant = sql[i + 1];
  if (c === "-" && suivant === "-") {
    const fin = sql.indexOf("\n", i);
    return fin === -1 ? sql.length : fin + 1;
  }
  if (c === "/" && suivant === "*") {
    let profondeur = 1;
    let j = i + 2;
    while (j < sql.length && profondeur > 0) {
      const marque = sql.slice(j, j + 2);
      if (marque === "/*" || marque === "*/") {
        profondeur += marque === "/*" ? 1 : -1;
        j += 2;
      } else {
        j++;
      }
    }
    return j;
  }
  if (c === "'" || c === '"') {
    // E'…' : la barre oblique protège le caractère suivant
    const echappe = c === "'" && /[eE]/.test(sql[i - 1] ?? "") && !CARACTERE_DE_NOM.test(sql[i - 2] ?? "");
    let j = i + 1;
    while (j < sql.length) {
      if (echappe && sql[j] === "\\") j += 2;
      else if (sql[j] === c && sql[j + 1] === c) j += 2;
      else if (sql[j] === c) return j + 1;
      else j++;
    }
    return j;
  }
  if (c === "$" && !CARACTERE_DE_NOM.test(sql[i - 1] ?? "")) {
    // $$ ou $balise$ (pas $1, un paramètre)
    const balise = /^\$(?:[A-Za-z_\u0080-￿][A-Za-z0-9_\u0080-￿]*)?\$/.exec(sql.slice(i))?.[0];
    if (balise) {
      const fin = sql.indexOf(balise, i + balise.length);
      return fin === -1 ? sql.length : fin + balise.length;
    }
  }
  return i + 1;
}

const DEBUT_DE_MOT = /[A-Za-z_\u0080-\uffff]/;

function lireMot(sql: string, i: number): string | null {
  if (!DEBUT_DE_MOT.test(sql[i]!) || CARACTERE_DE_NOM.test(sql[i - 1] ?? "")) return null;
  let fin = i + 1;
  while (fin < sql.length && CARACTERE_DE_NOM.test(sql[fin]!)) fin++;
  return sql.slice(i, fin);
}

const CREE_UNE_ROUTINE = /^create (or replace )?(function|procedure)( |$)/;

function creerSuiviDesBlocs() {
  let premiersMots: string[] = [];
  let parentheses = 0;
  let blocs = 0;
  return {
    lireMot(mot: string): void {
      const minuscule = mot.toLowerCase();
      if (premiersMots.length < 4) premiersMots.push(minuscule);
      if (!CREE_UNE_ROUTINE.test(premiersMots.join(" ")) || parentheses > 0) return;
      if (minuscule === "begin" || (minuscule === "case" && blocs > 0)) blocs++;
      else if (minuscule === "end" && blocs > 0) blocs--;
    },
    lireSigne(signe: string): void {
      if (signe === "(") parentheses++;
      else if (signe === ")" && parentheses > 0) parentheses--;
    },
    horsDesBlocs: () => parentheses === 0 && blocs === 0,
    recommencer(): void {
      premiersMots = [];
      parentheses = 0;
      blocs = 0;
    },
  };
}

/** Les instructions du fichier, dans l'ordre ; celles qui ne sont que blancs et commentaires sont écartées */
export function decouperInstructions(sql: string): Instruction[] {
  const instructions: Instruction[] = [];
  let debut = 0;
  const finir = (fin: number) => {
    // Le premier caractère utile : blancs et commentaires de tête sautés
    let j = debut;
    while (j < fin) {
      if (/\s/.test(sql[j]!)) j++;
      else if (sql.startsWith("--", j) || sql.startsWith("/*", j)) j = sauterMorceau(sql, j);
      else break;
    }
    const texte = sql.slice(j, fin).trim();
    if (j < fin && texte !== "") instructions.push({ texte, debut: j, ligne: sql.slice(0, j).split("\n").length });
    debut = fin + 1;
  };
  const suivi = creerSuiviDesBlocs();
  for (let i = 0; i < sql.length;) {
    const mot = lireMot(sql, i);
    if (mot !== null) {
      suivi.lireMot(mot);
      i += mot.length;
    } else if (sql[i] === ";" && suivi.horsDesBlocs()) {
      finir(i);
      suivi.recommencer();
      i++;
    } else {
      suivi.lireSigne(sql[i]!);
      i = sauterMorceau(sql, i);
    }
  }
  finir(sql.length);
  return instructions;
}
