import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import { CLASSE_BLOC, CLASSE_TITRE_BLOC } from "~/composants/lieux/classes-fiche-lieu";
import { IconeFiche, type NomIcone } from "~/composants/lieux/IconeFiche";
import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/fiche-lieu";
import { TEXTES_INFOS_PRATIQUES_PAR_LANGUE, type ChampOuiNon, type TEXTES_INFOS_PRATIQUES } from "~/contenus/infos-pratiques";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { InfosPratiquesLieu } from "~/types/pro";

type Info = { cle: string; icone: NomIcone; texte: string; oui: boolean };

type TextesInfos = Traduction<typeof TEXTES_INFOS_PRATIQUES>;

const ICONES_OUI_NON: Record<ChampOuiNon, NomIcone> = {
  accessible: "accessible",
  terrasse: "terrasse",
  wifi: "wifi",
  enfants: "enfants",
  parking: "parking",
};

function listerInfos(infos: InfosPratiquesLieu, T: TextesInfos, paiement: (liste: string) => string): Info[] {
  const liste: Info[] = [];
  for (const champ of Object.keys(ICONES_OUI_NON) as ChampOuiNon[]) {
    const valeur = infos[champ];
    if (valeur === true || valeur === false) liste.push({ cle: champ, icone: valeur ? ICONES_OUI_NON[champ] : "non", texte: valeur ? T.ouiNon[champ].oui : T.ouiNon[champ].non, oui: valeur });
  }
  if (infos.animaux) liste.push({ cle: "animaux", icone: infos.animaux === "non" ? "non" : "animaux", texte: T.animaux[infos.animaux], oui: infos.animaux !== "non" });
  if (infos.paiements.length > 0) {
    const moyens = infos.paiements.map((code) => T.paiement[code]).join(", ");
    liste.push({ cle: "paiements", icone: "paiement", texte: paiement(moyens), oui: true });
  }
  if (infos.reservation) liste.push({ cle: "reservation", icone: "reserver", texte: T.reservation[infos.reservation], oui: true });
  return liste;
}

export function BlocBonASavoir({ infos }: { infos: InfosPratiquesLieu }) {
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE).bonASavoir;
  const liste = listerInfos(infos, utiliserTextes(TEXTES_INFOS_PRATIQUES_PAR_LANGUE), T.paiement);
  if (liste.length === 0) return null;
  return (
    <section aria-labelledby="fiche-bon-a-savoir" className={`flex flex-col gap-4 ${CLASSE_BLOC}`}>
      <h2 id="fiche-bon-a-savoir" className={CLASSE_TITRE_BLOC}>{T.titre}</h2>
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
