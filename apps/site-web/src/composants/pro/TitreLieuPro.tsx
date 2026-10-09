import type { ReactNode } from "react";

import { BadgeVerifie } from "~/composants/lieux/BadgeVerifie";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { FichePro } from "~/types/pro";

type Props = {
  lieu: Pick<FichePro, "id" | "nom" | "ville" | "statut" | "estVerifie">;
  /** Ce que montre la page : « Ma fiche », « Suggestions »… */
  page: string;
  chapo?: ReactNode;
};

const statuts = {
  brouillon: "Ta fiche n'est pas encore publiée : l'équipe SOS Miam la met en ligne bientôt. Tu peux déjà la préparer.",
  masque: "Ta fiche est masquée pour le moment : écris-nous à bonjour@sosmiam.fr si tu ne sais pas pourquoi.",
};

/**
 * Le haut des pages d'un lieu de l'espace pro : le badge Vérifié ✓, la page (h1) avec le nom du lieu, et ce qu'il faut
 * savoir si la fiche n'est pas publiée ; publiée, le lien vers la fiche publique.
 */
export function TitreLieuPro({ lieu, page, chapo }: Props) {
  return (
    <div className="mb-8">
      <BadgeVerifie verifie={lieu.estVerifie} />
      <h1 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-tight [overflow-wrap:anywhere]">
        {page}
        <span className="block text-[.55em] text-gris">{`${lieu.nom} · ${lieu.ville}`}</span>
      </h1>
      {chapo && <p className="mt-3 max-w-2xl text-lg text-gris">{chapo}</p>}
      {lieu.statut === "publie" ? (
        <p className="mt-3">
          <a href={`https://sosmiam.fr/lieux/${lieu.id}`} className="font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
            Voir ma fiche publique<span aria-hidden="true"> ↗</span>
          </a>
        </p>
      ) : (
        <p role="note" className="mt-4 rounded-2xl border-2 border-encre bg-jaune-clair px-5 py-3 font-semibold">{lierPonctuation(statuts[lieu.statut])}</p>
      )}
    </div>
  );
}
