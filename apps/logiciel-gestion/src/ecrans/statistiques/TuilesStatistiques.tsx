import { TuileChiffre } from "~/composants/interface/TuileChiffre.tsx";
import { formaterDuree } from "~/fonctions/texte/formater-duree.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import type { ConversionsPeriode, PeriodeStatistiques } from "~/services/statistiques.ts";

type Props = {
  actuelle: PeriodeStatistiques;
  precedente: PeriodeStatistiques | undefined;
  conversions: ConversionsPeriode | undefined;
  enCours: string;
  reference: string;
};

const ecart = (actuel: number, avant: number | undefined) => (!avant ? null : ((actuel - avant) / avant) * 100);
const pourcentage = (part: number, total: number) => (total ? `${Math.round((part / total) * 100)} %` : "—");

/** Les chiffres de la période en cours : visiteurs, visites, pages, rebond, durée, conversions, vitesse. */
export function TuilesStatistiques({ actuelle, precedente, conversions, enCours, reference }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <TuileChiffre libelle={`Visiteurs ${enCours}`} valeur={actuelle.visiteurs} ecart={{ pourcentage: ecart(actuelle.visiteurs, precedente?.visiteurs), reference }} accent />
      <TuileChiffre libelle={`Visites ${enCours}`} valeur={actuelle.visites} ecart={{ pourcentage: ecart(actuelle.visites, precedente?.visites), reference }} />
      <TuileChiffre libelle={`Pages vues ${enCours}`} valeur={actuelle.vues} ecart={{ pourcentage: ecart(actuelle.vues, precedente?.vues), reference }} />
      <TuileChiffre
        libelle="Pages par visite"
        valeur={actuelle.visites ? (actuelle.vues / actuelle.visites).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) : "—"}
      />
      <TuileChiffre
        libelle="Taux de rebond"
        valeur={pourcentage(actuelle.rebonds, actuelle.visitesFinies)}
        detail={`Visites d'une seule page, sur ${formaterNombre(actuelle.visitesFinies)} visite(s) terminée(s)`}
      />
      <TuileChiffre
        libelle="Durée moyenne d'une visite"
        valeur={actuelle.visitesFinies ? formaterDuree(actuelle.dureeVisites / actuelle.visitesFinies) : "—"}
        detail="De la première à la dernière page vue"
      />
      <TuileChiffre
        libelle={`Inscrits à la newsletter ${enCours}`}
        valeur={conversions?.inscriptions ?? 0}
        detail={`${pourcentage(conversions?.inscriptions ?? 0, actuelle.visiteurs)} des visiteurs · ${formaterNombre(conversions?.demandes ?? 0)} demande(s) de lieu`}
      />
      <TuileChiffre
        libelle="Temps de réponse moyen"
        valeur={actuelle.tempsMoyen === null ? "—" : `${formaterNombre(actuelle.tempsMoyen)} ms`}
        detail="Le temps que met le serveur à préparer une page"
      />
    </div>
  );
}
