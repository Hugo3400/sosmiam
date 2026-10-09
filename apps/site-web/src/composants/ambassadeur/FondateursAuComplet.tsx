import { useEffect, useRef } from "react";

import { Mascotte } from "~/composants/marque/Mascotte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { ZoneFondateurs } from "~/types/compte";

type Props = {
  zone: ZoneFondateurs;
  /** Id du champ de recherche de commune, pour en choisir une autre */
  idRecherche: string;
  /** Vrai juste après un envoi refusé faute de place : le formulaire vient de disparaître, le focus passe au titre */
  apresEnvoi?: boolean;
};

/**
 * Les places de fondateur de la zone choisie sont toutes prises : à la place de la présentation et du formulaire. La
 * candidature y rouvre toute seule quand une place se libère (pas de liste d'attente) ; on peut aussi choisir une autre
 * commune, si on s'est trompé.
 */
export function FondateursAuComplet({ zone, idRecherche, apresEnvoi = false }: Props) {
  const titre = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (apresEnvoi) titre.current?.focus();
  }, [apresEnvoi]);

  const ville = zone.type === "ville";
  return (
    <div className="rounded-carte border-2 border-encre bg-white px-6 py-10 text-center shadow-brut md:px-12">
      <Mascotte expression="surprise" className="mx-auto mb-5 h-24 w-24" />
      <h2 ref={titre} tabIndex={-1} className="text-3xl font-extrabold">
        {ville ? "Toutes les places de ta ville sont prises" : lierPonctuation(`La place ${zone.nomAvecDe} est prise`)}
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-lg">
        {lierPonctuation(`Merci d'avoir tenté ta chance ! La candidature ${zone.nomAvecDe} rouvrira dès qu'une place se libère : pas de liste d'attente, repasse de temps en temps. En attendant, tu restes ambassadeur et tu grimpes les niveaux, comme tout le monde.`)}
      </p>
      <p className="mx-auto mt-4 max-w-lg">
        {lierPonctuation("Tu t'es trompé de commune ? ")}
        {/* Avec JavaScript, le champ de recherche prend aussi le focus (un lien « # » vers un champ ne fait que défiler) */}
        <a
          href={`#${idRecherche}`}
          onClick={(evenement) => {
            const champ = document.getElementById(idRecherche);
            if (!champ) return;
            evenement.preventDefault();
            champ.scrollIntoView({ block: "center" });
            champ.focus({ preventScroll: true });
          }}
          className="font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
          Choisis-en une autre
        </a>
        .
      </p>
    </div>
  );
}
