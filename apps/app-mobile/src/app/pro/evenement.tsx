import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { TYPES_EVENEMENT_ECRITS, TYPES_EVENEMENT_ECRITS_PAR_LANGUE } from "@sos-miam/commun/contenus/types-evenement";
import { DESCRIPTION_EVENEMENT_MAX, TITRE_EVENEMENT_MAX, TYPES_EVENEMENT } from "@sos-miam/commun/regles/evenements";
import type { ChampEvenement, EvenementLieuPro } from "@sos-miam/commun/types/evenement";
import { validerEvenement } from "@sos-miam/commun/validation/valider-evenement";
import { RefusLimitationEnPlace } from "~/composants/compte/RefusLimitationEnPlace";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { Pastille } from "~/composants/interface/Pastille";
import { ChampsQuandEvenement } from "~/composants/pro/ChampsQuandEvenement";
import { ChampsTarifEvenement } from "~/composants/pro/ChampsTarifEvenement";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_ECRAN_EVENEMENT_PAR_LANGUE } from "~/contenus/textes-ecran-pro-evenements";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { convertirBrouillonEvenement } from "~/fonctions/pro/convertir-brouillon-evenement";
import { creerBrouillonEvenement, type BrouillonEvenement } from "~/fonctions/pro/creer-brouillon-evenement";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * Publier ou modifier un événement du lieu (gérant et équipe) : titre, type, description, quand (et chaque semaine), prix,
 * places et alcool. Vérifié ici comme sur le serveur (validerEvenement) ; un événement à venir peut aussi être annulé.
 */
export default function EcranEvenementPro() {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_ECRAN_EVENEMENT_PAR_LANGUE);
  const TL = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE);
  const TYPES = utiliserTextes(TYPES_EVENEMENT_ECRITS_PAR_LANGUE);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { lieuPro } = utiliserModes();
  const { lieuPro: service } = utiliserServices();
  const [existant, setExistant] = useState<EvenementLieuPro | null | undefined>(id ? undefined : null);
  const [brouillon, setBrouillon] = useState<BrouillonEvenement>(() => creerBrouillonEvenement(null));
  const [erreur, setErreur] = useState<ChampEvenement | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [annulation, setAnnulation] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  // Compte limité : il ne publie plus pour le lieu, ni n'annule l'événement d'un collègue (les siens, oui) ; dit dans le bas
  // fixe, au-dessus du bouton, jusqu'au prochain essai (dans le contenu, la phrase tomberait hors de vue)
  const [refusLimite, setRefusLimite] = useState<string | null>(null);

  // Modifier : l'événement est relu dans la liste du lieu (il n'existe pas de lecture d'un seul)
  useEffect(() => {
    if (!id || !lieuPro) return;
    service.listerEvenements(lieuPro.id).then((r) => {
      const trouve = r.ok ? (r.evenements.find((e) => String(e.id) === id) ?? null) : null;
      setExistant(trouve);
      if (trouve) setBrouillon(creerBrouillonEvenement(trouve));
    });
  }, [id, lieuPro, service]);

  if (!lieuPro) return null;
  const lieuId = lieuPro.id;
  const changer = (partiel: Partial<BrouillonEvenement>) => {
    setBrouillon((b) => ({ ...b, ...partiel }));
    setErreur(null);
  };
  const echouer = (texte: string) => setAnnonce({ texte, numero: Date.now() });

  async function enregistrer() {
    const reglage = convertirBrouillonEvenement(brouillon);
    const verifie = validerEvenement(reglage, new Date(), existant?.debut ?? null);
    if (!verifie.ok) return setErreur(verifie.champ);
    setEnCours(true);
    setRefusLimite(null);
    const r = existant ? await service.modifierEvenement(lieuId, existant.id, verifie.evenement) : await service.creerEvenement(lieuId, verifie.evenement);
    setEnCours(false);
    if (r.ok) {
      vibrerLegerement();
      return router.back();
    }
    if (r.erreur === "evenement-invalide" && r.champ) return setErreur(r.champ as ChampEvenement);
    if (r.erreur === "compte-limite") return setRefusLimite(TL.evenement);
    echouer(decrireEchecVisite(r.erreur, langue, r.details, lieuPro?.nom).texte);
  }

  async function annuler() {
    if (!existant) return;
    setRefusLimite(null);
    const r = await service.annulerEvenement(lieuId, existant.id);
    if (!r.ok && r.erreur === "compte-limite") return setRefusLimite(TL.annulerEvenement);
    if (!r.ok) return echouer(decrireEchecVisite(r.erreur, langue, r.details, lieuPro?.nom).texte);
    vibrerLegerement();
    router.back();
  }

  if (existant === undefined) {
    return (
      <EcranReglage titre={T.chargement}>
        <View className="items-center py-10">
          <ActivityIndicator color={couleurs.encre} />
        </View>
      </EcranReglage>
    );
  }
  if (id && existant === null) {
    return (
      <EcranReglage titre={T.introuvableTitre} sousTitre={T.introuvableTexte}>
        <Bouton libelle={T.retour} variante="blanc" onPress={() => router.back()} />
      </EcranReglage>
    );
  }

  const b = brouillon;
  const message = (champ: ChampEvenement) => (erreur === champ ? T.erreurs[champ] : undefined);
  return (
    <EcranReglage
      titre={existant ? T.modifier : T.nouvel}
      sousTitre={`${lieuPro.emoji} ${lieuPro.nom} · ${T.sousTitre}`}
      boutonPrincipal={{ libelle: enCours ? T.enCours : existant ? T.enregistrer : T.publier, onPress: () => void enregistrer(), desactive: enCours }}
      auDessusDuBouton={<RefusLimitationEnPlace texte={refusLimite} />}
    >
      <SectionReglages titre={T.essentiel}>
        <View className="gap-4">
          <ChampTexte libelle={T.champTitre} valeur={b.titre} onChangeTexte={(titre) => changer({ titre })} maxLength={TITRE_EVENEMENT_MAX} placeholder={T.champTitreExemple} erreur={message("titre") ?? null} />
          <Text className="-mb-2 font-texte-gras text-base text-encre">{T.type}</Text>
          <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
            {TYPES_EVENEMENT.map((t, i) => (
              <Pastille key={t} emoji={TYPES_EVENEMENT_ECRITS[t].emoji} libelle={TYPES[t].nom} role="radio" choisi={b.type === t} onPress={() => changer({ type: t })} position={i + 1} total={TYPES_EVENEMENT.length} />
            ))}
          </View>
          <ChampTexte
            libelle={T.description}
            mention={T.facultatif}
            valeur={b.description}
            onChangeTexte={(description) => changer({ description })}
            maxLength={DESCRIPTION_EVENEMENT_MAX}
            multiline
            placeholder={T.descriptionExemple}
            aide={`${b.description.length}/${DESCRIPTION_EVENEMENT_MAX}`}
            erreur={message("description") ?? null}
          />
        </View>
      </SectionReglages>
      <SectionReglages titre={T.quand}>
        <ChampsQuandEvenement brouillon={b} onChanger={changer} erreurs={{ debut: message("debut"), fin: message("fin"), hebdoJusqua: message("hebdoJusqua") }} />
      </SectionReglages>
      <SectionReglages titre={T.prixPlaces}>
        <ChampsTarifEvenement brouillon={b} onChanger={changer} erreurs={{ prixCentimes: message("prixCentimes"), places: message("places"), alcool: message("alcool") }} />
      </SectionReglages>
      {existant && existant.statut === "a-venir" ? (
        <View className="gap-2">
          <Text className="font-texte text-sm text-gris">{T.interesses(existant.interesses, existant.publiePar)}</Text>
          <Bouton libelle={T.annuler} variante="blanc" onPress={() => setAnnulation(true)} />
        </View>
      ) : null}
      <FeuilleConfirmation
        visible={annulation}
        emoji="🗓️"
        titre={T.annulationTitre}
        detail={T.annulationDetail}
        libelleConfirmer={T.annuler}
        libelleRester={T.garder}
        onConfirmer={() => void annuler()}
        onFermer={() => setAnnulation(false)}
      />
      <Annonce annonce={annonce} haut={8} onFin={() => setAnnonce(null)} />
    </EcranReglage>
  );
}
