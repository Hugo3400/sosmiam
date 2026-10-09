import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import type { ReponseComptoir } from "@sos-miam/commun/client-api/contrat-comptoir";
import { decrireReglement } from "@sos-miam/commun/fonctions/visites/decrire-reglement";
import { DEMANDES_AVANT_SAISIE_CODE } from "@sos-miam/commun/regles/visites";
import type { DemandeComptoir, ValidationRecente } from "@sos-miam/commun/types/comptoir";
import { Annonce } from "~/composants/interface/Annonce";
import { EnTeteMode } from "~/composants/modes/EnTeteMode";
import { BandeauDemoPro } from "~/composants/pro/BandeauDemoPro";
import { CarteAlerteMiamSafe } from "~/composants/pro/CarteAlerteMiamSafe";
import { BoutonMontrerQr } from "~/composants/pro/BoutonMontrerQr";
import { CarteDemandeComptoir } from "~/composants/pro/CarteDemandeComptoir";
import { CarteQrAffiche } from "~/composants/pro/CarteQrAffiche";
import { ChoixPersonnesQr } from "~/composants/pro/ChoixPersonnesQr";
import { ComptoirVide } from "~/composants/pro/ComptoirVide";
import { FeuilleReglement } from "~/composants/pro/FeuilleReglement";
import { FeuilleRefusVisite } from "~/composants/pro/FeuilleRefusVisite";
import { ListeValideesInstant } from "~/composants/pro/ListeValideesInstant";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { lireMiamSafeLieu } from "~/fonctions/miam-safe/lire-miam-safe-lieu";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserComptoir } from "~/hooks/utiliser-comptoir";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserOutilsDemo } from "~/hooks/utiliser-services";
import couleurs from "~/theme/couleurs";

const nomDe = (d: { prenom: string; initialeNom: string | null }) => (d.initialeNom ? `${d.prenom} ${d.initialeNom}.` : d.prenom);

/**
 * Comptoir du mode pro : montrer le QR après le paiement, les additions et récompenses en attente, les validations
 * encore annulables. Suivi en direct (utiliserComptoir) ; chaque geste dit ce qui s'est passé, en une phrase.
 */
export default function EcranComptoir() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { lieuPro } = utiliserModes();
  const demo = utiliserOutilsDemo() !== null;
  const comptoir = utiliserComptoir(lieuPro?.id ?? null);
  const { etat } = comptoir;
  const [maintenant, setMaintenant] = useState(() => new Date());
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const [choixQr, setChoixQr] = useState(false);
  // Les feuilles gardent leur cible pendant qu'elles se referment
  const [aRegler, setARegler] = useState<DemandeComptoir | null>(null);
  const [reglementOuvert, setReglementOuvert] = useState(false);
  const [erreurCode, setErreurCode] = useState<string | null>(null);
  const [aRefuser, setARefuser] = useState<DemandeComptoir | null>(null);
  const [refusOuvert, setRefusOuvert] = useState(false);
  const [aAnnuler, setAAnnuler] = useState<ValidationRecente | null>(null);
  const [annulationOuverte, setAnnulationOuverte] = useState(false);

  // Les attentes (« depuis 3 min ») et le compte à rebours du QR bougent tout seuls
  useEffect(() => {
    const minuterie = setInterval(() => setMaintenant(new Date()), 1000);
    return () => clearInterval(minuterie);
  }, []);

  const annoncer = (texte: string) => setAnnonce({ texte, numero: Date.now() });
  /** Un geste a échoué : on le dit avec le texte des services (le même que sur le site) */
  const direEchec = (r: ReponseComptoir) => {
    if (r.ok) return;
    const message = decrireEchecVisite(r.erreur, r.details, etat?.lieu.nom);
    annoncer(`${message.titre}. ${message.texte}`);
  };

  if (!lieuPro) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
        <View className="gap-6 px-5 pt-3">
          <EnTeteMode mode="pro" titre="Comptoir" sousTitre="Aucun lieu à gérer pour l'instant." />
        </View>
      </SafeAreaView>
    );
  }

  const demandes = etat?.demandes ?? [];
  const additions = demandes.filter((d) => d.type === "addition").length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 px-5 pb-10 pt-3">
        <EnTeteMode mode="pro" titre="Comptoir" sousTitre={`${lieuPro.emoji} ${lieuPro.nom}`} />
        {demo ? <BandeauDemoPro nomLieu={lieuPro.nom} /> : null}
        {/* Miam Safe : une alerte silencieuse d'exemple, en tête du comptoir (lieux qui ont signé la charte) */}
        {demo && lireMiamSafeLieu(lieuPro.id).engage ? <CarteAlerteMiamSafe onRepondre={annoncer} /> : null}

        {etat === null ? (
          comptoir.erreur ? (
            <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation(decrireEchecVisite(comptoir.erreur, undefined, lieuPro.nom).texte)}</Text>
          ) : (
            <ActivityIndicator color={couleurs.encre} accessibilityLabel="On ouvre le comptoir…" />
          )
        ) : (
          <>
            {etat.qr ? (
              <CarteQrAffiche
                qr={etat.qr}
                reglement={etat.qr.reglement}
                maintenant={maintenant}
                onVoir={() => router.push("/pro/qr")}
                onCacher={async () => {
                  const r = await comptoir.cacherQr();
                  if (r.ok) annoncer("QR éteint");
                  else direEchec(r);
                }}
              />
            ) : (
              <BoutonMontrerQr onPress={() => setChoixQr(true)} desactive={!etat.validationActive} />
            )}

            <View className="gap-3">
              <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
                En attente{demandes.length > 0 ? ` (${demandes.length})` : ""}
              </Text>
              {additions >= DEMANDES_AVANT_SAISIE_CODE ? (
                <Text className="font-texte text-sm leading-5 text-gris">Plusieurs additions en même temps : tu taperas le code que te montre le client, pour ne pas te tromper de table.</Text>
              ) : null}
              {demandes.length === 0 ? (
                <ComptoirVide />
              ) : (
                demandes.map((d) => (
                  <CarteDemandeComptoir
                    key={`${d.type}-${d.id}`}
                    demande={d}
                    maintenant={maintenant}
                    onRegler={() => {
                      setARegler(d);
                      setErreurCode(null);
                      setReglementOuvert(true);
                    }}
                    onRefuser={() => {
                      setARefuser(d);
                      setRefusOuvert(true);
                    }}
                    onOffrir={async () => {
                      const r = await comptoir.offrirRecompense(d.id);
                      if (r.ok) annoncer(`🎁 Récompense offerte à ${nomDe(d)}`);
                      else direEchec(r);
                    }}
                  />
                ))
              )}
            </View>

            <ListeValideesInstant
              validees={etat.validees}
              maintenant={maintenant}
              onAnnuler={(visiteId) => {
                setAAnnuler(etat.validees.find((v) => v.visiteId === visiteId) ?? null);
                setAnnulationOuverte(true);
              }}
            />
          </>
        )}
      </ScrollView>

      <ChoixPersonnesQr
        visible={choixQr}
        onMontrer={async (personnes, reglement) => {
          setChoixQr(false);
          const r = await comptoir.montrerQr(personnes, reglement);
          // Allumé : on le montre aussitôt en grand, prêt à tourner vers le client
          if (r.ok) router.push("/pro/qr");
          else direEchec(r);
        }}
        onFermer={() => setChoixQr(false)}
      />
      <FeuilleReglement
        visible={reglementOuvert}
        nom={aRegler ? nomDe(aRegler) : ""}
        codeRequis={additions >= DEMANDES_AVANT_SAISIE_CODE}
        erreurCode={erreurCode}
        onValider={async (reglement, code) => {
          if (!aRegler) return;
          const r = await comptoir.marquerReglee(aRegler.id, code, reglement);
          if (!r.ok && r.erreur === "code-faux") return setErreurCode("Ce n'est pas le bon code : vérifie celui que te montre le client.");
          setReglementOuvert(false);
          if (r.ok) annoncer(`✓ Visite de ${nomDe(aRegler)} validée · ${decrireReglement(reglement, "lieu").titre}`);
          else direEchec(r);
        }}
        onFermer={() => setReglementOuvert(false)}
      />
      <FeuilleRefusVisite
        visible={refusOuvert}
        titre={aRefuser ? `Refuser l'addition de ${nomDe(aRefuser)} ?` : "Refuser l'addition ?"}
        detail="Le client lira un motif neutre, sans reproche. Trop de refus sont relus par l'équipe SOS Miam."
        libelleConfirmer="Refuser l'addition"
        onConfirmer={async (motif) => {
          setRefusOuvert(false);
          if (!aRefuser) return;
          const r = await comptoir.refuser(aRefuser.id, motif);
          if (r.ok) annoncer(`Addition de ${nomDe(aRefuser)} refusée`);
          else direEchec(r);
        }}
        onFermer={() => setRefusOuvert(false)}
      />
      <FeuilleRefusVisite
        visible={annulationOuverte}
        titre={aAnnuler ? `Annuler la validation de ${nomDe(aAnnuler)} ?` : "Annuler la validation ?"}
        detail="Une erreur ? Les points et le tampon repartent. Possible pendant 15 minutes après la validation."
        libelleConfirmer="Annuler la validation"
        onConfirmer={async (motif) => {
          setAnnulationOuverte(false);
          if (!aAnnuler) return;
          const r = await comptoir.annulerValidation(aAnnuler.visiteId, motif);
          if (r.ok) annoncer(`Validation de ${nomDe(aAnnuler)} annulée`);
          else direEchec(r);
        }}
        onFermer={() => setAnnulationOuverte(false)}
      />
      <Annonce annonce={annonce} haut={marges.top + 12} onFin={() => setAnnonce(null)} />
    </SafeAreaView>
  );
}
