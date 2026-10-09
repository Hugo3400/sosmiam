import { CaseACocher } from "~/composants/compte/CaseACocher";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { ChoixMultiples } from "~/composants/compte/ChoixMultiples";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Ce que l'ambassadeur aimerait faire : mêmes codes que l'API (POST /comptes/moi/candidature). */
const envies = [
  { valeur: "denicher", libelle: "Dénicher des lieux" },
  { valeur: "fiches", libelle: "Tenir les fiches à jour" },
  { valeur: "selections", libelle: "Créer des sélections" },
  { valeur: "faire-savoir", libelle: "Parler de SOS Miam autour de toi" },
];

type Props = {
  /** Code INSEE de la commune choisie juste avant (champ caché) : l'API en déduit la ville ou le département */
  communeCode: string;
};

/** Candidature « fondateur » pour la commune choisie (action de routes/ambassadeur/fondateur.tsx). */
export function FormulaireCandidature({ communeCode }: Props) {
  return (
    <FormulaireCompte nom="candidature" bouton="Envoyer ma candidature" piege className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
      <input type="hidden" name="communeCode" value={communeCode} />
      <div className="grid gap-6">
        <ChampTexte
          nom="pepites"
          libelle="Tes 3 pépites, et pourquoi"
          aide="Trois lieux indépendants que tu adores, et ce qui les rend uniques (20 caractères au moins)."
          maximum={1500}
          lignes={6}
        />
        {/* Au moins une case (comme l'API) : un groupe de cases ne peut pas être marqué « requis », l'aide le dit donc */}
        <ChoixMultiples nom="envies" legende="Ce que tu aimerais faire" aide="Coche tout ce qui te tente (une case au moins)." type="checkbox" options={envies} />
        <ChampTexte
          nom="reseaux"
          libelle="Tes réseaux"
          facultatif
          maximum={200}
          aide="Ton Instagram, ton TikTok… si tu veux nous les montrer."
        />
        <ChampTexte
          nom="motivation"
          libelle={lierPonctuation("Pourquoi toi ?")}
          aide="En quelques lignes (20 caractères au moins)."
          maximum={600}
          lignes={4}
        />
        <CaseACocher nom="partantRencontre" facultatif>
          {lierPonctuation("Partant pour une visio d'environ 30 minutes avec les fondateurs de ta ville (de ta région pour un département)")}
        </CaseACocher>
        <ChampTexte nom="connuPar" libelle={lierPonctuation("Comment tu as connu SOS Miam ?")} facultatif maximum={120} />
      </div>
    </FormulaireCompte>
  );
}
