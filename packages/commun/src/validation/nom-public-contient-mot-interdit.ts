import { EXPRESSIONS_INTERDITES, EXPRESSIONS_INTERDITES_PSEUDO } from "../regles/mots-interdits";
import { construireMotifExpressions } from "./construire-motif-expressions";
import { contientMorceauInterdit } from "./contient-morceau-interdit";
import { contientMotInterdit } from "./contient-mot-interdit";
import { preparerFormesFiltre } from "./preparer-formes-filtre";
import { simplifierTexteFiltre } from "./simplifier-texte-filtre";

const MOTIF_INTERDIT_PSEUDO = construireMotifExpressions(EXPRESSIONS_INTERDITES_PSEUDO);
// Chaque expression interdite écrite d'un bloc (« pu.te » et « p_d42 » se lisent « pute » et « pd »)
const EXPRESSIONS_COLLEES = new Set(
  [...EXPRESSIONS_INTERDITES, ...EXPRESSIONS_INTERDITES_PSEUDO].map((expression) => simplifierTexteFiltre(expression).replace(/[^a-z0-9]/g, "")),
);

/**
 * Vrai si le pseudo contient un mot interdit : comme contientMotInterdit (« pute69 », « c0nn4rd », « c.o.n.n.a.r.d »),
 * plus les mots refusés seulement dans un pseudo (« con42 »), et le pseudo lu d'un bloc, sans ses points, tirets bas ni
 * chiffres (« fils.depute », « pu.te »). Les mots courts (« pute », « pd ») ne sont pas cherchés au milieu d'un mot :
 * « computer », « update » et « constance » passent. À part de estPseudoValide, qui sert aussi à relire un profil
 * enregistré : un mot ajouté à la liste ne doit pas rendre un profil illisible.
 */
export function pseudoContientMotInterdit(pseudo: string): boolean {
  if (contientMotInterdit(pseudo)) return true;
  return preparerFormesFiltre(pseudo).some((forme) => {
    const dUnBloc = forme.replace(/[^a-z]/g, "");
    return MOTIF_INTERDIT_PSEUDO.test(forme) || EXPRESSIONS_COLLEES.has(dUnBloc) || contientMorceauInterdit(dUnBloc);
  });
}
