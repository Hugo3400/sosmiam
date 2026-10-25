import { Bouton } from "~/composants/interface/Bouton";
import { CLASSE_TITRE_COTE } from "~/composants/lieux/classes-fiche-lieu";
import { LienSignalerInfo } from "~/composants/lieux/LienSignalerInfo";
import { TEXTES_FICHE_LIEU } from "~/contenus/fiche-lieu";
import { HOTE_PRO } from "~/fonctions/hotes/choisir-redirection-hote";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { FichePublique } from "~/types/pro";

type Props = { lieu: Pick<FichePublique, "id" | "nom" | "type" | "estVerifie">; adresseFiche: string };

/** « Ce lieu est à toi ? » au bas d'une fiche publique : vers la demande de rattachement de l'espace pro. */
export function EncartCeLieuEstAToi({ lieu, adresseFiche }: Props) {
  const T = TEXTES_FICHE_LIEU.tonLieu;
  return (
    <aside aria-labelledby="ce-lieu-est-a-toi" className="flex flex-col gap-2.5 rounded-carte border-2 border-encre bg-white p-5 md:px-[26px] md:py-6">
      <h2 id="ce-lieu-est-a-toi" className={CLASSE_TITRE_COTE}>{lierPonctuation(T.titre[lieu.type])}</h2>
      <p className="text-[15px] leading-relaxed">{lierPonctuation(lieu.estVerifie ? T.texteVerifie : T.texteNonVerifie)}</p>
      <Bouton href={`https://${HOTE_PRO}/rattacher/${lieu.id}`} petit className="mt-1 self-start">
        {lieu.estVerifie ? T.boutonVerifie : T.boutonNonVerifie}
      </Bouton>
      <div className="mt-1.5 flex">
        <LienSignalerInfo nom={lieu.nom} lieuId={lieu.id} adresseFiche={adresseFiche} />
      </div>
    </aside>
  );
}
