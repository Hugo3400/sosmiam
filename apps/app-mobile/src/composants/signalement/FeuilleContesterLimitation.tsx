import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { MESSAGES_SERVICE, type MessageService } from "@sos-miam/commun/contenus/messages-services";
import { LONGUEUR_MAX_CONTESTATION, LONGUEUR_MIN_CONTESTATION } from "@sos-miam/commun/regles/signalement";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import type { ResultatContestationLimitation } from "~/hooks/utiliser-limitation-compte";

type Props = {
  visible: boolean;
  /** utiliserLimitationCompte().contester : null quand la contestation est partie */
  onContester: (texte: string) => Promise<ResultatContestationLimitation>;
  /** « Finalement non », « Fermer », fond assombri, retour Android ou geste d'échappement de VoiceOver */
  onFermer: () => void;
};

type Etape = "ecrire" | "envoi" | "envoyee";

/** « 1 000 » : la limite écrite avec son espace fine (sans dépendre d'Intl) */
const MAX_ECRIT = String(LONGUEUR_MAX_CONTESTATION).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/** Les deux refus de l'app elle-même (rien n'est parti) ; le reste vient du serveur */
const REFUS_LOCAUX: Readonly<Record<"trop-court" | "trop-long", MessageService>> = {
  "trop-court": { emoji: "✍️", titre: "Encore un petit effort", texte: `Au moins ${LONGUEUR_MIN_CONTESTATION} caractères, pour qu'on comprenne ce qui cloche.` },
  "trop-long": { emoji: "✂️", titre: "Un peu long", texte: `${MAX_ECRIT} caractères au plus : resserre un peu, on lit tout.` },
};

/**
 * « Contester » la limitation de ton compte, sur le modèle de FeuilleContesterDecision : « Tu n'es pas d'accord ? », un
 * champ de 10 à 1 000 caractères avec son compteur, puis « Contestation envoyée ». Une seule contestation par limitation :
 * un refus du serveur (déjà contestée, plus de limitation, réseau) s'affiche dans la feuille, avec « Réessayer ».
 * VoiceOver est posé sur le titre à l'ouverture, puis sur le message (envoyée ou refus).
 */
export function FeuilleContesterLimitation({ visible, onContester, onFermer }: Props) {
  const couleurs = utiliserCouleurs();
  const [texte, setTexte] = useState("");
  const [etape, setEtape] = useState<Etape>("ecrire");
  const [refus, setRefus] = useState<MessageService | null>(null);
  const refMessage = useRef<View>(null);
  const monte = useRef(true);

  useEffect(() => {
    monte.current = true;
    return () => {
      monte.current = false;
    };
  }, []);

  // Chaque ouverture repart d'une page blanche (dès le premier rendu : rien de la fois d'avant ne s'affiche)
  const [visibleAvant, setVisibleAvant] = useState(visible);
  if (visible !== visibleAvant) {
    setVisibleAvant(visible);
    if (visible) {
      setTexte("");
      setEtape("ecrire");
      setRefus(null);
    }
  }

  // Le contenu change sous le doigt : le lecteur d'écran passe sur le message (envoyée, ou refus)
  useEffect(() => {
    if (!visible || (etape !== "envoyee" && !refus)) return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(refMessage.current), 200);
    return () => clearTimeout(minuterie);
  }, [visible, etape, refus]);

  const tropCourt = texte.trim().length < LONGUEUR_MIN_CONTESTATION;
  const envoyee = etape === "envoyee";
  const enCours = etape === "envoi";

  async function envoyer() {
    if (enCours || tropCourt) return;
    setEtape("envoi");
    setRefus(null);
    const r = await onContester(texte).catch((): ResultatContestationLimitation => "hors-ligne");
    if (!monte.current) return;
    if (r === null) return setEtape("envoyee");
    setEtape("ecrire");
    setRefus(r === "trop-court" || r === "trop-long" ? REFUS_LOCAUX[r] : MESSAGES_SERVICE[r]);
  }

  const pied = envoyee ? (
    <Bouton libelle="Fermer" variante="encre" onPress={onFermer} />
  ) : (
    <>
      {enCours ? (
        // Pas d'état « occupé » (lu en anglais par VoiceOver) : le libellé dit ce qui se passe
        <View accessible accessibilityLabel="Envoi en cours" className="min-h-14 flex-row items-center justify-center gap-3 rounded-full border-2 border-encre bg-nuit">
          <ActivityIndicator color={couleurs.jaune} />
          <Text className="font-texte-gras text-base text-jaune">On envoie…</Text>
        </View>
      ) : (
        <Bouton
          libelle={refus ? "Réessayer" : "Envoyer ma contestation"}
          variante="encre"
          desactive={tropCourt}
          indice={tropCourt ? `Écris d'abord au moins ${LONGUEUR_MIN_CONTESTATION} caractères` : "Une autre personne de l'équipe relit la limitation"}
          onPress={() => void envoyer()}
        />
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Rien n'est envoyé"
        disabled={enCours}
        onPress={() => {
          vibrerLegerement();
          onFermer();
        }}
        className="min-h-12 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
      >
        <Text className="font-texte-gras text-base text-encre">Finalement non</Text>
      </Pressable>
    </>
  );

  return (
    <FeuilleBas
      visible={visible}
      titre={envoyee ? "C'est envoyé 📮" : "Tu n'es pas d'accord ?"}
      sousTitre={envoyee ? undefined : "Explique-nous pourquoi : une autre personne de l'équipe relit tout. Une seule contestation par limitation."}
      onFermer={onFermer}
      pied={pied}
    >
      {envoyee ? (
        <View ref={refMessage} accessible className="gap-1 rounded-2xl border-2 border-encre bg-jaune-clair p-4">
          <Text className="font-texte-semi text-base leading-6 text-encre">
            {lierPonctuation("Contestation envoyée : une autre personne de l'équipe la relit.")}
          </Text>
          <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation("Tu retrouveras sa réponse ici. Merci d'avoir pris le temps de nous écrire.")}</Text>
        </View>
      ) : (
        <View className="gap-4">
          <ChampTexte
            libelle="Pourquoi ?"
            mention={`${LONGUEUR_MIN_CONTESTATION} à ${MAX_ECRIT} caractères`}
            valeur={texte}
            onChangeTexte={setTexte}
            placeholder="Ce qui s'est passé, le contexte, ce qui nous a peut-être échappé…"
            aide={`${texte.length}/${MAX_ECRIT} · Seule l'équipe SOS Miam lit ta contestation.`}
            multiline
            textAlignVertical="top"
            maxLength={LONGUEUR_MAX_CONTESTATION}
            autoCapitalize="sentences"
            editable={!enCours}
          />
          {refus ? (
            <View ref={refMessage} accessible className="flex-row gap-3 rounded-2xl border-2 border-rouge-texte bg-rose-alerte p-3">
              <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl">
                {refus.emoji}
              </Text>
              <View className="flex-1 gap-0.5">
                <Text className="font-texte-gras text-[15px] text-encre">{lierPonctuation(refus.titre)}</Text>
                <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(refus.texte)}</Text>
              </View>
            </View>
          ) : null}
        </View>
      )}
    </FeuilleBas>
  );
}
