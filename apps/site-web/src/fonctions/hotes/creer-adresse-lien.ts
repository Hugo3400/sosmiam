// Adresse d'un lien du site, selon l'hôte qui l'affiche : sosmiam.fr, ambassadeur.sosmiam.fr ou pro.sosmiam.fr.
// Servie au pied de page (PiedDePage) et à l'en-tête de sosmiam.fr (EnTete, MenuMobile).
import { site } from "~/contenus/legal/informations-legales";
import type { SiteDuLien } from "~/contenus/liens-pied-de-page";
import { HOTE_AMBASSADEUR, HOTE_PRO } from "~/fonctions/hotes/choisir-redirection-hote";

/** Le site qui affiche le lien */
export type EspaceDuLien = Exclude<SiteDuLien, "externe">;

/**
 * Le chemin tel quel quand le lien vit sur le site qui l'affiche (« /faq » sur sosmiam.fr), l'adresse complète vers un
 * autre site (« /programme » de l'espace ambassadeur, vu de sosmiam.fr : https://ambassadeur.sosmiam.fr/programme), et
 * l'adresse telle quelle pour un réseau ou un mail (« externe »).
 */
export function creerAdresseLien(siteDuLien: SiteDuLien, adresse: string, espace: EspaceDuLien): string {
  if (siteDuLien === "externe" || siteDuLien === espace) return adresse;
  const hotes: Record<EspaceDuLien, string> = { principal: site.adresse, ambassadeur: HOTE_AMBASSADEUR, pro: HOTE_PRO };
  return `https://${hotes[siteDuLien]}${adresse}`;
}
