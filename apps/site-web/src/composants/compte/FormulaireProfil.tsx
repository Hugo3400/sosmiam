import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { site } from "~/contenus/legal/informations-legales";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  prenom: string;
  email: string;
  /** null : compte sans demande d'ambassadeur (pas de ville ni de quartier à changer) */
  lieu: { ville: string; quartier: string | null } | null;
};

/** « Mes infos » dans « Mon compte » : prénom, ville, quartier. L'e-mail ne se change pas en ligne. */
export function FormulaireProfil({ prenom, email, lieu }: Props) {
  return (
    <FormulaireCompte nom="infos" bouton="Enregistrer">
      <p className="mb-5 text-gris">
        {/* Un seul morceau de texte après l'e-mail : une espace seule serait perdue par Chrome pour les lecteurs d'écran */}
        {lierPonctuation("Ton e-mail : ")}<strong className="break-all text-encre">{email}</strong>
        {lierPonctuation(". Il ne se change pas en ligne : pour le changer, écris-nous à ")}
        <a href={`mailto:${site.emailContact}`} className="font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
          {site.emailContact}
        </a>.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <ChampTexte
          nom="prenom"
          libelle="Ton prénom (ou un surnom)"
          autoComplete="given-name"
          maximum={40}
          valeur={prenom}
          className="sm:col-span-2"
          aide={lieu ? lierPonctuation("Il peut s'afficher « Déniché par … » sur la fiche d'un lieu que tu as proposé. Une fiche déjà en ligne garde le prénom d'alors : écris-nous pour le changer.") : undefined}
        />
        {lieu && (
          <>
            <ChampTexte nom="ville" libelle="Ta ville" autoComplete="address-level2" maximum={80} valeur={lieu.ville} />
            <ChampTexte nom="quartier" libelle="Ton quartier" facultatif maximum={80} valeur={lieu.quartier ?? ""} />
          </>
        )}
      </div>
    </FormulaireCompte>
  );
}
