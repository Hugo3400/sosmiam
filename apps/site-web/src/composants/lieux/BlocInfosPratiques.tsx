import type { ReactNode } from "react";

import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/fiche-lieu";
import { EMOJIS_OUI_NON, LIBELLES_ANIMAUX, TEXTES_INFOS_PRATIQUES_PAR_LANGUE, type ChampOuiNon } from "~/contenus/infos-pratiques";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { InfosPratiquesLieu } from "~/types/pro";

type Props = {
  infos: InfosPratiquesLieu;
  /** Niveau du titre (h2 sur la fiche publique, h3 dans une section) */
  niveau?: 2 | 3;
};

const classeLien = "font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

/**
 * Bloc « Infos pratiques » d'une fiche : contact, animaux, accès, équipements, paiements, réservation. Une info inconnue
 * (null, liste vide) n'est jamais affichée : on ne devine pas. Rien de connu : le bloc entier disparaît.
 */
export function BlocInfosPratiques({ infos, niveau = 2 }: Props) {
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE);
  const I = utiliserTextes(TEXTES_INFOS_PRATIQUES_PAR_LANGUE);
  const lignes: { cle: string; emoji: string; contenu: ReactNode }[] = [];
  if (infos.telephone) {
    const numero = infos.telephone.replace(/[^\d+]/g, "");
    lignes.push({ cle: "telephone", emoji: "📞", contenu: <a href={`tel:${numero}`} className={classeLien}>{`${T.actions.appeler}${T.actions.appelerLe(infos.telephone)}`}</a> });
  }
  if (infos.siteWeb) {
    const affiche = infos.siteWeb.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
    lignes.push({ cle: "site", emoji: "🌐", contenu: <a href={infos.siteWeb} rel="noopener nofollow" className={`${classeLien} [overflow-wrap:anywhere]`}>{affiche}</a> });
  }
  if (infos.instagram) {
    lignes.push({ cle: "instagram", emoji: "📸", contenu: <a href={`https://www.instagram.com/${infos.instagram}/`} rel="noopener nofollow" className={classeLien}>{`@${infos.instagram}`}</a> });
  }
  if (infos.reservation) lignes.push({ cle: "reservation", emoji: "📅", contenu: I.reservation[infos.reservation] });
  if (infos.animaux) lignes.push({ cle: "animaux", emoji: LIBELLES_ANIMAUX[infos.animaux].emoji, contenu: I.animaux[infos.animaux] });
  for (const champ of Object.keys(EMOJIS_OUI_NON) as ChampOuiNon[]) {
    const valeur = infos[champ];
    if (valeur !== null && valeur !== undefined) lignes.push({ cle: champ, emoji: valeur ? EMOJIS_OUI_NON[champ] : "✗", contenu: valeur ? I.ouiNon[champ].oui : I.ouiNon[champ].non });
  }
  if (infos.paiements.length > 0) {
    const liste = infos.paiements.map((code) => I.paiement[code]).join(", ");
    lignes.push({ cle: "paiements", emoji: "💳", contenu: T.bonASavoir.paiement(liste) });
  }
  if (lignes.length === 0) return null;

  const Titre = niveau === 2 ? "h2" : "h3";
  return (
    <section aria-labelledby="infos-pratiques" className="rounded-carte border-2 border-encre bg-white p-5 shadow-brut md:p-6">
      <Titre id="infos-pratiques" className="text-xl font-extrabold">{T.infosPratiques}</Titre>
      <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {lignes.map((ligne) => (
          <li key={ligne.cle} className="flex items-start gap-2.5">
            <span aria-hidden="true" className="w-6 shrink-0 text-center">{ligne.emoji}</span>
            <span className="min-w-0">{ligne.contenu}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
