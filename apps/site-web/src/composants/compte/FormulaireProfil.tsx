import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE } from "~/contenus/formulaire-compte";
import { site } from "~/contenus/legal/informations-legales";
import { TEXTES_MON_COMPTE_PAR_LANGUE } from "~/contenus/mon-compte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  prenom: string;
  email: string;
  /** null : compte sans demande d'ambassadeur (pas de ville ni de quartier à changer) */
  lieu: { ville: string; quartier: string | null } | null;
};

/** « Mes infos » dans « Mon compte » : prénom, ville, quartier. L'e-mail ne se change pas en ligne. */
export function FormulaireProfil({ prenom, email, lieu }: Props) {
  const T = utiliserTextes(TEXTES_MON_COMPTE_PAR_LANGUE).profil;
  const { champs } = utiliserTextes(TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE);
  return (
    <FormulaireCompte nom="infos" bouton={T.bouton}>
      <p className="mb-5 text-gris">
        {/* Un seul morceau de texte après l'e-mail : une espace seule serait perdue par Chrome pour les lecteurs d'écran */}
        {lierPonctuation(T.tonEmail)}<strong className="break-all text-encre">{email}</strong>
        {lierPonctuation(T.nePasChanger)}
        <a href={`mailto:${site.emailContact}`} className="font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
          {site.emailContact}
        </a>.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <ChampTexte
          nom="prenom"
          libelle={champs.prenom}
          autoComplete="given-name"
          maximum={40}
          valeur={prenom}
          className="sm:col-span-2"
          aide={lieu ? lierPonctuation(T.aidePrenom) : undefined}
        />
        {lieu && (
          <>
            <ChampTexte nom="ville" libelle={champs.ville} autoComplete="address-level2" maximum={80} valeur={lieu.ville} />
            <ChampTexte nom="quartier" libelle={champs.quartier} facultatif maximum={80} valeur={lieu.quartier ?? ""} />
          </>
        )}
      </div>
    </FormulaireCompte>
  );
}
