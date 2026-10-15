/** La forme des pseudos neutres que l'équipe donne à un profil retenu par la modération : « miami » et 4 à 6 chiffres */
const FORME_PSEUDO_NEUTRE = /^miami\d{4,6}$/;

/** Vrai si le pseudo a la forme d'un pseudo neutre de la modération (quelqu'un peut aussi l'avoir choisi : ce n'est qu'un indice) */
export function estPseudoNeutre(pseudo: string | null | undefined): boolean {
  return typeof pseudo === "string" && FORME_PSEUDO_NEUTRE.test(pseudo);
}
