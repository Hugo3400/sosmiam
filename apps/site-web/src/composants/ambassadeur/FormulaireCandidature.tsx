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

/** Candidature « fondateur » (action de routes/ambassadeur/fondateur.tsx). */
export function FormulaireCandidature() {
  return (
    <FormulaireCompte nom="candidature" bouton="Envoyer ma candidature" piege className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
      <div className="grid gap-6">
        <ChampTexte
          nom="pepites"
          libelle="Tes 3 pépites, et pourquoi"
          aide="Trois lieux indépendants que tu adores, et ce qui les rend uniques (20 caractères au moins)."
          maximum={1500}
          lignes={6}
        />
        <ChoixMultiples nom="envies" legende="Ce que tu aimerais faire" aide="Coche tout ce qui te tente." type="checkbox" options={envies} />
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
        <ChoixMultiples
          nom="partantRencontre"
          legende={lierPonctuation("Partant pour faire connaissance 20 minutes, autour d'un café ou en visio ?")}
          type="radio"
          enLigne
          options={[{ valeur: "oui", libelle: "Oui" }, { valeur: "non", libelle: "Non" }]}
        />
        <ChampTexte nom="connuPar" libelle={lierPonctuation("Comment tu as connu SOS Miam ?")} facultatif maximum={120} />
      </div>
    </FormulaireCompte>
  );
}
