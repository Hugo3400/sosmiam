import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Pote } from "@sos-miam/commun/types/potes";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { RondPote } from "~/composants/potes/RondPote";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { BoutonRetirerAbonne } from "~/composants/suivi/BoutonRetirerAbonne";
import { BoutonSuivreProfil } from "~/composants/suivi/BoutonSuivreProfil";
import { EncadreComptePrive } from "~/composants/suivi/EncadreComptePrive";
import { LigneSuivi } from "~/composants/suivi/LigneSuivi";
import { ListeTuSuis } from "~/composants/suivi/ListeTuSuis";
import type { OngletReseau } from "~/composants/suivi/OngletsReseau";
import { OngletsReseau } from "~/composants/suivi/OngletsReseau";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { ecrireCleSuivi } from "~/fonctions/suivi/ecrire-cle-suivi";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import type { PersonneLiee } from "~/hooks/utiliser-suivis-personnes";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";
import couleurs from "~/theme/couleurs";

const TAILLE_ROND = 48;

/**
 * Abonnés et abonnements d'une personne (ou les tiens, id « moi »), en deux onglets. Pour toi : tes abonnés (à retirer en
 * toute discrétion, liste figée à l'ouverture) et tout ce que tu suis. Pour quelqu'un d'autre : ses listes, avec « Suivre »
 * sur chaque ligne, ou l'encadré « Compte privé » si elles te sont fermées. Personne inconnue ou bloquée : un message et le retour.
 */
export default function ReseauPersonne() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { id = "", onglet: ongletDemande } = useLocalSearchParams<{ id: string; onglet?: "abonnes" | "abonnements" }>();
  const { invite } = utiliserProfil();
  const communaute = utiliserCommunaute();
  const suivis = utiliserSuivisPersonnes();
  const [onglet, setOnglet] = useState<OngletReseau>(ongletDemande === "abonnements" ? "abonnements" : "abonnes");
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);
  const estMoi = id === ID_MOI;

  // Tes abonnés au moment où l'écran s'ouvre : quelqu'un qu'on retire reste affiché (« Ne te suit plus »), rien ne bouge sous le doigt
  const [mesAbonnes, setMesAbonnes] = useState<PersonneLiee[] | null>(() => (suivis.pret ? suivis.abonnes : null));
  useEffect(() => {
    if (mesAbonnes === null && suivis.pret) setMesAbonnes(suivis.abonnes);
  }, [mesAbonnes, suivis.pret, suivis.abonnes]);
  // Ceux dont « Retirer » est allé au bout (feuille refermée) : leur ligne n'a plus de bouton
  const [retires, setRetires] = useState<ReadonlySet<string>>(() => new Set());

  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/potes"));

  if (invite) {
    return (
      <EcranReglage titre="Abonnés et abonnements" sousTitre="Crée ton compte pour suivre des gens et voir qui suit qui. C'est gratuit, et ça prend une minute.">
        <Bouton libelle="Je m'inscris (1 min)" variante="encre" indice="Ouvre l'inscription" onPress={() => router.push("/compte")} />
      </EcranReglage>
    );
  }

  const pote = communaute.trouverPote(id);
  const bloque = communaute.bloques.some((p) => p.id === id);
  if (!pote || bloque) {
    return (
      <EcranReglage titre="Personne à l'horizon" sousTitre="On ne trouve pas ce profil : la personne a peut-être quitté SOS Miam, ou le lien s'est emmêlé.">
        <Bouton libelle="Retour" variante="blanc" onPress={revenir} />
      </EcranReglage>
    );
  }

  const compteurs = suivis.pret ? suivis.compteursDe(id) : null;
  const relation = estMoi ? null : suivis.relationAvec(id);

  /** Une ligne de personne : son rond, son prénom (« Toi » pour toi) et son @pseudo ; elle ouvre son profil */
  const ligne = (personne: Pote, derniere: boolean, sousTitre: string, action?: ReactNode) => (
    <LigneSuivi
      key={personne.id}
      cle={ecrireCleSuivi({ type: "personne", id: personne.id })}
      emoji={personne.avatar}
      nom={personne.id === ID_MOI ? "Toi" : personne.prenom}
      sousTitre={sousTitre}
      rond={<RondPote pote={personne} taille={TAILLE_ROND} />}
      indice={personne.id === ID_MOI ? "Ouvre ton profil" : "Ouvre son profil"}
      derniere={derniere}
      onOuvrir={() => router.push({ pathname: "/potes/profil/[id]", params: { id: personne.id } })}
      onAnnoncer={annoncer}
      action={personne.id === ID_MOI ? null : action}
    />
  );

  const videParDefaut = (texte: string) => (
    <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-8">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
        🦗
      </Text>
      <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(texte)}</Text>
    </View>
  );

  let contenu: ReactNode = null;
  if (!suivis.pret) {
    contenu = null;
  } else if (estMoi && onglet === "abonnements") {
    contenu = <ListeTuSuis onAnnoncer={annoncer} />;
  } else if (estMoi) {
    // Une personne devenue inconnue ou bloquée depuis l'ouverture disparaît tout de suite
    const lignes = (mesAbonnes ?? []).filter(({ pote: p }) => {
      const r = suivis.relationAvec(p.id);
      return r !== null && !(!r.verdict.permis && r.verdict.raison === "bloque");
    });
    const demandes = suivis.demandesRecues.length;
    contenu = (
      <View className="gap-4">
        {demandes > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Demandes d'abonnement, ${demandes}`}
            accessibilityHint="Ouvre tes notifications pour les accepter ou les refuser"
            onPress={() => {
              vibrerLegerement();
              router.push("/notifications");
            }}
            className="min-h-14 flex-row items-center gap-3 rounded-carte border-2 border-encre bg-jaune-clair px-4 py-3 active:opacity-80"
          >
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl">
              📨
            </Text>
            <Text className="flex-1 font-texte-gras text-base text-encre">{`Demandes d'abonnement (${demandes})`}</Text>
            <Ionicons name="chevron-forward" size={20} color={couleurs.encre} />
          </Pressable>
        ) : null}
        {lignes.length === 0 ? (
          videParDefaut("Personne ne te suit encore… Partage ton profil : tes potes t'ajoutent avec ton QR code.")
        ) : (
          <View className="overflow-hidden rounded-carte border-2 border-encre bg-white">
            {lignes.map(({ pote: p }, i) => {
              const meSuitEncore = suivis.abonnes.some((a) => a.pote.id === p.id);
              return ligne(
                p,
                i === lignes.length - 1,
                `@${p.pseudo}${meSuitEncore ? "" : " · Ne te suit plus"}`,
                retires.has(p.id) ? null : (
                  <BoutonRetirerAbonne id={p.id} prenom={p.prenom} onRetire={() => setRetires((r) => new Set(r).add(p.id))} onAnnoncer={annoncer} />
                ),
              );
            })}
          </View>
        )}
      </View>
    );
  } else {
    const liste = onglet === "abonnes" ? suivis.abonnesDe(id) : suivis.abonnementsDe(id);
    if (liste === "ferme") {
      contenu = (
        <View className="gap-4">
          {/* « Touche Suivre », dit l'encadré : le bouton est là aussi, juste au-dessus (rien s'il n'est pas permis) */}
          <BoutonSuivreProfil cle={ecrireCleSuivi({ type: "personne", id })} nom={pote.prenom} emoji={pote.avatar} onAnnoncer={annoncer} taille="grand" />
          <EncadreComptePrive
            prenom={pote.prenom}
            peutDemander={relation?.verdict.permis ?? false}
            demandeEnvoyee={relation?.jeSuis === "demande"}
            listesSeules={relation?.visibilite === "complet"}
          />
        </View>
      );
    } else if (liste.length === 0) {
      contenu = videParDefaut(onglet === "abonnes" ? `${pote.prenom} n'a pas encore d'abonnés. La première place est libre !` : `${pote.prenom} ne suit personne pour l'instant.`);
    } else {
      contenu = (
        <View className="overflow-hidden rounded-carte border-2 border-encre bg-white">
          {liste.map((p, i) => ligne(p, i === liste.length - 1, p.pseudo ? `@${p.pseudo}` : ""))}
        </View>
      );
    }
  }

  const titre = estMoi ? communaute.moi.prenom : pote.prenom;
  const pseudo = estMoi ? communaute.moi.pseudo : pote.pseudo;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <View className="min-h-14 flex-row items-center gap-3 px-5 pb-2 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={12}
          onPress={revenir}
          className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
        <View accessible accessibilityRole="header" accessibilityLabel={pseudo ? `${titre}, @${pseudo}` : titre} className="flex-1">
          <Text numberOfLines={1} className="font-titre text-2xl text-encre">
            {titre}
          </Text>
          {pseudo ? (
            <Text numberOfLines={1} className="font-texte text-sm text-gris">
              @{pseudo}
            </Text>
          ) : null}
        </View>
      </View>

      {suivis.pret ? <OngletsReseau onglet={onglet} onChoisir={setOnglet} abonnes={compteurs?.abonnes ?? null} abonnements={compteurs?.abonnements ?? null} /> : null}

      <ScrollView className="flex-1" contentContainerClassName="gap-6 px-5 pb-10 pt-5">
        {contenu}
      </ScrollView>

      <Annonce annonce={annonce} haut={marges.top + 60} onFin={finAnnonce} />
    </SafeAreaView>
  );
}
