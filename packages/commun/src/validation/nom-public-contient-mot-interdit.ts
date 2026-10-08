import { EXPRESSIONS_INTERDITES, EXPRESSIONS_INTERDITES_NOM_PUBLIC } from "../regles/mots-interdits";
import { construireMotifExpressions } from "./construire-motif-expressions";
import { contientMorceauInterdit } from "./contient-morceau-interdit";
import { contientMotInterdit } from "./contient-mot-interdit";
import { preparerFormesFiltre } from "./preparer-formes-filtre";
import { simplifierTexteFiltre } from "./simplifier-texte-filtre";

const MOTIF_INTERDIT_NOM_PUBLIC = construireMotifExpressions(EXPRESSIONS_INTERDITES_NOM_PUBLIC);
// Chaque expression interdite écrite d'un bloc (« pu.te » et « p_d42 » se lisent « pute » et « pd »)
const EXPRESSIONS_D_UN_BLOC = new Set(
  [...EXPRESSIONS_INTERDITES, ...EXPRESSIONS_INTERDITES_NOM_PUBLIC].map((expression) =>
    simplifierTexteFiltre(expression).replace(/[^a-z0-9]/g, ""),
  ),
);

/**
 * Vrai si un nom montré à tout le monde (pseudo, prénom) contient un mot interdit. Comme contientMotInterdit (« pute69 »,
 * « c0nn4rd », « c.o.n.n.a.r.d »), plus les mots refusés seulement dans un nom (« con42 », « Hitler »), et le nom lu d'un
 * bloc, sans ses points, tirets bas, espaces ni chiffres (« fils.depute », « pu.te »). Les mots courts (« pute », « pd »)
 * ne sont pas cherchés au milieu d'un mot : « computer », « update » et « Constance » passent.
 * À part de estPseudoValide et estProfilValide, qui servent aussi à relire un profil enregistré : un mot ajouté plus tard
 * à la liste ne doit pas rendre un profil illisible. On vérifie donc au moment où le nom est choisi ou changé.
 */
export function nomPublicContientMotInterdit(nom: string): boolean {
  if (contientMotInterdit(nom)) return true;
  return preparerFormesFiltre(nom).some((forme) => {
    const dUnBloc = forme.replace(/[^a-z]/g, "");
    return MOTIF_INTERDIT_NOM_PUBLIC.test(forme) || EXPRESSIONS_D_UN_BLOC.has(dUnBloc) || contientMorceauInterdit(dUnBloc);
  });
}
