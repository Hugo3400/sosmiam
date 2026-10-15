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
  for (let i = 0; i < sql.length;) {
    if (sql[i] === ";") {
      finir(i);
      i++;
    } else {
      i = sauterMorceau(sql, i);
    }
  }
  finir(sql.length);
  return instructions;
}
