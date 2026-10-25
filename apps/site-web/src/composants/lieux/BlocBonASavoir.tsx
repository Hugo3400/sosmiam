import { CLASSE_BLOC, CLASSE_TITRE_BLOC } from "~/composants/lieux/classes-fiche-lieu";
import { IconeFiche, type NomIcone } from "~/composants/lieux/IconeFiche";
import { TEXTES_FICHE_LIEU } from "~/contenus/fiche-lieu";
import { INFOS_OUI_NON, LIBELLES_ANIMAUX, LIBELLES_PAIEMENT, LIBELLES_RESERVATION } from "~/contenus/infos-pratiques";
import type { InfosPratiquesLieu } from "~/types/pro";

type Info = { cle: string; icone: NomIcone; texte: string; oui: boolean };

const ICONES_OUI_NON: Record<(typeof INFOS_OUI_NON)[number]["champ"], NomIcone> = {
  accessible: "accessible",
  terrasse: "terrasse",
  wifi: "wifi",
  enfants: "enfants",
  parking: "parking",
};

function listerInfos(infos: InfosPratiquesLieu): Info[] {
  const liste: Info[] = [];
  for (const info of INFOS_OUI_NON) {
    const valeur = infos[info.champ];
    if (valeur === true || valeur === false) liste.push({ cle: info.champ, icone: valeur ? ICONES_OUI_NON[info.champ] : "non", texte: valeur ? info.oui : info.non, oui: valeur });
  }
  if (infos.animaux) liste.push({ cle: "animaux", icone: infos.animaux === "non" ? "non" : "animaux", texte: LIBELLES_ANIMAUX[infos.animaux].texte, oui: infos.animaux !== "non" });
  if (infos.paiements.length > 0) {
    const moyens = infos.paiements.map((code) => LIBELLES_PAIEMENT[code]).join(", ");
    liste.push({ cle: "paiements", icone: "paiement", texte: TEXTES_FICHE_LIEU.bonASavoir.paiement(moyens), oui: true });
  }
  if (infos.reservation) liste.push({ cle: "reservation", icone: "reserver", texte: LIBELLES_RESERVATION[infos.reservation], oui: true });
  return liste;
}

export function BlocBonASavoir({ infos }: { infos: InfosPratiquesLieu }) {
  const liste = listerInfos(infos);
  if (liste.length === 0) return null;
  return (
    <section aria-labelledby="fiche-bon-a-savoir" className={`flex flex-col gap-4 ${CLASSE_BLOC}`}>
      <h2 id="fiche-bon-a-savoir" className={CLASSE_TITRE_BLOC}>{TEXTES_FICHE_LIEU.bonASavoir.titre}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {liste.map((info) => (
          <li key={info.cle} className="flex items-center gap-2.5 rounded-[14px] bg-creme px-3.5 py-3">
            <span className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border-2 ${info.oui ? "border-encre bg-jaune text-encre" : "border-gris bg-white text-gris"}`}>
              <IconeFiche nom={info.icone} className="h-[18px] w-[18px]" />
            </span>
            <span className={`text-[15px] font-semibold ${info.oui ? "" : "text-gris"}`}>{info.texte}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
