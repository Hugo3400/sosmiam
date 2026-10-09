import { ChampTexte } from "~/composants/compte/ChampTexte";
import { ChoixMultiples } from "~/composants/compte/ChoixMultiples";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { SectionFiche } from "~/composants/pro/SectionFiche";
import { INFOS_OUI_NON, LIBELLES_ANIMAUX, LIBELLES_PAIEMENT, LIBELLES_RESERVATION } from "~/contenus/infos-pratiques";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { FichePro } from "~/types/pro";

/** Le choix « on ne dit rien » : l'info reste inconnue, donc absente de la fiche publique. */
const SANS_AVIS = { valeur: "", libelle: "Je ne précise pas" };

const ouiNon = (valeur: boolean | null) => (valeur === true ? "oui" : valeur === false ? "non" : "");

/**
 * « Ma fiche » du gérant (action de routes/pro/ma-fiche.tsx), en sections : nom et adresse (vérifiés par l'équipe), horaires
 * et présentation, contact, infos pratiques. Marche sans JavaScript (FormulaireCompte).
 */
export function FormulaireFiche({ lieu }: { lieu: FichePro }) {
  return (
    <FormulaireCompte nom="fiche" bouton="Enregistrer ma fiche" boutonEnvoi="Enregistrement…" className="grid gap-6">
      <SectionFiche
        titre="Nom et adresse"
        note={<p><span aria-hidden="true">🔒 </span>{lierPonctuation("Ces deux-là passent par l'équipe SOS Miam : elle vérifie, puis la fiche change. C'est pour éviter les mauvaises blagues.")}</p>}
      >
        <ChampTexte nom="nom" libelle="Nom du lieu" valeur={lieu.nom} maximum={80} />
        <ChampTexte nom="adresse" libelle="Adresse" facultatif valeur={lieu.adresse ?? ""} maximum={160} exemple="12 rue de la Paix" />
      </SectionFiche>

      <SectionFiche titre="Horaires et présentation" note={lierPonctuation("En ligne tout de suite.")}>
        <ChampTexte nom="horaires" libelle="Horaires" facultatif valeur={lieu.horaires ?? ""} maximum={160} exemple="Mar–sam, 12h–14h30 et 19h–23h" />
        <ChampTexte
          nom="texte"
          libelle="Présentation"
          facultatif
          valeur={lieu.texte ?? ""}
          lignes={6}
          maximum={1000}
          aide={lierPonctuation("Ce qui rend ton lieu unique : la spécialité, l'ambiance, l'histoire. Parle comme à un client au comptoir.")}
        />
      </SectionFiche>

      <SectionFiche titre="Contact" note={lierPonctuation("En ligne tout de suite. Laisse vide ce que tu ne veux pas montrer.")}>
        <ChampTexte nom="telephone" libelle="Téléphone" facultatif valeur={lieu.telephone ?? ""} maximum={30} autoComplete="off" exemple="04 67 12 34 56" />
        <ChampTexte nom="siteWeb" libelle="Site" type="url" inputMode="url" facultatif valeur={lieu.siteWeb ?? ""} maximum={200} exemple="https://…" />
        <ChampTexte nom="instagram" libelle="Compte Instagram" facultatif valeur={lieu.instagram ?? ""} maximum={60} aide="Juste le nom du compte, sans « @ »." />
      </SectionFiche>

      <SectionFiche titre="Infos pratiques" note={lierPonctuation("En ligne tout de suite. « Je ne précise pas » : rien n'est affiché, on ne devine jamais à ta place.")}>
        <ChoixMultiples
          nom="animaux"
          legende="Les animaux"
          type="radio"
          enLigne
          depart={[lieu.animaux ?? ""]}
          options={[...Object.entries(LIBELLES_ANIMAUX).map(([valeur, libelle]) => ({ valeur, libelle: libelle.texte })), SANS_AVIS]}
        />
        {INFOS_OUI_NON.map((info) => (
          <ChoixMultiples
            key={info.champ}
            nom={info.champ}
            legende={info.question}
            type="radio"
            enLigne
            depart={[ouiNon(lieu[info.champ])]}
            options={[{ valeur: "oui", libelle: "Oui" }, { valeur: "non", libelle: "Non" }, SANS_AVIS]}
          />
        ))}
        <ChoixMultiples
          nom="reservation"
          legende="La réservation"
          type="radio"
          enLigne
          depart={[lieu.reservation ?? ""]}
          options={[...Object.entries(LIBELLES_RESERVATION).map(([valeur, libelle]) => ({ valeur, libelle })), SANS_AVIS]}
        />
        <ChoixMultiples
          nom="paiements"
          legende="Les paiements acceptés"
          type="checkbox"
          enLigne
          depart={lieu.paiements}
          aide="Coche tout ce que tu acceptes. Rien de coché : rien n'est affiché."
          options={Object.entries(LIBELLES_PAIEMENT).map(([valeur, libelle]) => ({ valeur, libelle: libelle[0].toUpperCase() + libelle.slice(1) }))}
        />
      </SectionFiche>
    </FormulaireCompte>
  );
}
