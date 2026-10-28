import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { MESSAGES_SERVICE_PAR_LANGUE, type MessageService } from "@sos-miam/commun/contenus/messages-services";
import { LONGUEUR_MAX_CONTESTATION, LONGUEUR_MIN_CONTESTATION } from "@sos-miam/commun/regles/signalement";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { TEXTES_CONTESTATION_PAR_LANGUE } from "~/contenus/textes-contestation";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type ResultatContestation = "trop-court" | "trop-long" | ErreurService | null;

type Props = {
  visible: boolean;
  /** La décision contestée, pour l'envoi */
  decisionId: string | null;
  /** utiliserDecisionsModeration().contester : null quand la contestation est partie */
  onContester: (id: string, texte: string) => Promise<ResultatContestation>;
  /** « Finalement non », « Fermer », fond assombri, retour Android ou geste d'échappement de VoiceOver */
  onFermer: () => void;
};

type Etape = "ecrire" | "envoi" | "envoyee";

/**
 * « Contester » une décision de la modération : « Tu n'es pas d'accord ? », un champ de 10 à 1 000 caractères avec son
 * compteur, puis « Contestation envoyée : une autre personne de l'équipe réexamine. ». Un refus du serveur s'affiche dans
 * la feuille, et « Réessayer ». VoiceOver est posé sur le titre à l'ouverture, puis sur le message (envoyée ou refus).
 */
export function FeuilleContesterDecision({ visible, decisionId, onContester, onFermer }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_CONTESTATION_PAR_LANGUE);
  const messages = utiliserTextes(MESSAGES_SERVICE_PAR_LANGUE);
  /** « 1 000 » : la limite écrite avec son espace fine (sans dépendre d'Intl) */
  const maxEcrit = T.nombre(LONGUEUR_MAX_CONTESTATION);
  /** Les deux refus de l'app elle-même (rien n'est parti) ; le reste vient du serveur */
  const refusLocaux: Readonly<Record<"trop-court" | "trop-long", MessageService>> = {
    "trop-court": { emoji: "✍️", titre: T.tropCourtTitre, texte: T.tropCourt(LONGUEUR_MIN_CONTESTATION) },
    "trop-long": { emoji: "✂️", titre: T.tropLongTitre, texte: T.tropLong(maxEcrit) },
  };
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

  const longueur = texte.trim().length;
  const tropCourt = longueur < LONGUEUR_MIN_CONTESTATION;
  const envoyee = etape === "envoyee";
  const enCours = etape === "envoi";

  async function envoyer() {
    if (!decisionId || enCours || tropCourt) return;
    setEtape("envoi");
    setRefus(null);
    const r = await onContester(decisionId, texte).catch((): ResultatContestation => "hors-ligne");
    if (!monte.current) return;
    if (r === null) return setEtape("envoyee");
    setEtape("ecrire");
    setRefus(r === "trop-court" || r === "trop-long" ? refusLocaux[r] : messages[r]);
  }

  const pied = envoyee ? (
    <Bouton libelle={T.fermer} variante="encre" onPress={onFermer} />
  ) : (
    <>
      {enCours ? (
        // Pas d'état « occupé » (lu en anglais par VoiceOver) : le libellé dit ce qui se passe
        <View accessible accessibilityLabel={T.envoiEnCours} className="min-h-14 flex-row items-center justify-center gap-3 rounded-full border-2 border-encre bg-nuit">
          <ActivityIndicator color={couleurs.jaune} />
          <Text className="font-texte-gras text-base text-jaune">{T.onEnvoie}</Text>
        </View>
      ) : (
        <Bouton
          libelle={refus ? T.reessayer : T.envoyer}
          variante="encre"
          desactive={tropCourt}
          indice={tropCourt ? T.indiceTropCourt(LONGUEUR_MIN_CONTESTATION) : T.indiceDecision}
          onPress={() => void envoyer()}
        />
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityHint={T.rienEnvoye}
        disabled={enCours}
        onPress={() => {
          vibrerLegerement();
          onFermer();
        }}
        className="min-h-12 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
      >
        <Text className="font-texte-gras text-base text-encre">{T.finalementNon}</Text>
      </Pressable>
    </>
  );

  return (
    <FeuilleBas
      visible={visible}
      titre={envoyee ? T.titreEnvoye : T.titre}
      sousTitre={envoyee ? undefined : T.sousTitreDecision}
      onFermer={onFermer}
      pied={pied}
    >
      {envoyee ? (
        <View ref={refMessage} accessible className="gap-1 rounded-2xl border-2 border-encre bg-jaune-clair p-4">
          <Text className="font-texte-semi text-base leading-6 text-encre">
            {lierPonctuation(T.envoyeeDecision)}
          </Text>
          <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(T.suiteDecision)}</Text>
        </View>
      ) : (
        <View className="gap-4">
          <ChampTexte
            libelle={T.pourquoi}
            mention={T.mention(LONGUEUR_MIN_CONTESTATION, maxEcrit)}
            valeur={texte}
            onChangeTexte={setTexte}
            placeholder={T.placeholderDecision}
            aide={T.aide(texte.length, maxEcrit)}
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
