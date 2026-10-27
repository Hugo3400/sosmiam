import { ChampTexte } from "~/composants/compte/ChampTexte";
import { ChoixMultiples } from "~/composants/compte/ChoixMultiples";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { SectionFiche } from "~/composants/pro/SectionFiche";
import { EXEMPLES_FICHE_PRO, TEXTES_FICHE_PRO_PAR_LANGUE } from "~/contenus/fiche-pro";
import { INFOS_OUI_NON, LIBELLES_ANIMAUX, LIBELLES_PAIEMENT, LIBELLES_RESERVATION, TEXTES_INFOS_PRATIQUES_PAR_LANGUE } from "~/contenus/infos-pratiques";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { AccueilAnimaux, FichePro, MoyenPaiement, ReservationConseillee } from "~/types/pro";

const ouiNon = (valeur: boolean | null) => (valeur === true ? "oui" : valeur === false ? "non" : "");

/**
 * « Ma fiche » du gérant (action de routes/pro/ma-fiche.tsx), en sections : nom et adresse (vérifiés par l'équipe), horaires
 * et présentation, contact, infos pratiques. Marche sans JavaScript (FormulaireCompte).
 */
export function FormulaireFiche({ lieu }: { lieu: FichePro }) {
  const T = utiliserTextes(TEXTES_FICHE_PRO_PAR_LANGUE).formulaire;
  const I = utiliserTextes(TEXTES_INFOS_PRATIQUES_PAR_LANGUE);
  const sansAvis = { valeur: "", libelle: T.sansAvis };
  return (
    <FormulaireCompte nom="fiche" bouton={T.bouton} boutonEnvoi={T.envoi} className="grid gap-6">
      <SectionFiche
        titre={T.nomAdresse.titre}
        note={<p><span aria-hidden="true">🔒 </span>{lierPonctuation(T.nomAdresse.note)}</p>}
      >
        <ChampTexte nom="nom" libelle={T.nomAdresse.nom} valeur={lieu.nom} maximum={80} />
        <ChampTexte nom="adresse" libelle={T.nomAdresse.adresse} facultatif valeur={lieu.adresse ?? ""} maximum={160} exemple={EXEMPLES_FICHE_PRO.adresse} />
        <ChampTexte
          nom="message"
          libelle={T.nomAdresse.message}
          facultatif
          lignes={2}
          maximum={1000}
          aide={lierPonctuation(T.nomAdresse.aideMessage)}
        />
      </SectionFiche>

      <SectionFiche titre={T.horaires.titre} note={lierPonctuation(T.horaires.note)}>
        <ChampTexte nom="horaires" libelle={T.horaires.horaires} facultatif valeur={lieu.horaires ?? ""} maximum={160} exemple={T.horaires.exempleHoraires} />
        <ChampTexte
          nom="texte"
          libelle={T.horaires.texte}
          facultatif
          valeur={lieu.texte ?? ""}
          lignes={6}
          maximum={1000}
          aide={lierPonctuation(T.horaires.aideTexte)}
        />
      </SectionFiche>

      <SectionFiche titre={T.contact.titre} note={lierPonctuation(T.contact.note)}>
        <ChampTexte nom="telephone" libelle={T.contact.telephone} facultatif valeur={lieu.telephone ?? ""} maximum={30} autoComplete="off" exemple={EXEMPLES_FICHE_PRO.telephone} />
        <ChampTexte nom="siteWeb" libelle={T.contact.siteWeb} type="url" inputMode="url" facultatif valeur={lieu.siteWeb ?? ""} maximum={200} exemple={EXEMPLES_FICHE_PRO.siteWeb} />
        <ChampTexte nom="instagram" libelle={T.contact.instagram} facultatif valeur={lieu.instagram ?? ""} maximum={60} aide={T.contact.aideInstagram} />
      </SectionFiche>

      <SectionFiche titre={T.infos.titre} note={lierPonctuation(T.infos.note)}>
        <ChoixMultiples
          nom="animaux"
          legende={T.infos.animaux}
          type="radio"
          enLigne
          depart={[lieu.animaux ?? ""]}
          options={[...(Object.keys(LIBELLES_ANIMAUX) as AccueilAnimaux[]).map((valeur) => ({ valeur, libelle: I.animaux[valeur] })), sansAvis]}
        />
        {INFOS_OUI_NON.map((info) => (
          <ChoixMultiples
            key={info.champ}
            nom={info.champ}
            legende={I.ouiNon[info.champ].question}
            type="radio"
            enLigne
            depart={[ouiNon(lieu[info.champ])]}
            options={[{ valeur: "oui", libelle: T.oui }, { valeur: "non", libelle: T.non }, sansAvis]}
          />
        ))}
        <ChoixMultiples
          nom="reservation"
          legende={T.infos.reservation}
          type="radio"
          enLigne
          depart={[lieu.reservation ?? ""]}
          options={[...(Object.keys(LIBELLES_RESERVATION) as ReservationConseillee[]).map((valeur) => ({ valeur, libelle: I.reservation[valeur] })), sansAvis]}
        />
        <ChoixMultiples
          nom="paiements"
          legende={T.infos.paiements}
          type="checkbox"
          enLigne
          depart={lieu.paiements}
          aide={T.infos.aidePaiements}
          options={(Object.keys(LIBELLES_PAIEMENT) as MoyenPaiement[]).map((valeur) => ({ valeur, libelle: I.paiement[valeur][0].toUpperCase() + I.paiement[valeur].slice(1) }))}
        />
      </SectionFiche>
    </FormulaireCompte>
  );
}
