import type { ReactNode } from "react";

import { INFOS_OUI_NON, LIBELLES_ANIMAUX, LIBELLES_PAIEMENT, LIBELLES_RESERVATION } from "~/contenus/infos-pratiques";
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
  const lignes: { cle: string; emoji: string; contenu: ReactNode }[] = [];
  if (infos.telephone) {
    const numero = infos.telephone.replace(/[^\d+]/g, "");
    lignes.push({ cle: "telephone", emoji: "📞", contenu: <a href={`tel:${numero}`} className={classeLien}>{`Appeler le ${infos.telephone}`}</a> });
  }
  if (infos.siteWeb) {
    const affiche = infos.siteWeb.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
    lignes.push({ cle: "site", emoji: "🌐", contenu: <a href={infos.siteWeb} rel="noopener nofollow" className={`${classeLien} [overflow-wrap:anywhere]`}>{affiche}</a> });
  }
  if (infos.instagram) {
    lignes.push({ cle: "instagram", emoji: "📸", contenu: <a href={`https://www.instagram.com/${infos.instagram}/`} rel="noopener nofollow" className={classeLien}>{`@${infos.instagram}`}</a> });
  }
  if (infos.reservation) lignes.push({ cle: "reservation", emoji: "📅", contenu: LIBELLES_RESERVATION[infos.reservation] });
  if (infos.animaux) lignes.push({ cle: "animaux", emoji: LIBELLES_ANIMAUX[infos.animaux].emoji, contenu: LIBELLES_ANIMAUX[infos.animaux].texte });
  for (const info of INFOS_OUI_NON) {
    const valeur = infos[info.champ];
    if (valeur !== null && valeur !== undefined) lignes.push({ cle: info.champ, emoji: valeur ? info.emoji : "✗", contenu: valeur ? info.oui : info.non });
  }
  if (infos.paiements.length > 0) {
    const liste = infos.paiements.map((code) => LIBELLES_PAIEMENT[code]).join(", ");
    lignes.push({ cle: "paiements", emoji: "💳", contenu: `Paiement : ${liste}` });
  }
  if (lignes.length === 0) return null;

  const Titre = niveau === 2 ? "h2" : "h3";
  return (
    <section aria-labelledby="infos-pratiques" className="rounded-carte border-2 border-encre bg-white p-5 shadow-brut md:p-6">
      <Titre id="infos-pratiques" className="text-xl font-extrabold">Infos pratiques</Titre>
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
